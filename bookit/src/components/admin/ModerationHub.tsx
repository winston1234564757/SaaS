'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ShieldAlert, ShieldCheck, Trash2, Eye, EyeOff, Loader2, MessageSquare, Image as ImageIcon } from 'lucide-react';

interface ReportRecord {
  id: string;
  reporter_phone: string | null;
  target_type: 'review' | 'portfolio_item';
  target_id: string;
  reason: string | null;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
  targetDetails?: any;
}

interface ReviewRecord {
  id: string;
  client_name: string;
  rating: number;
  comment: string | null;
  is_published: boolean;
  created_at: string;
}

interface PortfolioRecord {
  id: string;
  title: string;
  description: string | null;
  is_published: boolean;
  created_at: string;
  portfolio_item_photos?: { url: string }[];
}

export function ModerationHub() {
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'reports' | 'reviews' | 'portfolio'>('reports');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const supabase = createClient();

  const loadData = async () => {
    setLoading(true);
    try {
      const [reportsRes, reviewsRes, portfolioRes] = await Promise.all([
        supabase.from('content_reports').select('*').order('created_at', { ascending: false }),
        supabase.from('reviews').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('portfolio_items').select('*, portfolio_item_photos(url)').order('created_at', { ascending: false }).limit(20)
      ]);

      const reportsData = (reportsRes.data || []) as ReportRecord[];
      
      // Load details for each report target
      const enrichedReports = await Promise.all(
        reportsData.map(async (r) => {
          let targetDetails = null;
          if (r.target_type === 'review') {
            const { data } = await supabase.from('reviews').select('comment, client_name, rating').eq('id', r.target_id).maybeSingle();
            targetDetails = data;
          } else if (r.target_type === 'portfolio_item') {
            const { data } = await supabase.from('portfolio_items').select('title, description, portfolio_item_photos(url)').eq('id', r.target_id).maybeSingle();
            targetDetails = data;
          }
          return { ...r, targetDetails };
        })
      );

      setReports(enrichedReports);
      setReviews((reviewsRes.data as any) || []);
      setPortfolioItems((portfolioRes.data as any) || []);
    } catch (err) {
      console.error('[AdminModeration] Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResolveReport = async (report: ReportRecord, action: 'hide' | 'dismiss') => {
    setActionLoading(report.id);
    try {
      if (action === 'hide') {
        // Hide the content item
        const table = report.target_type === 'review' ? 'reviews' : 'portfolio_items';
        const { error: hideErr } = await supabase
          .from(table)
          .update({ is_published: false })
          .eq('id', report.target_id);

        if (hideErr) throw hideErr;

        // Resolve report
        await supabase.from('content_reports').update({ status: 'resolved' }).eq('id', report.id);
      } else {
        // Dismiss report
        await supabase.from('content_reports').update({ status: 'dismissed' }).eq('id', report.id);
      }

      await loadData();
    } catch (err) {
      console.error('[AdminModeration] Action error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleTogglePublishReview = async (review: ReviewRecord) => {
    setActionLoading(review.id);
    const nextState = !review.is_published;
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ is_published: nextState })
        .eq('id', review.id);

      if (error) throw error;
      setReviews(prev => prev.map(r => r.id === review.id ? { ...r, is_published: nextState } : r));
    } catch (err) {
      console.error('[AdminModeration] Toggle review error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleTogglePublishPortfolio = async (item: PortfolioRecord) => {
    setActionLoading(item.id);
    const nextState = !item.is_published;
    try {
      const { error } = await supabase
        .from('portfolio_items')
        .update({ is_published: nextState })
        .eq('id', item.id);

      if (error) throw error;
      setPortfolioItems(prev => prev.map(p => p.id === item.id ? { ...p, is_published: nextState } : p));
    } catch (err) {
      console.error('[AdminModeration] Toggle portfolio error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 rounded-3xl border border-slate-200/60 bg-white/70 backdrop-blur-md p-3.5 shadow-sm">
        <button
          onClick={() => setActiveTab('reports')}
          className={`rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition active:scale-[0.95] cursor-pointer ${
            activeTab === 'reports'
              ? 'bg-slate-900 text-slate-50'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Скарги ({reports.filter(r => r.status === 'pending').length})
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition active:scale-[0.95] cursor-pointer ${
            activeTab === 'reviews'
              ? 'bg-slate-900 text-slate-50'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Стрічка відгуків
        </button>
        <button
          onClick={() => setActiveTab('portfolio')}
          className={`rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition active:scale-[0.95] cursor-pointer ${
            activeTab === 'portfolio'
              ? 'bg-slate-900 text-slate-50'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Стрічка портфоліо
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : activeTab === 'reports' ? (
        // Reports Queue
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="rounded-3xl border border-slate-200/60 bg-white/70 backdrop-blur-md p-12 text-center text-slate-400">
              Скарг на контент наразі немає. Все чисто!
            </div>
          ) : (
            reports.map((report) => (
              <div
                key={report.id}
                className={`rounded-3xl border p-5 bg-white/70 backdrop-blur-md shadow-sm transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  report.status === 'pending'
                    ? 'border-amber-200/70 bg-amber-50/10'
                    : 'border-slate-200/60 opacity-60'
                }`}
              >
                <div className="space-y-3.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide border ${
                      report.target_type === 'review'
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                        : 'bg-amber-50 border-amber-200 text-amber-700'
                    }`}>
                      {report.target_type === 'review' ? 'Відгук' : 'Портфоліо'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Скаржник: {report.reporter_phone || 'Анонім'}
                    </span>
                    <span className={`text-[10px] font-bold ${
                      report.status === 'pending' ? 'text-amber-600' : 'text-slate-400'
                    }`}>
                      • {report.status}
                    </span>
                  </div>

                  {report.reason && (
                    <div className="text-xs text-amber-950 font-medium">
                      Причина скарги: <span className="font-normal italic">"{report.reason}"</span>
                    </div>
                  )}

                  {/* Target Details Preview */}
                  {report.targetDetails ? (
                    <div className="rounded-2xl bg-white border border-slate-100 p-4 text-xs space-y-2">
                      {report.target_type === 'review' ? (
                        <>
                          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-900">
                            <span>{report.targetDetails.client_name}</span>
                            <span className="text-amber-500">{'★'.repeat(report.targetDetails.rating)}</span>
                          </div>
                          <p className="text-slate-600 italic">"{report.targetDetails.comment || 'Без коментаря'}"</p>
                        </>
                      ) : (
                        <>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <ImageIcon className="h-3.5 w-3.5 text-slate-400" />
                            {report.targetDetails.title}
                          </div>
                          {report.targetDetails.description && (
                            <p className="text-slate-600">"{report.targetDetails.description}"</p>
                          )}
                          {report.targetDetails.portfolio_item_photos?.[0]?.url && (
                            <div className="mt-2 h-20 w-20 overflow-hidden rounded-lg border border-slate-100">
                              <img
                                src={report.targetDetails.portfolio_item_photos[0].url}
                                alt="Work preview"
                                className="h-full w-full object-cover"
                              />
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-red-500 italic">Цільовий об'єкт видалено або недоступний</div>
                  )}
                </div>

                {report.status === 'pending' && (
                  <div className="flex gap-2 shrink-0 justify-end md:self-center">
                    <button
                      onClick={() => handleResolveReport(report, 'dismiss')}
                      disabled={!!actionLoading}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition active:scale-[0.95] cursor-pointer"
                    >
                      Відхилити
                    </button>
                    <button
                      onClick={() => handleResolveReport(report, 'hide')}
                      disabled={!!actionLoading}
                      className="flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-slate-50 hover:bg-slate-800 transition active:scale-[0.95] cursor-pointer"
                    >
                      Приховати контент
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ) : activeTab === 'reviews' ? (
        // Reviews list
        <div className="space-y-3">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-3xl border border-slate-200/60 bg-white/70 backdrop-blur-md p-5 shadow-sm flex items-center justify-between gap-4 transition hover:shadow-md"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-900 text-sm">{review.client_name}</span>
                  <span className="text-amber-500 text-xs">{'★'.repeat(review.rating)}</span>
                  <span className="text-[10px] text-slate-400">
                    • {new Date(review.created_at).toLocaleDateString('uk-UA')}
                  </span>
                </div>
                <p className="text-xs text-slate-600 italic">"{review.comment || 'Без текстового коментаря'}"</p>
              </div>

              <button
                onClick={() => handleTogglePublishReview(review)}
                disabled={!!actionLoading}
                className={`flex h-8 w-8 items-center justify-center rounded-full border transition active:scale-[0.90] cursor-pointer ${
                  review.is_published
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100/50'
                    : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                }`}
              >
                {review.is_published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
            </div>
          ))}
        </div>
      ) : (
        // Portfolio items list
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {portfolioItems.map((item) => (
            <div
              key={item.id}
              className="rounded-3xl border border-slate-200/60 bg-white/70 backdrop-blur-md p-4 shadow-sm flex gap-4 transition hover:shadow-md justify-between items-start"
            >
              <div className="flex gap-4">
                {item.portfolio_item_photos?.[0]?.url ? (
                  <div className="h-16 w-16 overflow-hidden rounded-2xl border border-slate-100 shrink-0">
                    <img src={item.portfolio_item_photos[0].url} alt="work" className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="h-16 w-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 shrink-0 border border-slate-100">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                )}
                <div className="space-y-1 min-w-0">
                  <h4 className="font-semibold text-slate-900 text-sm truncate">{item.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2">{item.description || 'Немає опису'}</p>
                </div>
              </div>

              <button
                onClick={() => handleTogglePublishPortfolio(item)}
                disabled={!!actionLoading}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition active:scale-[0.90] cursor-pointer ${
                  item.is_published
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100/50'
                    : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                }`}
              >
                {item.is_published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
