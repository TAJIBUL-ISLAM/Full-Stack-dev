import { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase, type Listing, type Offer, type Transaction, type Dispute } from '@/lib/supabase';
import { ListingCard } from '@/components/ListingCard';
import {
  Package,
  Tag,
  ArrowLeftRight,
  ShieldAlert,
  Plus,
  Check,
  X,
  Clock,
  AlertCircle,
  Trash2,
  DollarSign,
  Leaf,
} from 'lucide-react';

type Tab = 'listings' | 'offers' | 'transactions' | 'disputes';

export function DashboardPage() {
  const { user, profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const tab = (searchParams.get('tab') as Tab) ?? 'listings';

  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [receivedOffers, setReceivedOffers] = useState<Offer[]>([]);
  const [sentOffers, setSentOffers] = useState<Offer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const setTab = (t: Tab) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', t);
    setSearchParams(next);
  };

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      supabase
        .from('listings')
        .select(`
          *,
          profiles:seller_id (id, username, full_name, avatar_url, is_verified, rating),
          listing_images (id, url, position)
        `)
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('offers')
        .select(`
          *,
          listings:listing_id (id, title, price, status),
          buyer:buyer_id (id, username, avatar_url, is_verified),
          seller:seller_id (id, username, avatar_url, is_verified)
        `)
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('offers')
        .select(`
          *,
          listings:listing_id (id, title, price, status),
          seller:seller_id (id, username, avatar_url, is_verified)
        `)
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('transactions')
        .select(`
          *,
          listings:listing_id (id, title, price),
          buyer:buyer_id (id, username, avatar_url),
          seller:seller_id (id, username, avatar_url)
        `)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('created_at', { ascending: false }),
      supabase
        .from('disputes')
        .select(`
          *,
          transactions:transaction_id (id, amount, status, listings:listing_id (id, title)),
          profiles:raised_by (id, username)
        `)
        .or(`raised_by.eq.${user.id}`)
        .order('created_at', { ascending: false }),
    ]).then(([l, ro, so, t, d]) => {
      setMyListings((l.data as Listing[]) ?? []);
      setReceivedOffers((ro.data as Offer[]) ?? []);
      setSentOffers((so.data as Offer[]) ?? []);
      setTransactions((t.data as Transaction[]) ?? []);
      setDisputes((d.data as Dispute[]) ?? []);
      setLoading(false);
    });
  }, [user]);

  const respondToOffer = async (offerId: string, status: 'accepted' | 'declined') => {
    setActionLoading(offerId);
    await supabase.from('offers').update({ status, updated_at: new Date().toISOString() }).eq('id', offerId);
    if (status === 'accepted') {
      const offer = receivedOffers.find((o) => o.id === offerId);
      if (offer) {
        await supabase.from('listings').update({ status: 'reserved' }).eq('id', offer.listing_id);
        await supabase.from('transactions').insert({
          listing_id: offer.listing_id,
          buyer_id: offer.buyer_id,
          seller_id: offer.seller_id,
          amount: offer.amount,
          platform_fee: Number(offer.amount) * 0.05,
          status: 'escrow',
        });
      }
    }
    setActionLoading(null);
    // refresh
    if (user) {
      const { data } = await supabase
        .from('offers')
        .select(`*, listings:listing_id (id, title, price, status), buyer:buyer_id (id, username, avatar_url, is_verified), seller:seller_id (id, username, avatar_url, is_verified)`)
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });
      setReceivedOffers((data as Offer[]) ?? []);
    }
  };

  const confirmReceipt = async (txId: string) => {
    setActionLoading(txId);
    await supabase
      .from('transactions')
      .update({ status: 'released', buyer_confirmed_at: new Date().toISOString(), payout_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', txId);
    const tx = transactions.find((t) => t.id === txId);
    if (tx) {
      await supabase.from('listings').update({ status: 'sold' }).eq('id', tx.listing_id);
      await supabase.rpc('finalize_sale', { tx_id: txId });
    }
    setActionLoading(null);
    // refresh
    if (user) {
      const { data } = await supabase
        .from('transactions')
        .select(`*, listings:listing_id (id, title, price), buyer:buyer_id (id, username, avatar_url), seller:seller_id (id, username, avatar_url)`)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      setTransactions((data as Transaction[]) ?? []);
    }
  };

  const openDispute = async (txId: string) => {
    const reason = window.prompt('What is the reason for your dispute? (e.g. Item not as described, Item not received, Other)');
    if (!reason) return;
    const description = window.prompt('Please describe the issue in detail:') ?? '';
    await supabase.from('disputes').insert({
      transaction_id: txId,
      raised_by: user!.id,
      reason,
      description,
      status: 'open',
    });
    await supabase.from('transactions').update({ status: 'disputed', updated_at: new Date().toISOString() }).eq('id', txId);
    // refresh
    if (user) {
      const [d, t] = await Promise.all([
        supabase.from('disputes').select(`*, transactions:transaction_id (id, amount, status, listings:listing_id (id, title)), profiles:raised_by (id, username)`).or(`raised_by.eq.${user.id}`).order('created_at', { ascending: false }),
        supabase.from('transactions').select(`*, listings:listing_id (id, title, price), buyer:buyer_id (id, username, avatar_url), seller:seller_id (id, username, avatar_url)`).or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`).order('created_at', { ascending: false }),
      ]);
      setDisputes((d.data as Dispute[]) ?? []);
      setTransactions((t.data as Transaction[]) ?? []);
    }
  };

  const deleteListing = async (listingId: string) => {
    if (!confirm('Remove this listing? This cannot be undone.')) return;
    await supabase.from('listings').update({ status: 'removed' }).eq('id', listingId);
    setMyListings((prev) => prev.filter((l) => l.id !== listingId));
  };

  const stats = [
    { label: 'Active listings', value: myListings.filter((l) => l.status === 'active').length, icon: Package, color: 'emerald' },
    { label: 'Pending offers', value: receivedOffers.filter((o) => o.status === 'pending').length, icon: Tag, color: 'amber' },
    { label: 'In escrow', value: transactions.filter((t) => t.status === 'escrow').length, icon: ArrowLeftRight, color: 'blue' },
    { label: 'Open disputes', value: disputes.filter((d) => d.status === 'open' || d.status === 'investigating').length, icon: ShieldAlert, color: 'red' },
  ];

  const tabs = [
    { id: 'listings' as Tab, label: 'My listings', icon: Package, count: myListings.length },
    { id: 'offers' as Tab, label: 'Offers', icon: Tag, count: receivedOffers.length + sentOffers.length },
    { id: 'transactions' as Tab, label: 'Transactions', icon: ArrowLeftRight, count: transactions.length },
    { id: 'disputes' as Tab, label: 'Disputes', icon: ShieldAlert, count: disputes.length },
  ];

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Dashboard</h1>
            <p className="text-sm text-stone-500 mt-1">Welcome back, {profile?.username ?? 'seller'}</p>
          </div>
          <Link to="/sell" className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-full hover:bg-emerald-700">
            <Plus className="w-4 h-4" /> New listing
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-stone-200 p-4">
              <div className="flex items-center justify-between">
                <s.icon className={`w-5 h-5 text-${s.color}-600`} />
                <span className="text-2xl font-bold text-stone-900">{s.value}</span>
              </div>
              <p className="text-xs text-stone-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl border border-stone-200 p-1 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${tab === t.id ? 'bg-emerald-600 text-white' : 'text-stone-600 hover:bg-stone-100'}`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.id ? 'bg-white/20' : 'bg-stone-100'}`}>{t.count}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* My Listings */}
            {tab === 'listings' && (
              <div>
                {myListings.length === 0 ? (
                  <EmptyState icon={Package} title="No listings yet" subtitle="Start selling by creating your first listing." cta={{ label: 'Create listing', to: '/sell' }} />
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {myListings.map((l) => (
                      <div key={l.id} className="relative group">
                        <ListingCard listing={l} />
                        {l.status !== 'sold' && (
                          <button
                            onClick={() => deleteListing(l.id)}
                            className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-50 text-stone-500 hover:text-red-500 shadow-sm transition-all"
                            title="Remove listing"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Offers */}
            {tab === 'offers' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-stone-700 mb-3 uppercase tracking-wide">Received offers ({receivedOffers.length})</h3>
                  {receivedOffers.length === 0 ? (
                    <p className="text-sm text-stone-500 py-6 text-center bg-white rounded-xl border border-dashed border-stone-300">No offers received yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {receivedOffers.map((o) => (
                        <div key={o.id} className="bg-white rounded-xl border border-stone-200 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                          <div className="flex-1">
                            <Link to={`/listing/${o.listing_id}`} className="font-semibold text-stone-900 hover:text-emerald-700">{o.listings?.title}</Link>
                            <div className="flex items-center gap-2 mt-1 text-sm text-stone-500">
                              <span>Offer from <strong className="text-stone-700">{o.buyer?.username ?? 'Buyer'}</strong></span>
                              <span>•</span>
                              <span>Listed ${Number(o.listings?.price ?? 0).toFixed(2)}</span>
                            </div>
                            {o.message && <p className="text-sm text-stone-600 mt-2 italic">"{o.message}"</p>}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold text-emerald-700">${Number(o.amount).toFixed(2)}</span>
                            {o.status === 'pending' ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => respondToOffer(o.id, 'accepted')}
                                  disabled={actionLoading === o.id}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-full hover:bg-emerald-700 disabled:opacity-60"
                                >
                                  <Check className="w-3.5 h-3.5" /> Accept
                                </button>
                                <button
                                  onClick={() => respondToOffer(o.id, 'declined')}
                                  disabled={actionLoading === o.id}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-stone-300 text-stone-600 text-xs font-semibold rounded-full hover:bg-stone-50 disabled:opacity-60"
                                >
                                  <X className="w-3.5 h-3.5" /> Decline
                                </button>
                              </div>
                            ) : (
                              <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${o.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' : o.status === 'declined' ? 'bg-red-100 text-red-700' : 'bg-stone-100 text-stone-600'}`}>
                                {o.status}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-stone-700 mb-3 uppercase tracking-wide">Sent offers ({sentOffers.length})</h3>
                  {sentOffers.length === 0 ? (
                    <p className="text-sm text-stone-500 py-6 text-center bg-white rounded-xl border border-dashed border-stone-300">You haven't made any offers yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {sentOffers.map((o) => (
                        <div key={o.id} className="bg-white rounded-xl border border-stone-200 p-4 flex items-center gap-3">
                          <div className="flex-1">
                            <Link to={`/listing/${o.listing_id}`} className="font-semibold text-stone-900 hover:text-emerald-700">{o.listings?.title}</Link>
                            <p className="text-sm text-stone-500 mt-0.5">To {o.seller?.username ?? 'Seller'} • Listed ${Number(o.listings?.price ?? 0).toFixed(2)}</p>
                          </div>
                          <span className="text-lg font-bold text-emerald-700">${Number(o.amount).toFixed(2)}</span>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${o.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' : o.status === 'declined' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                            {o.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Transactions */}
            {tab === 'transactions' && (
              <div>
                {transactions.length === 0 ? (
                  <EmptyState icon={ArrowLeftRight} title="No transactions yet" subtitle="When an offer is accepted, the transaction will appear here." />
                ) : (
                  <div className="space-y-3">
                    {transactions.map((t) => (
                      <div key={t.id} className="bg-white rounded-xl border border-stone-200 p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <div className="flex-1">
                            <Link to={`/listing/${t.listing_id}`} className="font-semibold text-stone-900 hover:text-emerald-700">{t.listings?.title}</Link>
                            <p className="text-sm text-stone-500 mt-0.5">
                              {t.buyer_id === user?.id ? 'Bought from' : 'Sold to'} <strong className="text-stone-700">{t.buyer_id === user?.id ? t.seller?.username : t.buyer?.username}</strong>
                            </p>
                            <p className="text-xs text-stone-400 mt-0.5">{new Date(t.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-lg font-bold text-stone-900">${Number(t.amount).toFixed(2)}</p>
                              <p className="text-xs text-stone-400">Fee ${Number(t.platform_fee).toFixed(2)}</p>
                            </div>
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${
                              t.status === 'released' ? 'bg-emerald-100 text-emerald-700' :
                              t.status === 'escrow' ? 'bg-amber-100 text-amber-700' :
                              t.status === 'disputed' ? 'bg-red-100 text-red-700' :
                              'bg-stone-100 text-stone-600'
                            }`}>{t.status}</span>
                          </div>
                        </div>
                        {t.status === 'escrow' && t.buyer_id === user?.id && (
                          <div className="mt-3 pt-3 border-t border-stone-100 flex flex-wrap gap-2">
                            <button
                              onClick={() => confirmReceipt(t.id)}
                              disabled={actionLoading === t.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-full hover:bg-emerald-700 disabled:opacity-60"
                            >
                              <Check className="w-3.5 h-3.5" /> Confirm receipt & release payment
                            </button>
                            <button
                              onClick={() => openDispute(t.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-300 text-stone-600 text-xs font-semibold rounded-full hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                            >
                              <ShieldAlert className="w-3.5 h-3.5" /> Open dispute
                            </button>
                          </div>
                        )}
                        {t.status === 'escrow' && t.seller_id === user?.id && (
                          <p className="mt-3 pt-3 border-t border-stone-100 text-xs text-stone-500 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" /> Waiting for buyer to confirm receipt. Funds in escrow.
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Disputes */}
            {tab === 'disputes' && (
              <div>
                {disputes.length === 0 ? (
                  <EmptyState icon={ShieldAlert} title="No disputes" subtitle="Disputes you raise on transactions will be tracked here." />
                ) : (
                  <div className="space-y-3">
                    {disputes.map((d) => (
                      <div key={d.id} className="bg-white rounded-xl border border-stone-200 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="font-semibold text-stone-900">{d.reason}</p>
                            <p className="text-sm text-stone-600 mt-1">{d.description}</p>
                            <p className="text-xs text-stone-400 mt-2">
                              Transaction #{d.transaction_id.slice(0, 8)} • {d.transactions?.listings?.title ?? 'Item'}
                            </p>
                          </div>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${
                            d.status === 'open' ? 'bg-amber-100 text-amber-700' :
                            d.status === 'investigating' ? 'bg-blue-100 text-blue-700' :
                            d.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-stone-100 text-stone-600'
                          }`}>{d.status}</span>
                        </div>
                        {d.resolution && (
                          <div className="mt-3 pt-3 border-t border-stone-100 text-sm">
                            <p className="text-stone-500">Resolution:</p>
                            <p className="text-stone-700 mt-0.5">{d.resolution}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, subtitle, cta }: { icon: any; title: string; subtitle: string; cta?: { label: string; to: string } }) {
  return (
    <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-stone-300">
      <Icon className="w-12 h-12 text-stone-300 mx-auto mb-3" />
      <p className="text-stone-600 font-medium">{title}</p>
      <p className="text-sm text-stone-400 mt-1">{subtitle}</p>
      {cta && (
        <Link to={cta.to} className="inline-block mt-4 px-4 py-2 bg-emerald-600 text-white text-sm rounded-full hover:bg-emerald-700">
          {cta.label}
        </Link>
      )}
    </div>
  );
}
