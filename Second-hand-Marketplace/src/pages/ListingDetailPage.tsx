import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase, type Listing, type Profile, type Offer, type Review } from '@/lib/supabase';
import {
  Heart,
  MapPin,
  BadgeCheck,
  Star,
  MessageCircle,
  Tag,
  Truck,
  PackageCheck,
  Leaf,
  ArrowLeft,
  AlertCircle,
  ShieldCheck,
  Clock,
  X,
} from 'lucide-react';

const CONDITION_LABELS: Record<string, string> = {
  new: 'New', like_new: 'Like New', good: 'Good', fair: 'Fair', poor: 'Poor',
};

export function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [seller, setSeller] = useState<Profile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [wished, setWished] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [offerError, setOfferError] = useState<string | null>(null);
  const [offerLoading, setOfferLoading] = useState(false);
  const [existingOffer, setExistingOffer] = useState<Offer | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    supabase
      .from('listings')
      .select(`
        *,
        profiles:seller_id (*),
        listing_images (id, url, position)
      `)
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          const l = data as Listing;
          setListing(l);
          setSeller(l.profiles ?? null);
          setOfferAmount(l.price ? String(l.price) : '');
          supabase.rpc('increment_view', { listing_id: l.id }).then(() => {});
        }
        setLoading(false);
      });

    if (user) {
      supabase
        .from('wishlists')
        .select('id')
        .eq('user_id', user.id)
        .eq('listing_id', id!)
        .maybeSingle()
        .then(({ data }) => setWished(!!data));

      supabase
        .from('offers')
        .select('*')
        .eq('listing_id', id!)
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => setExistingOffer(data as Offer | null));
    }
  }, [id, user]);

  useEffect(() => {
    if (seller) {
      supabase
        .from('reviews')
        .select('*, reviewer:reviewer_id (id, username, avatar_url)')
        .eq('reviewee_id', seller.id)
        .order('created_at', { ascending: false })
        .limit(5)
        .then(({ data }) => setReviews((data as Review[]) ?? []));
    }
  }, [seller]);

  const toggleWishlist = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (wished) {
      await supabase.from('wishlists').delete().eq('user_id', user.id).eq('listing_id', listing!.id);
      setWished(false);
    } else {
      await supabase.from('wishlists').insert({ user_id: user.id, listing_id: listing!.id });
      setWished(true);
    }
  };

  const startConversation = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (!listing || user.id === listing.seller_id) return;

    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('listing_id', listing.id)
      .eq('buyer_id', user.id)
      .maybeSingle();

    if (existing) {
      navigate(`/messages/${existing.id}`);
      return;
    }

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        listing_id: listing.id,
        buyer_id: user.id,
        seller_id: listing.seller_id,
      })
      .select()
      .single();

    if (!error && data) navigate(`/messages/${data.id}`);
  };

  const submitOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setOfferError(null);
    if (!user || !listing) return;
    const amt = Number(offerAmount);
    if (isNaN(amt) || amt <= 0) {
      setOfferError('Enter a valid amount');
      return;
    }
    if (amt >= Number(listing.price)) {
      setOfferError('Offer must be lower than the listing price');
      return;
    }
    setOfferLoading(true);
    const { error } = await supabase.from('offers').insert({
      listing_id: listing.id,
      buyer_id: user.id,
      seller_id: listing.seller_id,
      amount: amt,
      message: offerMessage.trim() || null,
      status: 'pending',
    });
    setOfferLoading(false);
    if (error) {
      setOfferError(error.message);
      return;
    }
    setShowOfferModal(false);
    navigate('/dashboard?tab=offers');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center gap-3">
        <AlertCircle className="w-12 h-12 text-stone-300" />
        <p className="text-stone-600 font-medium">This listing doesn't exist or was removed.</p>
        <Link to="/search" className="text-emerald-700 text-sm font-medium hover:underline">Browse other items</Link>
      </div>
    );
  }

  const images = listing.listing_images ?? [];
  const isOwn = user?.id === listing.seller_id;
  const discount = listing.original_price
    ? Math.round(((Number(listing.original_price) - Number(listing.price)) / Number(listing.original_price)) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-stone-600 hover:text-emerald-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Images */}
          <div>
            <div className="aspect-square rounded-2xl overflow-hidden bg-stone-100 border border-stone-200">
              {images.length > 0 ? (
                <img src={images[activeImage]?.url} alt={listing.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-stone-400 text-5xl">📦</div>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImage(i)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${activeImage === i ? 'border-emerald-600' : 'border-stone-200'}`}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs px-2.5 py-1 bg-stone-100 text-stone-600 rounded-full">{listing.category}</span>
              <span className="text-xs px-2.5 py-1 bg-stone-100 text-stone-600 rounded-full">{CONDITION_LABELS[listing.condition]}</span>
              {listing.status === 'sold' && (
                <span className="text-xs px-2.5 py-1 bg-stone-900 text-white rounded-full">Sold</span>
              )}
              {listing.status === 'reserved' && (
                <span className="text-xs px-2.5 py-1 bg-amber-500 text-white rounded-full">Reserved</span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 leading-tight">{listing.title}</h1>

            <div className="mt-4 flex items-end gap-3">
              <p className="text-3xl font-bold text-emerald-700">${Number(listing.price).toFixed(2)}</p>
              {listing.original_price && discount > 0 && (
                <>
                  <p className="text-lg text-stone-400 line-through">${Number(listing.original_price).toFixed(2)}</p>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">-{discount}%</span>
                </>
              )}
            </div>

            <div className="mt-5 prose prose-sm max-w-none">
              <h3 className="text-sm font-semibold text-stone-700 mb-1">Description</h3>
              <p className="text-stone-600 whitespace-pre-wrap leading-relaxed">{listing.description}</p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {listing.allow_local_pickup && (
                <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-stone-200">
                  <PackageCheck className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm text-stone-700">Local pickup</span>
                </div>
              )}
              {listing.allow_delivery && (
                <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-stone-200">
                  <Truck className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm text-stone-700">Delivery available</span>
                </div>
              )}
              {listing.city && (
                <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-stone-200">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm text-stone-700 truncate">{listing.city}</span>
                </div>
              )}
              {listing.carbon_footprint_kg != null && Number(listing.carbon_footprint_kg) > 0 && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <Leaf className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm text-emerald-700">Saves {Number(listing.carbon_footprint_kg).toFixed(1)}kg CO₂</span>
                </div>
              )}
            </div>

            {/* Seller card */}
            {seller && (
              <Link
                to={`/seller/${seller.id}`}
                className="mt-5 flex items-center gap-3 p-4 bg-white rounded-xl border border-stone-200 hover:border-emerald-300 transition-colors"
              >
                {seller.avatar_url ? (
                  <img src={seller.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold">
                    {(seller.username || seller.full_name || 'S')[0]?.toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-stone-900 truncate">{seller.username || seller.full_name || 'Seller'}</p>
                    {seller.is_verified && <BadgeCheck className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-stone-500">
                    {seller.rating > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {Number(seller.rating).toFixed(1)}
                      </span>
                    )}
                    <span>{seller.total_sales} sold</span>
                  </div>
                </div>
              </Link>
            )}

            {/* Actions */}
            {!isOwn && listing.status === 'active' && (
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={startConversation}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 text-white text-sm font-semibold rounded-full hover:bg-emerald-700 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" /> Message seller
                </button>
                <button
                  onClick={() => {
                    if (!user) { navigate('/auth'); return; }
                    setShowOfferModal(true);
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-white border border-stone-300 text-stone-700 text-sm font-semibold rounded-full hover:border-emerald-400 hover:text-emerald-700 transition-colors"
                >
                  <Tag className="w-4 h-4" /> Make an offer
                </button>
                <button
                  onClick={toggleWishlist}
                  className="p-3 bg-white border border-stone-300 rounded-full hover:border-red-300 transition-colors"
                >
                  <Heart className={`w-5 h-5 ${wished ? 'fill-red-500 text-red-500' : 'text-stone-600'}`} />
                </button>
              </div>
            )}

            {isOwn && (
              <div className="mt-6 p-4 bg-stone-100 rounded-xl border border-stone-200">
                <p className="text-sm text-stone-600">
                  This is your listing. {listing.view_count} view{listing.view_count === 1 ? '' : 's'} so far.
                </p>
                <Link to="/dashboard?tab=listings" className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-emerald-700 hover:underline">
                  Manage in dashboard →
                </Link>
              </div>
            )}

            {existingOffer && !isOwn && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                You have a pending offer of ${Number(existingOffer.amount).toFixed(2)} on this item.
                <Link to="/dashboard?tab=offers" className="font-semibold underline ml-1">View</Link>
              </div>
            )}

            {/* Trust badges */}
            <div className="mt-6 pt-5 border-t border-stone-200 flex flex-wrap gap-4 text-xs text-stone-500">
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-600" /> Buyer protection</span>
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-emerald-600" /> Posted {new Date(listing.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Reviews */}
        {reviews.length > 0 && (
          <div className="mt-12">
            <h2 className="text-lg font-bold text-stone-900 mb-4">Reviews about this seller</h2>
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
          </div>
        )}
      </div>

      {/* Offer modal */}
      {showOfferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => setShowOfferModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-stone-900">Make an offer</h3>
                <p className="text-sm text-stone-500 mt-0.5">Listed at ${Number(listing.price).toFixed(2)}</p>
              </div>
              <button onClick={() => setShowOfferModal(false)} className="p-1 text-stone-400 hover:text-stone-600"><X className="w-5 h-5" /></button>
            </div>

            {offerError && (
              <div className="mb-3 flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0" /> {offerError}
              </div>
            )}

            <form onSubmit={submitOffer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">Your offer ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:bg-white focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">Message (optional)</label>
                <textarea
                  value={offerMessage}
                  onChange={(e) => setOfferMessage(e.target.value)}
                  rows={3}
                  placeholder="Hi, I'd love to buy this at..."
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:bg-white focus:border-emerald-500 resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={offerLoading}
                className="w-full px-4 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-full hover:bg-emerald-700 disabled:opacity-60"
              >
                {offerLoading ? 'Sending...' : 'Send offer'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
