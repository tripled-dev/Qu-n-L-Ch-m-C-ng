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
  if (!element) return;

  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.position = 'fixed';
  clone.style.top = '0';
  clone.style.left = '-9999px';
  clone.style.width = '780px';
  clone.style.height = 'auto';
  clone.style.maxHeight = 'none';
  clone.style.overflow = 'visible';
  clone.style.transform = 'none';
  clone.style.zoom = '1';
  clone.style.zIndex = '999999';
  document.body.appendChild(clone);

  try {
    const cloneHeight = Math.max(clone.scrollHeight, clone.offsetHeight);
    const dataUrl = await toPng(clone, {
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      cacheBust: true,
      width: 780,
      height: cloneHeight,
      style: {
        transform: 'none',
        zoom: '1',
      },
    });
    if (document.body.contains(clone)) {
      document.body.removeChild(clone);
    }

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgProps = pdf.getImageProperties(dataUrl);
    const pdfPageWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pdfPageHeight = pdf.internal.pageSize.getHeight(); // 297mm

    // Margins: 10mm around
    const marginX = 10;
    const marginY = 10;
    const printableWidth = pdfPageWidth - marginX * 2; // 190mm
    const printableHeight = pdfPageHeight - marginY * 2; // 277mm

    let imgWidth = printableWidth;
    let imgHeight = (imgProps.height * printableWidth) / imgProps.width;

    if (imgHeight > printableHeight) {
      imgHeight = printableHeight;
      imgWidth = (imgProps.width * printableHeight) / imgProps.height;
    }

    const xOffset = marginX + (printableWidth - imgWidth) / 2;
    const yOffset = marginY;

    pdf.addImage(dataUrl, 'PNG', xOffset, yOffset, imgWidth, imgHeight);
    pdf.save(fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`);
  } catch (err) {
    if (document.body.contains(clone)) {
      document.body.removeChild(clone);
    }
    console.error('Lỗi khi xuất PDF:', err);
    window.print();
  }
}

export async function exportElementToPNG(elementId: string, fileName: string) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.position = 'fixed';
  clone.style.top = '0';
  clone.style.left = '-9999px';
  clone.style.width = '780px';
  clone.style.height = 'auto';
  clone.style.maxHeight = 'none';
  clone.style.overflow = 'visible';
  clone.style.transform = 'none';
  clone.style.zoom = '1';
  clone.style.zIndex = '999999';
  document.body.appendChild(clone);

  try {
    const cloneHeight = Math.max(clone.scrollHeight, clone.offsetHeight);
    const dataUrl = await toPng(clone, {
      pixelRatio: 2.5,
      backgroundColor: '#ffffff',
      cacheBust: true,
      width: 780,
      height: cloneHeight,
      style: {
        transform: 'none',
        zoom: '1',
      },
    });
    if (document.body.contains(clone)) {
      document.body.removeChild(clone);
    }

    const link = document.createElement('a');
    link.download = fileName.endsWith('.png') ? fileName : `${fileName}.png`;
    link.href = dataUrl;
    link.click();
  } catch (err) {
    if (document.body.contains(clone)) {
      document.body.removeChild(clone);
    }
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
