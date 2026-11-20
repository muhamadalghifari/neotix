import React from 'react';
import { Text, TextStyle } from 'react-native';

export type IconName =
  | 'search'
  | 'notifications-outline'
  | 'star'
  | 'home'
  | 'home-outline'
  | 'heart'
  | 'heart-outline'
  | 'grid'
  | 'grid-outline'
  | 'person'
  | 'person-outline'
  | 'chevron-back'
  | 'bookmark'
  | 'bookmark-outline';

interface AppIconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: TextStyle;
}

// Zero-dependency SVG/Unicode icon renderer for instant compatibility
export const AppIcon: React.FC<AppIconProps> = ({
  name,
  size = 20,
  color = '#FFFFFF',
  style,
}) => {
  const getGlyph = () => {
    switch (name) {
      case 'search':
        return '🔍';
      case 'notifications-outline':
        return '🔔';
      case 'star':
        return '★';
      case 'home':
      case 'home-outline':
        return '⌂';
      case 'heart':
      case 'heart-outline':
        return '♡';
      case 'grid':
      case 'grid-outline':
        return '⊞';
      case 'person':
      case 'person-outline':
        return '👤';
      case 'chevron-back':
        return '‹';
      case 'bookmark':
      case 'bookmark-outline':
        return '🔖';
      default:
        return '•';
    }
  };

  return (
    <Text
      style={[
        {
          fontSize: size,
          color,
          textAlign: 'center',
          includeFontPadding: false,
        },
        style,
      ]}
    >
      {getGlyph()}
    </Text>
  );
};
