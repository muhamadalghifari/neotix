-- Migration: 001_initial_schema.sql
-- Description: Core tables, enums, indexes, and constraints for Neotix Backend

-- Enable pgcrypto for UUID generation if not enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUMS
-- ============================================================================
DO $$ BEGIN
    CREATE TYPE seat_type_enum AS ENUM ('standard', 'vip', 'couple');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE screen_type_enum AS ENUM ('standard', 'imax', 'dolby_atmos', 'vip_lounge');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE age_rating_enum AS ENUM ('G', 'PG', 'PG-13', 'R', 'NC-17');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE screening_status_enum AS ENUM ('scheduled', 'open', 'sold_out', 'cancelled', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE booking_status_enum AS ENUM ('pending', 'confirmed', 'cancelled', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status_enum AS ENUM ('pending', 'success', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method_enum AS ENUM ('credit_card', 'e_wallet', 'virtual_account', 'qris');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ticket_status_enum AS ENUM ('valid', 'checked_in', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 1. USER PROFILES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    phone_number TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. MOVIE CATALOG & GENRES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.genres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.movies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    synopsis TEXT,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    poster_url TEXT,
    backdrop_url TEXT,
    trailer_url TEXT,
    age_rating age_rating_enum NOT NULL DEFAULT 'PG-13',
    rating_score NUMERIC(3, 1) DEFAULT 0.0 CHECK (rating_score >= 0.0 AND rating_score <= 10.0),
    release_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.movie_genres (
    movie_id UUID NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
    genre_id UUID NOT NULL REFERENCES public.genres(id) ON DELETE CASCADE,
    PRIMARY KEY (movie_id, genre_id)
);

-- ============================================================================
-- 3. CINEMA BRANCHES, AUDITORIUMS & SEATS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.cinema_branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    phone_number TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.auditoriums (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES public.cinema_branches(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    screen_type screen_type_enum NOT NULL DEFAULT 'standard',
    total_seats INTEGER NOT NULL DEFAULT 0 CHECK (total_seats >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(branch_id, name)
);

CREATE TABLE IF NOT EXISTS public.seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auditorium_id UUID NOT NULL REFERENCES public.auditoriums(id) ON DELETE CASCADE,
    row_label VARCHAR(3) NOT NULL,
    seat_number INTEGER NOT NULL CHECK (seat_number > 0),
    seat_type seat_type_enum NOT NULL DEFAULT 'standard',
    seat_multiplier NUMERIC(3, 2) NOT NULL DEFAULT 1.00 CHECK (seat_multiplier >= 1.00),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(auditorium_id, row_label, seat_number)
);

-- ============================================================================
-- 4. SCREENINGS (SHOWTIMES)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.screenings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movie_id UUID NOT NULL REFERENCES public.movies(id) ON DELETE RESTRICT,
    auditorium_id UUID NOT NULL REFERENCES public.auditoriums(id) ON DELETE RESTRICT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    base_price NUMERIC(10, 2) NOT NULL CHECK (base_price >= 0),
    status screening_status_enum NOT NULL DEFAULT 'open',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT check_screening_times CHECK (end_time > start_time)
);

-- ============================================================================
-- 5. BOOKINGS & SEAT RESERVATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    screening_id UUID NOT NULL REFERENCES public.screenings(id) ON DELETE RESTRICT,
    booking_code TEXT NOT NULL UNIQUE,
    status booking_status_enum NOT NULL DEFAULT 'pending',
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.booking_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    screening_id UUID NOT NULL REFERENCES public.screenings(id) ON DELETE RESTRICT,
    seat_id UUID NOT NULL REFERENCES public.seats(id) ON DELETE RESTRICT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Ensures a seat can only be tied to a screening once per active reservation / purchase
    UNIQUE(screening_id, seat_id)
);

-- ============================================================================
-- 6. SIMULATED PAYMENTS & DIGITAL TICKETS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    payment_method payment_method_enum NOT NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    status payment_status_enum NOT NULL DEFAULT 'pending',
    transaction_reference TEXT NOT NULL UNIQUE,
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    booking_item_id UUID NOT NULL REFERENCES public.booking_items(id) ON DELETE CASCADE,
    ticket_code TEXT NOT NULL UNIQUE,
    qr_payload TEXT NOT NULL,
    status ticket_status_enum NOT NULL DEFAULT 'valid',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 7. INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_movies_active ON public.movies(is_active, release_date);
CREATE INDEX IF NOT EXISTS idx_screenings_movie_time ON public.screenings(movie_id, start_time);
CREATE INDEX IF NOT EXISTS idx_screenings_auditorium_time ON public.screenings(auditorium_id, start_time);
CREATE INDEX IF NOT EXISTS idx_seats_auditorium ON public.seats(auditorium_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status_expires ON public.bookings(status, expires_at);
CREATE INDEX IF NOT EXISTS idx_booking_items_screening ON public.booking_items(screening_id);
CREATE INDEX IF NOT EXISTS idx_tickets_booking_id ON public.tickets(booking_id);
