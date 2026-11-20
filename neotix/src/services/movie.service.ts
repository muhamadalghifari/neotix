import { supabase } from '../lib/supabase';
import { Database } from '../types/database.types';

export type MovieRow = Database['public']['Tables']['movies']['Row'];
export type GenreRow = Database['public']['Tables']['genres']['Row'];
export type BranchRow = Database['public']['Tables']['cinema_branches']['Row'];

export const MovieService = {
  /**
   * Fetch all active movies with genres
   */
  async getActiveMovies(): Promise<MovieRow[]> {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .eq('is_active', true)
      .order('release_date', { ascending: false });

    if (error) {
      console.error('Error fetching movies:', error.message);
      throw error;
    }

    return data || [];
  },

  /**
   * Fetch movie by ID
   */
  async getMovieById(movieId: string): Promise<MovieRow | null> {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .eq('id', movieId)
      .single();

    if (error) {
      console.error('Error fetching movie by ID:', error.message);
      return null;
    }

    return data;
  },

  /**
   * Fetch all movie genres
   */
  async getGenres(): Promise<GenreRow[]> {
    const { data, error } = await supabase
      .from('genres')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching genres:', error.message);
      return [];
    }

    return data || [];
  },

  /**
   * Fetch all active cinema branches
   */
  async getBranches(): Promise<BranchRow[]> {
    const { data, error } = await supabase
      .from('cinema_branches')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching branches:', error.message);
      return [];
    }

    return data || [];
  },
};
