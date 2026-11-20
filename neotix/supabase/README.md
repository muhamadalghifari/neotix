# Neotix — Supabase Backend Setup Guide

This guide explains how to set up your Supabase project and apply the database migrations for Neotix.

---

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Choose your organization, set a project name (e.g. `neotix`), and set a secure database password.
3. Select your preferred region.

---

## 2. Apply Migrations

You can apply the SQL migrations either via the **Supabase Dashboard SQL Editor** or via the **Supabase CLI**.

### Option A: Using the Supabase Dashboard (Fastest)

Open the **SQL Editor** in your Supabase project dashboard and execute each file in order:

1. `001_initial_schema.sql` (Creates enums, tables, foreign keys, indexes, and constraints)
2. `002_rls_policies.sql` (Enables Row Level Security and defines access policies)
3. `003_booking_transactions.sql` (Deploys atomic transaction RPCs: `hold_seats`, `cleanup_expired_bookings`, and `process_simulated_payment`)
4. `004_seed_data.sql` (Populates genres, movies, cinema branches, auditoriums, seats, and upcoming screenings)

### Option B: Using the Supabase CLI

From the `neotix/` project root:

```bash
# Login to Supabase CLI
npx supabase login

# Link your local project to your remote Supabase project
npx supabase link --project-ref <your-project-ref>

# Push the migrations
npx supabase db push
```

---

## 3. Configure Authentication

In the **Authentication** section of your Supabase dashboard:

1. **Email Auth**:
   - Navigate to `Authentication` > `Providers` > `Email`.
   - Ensure **Enable Email provider** is enabled.
   - For rapid local testing, you can disable *Confirm email* or leave it on for production.
2. **Google OAuth**:
   - Navigate to `Authentication` > `Providers` > `Google`.
   - Add your Google OAuth Client ID and Secret (from Google Cloud Console).
   - In Google Cloud Console, set the Authorized Redirect URI to:
     `https://<your-project-ref>.supabase.co/auth/v1/callback`
   - For Expo deep linking, add your app redirect scheme (e.g. `neotix://auth-callback`) to **URL Configuration** > **Redirect URLs**.

---

## 4. Automatic User Profile Trigger (Recommended)

To automatically create a record in `public.profiles` when a user registers, execute the following SQL in the SQL Editor:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    COALESCE(new.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 5. Storage Buckets (For Movie Posters & User Avatars)

1. Go to **Storage** in the Supabase dashboard.
2. Create two public buckets:
   - `posters` (Public: Yes)
   - `avatars` (Public: Yes)

---

## 6. Environment Variables for the Mobile App

Create a `.env` file in `neotix/` (never commit your secret service keys):

```env
EXPO_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```
