import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Helper to asynchronously load cross-origin images safely with timeouts
const loadImage = (url: string): Promise<HTMLImageElement | null> => {
  return new Promise((resolve) => {
    if (!url) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    // Timeout fallback after 3 seconds
    const timeout = setTimeout(() => {
      resolve(null);
    }, 3000);
    img.src = url;
  });
};

// Helper: safe text extraction/formatting for SKUs
const formatSkuSizeBrand = (brand: string, skuRaw: string) => {
  const brandClean = (brand || '').trim();
  const skuClean = (skuRaw || '').trim();
  if (!skuClean) return brandClean;
  if (!brandClean) return skuClean;
  
  if (skuClean.toLowerCase().includes(brandClean.toLowerCase() + ' -')) {
    return skuClean;
  }
  if (skuClean.includes(' - ')) {
    return skuClean;
  }
  return `${brandClean} - ${skuClean}`;
};

/**
 * EXPORT 1: COMPREHENSIVE ALL-RECORDS TABULAR REPORT (EXCEL FORMAT)
 */
export const exportCompetitorListToPDF = async (
  records: any[],
  dateFilter: string
): Promise<void> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const currentDateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Modern corporate design header background
  doc.setFillColor(15, 32, 67); // Slate/Dark Blue for LBCL corporate identity
  doc.rect(0, 0, 210, 40, 'F');

  // LBCL Branding Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('LBCL FIELD OPERATIONS', 15, 17);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('Corporate Competitor Tracking Detailed Field Intelligence Ledger', 15, 23);

  // Divider strip (Sky blue)
  doc.setFillColor(2, 132, 199); // sky-600
  doc.rect(0, 40, 210, 3, 'F');

  // Metadata block
  doc.setTextColor(30, 41, 59); // slate-800
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('MASTER INTELLIGENCE LEDGER PARAMETERS', 15, 52);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105); // slate-600

  doc.text(`Generated Date: ${currentDateStr}`, 15, 58);
  const activeFilterText = dateFilter 
    ? `Filtered Date: ${dateFilter}` 
    : 'Active Filters: None (Showing all historic activity)';
  doc.text(activeFilterText, 15, 63);
  doc.text(`Total Field Records: ${records.length} audits logged`, 15, 68);

  // Add decorative subtle horizontal separator
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.4);
  doc.line(15, 73, 195, 73);

  // Generate continuous single Excel-like tabular rows mapping ALL records
  const tableRows: string[][] = [];
  
  records.forEach((rec) => {
    const activeSkus = rec.skus ? rec.skus.filter((sku: any) => (parseInt(sku.quantity) || 0) > 0) : [];
    const notesStr = (rec.notes || '').trim() || '—';
    const dateStr = rec.date || '';
    const rtCodeStr = rec.rtCode || '—';
    const outletNameStr = rec.outletName || '—';
    
    if (activeSkus.length > 0) {
      activeSkus.forEach((sku: any) => {
        tableRows.push([
          dateStr,
          rtCodeStr,
          outletNameStr,
          formatSkuSizeBrand(rec.competitorBrand, sku.sku_type || sku.sku_size || ''),
          `${sku.quantity || 0}`,
          notesStr
        ]);
      });
    } else {
      tableRows.push([
        dateStr,
        rtCodeStr,
        outletNameStr,
        formatSkuSizeBrand(rec.competitorBrand, 'None'),
        '0',
        notesStr
      ]);
    }
  });

  // Main table column headers matching original spreadsheet layout
  const tableHeaders = [['Date', 'RT Code', 'Outlet Name', 'SKU Size/Brand', 'Volume (Cases)', 'Field Notes']];

  // AutoTable integration with professional spreadsheet layout alignment & borders
  autoTable(doc, {
    startY: 78,
    head: tableHeaders,
    body: tableRows,
    theme: 'grid', // Strict 'grid' theme requested
    pageBreak: 'auto', // Multi-page auto-flow enabled
    headStyles: {
      fillColor: [15, 32, 67], // Clean, professional dark blue header
      textColor: [255, 255, 255], // High-contrast white text
      fontStyle: 'bold',
      fontSize: 9.5,
      halign: 'left', // will be overridden individually if needed
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [51, 65, 85], // slate-700
      valign: 'middle',
    },
    columnStyles: {
      // Left-align text columns, right-align numerical/code columns
      0: { cellWidth: 22, halign: 'left' }, // Date
      1: { cellWidth: 18, halign: 'right', fontStyle: 'bold', textColor: [2, 132, 199] }, // RT Code (Right-aligned)
      2: { cellWidth: 42, halign: 'left', fontStyle: 'bold' }, // Outlet Name (Left-aligned)
      3: { cellWidth: 45, halign: 'left' }, // SKU Size/Brand (Left-aligned)
      4: { cellWidth: 25, halign: 'right', fontStyle: 'bold' }, // Volume (Cases) (Right-aligned)
      5: { cellWidth: 38, halign: 'left' }, // Field Notes (Left-aligned with auto-wrap)
    },
    margin: { left: 10, right: 10 }, // Generous 10mm margins for data density
    styles: {
      overflow: 'linebreak', // Enforces auto-wrap on long field notes
      cellPadding: 6, // Minimum 6px cell padding for top/bottom/left/right spacing
      lineWidth: 0.5, // Explicitly defined thin grid line
      lineColor: [203, 213, 225], // Excel-like light-grey border color (#cbd5e1)
    },
    didDrawPage: (data) => {
      // Elegant footer meta with dynamic page numbering
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // slate-400
      
      const str = `Page ${data.pageNumber} of ${pageCount}`;
      doc.text(str, 200 - doc.getTextWidth(str), 287);
      doc.text('LBCL POS Audits and Quality Dispatches · Internal Ledger', 10, 287);
    }
  });

  // General safe and dynamic file naming syntax requested
  const safeDateStr = dateFilter ? dateFilter.replace(/[^0-9-]/g, '') : 'all';
  const fileName = `LBCL_Tracking_${safeDateStr}_Summary.pdf`;
  doc.save(fileName);
};


