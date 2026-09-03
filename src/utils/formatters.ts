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

  // Temporarily force standard A4 portrait layout width (~794px at 96 DPI)
  element.style.width = '794px';
  element.style.maxWidth = '794px';
  element.style.minWidth = '794px';
  element.style.boxSizing = 'border-box';

  try {
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    const dataUrl = await toPng(element, {
      quality: 0.98,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      cacheBust: false,
    });

    const img = new Image();
    img.src = dataUrl;
    await new Promise((resolve, reject) => {
      img.onload = () => resolve(true);
      img.onerror = reject;
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfPageWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pdfPageHeight = pdf.internal.pageSize.getHeight(); // 297mm

    // Margins: 8mm around
    const marginX = 8;
    const marginY = 8;
    const printableWidth = pdfPageWidth - marginX * 2; // 194mm
    const printableHeight = pdfPageHeight - marginY * 2; // 281mm

    const imgWidth = printableWidth;
    const imgHeight = (img.naturalHeight * printableWidth) / img.naturalWidth;

    if (imgHeight <= printableHeight) {
      // Single page document
      const yOffset = marginY + Math.max(0, (printableHeight - imgHeight) / 6);
      pdf.addImage(dataUrl, 'PNG', marginX, yOffset, imgWidth, imgHeight, undefined, 'FAST');
    } else {
      // Multi-page document support
      let remainingHeight = imgHeight;
      let positionY = marginY;

      pdf.addImage(dataUrl, 'PNG', marginX, positionY, imgWidth, imgHeight, undefined, 'FAST');
      remainingHeight -= printableHeight;

      while (remainingHeight > 0) {
        pdf.addPage();
        positionY -= printableHeight;
        pdf.addImage(dataUrl, 'PNG', marginX, positionY, imgWidth, imgHeight, undefined, 'FAST');
        remainingHeight -= printableHeight;
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

  // Temporarily force standard A4 portrait layout width (~794px at 96 DPI)
  element.style.width = '794px';
  element.style.maxWidth = '794px';
  element.style.minWidth = '794px';
  element.style.boxSizing = 'border-box';

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
export function cleanPersonName(name?: string | null, fallback = 'Đại Diện Lớp'): string {
  if (name === '') return '';
  if (!name || typeof name !== 'string') return fallback;
  const n = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  if (
    n.includes('dang tuan anh') ||
    n.includes('tuan anh') ||
    (n.includes('dang') && n.includes('anh')) ||
    n === 'dang' ||
    n === 'anh' ||
    n.includes('triple d') ||
    n.includes('tran hanh dung') ||
    n.includes('hanh dung')
  ) {
    return fallback;
  }
  return name.trim();
}

