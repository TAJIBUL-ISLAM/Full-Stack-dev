import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, SlidersHorizontal, X, MapPin, Recycle } from 'lucide-react';
import { supabase, CATEGORIES, CONDITIONS, type Listing } from '@/lib/supabase';
import { ListingCard } from '@/components/ListingCard';

const SORT_OPTIONS = [
  { value: 'recent', label: 'Most recent' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
];

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const q = searchParams.get('q') ?? '';
  const category = searchParams.get('category') ?? '';
  const condition = searchParams.get('condition') ?? '';
  const minPrice = searchParams.get('minPrice') ?? '';
  const maxPrice = searchParams.get('maxPrice') ?? '';
  const city = searchParams.get('city') ?? '';
  const sort = searchParams.get('sort') ?? 'recent';

  const [localQ, setLocalQ] = useState(q);

  useEffect(() => {
    setLocalQ(q);
  }, [q]);

  useEffect(() => {
    setLoading(true);
    let query = supabase
      .from('listings')
      .select(`
        *,
        profiles:seller_id (id, username, full_name, avatar_url, is_verified, rating),
        listing_images (id, url, position)
      `)
      .eq('status', 'active');

    if (q) query = query.ilike('title', `%${q}%`);
    if (category) query = query.eq('category', category);
    if (condition) query = query.eq('condition', condition);
    if (minPrice) query = query.gte('price', Number(minPrice));
    if (maxPrice) query = query.lte('price', Number(maxPrice));
    if (city) query = query.ilike('city', `%${city}%`);

    if (sort === 'price_asc') query = query.order('price', { ascending: true });
    else if (sort === 'price_desc') query = query.order('price', { ascending: false });
    else query = query.order('created_at', { ascending: false });

    query.limit(48).then(({ data }) => {
      setListings((data as Listing[]) ?? []);
      setLoading(false);
    });
  }, [q, category, condition, minPrice, maxPrice, city, sort]);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  const handleSubmitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam('q', localQ);
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const hasFilters = q || category || condition || minPrice || maxPrice || city;

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Explore the marketplace</h1>
            <p className="text-sm text-stone-500 mt-1">
              {loading ? 'Searching...' : `${listings.length} item${listings.length === 1 ? '' : 's'} found`}
              {q && <> for "<span className="text-stone-700 font-medium">{q}</span>"</>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-stone-200 rounded-full text-sm font-medium text-stone-700"
            >
              <SlidersHorizontal className="w-4 h-4" /> Filters
            </button>
            <select
              value={sort}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="px-4 py-2 bg-white border border-stone-200 rounded-full text-sm font-medium text-stone-700 focus:outline-none focus:border-emerald-500"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Filters sidebar */}
          <aside className={`${showFilters ? 'fixed inset-0 z-50 bg-black/40 md:bg-transparent md:static' : 'hidden md:block'} md:w-64 shrink-0`}>
            <div className={`${showFilters ? 'absolute right-0 top-0 bottom-0 w-80 max-w-full bg-white p-6 overflow-y-auto md:static md:w-full md:p-0' : ''}`}>
              <div className="md:sticky md:top-20 space-y-6">
                <div className="flex items-center justify-between md:hidden">
                  <h2 className="font-semibold text-stone-900">Filters</h2>
                  <button onClick={() => setShowFilters(false)} className="p-1"><X className="w-5 h-5" /></button>
                </div>

                <form onSubmit={handleSubmitSearch} className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    value={localQ}
                    onChange={(e) => setLocalQ(e.target.value)}
                    placeholder="Search items..."
                    className="w-full pl-9 pr-3 py-2 bg-stone-100 rounded-lg text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-100"
                  />
                </form>

                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Category</label>
                  <select
                    value={category}
                    onChange={(e) => updateParam('category', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">All categories</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Condition</label>
                  <div className="space-y-1.5">
                    <button
                      onClick={() => updateParam('condition', '')}
                      className={`block w-full text-left px-3 py-1.5 rounded-lg text-sm ${!condition ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-stone-600 hover:bg-stone-100'}`}
                    >
                      Any condition
                    </button>
                    {CONDITIONS.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => updateParam('condition', c.value)}
                        className={`block w-full text-left px-3 py-1.5 rounded-lg text-sm ${condition === c.value ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-stone-600 hover:bg-stone-100'}`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Price range</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={minPrice}
                      onChange={(e) => updateParam('minPrice', e.target.value)}
                      placeholder="Min"
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-stone-400">–</span>
                    <input
                      type="number"
                      value={maxPrice}
                      onChange={(e) => updateParam('maxPrice', e.target.value)}
                      placeholder="Max"
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => updateParam('city', e.target.value)}
                      placeholder="City..."
                      className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm text-stone-600 hover:bg-stone-100 transition-colors"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            </div>
          </aside>

          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-stone-200 overflow-hidden animate-pulse">
                    <div className="aspect-square bg-stone-200" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-stone-200 rounded w-3/4" />
                      <div className="h-5 bg-stone-200 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-stone-300">
                <Recycle className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                <p className="text-stone-600 font-medium">No items match your search</p>
                <p className="text-sm text-stone-400 mt-1">Try adjusting your filters or search terms</p>
                {hasFilters && (
                  <button onClick={clearFilters} className="mt-4 px-4 py-2 bg-emerald-600 text-white text-sm rounded-full hover:bg-emerald-700">
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {listings.map((l) => (
                  <ListingCard key={l.id} listing={l} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
