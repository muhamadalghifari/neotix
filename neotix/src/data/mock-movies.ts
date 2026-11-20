export interface CastMember {
  id: string;
  name: string;
  character: string;
  avatarUrl: string;
}

export interface Movie {
  id: string;
  title: string;
  rating: number;
  synopsis: string;
  director: string;
  writer: string;
  genres: string[];
  durationMinutes: number;
  posterUrl: string;
  backdropUrl?: string;
  cast: CastMember[];
  price: number;
}

export const MOCK_GENRES = [
  'Horror',
  'Action',
  'Drama',
  'Comedy',
  'Sci-Fi',
  'Romance',
  'Animation',
];

export const MOCK_MOVIES: Movie[] = [
  {
    id: 'spiderman-no-way-home',
    title: 'Spider-Man: No Way Home',
    rating: 4.1,
    synopsis:
      'Spider-Man seeks Doctor Strange’s help after his identity is exposed, but a failed spell opens the multiverse and brings dangerous villains from other worlds.',
    director: 'Jon Watts',
    writer: 'Chris McKenna',
    genres: ['Action', 'Sci-Fi', 'Adventure'],
    durationMinutes: 148,
    posterUrl: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=800&auto=format&fit=crop&q=80',
    cast: [
      {
        id: '1',
        name: 'Tom Holland',
        character: 'Peter Parker',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
      },
      {
        id: '2',
        name: 'Zendaya',
        character: 'MJ',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
      },
      {
        id: '3',
        name: 'Benedict Cumberbatch',
        character: 'Doctor Strange',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      },
      {
        id: '4',
        name: 'Jacob Batalon',
        character: 'Ned Leeds',
        avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80',
      },
    ],
    price: 20,
  },
  {
    id: 'avatar-way-of-water',
    title: 'Avatar: The Way of Water',
    rating: 3.8,
    synopsis:
      'Jake Sully lives with his newfound family formed on the extrasolar moon Pandora. Once a familiar threat returns to finish what was previously started, Jake must work with Neytiri and the army of the Na\'vi race to protect their home.',
    director: 'James Cameron',
    writer: 'James Cameron, Rick Jaffa',
    genres: ['Action', 'Adventure', 'Sci-Fi'],
    durationMinutes: 192,
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    cast: [
      {
        id: '1',
        name: 'Sam Worthington',
        character: 'Jake Sully',
        avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
      },
      {
        id: '2',
        name: 'Zoe Saldana',
        character: 'Neytiri',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      },
    ],
    price: 22,
  },
  {
    id: 'la-la-land',
    title: 'La La Land',
    rating: 4.0,
    synopsis:
      'While navigating their careers in Los Angeles, a pianist and an actress fall in love while attempting to reconcile their aspirations for the future.',
    director: 'Damien Chazelle',
    writer: 'Damien Chazelle',
    genres: ['Drama', 'Romance', 'Comedy'],
    durationMinutes: 128,
    posterUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
    cast: [
      {
        id: '1',
        name: 'Ryan Gosling',
        character: 'Sebastian',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
      },
      {
        id: '2',
        name: 'Emma Stone',
        character: 'Mia',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
      },
    ],
    price: 18,
  },
  {
    id: 'interstellar',
    title: 'Interstellar',
    rating: 4.6,
    synopsis:
      'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.',
    director: 'Christopher Nolan',
    writer: 'Jonathan Nolan, Christopher Nolan',
    genres: ['Sci-Fi', 'Drama', 'Adventure'],
    durationMinutes: 169,
    posterUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
    cast: [
      {
        id: '1',
        name: 'Matthew McConaughey',
        character: 'Cooper',
        avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
      },
      {
        id: '2',
        name: 'Anne Hathaway',
        character: 'Brand',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      },
    ],
    price: 20,
  },
];
