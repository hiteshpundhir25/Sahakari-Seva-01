// mobile/src/components/common/RatingModal.tsx
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, makeTypography, radii, spacing } from '../../theme';
import type { Palette } from '../../theme';
import { Button, RatingStars } from '../ui';
import { ApiClient } from '../../services/apiClient';
import { FadeInView } from '../../animations';

export interface RatingModalProps {
  visible: boolean;
  bookingId: string;
  workerId: string;
  customerId: string;
  workerName?: string;
  customerName?: string;
  onClose: () => void;
  onSubmitted?: () => void;
}

const QUICK_TAG_KEYS = ['punctual', 'skilled', 'fair_price', 'polite', 'clean_work', 'emergency_fast'];

export const RatingModal: React.FC<RatingModalProps> = ({
  visible,
  bookingId,
  workerId,
  customerId,
  workerName = 'Worker',
  customerName = 'Customer',
  onClose,
  onSubmitted,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['punctual', 'skilled']);
  const [submitting, setSubmitting] = useState(false);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await ApiClient.createRating({
        booking_id: bookingId,
        customer_id: customerId,
        worker_id: workerId,
        rating,
        feedback: feedback || t('ratings.default_feedback'),
        tags: QUICK_TAG_KEYS
          .filter(k => selectedTags.includes(k))
          .map(k => t(`ratings.tags.${k}`)),
        customer_name: customerName,
      });
      Alert.alert(t('ratings.submitted_title'), t('ratings.submitted_msg'));
      if (onSubmitted) onSubmitted();
      onClose();
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message || t('ratings.error_submit'));
    } finally {
      setSubmitting(false);
    }
  };

  const ratingLabel =
    rating === 5
      ? t('ratings.exceptional')
      : rating === 4
      ? t('ratings.very_good')
      : t('ratings.stars', { rating });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <FadeInView style={styles.sheetWrap} distance={20} duration={280}>
          <View style={styles.sheet}>
            <Text style={styles.badge}>{t('ratings.coop_quality')}</Text>
            <Text style={styles.title}>{t('ratings.rate_prefix', { name: workerName })}</Text>
            <Text style={styles.subtitle}>{t('ratings.subtitle')}</Text>

            {/* Interactive Star Rating */}
            <View style={styles.starsContainer}>
              <RatingStars
                rating={rating}
                size={36}
                interactive
                onRatingChange={newRating => setRating(newRating)}
              />
              <Text style={styles.ratingValueText}>{ratingLabel}</Text>
            </View>

            {/* Quick Tag Pills */}
            <Text style={styles.sectionLabel}>{t('ratings.highlights')}</Text>
            <View style={styles.tagsRow}>
              {QUICK_TAG_KEYS.map(key => {
                const tag = t(`ratings.tags.${key}`);
                const isSelected = selectedTags.includes(key);
                return (
                  <TouchableOpacity
                    key={key}
                    activeOpacity={0.7}
                    onPress={() => toggleTag(key)}
                    style={[styles.tagPill, isSelected && styles.tagPillSelected]}
                  >
                    <Text style={[styles.tagText, isSelected && styles.tagTextSelected]}>
                      {isSelected ? '✓ ' : '+ '}{tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Feedback Text Input */}
            <Text style={styles.sectionLabel}>{t('ratings.written_feedback')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('ratings.feedback_placeholder')}
              placeholderTextColor={colors.textMuted}
              value={feedback}
              onChangeText={setFeedback}
              multiline
              numberOfLines={3}
            />

            {/* Actions */}
            <View style={styles.actionsRow}>
              <Button
                title={t('ratings.cancel')}
                variant="outline"
                size="md"
                onPress={onClose}
                style={{ flex: 1 }}
              />
              <Button
                title={t('ratings.submit')}
                variant="primary"
                size="md"
                loading={submitting}
                onPress={handleSubmit}
                style={{ flex: 1.5 }}
              />
            </View>
          </View>
        </FadeInView>
      </View>
    </Modal>
  );
};

const createStyles = (colors: Palette) => {
  const typography = makeTypography(colors);
  return StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  sheetWrap: {
    width: '100%',
    maxWidth: 420,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.xl,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  badge: {
    ...typography.fontCaption,
    color: colors.primary,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: spacing.xxs,
  },
  title: {
    ...typography.fontHeadline,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.fontBodySm,
    marginBottom: spacing.lg,
  },
  starsContainer: {
    alignItems: 'center',
    marginVertical: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radii.md,
  },
  ratingValueText: {
    ...typography.fontSubtitle,
    color: colors.secondaryDark,
    marginTop: spacing.xs,
  },
  sectionLabel: {
    ...typography.fontSubtitle,
    fontSize: 12,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  tagPill: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagPillSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  tagText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  tagTextSelected: {
    color: colors.primaryDark,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    padding: spacing.sm,
    fontSize: 13,
    color: colors.textPrimary,
    minHeight: 70,
    textAlignVertical: 'top',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  });
};

export default RatingModal;