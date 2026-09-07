// ==============================================================================
// LANGUAGE SELECTOR MODAL — ENGLISH + 7 INDIAN LANGUAGES
// Staggered entrance animation, instant selection, glitch-free cross-fade
// switch handled by the LanguageSwitchProvider overlay.
// ==============================================================================

import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Check, X, Globe } from 'lucide-react-native';
import { FadeInView, useLanguageSwitch } from '../../animations';
import { SUPPORTED_LANGUAGES } from '../../i18n';
import { useTheme } from '../../theme';
import type { Palette } from '../../theme';

interface LanguageModalProps {
  visible: boolean;
  onClose: () => void;
}

const LANGUAGE_META: Record<string, { name: string; sub: string }> = {
  en: { name: 'English', sub: 'Default platform language' },
  hi: { name: 'हिन्दी', sub: 'Hindi — भारत की राष्ट्रभाषा' },
  bn: { name: 'বাংলা', sub: 'Bengali — বাংলা ভাষা' },
  ta: { name: 'தமிழ்', sub: 'Tamil — தமிழ் மொழி' },
  te: { name: 'తెలుగు', sub: 'Telugu — తెలుగు భాష' },
  mr: { name: 'मराठी', sub: 'Marathi — मराठी भाषा' },
  gu: { name: 'ગુજરાતી', sub: 'Gujarati — ગુજરાતી ભાષા' },
  kn: { name: 'ಕನ್ನಡ', sub: 'Kannada — ಕನ್ನಡ ಭಾಷೆ' },
};

export const LanguageModal: React.FC<LanguageModalProps> = ({ visible, onClose }) => {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { switchLanguage } = useLanguageSwitch();

  const selectLanguage = (lng: string) => {
    switchLanguage(lng as any);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalBox}>
          <View style={styles.modalHeader}>
            <View style={styles.titleRow}>
              <Globe size={18} color={colors.primary} />
              <Text style={styles.modalTitle}>{t('common.language')}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalSub}>
            {t('lang.en')} + 7 Indian Languages
          </Text>

          <ScrollView style={styles.langScroll} showsVerticalScrollIndicator={false}>
            {SUPPORTED_LANGUAGES.map((lng, index) => {
              const meta = LANGUAGE_META[lng];
              const isSelected = i18n.language === lng;
              return (
                <FadeInView key={lng} delay={40 + index * 45} distance={10} duration={280}>
                  <TouchableOpacity
                    style={[styles.langOption, isSelected && styles.selectedOption]}
                    onPress={() => selectLanguage(lng)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.flagDot}>
                      <Text style={styles.flagDotText}>{lng.toUpperCase().slice(0, 2)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.langName, isSelected && styles.selectedName]}>
                        {meta.name}
                      </Text>
                      <Text style={styles.langSub}>{meta.sub}</Text>
                    </View>
                    <View style={[styles.radio, isSelected && styles.radioSelected]}>
                      {isSelected && <Check size={13} color={colors.textInverse} />}
                    </View>
                  </TouchableOpacity>
                </FadeInView>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: Palette) => StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    width: '100%',
    maxWidth: 360,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modalSub: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: 12,
  },
  closeBtn: {
    padding: 4,
  },
  langScroll: {
    maxHeight: 420,
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: 8,
    backgroundColor: colors.surfaceSubtle,
  },
  selectedOption: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  flagDot: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagDotText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textInverse,
    letterSpacing: 0.5,
  },
  langName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  selectedName: {
    color: colors.primary,
  },
  langSub: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
});

export default LanguageModal;