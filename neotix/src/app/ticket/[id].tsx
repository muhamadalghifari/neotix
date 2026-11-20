import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppIcon } from '../../components/ui/app-icon';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';
import { DynamicQRCode } from '../../components/ui/dynamic-qrcode';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function DigitalTicketScreen() {
  const params = useLocalSearchParams<{
    id?: string;
    movieTitle?: string;
    seats?: string;
    date?: string;
    time?: string;
    totalPrice?: string;
  }>();

  const bookingCode = params.id || 'NTX-784291';
  const movieTitle = params.movieTitle || 'Dune: Part Two';
  const seatsText = params.seats || 'A1, A2';
  const priceText = params.totalPrice || '$25.00';

  // QR Code payload formatted as machine-verifiable JSON
  const qrPayload = JSON.stringify({
    app: 'Neotix',
    booking_code: bookingCode,
    movie: movieTitle,
    seats: seatsText,
    price: priceText,
    verified_at: new Date().toISOString(),
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" />
      <View style={styles.container}>
        {/* TOP HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.replace('/(tabs)')}
            activeOpacity={0.8}
          >
            <AppIcon name="chevron-back" size={26} color="#FFFFFF" style={styles.backIcon} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Ticket</Text>

          <View style={{ width: 42 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* WHITE TICKET CARD WITH CUTOUT NOTCHES */}
          <View style={styles.ticketCard}>
            {/* Upper Ticket Content */}
            <View style={styles.ticketTopSection}>
              {/* Movie Title */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Movie</Text>
                <Text style={styles.movieTitleText}>{movieTitle}</Text>
              </View>

              {/* Date & Seat Row */}
              <View style={styles.fieldRow}>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Cinema</Text>
                  <Text style={styles.fieldRedValue}>Neotix Grand Mall</Text>
                </View>

                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Seat</Text>
                  <Text style={styles.fieldRedValue}>{seatsText}</Text>
                </View>
              </View>

              {/* Order Reference */}
              <View style={styles.fieldRow}>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Screen</Text>
                  <Text style={styles.fieldRedValue}>Auditorium 1 (IMAX)</Text>
                </View>

                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Order Code</Text>
                  <Text style={styles.fieldRedValue}>{bookingCode}</Text>
                </View>
              </View>
            </View>

            {/* TICKET PERFORATION & SIDE NOTCHES */}
            <View style={styles.perforationWrapper}>
              <View style={styles.leftNotch} />
              <View style={styles.dashedLine} />
              <View style={styles.rightNotch} />
            </View>

            {/* Lower Ticket Content (BARCODE) */}
            <View style={styles.ticketBottomSection}>
              <View style={styles.barcodeContainer}>
                <View style={styles.barcodeLines}>
                  {[
                    4, 2, 6, 2, 3, 7, 2, 5, 2, 4, 8, 2, 3, 5, 2, 6, 2, 4, 7, 2, 3, 6, 2, 4, 8, 2, 5,
                  ].map((thickness, idx) => (
                    <View
                      key={idx}
                      style={{
                        width: thickness,
                        height: 54,
                        backgroundColor: '#1F2228',
                        marginRight: 2.5,
                      }}
                    />
                  ))}
                </View>
              </View>
            </View>
          </View>

          {/* LOWER WHITE INFO BAR (Name, Price & Machine-Scannable QR CODE) */}
          <View style={styles.bottomInfoCard}>
            <View style={styles.bottomInfoLeft}>
              <View style={{ marginBottom: 12 }}>
                <Text style={styles.bottomInfoLabel}>Name</Text>
                <Text style={styles.bottomInfoName}>Cillian Murphy</Text>
              </View>

              <View>
                <Text style={styles.bottomInfoLabel}>Price</Text>
                <Text style={styles.bottomInfoPrice}>{priceText}</Text>
              </View>
            </View>

            {/* REAL DYNAMIC MACHINE-READABLE QR CODE */}
            <View style={styles.qrCodeWrapper}>
              <DynamicQRCode value={qrPayload} size={76} />
            </View>
          </View>

          {/* BACK TO HOME BUTTON */}
          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => router.replace('/(tabs)')}
            activeOpacity={0.85}
          >
            <Text style={styles.doneBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </ScrollView>
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
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  ticketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  ticketTopSection: {
    padding: 24,
    paddingBottom: 16,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fieldLabel: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  movieTitleText: {
    color: '#8B2426',
    fontSize: 18,
    fontWeight: '800',
  },
  fieldRedValue: {
    color: '#8B2426',
    fontSize: 15,
    fontWeight: '700',
  },
  perforationWrapper: {
    height: 28,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    marginHorizontal: -1,
  },
  leftNotch: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.background,
    marginLeft: -13,
    zIndex: 2,
  },
  rightNotch: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.background,
    marginRight: -13,
    zIndex: 2,
  },
  dashedLine: {
    flex: 1,
    height: 1.5,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    marginHorizontal: 8,
  },
  ticketBottomSection: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 22,
    alignItems: 'center',
  },
  barcodeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 6,
  },
  barcodeLines: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginTop: 18,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomInfoLeft: {
    flex: 1,
  },
  bottomInfoLabel: {
    color: '#1F2228',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  bottomInfoName: {
    color: '#8B2426',
    fontSize: 17,
    fontWeight: '800',
  },
  bottomInfoPrice: {
    color: '#8B2426',
    fontSize: 19,
    fontWeight: '900',
  },
  qrCodeWrapper: {
    padding: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtn: {
    backgroundColor: Colors.primary,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
