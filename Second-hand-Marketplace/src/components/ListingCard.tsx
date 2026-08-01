import { Link } from 'react-router-dom';
import { Heart, MapPin, Star, BadgeCheck } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { Listing } from '@/lib/supabase';

const CONDITION_LABELS: Record<string, string> = {
  new: 'New',
  like_new: 'Like New',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
};

export function ListingCard({ listing }: { listing: Listing }) {
  const { user } = useAuth();
  const [wished, setWished] = useState(false);
  const [wishLoading, setWishLoading] = useState(false);

  const checkWishlist = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('wishlists')
      .select('id')
      .eq('user_id', user.id)
      .eq('listing_id', listing.id)
      .maybeSingle();
    setWished(!!data);
  };

  useState(() => {
    checkWishlist();
  });

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    setWishLoading(true);
    if (wished) {
      await supabase.from('wishlists').delete().eq('user_id', user.id).eq('listing_id', listing.id);
      setWished(false);
    } else {
      await supabase.from('wishlists').insert({ user_id: user.id, listing_id: listing.id });
      setWished(true);
    }
    setWishLoading(false);
  };

  const image = listing.listing_images?.[0]?.url;
  const discount = listing.original_price
    ? Math.round(((listing.original_price - listing.price) / listing.original_price) * 100)
    : 0;

  return (
    <Link
      to={`/listing/${listing.id}`}
      className="group block bg-white rounded-2xl overflow-hidden border border-stone-200 hover:shadow-lg hover:border-stone-300 transition-all duration-300"
    >
      <div className="relative aspect-square bg-stone-100 overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={listing.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-400">
            <div className="text-center">
              <div className="text-4xl mb-1">📦</div>
              <p className="text-xs">No photo</p>
            </div>
          </div>
        )}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {listing.status === 'sold' && (
            <span className="px-2.5 py-1 bg-stone-900 text-white text-xs font-semibold rounded-full">SOLD</span>
          )}
          {listing.status === 'reserved' && (
            <span className="px-2.5 py-1 bg-amber-500 text-white text-xs font-semibold rounded-full">RESERVED</span>
          )}
          {discount > 0 && listing.status === 'active' && (
            <span className="px-2.5 py-1 bg-emerald-600 text-white text-xs font-semibold rounded-full">
              -{discount}%
            </span>
          )}
        </div>
        {user && listing.seller_id !== user.id && (
          <button
            onClick={toggleWishlist}
            disabled={wishLoading}
            className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur rounded-full hover:bg-white shadow-sm transition-all"
          >
            <Heart
              className={`w-4 h-4 ${wished ? 'fill-red-500 text-red-500' : 'text-stone-600'}`}
            />
          </button>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-sm text-stone-900 line-clamp-1 group-hover:text-emerald-700 transition-colors">
            {listing.title}
          </h3>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs px-2 py-0.5 bg-stone-100 text-stone-600 rounded-full">
            {CONDITION_LABELS[listing.condition] ?? listing.condition}
          </span>
          <span className="text-xs text-stone-500">{listing.category}</span>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-lg font-bold text-stone-900">
              ${Number(listing.price).toFixed(2)}
            </p>
            {listing.original_price && (
              <p className="text-xs text-stone-400 line-through">
                ${Number(listing.original_price).toFixed(2)}
              </p>
            )}
          </div>
          {listing.city && (
            <div className="flex items-center gap-1 text-xs text-stone-500">
              <MapPin className="w-3 h-3" />
              <span className="truncate max-w-[80px]">{listing.city}</span>
            </div>
          )}
        </div>
        {listing.profiles && (
          <div className="mt-3 pt-3 border-t border-stone-100 flex items-center gap-2">
            {listing.profiles.avatar_url ? (
              <img src={listing.profiles.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-stone-200" />
            )}
            <span className="text-xs text-stone-600 truncate flex-1">
              {listing.profiles.username || listing.profiles.full_name || 'Seller'}
            </span>
            {listing.profiles.is_verified && (
              <BadgeCheck className="w-4 h-4 text-emerald-600" />
            )}
            {listing.profiles.rating > 0 && (
              <div className="flex items-center gap-0.5 text-xs text-stone-500">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {Number(listing.profiles.rating).toFixed(1)}
              </div>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
