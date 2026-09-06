import { jsPDF } from 'jspdf';
import { SavedQuotation } from '../types';
import { formatCurrency } from './calculator';

export function generateQuotePDF(quote: SavedQuotation) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const { breakdown, formData } = quote;

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('FREIGHTHUB', 14, 18);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(56, 189, 248);
  doc.text('SMART LOGISTICS ENGINE • COMMERCIAL FREIGHT QUOTATION', 14, 25);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(`QUOTE NO: ${quote.id}`, 196, 16, { align: 'right' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(226, 232, 240);
  doc.text(`DATE ISSUED: ${quote.createdAt}`, 196, 23, { align: 'right' });

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 38, 182, 34, 3, 3, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 38, 182, 34, 3, 3, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text('SHIPPER / COMMERCIAL CLIENT:', 20, 46);
  doc.text('ROUTE & SERVICE SUMMARY:', 110, 46);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Name: ${quote.shipperName}`, 20, 52);
  doc.text(`Company: ${quote.companyName}`, 20, 58);
  doc.text(`Email: ${formData.email || 'N/A'}`, 20, 64);

  doc.text(`Origin Code: ${formData.originPortCode}`, 110, 52);
  doc.text(`Destination Code: ${formData.destinationPortCode}`, 110, 58);
  doc.text(`Transport Mode: ${quote.transportMode.toUpperCase()} ${quote.oceanLoadType ? `(${quote.oceanLoadType})` : ''}`, 110, 64);

  doc.setFillColor(239, 246, 255);
  doc.rect(14, 78, 182, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(37, 99, 235);
  doc.text('CARGO PARAMETERS & LINE ITEMS', 18, 83.5);

  let yPos = 94;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('#', 18, yPos);
  doc.text('ITEM SPECIFICATION', 30, yPos);
  doc.text('QTY', 110, yPos);
  doc.text('GROSS WEIGHT', 135, yPos);
  doc.text('HS CODE', 170, yPos);

  doc.setDrawColor(203, 213, 225);
  doc.line(14, yPos + 2, 196, yPos + 2);
  yPos += 7;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);

  formData.cargoItems.forEach((item, idx) => {
    doc.text(`0${idx + 1}`, 18, yPos);
    doc.text(`${item.commodityDescription || 'Freight Cargo'} (${item.containerSpec || item.packageType})`, 30, yPos);
    doc.text(`${item.quantity}`, 110, yPos);
    doc.text(`${item.grossWeightKg} kg`, 135, yPos);
    doc.text(`${item.hsCode || 'N/A'}`, 170, yPos);
    yPos += 6;
  });

  yPos += 6;
  doc.setFillColor(239, 246, 255);
  doc.rect(14, yPos, 182, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(37, 99, 235);
  doc.text('ITEMIZED TARIFF BREAKDOWN', 18, yPos + 5.5);

  yPos += 14;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);

  const cur = breakdown.currency;

  const costLines = [
    { label: `Base ${quote.transportMode.toUpperCase()} Tariff`, val: breakdown.baseTariff },
    { label: 'Bunker / Fuel Adjustment Factor (BAF)', val: breakdown.bafFuelSurcharge },
    { label: 'Terminal Handling Charges (THC)', val: breakdown.terminalHandlingCharge },
    { label: 'Port Documentation & Customs Filing Fee', val: breakdown.documentationFee },
  ];

  if (breakdown.specialHandlingSurcharge > 0) {
    costLines.push({ label: 'Special Goods Handling Surcharge', val: breakdown.specialHandlingSurcharge });
  }
  if (breakdown.insuranceFee > 0) {
    costLines.push({ label: 'Cargo Marine Insurance Premium', val: breakdown.insuranceFee });
  }
  if (breakdown.discountAmount > 0) {
    costLines.push({ label: 'Promotional Offer Discount', val: -breakdown.discountAmount });
  }

  costLines.forEach((line) => {
    doc.text(line.label, 20, yPos);
    const amountStr = line.val < 0 ? `-${formatCurrency(Math.abs(line.val), cur)}` : formatCurrency(line.val, cur);
    doc.text(amountStr, 192, yPos, { align: 'right' });
    yPos += 6;
  });

  doc.setDrawColor(203, 213, 225);
  doc.line(14, yPos, 196, yPos);
  yPos += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('TOTAL ESTIMATED FREIGHT TARIFF:', 20, yPos);
  doc.text(formatCurrency(breakdown.grandTotal, cur), 192, yPos, { align: 'right' });

  yPos += 14;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, yPos, 182, 28, 3, 3, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('COMMERCIAL TERMS & SLA GUARANTEE:', 20, yPos + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('• Tariff quotation valid for 14 calendar days from date of issuance.', 20, yPos + 12);
  doc.text('• Transit time estimates subject to ocean weather conditions and port customs inspection clearance.', 20, yPos + 17);
  doc.text('• Rates exclude import customs duties, local destination taxes, and demurrages if incurred at port.', 20, yPos + 22);

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('FreightHub Intelligent Logistics Systems Ltd. • Bandra-Kurla Complex (BKC), Mumbai • support@freighthub.in', 105, 285, { align: 'center' });

  doc.save(`FreightHub_Quotation_${quote.id}.pdf`);
}
