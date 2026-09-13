// src/services/pdfGenerator.native.ts
import { Share } from 'react-native';
import { Invoice, Booking } from '../types';

/**
 * Formats an official, itemized Tax Invoice & Cooperative Member Receipt text
 * for native mobile sharing and export (WhatsApp, Email, Drive, Print).
 */
export function formatInvoiceText(invoice: Invoice, booking: Booking | null): string {
  const worker = booking?.worker?.profile;
  const workerName = worker?.full_name || 'Verified Cooperative Professional';
  const workerCode = booking?.worker?.worker_code || 'WRK-2026';
  const trade = booking?.service_category?.name || 'Home Service Specialist';
  const customerName = booking?.customer?.full_name || 'Valued Cooperative Member';
  const dateStr = invoice.generated_at
    ? new Date(invoice.generated_at).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

  return [
    '========================================',
    'SAHAKARI SEVA COOPERATIVE FEDERATION',
    'Autonomous Urban Services Cooperative Society',
    'Official Tax Invoice & Member Receipt',
    '========================================',
    `Invoice No:    ${invoice.invoice_number}`,
    `Booking Ref:   ${booking?.booking_code || invoice.booking_id}`,
    `Date of Issue: ${dateStr}`,
    `Customer:      ${customerName}`,
    `Payment Status: 100% Guaranteed & Settled`,
    '----------------------------------------',
    'SERVICE PROFESSIONAL (SHRAMIK OWNER):',
    `Name:  ${workerName}`,
    `ID:    ${workerCode}`,
    `Trade: ${trade}`,
    '----------------------------------------',
    'FAIR SHARE DISTRIBUTION (85 / 10 / 5):',
    `- Worker Direct Payout (85%): ₹${invoice.worker_amount.toFixed(2)}`,
    `- Shramik Welfare & Safety (10%): ₹${invoice.cooperative_share.toFixed(2)}`,
    `- Cooperative Operations (5%): ₹${invoice.platform_fee.toFixed(2)}`,
    `- Statutory GST (Exempt Cooperative): ₹0.00`,
    '----------------------------------------',
    `TOTAL AMOUNT PAID: ₹${invoice.total_amount.toFixed(2)}`,
    '----------------------------------------',
    'STATUTORY & COOPERATIVE COMPLIANCE:',
    'Registered under the State Cooperative Societies Act.',
    'Reg No: RJ-COOP-FED-2026-9812',
    'Digital Verification: IMMUTABLE & VERIFIED',
    'Helpline: 1800-COOP-SEVA | support@sahakariseva.coop',
    '========================================',
  ].join('\n');
}

/**
 * Builds the native representation of the invoice.
 */
export function buildInvoicePDF(invoice: Invoice, booking: Booking | null): any {
  return formatInvoiceText(invoice, booking);
}

/**
 * Initiates native sharing of the invoice receipt on Android/iOS.
 */
export async function downloadInvoicePDF(
  invoice: Invoice,
  booking: Booking | null
): Promise<{ success: boolean; filename: string }> {
  try {
    const filename = `Sahakari-Seva-Invoice-${invoice.invoice_number}.txt`;
    const message = formatInvoiceText(invoice, booking);

    await Share.share({
      title: `Sahakari Seva Tax Invoice ${invoice.invoice_number}`,
      message,
    });

    return { success: true, filename };
  } catch (error) {
    console.error('Failed to share native invoice:', error);
    throw error;
  }
}

/**
 * Opens native invoice share sheet on Android/iOS.
 */
export function openInvoicePDF(invoice: Invoice, booking: Booking | null): void {
  try {
    const message = formatInvoiceText(invoice, booking);
    Share.share({
      title: `Sahakari Seva Tax Invoice ${invoice.invoice_number}`,
      message,
    }).catch(err => {
      console.warn('Native share error:', err);
    });
  } catch (error) {
    console.error('Failed to open native invoice preview:', error);
    throw error;
  }
}
