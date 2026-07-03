import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');
const CLEAN = process.argv.includes('--clean');
const SLUG = 'viktor-koshel';
const SENTINEL_PHONE = '+380000000777';
const SENTINEL_TAG = '[SEED]';

// Target booked HOURS per weekday → ascending 10→100% gradient (Sun = day off)
const TARGET_H = { mon: 1, tue: 2, wed: 5, thu: 5, fri: 7, sat: 9 };
const DOW = ['sun','mon','tue','wed','thu','fri','sat'];

const raw = readFileSync('.env.local','utf8');
const env = {};
for (const line of raw.split(/\r?\n/)) { const t=line.trim(); if(!t||t.startsWith('#')||!t.includes('='))continue; const i=t.indexOf('='); let v=t.slice(i+1).trim(); if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1); env[t.slice(0,i).trim()]=v; }
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const toMin = t => { const [h,m]=t.slice(0,5).split(':').map(Number); return h*60+m; };
const toHHMM = m => `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;

const { data: m } = await sb.from('master_profiles').select('id, business_name, slug').eq('slug', SLUG).single();
if (!m) { console.error('master not found'); process.exit(1); }
console.log(`Master: ${m.business_name} (${m.slug}) id=${m.id}`);

// clean sentinel bookings first (idempotent + --clean)
const { data: old } = await sb.from('bookings').select('id').eq('master_id', m.id).eq('client_phone', SENTINEL_PHONE);
console.log(`Existing SEED bookings: ${old?.length||0}`);
if (CLEAN || APPLY) {
  if (old?.length) {
    const ids = old.map(o=>o.id);
    await sb.from('booking_services').delete().in('booking_id', ids);
    await sb.from('bookings').delete().in('id', ids);
    console.log(`Deleted ${ids.length} prior SEED bookings.`);
  }
  if (CLEAN) { console.log('CLEAN done.'); process.exit(0); }
}

const { data: services } = await sb.from('services').select('id, name, price, duration_minutes').eq('master_id', m.id).eq('is_active', true).limit(1);
const svc = services?.[0];
const { data: tpls } = await sb.from('schedule_templates').select('day_of_week,is_working,start_time,end_time,break_start,break_end').eq('master_id', m.id);
const tplByDow = {}; for (const t of (tpls||[])) tplByDow[t.day_of_week]=t;

const today = new Date();
const monthEnd = new Date(today); monthEnd.setDate(today.getDate()+30);
const fmt = d => d.toISOString().split('T')[0];
const { data: exceptions } = await sb.from('schedule_exceptions').select('date,is_day_off,start_time,end_time').eq('master_id', m.id).gte('date', fmt(today)).lte('date', fmt(monthEnd));
const excByDate = {}; for (const e of (exceptions||[])) excByDate[e.date]=e;

// build seed bookings across next 30 days
const toInsert = [];
for (let i=0;i<30;i++){
  const d = new Date(today); d.setDate(today.getDate()+i);
  const dateStr = fmt(d);
  const dow = DOW[d.getDay()];
  const exc = excByDate[dateStr];
  const tpl = tplByDow[dow];
  let working=false, start='09:00', end='18:00', bs=null, be=null;
  if (exc) { working = !exc.is_day_off; if(working){ start=exc.start_time||'09:00'; end=exc.end_time||'18:00'; } }
  else if (tpl) { working = tpl.is_working!==false; if(working){ start=tpl.start_time||'09:00'; end=tpl.end_time||'18:00'; bs=tpl.break_start; be=tpl.break_end; } }
  if (!working) continue;
  const targetH = TARGET_H[dow]; if(!targetH) continue;
  const startMin = toMin(start), endMin = toMin(end);
  const wantMin = Math.min(targetH*60, endMin-startMin);
  // place booking from start; if break inside [start, start+wantMin), push end past break
  let bStart = startMin, bEnd = startMin + wantMin;
  if (bs && be) { const bsM=toMin(bs), beM=toMin(be); if (bStart < beM && bEnd > bsM) { bEnd += (beM-bsM); } }
  bEnd = Math.min(bEnd, endMin);
  toInsert.push({ master_id:m.id, client_name:`${SENTINEL_TAG} ${dow} ${targetH}h`, client_phone:SENTINEL_PHONE, date:dateStr, start_time:toHHMM(bStart), end_time:toHHMM(bEnd), total_price: svc?.price||500, status:'confirmed' });
}

console.log(`\nPlan: ${toInsert.length} bookings (${APPLY?'APPLYING':'DRY-RUN'}):`);
const byDow={}; for(const b of toInsert){const dw=b.client_name.split(' ')[1]; byDow[dw]=(byDow[dw]||0)+1;}
console.log('Per-DOW occurrences:', byDow);

if (APPLY && toInsert.length) {
  const { data: ins, error } = await sb.from('bookings').insert(toInsert).select('id, client_name');
  if (error) { console.error('INSERT ERROR:', error); process.exit(1); }
  const bsRows = ins.map(b=>({ booking_id:b.id, service_id:svc.id, service_name:svc.name, service_price:svc.price, duration_minutes:svc.duration_minutes||60 }));
  const { error: e2 } = await sb.from('booking_services').insert(bsRows);
  if (e2) console.error('booking_services error:', e2);
  console.log(`Inserted ${ins.length} bookings + booking_services.`);
}

// ── Recompute occupancy exactly like useBusyness + ScheduleWidget.dayOccupancy ──
const { data: allBk } = await sb.from('bookings').select('date,status,start_time,end_time').eq('master_id', m.id).gte('date', fmt(today)).lte('date', fmt(monthEnd)).neq('status','cancelled');
const bkByDate={}; for(const b of (allBk||[])){ (bkByDate[b.date]=bkByDate[b.date]||[]).push(b); }
const days=[];
for(let i=0;i<30;i++){ const d=new Date(today); d.setDate(today.getDate()+i); const dateStr=fmt(d); const dow=DOW[d.getDay()]; const exc=excByDate[dateStr]; const tpl=tplByDow[dow];
  let working=false,start='09:00',end='18:00',bs=null,be=null;
  if(exc){working=!exc.is_day_off; if(working){start=exc.start_time||'09:00';end=exc.end_time||'18:00';}}
  else if(tpl){working=tpl.is_working!==false; if(working){start=tpl.start_time||'09:00';end=tpl.end_time||'18:00';bs=tpl.break_start;be=tpl.break_end;}}
  if(!working) continue;
  const workDur=toMin(end)-toMin(start); let brk=0; if(bs&&be) brk=toMin(be)-toMin(bs);
  const twm=Math.max(0,workDur-brk); if(twm<=0) continue;
  let bm=0; for(const b of (bkByDate[dateStr]||[])){ if(b.start_time&&b.end_time) bm+=Math.max(0,toMin(b.end_time)-toMin(b.start_time)); }
  const total=Math.max(1,Math.round(twm/60)); const booked=Math.min(total,Math.round(bm/60));
  days.push({dateStr,dow,total,booked});
}
const grp={}; for(const d of days){ (grp[d.dow]=grp[d.dow]||{total:0,booked:0}); grp[d.dow].total+=d.total; grp[d.dow].booked+=d.booked; }
console.log('\nProjected occupancy per weekday (widget strip):');
for(const dw of ['mon','tue','wed','thu','fri','sat','sun']){ const g=grp[dw]; const pct=g&&g.total>0?Math.min(100,Math.round(g.booked/g.total*100)):0; console.log(`  ${dw}: ${g?pct+'%':'вихідний (0%)'} ${g?`(${g.booked}/${g.total}h over ${days.filter(d=>d.dow===dw).length} days)`:''}`); }
