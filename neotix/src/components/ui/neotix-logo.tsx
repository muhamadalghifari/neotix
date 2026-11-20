import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: ViewStyle;
}

export const NeotixLogo: React.FC<LogoProps> = ({ size = 'md', style }) => {
  const getDimensions = () => {
    switch (size) {
      case 'sm':
        return {
          boxWidth: 18,
          boxHeight: 20,
          fontSize: 18,
          letterSpacing: -0.3,
          boxPaddingTop: 1,
        };
      case 'lg':
        return {
          boxWidth: 42,
          boxHeight: 46,
          fontSize: 42,
          letterSpacing: -0.5,
          boxPaddingTop: 2,
        };
      case 'xl':
        return {
          boxWidth: 56,
          boxHeight: 62,
          fontSize: 58,
          letterSpacing: -1,
          boxPaddingTop: 3,
        };
      case 'md':
      default:
        return {
          boxWidth: 28,
          boxHeight: 32,
          fontSize: 28,
          letterSpacing: -0.5,
          boxPaddingTop: 1,
        };
    }
  };

  const dim = getDimensions();

  return (
    <View style={[styles.container, style]}>
      {/* Red rectangle hugging the 'N' */}
      <View
        style={[
          styles.redBox,
          {
            width: dim.boxWidth,
            height: dim.boxHeight,
            paddingTop: dim.boxPaddingTop,
          },
        ]}
      >
        <Text
          style={[
            styles.letterN,
            {
              fontSize: dim.fontSize,
              lineHeight: dim.fontSize * 1.05,
            },
          ]}
        >
          N
        </Text>
      </View>

      {/* 'eotix' letters with matching font geometry */}
      <Text
        style={[
          styles.restLetters,
          {
            fontSize: dim.fontSize,
            lineHeight: dim.fontSize * 1.05,
            letterSpacing: dim.letterSpacing,
          },
        ]}
      >
        eotix
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  redBox: {
    backgroundColor: '#9E2A2B', // Figma brick red
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 2,
    borderRadius: 2,
  },
  letterN: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontFamily: 'System',
    textAlign: 'center',
  },
  restLetters: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontFamily: 'System',
  },
});
