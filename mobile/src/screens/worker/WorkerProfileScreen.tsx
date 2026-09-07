// mobile/src/screens/worker/WorkerProfileScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { radii, spacing, makeTypography, useTheme } from '../../theme';
import type { Palette } from '../../theme';
import { Card, Button, Badge } from '../../components/ui';
import { ApiClient } from '../../services/apiClient';
import { Worker } from '../../types';
import { useTranslation } from 'react-i18next';

export const WorkerProfileScreen: React.FC = () => {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const typography = makeTypography(colors);
  const styles = createStyles(colors, typography, isDark);
  const [worker, setWorker] = useState<Worker | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable Form Fields
  const [bio, setBio] = useState('');
  const [skillCategory, setSkillCategory] = useState('');
  const [hourlyRate, setHourlyRate] = useState('350');
  const [serviceArea, setServiceArea] = useState('');
  const [pincode, setPincode] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [certName, setCertName] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const w = await ApiClient.getWorkerById('w0000000-0000-0000-0000-000000000001');
        if (w) {
          setWorker(w);
          setBio(w.bio || 'Govt ITI certified electrician with 8+ years experience in domestic and commercial troubleshooting.');
          setSkillCategory(w.skill_category || 'Electrical');
          setHourlyRate(String(w.hourly_or_base_rate || 350));
          setServiceArea(w.service_area || 'C-Scheme, Jaipur (MI Road)');
          setPincode(w.pincode || '302001');
          setSkillsInput((w.skills || []).join(', '));
          setCertName(w.certification_name || 'Govt ITI National Trade Certificate');
        }
      } catch {
        // Handled in ApiClient fallback
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSimulateCertUpload = () => {
    Alert.alert(
      t('workerProfile.doc_upload_title'),
      t('workerProfile.doc_upload_msg'),
      [
        {
          text: t('workerProfile.doc_ntc'),
          onPress: () => {
            setCertName('National Trade Certificate (Electrician) - ITI Pusa');
            Alert.alert(t('workerProfile.uploaded_title'), t('workerProfile.uploaded_ntc'));
          },
        },
        {
          text: t('workerProfile.doc_nsdc'),
          onPress: () => {
            setCertName('NSDC Skill India Certified Level 4');
            Alert.alert(t('workerProfile.uploaded_title'), t('workerProfile.uploaded_nsdc'));
          },
        },
        { text: t('workerProfile.cancel'), style: 'cancel' },
      ]
    );
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      Alert.alert(
        t('workerProfile.profile_saved_title'),
        t('workerProfile.profile_saved_msg')
      );
    }, 600);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('workerProfile.loading')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Cooperative Digital ID Card */}
      <Card style={styles.idCard}>
        <View style={styles.idCardHeader}>
          <View style={styles.idAvatar}>
            <Text style={styles.idAvatarText}>
              {(worker?.profile?.full_name || 'Rahul Sharma').slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.idNameRow}>
              <Text style={styles.idName}>{worker?.profile?.full_name || 'Rahul Sharma'}</Text>
              <Badge label={t('workerProfile.id_verified')} variant="success" size="sm" />
            </View>
            <Text style={styles.idCode}>{worker?.worker_code || 'WRK-JPR-0101'}</Text>
            <Text style={styles.idCoop}>Jaipur Shramik Sahakari Sangh</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>{t('workerProfile.experience_label')}</Text>
            <Text style={styles.statVal}>{t('workerProfile.years', { count: worker?.experience_years || 8 })}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>{t('workerProfile.jobs_label')}</Text>
            <Text style={styles.statVal}>{worker?.total_jobs || 142}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>{t('workerProfile.rating_label')}</Text>
            <Text style={styles.statVal}>★ {worker?.average_rating || 4.9}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>{t('workerProfile.standby_label')}</Text>
            <Text style={styles.statValSuccess}>{worker?.availability_status || 'available'}</Text>
          </View>
        </View>
      </Card>

      {/* Profile Form */}
      <Card style={styles.formCard}>
        <Text style={styles.sectionTitle}>{t('workerProfile.trade_profile_title')}</Text>

        <Text style={styles.label}>{t('workerProfile.primary_trade')}</Text>
        <TextInput
          style={styles.input}
          value={skillCategory}
          onChangeText={setSkillCategory}
          placeholder="e.g. Electrical, Plumbing"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>{t('workerProfile.base_rate_label')}</Text>
        <TextInput
          style={styles.input}
          value={hourlyRate}
          onChangeText={setHourlyRate}
          keyboardType="numeric"
          placeholder="350"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>{t('workerProfile.skills_label')}</Text>
        <TextInput
          style={styles.input}
          value={skillsInput}
          onChangeText={setSkillsInput}
          placeholder="House Wiring, MCB Fix, Inverter Cabling"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>{t('workerProfile.coverage_label')}</Text>
        <TextInput
          style={styles.input}
          value={serviceArea}
          onChangeText={setServiceArea}
          placeholder="C-Scheme, Jaipur"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>{t('workerProfile.pincode_label')}</Text>
        <TextInput
          style={styles.input}
          value={pincode}
          onChangeText={setPincode}
          keyboardType="numeric"
          placeholder="110001"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>{t('workerProfile.bio_label')}</Text>
        <TextInput
          style={[styles.input, styles.bioInput]}
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={3}
          placeholder={t('workerProfile.bio_placeholder')}
          placeholderTextColor={colors.textMuted}
        />
      </Card>

      {/* Certification Verification Document Box */}
      <Card style={styles.certCard}>
        <Text style={styles.sectionTitle}>{t('workerProfile.cert_title')}</Text>
        <Text style={styles.certDesc}>{t('workerProfile.cert_desc')}</Text>

        <View style={styles.attachedDocRow}>
          <Text style={styles.docIcon}>📄</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.docTitle}>{certName || 'ITI Certificate (Attached)'}</Text>
            <Text style={styles.docStatus}>{t('workerProfile.verified_by')}</Text>
          </View>
        </View>

        <Button
          title={t('workerProfile.attach_replace')}
          variant="outline"
          size="sm"
          onPress={handleSimulateCertUpload}
          style={{ marginTop: spacing.sm }}
        />
      </Card>

      {/* Submit Button */}
      <Button
        title={t('workerProfile.save_profile')}
        variant="primary"
        size="lg"
        loading={saving}
        onPress={handleSave}
        style={{ marginTop: spacing.md }}
      />
    </ScrollView>
  );
};

