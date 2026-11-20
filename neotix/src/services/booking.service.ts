import { supabase } from '../lib/supabase';
import { PaymentMethod } from '../types/database.types';

export interface HoldSeatsParams {
  screeningId: string;
  seatIds: string[];
}

export interface HoldSeatsResponse {
  success: boolean;
  booking_id: string;
  booking_code: string;
  total_amount: number;
  expires_at: string;
}

export interface ProcessPaymentParams {
  bookingId: string;
  paymentMethod: PaymentMethod;
  simulateSuccess?: boolean;
}

export interface ProcessPaymentResponse {
  success: boolean;
  status: 'pending' | 'success' | 'failed' | 'confirmed';
  message?: string;
  booking_code?: string;
  transaction_reference: string;
  tickets?: Array<{
    ticket_code: string;
    seat: string;
  }>;
}

export const BookingService = {
  /**
   * Hold seats for 10 minutes atomically via PostgreSQL RPC
   */
  async holdSeats({ screeningId, seatIds }: HoldSeatsParams): Promise<HoldSeatsResponse> {
    const { data, error } = await (supabase.rpc as any)('hold_seats', {
      p_screening_id: screeningId,
      p_seat_ids: seatIds,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data as HoldSeatsResponse;
  },

  /**
   * Process simulated payment (success or simulated failure) and issue digital tickets
   */
  async processSimulatedPayment({
    bookingId,
    paymentMethod,
    simulateSuccess = true,
  }: ProcessPaymentParams): Promise<ProcessPaymentResponse> {
    const { data, error } = await (supabase.rpc as any)('process_simulated_payment', {
      p_booking_id: bookingId,
      p_payment_method: paymentMethod,
      p_simulate_success: simulateSuccess,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data as ProcessPaymentResponse;
  },

  /**
   * Fetch active screenings for a movie and optional cinema branch
   */
  async getScreenings(movieId: string, branchId?: string) {
    let query = (supabase.from('screenings') as any)
      .select(`
        *,
        auditorium:auditoriums (
          id,
          name,
          screen_type,
          branch:cinema_branches (
            id,
            name,
            city,
            address
          )
        )
      `)
      .eq('movie_id', movieId)
      .eq('status', 'open')
      .gt('start_time', new Date().toISOString())
      .order('start_time', { ascending: true });

    if (branchId) {
      query = query.eq('auditorium.branch_id', branchId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  /**
   * Fetch all seats for an auditorium along with their reserved/occupied status for a screening
   */
  async getAuditoriumSeatsWithAvailability(auditoriumId: string, screeningId: string) {
    // 1. Fetch all layout seats
    const { data: seats, error: seatsError } = await (supabase.from('seats') as any)
      .select('*')
      .eq('auditorium_id', auditoriumId)
      .eq('is_active', true)
      .order('row_label', { ascending: true })
      .order('seat_number', { ascending: true });

    if (seatsError) throw seatsError;

    // 2. Fetch actively reserved or held seats for this screening
    const { data: reservedItems, error: reservedError } = await (supabase.from('booking_items') as any)
      .select('seat_id')
      .eq('screening_id', screeningId);

    if (reservedError) throw reservedError;

    const reservedSeatIdSet = new Set((reservedItems || []).map((item: any) => item.seat_id));

    // 3. Map availability
    return (seats || []).map((seat: any) => ({
      ...seat,
      isAvailable: !reservedSeatIdSet.has(seat.id),
    }));
  },

  /**
   * Fetch digital tickets for a confirmed booking
   */
  async getBookingTickets(bookingId: string) {
    const { data, error } = await (supabase.from('tickets') as any)
      .select(`
        *,
        booking_item:booking_items (
          price,
          seat:seats (
            row_label,
            seat_number,
            seat_type
          )
        ),
        booking:bookings (
          booking_code,
          total_amount,
          screening:screenings (
            start_time,
            end_time,
            movie:movies (
              title,
              poster_url,
              duration_minutes,
              age_rating
            ),
            auditorium:auditoriums (
              name,
              screen_type,
              branch:cinema_branches (
                name,
                address
              )
            )
          )
        )
      `)
      .eq('booking_id', bookingId);

    if (error) throw error;
    return data;
  },
};
