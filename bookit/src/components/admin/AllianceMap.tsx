'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { GitMerge, Loader2, ChevronDown, ChevronRight, User, Award } from 'lucide-react';

interface AllianceNode {
  id: string;
  name: string;
  slug: string;
  tier: string;
  children: AllianceNode[];
}

interface FlatRelation {
  id: string;
  inviterName: string;
  inviteeName: string;
  status: string;
  createdAt: string;
}

export function AllianceMap() {
  const [nodes, setNodes] = useState<AllianceNode[]>([]);
  const [flatList, setFlatList] = useState<FlatRelation[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'tree' | 'table'>('tree');
  
  const supabase = createClient();

interface ProfileDetails {
  full_name: string;
}

interface MasterProfileQuery {
  id: string;
  slug: string;
  business_name: string | null;
  subscription_tier: string;
  profiles: ProfileDetails | ProfileDetails[] | null;
}

interface AllianceRelation {
  inviter_id: string;
  invitee_id: string;
}

interface ReferralRelation {
  referrer_id: string;
  referee_id: string;
  status: string;
  created_at: string;
}

interface ProfileMapItem {
  name: string;
  slug: string;
  tier: string;
}

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [alliancesRes, profilesRes, referralsRes] = await Promise.all([
          supabase.from('master_alliances').select('inviter_id, invitee_id'),
          supabase.from('master_profiles').select(`
            id, slug, business_name, subscription_tier,
            profiles:profiles!master_profiles_id_fkey ( full_name )
          `),
          supabase.from('master_referrals').select('referrer_id, referee_id, status, created_at')
        ]);

        if (alliancesRes.error) throw alliancesRes.error;
        
        const alliances = (alliancesRes.data as unknown as AllianceRelation[]) || [];
        const profilesMap = new Map<string, ProfileMapItem>();
        const profilesData = (profilesRes.data as unknown as MasterProfileQuery[]) || [];
        
        profilesData.forEach(p => {
          const fullName = Array.isArray(p.profiles)
            ? p.profiles[0]?.full_name
            : p.profiles?.full_name;

          profilesMap.set(p.id, {
            name: p.business_name || fullName || 'Без імені',
            slug: p.slug,
            tier: p.subscription_tier
          });
        });

        const invitedIds = new Set(alliances.map(a => a.invitee_id));
        const allMasterIds = new Set([
          ...alliances.map(a => a.inviter_id),
          ...alliances.map(a => a.invitee_id)
        ]);

        const roots: AllianceNode[] = [];
        
        const buildTree = (masterId: string): AllianceNode => {
          const profile = profilesMap.get(masterId) || { name: 'Невідомий майстер', slug: '', tier: 'starter' };
          const childrenIds = alliances.filter(a => a.inviter_id === masterId).map(a => a.invitee_id);
          return {
            id: masterId,
            name: profile.name,
            slug: profile.slug,
            tier: profile.tier,
            children: childrenIds.map(buildTree)
          };
        };

        allMasterIds.forEach(id => {
          if (!invitedIds.has(id)) {
            roots.push(buildTree(id));
          }
        });

        setNodes(roots);

        const referrals = (referralsRes.data as unknown as ReferralRelation[]) || [];
        const flat: FlatRelation[] = referrals.map(r => {
          const inviter = profilesMap.get(r.referrer_id)?.name || 'Невідомий';
          const invitee = profilesMap.get(r.referee_id)?.name || 'Невідомий';
          return {
            id: `${r.referrer_id}-${r.referee_id}`,
            inviterName: inviter,
            inviteeName: invitee,
            status: r.status,
            createdAt: new Date(r.created_at).toLocaleDateString('uk-UA')
          };
        });
        setFlatList(flat);

      } catch (err) {
        console.error('[AdminAlliances] Load error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Switcher Bar */}
      <div className="flex gap-2 justify-end rounded-3xl border border-slate-200/60 bg-white/70 backdrop-blur-md p-3.5 shadow-sm">
        <button
          onClick={() => setViewMode('tree')}
          className={`rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition active:scale-[0.95] cursor-pointer ${
            viewMode === 'tree'
              ? 'bg-slate-900 text-slate-50'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Ієрархічне дерево
        </button>
        <button
          onClick={() => setViewMode('table')}
          className={`rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition active:scale-[0.95] cursor-pointer ${
            viewMode === 'table'
              ? 'bg-slate-900 text-slate-50'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Таблиця зв'язків
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : viewMode === 'tree' ? (
        <div className="rounded-3xl border border-slate-200/60 bg-white/70 backdrop-blur-md p-6 shadow-sm overflow-x-auto min-h-[400px]">
          <div className="space-y-4 max-w-lg">
            {nodes.map(node => (
              <TreeNodeItem key={node.id} node={node} level={0} />
            ))}
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white/70 backdrop-blur-md shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Хто запросив (Inviter)</th>
                  <th className="px-6 py-4">Кого запрошено (Referee)</th>
                  <th className="px-6 py-4">Статус оплат</th>
                  <th className="px-6 py-4">Дата запрошення</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {flatList.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 font-semibold text-slate-900">{r.inviterName}</td>
                    <td className="px-6 py-4 font-semibold text-indigo-600">{r.inviteeName}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide border ${
                        r.status === 'activated'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : r.status === 'registered'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-50 text-slate-500 border-slate-200'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">{r.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function TreeNodeItem({ node, level }: { node: AllianceNode; level: number }) {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = node.children.length > 0;

  return (
    <div className="relative pl-6">
      {level > 0 && (
        <div 
          className="absolute left-1.5 top-0 w-4.5 border-t border-slate-300"
          style={{ height: '24px', top: '16px' }}
        />
      )}
      {level > 0 && (
        <div 
          className="absolute left-1.5 top-0 border-l border-slate-300"
          style={{ bottom: hasChildren && isOpen ? '0px' : 'calc(100% - 16px)', height: '100%' }}
        />
      )}

      <div className="flex items-center gap-2 py-1.5 group">
        {hasChildren ? (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer active:scale-[0.90] transition"
          >
            {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
        ) : (
          <div className="flex h-5 w-5 shrink-0 items-center justify-center text-slate-300">
            <User className="h-3.5 w-3.5" />
          </div>
        )}

        <div className="flex items-center gap-2 rounded-full bg-white border border-slate-200 px-3.5 py-1 shadow-sm group-hover:border-slate-400 transition">
          <span className="text-xs font-semibold text-slate-900">{node.name}</span>
          <span className="text-[10px] text-indigo-600 font-mono">@{node.slug}</span>
          <span className={`text-[9px] font-bold uppercase rounded px-1.5 border ${
            node.tier === 'studio'
              ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
              : node.tier === 'pro'
              ? 'bg-amber-50 border-amber-200 text-amber-700'
              : 'bg-slate-50 border-slate-200 text-slate-500'
          }`}>
            {node.tier}
          </span>
          {hasChildren && (
            <span className="flex items-center gap-0.5 text-[9px] font-bold bg-slate-100 text-slate-600 rounded px-1.5">
              <Award className="h-2.5 w-2.5" />
              {node.children.length}
            </span>
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {hasChildren && isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden space-y-1"
          >
            {node.children.map(child => (
              <TreeNodeItem key={child.id} node={child} level={level + 1} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
