import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppIcon } from '../../components/ui/app-icon';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';
import { MovieService, MovieRow } from '../../services/movie.service';
import { BookingService } from '../../services/booking.service';
import { supabase } from '../../lib/supabase';
import { MOCK_MOVIES } from '../../data/mock-movies';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DateOption {
  month: string;
  day: string;
  fullDate: string;
}

const DATES: DateOption[] = [
  { month: 'Nov', day: '12', fullDate: '2026-11-12' },
  { month: 'Nov', day: '13', fullDate: '2026-11-13' },
  { month: 'Nov', day: '14', fullDate: '2026-11-14' },
  { month: 'Nov', day: '15', fullDate: '2026-11-15' },
  { month: 'Nov', day: '16', fullDate: '2026-11-16' },
];

export default function SeatSelectionScreen() {
  const { movieId } = useLocalSearchParams<{ movieId: string }>();
  const [movie, setMovie] = useState<any>(null);
  const [screenings, setScreenings] = useState<any[]>([]);
  const [selectedScreeningId, setSelectedScreeningId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('12');
  const [seatsByRow, setSeatsByRow] = useState<Record<string, any[]>>({});
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // 1. Load Movie & Live Screenings
  useEffect(() => {
    async function loadScreenings() {
      if (!movieId) return;
      try {
        setIsLoading(true);
        // Load movie info
        const dbMovie = await MovieService.getMovieById(movieId);
        if (dbMovie) {
          setMovie(dbMovie);
        } else {
          setMovie(MOCK_MOVIES.find((m) => m.id === movieId) || MOCK_MOVIES[0]);
        }

        // Query active screenings for this movie from Supabase
        const { data: dbScreenings, error } = await supabase
          .from('screenings')
          .select(`
            id,
            start_time,
            end_time,
            base_price,
            auditorium_id,
            auditorium:auditoriums (
              name,
              screen_type,
              branch:cinema_branches (
                name,
                city
              )
            )
          `)
          .eq('movie_id', movieId)
          .order('start_time', { ascending: true });

        if (error) throw error;

        if (dbScreenings && dbScreenings.length > 0) {
          setScreenings(dbScreenings);
          setSelectedScreeningId((dbScreenings[0] as any).id);
        } else {
          // If no screenings for this movie, fetch any open screening
          const { data: fallbackScreenings } = await (supabase.from('screenings') as any)
            .select('*')
            .eq('status', 'open')
            .limit(3);

          if (fallbackScreenings && fallbackScreenings.length > 0) {
            setScreenings(fallbackScreenings);
            setSelectedScreeningId((fallbackScreenings[0] as any).id);
          }
        }
      } catch (err) {
        console.warn('Error loading screenings:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadScreenings();
  }, [movieId]);

  // 2. Load Live Auditorium Seats & Occupancy for selected screening
  useEffect(() => {
    async function loadSeats() {
      if (!selectedScreeningId) return;
      try {
        const activeScreening = screenings.find((s) => s.id === selectedScreeningId);
        const auditoriumId =
          activeScreening?.auditorium_id || '44444444-4444-4444-4444-444444444401';

        const seatsWithStatus = await BookingService.getAuditoriumSeatsWithAvailability(
          auditoriumId,
          selectedScreeningId
        );

        // Group seats by row (A, B, C, D)
        const grouped: Record<string, any[]> = {};
        for (const seat of seatsWithStatus) {
          if (!grouped[seat.row_label]) {
            grouped[seat.row_label] = [];
          }
          grouped[seat.row_label].push(seat);
        }

        setSeatsByRow(grouped);
        setSelectedSeats([]);
        setSelectedSeatIds([]);
      } catch (err) {
        console.warn('Error fetching seats:', err);
      }
    }

    loadSeats();
  }, [selectedScreeningId, screenings]);

  const toggleSeat = (seat: any) => {
    if (!seat.isAvailable) return;

    const seatLabel = `${seat.row_label}${seat.seat_number}`;

    if (selectedSeats.includes(seatLabel)) {
      setSelectedSeats(selectedSeats.filter((s) => s !== seatLabel));
      setSelectedSeatIds(selectedSeatIds.filter((id) => id !== seat.id));
    } else {
      setSelectedSeats([...selectedSeats, seatLabel]);
      setSelectedSeatIds([...selectedSeatIds, seat.id]);
    }
  };

  const activeScreening = screenings.find((s) => s.id === selectedScreeningId);
  const basePrice = Number(activeScreening?.base_price) || 12.5;
  const totalPrice = selectedSeats.length * basePrice;

  const handleBuyTicket = async () => {
    if (selectedSeatIds.length === 0) return;

    try {
      setIsSubmitting(true);

      // Check user session
      const { data: { session } } = await supabase.auth.getSession();
      
      let bookingCode = 'NTX-' + Math.random().toString(36).substring(2, 9).toUpperCase();
      let bookingId = '';

      // If user is authenticated, invoke live atomic hold_seats RPC
      if (session?.user) {
        const holdResult = await BookingService.holdSeats({
          screeningId: selectedScreeningId,
          seatIds: selectedSeatIds,
        });

        if (holdResult?.booking_id) {
          bookingId = holdResult.booking_id;
          bookingCode = holdResult.booking_code;
        }
      }

      // Route to Order Summary
      router.push({
        pathname: '/booking/order-summary',
        params: {
          bookingId,
          bookingCode,
          screeningId: selectedScreeningId,
          movieId: movie?.id,
          movieTitle: movie?.title,
          seats: selectedSeats.join(','),
          seatIds: selectedSeatIds.join(','),
          price: totalPrice.toFixed(2),
        },
      } as any);
    } catch (err: any) {
      Alert.alert('Reservation Error', err.message || 'Unable to hold seats.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !movie) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" />
      <View style={styles.container}>
        {/* HEADER BAR */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <AppIcon name="chevron-back" size={26} color="#FFFFFF" style={styles.backIcon} />
          </TouchableOpacity>

          <View style={styles.headerTitleBox}>
            <Text style={styles.headerMovieTitle} numberOfLines={1}>
              {movie.title}
            </Text>
            <Text style={styles.headerSubtitle}>Session Selection</Text>
          </View>

          <View style={{ width: 42 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* DATE PICKER */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateScroll}
          >
            {DATES.map((item) => {
              const isSelected = item.day === selectedDate;
              return (
                <TouchableOpacity
                  key={item.day}
                  style={[
                    styles.dateTicket,
                    isSelected ? styles.dateTicketActive : styles.dateTicketInactive,
                  ]}
                  onPress={() => setSelectedDate(item.day)}
                  activeOpacity={0.85}
                >
                  <View style={styles.ticketNotchTop} />
                  <Text
                    style={[
                      styles.dateMonthText,
                      isSelected ? styles.dateTextActive : styles.dateTextInactive,
                    ]}
                  >
                    {item.month}
                  </Text>
                  <Text
                    style={[
                      styles.dateDayText,
                      isSelected ? styles.dateTextActive : styles.dateTextInactive,
                    ]}
                  >
                    {item.day}
                  </Text>
                  <View style={styles.ticketNotchBottom} />
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* SHOWTIMES FROM SUPABASE */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.timeScroll}
          >
            {screenings.map((screening) => {
              const isSelected = screening.id === selectedScreeningId;
              const timeString = new Date(screening.start_time).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              });

              return (
                <TouchableOpacity
                  key={screening.id}
                  style={[
                    styles.timePill,
                    isSelected ? styles.timePillActive : styles.timePillInactive,
                  ]}
                  onPress={() => setSelectedScreeningId(screening.id)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.timePillText,
                      isSelected ? styles.timePillTextActive : styles.timePillTextInactive,
                    ]}
                  >
                    {timeString}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* CURVED SCREEN INDICATOR */}
          <View style={styles.screenArea}>
            <View style={styles.curvedScreenArc} />
            <Text style={styles.screenText}>SCREEN</Text>
          </View>

          {/* CINEMA SEAT MATRIX FROM SUPABASE */}
          <View style={styles.seatMatrix}>
            {Object.keys(seatsByRow).map((rowLabel) => (
              <View key={rowLabel} style={styles.seatRow}>
                {seatsByRow[rowLabel].map((seat) => {
                  const seatLabel = `${seat.row_label}${seat.seat_number}`;
                  const isSelected = selectedSeats.includes(seatLabel);
                  const isAvailable = seat.isAvailable;

                  let seatStyle = styles.seatAvailable;
                  let textStyle = styles.seatTextAvailable;

                  if (!isAvailable) {
                    seatStyle = styles.seatReserved;
                    textStyle = styles.seatTextReserved;
                  } else if (isSelected) {
                    seatStyle = styles.seatSelected;
                    textStyle = styles.seatTextSelected;
                  }

                  return (
                    <TouchableOpacity
                      key={seat.id}
                      style={[styles.seatBox, seatStyle]}
                      onPress={() => toggleSeat(seat)}
                      disabled={!isAvailable}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.seatLabel, textStyle]}>{seatLabel}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>

          {/* SEAT LEGEND */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, styles.seatAvailable]} />
              <Text style={styles.legendLabel}>Available</Text>
            </View>

            <View style={styles.legendItem}>
              <View style={[styles.legendBox, styles.seatReserved]} />
              <Text style={styles.legendLabel}>Reserved</Text>
            </View>

            <View style={styles.legendItem}>
              <View style={[styles.legendBox, styles.seatSelected]} />
              <Text style={styles.legendLabel}>Selected</Text>
            </View>
          </View>

          <View style={{ height: 110 }} />
        </ScrollView>

        {/* BOTTOM BUY TICKET ACTION BAR */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[
              styles.buyButton,
              (selectedSeats.length === 0 || isSubmitting) && styles.buyButtonDisabled,
            ]}
            onPress={handleBuyTicket}
            disabled={selectedSeats.length === 0 || isSubmitting}
            activeOpacity={0.88}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.buyButtonTitle}>Buy Ticket</Text>
                <View style={styles.buyButtonDivider} />
                <Text style={styles.buyButtonPrice}>${totalPrice.toFixed(2)}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    marginRight: 2,
    marginTop: -2,
  },
  headerTitleBox: {
    alignItems: 'center',
    maxWidth: SCREEN_WIDTH * 0.65,
  },
  headerMovieTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  scrollContent: {
    paddingTop: Spacing.md,
  },
  dateScroll: {
    paddingHorizontal: Spacing.lg,
    gap: 12,
    alignItems: 'center',
    height: 94,
  },
  dateTicket: {
    width: 58,
    height: 80,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  dateTicketActive: {
    backgroundColor: Colors.primary,
  },
  dateTicketInactive: {
    backgroundColor: '#D1D5DB',
  },
  ticketNotchTop: {
    position: 'absolute',
    top: -5,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.background,
  },
  ticketNotchBottom: {
    position: 'absolute',
    bottom: -5,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.background,
  },
  dateMonthText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dateDayText: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  dateTextActive: {
    color: '#FFFFFF',
  },
  dateTextInactive: {
    color: '#1F2228',
  },
  timeScroll: {
    paddingHorizontal: Spacing.lg,
    gap: 10,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  timePill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  timePillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  timePillInactive: {
    backgroundColor: '#E5E7EB',
    borderColor: '#E5E7EB',
  },
  timePillText: {
    fontSize: 14,
    fontWeight: '700',
  },
  timePillTextActive: {
    color: '#FFFFFF',
  },
  timePillTextInactive: {
    color: '#1F2228',
  },
  screenArea: {
    alignItems: 'center',
    marginVertical: 14,
    overflow: 'hidden',
    height: 48,
  },
  curvedScreenArc: {
    width: SCREEN_WIDTH * 0.9,
    height: 70,
    borderTopWidth: 2.5,
    borderTopColor: '#C4C8D0',
    borderRadius: SCREEN_WIDTH * 0.45,
    position: 'absolute',
    top: 6,
  },
  screenText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2,
    marginTop: 24,
  },
  seatMatrix: {
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingHorizontal: Spacing.xs,
  },
  seatRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  seatBox: {
    width: 26,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seatAvailable: {
    backgroundColor: '#FFFFFF',
  },
  seatReserved: {
    backgroundColor: '#788190',
  },
  seatSelected: {
    backgroundColor: Colors.primary,
  },
  seatLabel: {
    fontSize: 9,
    fontWeight: '700',
  },
  seatTextAvailable: {
    color: '#1F2228',
  },
  seatTextReserved: {
    color: '#D1D5DB',
  },
  seatTextSelected: {
    color: '#FFFFFF',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 22,
    marginTop: 28,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  legendLabel: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '500',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 32 : 18,
    paddingTop: 12,
    backgroundColor: 'rgba(31, 34, 40, 0.94)',
  },
  buyButton: {
    backgroundColor: Colors.primary,
    height: 54,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  buyButtonDisabled: {
    opacity: 0.5,
  },
  buyButtonTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  buyButtonDivider: {
    width: 1.5,
    height: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 16,
  },
  buyButtonPrice: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
});
