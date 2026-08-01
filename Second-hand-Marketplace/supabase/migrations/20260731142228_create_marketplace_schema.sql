/*
# Marketplace for Second-Hand Items — Full Schema

## Overview
Creates all tables needed for a peer-to-peer second-hand marketplace:
profiles, listings, listing_images, messages, conversations, offers,
wishlists, transactions, disputes, and reviews.

## New Tables

### profiles
- id (uuid, FK to auth.users)
- username, full_name, avatar_url, bio, location, phone
- is_verified (seller badge), is_admin, rating, total_sales, carbon_saved_kg
- created_at, updated_at

### listings
- id, seller_id (FK profiles), title, description
- category, condition, price, location, city, allow_local_pickup, allow_delivery
- status (active/sold/reserved/removed)
- view_count, carbon_footprint_kg
- created_at, updated_at

### listing_images
- id, listing_id, url, position

### conversations
- id, listing_id, buyer_id, seller_id
- last_message_at, created_at

### messages
- id, conversation_id, sender_id, body, created_at, read_at

### offers
- id, listing_id, buyer_id, seller_id, amount, status (pending/accepted/declined/countered/withdrawn), counter_amount
- created_at, updated_at

### wishlists
- id, user_id, listing_id, created_at

### transactions
- id, listing_id, buyer_id, seller_id, amount, status (escrow/released/refunded/disputed)
- payment_intent_id, buyer_confirmed_at, payout_at
- created_at, updated_at

### disputes
- id, transaction_id, raised_by, reason, description, status (open/investigating/resolved/closed)
- resolution, refund_amount
- created_at, updated_at, resolved_at

### reviews
- id, reviewer_id, reviewee_id, listing_id, rating, comment, created_at

## Security
- RLS enabled on all tables
- Authenticated users own their own rows
- Listings are publicly readable (anon + authenticated) since this is a marketplace
- Messages/conversations restricted to participants
*/

-- PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  full_name text,
  avatar_url text,
  bio text,
  location text,
  phone text,
  is_verified boolean NOT NULL DEFAULT false,
  is_admin boolean NOT NULL DEFAULT false,
  rating numeric(3,2) DEFAULT 0,
  total_sales integer NOT NULL DEFAULT 0,
  carbon_saved_kg numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_public" ON profiles;
CREATE POLICY "profiles_select_public" ON profiles FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_delete_own" ON profiles;
CREATE POLICY "profiles_delete_own" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- LISTINGS
CREATE TABLE IF NOT EXISTS listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  condition text NOT NULL CHECK (condition IN ('new','like_new','good','fair','poor')),
  price numeric(12,2) NOT NULL CHECK (price >= 0),
  original_price numeric(12,2),
  location text,
  city text,
  allow_local_pickup boolean NOT NULL DEFAULT true,
  allow_delivery boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','sold','reserved','removed')),
  view_count integer NOT NULL DEFAULT 0,
  carbon_footprint_kg numeric(8,2) DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "listings_select_public" ON listings;
CREATE POLICY "listings_select_public" ON listings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "listings_insert_own" ON listings;
CREATE POLICY "listings_insert_own" ON listings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS "listings_update_own" ON listings;
CREATE POLICY "listings_update_own" ON listings FOR UPDATE
  TO authenticated USING (auth.uid() = seller_id) WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS "listings_delete_own" ON listings;
CREATE POLICY "listings_delete_own" ON listings FOR DELETE
  TO authenticated USING (auth.uid() = seller_id);

-- LISTING IMAGES
CREATE TABLE IF NOT EXISTS listing_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  url text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE listing_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "listing_images_select_public" ON listing_images;
CREATE POLICY "listing_images_select_public" ON listing_images FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "listing_images_insert_own" ON listing_images;
CREATE POLICY "listing_images_insert_own" ON listing_images FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM listings WHERE listings.id = listing_id AND listings.seller_id = auth.uid())
  );

DROP POLICY IF EXISTS "listing_images_delete_own" ON listing_images;
CREATE POLICY "listing_images_delete_own" ON listing_images FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM listings WHERE listings.id = listing_id AND listings.seller_id = auth.uid())
  );

-- CONVERSATIONS
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(listing_id, buyer_id)
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conversations_select_participant" ON conversations;
CREATE POLICY "conversations_select_participant" ON conversations FOR SELECT
  TO authenticated USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

