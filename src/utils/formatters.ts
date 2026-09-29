import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { ChecklistTemplate } from '../types';

export function formatVND(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '0';
  return new Intl.NumberFormat('vi-VN').format(Math.round(amount));
}

export function formatVNDWithUnit(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '0 đ';
  return `${formatVND(amount)} đ`;
}

export function formatMonthDisplay(monthStr: string): string {
  // Input: "2026-07" -> "07/2026"
  if (!monthStr) return '';
  const parts = monthStr.split('-');
  if (parts.length === 2) {
    return `${parts[1]}/${parts[0]}`;
  }
  return monthStr;
}

/**
 * Lấy kỳ lương liền trước (chuyển năm tự động, ví dụ 2026-01 -> 2025-12)
 */
export function getPreviousMonth(monthStr: string): string {
  if (!monthStr || !monthStr.includes('-')) return getDefaultSalaryMonth();
  const [yStr, mStr] = monthStr.split('-');
  const y = parseInt(yStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(y) || isNaN(m)) return getDefaultSalaryMonth();
  
  let prevYear = y;
  let prevMonth = m - 1;
  if (prevMonth < 1) {
    prevMonth = 12;
    prevYear -= 1;
  }
  return `${prevYear}-${prevMonth < 10 ? `0${prevMonth}` : prevMonth}`;
}

/**
 * Lấy kỳ lương liền sau (chuyển năm tự động, ví dụ 2025-12 -> 2026-01)
 */
export function getNextMonth(monthStr: string): string {
  if (!monthStr || !monthStr.includes('-')) return getDefaultSalaryMonth();
  const [yStr, mStr] = monthStr.split('-');
  const y = parseInt(yStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(y) || isNaN(m)) return getDefaultSalaryMonth();
  
  let nextYear = y;
  let nextMonth = m + 1;
  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear += 1;
  }
  return `${nextYear}-${nextMonth < 10 ? `0${nextMonth}` : nextMonth}`;
}

/**
 * Danh sách năm khả dụng (bao gồm các năm có trong dữ liệu + dải năm lân cận)
 */
export function getAvailableYears(dataMonths: string[] = []): number[] {
  const currentYear = new Date().getFullYear();
  const yearsSet = new Set<number>();
  
  // Dải năm cơ bản từ (năm hiện tại - 3) đến (năm hiện tại + 3)
  for (let i = currentYear - 3; i <= currentYear + 3; i++) {
    yearsSet.add(i);
  }
  // Mặc định luôn có ít nhất các năm 2024, 2025, 2026, 2027
  yearsSet.add(2024);
  yearsSet.add(2025);
  yearsSet.add(2026);
  yearsSet.add(2027);
  
  // Thêm các năm xuất hiện trong dữ liệu thực tế
  dataMonths.forEach(m => {
    if (m && m.includes('-')) {
      const y = parseInt(m.split('-')[0], 10);
      if (!isNaN(y)) {
        yearsSet.add(y);
      }
    }
  });

  return Array.from(yearsSet).sort((a, b) => a - b);
}

/**
 * Tạo danh sách 12 tháng cho một năm cụ thể (YYYY-01 đến YYYY-12)
 */
export function getMonthsForYear(year: number): string[] {
  const result: string[] = [];
  for (let m = 1; m <= 12; m++) {
    const mm = m < 10 ? `0${m}` : `${m}`;
    result.push(`${year}-${mm}`);
  }
  return result;
}

/**
 * Xác định kỳ lương mặc định theo quy tắc:
 * - Nếu đang ở nửa đầu tháng hiện tại (ngày 1 - 15): hiển thị kỳ lương tháng trước
 * - Nếu đang ở nửa sau tháng hiện tại (ngày 16 trở đi): hiển thị kỳ lương tháng hiện tại
 */
export function getDefaultSalaryMonth(): string {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIndex = now.getMonth(); // 0 to 11 (0 is Jan)
  const currentDay = now.getDate();

  let targetYear = currentYear;
  let targetMonth = currentMonthIndex + 1; // 1 to 12

  if (currentDay <= 15) {
    // Nửa đầu tháng -> lấy kỳ lương tháng trước
    targetMonth -= 1;
    if (targetMonth < 1) {
      targetMonth = 12;
      targetYear -= 1;
    }
  }

  const mm = targetMonth < 10 ? `0${targetMonth}` : `${targetMonth}`;
  return `${targetYear}-${mm}`;
}

