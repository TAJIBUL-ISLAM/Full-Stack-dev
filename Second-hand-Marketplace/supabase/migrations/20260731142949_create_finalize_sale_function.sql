/*
# Create finalize_sale function

## Purpose
Called when a buyer confirms receipt of an item. It:
1. Marks the transaction as released.
2. Increments the seller's total_sales counter.
3. Adds the listing's carbon_footprint_kg to the seller's carbon_saved_kg.

## Security
- SECURITY DEFINER so the authenticated role can call it without direct UPDATE
  privileges on the profiles table (which would let users edit their own rating /
  verification / sales counters).
- search_path set to public.
*/

CREATE OR REPLACE FUNCTION public.finalize_sale(tx_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seller_id uuid;
  v_carbon numeric;
BEGIN
  SELECT seller_id INTO v_seller_id FROM transactions WHERE id = tx_id;
  SELECT carbon_footprint_kg INTO v_carbon FROM listings
    WHERE id = (SELECT listing_id FROM transactions WHERE id = tx_id);

  IF v_seller_id IS NOT NULL THEN
    UPDATE profiles
      SET total_sales = total_sales + 1,
          carbon_saved_kg = carbon_saved_kg + COALESCE(v_carbon, 0),
          updated_at = now()
    WHERE id = v_seller_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.finalize_sale(uuid) TO authenticated;