/**
 * EXPORT 2: SINGLE COMPETITOR ENTRY WITH DETAIL AND PHOTOS TO PDF
 */
export const exportSingleCompetitorRecordToPDF = async (
  record: any,
  outletsList?: any[]
): Promise<void> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const currentDateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Find related outlet info
  const matchedOutlet = outletsList?.find(o => o.rtCode === record.rtCode);
  const distributionRoute = matchedOutlet?.address || 'Territory Delivery Circle';

  // Header Banner
  doc.setFillColor(15, 32, 67); // slate-900 / dark corporate blue
  doc.rect(0, 0, 210, 36, 'F');

  doc.setFillColor(225, 29, 72); // rose-600 accent panel line
  doc.rect(0, 36, 210, 2, 'F');

  // Title text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('LBCL FIELD OPERATIONS', 15, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(244, 63, 94); // rose-400
  doc.text('AUDIT INTELLIGENCE LOG · DETAILED FIELD TRACKING PROFILE', 15, 21);

  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(`Generated on: ${currentDateStr}`, 15, 27);

  // Section: General Information Card Title
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('OUTLET GENERAL INFORMATION', 15, 48);

  // General Information Block incorporating grid borders & linewidth matching
  autoTable(doc, {
    startY: 52,
    body: [
      ['Outlet Name:', record.outletName || '—'],
      ['RT Code:', record.rtCode || '—'],
      ['Route Info:', distributionRoute],
      ['Capture Date:', record.date || '—']
    ],
    theme: 'grid',
    styles: {
      cellPadding: 6,
      fontSize: 9,
      textColor: [51, 65, 85],
      lineWidth: 0.5,
      lineColor: [203, 213, 225], // Clean Excel-like border color (#cbd5e1)
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40, fillColor: [248, 250, 252] },
      1: { fontStyle: 'bold', textColor: [15, 23, 42] }
    },
    margin: { left: 15, right: 15 }
  });

  const generalInfoEndY = (doc as any).lastAutoTable.finalY;

  // Parse SKU Information
  const recordBrands = record.competitorBrand 
    ? record.competitorBrand.split(',').map((b: string) => b.trim()).filter(Boolean)
    : [];

  if (recordBrands.length === 0) {
    recordBrands.push(record.competitorBrand || 'Unknown Brand');
  }

  const skuTableRows: any[] = [];
  
  if (record.skus && record.skus.length > 0) {
    record.skus.forEach((sku: any) => {
      let skuBrandName = recordBrands[0] || 'Competitor';
      let skuCleanSize = sku.sku_type || sku.sku_size || '';

      if (skuCleanSize.includes(' - ')) {
        const parts = skuCleanSize.split(' - ');
        skuBrandName = parts[0].trim();
        skuCleanSize = parts.slice(1).join(' - ').trim();
      }

      const brandAndSku = skuBrandName && skuCleanSize 
        ? `${skuBrandName} - ${skuCleanSize}` 
        : (skuCleanSize || skuBrandName || '—');

      const qtyNum = parseInt(sku.quantity) || 0;

      skuTableRows.push([
        brandAndSku,
        `${qtyNum} cs`,
      ]);
    });
  } else {
    skuTableRows.push(['No active SKUs recorded', '0 cs']);
  }

  // Draw table for SKU Details
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('SKU QUANTITY MATRIX', 15, generalInfoEndY + 12);

  autoTable(doc, {
    startY: generalInfoEndY + 16,
    head: [['Brand & SKU Size', 'Volume (Cases)']],
    body: skuTableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 32, 67], // Professional corporate dark blue
      textColor: [255, 255, 255],
      fontSize: 9.5,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [51, 65, 85],
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { fontStyle: 'bold', halign: 'right' },
    },
    margin: { left: 15, right: 15 },
    styles: { 
      cellPadding: 6,
      lineWidth: 0.5,
      lineColor: [203, 213, 225], // Clean Excel-like border color (#cbd5e1)
    },
  });

  let currentY = (doc as any).lastAutoTable.finalY + 12;

  // Render Observation Notes
  if (currentY > 240) {
    doc.addPage();
    currentY = 20;
  }

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('OBSERVATION NOTES:', 15, currentY);

  doc.setFillColor(254, 251, 236); // warm amber background (warning/observation pad)
  doc.setDrawColor(251, 191, 36); // amber border
  doc.rect(15, currentY + 3, 180, 18, 'FD');

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(67, 20, 7); // dark text
  const obsNotes = record.notes ? `"${record.notes}"` : '"No detailed observation notes written. Processed via stock counts."';
  
  const wrappedNotes = doc.splitTextToSize(obsNotes, 172);
  doc.text(wrappedNotes, 19, currentY + 9);

  currentY += 28;

  // Render High-res Invoice document image proof
  if (record.invoicePhoto) {
    if (currentY > 160) {
      doc.addPage();
      currentY = 20;
    }

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('ATTACHED INVOICE PROOF DOCUMENT', 15, currentY);

    // Asynchronously resolve image
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Loading high-resolution document wrapper...', 15, currentY + 5);

    const resolvedImage = await loadImage(record.invoicePhoto);
    
    // Clear loading text line with a white filled box
    doc.setFillColor(255, 255, 255);
    doc.rect(14, currentY + 2, 100, 4, 'F');

    if (resolvedImage) {
      const origW = resolvedImage.naturalWidth || resolvedImage.width || 400;
      const origH = resolvedImage.naturalHeight || resolvedImage.height || 300;
      const targetW = 90;
      const targetH = (origH / origW) * targetW;
      
      const safeH = Math.min(targetH, 85);
      const safeW = (origW / origH) * safeH;

      const photoX = 15 + (180 - safeW) / 2; // Center inside the printable container width
      
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.rect(photoX - 3, currentY + 3, safeW + 6, safeH + 11, 'FD');

      try {
        doc.addImage(resolvedImage, 'JPEG', photoX, currentY + 6, safeW, safeH);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text('📷 SCAN PROOF DATA FEED: SECURE SYNCHRONIZED', photoX + safeW / 2 - 32, currentY + 7 + safeH);
      } catch (e) {
        doc.setFillColor(241, 245, 249);
        doc.setFont('helvetica', 'italic');
        doc.text('[Failed to render image payload inside PDF structure]', 20, currentY + 12);
      }
    } else {
      doc.setDrawColor(148, 163, 184);
      doc.setLineDashPattern([2, 2], 0);
      doc.setFillColor(248, 250, 252);
      doc.rect(15, currentY + 4, 180, 40, 'FD');
      doc.setLineDashPattern([], 0); // reset draw style

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text('No physical photo document attached', 72, currentY + 18);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(148, 163, 184);
      doc.text('Audit processed via digital SKU volume counters without scan requirements.', 55, currentY + 24);
    }
  }

  // Footer metadata
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${i} of ${totalPages}`, 175, 287);
    doc.text('LBCL Audit Operations Systems · Confidential Internal Dispatch', 15, 287);
  }

  // Generate clean dynamic name format: LBCL_Tracking_[Date]_[OutletName].pdf
  const formattedOutletName = (record.outletName || 'Outlet').replace(/[^a-zA-Z0-9]/g, '_');
  const safeDateStr = (record.date || '').replace(/[^0-9-]/g, '');
  const fileName = `LBCL_Tracking_${safeDateStr}_${formattedOutletName}.pdf`;
  
  doc.save(fileName);
};
