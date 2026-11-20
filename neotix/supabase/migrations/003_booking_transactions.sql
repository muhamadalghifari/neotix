-- Migration: 003_booking_transactions.sql
-- Description: Transactional database functions for holding seats and processing simulated payments

-- ============================================================================
-- HELPER: Cleanup Expired Bookings
-- ============================================================================
CREATE OR REPLACE FUNCTION public.cleanup_expired_bookings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Delete booking_items for expired pending bookings to free up the unique constraint (screening_id, seat_id)
    DELETE FROM public.booking_items
    WHERE booking_id IN (
        SELECT id FROM public.bookings
        WHERE status = 'pending' AND expires_at < NOW()
    );

    -- Mark expired bookings as 'expired'
    UPDATE public.bookings
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'pending' AND expires_at < NOW();
END;
$$;

-- ============================================================================
-- RPC: Hold Seats (10-minute temporary reservation)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.hold_seats(
    p_screening_id UUID,
    p_seat_ids UUID[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_screening RECORD;
    v_seat_count INT;
    v_conflict_count INT;
    v_booking_id UUID;
    v_booking_code TEXT;
    v_expires_at TIMESTAMPTZ;
    v_seat RECORD;
    v_seat_price NUMERIC(10, 2);
    v_total_amount NUMERIC(10, 2) := 0.00;
BEGIN
    -- 1. Validate user authentication
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.';
    END IF;

    -- 2. Validate seat selection
    v_seat_count := array_length(p_seat_ids, 1);
    IF v_seat_count IS NULL OR v_seat_count = 0 THEN
        RAISE EXCEPTION 'No seats selected.';
    END IF;

    -- 3. Run background cleanup of expired holds
    PERFORM public.cleanup_expired_bookings();

    -- 4. Check screening validity and lock screening record for concurrency control
    SELECT * INTO v_screening
    FROM public.screenings
    WHERE id = p_screening_id AND status = 'open'
    FOR SHARE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Screening is not available for booking.';
    END IF;

    IF v_screening.start_time <= NOW() THEN
        RAISE EXCEPTION 'Screening has already started or passed.';
    END IF;

    -- 5. Lock and check if any requested seats are currently reserved
    -- Either confirmed or pending (active hold)
    SELECT COUNT(*) INTO v_conflict_count
    FROM public.booking_items bi
    JOIN public.bookings b ON b.id = bi.booking_id
    WHERE bi.screening_id = p_screening_id
      AND bi.seat_id = ANY(p_seat_ids)
      AND (
          b.status = 'confirmed' 
          OR (b.status = 'pending' AND b.expires_at > NOW())
      );

    IF v_conflict_count > 0 THEN
        RAISE EXCEPTION 'One or more selected seats are no longer available.';
    END IF;

    -- 6. Generate booking reference and 10-minute expiration
    v_booking_code := 'NTX-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 8));
    v_expires_at := NOW() + INTERVAL '10 minutes';

    -- 7. Insert pending booking
    INSERT INTO public.bookings (
        user_id,
        screening_id,
        booking_code,
        status,
        total_amount,
        expires_at
    ) VALUES (
        v_user_id,
        p_screening_id,
        v_booking_code,
        'pending',
        0.00,
        v_expires_at
    ) RETURNING id INTO v_booking_id;

    -- 8. Calculate price per seat and insert into booking_items
    FOR v_seat IN 
        SELECT s.id, s.seat_multiplier 
        FROM public.seats s
        WHERE s.id = ANY(p_seat_ids) AND s.auditorium_id = v_screening.auditorium_id
    LOOP
        v_seat_price := ROUND(v_screening.base_price * v_seat.seat_multiplier, 2);
        v_total_amount := v_total_amount + v_seat_price;

        INSERT INTO public.booking_items (
            booking_id,
            screening_id,
            seat_id,
            price
        ) VALUES (
            v_booking_id,
            p_screening_id,
            v_seat.id,
            v_seat_price
        );
    END LOOP;

    -- 9. Update total booking amount
    UPDATE public.bookings
    SET total_amount = v_total_amount
    WHERE id = v_booking_id;

    RETURN jsonb_build_object(
        'success', true,
        'booking_id', v_booking_id,
        'booking_code', v_booking_code,
        'total_amount', v_total_amount,
        'expires_at', v_expires_at
    );
END;
$$;

-- ============================================================================
-- RPC: Process Simulated Payment and Issue Tickets
-- ============================================================================
CREATE OR REPLACE FUNCTION public.process_simulated_payment(
    p_booking_id UUID,
    p_payment_method payment_method_enum,
    p_simulate_success BOOLEAN DEFAULT true
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_booking RECORD;
    v_item RECORD;
    v_ticket_code TEXT;
    v_qr_payload TEXT;
    v_tx_ref TEXT;
    v_issued_tickets JSONB := '[]'::jsonb;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.';
    END IF;

    -- 1. Lock the booking row for update
    SELECT * INTO v_booking
    FROM public.bookings
    WHERE id = p_booking_id AND user_id = v_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found.';
    END IF;

    IF v_booking.status != 'pending' THEN
        RAISE EXCEPTION 'Booking is already %.', v_booking.status;
    END IF;

    -- 2. Check hold expiration
    IF v_booking.expires_at < NOW() THEN
        -- Expire booking and clean up holds
        DELETE FROM public.booking_items WHERE booking_id = v_booking.id;
        UPDATE public.bookings SET status = 'expired', updated_at = NOW() WHERE id = v_booking.id;
        RAISE EXCEPTION 'Booking reservation has expired.';
    END IF;

    -- 3. Generate transaction reference
    v_tx_ref := 'TXN-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));

    -- 4. Handle Simulated Failure
    IF NOT p_simulate_success THEN
        INSERT INTO public.payments (
            booking_id,
            payment_method,
            amount,
            status,
            transaction_reference,
            payload
        ) VALUES (
            v_booking.id,
            p_payment_method,
            v_booking.total_amount,
            'failed',
            v_tx_ref,
            jsonb_build_object('error', 'Simulated card/account rejection')
        );

        -- Free up items and mark booking as cancelled
        DELETE FROM public.booking_items WHERE booking_id = v_booking.id;
        UPDATE public.bookings 
        SET status = 'cancelled', updated_at = NOW()
        WHERE id = v_booking.id;

        RETURN jsonb_build_object(
            'success', false,
            'status', 'failed',
            'message', 'Payment simulation failed. Seat reservation released.',
            'transaction_reference', v_tx_ref
        );
    END IF;

    -- 5. Handle Simulated Success
    INSERT INTO public.payments (
        booking_id,
        payment_method,
        amount,
        status,
        transaction_reference,
        payload
    ) VALUES (
        v_booking.id,
        p_payment_method,
        v_booking.total_amount,
        'success',
        v_tx_ref,
        jsonb_build_object('provider', 'Neotix SimPay Gateway', 'authorized_at', NOW())
    );

    -- Confirm the booking
    UPDATE public.bookings
    SET status = 'confirmed', updated_at = NOW()
    WHERE id = v_booking.id;

    -- 6. Issue digital tickets for each booking item
    FOR v_item IN
        SELECT bi.id AS booking_item_id, s.row_label, s.seat_number
        FROM public.booking_items bi
        JOIN public.seats s ON s.id = bi.seat_id
        WHERE bi.booking_id = v_booking.id
    LOOP
        v_ticket_code := 'TCK-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || v_item.booking_item_id::TEXT) FROM 1 FOR 10));
        v_qr_payload := jsonb_build_object(
            'ticket_code', v_ticket_code,
            'booking_code', v_booking.booking_code,
            'seat', v_item.row_label || v_item.seat_number,
            'screening_id', v_booking.screening_id
        )::TEXT;

        INSERT INTO public.tickets (
            booking_id,
            booking_item_id,
            ticket_code,
            qr_payload,
            status
        ) VALUES (
            v_booking.id,
            v_item.booking_item_id,
            v_ticket_code,
            v_qr_payload,
            'valid'
        );

        v_issued_tickets := v_issued_tickets || jsonb_build_object(
            'ticket_code', v_ticket_code,
            'seat', v_item.row_label || v_item.seat_number
        );
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'status', 'confirmed',
        'booking_code', v_booking.booking_code,
        'transaction_reference', v_tx_ref,
        'tickets', v_issued_tickets
    );
END;
$$;
