import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, type Profile, type Listing, type Review } from '@/lib/supabase';
import { ListingCard } from '@/components/ListingCard';
import { BadgeCheck, Star, Package, Leaf, ArrowLeft, MapPin } from 'lucide-react';

export function SellerPage() {
  const { id } = useParams<{ id: string }>();
  const [seller, setSeller] = useState<Profile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase.from('profiles').select('*').eq('id', id).maybeSingle(),
      supabase
        .from('listings')
        .select(`
          *,
          profiles:seller_id (id, username, full_name, avatar_url, is_verified, rating),
          listing_images (id, url, position)
        `)
        .eq('seller_id', id)
        .eq('status', 'active')
        .order('created_at', { ascending: false }),
      supabase
        .from('reviews')
        .select('*, reviewer:reviewer_id (id, username, avatar_url)')
        .eq('reviewee_id', id)
        .order('created_at', { ascending: false })
        .limit(10),
    ]).then(([p, l, r]) => {
      setSeller(p.data as Profile | null);
      setListings((l.data as Listing[]) ?? []);
      setReviews((r.data as Review[]) ?? []);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center">
        <p className="text-stone-600">Seller not found.</p>
        <Link to="/search" className="text-emerald-700 text-sm mt-2 hover:underline">Back to browse</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Link to={-1 as any} className="inline-flex items-center gap-1.5 text-sm text-stone-600 hover:text-emerald-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        {/* Seller header */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {seller.avatar_url ? (
              <img src={seller.avatar_url} alt="" className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-2xl font-bold">
                {(seller.username ?? '?')[0]?.toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-stone-900">{seller.username ?? 'Anonymous seller'}</h1>
                {seller.is_verified && <BadgeCheck className="w-6 h-6 text-emerald-600" />}
              </div>
              {seller.location && (
                <p className="flex items-center gap-1 text-sm text-stone-500 mt-1">
                  <MapPin className="w-4 h-4" /> {seller.location}
                </p>
              )}
              {seller.bio && <p className="text-sm text-stone-600 mt-2 max-w-xl">{seller.bio}</p>}
            </div>
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <div className="text-center">
                <Star className="w-5 h-5 text-amber-500 mx-auto mb-0.5" />
                <p className="font-bold text-stone-900">{Number(seller.rating).toFixed(1)}</p>
                <p className="text-xs text-stone-500">Rating</p>
              </div>
              <div className="text-center">
                <Package className="w-5 h-5 text-emerald-600 mx-auto mb-0.5" />
                <p className="font-bold text-stone-900">{seller.total_sales}</p>
                <p className="text-xs text-stone-500">Sold</p>
              </div>
              <div className="text-center">
                <Leaf className="w-5 h-5 text-emerald-600 mx-auto mb-0.5" />
                <p className="font-bold text-stone-900">{Number(seller.carbon_saved_kg).toFixed(1)}kg</p>
                <p className="text-xs text-stone-500">CO₂ saved</p>
              </div>
            </div>
          </div>
        </div>

        {/* Listings */}
        <h2 className="text-lg font-bold text-stone-900 mb-4">Active listings ({listings.length})</h2>
        {listings.length === 0 ? (
          <p className="text-sm text-stone-500 py-8 text-center bg-white rounded-xl border border-dashed border-stone-300">
            No active listings from this seller.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <>
            <h2 className="text-lg font-bold text-stone-900 mb-4">Reviews ({reviews.length})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {reviews.map((r) => (
                <div key={r.id} className="p-4 bg-white rounded-xl border border-stone-200">
                  <div className="flex items-center gap-2 mb-2">
                    {r.reviewer?.avatar_url ? (
                      <img src={r.reviewer.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-stone-200" />
                    )}
                    <span className="text-sm font-medium text-stone-800">{r.reviewer?.username ?? 'Buyer'}</span>
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-200'}`} />
                      ))}
                    </div>
                  </div>
                  {r.comment && <p className="text-sm text-stone-600">{r.comment}</p>}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