export function calculateKpiFromScores(
  template: ChecklistTemplate,
  scores: Record<string, number>,
  linkedTemplateScore?: number
): number {
  let totalScore = 0;

  for (const group of template.groups) {
    for (const crit of group.criteria) {
      let critScore = scores[crit.id] ?? 100; // default 100% if not evaluated
      
      // If this criterion links to Bảng kiểm soạn bài (e.g. Soạn tài liệu 80%)
      if ((crit.id === 'tl_c1_1' || crit.id === 'dh_c1_2') && linkedTemplateScore !== undefined) {
        critScore = linkedTemplateScore;
      }

      totalScore += (critScore * (crit.weight / 100));
    }
  }

  return Math.round(totalScore * 10) / 10;
}

interface BoundaryPoint {
  top: number;
  bottom: number;
  isHeading?: boolean;
  isUnbreakable?: boolean;
}

function findSafeCutPoints(element: HTMLElement, maxPageHeightDomPx: number, totalHeightDomPx: number): number[] {
  const elementRect = element.getBoundingClientRect();
  const rawTop = elementRect.top;

  // Helper to check if an element is nested inside an atomic container
  const isInsideAtomic = (el: HTMLElement): boolean => {
    let parent = el.parentElement;
    while (parent && parent !== element) {
      if (
        parent.classList.contains('signature-container') ||
        parent.classList.contains('break-inside-avoid') ||
        parent.classList.contains('print-break-inside-avoid') ||
        parent.classList.contains('kpi-table-section') ||
        parent.tagName.toLowerCase() === 'tr'
      ) {
        return true;
      }
      parent = parent.parentElement;
    }
    return false;
  };

  // Collect all break-sensitive DOM elements
  const blocks: BoundaryPoint[] = [];
  
  // Select important structural child elements
  const selectors = [
    '.signature-container',
    '.kpi-table-section',
    '.break-inside-avoid',
    '.print-break-inside-avoid',
    'tr',
    'table',
    'h1, h2, h3, h4, h5',
    'p',
    'div.grid'
  ].join(', ');

  const elements = element.querySelectorAll<HTMLElement>(selectors);
  elements.forEach(el => {
    // If element is a child inside an already atomic container, skip it so the atomic container stays intact
    if (isInsideAtomic(el)) return;

    const r = el.getBoundingClientRect();
    const top = r.top - rawTop;
    const bottom = r.bottom - rawTop;
    const height = bottom - top;
    
    if (height <= 0) return;

    const tagName = el.tagName.toLowerCase();
    const isHeading = tagName.startsWith('h');
    const isTr = tagName === 'tr';
    const isSignature = el.classList.contains('signature-container');
    const isAvoid = el.classList.contains('break-inside-avoid') || el.classList.contains('print-break-inside-avoid');
    const isKpi = el.classList.contains('kpi-table-section');

    const isUnbreakable = isSignature || isAvoid || isKpi || isTr || isHeading || height < maxPageHeightDomPx * 0.85;

    blocks.push({
      top,
      bottom,
      isHeading,
      isUnbreakable
    });
  });

  // Sort blocks by top position
  blocks.sort((a, b) => a.top - b.top);

  const cutPoints: number[] = [];
  let currentTop = 0;

  while (currentTop + maxPageHeightDomPx < totalHeightDomPx) {
    const remainingTotal = totalHeightDomPx - currentTop;
    
    // If the remaining content can fit on the current page with a small margin tolerance (up to 7%),
    // avoid creating an unnecessary single-line page.
    if (remainingTotal <= maxPageHeightDomPx * 1.07) {
      break;
    }

    const idealBottom = currentTop + maxPageHeightDomPx;
    let chosenCut = idealBottom;
    let foundConstraint = false;

    // 1. Look for any block that intersects the ideal cut line
    for (let i = blocks.length - 1; i >= 0; i--) {
      const b = blocks[i];

      // If this block starts before idealBottom and ends after idealBottom
      if (b.top < idealBottom && b.bottom > idealBottom) {
        // For unbreakable blocks (signatures, avoid-break, tables), NEVER slice inside
        if (b.isUnbreakable && b.top > currentTop) {
          chosenCut = b.top;
          foundConstraint = true;
          break;
        } else if (b.top > currentTop + maxPageHeightDomPx * 0.3) {
          chosenCut = b.top;
          foundConstraint = true;
          break;
        }
      }

      // Avoid leaving orphan headings at the bottom of the page (within 90px of cut)
      if (b.isHeading && b.top > currentTop + maxPageHeightDomPx * 0.4 && b.top < idealBottom && (idealBottom - b.top) < 90) {
        chosenCut = b.top;
        foundConstraint = true;
        break;
      }
    }

    // 2. If no intersecting block found, find the highest safe bottom of a block within acceptable zone
    if (!foundConstraint) {
      for (let i = blocks.length - 1; i >= 0; i--) {
        const b = blocks[i];
        if (b.bottom <= idealBottom && b.bottom >= currentTop + maxPageHeightDomPx * 0.6) {
          chosenCut = b.bottom;
          break;
        }
      }
    }

    // 3. Prevent Orphan Tail Pages (e.g., leaving only 1-3 lines or a detached signature row on the last page)
    const tailRemaining = totalHeightDomPx - chosenCut;
    if (tailRemaining > 0 && tailRemaining < 190) {
      // If remaining height could fit in current page with small tolerance, fit it
      if (remainingTotal <= maxPageHeightDomPx * 1.12) {
        break;
      } else {
        // Otherwise backtrack cut to previous block so the last page has substantial content
        for (let i = blocks.length - 1; i >= 0; i--) {
          const b = blocks[i];
          if (b.top < chosenCut && (totalHeightDomPx - b.top) >= 240 && b.top > currentTop + maxPageHeightDomPx * 0.25) {
            chosenCut = b.top;
            break;
          }
        }
      }
    }

    // Safety fallback: ensure forward progress of at least 20% of a page
    if (chosenCut <= currentTop + maxPageHeightDomPx * 0.2) {
      chosenCut = idealBottom;
    }

    cutPoints.push(chosenCut);
    currentTop = chosenCut;
  }

  // Final cut at totalHeightDomPx
  cutPoints.push(totalHeightDomPx);
  return cutPoints;
}

