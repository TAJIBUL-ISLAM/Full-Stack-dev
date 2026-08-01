import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase, type Listing } from '@/lib/supabase';
import { ListingCard } from '@/components/ListingCard';
import { Heart, ArrowRight } from 'lucide-react';

export function WishlistPage() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('wishlists')
      .select(`
        listing:listing_id (
          *,
          profiles:seller_id (id, username, full_name, avatar_url, is_verified, rating),
          listing_images (id, url, position)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        const items = ((data ?? []) as unknown as { listing: Listing }[])
          .map((w) => w.listing)
          .filter(Boolean);
        setListings(items);
        setLoading(false);
      });
  }, [user]);

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Heart className="w-5 h-5 text-red-500" />
          <h1 className="text-2xl font-bold text-stone-900">My wishlist</h1>
          <span className="text-sm text-stone-500">({listings.length})</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-stone-200 overflow-hidden animate-pulse">
                <div className="aspect-square bg-stone-200" />
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-stone-300">
            <Heart className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <p className="text-stone-600 font-medium">Your wishlist is empty</p>
            <p className="text-sm text-stone-400 mt-1">Tap the heart on any listing to save it here.</p>
            <Link to="/search" className="inline-flex items-center gap-1 mt-4 px-4 py-2 bg-emerald-600 text-white text-sm rounded-full hover:bg-emerald-700">
              Browse items <ArrowRight className="w-4 h-4" />
            </Link>
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
  );
}
