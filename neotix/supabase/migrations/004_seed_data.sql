-- Migration: 004_seed_data.sql
-- Description: Realistic sample data for cinema branches, auditoriums, seats, genres, movies, and screenings

-- 1. Insert Genres
INSERT INTO public.genres (id, name, slug) VALUES
    ('11111111-1111-1111-1111-111111111101', 'Action', 'action'),
    ('11111111-1111-1111-1111-111111111102', 'Sci-Fi', 'sci-fi'),
    ('11111111-1111-1111-1111-111111111103', 'Adventure', 'adventure'),
    ('11111111-1111-1111-1111-111111111104', 'Drama', 'drama'),
    ('11111111-1111-1111-1111-111111111105', 'Animation', 'animation')
ON CONFLICT (slug) DO NOTHING;

-- 2. Insert Movies
INSERT INTO public.movies (id, title, slug, synopsis, duration_minutes, poster_url, backdrop_url, age_rating, rating_score, release_date, is_active) VALUES
    (
        '22222222-2222-2222-2222-222222222201',
        'Dune: Part Two',
        'dune-part-two',
        'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
        166,
        'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800',
        'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200',
        'PG-13',
        8.6,
        '2026-03-01',
        true
    ),
    (
        '22222222-2222-2222-2222-222222222202',
        'Cyber Horizon: 2099',
        'cyber-horizon-2099',
        'In a neon-drenched metropolis, an operative uncovers a synthetic intelligence conspiracy threatening human autonomy.',
        134,
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800',
        'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1200',
        'R',
        8.2,
        '2026-04-15',
        true
    ),
    (
        '22222222-2222-2222-2222-222222222203',
        'Interstellar Drift',
        'interstellar-drift',
        'A deep space expedition encounters an anomaly near Jupiter that alters relativistic time.',
        152,
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800',
        'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200',
        'PG-13',
        8.9,
        '2026-05-10',
        true
    )
ON CONFLICT (slug) DO NOTHING;

-- Link Movies with Genres
INSERT INTO public.movie_genres (movie_id, genre_id) VALUES
    ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101'),
    ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111102'),
    ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111102'),
    ('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111102'),
    ('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111103')
ON CONFLICT DO NOTHING;

-- 3. Insert Cinema Branches
INSERT INTO public.cinema_branches (id, name, slug, address, city, latitude, longitude, phone_number, is_active) VALUES
    (
        '33333333-3333-3333-3333-333333333301',
        'Neotix Grand Mall',
        'neotix-grand-mall',
        'Level 4, Grand Central Mall, Downtown',
        'Metropolis',
        -6.175110,
        106.865039,
        '+1 555-0101',
        true
    ),
    (
        '33333333-3333-3333-3333-333333333302',
        'Neotix Riverside Promenade',
        'neotix-riverside-promenade',
        'Building C, Waterfront Boulevard',
        'Metropolis',
        -6.193120,
        106.821940,
        '+1 555-0102',
        true
    )
ON CONFLICT (slug) DO NOTHING;

-- 4. Insert Auditoriums
INSERT INTO public.auditoriums (id, branch_id, name, screen_type, total_seats) VALUES
    ('44444444-4444-4444-4444-444444444401', '33333333-3333-3333-3333-333333333301', 'Auditorium 1 (IMAX)', 'imax', 48),
    ('44444444-4444-4444-4444-444444444402', '33333333-3333-3333-3333-333333333301', 'Auditorium 2 (Standard)', 'standard', 48),
    ('44444444-4444-4444-4444-444444444403', '33333333-3333-3333-3333-333333333302', 'Hall A (Dolby Atmos)', 'dolby_atmos', 48)
ON CONFLICT (branch_id, name) DO NOTHING;

-- 5. Seed Seats for Auditorium 1 (Rows A-D, Seats 1-12 = 48 seats)
DO $$
DECLARE
    r TEXT;
    s INT;
    v_auditorium_id UUID := '44444444-4444-4444-4444-444444444401';
    v_seat_type seat_type_enum;
    v_multiplier NUMERIC(3, 2);
BEGIN
    FOREACH r IN ARRAY ARRAY['A', 'B', 'C', 'D']
    LOOP
        FOR s IN 1..12
        LOOP
            IF r = 'D' THEN
                v_seat_type := 'vip';
                v_multiplier := 1.25;
            ELSE
                v_seat_type := 'standard';
                v_multiplier := 1.00;
            END IF;

            INSERT INTO public.seats (auditorium_id, row_label, seat_number, seat_type, seat_multiplier)
            VALUES (v_auditorium_id, r, s, v_seat_type, v_multiplier)
            ON CONFLICT (auditorium_id, row_label, seat_number) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- 6. Insert Screenings (Future showtimes relative to current timestamp)
INSERT INTO public.screenings (id, movie_id, auditorium_id, start_time, end_time, base_price, status) VALUES
    (
        '55555555-5555-5555-5555-555555555501',
        '22222222-2222-2222-2222-222222222201',
        '44444444-4444-4444-4444-444444444401',
        NOW() + INTERVAL '2 hours',
        NOW() + INTERVAL '4 hours 46 minutes',
        12.50,
        'open'
    ),
    (
        '55555555-5555-5555-5555-555555555502',
        '22222222-2222-2222-2222-222222222202',
        '44444444-4444-4444-4444-444444444401',
        NOW() + INTERVAL '6 hours',
        NOW() + INTERVAL '8 hours 14 minutes',
        14.00,
        'open'
    ),
    (
        '55555555-5555-5555-5555-555555555503',
        '22222222-2222-2222-2222-222222222203',
        '44444444-4444-4444-4444-444444444401',
        NOW() + INTERVAL '1 day',
        NOW() + INTERVAL '1 day 2 hours 32 minutes',
        12.50,
        'open'
    )
ON CONFLICT (id) DO NOTHING;
