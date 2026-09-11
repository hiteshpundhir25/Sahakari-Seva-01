import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Share,
  Alert,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Download,
  Printer,
  FileText,
  CheckCircle2,
  Share2,
} from 'lucide-react-native';
import { radii, spacing, makeTypography, useTheme } from '../../theme';
import type { Palette } from '../../theme';
import { Card, Button, Badge } from '../../components/ui';
import { ApiClient } from '../../services/apiClient';
import { Invoice, Booking } from '../../types';
import { translateTrade } from '../../i18n';
import { downloadInvoicePDF, openInvoicePDF } from '../../services/pdfGenerator';

type RouteParams = {
  Invoice: { bookingId: string };
};

export const InvoiceScreen: React.FC = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const typography = makeTypography(colors);
  const styles = createStyles(colors, typography);
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'Invoice'>>();
  const bookingId = route.params?.bookingId;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!bookingId) return;
      setLoading(true);
      try {
        const [inv, b] = await Promise.all([
          ApiClient.getInvoice(bookingId),
          ApiClient.getBookingById(bookingId),
        ]);
        setInvoice(inv);
        setBooking(b || null);
      } catch {
        // Handled in ApiClient fallback
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [bookingId]);

  const handleDownloadPDF = async () => {
    if (!invoice) return;
    setDownloading(true);
    setDownloadSuccess(null);
    try {
      const result = await downloadInvoicePDF(invoice, booking);
      setDownloadSuccess(result.filename);
      setTimeout(() => setDownloadSuccess(null), 6000);
    } catch {
      Alert.alert(t('invoice.title', 'Tax Invoice'), 'Could not generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrintPDF = () => {
    if (!invoice) return;
    try {
      openInvoicePDF(invoice, booking);
    } catch {
      Alert.alert(t('invoice.title', 'Tax Invoice'), 'Could not open print preview.');
    }
  };

  const handleShare = async () => {
    if (!invoice) return;
    try {
      await Share.share({
        message: t('invoice.share_message', {
          invoice: invoice.invoice_number,
          total: invoice.total_amount.toFixed(2),
          worker: invoice.worker_amount.toFixed(2),
          welfare: invoice.cooperative_share.toFixed(2),
          platform: invoice.platform_fee.toFixed(2),
        }),
      });
    } catch {
      Alert.alert(t('invoice.title'), t('invoice.share_success'));
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('invoice.generating')}</Text>
      </View>
    );
  }

  if (!invoice) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{t('invoice.not_found')}</Text>
        <Button
          title={t('invoice.go_back')}
          variant="outline"
          onPress={() => navigation.goBack()}
          style={{ marginTop: spacing.md }}
        />
      </View>
    );
  }

  return (
    <View style={styles.screenWrapper}>
      {/* Top Header / Back Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('CustomerTabs');
            }
          }}
          accessibilityRole="button"
          accessibilityLabel={t('common.back', 'Back')}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft size={20} color={colors.textPrimary} />
          <Text style={styles.backButtonText}>{t('common.back', 'Back')}</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          {invoice.invoice_number}
        </Text>
        <TouchableOpacity
          style={styles.topDownloadBtn}
          onPress={handleDownloadPDF}
          disabled={downloading}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Download PDF"
        >
          {downloading ? (
            <ActivityIndicator size="small" color="#047857" />
          ) : (
            <>
              <Download size={14} color="#047857" />
              <Text style={styles.topDownloadBtnText}>PDF</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Printable Receipt Paper Card */}
      <Card style={styles.receiptCard}>
        {/* Cooperative Official Header */}
        <View style={styles.receiptHeader}>
          <View style={styles.coopIconCircle}>
            <Text style={styles.coopIcon}>🏛️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.coopName}>{t('invoice.coop_name')}</Text>
            <Text style={styles.coopReg}>{t('invoice.reg_no')}</Text>
            <Text style={styles.coopAddress}>{t('invoice.coop_address')}</Text>
          </View>
        </View>

        <View style={styles.typeTagRow}>
          <Badge label={t('invoice.official_tag')} variant="success" size="sm" />
          <Badge label={t('invoice.paid_tag')} variant="success" size="sm" />
        </View>

        <View style={styles.divider} />

        {/* Invoice Meta */}
        <View style={styles.metaRow}>
          <View>
            <Text style={styles.metaLabel}>{t('invoice.invoice_number')}</Text>
            <Text style={styles.metaValueBold}>{invoice.invoice_number}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.metaLabel}>{t('invoice.date_issued')}</Text>
            <Text style={styles.metaValue}>
              {new Date(invoice.generated_at).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Parties */}
        <View style={styles.partiesContainer}>
          <View style={styles.partyBox}>
            <Text style={styles.partyRole}>{t('invoice.billed_to')}</Text>
            <Text style={styles.partyName}>{booking?.customer?.full_name || t('roles.customer')}</Text>
            <Text style={styles.partySub}>{booking?.address || 'Connaught Place'}</Text>
            <Text style={styles.partySub}>{booking?.city} - {booking?.pincode}</Text>
          </View>

          <View style={styles.partyBox}>
            <Text style={styles.partyRole}>{t('invoice.service_professional')}</Text>
            <Text style={styles.partyName}>{booking?.worker?.profile?.full_name || 'Rahul Sharma'}</Text>
            <Text style={styles.partySub}>{booking?.worker?.worker_code || 'WRK-DEL-0101'}</Text>
            <Text style={styles.partySub}>{t('invoice.trade_label')}: {translateTrade(booking?.service_category?.name) || t('trades.electrical')}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Service & Itemized Supplemental Parts Breakdown */}
        <Text style={styles.sectionHeader}>Service Tasks & Approved Work</Text>

        <View style={styles.lineItemRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.lineItemTitle}>
              Base Inspection & Service: {translateTrade(booking?.service_category?.name) || 'Home Maintenance'}
            </Text>
            <Text style={styles.lineItemDesc}>Scheduled primary labor and diagnosis</Text>
          </View>
          <Text style={styles.lineItemAmount}>
            ₹{Number(booking?.estimated_amount || invoice.subtotal).toFixed(2)}
          </Text>
        </View>

        {booking?.supplemental_bill?.status === 'approved' &&
          booking.supplemental_bill.items?.map((item, idx) => (
            <View key={item.id || idx} style={styles.lineItemRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.lineItemTitle, { color: colors.textPrimary }]}>
                  + {item.title}
                </Text>
                <Text style={styles.lineItemDesc}>
                  {item.type === 'part' ? 'Authorized Spare Part' : 'Supplemental Repair Labor'}
                  {item.description ? ` • ${item.description}` : ''}
                </Text>
              </View>
              <Text style={[styles.lineItemAmount, { color: '#10b981', fontWeight: '800' }]}>
                +₹{Number(item.cost).toFixed(2)}
              </Text>
            </View>
          ))}

        <View style={styles.divider} />

        {/* Line Items & Breakdown */}
        <Text style={styles.sectionHeader}>{t('invoice.distribution_header')}</Text>

        <View style={styles.lineItemRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.lineItemTitle}>{t('invoice.worker_payout')}</Text>
            <Text style={styles.lineItemDesc}>{t('invoice.worker_payout_desc')}</Text>
          </View>
          <Text style={styles.lineItemAmount}>₹{invoice.worker_amount.toFixed(2)}</Text>
        </View>

        <View style={styles.lineItemRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.lineItemTitle}>{t('invoice.welfare_fund')}</Text>
            <Text style={styles.lineItemDesc}>{t('invoice.welfare_fund_desc')}</Text>
          </View>
          <Text style={styles.lineItemAmount}>₹{invoice.cooperative_share.toFixed(2)}</Text>
        </View>

        <View style={styles.lineItemRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.lineItemTitle}>{t('invoice.platform_fee')}</Text>
            <Text style={styles.lineItemDesc}>{t('invoice.platform_fee_desc')}</Text>
          </View>
          <Text style={styles.lineItemAmount}>₹{invoice.platform_fee.toFixed(2)}</Text>
        </View>

        <View style={styles.lineItemRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.lineItemTitle}>{t('invoice.gst')}</Text>
            <Text style={styles.lineItemDesc}>{t('invoice.gst_desc')}</Text>
          </View>
          <Text style={styles.lineItemAmount}>₹0.00</Text>
        </View>

        <View style={styles.dividerThick} />

        {/* Total */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{t('invoice.total_paid')}</Text>
          <Text style={styles.totalAmount}>₹{invoice.total_amount.toFixed(2)}</Text>
        </View>

        {/* Cooperative Seal */}
        <View style={styles.sealBox}>
          <Text style={styles.sealIcon}>🛡️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.sealTitle}>{t('invoice.seal_title')}</Text>
            <Text style={styles.sealDesc}>
              {t('invoice.seal_desc')}
            </Text>
          </View>
        </View>
      </Card>

      {/* Official PDF Export Card */}
      <Card style={styles.pdfBannerCard}>
        <View style={styles.pdfBannerTop}>
          <View style={styles.pdfBadgeCircle}>
            <FileText size={22} color="#047857" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.pdfTitleRow}>
              <Text style={styles.pdfBannerTitle}>
                {t('invoice.pdf_banner_title', 'Official Cooperative PDF Tax Receipt')}
              </Text>
              <Badge label="A4 PDF" variant="success" size="sm" />
            </View>
            <Text style={styles.pdfBannerDesc}>
              {t(
                'invoice.pdf_banner_desc',
                'Government-recognized A4 tax invoice featuring registration credentials, itemized billing, digital seal, and the 85/10/5 fair wage split.'
              )}
            </Text>
          </View>
        </View>

        {downloadSuccess ? (
          <View style={styles.downloadSuccessBox}>
            <CheckCircle2 size={16} color="#047857" />
            <Text style={styles.downloadSuccessText}>
              {t('invoice.download_success', 'Official PDF Invoice downloaded successfully')}: {downloadSuccess}
            </Text>
          </View>
        ) : null}

        <View style={styles.pdfActionRow}>
          <TouchableOpacity
            style={[styles.downloadPdfBtn, downloading && styles.downloadPdfBtnDisabled]}
            onPress={handleDownloadPDF}
            disabled={downloading}
            activeOpacity={0.85}
          >
            {downloading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Download size={18} color="#ffffff" />
            )}
            <Text style={styles.downloadPdfBtnText}>
              {downloading
                ? t('invoice.downloading_pdf', 'Generating PDF...')
                : t('invoice.download_pdf', 'Download Official PDF')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.printPdfBtn}
            onPress={handlePrintPDF}
            activeOpacity={0.8}
          >
            <Printer size={17} color={colors.textPrimary} />
            <Text style={styles.printPdfBtnText}>
              {t('invoice.print_pdf', 'Preview / Print')}
            </Text>
          </TouchableOpacity>
        </View>
      </Card>

      {/* Action Buttons & Secondary Options */}
      <View style={styles.bottomNavRow}>
        <TouchableOpacity
          style={styles.shareTextBtn}
          onPress={handleShare}
          activeOpacity={0.75}
        >
          <Share2 size={16} color={colors.textSecondary} />
          <Text style={styles.shareTextBtnText}>
            {t('invoice.share_receipt', 'Share Summary')}
          </Text>
        </TouchableOpacity>

        <Button
          title={t('invoice.back_to_job', 'Back to Booking')}
          variant="outline"
          size="md"
          onPress={() => navigation.goBack()}
          style={{ flex: 1 }}
        />
      </View>
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: Palette, typography: ReturnType<typeof makeTypography>) => StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    minWidth: 60,
  },
  backButtonText: {
    ...typography.fontBodySm,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  topBarTitle: {
    ...typography.fontTitle,
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    flex: 1,
  },
  topBarRightPlaceholder: {
    minWidth: 60,
  },
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
  errorText: {
    ...typography.fontTitle,
    color: colors.danger,
  },
  receiptCard: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  receiptHeader: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  coopIconCircle: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coopIcon: {
    fontSize: 22,
  },
  coopName: {
    ...typography.fontTitle,
    fontSize: 15,
  },
  coopReg: {
    ...typography.fontCaption,
    color: colors.textSecondary,
  },
  coopAddress: {
    ...typography.fontCaption,
    color: colors.textMuted,
    fontSize: 9,
  },
  typeTagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  dividerThick: {
    height: 2,
    backgroundColor: colors.textPrimary,
    marginVertical: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  metaLabel: {
    ...typography.fontCaption,
    color: colors.textMuted,
  },
  metaValueBold: {
    ...typography.fontSubtitle,
    fontFamily: 'Courier',
    marginTop: 2,
  },
  metaValue: {
    ...typography.fontBodySm,
    fontWeight: '500',
    marginTop: 2,
  },
  partiesContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  partyBox: {
    flex: 1,
    backgroundColor: colors.surfaceSubtle,
    padding: spacing.sm,
    borderRadius: radii.sm,
  },
  partyRole: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 2,
  },
  partyName: {
    ...typography.fontSubtitle,
    fontSize: 13,
  },
  partySub: {
    ...typography.fontCaption,
    color: colors.textSecondary,
  },
  sectionHeader: {
    ...typography.fontCaption,
    color: colors.primaryDark,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  lineItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: spacing.xs,
  },
  lineItemTitle: {
    ...typography.fontBodySm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  lineItemDesc: {
    ...typography.fontCaption,
    color: colors.textMuted,
    marginTop: 1,
  },
  lineItemAmount: {
    ...typography.fontSubtitle,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  totalLabel: {
    ...typography.fontHeadline,
    fontSize: 18,
  },
  totalAmount: {
    ...typography.fontDisplay,
    fontSize: 24,
    color: colors.primary,
  },
  sealBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: radii.sm,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  sealIcon: {
    fontSize: 26,
  },
  sealTitle: {
    ...typography.fontSubtitle,
    fontSize: 13,
    color: colors.primaryDark,
  },
  sealDesc: {
    ...typography.fontCaption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  topDownloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#d1fae5',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  topDownloadBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#047857',
  },
  pdfBannerCard: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderColor: '#a7f3d0',
    borderWidth: 1.5,
    borderRadius: 16,
    marginBottom: spacing.md,
  },
  pdfBannerTop: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  pdfBadgeCircle: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdfTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  pdfBannerTitle: {
    ...typography.fontSubtitle,
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
    marginRight: 6,
  },
  pdfBannerDesc: {
    ...typography.fontCaption,
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 15,
  },
  downloadSuccessBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginVertical: spacing.xs,
  },
  downloadSuccessText: {
    ...typography.fontCaption,
    color: '#047857',
    fontWeight: '600',
    flex: 1,
  },
  pdfActionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  downloadPdfBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#047857',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    shadowColor: '#047857',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  downloadPdfBtnDisabled: {
    opacity: 0.65,
  },
  downloadPdfBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  printPdfBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  printPdfBtnText: {
    ...typography.fontBodySm,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  bottomNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  shareTextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  shareTextBtnText: {
    ...typography.fontBodySm,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});

export default InvoiceScreen;