const createStyles = (colors: Palette, typography: ReturnType<typeof makeTypography>, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  loadingText: {
    ...typography.fontBody,
    marginTop: spacing.md,
    color: colors.textSecondary,
  },
  idCard: {
    padding: spacing.lg,
    backgroundColor: isDark ? '#1e1b4b' : colors.primaryDark,
    borderColor: colors.primary,
    marginBottom: spacing.md,
  },
  idCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  idAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  idAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  idNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  idName: {
    ...typography.fontHeadline,
    fontSize: 18,
    color: '#ffffff',
  },
  idCode: {
    fontSize: 11,
    color: '#dcfce7',
    fontFamily: 'Courier',
    marginTop: 2,
  },
  idCoop: {
    ...typography.fontCaption,
    color: '#bbf7d0',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: radii.sm,
    padding: spacing.sm,
    justifyContent: 'space-between',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 9,
    color: '#dcfce7',
    fontWeight: '600',
  },
  statVal: {
    ...typography.fontSubtitle,
    color: '#ffffff',
    marginTop: 2,
  },
  statValSuccess: {
    ...typography.fontSubtitle,
    color: '#86efac',
    textTransform: 'capitalize',
    marginTop: 2,
  },
  formCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.fontSubtitle,
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.fontCaption,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 3,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceSubtle,
  },
  bioInput: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  certCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  certDesc: {
    ...typography.fontBodySm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  attachedDocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  docIcon: {
    fontSize: 22,
  },
  docTitle: {
    ...typography.fontSubtitle,
    fontSize: 13,
  },
  docStatus: {
    ...typography.fontCaption,
    color: colors.success,
    marginTop: 2,
  },
});

export default WorkerProfileScreen;