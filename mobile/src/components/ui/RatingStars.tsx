// mobile/src/components/ui/RatingStars.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme, spacing } from '../../theme';
import type { Palette } from '../../theme';

export interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  showCount?: boolean;
  count?: number;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  maxRating = 5,
  size = 16,
  interactive = false,
  onRatingChange,
  showCount = false,
  count,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const stars = [];

  for (let i = 1; i <= maxRating; i++) {
    const isFilled = i <= Math.round(rating);
    const starNode = (
      <Text
        key={i}
        style={[
          styles.star,
          {
            fontSize: size,
            color: isFilled ? colors.warning : colors.border,
          },
        ]}
      >
        ★
      </Text>
    );

    if (interactive && onRatingChange) {
      stars.push(
        <TouchableOpacity
          key={i}
          activeOpacity={0.7}
          onPress={() => onRatingChange(i)}
          style={styles.touchable}
        >
          {starNode}
        </TouchableOpacity>
      );
    } else {
      stars.push(starNode);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.starsRow}>{stars}</View>
      {!interactive && (
        <Text style={[styles.ratingNumber, { fontSize: size * 0.85 }]}>
          {rating.toFixed(1)}
        </Text>
      )}
      {showCount && count !== undefined && (
        <Text style={[styles.countText, { fontSize: size * 0.75 }]}>
          ({count})
        </Text>
      )}
    </View>
  );
};

const createStyles = (colors: Palette) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  touchable: {
    padding: 2,
  },
  star: {
    marginHorizontal: 1,
  },
  ratingNumber: {
    fontWeight: '700',
    color: colors.textPrimary,
    marginLeft: spacing.xs,
  },
  countText: {
    color: colors.textMuted,
  },
});

export default RatingStars;
