import { useEffect, useState } from 'react';
import { supabase, type Listing, type Transaction, type Dispute, type Profile } from '@/lib/supabase';
import {
  Shield,
  Users,
  Package,
  DollarSign,
  ShieldAlert,
  Check,
  X,
  TrendingUp,
  Leaf,
  BadgeCheck,
} from 'lucide-react';

export function AdminPage() {
  const [stats, setStats] = useState({ users: 0, listings: 0, transactions: 0, revenue: 0, disputes: 0, carbon: 0 });
  const [recentListings, setRecentListings] = useState<Listing[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [tab, setTab] = useState<'overview' | 'listings' | 'transactions' | 'disputes' | 'users'>('overview');

  useEffect(() => {
    Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('listings').select('*, profiles:seller_id (id, username, avatar_url), listing_images (id, url, position)').order('created_at', { ascending: false }).limit(50),
      supabase.from('transactions').select('*, listings:listing_id (id, title), buyer:buyer_id (id, username), seller:seller_id (id, username)').order('created_at', { ascending: false }).limit(50),
      supabase.from('disputes').select('*, transactions:transaction_id (id, amount, listings:listing_id (id, title)), profiles:raised_by (id, username)').order('created_at', { ascending: false }),
    ]).then(([u, l, t, d]) => {
      const userList = (u.data as Profile[]) ?? [];
      const listingList = (l.data as Listing[]) ?? [];
      const txList = (t.data as Transaction[]) ?? [];
      const disputeList = (d.data as Dispute[]) ?? [];

      setUsers(userList);
      setRecentListings(listingList);
      setTransactions(txList);
      setDisputes(disputeList);

      setStats({
        users: userList.length,
        listings: listingList.length,
        transactions: txList.length,
        revenue: txList.reduce((sum, tx) => sum + Number(tx.platform_fee ?? 0), 0),
        disputes: disputeList.filter((x) => x.status === 'open' || x.status === 'investigating').length,
        carbon: userList.reduce((sum, p) => sum + Number(p.carbon_saved_kg ?? 0), 0),
      });
      setLoading(false);
    });
  }, []);

  const toggleVerify = async (userId: string, current: boolean) => {
    setActionLoading(userId);
    await supabase.from('profiles').update({ is_verified: !current, updated_at: new Date().toISOString() }).eq('id', userId);
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, is_verified: !current } : u)));
    setActionLoading(null);
  };

  const resolveDispute = async (disputeId: string, status: 'resolved' | 'closed') => {
    const resolution = window.prompt('Enter a resolution note:') ?? '';
    const refund = status === 'resolved' ? Number(window.prompt('Refund amount (0 for none):') ?? '0') : 0;
    setActionLoading(disputeId);
    await supabase.from('disputes').update({
      status,
      resolution,
      refund_amount: refund || null,
      resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', disputeId);
    setDisputes((prev) => prev.map((d) => (d.id === disputeId ? { ...d, status, resolution, refund_amount: refund || null } : d)));
    setActionLoading(null);
  };

  const removeListing = async (listingId: string) => {
    if (!confirm('Remove this listing from the marketplace?')) return;
    setActionLoading(listingId);
    await supabase.from('listings').update({ status: 'removed' }).eq('id', listingId);
    setRecentListings((prev) => prev.filter((l) => l.id !== listingId));
    setActionLoading(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total users', value: stats.users, icon: Users, color: 'blue' },
    { label: 'Total listings', value: stats.listings, icon: Package, color: 'emerald' },
    { label: 'Transactions', value: stats.transactions, icon: TrendingUp, color: 'amber' },
    { label: 'Platform revenue', value: `$${stats.revenue.toFixed(2)}`, icon: DollarSign, color: 'emerald' },
    { label: 'Open disputes', value: stats.disputes, icon: ShieldAlert, color: 'red' },
    { label: 'CO₂ saved', value: `${stats.carbon.toFixed(1)}kg`, icon: Leaf, color: 'emerald' },
  ];

  const tabs = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'listings' as const, label: 'Listings' },
    { id: 'transactions' as const, label: 'Transactions' },
    { id: 'disputes' as const, label: 'Disputes' },
    { id: 'users' as const, label: 'Users' },
  ];

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="w-6 h-6 text-emerald-600" />
          <h1 className="text-2xl font-bold text-stone-900">Admin panel</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {statCards.map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-stone-200 p-4">
              <s.icon className={`w-5 h-5 text-${s.color}-600 mb-2`} />
              <p className="text-xl font-bold text-stone-900">{s.value}</p>
              <p className="text-xs text-stone-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl border border-stone-200 p-1 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${tab === t.id ? 'bg-emerald-600 text-white' : 'text-stone-600 hover:bg-stone-100'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-stone-200 p-5">
              <h3 className="font-semibold text-stone-900 mb-4">Recent listings</h3>
              <div className="space-y-2">
                {recentListings.slice(0, 5).map((l) => (
                  <div key={l.id} className="flex items-center gap-3 text-sm">
                    <div className="w-10 h-10 rounded-lg bg-stone-100 overflow-hidden shrink-0">
                      {l.listing_images?.[0]?.url ? (
                        <img src={l.listing_images[0].url} alt="" className="w-full h-full object-cover" />
                      ) : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-800 truncate">{l.title}</p>
                      <p className="text-xs text-stone-500">{l.profiles?.username ?? 'Seller'} • ${Number(l.price).toFixed(2)}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${l.status === 'active' ? 'bg-emerald-100 text-emerald-700' : l.status === 'sold' ? 'bg-stone-100 text-stone-600' : 'bg-amber-100 text-amber-700'}`}>{l.status}</span>
                  </div>
                ))}
                {recentListings.length === 0 && <p className="text-sm text-stone-400">No listings yet.</p>}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 p-5">
              <h3 className="font-semibold text-stone-900 mb-4">Recent disputes</h3>
              <div className="space-y-2">
                {disputes.slice(0, 5).map((d) => (
                  <div key={d.id} className="flex items-center gap-3 text-sm">
                    <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-800 truncate">{d.reason}</p>
                      <p className="text-xs text-stone-500">By {d.profiles?.username ?? 'User'}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${d.status === 'open' ? 'bg-amber-100 text-amber-700' : d.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-600'}`}>{d.status}</span>
                  </div>
                ))}
                {disputes.length === 0 && <p className="text-sm text-stone-400">No disputes filed.</p>}
              </div>
            </div>
          </div>
        )}

        {/* Listings */}
        {tab === 'listings' && (
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 text-stone-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left p-4">Item</th>
                  <th className="text-left p-4 hidden sm:table-cell">Seller</th>
                  <th className="text-left p-4">Price</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-right p-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {recentListings.map((l) => (
                  <tr key={l.id} className="hover:bg-stone-50">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-lg bg-stone-100 overflow-hidden shrink-0">
                          {l.listing_images?.[0]?.url && <img src={l.listing_images[0].url} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <span className="font-medium text-stone-800 truncate max-w-[200px]">{l.title}</span>
                      </div>
                    </td>
                    <td className="p-4 hidden sm:table-cell text-stone-600">{l.profiles?.username ?? '—'}</td>
                    <td className="p-4 text-stone-700">${Number(l.price).toFixed(2)}</td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${l.status === 'active' ? 'bg-emerald-100 text-emerald-700' : l.status === 'sold' ? 'bg-stone-100 text-stone-600' : 'bg-amber-100 text-amber-700'}`}>{l.status}</span>
                    </td>
                    <td className="p-4 text-right">
                      {l.status !== 'removed' && (
                        <button
                          onClick={() => removeListing(l.id)}
                          disabled={actionLoading === l.id}
                          className="text-xs text-red-600 hover:underline disabled:opacity-50"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {recentListings.length === 0 && <p className="text-sm text-stone-400 p-6 text-center">No listings.</p>}
          </div>
        )}

        {/* Transactions */}
        {tab === 'transactions' && (
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 text-stone-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left p-4">Item</th>
                  <th className="text-left p-4 hidden sm:table-cell">Buyer</th>
                  <th className="text-left p-4 hidden sm:table-cell">Seller</th>
                  <th className="text-left p-4">Amount</th>
                  <th className="text-left p-4">Fee</th>
                  <th className="text-left p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-stone-50">
                    <td className="p-4 font-medium text-stone-800 truncate max-w-[180px]">{t.listings?.title ?? '—'}</td>
                    <td className="p-4 hidden sm:table-cell text-stone-600">{t.buyer?.username ?? '—'}</td>
                    <td className="p-4 hidden sm:table-cell text-stone-600">{t.seller?.username ?? '—'}</td>
                    <td className="p-4 text-stone-700">${Number(t.amount).toFixed(2)}</td>
                    <td className="p-4 text-emerald-700">${Number(t.platform_fee).toFixed(2)}</td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${t.status === 'released' ? 'bg-emerald-100 text-emerald-700' : t.status === 'escrow' ? 'bg-amber-100 text-amber-700' : t.status === 'disputed' ? 'bg-red-100 text-red-700' : 'bg-stone-100 text-stone-600'}`}>{t.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {transactions.length === 0 && <p className="text-sm text-stone-400 p-6 text-center">No transactions yet.</p>}
          </div>
        )}

        {/* Disputes */}
        {tab === 'disputes' && (
          <div className="space-y-3">
            {disputes.length === 0 ? (
              <p className="text-sm text-stone-400 p-6 text-center bg-white rounded-xl border border-dashed border-stone-300">No disputes filed.</p>
            ) : (
              disputes.map((d) => (
                <div key={d.id} className="bg-white rounded-xl border border-stone-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-red-500" />
                        <p className="font-semibold text-stone-900">{d.reason}</p>
                      </div>
                      <p className="text-sm text-stone-600 mt-1">{d.description}</p>
                      <p className="text-xs text-stone-400 mt-2">
                        By {d.profiles?.username ?? 'User'} • {d.transactions?.listings?.title ?? 'Item'} • ${Number(d.transactions?.amount ?? 0).toFixed(2)}
                      </p>
                      {d.resolution && (
                        <div className="mt-3 pt-3 border-t border-stone-100">
                          <p className="text-xs text-stone-500">Resolution:</p>
                          <p className="text-sm text-stone-700 mt-0.5">{d.resolution}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${d.status === 'open' ? 'bg-amber-100 text-amber-700' : d.status === 'investigating' ? 'bg-blue-100 text-blue-700' : d.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-600'}`}>{d.status}</span>
                      {(d.status === 'open' || d.status === 'investigating') && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => resolveDispute(d.id, 'resolved')}
                            disabled={actionLoading === d.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-full hover:bg-emerald-700 disabled:opacity-60"
                          >
                            <Check className="w-3.5 h-3.5" /> Resolve
                          </button>
                          <button
                            onClick={() => resolveDispute(d.id, 'closed')}
                            disabled={actionLoading === d.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-stone-300 text-stone-600 text-xs font-semibold rounded-full hover:bg-stone-50 disabled:opacity-60"
                          >
                            <X className="w-3.5 h-3.5" /> Close
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Users */}
        {tab === 'users' && (
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 text-stone-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left p-4">User</th>
                  <th className="text-left p-4 hidden sm:table-cell">Joined</th>
                  <th className="text-left p-4">Sales</th>
                  <th className="text-left p-4 hidden sm:table-cell">Rating</th>
                  <th className="text-left p-4">Verified</th>
                  <th className="text-right p-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-stone-50">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-bold">
                            {(u.username ?? u.full_name ?? '?')[0]?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-stone-800">{u.username ?? u.full_name ?? 'Anonymous'}</p>
                          <p className="text-xs text-stone-400">{u.is_admin && 'Admin'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden sm:table-cell text-stone-500 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="p-4 text-stone-700">{u.total_sales}</td>
                    <td className="p-4 hidden sm:table-cell text-stone-700">{Number(u.rating).toFixed(1)}</td>
                    <td className="p-4">
                      {u.is_verified ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-700"><BadgeCheck className="w-4 h-4" /> Yes</span>
                      ) : (
                        <span className="text-xs text-stone-400">No</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => toggleVerify(u.id, u.is_verified)}
                        disabled={actionLoading === u.id}
                        className={`text-xs font-medium ${u.is_verified ? 'text-red-600 hover:underline' : 'text-emerald-700 hover:underline'} disabled:opacity-50`}
                      >
                        {u.is_verified ? 'Unverify' : 'Verify'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && <p className="text-sm text-stone-400 p-6 text-center">No users yet.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
