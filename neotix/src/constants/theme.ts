/**
 * Design Tokens for Neotix
 */

export const Colors = {
  // Theme compatibility for template hooks
  light: {
    background: '#1F2228',
    text: '#FFFFFF',
    tint: '#A82D2F',
    icon: '#8E95A2',
    tabIconDefault: '#8E95A2',
    tabIconSelected: '#FFFFFF',
  },
  dark: {
    background: '#1F2228',
    text: '#FFFFFF',
    tint: '#A82D2F',
    icon: '#8E95A2',
    tabIconDefault: '#8E95A2',
    tabIconSelected: '#FFFFFF',
  },

  // Backgrounds
  background: '#1F2228',       // Main dark charcoal screen background
  backgroundSecondary: '#181A1F',// Deeper charcoal
  surface: '#282C35',          // Cards & surface panels
  surfaceElevated: '#323742',  // Search bars, back button pill, inactive pills
  
  // Brand & Accents
  primary: '#A82D2F',          // Neotix Red
  primaryDark: '#8B2426',
  primaryLight: '#C3393B',
  
  // Text
  text: '#FFFFFF',             // Primary headings and labels
  textMuted: '#959CA8',        // Secondary descriptions, subtitles
  textDark: '#1A1D24',         // Text on light ticket cards
  
  // Cinema Seat States
  seatAvailable: '#FFFFFF',    // White
  seatReserved: '#6C7584',     // Greyed out
  seatSelected: '#A82D2F',     // Red
  
  // Feedback & Functional
  star: '#F5C518',             // Movie rating star
  badgeNotification: '#E53935',// Red notification dot
  border: '#2C323D',           // Subdued dividers
  
  // Ticket Surface
  ticketWhite: '#FFFFFF',
  ticketTextPrimary: '#8B2426',
  ticketTextMuted: '#9E9E9E',
  
  // Bottom Bar
  bottomBarBg: '#32363F',
  bottomBarActive: '#FFFFFF',
  bottomBarInactive: '#8A919E',
};

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 20,
  six: 24,
  xs: 4,
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  xxl: 36,
};

export const Typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 18,
    xl: 22,
    xxl: 28,
    title: 34,
  },
};

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Fonts = {
  body: 'System',
  heading: 'System',
};

export type ThemeColor = keyof typeof Colors.light;
export const BottomTabInset = 60;
export const MaxContentWidth = 600;
