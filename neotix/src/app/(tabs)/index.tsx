import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AppIcon } from '../../components/ui/app-icon';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';
import { MovieService, MovieRow, GenreRow } from '../../services/movie.service';
import { MOCK_MOVIES, Movie } from '../../data/mock-movies';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.round(SCREEN_WIDTH * 0.64);
const CARD_HEIGHT = Math.round(CARD_WIDTH * 1.48);
const CARD_SPACING = 14;
const ITEM_SIZE = CARD_WIDTH + CARD_SPACING;

const LOOP_MULTIPLIER = 30;

export default function HomeScreen() {
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [movies, setMovies] = useState<any[]>([]);
  const [genres, setGenres] = useState<GenreRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const carouselRef = useRef<FlatList>(null);

  // Load movies from Supabase on mount
  useEffect(() => {
    async function loadCatalog() {
      try {
        setIsLoading(true);
        const [dbMovies, dbGenres] = await Promise.all([
          MovieService.getActiveMovies(),
          MovieService.getGenres(),
        ]);

        if (dbMovies && dbMovies.length > 0) {
          // Format DB movies
          const formatted = dbMovies.map((m) => ({
            id: m.id,
            title: m.title,
            rating: Number(m.rating_score) || 8.0,
            synopsis: m.synopsis || '',
            posterUrl: m.poster_url || '',
            backdropUrl: m.backdrop_url || '',
            durationMinutes: m.duration_minutes,
            director: 'Denis Villeneuve',
            writer: 'Frank Herbert',
            cast: [],
            price: 15,
          }));
          setMovies(formatted);
        } else {
          // Fallback to local mock if DB is empty
          setMovies(MOCK_MOVIES);
        }

        setGenres(dbGenres);
      } catch (err) {
        console.warn('Falling back to local mock data:', err);
        setMovies(MOCK_MOVIES);
      } finally {
        setIsLoading(false);
      }
    }

    loadCatalog();
  }, []);

  // Filter movies based on search query
  const filteredMovies = useMemo(() => {
    return movies.filter((movie) => {
      return movie.title.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [movies, searchQuery]);

  // Repeated list for smooth infinite looping
  const infiniteMovies = useMemo(() => {
    if (filteredMovies.length === 0) return [];
    const repeated: any[] = [];
    for (let i = 0; i < LOOP_MULTIPLIER; i++) {
      repeated.push(...filteredMovies);
    }
    return repeated;
  }, [filteredMovies]);

  // Initial scroll to middle copy
  useEffect(() => {
    if (infiniteMovies.length > 0 && carouselRef.current) {
      const middleCopyIndex = Math.floor(LOOP_MULTIPLIER / 2) * filteredMovies.length;
      setTimeout(() => {
        carouselRef.current?.scrollToOffset({
          offset: middleCopyIndex * ITEM_SIZE,
          animated: false,
        });
      }, 150);
    }
  }, [filteredMovies.length, infiniteMovies.length]);

  const activeMovie = filteredMovies[activeIndex % (filteredMovies.length || 1)] || filteredMovies[0];

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const rawIndex = Math.round(offsetX / ITEM_SIZE);
    if (filteredMovies.length > 0) {
      const normalizedIndex =
        ((rawIndex % filteredMovies.length) + filteredMovies.length) % filteredMovies.length;
      if (normalizedIndex !== activeIndex) {
        setActiveIndex(normalizedIndex);
      }
    }
  };

  const handleMoviePress = (movie: any) => {
    router.push({
      pathname: '/movie/[id]',
      params: { id: movie.id },
    } as any);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* TOP SEARCH & NOTIFICATION ROW */}
        <View style={styles.topBar}>
          <View style={styles.searchContainer}>
            <AppIcon name="search" size={16} color={Colors.textMuted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              placeholderTextColor={Colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity style={styles.notificationBtn} activeOpacity={0.8}>
            <AppIcon name="notifications-outline" size={20} color={Colors.text} />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>

        {/* GENRE FILTER PILLS */}
        <View style={styles.genreContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.genreScroll}
          >
            {['All', ...genres.map((g) => g.name)].map((genreName) => {
              const isSelected = genreName === selectedGenre;
              return (
                <TouchableOpacity
                  key={genreName}
                  style={[
                    styles.genrePill,
                    isSelected ? styles.genrePillActive : styles.genrePillInactive,
                  ]}
                  onPress={() => setSelectedGenre(genreName)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.genreText,
                      isSelected ? styles.genreTextActive : styles.genreTextInactive,
                    ]}
                  >
                    {genreName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* SECTION TITLE: "Showing this month" */}
        <Text style={styles.sectionTitle}>Showing this month</Text>

        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading movies...</Text>
          </View>
        ) : (
          <>
            {/* MOVIE POSTER INFINITE LOOP CAROUSEL */}
            <View style={styles.carouselContainer}>
              <FlatList
                ref={carouselRef}
                data={infiniteMovies}
                keyExtractor={(_, index) => `live-movie-${index}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={ITEM_SIZE}
                decelerationRate="fast"
                contentContainerStyle={styles.carouselContent}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                getItemLayout={(_, index) => ({
                  length: ITEM_SIZE,
                  offset: ITEM_SIZE * index,
                  index,
                })}
                renderItem={({ item, index }) => {
                  const isCurrent =
                    (index % (filteredMovies.length || 1)) === activeIndex;

                  return (
                    <TouchableOpacity
                      activeOpacity={0.9}
                      style={[
                        styles.cardWrapper,
                        {
                          width: CARD_WIDTH,
                          height: CARD_HEIGHT,
                          transform: [{ scale: isCurrent ? 1 : 0.94 }],
                          opacity: isCurrent ? 1 : 0.75,
                        },
                      ]}
                      onPress={() => handleMoviePress(item)}
                    >
                      <Image
                        source={{ uri: item.posterUrl }}
                        style={styles.posterImage}
                        contentFit="cover"
                        transition={200}
                      />
                    </TouchableOpacity>
                  );
                }}
              />
            </View>

            {/* ACTIVE MOVIE INFO & RATING */}
            {activeMovie && (
              <View style={styles.activeMovieInfo}>
                <Text style={styles.activeMovieTitle}>{activeMovie.title}</Text>
                <View style={styles.ratingRow}>
                  <AppIcon name="star" size={18} color={Colors.star} style={styles.starIcon} />
                  <Text style={styles.ratingText}>{Number(activeMovie.rating).toFixed(1)}</Text>
                </View>
              </View>
            )}

            {/* PAGINATION DOTS */}
            <View style={styles.paginationRow}>
              {filteredMovies.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i === activeIndex ? styles.dotActive : styles.dotInactive,
                  ]}
                />
              ))}
            </View>
          </>
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
  },
  loaderContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.textMuted,
    fontSize: 14,
    marginTop: 10,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 14,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 15,
    paddingVertical: 0,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.badgeNotification,
  },
  genreContainer: {
    marginTop: 18,
  },
  genreScroll: {
    paddingHorizontal: Spacing.lg,
    gap: 8,
  },
  genrePill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
  },
  genrePillActive: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: '#4A5260',
  },
  genrePillInactive: {
    backgroundColor: Colors.surfaceElevated,
    opacity: 0.7,
  },
  genreText: {
    fontSize: 14,
    fontWeight: '500',
  },
  genreTextActive: {
    color: Colors.text,
  },
  genreTextInactive: {
    color: Colors.textMuted,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 21,
    fontWeight: '700',
    paddingHorizontal: Spacing.lg,
    marginTop: 22,
    marginBottom: 14,
  },
  carouselContainer: {
    alignItems: 'center',
  },
  carouselContent: {
    paddingHorizontal: (SCREEN_WIDTH - CARD_WIDTH) / 2,
  },
  cardWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: CARD_SPACING,
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },
  activeMovieInfo: {
    alignItems: 'center',
    marginTop: 18,
    paddingHorizontal: Spacing.lg,
  },
  activeMovieTitle: {
    color: Colors.text,
    fontSize: 19,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  starIcon: {
    marginRight: 6,
  },
  ratingText: {
    color: Colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 28,
    backgroundColor: Colors.text,
  },
  dotInactive: {
    width: 6,
    backgroundColor: '#4A505C',
  },
});
