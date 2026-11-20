export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type SeatType = 'standard' | 'vip' | 'couple';
export type ScreenType = 'standard' | 'imax' | 'dolby_atmos' | 'vip_lounge';
export type AgeRating = 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17';
export type ScreeningStatus = 'scheduled' | 'open' | 'sold_out' | 'cancelled' | 'completed';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'expired';
export type PaymentStatus = 'pending' | 'success' | 'failed';
export type PaymentMethod = 'credit_card' | 'e_wallet' | 'virtual_account' | 'qris';
export type TicketStatus = 'valid' | 'checked_in' | 'cancelled';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          phone_number: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone_number?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone_number?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      genres: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          created_at?: string;
        };
      };
      movies: {
        Row: {
          id: string;
          title: string;
          slug: string;
          synopsis: string | null;
          duration_minutes: number;
          poster_url: string | null;
          backdrop_url: string | null;
          trailer_url: string | null;
          age_rating: AgeRating;
          rating_score: number;
          release_date: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          synopsis?: string | null;
          duration_minutes: number;
          poster_url?: string | null;
          backdrop_url?: string | null;
          trailer_url?: string | null;
          age_rating?: AgeRating;
          rating_score?: number;
          release_date: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          synopsis?: string | null;
          duration_minutes?: number;
          poster_url?: string | null;
          backdrop_url?: string | null;
          trailer_url?: string | null;
          age_rating?: AgeRating;
          rating_score?: number;
          release_date?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      cinema_branches: {
        Row: {
          id: string;
          name: string;
          slug: string;
          address: string;
          city: string;
          latitude: number | null;
          longitude: number | null;
          phone_number: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          address: string;
          city: string;
          latitude?: number | null;
          longitude?: number | null;
          phone_number?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          address?: string;
          city?: string;
          latitude?: number | null;
          longitude?: number | null;
          phone_number?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      auditoriums: {
        Row: {
          id: string;
          branch_id: string;
          name: string;
          screen_type: ScreenType;
          total_seats: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          branch_id: string;
          name: string;
          screen_type?: ScreenType;
          total_seats?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          branch_id?: string;
          name?: string;
          screen_type?: ScreenType;
          total_seats?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      seats: {
        Row: {
          id: string;
          auditorium_id: string;
          row_label: string;
          seat_number: number;
          seat_type: SeatType;
          seat_multiplier: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          auditorium_id: string;
          row_label: string;
          seat_number: number;
          seat_type?: SeatType;
          seat_multiplier?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          auditorium_id?: string;
          row_label?: string;
          seat_number?: number;
          seat_type?: SeatType;
          seat_multiplier?: number;
          is_active?: boolean;
          created_at?: string;
        };
      };
      screenings: {
        Row: {
          id: string;
          movie_id: string;
          auditorium_id: string;
          start_time: string;
          end_time: string;
          base_price: number;
          status: ScreeningStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          movie_id: string;
          auditorium_id: string;
          start_time: string;
          end_time: string;
          base_price: number;
          status?: ScreeningStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          movie_id?: string;
          auditorium_id?: string;
          start_time?: string;
          end_time?: string;
          base_price?: number;
          status?: ScreeningStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          user_id: string;
          screening_id: string;
          booking_code: string;
          status: BookingStatus;
          total_amount: number;
          expires_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          screening_id: string;
          booking_code: string;
          status?: BookingStatus;
          total_amount?: number;
          expires_at: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          screening_id?: string;
          booking_code?: string;
          status?: BookingStatus;
          total_amount?: number;
          expires_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      booking_items: {
        Row: {
          id: string;
          booking_id: string;
          screening_id: string;
          seat_id: string;
          price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          screening_id: string;
          seat_id: string;
          price: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          screening_id?: string;
          seat_id?: string;
          price?: number;
          created_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          booking_id: string;
          payment_method: PaymentMethod;
          amount: number;
          status: PaymentStatus;
          transaction_reference: string;
          payload: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          payment_method: PaymentMethod;
          amount: number;
          status?: PaymentStatus;
          transaction_reference: string;
          payload?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          payment_method?: PaymentMethod;
          amount?: number;
          status?: PaymentStatus;
          transaction_reference?: string;
          payload?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      tickets: {
        Row: {
          id: string;
          booking_id: string;
          booking_item_id: string;
          ticket_code: string;
          qr_payload: string;
          status: TicketStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          booking_item_id: string;
          ticket_code: string;
          qr_payload: string;
          status?: TicketStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          booking_item_id?: string;
          ticket_code?: string;
          qr_payload?: string;
          status?: TicketStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Functions: {
      hold_seats: {
        Args: {
          p_screening_id: string;
          p_seat_ids: string[];
        };
        Returns: {
          success: boolean;
          booking_id: string;
          booking_code: string;
          total_amount: number;
          expires_at: string;
        };
      };
      process_simulated_payment: {
        Args: {
          p_booking_id: string;
          p_payment_method: PaymentMethod;
          p_simulate_success?: boolean;
        };
        Returns: {
          success: boolean;
          status: PaymentStatus | 'confirmed';
          message?: string;
          booking_code?: string;
          transaction_reference: string;
          tickets?: Array<{
            ticket_code: string;
            seat: string;
          }>;
        };
      };
      cleanup_expired_bookings: {
        Args: Record<PropertyKey, never>;
        Returns: void;
      };
    };
  };
}
