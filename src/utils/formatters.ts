import html2canvas from 'html2canvas';
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

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      onclone: (_clonedDoc, clonedElement) => {
        // Ensure element is styled clearly for export
        clonedElement.style.maxWidth = '780px';
        clonedElement.style.margin = '0 auto';
      },
    });

    const dataUrl = canvas.toDataURL('image/png', 1.0);

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
    const imgHeight = (canvas.height * printableWidth) / canvas.width;

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
  }
}

export async function exportElementToPNG(elementId: string, fileName: string) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element #${elementId} not found`);
    return;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2.5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      onclone: (_clonedDoc, clonedElement) => {
        clonedElement.style.maxWidth = '780px';
        clonedElement.style.margin = '0 auto';
      },
    });

    const dataUrl = canvas.toDataURL('image/png', 1.0);

    const link = document.createElement('a');
    link.download = fileName.endsWith('.png') ? fileName : `${fileName}.png`;
    link.href = dataUrl;
    link.click();
  } catch (err) {
    console.error('Lỗi khi xuất PNG:', err);
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
