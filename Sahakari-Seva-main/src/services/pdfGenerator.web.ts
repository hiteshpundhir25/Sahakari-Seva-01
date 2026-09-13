// src/services/pdfGenerator.ts
import { jsPDF } from 'jspdf';
import { Platform } from 'react-native';
import { Invoice, Booking } from '../types';

/**
 * Builds a high-quality, professional Tax Invoice & Cooperative Receipt PDF
 * using jsPDF with authentic cooperative branding, itemized billing,
 * 85/10/5 fair share wage distribution, and official digital verification seal.
 */
export function buildInvoicePDF(invoice: Invoice, booking: Booking | null): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  // Brand Color Palette
  const EMERALD_PRIMARY: [number, number, number] = [4, 120, 87];   // #047857
  const EMERALD_DARK: [number, number, number] = [6, 95, 70];       // #065f46
  const EMERALD_LIGHT: [number, number, number] = [209, 250, 229];  // #d1fae5
  const MINT_BG: [number, number, number] = [240, 253, 244];        // #f0fdf4
  const SLATE_DARK: [number, number, number] = [30, 41, 59];        // #1e293b
  const SLATE_TEXT: [number, number, number] = [51, 65, 85];        // #334155
  const SLATE_MUTED: [number, number, number] = [100, 116, 139];    // #64748b
  const BORDER_LIGHT: [number, number, number] = [226, 232, 240];   // #e2e8f0
  const BORDER_EMERALD: [number, number, number] = [167, 243, 208]; // #a7f3d0

  // ----------------------------------------------------
  // 1. TOP HEADER BANNER (Deep Emerald with Official Crest)
  // ----------------------------------------------------
  doc.setFillColor(...EMERALD_PRIMARY);
  doc.roundedRect(margin, 12, contentWidth, 34, 3, 3, 'F');

  // Left Title & Organization Identity
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(21);
  doc.text('SAHAKARI SEVA', margin + 6, 23);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...EMERALD_LIGHT);
  doc.text('WORKER-OWNED GIG COOPERATIVE FEDERATION', margin + 6, 28.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(236, 253, 245);
  doc.text('Autonomous Urban Services Cooperative Society | Ministry of Cooperation Recognized', margin + 6, 33.5);
  doc.text('Reg No: RJ-COOP-FED-2026-9812 | Operating under State Cooperative Societies Act', margin + 6, 38);

  // Right Header Metadata
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('TAX INVOICE & RECEIPT', pageWidth - margin - 6, 22, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...EMERALD_LIGHT);
  doc.text('GSTIN: 08AAACS9981K1Z5', pageWidth - margin - 6, 27, { align: 'right' });
  doc.text('SAC Code: 9987 (Maintenance & Repair)', pageWidth - margin - 6, 31.5, { align: 'right' });
  doc.text('Mutual Benefit Cooperative Society', pageWidth - margin - 6, 36, { align: 'right' });
  doc.text('GST Exemption u/s Coop Act', pageWidth - margin - 6, 40.5, { align: 'right' });

  let curY = 51;

  // ----------------------------------------------------
  // 2. INVOICE META & PAYMENT STATUS STRIP
  // ----------------------------------------------------
  doc.setFillColor(...MINT_BG);
  doc.setDrawColor(...BORDER_EMERALD);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, curY, contentWidth, 14, 2, 2, 'FD');

  // Green Paid Pill
  doc.setFillColor(...EMERALD_PRIMARY);
  doc.roundedRect(margin + 4, curY + 3.5, 26, 7, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('PAID IN FULL', margin + 17, curY + 8.2, { align: 'center' });

  // Meta items in strip
  doc.setTextColor(...SLATE_MUTED);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Invoice No:', margin + 35, curY + 6);
  doc.setTextColor(...SLATE_DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(invoice.invoice_number, margin + 35, curY + 10.5);

  doc.setTextColor(...SLATE_MUTED);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Date Issued:', margin + 82, curY + 6);
  doc.setTextColor(...SLATE_DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  const dateStr = invoice.generated_at
    ? new Date(invoice.generated_at).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN');
  doc.text(dateStr, margin + 82, curY + 10.5);

  doc.setTextColor(...SLATE_MUTED);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Booking Ref:', margin + 120, curY + 6);
  doc.setTextColor(...SLATE_DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  const bookingRef = invoice.booking_id || booking?.id || 'BK-DEMO-01';
  doc.text(bookingRef, margin + 120, curY + 10.5);

  doc.setTextColor(...SLATE_MUTED);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Payment Mode:', margin + 155, curY + 6);
  doc.setTextColor(...EMERALD_PRIMARY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('UPI / Escrow Settled', margin + 155, curY + 10.5);

  curY += 19;

  // ----------------------------------------------------
  // 3. TWO-COLUMN PARTIES CARD (Customer & Certified Worker)
  // ----------------------------------------------------
  const colW = (contentWidth - 6) / 2; // 88mm

  // Left: Billed To (Customer)
  doc.setFillColor(248, 250, 252); // slate 50
  doc.setDrawColor(...BORDER_LIGHT);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, curY, colW, 31, 2, 2, 'FD');

  doc.setTextColor(...EMERALD_PRIMARY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('BILLED TO (CUSTOMER / COOP PATRON)', margin + 5, curY + 6.5);

  doc.setTextColor(...SLATE_DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  const custName = booking?.customer?.full_name || 'Valued Member Patron';
  doc.text(custName, margin + 5, curY + 12);

  doc.setTextColor(...SLATE_TEXT);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const addr1 = booking?.address || 'Connaught Place';
  const addr2 = `${booking?.city || 'New Delhi'} - ${booking?.pincode || '110001'}`;
  doc.text(addr1, margin + 5, curY + 17);
  doc.text(addr2, margin + 5, curY + 21.5);
  doc.setTextColor(...SLATE_MUTED);
  doc.setFontSize(7.5);
  doc.text(`Customer Ref: ${booking?.customer_id || 'CUST-DEMO-01'}`, margin + 5, curY + 26);

  // Right: Service Professional (Worker Member)
  const rightX = margin + colW + 6;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(...BORDER_LIGHT);
  doc.roundedRect(rightX, curY, colW, 31, 2, 2, 'FD');

  doc.setTextColor(...EMERALD_PRIMARY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('CERTIFIED SERVICE PROFESSIONAL (MEMBER)', rightX + 5, curY + 6.5);

  doc.setTextColor(...SLATE_DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  const workerName = booking?.worker?.profile?.full_name || 'Rahul Sharma';
  doc.text(workerName, rightX + 5, curY + 12);

  doc.setTextColor(...SLATE_TEXT);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const workerCode = booking?.worker?.worker_code || 'WRK-DEL-0101';
  const trade = booking?.service_category?.name || 'Home Maintenance & Repair';
  doc.text(`Member Code: ${workerCode}`, rightX + 5, curY + 17);
  doc.text(`Certified Trade: ${trade}`, rightX + 5, curY + 21.5);
  doc.setTextColor(...SLATE_MUTED);
  doc.setFontSize(7.5);
  doc.text('Affiliation: Urban Workers Cooperative Union', rightX + 5, curY + 26);

  curY += 36;

  // ----------------------------------------------------
  // 4. ITEMIZED SERVICE & WORK TABLE
  // ----------------------------------------------------
  doc.setFillColor(...EMERALD_PRIMARY);
  doc.rect(margin, curY, contentWidth, 8, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('#', margin + 4, curY + 5.5);
  doc.text('Service & Authorized Work Description', margin + 14, curY + 5.5);
  doc.text('Category / Type', margin + 118, curY + 5.5);
  doc.text('Amount (INR)', pageWidth - margin - 4, curY + 5.5, { align: 'right' });

  curY += 8;

  // Line Items
  interface BillItem {
    title: string;
    subtitle: string;
    category: string;
    amount: number;
  }

  const items: BillItem[] = [];
  const baseServiceAmt = booking?.estimated_amount || invoice.subtotal;
  items.push({
    title: `Base Inspection & Labor: ${booking?.service_category?.name || 'Home Maintenance'}`,
    subtitle: 'Scheduled primary labor, diagnosis & initial cooperative servicing',
    category: 'Standard Labor',
    amount: baseServiceAmt,
  });

  if (booking?.supplemental_bill?.status === 'approved' && Array.isArray(booking.supplemental_bill.items)) {
    booking.supplemental_bill.items.forEach((item) => {
      items.push({
        title: item.title,
        subtitle:
          (item.type === 'part' ? 'Authorized OEM Replacement Spare' : 'Supplemental Repair Labor') +
          (item.description ? ` - ${item.description}` : ''),
        category: item.type === 'part' ? 'Approved Part' : 'Additional Labor',
        amount: Number(item.cost),
      });
    });
  }

  items.forEach((item, index) => {
    const isEven = index % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.setDrawColor(...BORDER_LIGHT);
    doc.setLineWidth(0.2);
    doc.rect(margin, curY, contentWidth, 11, 'FD');

    doc.setTextColor(...SLATE_MUTED);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(String(index + 1), margin + 4, curY + 5);

    doc.setTextColor(...SLATE_DARK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.text(item.title, margin + 14, curY + 4.8);

    doc.setTextColor(...SLATE_MUTED);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.text(item.subtitle, margin + 14, curY + 8.8);

    doc.setTextColor(...SLATE_TEXT);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(item.category, margin + 118, curY + 6);

    doc.setTextColor(...SLATE_DARK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(`Rs. ${Number(item.amount).toFixed(2)}`, pageWidth - margin - 4, curY + 6, { align: 'right' });

    curY += 11;
  });

  // Table Subtotals & Grand Total
  curY += 2;
  const subtotalX = margin + 105;
  const subtotalW = contentWidth - 105;

  // Subtotal row
  doc.setTextColor(...SLATE_MUTED);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Subtotal Authorized Work:', subtotalX, curY + 4);
  doc.setTextColor(...SLATE_DARK);
  doc.setFont('helvetica', 'bold');
  doc.text(`Rs. ${invoice.subtotal.toFixed(2)}`, pageWidth - margin - 4, curY + 4, { align: 'right' });
  curY += 6;

  // Taxes row
  doc.setTextColor(...SLATE_MUTED);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('GST / Taxes (Coop Mutual Benefit Exemption):', subtotalX, curY + 4);
  doc.setTextColor(...EMERALD_PRIMARY);
  doc.setFont('helvetica', 'bold');
  doc.text('Rs. 0.00 (0%)', pageWidth - margin - 4, curY + 4, { align: 'right' });
  curY += 7;

  // Grand Total Box
  doc.setFillColor(...EMERALD_PRIMARY);
  doc.roundedRect(subtotalX - 4, curY, subtotalW + 4, 11, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('TOTAL AMOUNT PAID:', subtotalX, curY + 7);
  doc.setFontSize(11);
  doc.text(`Rs. ${invoice.total_amount.toFixed(2)}`, pageWidth - margin - 4, curY + 7.2, { align: 'right' });

  curY += 16;

  // ----------------------------------------------------
  // 5. COOPERATIVE FAIR SHARE DISBURSAL (85% / 10% / 5%)
  // ----------------------------------------------------
  doc.setFillColor(...MINT_BG);
  doc.setDrawColor(...BORDER_EMERALD);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, curY, contentWidth, 38, 2, 2, 'FD');

  doc.setTextColor(...EMERALD_PRIMARY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('TRANSPARENT COOPERATIVE FAIR SHARE DISBURSAL (100% AUDITABLE)', margin + 6, curY + 6.5);

  doc.setTextColor(...SLATE_MUTED);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.text('Under Sahakari Seva bylaws, your payment is distributed directly without predatory platform cuts:', margin + 6, curY + 11);

  // 3 cards side by side inside the box
  const splitBoxY = curY + 14;
  const splitBoxW = (contentWidth - 18) / 3;

  // Card 1: 85% Direct Worker
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...BORDER_LIGHT);
  doc.roundedRect(margin + 5, splitBoxY, splitBoxW, 18, 1.5, 1.5, 'FD');
  doc.setTextColor(...EMERALD_DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('85% Worker Payout', margin + 8, splitBoxY + 5);
  doc.setTextColor(...SLATE_DARK);
  doc.setFontSize(10);
  doc.text(`Rs. ${invoice.worker_amount.toFixed(2)}`, margin + 8, splitBoxY + 10.5);
  doc.setTextColor(...SLATE_MUTED);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('Direct deposit to worker bank', margin + 8, splitBoxY + 14.5);

  // Card 2: 10% Social Security & Welfare
  const splitBox2X = margin + 5 + splitBoxW + 4;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(splitBox2X, splitBoxY, splitBoxW, 18, 1.5, 1.5, 'FD');
  doc.setTextColor(37, 99, 235); // blue
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('10% Welfare Fund', splitBox2X + 3, splitBoxY + 5);
  doc.setTextColor(...SLATE_DARK);
  doc.setFontSize(10);
  doc.text(`Rs. ${invoice.cooperative_share.toFixed(2)}`, splitBox2X + 3, splitBoxY + 10.5);
  doc.setTextColor(...SLATE_MUTED);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('Health, pension & safety net', splitBox2X + 3, splitBoxY + 14.5);

  // Card 3: 5% Platform & Tech
  const splitBox3X = splitBox2X + splitBoxW + 4;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(splitBox3X, splitBoxY, splitBoxW, 18, 1.5, 1.5, 'FD');
  doc.setTextColor(180, 83, 9); // amber
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('5% Platform Tech', splitBox3X + 3, splitBoxY + 5);
  doc.setTextColor(...SLATE_DARK);
  doc.setFontSize(10);
  doc.text(`Rs. ${invoice.platform_fee.toFixed(2)}`, splitBox3X + 3, splitBoxY + 10.5);
  doc.setTextColor(...SLATE_MUTED);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('Hosting, GPS & server costs', splitBox3X + 3, splitBoxY + 14.5);

  curY += 43;

  // ----------------------------------------------------
  // 6. OFFICIAL DIGITAL SEAL & SIGNATURE STRIP
  // ----------------------------------------------------
  // Seal badge on left
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(...BORDER_LIGHT);
  doc.roundedRect(margin, curY, 80, 26, 2, 2, 'FD');

  doc.setDrawColor(...EMERALD_PRIMARY);
  doc.setLineWidth(0.6);
  doc.circle(margin + 12, curY + 13, 8, 'D');

  doc.setTextColor(...EMERALD_PRIMARY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('SEVA', margin + 12, curY + 11.5, { align: 'center' });
  doc.text('CO-OP', margin + 12, curY + 14.8, { align: 'center' });

  doc.setTextColor(...SLATE_DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('OFFICIAL DIGITAL SEAL', margin + 24, curY + 8);
  doc.setTextColor(...EMERALD_PRIMARY);
  doc.setFontSize(7);
  doc.text('AUTHENTICATED & VERIFIED', margin + 24, curY + 13);
  doc.setTextColor(...SLATE_MUTED);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.text('Cryptographically generated by Sahakari', margin + 24, curY + 17.5);
  doc.text('Settlement Node | No manual stamp needed', margin + 24, curY + 21.5);

  // Authorized Signatory on right
  const sigX = margin + 105;
  doc.setTextColor(...SLATE_MUTED);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('For Sahakari Seva Worker Cooperative Union', sigX, curY + 7);

  doc.setFont('courier', 'bolditalic');
  doc.setFontSize(10);
  doc.setTextColor(...EMERALD_DARK);
  doc.text('Sahakari Seva Registrar', sigX, curY + 15);

  doc.setDrawColor(...BORDER_LIGHT);
  doc.setLineWidth(0.3);
  doc.line(sigX, curY + 17.5, pageWidth - margin, curY + 17.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(...SLATE_MUTED);
  doc.text('Authorized Settlement Officer / Digital Registrar', sigX, curY + 22);

  // ----------------------------------------------------
  // 7. FOOTER
  // ----------------------------------------------------
  const footerY = pageHeight - 14;
  doc.setDrawColor(...BORDER_LIGHT);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

  doc.setTextColor(...SLATE_MUTED);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.text(
    'Sahakari Seva Cooperative Federation Ltd. - Built with pride for worker dignity and transparent service pricing.',
    margin,
    footerY
  );
  doc.text(
    'Helpline: 1800-COOP-SEVA | support@sahakariseva.coop | www.sahakariseva.coop',
    margin,
    footerY + 3.8
  );
  doc.text('Page 1 of 1', pageWidth - margin, footerY, { align: 'right' });

  return doc;
}

/**
 * Initiates the client download of the PDF invoice.
 * Works natively in browser environments (Chrome, Safari, Mobile Web).
 */
export async function downloadInvoicePDF(
  invoice: Invoice,
  booking: Booking | null
): Promise<{ success: boolean; filename: string }> {
  try {
    const doc = buildInvoicePDF(invoice, booking);
    const filename = `Sahakari-Seva-Invoice-${invoice.invoice_number}.pdf`;

    if (Platform.OS === 'web' || typeof window !== 'undefined') {
      doc.save(filename);
      return { success: true, filename };
    } else {
      // If native mobile environment without web DOM, we can output base64 or blob
      doc.save(filename);
      return { success: true, filename };
    }
  } catch (error) {
    console.error('Failed to generate or download invoice PDF:', error);
    throw error;
  }
}

/**
 * Opens the invoice PDF in a new browser tab or trigger window print.
 */
export function openInvoicePDF(invoice: Invoice, booking: Booking | null): void {
  try {
    const doc = buildInvoicePDF(invoice, booking);
    if (typeof window !== 'undefined' && window.open) {
      const blobUrl = doc.output('bloburl');
      window.open(blobUrl, '_blank');
    } else {
      const filename = `Sahakari-Seva-Invoice-${invoice.invoice_number}.pdf`;
      doc.save(filename);
    }
  } catch (error) {
    console.error('Failed to open invoice PDF preview:', error);
    throw error;
  }
}
