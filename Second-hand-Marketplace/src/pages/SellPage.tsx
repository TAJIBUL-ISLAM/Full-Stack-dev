import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase, CATEGORIES, CONDITIONS } from '@/lib/supabase';
import { ImagePlus, X, DollarSign, MapPin, AlertCircle, CheckCircle2, Leaf } from 'lucide-react';

export function SellPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [condition, setCondition] = useState<'new' | 'like_new' | 'good' | 'fair' | 'poor'>('good');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [city, setCity] = useState('');
  const [location, setLocation] = useState('');
  const [allowLocalPickup, setAllowLocalPickup] = useState(true);
  const [allowDelivery, setAllowDelivery] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>(['']);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const updateImage = (idx: number, url: string) => {
    const next = [...imageUrls];
    next[idx] = url;
    setImageUrls(next);
  };

  const addImageField = () => {
    if (imageUrls.length < 6) setImageUrls([...imageUrls, '']);
  };

  const removeImageField = (idx: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !description.trim() || !price) {
      setError('Please fill in title, description, and price.');
      return;
    }

    const priceNum = Number(price);
    if (isNaN(priceNum) || priceNum < 0) {
      setError('Please enter a valid price.');
      return;
    }

    setLoading(true);

    const carbonEstimate = Math.round((Math.log(priceNum + 10) * 2.5 + 1.5) * 100) / 100;

    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .insert({
        seller_id: user!.id,
        title: title.trim(),
        description: description.trim(),
        category,
        condition,
        price: priceNum,
        original_price: originalPrice ? Number(originalPrice) : null,
        city: city.trim() || null,
        location: location.trim() || null,
        allow_local_pickup: allowLocalPickup,
        allow_delivery: allowDelivery,
        carbon_footprint_kg: carbonEstimate,
        status: 'active',
      })
      .select()
      .single();

    if (listingError || !listing) {
      setError(listingError?.message ?? 'Failed to create listing.');
      setLoading(false);
      return;
    }

    const validImages = imageUrls.map((u, i) => ({ url: u.trim(), position: i })).filter((x) => x.url);
    if (validImages.length > 0) {
      await supabase.from('listing_images').insert(
        validImages.map((img) => ({ listing_id: listing.id, url: img.url, position: img.position }))
      );
    }

    setLoading(false);
    navigate(`/listing/${listing.id}`);
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-stone-900">List a new item</h1>
          <p className="text-sm text-stone-500 mt-1">
            Add photos and details to help buyers find your item.
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Images */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5">
            <h2 className="font-semibold text-stone-900 mb-1">Photos</h2>
            <p className="text-xs text-stone-500 mb-4">Paste image URLs (up to 6). First image is the cover.</p>
            <div className="space-y-3">
              {imageUrls.map((url, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-lg bg-stone-100 overflow-hidden shrink-0 border border-stone-200">
                    {url ? (
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-300">
                        <ImagePlus className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => updateImage(idx, e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:bg-white focus:border-emerald-500"
                  />
                  {imageUrls.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeImageField(idx)}
                      className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {imageUrls.length < 6 && (
                <button
                  type="button"
                  onClick={addImageField}
                  className="inline-flex items-center gap-1.5 text-sm text-emerald-700 hover:text-emerald-800 font-medium"
                >
                  <ImagePlus className="w-4 h-4" /> Add another photo
                </button>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
            <h2 className="font-semibold text-stone-900">Details</h2>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Vintage leather jacket, barely used"
                maxLength={120}
                required
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:bg-white focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Description *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the item's condition, age, brand, any flaws..."
                rows={5}
                maxLength={2000}
                required
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:bg-white focus:border-emerald-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:bg-white focus:border-emerald-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">Condition *</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as typeof condition)}
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:bg-white focus:border-emerald-500"
                >
                  {CONDITIONS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label} — {c.description}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
            <h2 className="font-semibold text-stone-900">Pricing</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">Selling price *</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="25.00"
                    required
                    className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:bg-white focus:border-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">Original price (optional)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    placeholder="60.00"
                    className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:bg-white focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
            {price && originalPrice && Number(originalPrice) > Number(price) && (
              <div className="flex items-center gap-2 text-sm text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
                Buyer saves {Math.round(((Number(originalPrice) - Number(price)) / Number(originalPrice)) * 100)}% vs. original price
              </div>
            )}
          </div>

          {/* Location & delivery */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
            <h2 className="font-semibold text-stone-900">Location & delivery</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">City</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="San Francisco"
                    className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:bg-white focus:border-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">Area / neighborhood</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Mission District"
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:bg-white focus:border-emerald-500"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <label className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-all ${allowLocalPickup ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-stone-50 border-stone-200 text-stone-600'}`}>
                <input type="checkbox" checked={allowLocalPickup} onChange={(e) => setAllowLocalPickup(e.target.checked)} className="accent-emerald-600" />
                <span className="text-sm font-medium">Local pickup</span>
              </label>
              <label className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-all ${allowDelivery ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-stone-50 border-stone-200 text-stone-600'}`}>
                <input type="checkbox" checked={allowDelivery} onChange={(e) => setAllowDelivery(e.target.checked)} className="accent-emerald-600" />
                <span className="text-sm font-medium">Delivery available</span>
              </label>
            </div>
          </div>

          {/* Sustainability note */}
          {price && (
            <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <Leaf className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-sm text-emerald-800">
                <p className="font-medium">Selling this item saves an estimated {Math.round((Math.log(Number(price) + 10) * 2.5 + 1.5) * 100) / 100}kg of CO₂</p>
                <p className="text-xs text-emerald-700 mt-0.5">By keeping pre-loved items in circulation, you reduce manufacturing demand and landfill waste.</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-emerald-600 text-white text-sm font-semibold rounded-full hover:bg-emerald-700 transition-colors disabled:opacity-60"
            >
              {loading ? 'Publishing...' : 'Publish listing'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 text-stone-600 text-sm font-medium hover:bg-stone-100 rounded-full transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
