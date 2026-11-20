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
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppIcon } from '../../components/ui/app-icon';
import { NeotixLogo } from '../../components/ui/neotix-logo';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';
import { BookingService } from '../../services/booking.service';
import { MovieService } from '../../services/movie.service';
import { PaymentMethod } from '../../types/database.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PaymentOption {
  id: PaymentMethod;
  name: string;
}

const PAYMENT_METHODS: PaymentOption[] = [
  { id: 'e_wallet', name: 'DANA' },
  { id: 'qris', name: 'ShopeePay / QRIS' },
  { id: 'virtual_account', name: 'Virtual Account' },
  { id: 'credit_card', name: 'Credit Card' },
];

export default function OrderSummaryScreen() {
  const params = useLocalSearchParams<{
    bookingId?: string;
    bookingCode?: string;
    screeningId?: string;
    movieId?: string;
    movieTitle?: string;
    seats?: string;
    seatIds?: string;
    price?: string;
  }>();

  const [movie, setMovie] = useState<any>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('e_wallet');
  const [secondsLeft, setSecondsLeft] = useState<number>(600); // 10 minutes hold
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const selectedSeats = params.seats ? params.seats.split(',') : ['A1', 'A2'];
  const ticketCount = selectedSeats.length;
  const basePriceNumber = Number(params.price) || ticketCount * 12.5;
  const serviceFeeTotal = ticketCount * 0.25;
  const finalTotal = (basePriceNumber + serviceFeeTotal).toFixed(2);
  const displayBookingCode = params.bookingCode || 'NTX-' + Math.random().toString(36).substring(2, 9).toUpperCase();

  // Load movie details
  useEffect(() => {
    async function loadMovie() {
      if (!params.movieId) return;
      const m = await MovieService.getMovieById(params.movieId);
      if (m) setMovie(m);
    }
    loadMovie();
  }, [params.movieId]);

  // 10-minute Countdown Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          Alert.alert('Hold Expired', 'Your 10-minute seat reservation has expired. Please choose your seats again.', [
            { text: 'OK', onPress: () => router.back() }
          ]);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleConfirmPayment = async () => {
    try {
      setIsProcessing(true);

      // If a real bookingId exists from live hold_seats RPC, process through database
      if (params.bookingId) {
        const paymentResult = await BookingService.processSimulatedPayment({
          bookingId: params.bookingId,
          paymentMethod: selectedPayment,
          simulateSuccess: true,
        });

        if (!paymentResult.success) {
          Alert.alert('Payment Failed', paymentResult.message || 'Transaction rejected.');
          return;
        }
      }

      // Navigate to digital ticket
      router.push({
        pathname: '/ticket/[id]',
        params: {
          id: displayBookingCode,
          movieTitle: movie?.title || params.movieTitle || 'Dune: Part Two',
          seats: selectedSeats.join(', '),
          totalPrice: `$${finalTotal}`,
        },
      } as any);
    } catch (err: any) {
      Alert.alert('Payment Error', err.message || 'Unable to process simulated payment.');
    } finally {
      setIsProcessing(false);
    }
  };

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

          <Text style={styles.headerTitle}>Order Summary</Text>

          <View style={{ width: 42 }} />
        </View>

        {/* RED COUNTDOWN BANNER (10-minute hold) */}
        <View style={styles.timerBanner}>
          <Text style={styles.timerBannerText}>
            Complete your payment within {formatTimer(secondsLeft)}
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* MOVIE INFO CARD */}
          <View style={styles.movieCard}>
            <Image
              source={{ uri: movie?.poster_url || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800' }}
              style={styles.moviePoster}
              contentFit="cover"
            />
            <View style={styles.movieDetails}>
              <NeotixLogo size="sm" style={styles.brandLogo} />

              <Text style={styles.movieTitle} numberOfLines={2}>
                {movie?.title || params.movieTitle || 'Dune: Part Two'}
              </Text>

              <View style={styles.ratingRow}>
                <AppIcon name="star" size={15} color={Colors.star} style={styles.starIcon} />
                <Text style={styles.ratingText}>{Number(movie?.rating_score || 8.6).toFixed(1)}</Text>
              </View>

              <Text style={styles.cinemaLocationText}>
                NEOTIX GRAND MALL, AUDITORIUM 1 (IMAX)
              </Text>
              <Text style={styles.showtimeText}>
                Code: {displayBookingCode}
              </Text>
            </View>
          </View>

          {/* TRANSACTION DETAIL SECTION */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Transaction Detail</Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{ticketCount} TICKETS</Text>
              <Text style={styles.detailValue}>{selectedSeats.join(', ')}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>TICKET PRICE</Text>
              <Text style={styles.detailValue}>${basePriceNumber.toFixed(2)}</Text>
            </View>

            <View style={styles.detailRow}>
              <View>
                <Text style={styles.detailLabel}>SERVICE FEE</Text>
                <Text style={styles.detailSubLabel}>To help improve our service</Text>
              </View>
              <Text style={styles.detailValue}>
                $0.25 x {ticketCount}
              </Text>
            </View>
          </View>

          {/* PAYMENT METHOD SECTION */}
          <View style={styles.paymentSection}>
            <Text style={styles.sectionTitle}>Payment Method</Text>

            {PAYMENT_METHODS.map((method) => {
              const isSelected = method.id === selectedPayment;
              return (
                <TouchableOpacity
                  key={method.id}
                  style={styles.paymentRow}
                  onPress={() => setSelectedPayment(method.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.paymentMethodName}>{method.name}</Text>
                  <View
                    style={[
                      styles.radioCircle,
                      isSelected ? styles.radioSelected : styles.radioUnselected,
                    ]}
                  >
                    {isSelected && <View style={styles.radioInnerDot} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ height: 110 }} />
        </ScrollView>

        {/* BOTTOM CONFIRM ACTION BAR */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.buyButton, isProcessing && styles.buyButtonDisabled]}
            onPress={handleConfirmPayment}
            disabled={isProcessing}
            activeOpacity={0.88}
          >
            {isProcessing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.buyButtonTitle}>Confirm & Pay</Text>
                <View style={styles.buyButtonDivider} />
                <Text style={styles.buyButtonPrice}>${finalTotal}</Text>
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
  headerTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  timerBanner: {
    backgroundColor: '#9E2A2B',
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerBannerText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  movieCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  moviePoster: {
    width: 100,
    height: 145,
    borderRadius: 14,
    backgroundColor: Colors.surfaceElevated,
  },
  movieDetails: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  brandLogo: {
    marginBottom: 4,
  },
  movieTitle: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  starIcon: {
    marginRight: 4,
  },
  ratingText: {
    color: Colors.star,
    fontSize: 14,
    fontWeight: '600',
  },
  cinemaLocationText: {
    color: '#ACB3BE',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 3,
  },
  showtimeText: {
    color: '#8E95A2',
    fontSize: 11,
  },
  sectionCard: {
    borderTopWidth: 1,
    borderTopColor: '#282C35',
    paddingTop: 18,
    marginBottom: 24,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  detailLabel: {
    color: '#B0B6C2',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  detailSubLabel: {
    color: '#717886',
    fontSize: 11,
    marginTop: 2,
  },
  detailValue: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  paymentSection: {
    borderTopWidth: 1,
    borderTopColor: '#282C35',
    paddingTop: 18,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#262A32',
  },
  paymentMethodName: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: '#FFFFFF',
  },
  radioUnselected: {
    borderColor: '#5A6270',
  },
  radioInnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
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
