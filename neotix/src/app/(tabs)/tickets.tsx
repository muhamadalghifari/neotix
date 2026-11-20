import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppIcon } from '../../components/ui/app-icon';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

interface BookingRecord {
  id: string;
  booking_code: string;
  status: string;
  total_amount: number;
  created_at: string;
  screening: {
    start_time: string;
    movie: {
      title: string;
      poster_url: string;
    };
    auditorium: {
      name: string;
      branch: {
        name: string;
      };
    };
  };
  tickets: Array<{
    ticket_code: string;
    booking_item: {
      seat: {
        row_label: string;
        seat_number: number;
      };
    };
  }>;
}

export default function TicketsHistoryScreen() {
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMyTickets();
  }, []);

  const loadMyTickets = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        // If not logged in, fetch confirmed sample tickets
        const { data, error } = await (supabase.from('bookings') as any)
          .select(`
            id,
            booking_code,
            status,
            total_amount,
            created_at,
            screening:screenings (
              start_time,
              movie:movies (
                title,
                poster_url
              ),
              auditorium:auditoriums (
                name,
                branch:cinema_branches (
                  name
                )
              )
            ),
            tickets (
              ticket_code
            )
          `)
          .order('created_at', { ascending: false })
          .limit(10);

        if (!error && data) {
          setBookings(data);
        }
      } else {
        const { data, error } = await (supabase.from('bookings') as any)
          .select(`
            id,
            booking_code,
            status,
            total_amount,
            created_at,
            screening:screenings (
              start_time,
              movie:movies (
                title,
                poster_url
              ),
              auditorium:auditoriums (
                name,
                branch:cinema_branches (
                  name
                )
              )
            ),
            tickets (
              ticket_code
            )
          `)
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (!error && data) {
          setBookings(data);
        }
      }
    } catch (err) {
      console.warn('Error loading tickets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTicketPress = (booking: any) => {
    router.push({
      pathname: '/ticket/[id]',
      params: {
        id: booking.booking_code,
        movieTitle: booking.screening?.movie?.title || 'Dune: Part Two',
        seats: 'Auditorium 1',
        totalPrice: `$${Number(booking.total_amount).toFixed(2)}`,
      },
    } as any);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" />
      <View style={styles.container}>
        <Text style={styles.screenHeading}>My Tickets</Text>

        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading your passes...</Text>
          </View>
        ) : bookings.length === 0 ? (
          <View style={styles.centerContainer}>
            <AppIcon name="bookmark-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No Tickets Yet</Text>
            <Text style={styles.emptySubtitle}>
              When you book movie sessions, your digital passes will appear here.
            </Text>
            <TouchableOpacity
              style={styles.exploreBtn}
              onPress={() => router.push('/(tabs)')}
              activeOpacity={0.85}
            >
              <Text style={styles.exploreBtnText}>Browse Movies</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={bookings}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const movieTitle = item.screening?.movie?.title || 'Movie Pass';
              const posterUrl = item.screening?.movie?.poster_url;
              const branchName = item.screening?.auditorium?.branch?.name || 'Neotix Cinema';
              const showDate = item.screening?.start_time
                ? new Date(item.screening.start_time).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Upcoming Session';

              return (
                <TouchableOpacity
                  style={styles.ticketCard}
                  onPress={() => handleTicketPress(item)}
                  activeOpacity={0.88}
                >
                  <Image
                    source={{ uri: posterUrl || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400' }}
                    style={styles.cardPoster}
                    contentFit="cover"
                  />
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardCode}>CODE: {item.booking_code}</Text>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {movieTitle}
                    </Text>
                    <Text style={styles.cardBranch}>{branchName}</Text>
                    <Text style={styles.cardDate}>{showDate}</Text>

                    <View style={styles.cardBottomRow}>
                      <View
                        style={[
                          styles.statusBadge,
                          item.status === 'confirmed'
                            ? styles.statusConfirmed
                            : styles.statusPending,
                        ]}
                      >
                        <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
                      </View>
                      <Text style={styles.cardPrice}>
                        ${Number(item.total_amount).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
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
    paddingHorizontal: Spacing.lg,
  },
  screenHeading: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: '800',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  loadingText: {
    color: Colors.textMuted,
    fontSize: 14,
    marginTop: 12,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
  },
  emptySubtitle: {
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  exploreBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
  },
  exploreBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  listContent: {
    paddingBottom: Spacing.xxl,
    gap: 14,
  },
  ticketCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    flexDirection: 'row',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  cardPoster: {
    width: 76,
    height: 108,
    borderRadius: 10,
    backgroundColor: Colors.surfaceElevated,
  },
  cardInfo: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  cardCode: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  cardTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  cardBranch: {
    color: '#ACB3BE',
    fontSize: 12,
    fontWeight: '500',
  },
  cardDate: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusConfirmed: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  statusPending: {
    backgroundColor: 'rgba(234, 179, 8, 0.2)',
  },
  statusText: {
    color: '#4ADE80',
    fontSize: 10,
    fontWeight: '800',
  },
  cardPrice: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
});