DROP POLICY IF EXISTS "conversations_insert_buyer" ON conversations;
CREATE POLICY "conversations_insert_buyer" ON conversations FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "conversations_update_participant" ON conversations;
CREATE POLICY "conversations_update_participant" ON conversations FOR UPDATE
  TO authenticated USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- MESSAGES
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "messages_select_participant" ON messages;
CREATE POLICY "messages_select_participant" ON messages FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_id
      AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "messages_insert_participant" ON messages;
CREATE POLICY "messages_insert_participant" ON messages FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_id
      AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "messages_update_participant" ON messages;
CREATE POLICY "messages_update_participant" ON messages FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_id
      AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
  );

-- OFFERS
CREATE TABLE IF NOT EXISTS offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  counter_amount numeric(12,2),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','countered','withdrawn')),
  message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "offers_select_participant" ON offers;
CREATE POLICY "offers_select_participant" ON offers FOR SELECT
  TO authenticated USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

DROP POLICY IF EXISTS "offers_insert_buyer" ON offers;
CREATE POLICY "offers_insert_buyer" ON offers FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "offers_update_participant" ON offers;
CREATE POLICY "offers_update_participant" ON offers FOR UPDATE
  TO authenticated USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- WISHLISTS
CREATE TABLE IF NOT EXISTS wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, listing_id)
);

ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wishlists_select_own" ON wishlists;
CREATE POLICY "wishlists_select_own" ON wishlists FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "wishlists_insert_own" ON wishlists;
CREATE POLICY "wishlists_insert_own" ON wishlists FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "wishlists_delete_own" ON wishlists;
CREATE POLICY "wishlists_delete_own" ON wishlists FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- TRANSACTIONS
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE RESTRICT,
  buyer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  seller_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  amount numeric(12,2) NOT NULL,
  platform_fee numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'escrow' CHECK (status IN ('escrow','released','refunded','disputed')),
  payment_intent_id text,
  buyer_confirmed_at timestamptz,
  payout_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transactions_select_participant" ON transactions;
CREATE POLICY "transactions_select_participant" ON transactions FOR SELECT
  TO authenticated USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

DROP POLICY IF EXISTS "transactions_insert_buyer" ON transactions;
CREATE POLICY "transactions_insert_buyer" ON transactions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "transactions_update_participant" ON transactions;
CREATE POLICY "transactions_update_participant" ON transactions FOR UPDATE
  TO authenticated USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- DISPUTES
CREATE TABLE IF NOT EXISTS disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES transactions(id) ON DELETE RESTRICT,
  raised_by uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE RESTRICT,
  reason text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','investigating','resolved','closed')),
  resolution text,
  refund_amount numeric(12,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "disputes_select_participant" ON disputes;
CREATE POLICY "disputes_select_participant" ON disputes FOR SELECT
  TO authenticated USING (
    auth.uid() = raised_by OR
    EXISTS (
      SELECT 1 FROM transactions
      WHERE transactions.id = transaction_id
      AND (transactions.buyer_id = auth.uid() OR transactions.seller_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "disputes_insert_participant" ON disputes;
CREATE POLICY "disputes_insert_participant" ON disputes FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = raised_by AND
    EXISTS (
      SELECT 1 FROM transactions
      WHERE transactions.id = transaction_id
      AND (transactions.buyer_id = auth.uid() OR transactions.seller_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "disputes_update_own" ON disputes;
CREATE POLICY "disputes_update_own" ON disputes FOR UPDATE
  TO authenticated USING (auth.uid() = raised_by);

-- REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  reviewee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES listings(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(reviewer_id, listing_id)
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews_select_public" ON reviews;
CREATE POLICY "reviews_select_public" ON reviews FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "reviews_insert_own" ON reviews;
CREATE POLICY "reviews_insert_own" ON reviews FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = reviewer_id);

DROP POLICY IF EXISTS "reviews_update_own" ON reviews;
CREATE POLICY "reviews_update_own" ON reviews FOR UPDATE
  TO authenticated USING (auth.uid() = reviewer_id);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_listings_seller_id ON listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_city ON listings(city);
CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(price);
CREATE INDEX IF NOT EXISTS idx_listing_images_listing_id ON listing_images(listing_id);
CREATE INDEX IF NOT EXISTS idx_conversations_buyer_id ON conversations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_seller_id ON conversations(seller_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_offers_listing_id ON offers(listing_id);
CREATE INDEX IF NOT EXISTS idx_offers_buyer_id ON offers(buyer_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_buyer_id ON transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_seller_id ON transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_disputes_transaction_id ON disputes(transaction_id);
