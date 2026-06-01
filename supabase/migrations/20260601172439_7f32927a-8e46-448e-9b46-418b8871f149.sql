
-- 1. Add public_id to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS public_id text UNIQUE;

-- 2. Generator for public IDs: user_<6 lowercase alphanum>
CREATE OR REPLACE FUNCTION public.generate_public_id()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  alphabet text := 'abcdefghijklmnopqrstuvwxyz0123456789';
  candidate text;
  i int;
  exists_count int;
BEGIN
  LOOP
    candidate := 'user_';
    FOR i IN 1..6 LOOP
      candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    END LOOP;
    SELECT count(*) INTO exists_count FROM public.profiles WHERE public_id = candidate;
    EXIT WHEN exists_count = 0;
  END LOOP;
  RETURN candidate;
END;
$$;

-- 3. Backfill existing rows
UPDATE public.profiles
SET public_id = public.generate_public_id()
WHERE public_id IS NULL;

-- 4. Enforce NOT NULL going forward
ALTER TABLE public.profiles
  ALTER COLUMN public_id SET NOT NULL;

-- 5. Update handle_new_user trigger function to assign a public_id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, balance, public_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    1000.00,
    public.generate_public_id()
  );
  RETURN NEW;
END;
$$;

-- Ensure the trigger exists (it may have been dropped)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Allow signed-in users to look up other profiles for receiver picker
--    (limited columns enforced at app level via SELECT list; RLS just gates row visibility)
DROP POLICY IF EXISTS "Authenticated users can view profile basics" ON public.profiles;
CREATE POLICY "Authenticated users can view profile basics"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- The old "Users can view own profile" policy is now redundant; drop it for clarity
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- 7. Transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  sender_public_id text NOT NULL,
  receiver_public_id text NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  token_id text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'completed',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON public.transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE INDEX IF NOT EXISTS idx_tx_sender ON public.transactions(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tx_receiver ON public.transactions(receiver_id, created_at DESC);

-- 8. Atomic transfer function
CREATE OR REPLACE FUNCTION public.transfer_funds(
  p_receiver_public_id text,
  p_amount numeric,
  p_token_id text
)
RETURNS public.transactions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_sender_id uuid := auth.uid();
  v_sender public.profiles;
  v_receiver public.profiles;
  v_tx public.transactions;
BEGIN
  IF v_sender_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than zero';
  END IF;

  IF p_receiver_public_id IS NULL OR length(trim(p_receiver_public_id)) = 0 THEN
    RAISE EXCEPTION 'Receiver is required';
  END IF;

  IF p_token_id IS NULL OR length(trim(p_token_id)) = 0 THEN
    RAISE EXCEPTION 'Token is required';
  END IF;

  -- Lock sender row
  SELECT * INTO v_sender
  FROM public.profiles
  WHERE user_id = v_sender_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sender profile not found';
  END IF;

  -- Lookup receiver by public_id (case-insensitive)
  SELECT * INTO v_receiver
  FROM public.profiles
  WHERE lower(public_id) = lower(trim(p_receiver_public_id))
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Receiver not found';
  END IF;

  IF v_receiver.user_id = v_sender_id THEN
    RAISE EXCEPTION 'Cannot send to yourself';
  END IF;

  IF v_sender.balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- Insert transaction (unique constraint on token_id prevents replay)
  INSERT INTO public.transactions
    (sender_id, receiver_id, sender_public_id, receiver_public_id, amount, token_id, status)
  VALUES
    (v_sender_id, v_receiver.user_id, v_sender.public_id, v_receiver.public_id, p_amount, p_token_id, 'completed')
  RETURNING * INTO v_tx;

  -- Update balances
  UPDATE public.profiles SET balance = balance - p_amount WHERE user_id = v_sender_id;
  UPDATE public.profiles SET balance = balance + p_amount WHERE user_id = v_receiver.user_id;

  RETURN v_tx;
END;
$$;

GRANT EXECUTE ON FUNCTION public.transfer_funds(text, numeric, text) TO authenticated;
