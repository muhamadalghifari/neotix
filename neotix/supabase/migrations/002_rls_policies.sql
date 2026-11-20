-- Migration: 002_rls_policies.sql
-- Description: Row Level Security (RLS) policies for Neotix Backend

-- Enable RLS on all public tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movie_genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cinema_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoriums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screenings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 1. PROFILES POLICIES
-- ============================================================================
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ============================================================================
-- 2. CATALOG & CINEMA POLICIES (Read-only for public/authenticated)
-- ============================================================================
CREATE POLICY "Allow public read access to active genres"
ON public.genres FOR SELECT
USING (true);

CREATE POLICY "Allow public read access to active movies"
ON public.movies FOR SELECT
USING (is_active = true);

CREATE POLICY "Allow public read access to movie genres"
ON public.movie_genres FOR SELECT
USING (true);

CREATE POLICY "Allow public read access to active branches"
ON public.cinema_branches FOR SELECT
USING (is_active = true);

CREATE POLICY "Allow public read access to auditoriums"
ON public.auditoriums FOR SELECT
USING (true);

CREATE POLICY "Allow public read access to active seats"
ON public.seats FOR SELECT
USING (is_active = true);

CREATE POLICY "Allow public read access to screenings"
ON public.screenings FOR SELECT
USING (status IN ('open', 'scheduled', 'sold_out'));

-- ============================================================================
-- 3. BOOKINGS POLICIES
-- ============================================================================
-- Users can only view their own bookings
CREATE POLICY "Users can view their own bookings"
ON public.bookings FOR SELECT
USING (auth.uid() = user_id);

-- Direct client updates/inserts on bookings are restricted.
-- All creation & status changes are safely handled via security definer RPC functions.

-- ============================================================================
-- 4. BOOKING ITEMS POLICIES
-- ============================================================================
-- Users can view booking items belonging to their bookings
CREATE POLICY "Users can view their own booking items"
ON public.booking_items FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.bookings b
        WHERE b.id = booking_items.booking_id
        AND b.user_id = auth.uid()
    )
);

-- Active seat reservations must be visible so other users know which seats are occupied
CREATE POLICY "Anyone can view reserved seats for a screening"
ON public.booking_items FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.bookings b
        WHERE b.id = booking_items.booking_id
        AND (b.status = 'confirmed' OR (b.status = 'pending' AND b.expires_at > NOW()))
    )
);

-- ============================================================================
-- 5. PAYMENTS & TICKETS POLICIES
-- ============================================================================
CREATE POLICY "Users can view payments for their bookings"
ON public.payments FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.bookings b
        WHERE b.id = payments.booking_id
        AND b.user_id = auth.uid()
    )
);

CREATE POLICY "Users can view tickets for their bookings"
ON public.tickets FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.bookings b
        WHERE b.id = tickets.booking_id
        AND b.user_id = auth.uid()
    )
);
