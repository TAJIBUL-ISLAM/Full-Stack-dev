import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  phone: string | null;
  is_verified: boolean;
  is_admin: boolean;
  rating: number;
  total_sales: number;
  carbon_saved_kg: number;
  created_at: string;
  updated_at: string;
};

export type Listing = {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  category: string;
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  price: number;
  original_price: number | null;
  location: string | null;
  city: string | null;
  allow_local_pickup: boolean;
  allow_delivery: boolean;
  status: 'active' | 'sold' | 'reserved' | 'removed';
  view_count: number;
  carbon_footprint_kg: number | null;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  listing_images?: ListingImage[];
};

export type ListingImage = {
  id: string;
  listing_id: string;
  url: string;
  position: number;
  created_at: string;
};

export type Conversation = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  last_message_at: string;
  created_at: string;
  listings?: Listing;
  buyer?: Profile;
  seller?: Profile;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
  profiles?: Profile;
};

export type Offer = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  counter_amount: number | null;
  status: 'pending' | 'accepted' | 'declined' | 'countered' | 'withdrawn';
  message: string | null;
  created_at: string;
  updated_at: string;
  listings?: Listing;
  buyer?: Profile;
  seller?: Profile;
};

export type Transaction = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  platform_fee: number;
  status: 'escrow' | 'released' | 'refunded' | 'disputed';
  payment_intent_id: string | null;
  buyer_confirmed_at: string | null;
  payout_at: string | null;
  created_at: string;
  updated_at: string;
  listings?: Listing;
  buyer?: Profile;
  seller?: Profile;
};

export type Dispute = {
  id: string;
  transaction_id: string;
  raised_by: string;
  reason: string;
  description: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  resolution: string | null;
  refund_amount: number | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  transactions?: Transaction;
  profiles?: Profile;
};

export type Review = {
  id: string;
  reviewer_id: string;
  reviewee_id: string;
  listing_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer?: Profile;
};

export const CATEGORIES = [
  'Electronics',
  'Clothing & Fashion',
  'Home & Garden',
  'Sports & Outdoors',
  'Books & Media',
  'Toys & Games',
  'Vehicles & Parts',
  'Art & Collectibles',
  'Musical Instruments',
  'Office & Business',
  'Health & Beauty',
  'Baby & Kids',
  'Tools & Equipment',
  'Food & Beverage',
  'Other',
];

export const CONDITIONS: { value: Listing['condition']; label: string; description: string }[] = [
  { value: 'new', label: 'New', description: 'Never used, original packaging' },
  { value: 'like_new', label: 'Like New', description: 'Used once or twice, no visible wear' },
  { value: 'good', label: 'Good', description: 'Minor signs of use, fully functional' },
  { value: 'fair', label: 'Fair', description: 'Visible wear, works perfectly' },
  { value: 'poor', label: 'Poor', description: 'Heavy wear, may need repair' },
];
