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
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppIcon } from '../../components/ui/app-icon';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';
import { MovieService, MovieRow } from '../../services/movie.service';
import { MOCK_MOVIES } from '../../data/mock-movies';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const POSTER_HEIGHT = Math.round(SCREEN_WIDTH * 1.05);

export default function MovieDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [movie, setMovie] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDetail() {
      if (!id) return;
      try {
        setIsLoading(true);
        // 1. Try fetching from Supabase
        const dbMovie = await MovieService.getMovieById(id);
        if (dbMovie) {
          setMovie({
            id: dbMovie.id,
            title: dbMovie.title,
            rating: Number(dbMovie.rating_score) || 8.0,
            synopsis: dbMovie.synopsis || '',
            posterUrl: dbMovie.poster_url || '',
            backdropUrl: dbMovie.backdrop_url || '',
            director: 'Denis Villeneuve',
            writer: 'Frank Herbert',
            cast: [
              {
                id: '1',
                name: 'Timothée Chalamet',
                character: 'Paul Atreides',
                avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
              },
              {
                id: '2',
                name: 'Zendaya',
                character: 'Chani',
                avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
              },
              {
                id: '3',
                name: 'Rebecca Ferguson',
                character: 'Lady Jessica',
                avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
              },
              {
                id: '4',
                name: 'Javier Bardem',
                character: 'Stilgar',
                avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
              },
            ],
            price: 15,
          });
        } else {
          // 2. Check local mock fallback
          const local = MOCK_MOVIES.find((m) => m.id === id) || MOCK_MOVIES[0];
          setMovie(local);
        }
      } catch (err) {
        console.warn('Error loading movie detail:', err);
        const local = MOCK_MOVIES.find((m) => m.id === id) || MOCK_MOVIES[0];
        setMovie(local);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDetail();
  }, [id]);

  const handleReservation = () => {
    if (!movie) return;
    router.push({
      pathname: '/booking/seat-selection',
      params: { movieId: movie.id },
    } as any);
  };

  if (isLoading || !movie) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* FIXED TOP FLOATING HEADER */}
      <SafeAreaView edges={['top']} style={styles.floatingHeader}>
        <TouchableOpacity
          style={styles.circleBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <AppIcon name="chevron-back" size={26} color="#FFFFFF" style={styles.backIcon} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.circleBtn}
          onPress={() => setIsBookmarked(!isBookmarked)}
          activeOpacity={0.8}
        >
          <AppIcon
            name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={18}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO POSTER */}
        <View style={styles.posterContainer}>
          <Image
            source={{ uri: movie.posterUrl }}
            style={styles.posterImage}
            contentFit="cover"
            transition={300}
          />
          <View style={styles.posterOverlay} />
        </View>

        {/* MOVIE TITLE & RATING ROW */}
        <View style={styles.titleRow}>
          <Text style={styles.movieTitle}>{movie.title}</Text>
          <View style={styles.ratingBox}>
            <AppIcon name="star" size={18} color={Colors.star} style={styles.starIcon} />
            <Text style={styles.ratingText}>{Number(movie.rating).toFixed(1)}</Text>
          </View>
        </View>

        {/* SYNOPSIS DESCRIPTION */}
        <Text style={styles.synopsisText}>{movie.synopsis}</Text>

        {/* DIRECTOR & WRITER ROW */}
        <View style={styles.crewRow}>
          <Text style={styles.crewText}>
            <Text style={styles.crewLabel}>Director: </Text>
            <Text style={styles.crewValue}>{movie.director}</Text>
          </Text>
          <View style={styles.crewDivider} />
          <Text style={styles.crewText}>
            <Text style={styles.crewLabel}>Writer: </Text>
            <Text style={styles.crewValue}>{movie.writer}</Text>
          </Text>
        </View>

        {/* DIVIDER LINE */}
        <View style={styles.sectionDivider} />

        {/* STARRING SECTION */}
        <Text style={styles.sectionHeading}>Starring</Text>

        {/* 2-COLUMN CAST GRID */}
        <View style={styles.castGrid}>
          {movie.cast.map((actor: any) => (
            <View key={actor.id} style={styles.castCard}>
              <Image
                source={{ uri: actor.avatarUrl }}
                style={styles.castAvatar}
                contentFit="cover"
              />
              <View style={styles.castInfo}>
                <Text style={styles.castName} numberOfLines={1}>
                  {actor.name}
                </Text>
                <Text style={styles.castCharacter} numberOfLines={1}>
                  {actor.character}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* FLOATING BOTTOM BAR WITH RESERVATION BUTTON */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.reservationButton}
          onPress={handleReservation}
          activeOpacity={0.88}
        >
          <Text style={styles.reservationButtonText}>Reservation</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === 'android' ? 12 : 6,
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(50, 55, 66, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  backIcon: {
    marginRight: 2,
    marginTop: -2,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  posterContainer: {
    width: SCREEN_WIDTH,
    height: POSTER_HEIGHT,
    position: 'relative',
    backgroundColor: '#15171C',
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },
  posterOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'transparent',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    gap: 12,
  },
  movieTitle: {
    flex: 1,
    color: Colors.text,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 4,
  },
  starIcon: {
    marginRight: 6,
  },
  ratingText: {
    color: Colors.star,
    fontSize: 16,
    fontWeight: '700',
  },
  synopsisText: {
    color: '#D4D7DE',
    fontSize: 14,
    lineHeight: 22,
    paddingHorizontal: Spacing.lg,
    marginTop: 12,
  },
  crewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginTop: 18,
  },
  crewText: {
    fontSize: 13,
  },
  crewLabel: {
    color: Colors.textMuted,
  },
  crewValue: {
    color: Colors.text,
    fontWeight: '600',
  },
  crewDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#4A505C',
    marginHorizontal: 10,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#2F343E',
    marginHorizontal: Spacing.lg,
    marginVertical: 18,
  },
  sectionHeading: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: Spacing.lg,
    marginBottom: 14,
  },
  castGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    justifyContent: 'space-between',
    rowGap: 14,
  },
  castCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: (SCREEN_WIDTH - Spacing.lg * 2 - 12) / 2,
  },
  castAvatar: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: Colors.surfaceElevated,
    marginRight: 10,
  },
  castInfo: {
    flex: 1,
  },
  castName: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  castCharacter: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 32 : 18,
    paddingTop: 12,
    backgroundColor: 'rgba(31, 34, 40, 0.92)',
  },
  reservationButton: {
    backgroundColor: Colors.primary,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  reservationButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