export async function exportElementToPDF(elementId: string, fileName: string) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element #${elementId} not found`);
    return;
  }

  // Preserve original inline styles to restore after export
  const originalWidth = element.style.width;
  const originalMaxWidth = element.style.maxWidth;
  const originalMinWidth = element.style.minWidth;
  const originalBoxSizing = element.style.boxSizing;
  const originalBorder = element.style.border;
  const originalBorderRadius = element.style.borderRadius;
  const originalBoxShadow = element.style.boxShadow;
  const originalOutline = element.style.outline;

  // Temporarily force standard A4 portrait layout width (~794px at 96 DPI)
  // and strip any outer borders, shadows, or rounded corners
  element.style.width = '794px';
  element.style.maxWidth = '794px';
  element.style.minWidth = '794px';
  element.style.boxSizing = 'border-box';
  element.style.border = 'none';
  element.style.borderRadius = '0';
  element.style.boxShadow = 'none';
  element.style.outline = 'none';

  try {
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    // Short tick for layout reflow at standard A4 width
    await new Promise(r => setTimeout(r, 60));

    const totalHeightDomPx = element.scrollHeight;
    const elementWidthDomPx = element.offsetWidth || 794;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfPageWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pdfPageHeight = pdf.internal.pageSize.getHeight(); // 297mm

    // Margins: 8mm
    const marginX = 8;
    const marginY = 8;
    const printableWidth = pdfPageWidth - marginX * 2; // 194mm
    const printableHeight = pdfPageHeight - marginY * 2; // 281mm

    // Max DOM height that fits on one A4 page without distortion
    const maxPageHeightDomPx = (printableHeight * elementWidthDomPx) / printableWidth;

    const pixelRatio = 2;
    const dataUrl = await toPng(element, {
      quality: 0.98,
      pixelRatio: pixelRatio,
      backgroundColor: '#ffffff',
      cacheBust: false,
    });

    const img = new Image();
    img.src = dataUrl;
    await new Promise((resolve, reject) => {
      img.onload = () => resolve(true);
      img.onerror = reject;
    });

    if (totalHeightDomPx <= maxPageHeightDomPx) {
      // Single page document
      const renderedHeightMm = (totalHeightDomPx * printableWidth) / elementWidthDomPx;
      pdf.addImage(dataUrl, 'PNG', marginX, marginY, printableWidth, renderedHeightMm, undefined, 'FAST');
    } else {
      // Smart Multi-Page Slicing with Boundary Detection
      const cutPoints = findSafeCutPoints(element, maxPageHeightDomPx, totalHeightDomPx);

      let prevTopDomPx = 0;
      for (let pageIdx = 0; pageIdx < cutPoints.length; pageIdx++) {
        const nextCutDomPx = cutPoints[pageIdx];
        const sliceHeightDomPx = nextCutDomPx - prevTopDomPx;

        if (sliceHeightDomPx <= 0) continue;

        if (pageIdx > 0) {
          pdf.addPage();
        }

        // Create offscreen canvas for this slice
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = img.naturalWidth;
        sliceCanvas.height = Math.round(sliceHeightDomPx * pixelRatio);

        const sliceCtx = sliceCanvas.getContext('2d');
        if (sliceCtx) {
          const sourceY = Math.round(prevTopDomPx * pixelRatio);
          const sourceHeight = Math.round(sliceHeightDomPx * pixelRatio);

          sliceCtx.drawImage(
            img,
            0,
            sourceY,
            img.naturalWidth,
            sourceHeight,
            0,
            0,
            sliceCanvas.width,
            sliceCanvas.height
          );

          const sliceDataUrl = sliceCanvas.toDataURL('image/png');
          const renderedSliceHeightMm = (sliceHeightDomPx * printableWidth) / elementWidthDomPx;

          pdf.addImage(
            sliceDataUrl,
            'PNG',
            marginX,
            marginY,
            printableWidth,
            renderedSliceHeightMm,
            undefined,
            'FAST'
          );
        }

        prevTopDomPx = nextCutDomPx;
      }
    }

    pdf.save(fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`);
  } catch (err) {
    console.error('Lỗi khi xuất PDF:', err);
    window.print();
  } finally {
    // Restore original inline styles
    element.style.width = originalWidth;
    element.style.maxWidth = originalMaxWidth;
    element.style.minWidth = originalMinWidth;
    element.style.boxSizing = originalBoxSizing;
    element.style.border = originalBorder;
    element.style.borderRadius = originalBorderRadius;
    element.style.boxShadow = originalBoxShadow;
    element.style.outline = originalOutline;
  }
}

export async function exportElementToPNG(elementId: string, fileName: string) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element #${elementId} not found`);
    return;
  }

  // Preserve original inline styles to restore after export
  const originalWidth = element.style.width;
  const originalMaxWidth = element.style.maxWidth;
  const originalMinWidth = element.style.minWidth;
  const originalBoxSizing = element.style.boxSizing;
  const originalBorder = element.style.border;
  const originalBorderRadius = element.style.borderRadius;
  const originalBoxShadow = element.style.boxShadow;
  const originalOutline = element.style.outline;

  // Temporarily force standard A4 portrait layout width (~794px at 96 DPI)
  // and strip any outer borders, shadows, or rounded corners
  element.style.width = '794px';
  element.style.maxWidth = '794px';
  element.style.minWidth = '794px';
  element.style.boxSizing = 'border-box';
  element.style.border = 'none';
  element.style.borderRadius = '0';
  element.style.boxShadow = 'none';
  element.style.outline = 'none';

  try {
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    const dataUrl = await toPng(element, {
      quality: 0.98,
      pixelRatio: 2.5,
      backgroundColor: '#ffffff',
      cacheBust: false,
    });

    const link = document.createElement('a');
    link.download = fileName.endsWith('.png') ? fileName : `${fileName}.png`;
    link.href = dataUrl;
    link.click();
  } catch (err) {
    console.error('Lỗi khi xuất PNG:', err);
  } finally {
    // Restore original inline styles
    element.style.width = originalWidth;
    element.style.maxWidth = originalMaxWidth;
    element.style.minWidth = originalMinWidth;
    element.style.boxSizing = originalBoxSizing;
    element.style.border = originalBorder;
    element.style.borderRadius = originalBorderRadius;
    element.style.boxShadow = originalBoxShadow;
    element.style.outline = originalOutline;
  }
}

export function exportPayrollTableToCSV(data: any[], fileName: string) {
  if (!data || !data.length) return;

  const headers = Object.keys(data[0]);
  const csvRows: string[] = [];

  // Add BOM for Excel UTF-8 display
  csvRows.push('\uFEFF' + headers.join(','));

  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header] ?? '';
      const escaped = ('' + val).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName.endsWith('.csv') ? fileName : `${fileName}.csv`);
  link.click();
}

/**
 * Ensures any historical or stale name reference is replaced with Đại Diện Lớp
 */
export function cleanPersonName(name?: string | null, fallback = 'Trần Hạnh Dung'): string {
  if (name === '') return '';
  if (!name || typeof name !== 'string') return fallback;
  const n = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  if (
    n.includes('dang tuan anh') ||
    n.includes('tuan anh') ||
    (n.includes('dang') && n.includes('anh')) ||
    n === 'dang' ||
    n === 'anh' ||
    n.includes('triple d')
  ) {
    return fallback;
  }
  return name.trim();
}

