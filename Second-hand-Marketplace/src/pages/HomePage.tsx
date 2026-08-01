import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, TrendingUp, Leaf, ArrowRight, Sparkles, Package, Users, Recycle } from 'lucide-react';
import { supabase, CATEGORIES, type Listing } from '@/lib/supabase';
import { ListingCard } from '@/components/ListingCard';

export function HomePage() {
  const [recentListings, setRecentListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    supabase
      .from('listings')
      .select(`
        *,
        profiles:seller_id (id, username, full_name, avatar_url, is_verified, rating),
        listing_images (id, url, position)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(8)
      .then(({ data }) => {
        setRecentListings((data as Listing[]) ?? []);
        setLoading(false);
      });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const stats = [
    { icon: Package, label: 'Items listed', value: '12K+' },
    { icon: Users, label: 'Active members', value: '4.5K+' },
    { icon: Leaf, label: 'CO₂ saved', value: '38T' },
  ];

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-stone-50 to-amber-50">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-200 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-200 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur rounded-full text-xs font-medium text-emerald-700 mb-6 border border-emerald-100">
              <Sparkles className="w-3.5 h-3.5" />
              Give pre-loved items a second life
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-stone-900 leading-[1.1] tracking-tight">
              Buy and sell <span className="text-emerald-600">second-hand</span> with people you trust
            </h1>
            <p className="mt-5 text-lg text-stone-600 leading-relaxed max-w-xl">
              ReMarket connects you with verified local sellers. Find unique deals, reduce waste,
              and build a circular economy — one item at a time.
            </p>
            <form onSubmit={handleSearch} className="mt-8 flex flex-col sm:flex-row gap-3 max-w-lg">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="What are you looking for?"
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-stone-200 rounded-full text-sm shadow-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3.5 bg-emerald-600 text-white text-sm font-semibold rounded-full hover:bg-emerald-700 transition-colors shadow-sm"
              >
                Search
              </button>
            </form>
            <div className="mt-8 flex flex-wrap gap-2">
              {CATEGORIES.slice(0, 6).map((cat) => (
                <Link
                  key={cat}
                  to={`/search?category=${encodeURIComponent(cat)}`}
                  className="px-3 py-1.5 bg-white/70 backdrop-blur border border-stone-200 rounded-full text-xs text-stone-700 hover:border-emerald-400 hover:text-emerald-700 transition-colors"
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-y border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-3 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <s.icon className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-stone-900">{s.value}</p>
                  <p className="text-xs text-stone-500">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent listings */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Fresh drops</span>
            </div>
            <h2 className="text-2xl font-bold text-stone-900">Recently listed</h2>
          </div>
          <Link
            to="/search"
            className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:gap-2 transition-all"
          >
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-stone-200 overflow-hidden animate-pulse">
                <div className="aspect-square bg-stone-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-stone-200 rounded w-3/4" />
                  <div className="h-3 bg-stone-200 rounded w-1/2" />
                  <div className="h-5 bg-stone-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : recentListings.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-stone-300">
            <Recycle className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <p className="text-stone-500">No listings yet. Be the first to sell!</p>
            <Link to="/sell" className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-emerald-600 text-white text-sm rounded-full hover:bg-emerald-700">
              List an item
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {recentListings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <h2 className="text-2xl font-bold text-stone-900 mb-6">Browse by category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat}
              to={`/search?category=${encodeURIComponent(cat)}`}
              className="group p-4 bg-white rounded-xl border border-stone-200 hover:border-emerald-400 hover:shadow-md transition-all"
            >
              <p className="text-sm font-medium text-stone-800 group-hover:text-emerald-700 transition-colors">{cat}</p>
              <p className="text-xs text-stone-400 mt-1">Explore →</p>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-700 to-emerald-900 rounded-3xl p-8 sm:p-12">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl" />
          <div className="relative max-w-2xl">
            <Leaf className="w-8 h-8 text-emerald-300 mb-4" />
            <h2 className="text-3xl font-bold text-white mb-3">Turn clutter into cash</h2>
            <p className="text-emerald-100 mb-6 leading-relaxed">
              Got things you no longer need? List them in minutes, reach buyers nearby, and keep
              useful items out of landfills. Every sale saves an average of 2.5kg of CO₂.
            </p>
            <Link
              to="/sell"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-emerald-700 text-sm font-semibold rounded-full hover:bg-emerald-50 transition-colors"
            >
              Start selling <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
