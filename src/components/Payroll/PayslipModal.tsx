import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MonthlyPayrollSlip, PieceworkSalaryItem } from '../../types';
import { 
  formatVND, 
  formatMonthDisplay, 
  exportElementToPDF, 
  exportElementToPNG 
} from '../../utils/formatters';
import { ManagerSignatureSvg, FinanceSignatureSvg } from '../../utils/signatures';
import { 
  Printer, 
  Download, 
  Image as ImageIcon, 
  Copy, 
  Edit3, 
  Save, 
  X, 
  Check, 
  Plus, 
  Trash2,
  CheckCircle,
  Eye,
  Upload,
  RotateCcw
} from 'lucide-react';

interface PayslipModalProps {
  slip: MonthlyPayrollSlip;
  onClose: () => void;
}

export const PayslipModal: React.FC<PayslipModalProps> = ({ slip, onClose }) => {
  const { savePayrollSlip, updateSlipStatus, orgSettings, showToast } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [editedSlip, setEditedSlip] = useState<MonthlyPayrollSlip>({ ...slip });
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const editManagerImgRef = React.useRef<HTMLInputElement>(null);
  const editFinanceImgRef = React.useRef<HTMLInputElement>(null);

  const handleEditSignatureUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'managerSignatureImg' | 'financeSignatureImg'
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('Vui lòng chọn ảnh dung lượng dưới 2MB', 'warning');
        return;
      }
      const reader = new FileReader();
      reader.onload = event => {
        const base64 = event.target?.result as string;
        setEditedSlip(prev => ({
          ...prev,
          signatures: {
            ...prev.signatures,
            [field]: base64,
          },
        }));
        showToast('Đã tải ảnh chữ ký thành công!', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  // Sync edits
  const handleSave = () => {
    // Recalculate totals
    const primaryTotal =
      Math.round(
        editedSlip.primarySalary.daysOrSessions *
          editedSlip.primarySalary.unitPrice *
          (editedSlip.primarySalary.kpiPercent / 100)
      ) + Number(editedSlip.primarySalary.bonus || 0);

    const updatedPiecework = editedSlip.pieceworkItems.map(item => ({
      ...item,
      totalAmount:
        Math.round(item.quantity * item.unitPrice * (item.kpiPercent / 100)) + Number(item.bonus || 0),
    }));

    const pwTotal = updatedPiecework.reduce((sum, item) => sum + item.totalAmount, 0);

    const totalSalary =
      primaryTotal +
      pwTotal +
      Number(editedSlip.generalBonus || 0) +
      Number(editedSlip.allowances || 0) -
      Number(editedSlip.deductions || 0);

    const finalized: MonthlyPayrollSlip = {
      ...editedSlip,
      primarySalary: {
        ...editedSlip.primarySalary,
        totalAmount: primaryTotal,
      },
      pieceworkItems: updatedPiecework,
      totalSalary,
      updatedAt: new Date().toISOString(),
    };

    savePayrollSlip(finalized);
    setEditedSlip(finalized);
    setIsEditing(false);
  };

  const handleAddPieceworkItem = () => {
    const newItem: PieceworkSalaryItem = {
      id: `pw_${Date.now()}`,
      workName: `${editedSlip.pieceworkItems.length + 1}. Công việc mới`,
      quantity: 1,
      unit: 'Bài',
      unitPrice: 10000,
      kpiPercent: 100,
      bonus: 0,
      totalAmount: 10000,
    };
    setEditedSlip({
      ...editedSlip,
      pieceworkItems: [...editedSlip.pieceworkItems, newItem],
    });
  };

  const handleRemovePieceworkItem = (id: string) => {
    setEditedSlip({
      ...editedSlip,
      pieceworkItems: editedSlip.pieceworkItems.filter(item => item.id !== id),
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    await exportElementToPDF(
      'printable-payslip-content',
      `PhieuLuong_${editedSlip.staffName.replace(/\s+/g, '_')}_Thang_${editedSlip.month}`
    );
    setIsExporting(false);
  };

  const handleExportPNG = async () => {
    setIsExporting(true);
    await exportElementToPNG(
      'printable-payslip-content',
      `PhieuLuong_${editedSlip.staffName.replace(/\s+/g, '_')}_Thang_${editedSlip.month}`
    );
    setIsExporting(false);
  };

  const handleCopySummary = () => {
    const text = `📋 THÔNG BÁO PHIẾU LƯƠNG THÁNG ${formatMonthDisplay(editedSlip.month)} - TRIPLE D
👤 Họ tên: ${editedSlip.staffName} (Mã NV: ${editedSlip.staffCode || '---'})
🏢 Bộ phận: ${editedSlip.departmentName} - ${editedSlip.role}
💳 STK: ${editedSlip.bankAccount || '---'} (${editedSlip.bankName || '---'})
---------------------------
💰 Lương chính: ${formatVND(editedSlip.primarySalary.totalAmount)} đ (${editedSlip.primarySalary.daysOrSessions} ${editedSlip.primarySalary.unitName} × ${formatVND(editedSlip.primarySalary.unitPrice)} đ × KPI ${editedSlip.primarySalary.kpiPercent}% + Thưởng ${formatVND(editedSlip.primarySalary.bonus)} đ)
${editedSlip.pieceworkItems.length > 0 ? `📦 Lương sản phẩm (LTSP): ${formatVND(editedSlip.pieceworkItems.reduce((s, i) => s + i.totalAmount, 0))} đ\n` + editedSlip.pieceworkItems.map(p => `  • ${p.workName}: ${p.quantity} ${p.unit} × ${formatVND(p.unitPrice)} đ = ${formatVND(p.totalAmount)} đ`).join('\n') : ''}
${editedSlip.generalBonus > 0 ? `🎁 Thưởng thêm: +${formatVND(editedSlip.generalBonus)} đ\n` : ''}
${editedSlip.deductions > 0 ? `⚠️ Giảm trừ: -${formatVND(editedSlip.deductions)} đ (${editedSlip.deductionReason || 'Khấu trừ'})\n` : ''}
---------------------------
💵 TỔNG CỘNG THỰC NHẬN: ${formatVND(editedSlip.totalSalary)} VNĐ
Trân trọng cảm ơn sự đồng hành và cống hiến của bạn cùng Triple D!`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const currentData = isEditing ? editedSlip : slip;
  const isTeachingType = currentData.formatType === 'teaching';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[96vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Modal Top Control Bar (Hidden on Print) */}
        <div className="no-print flex items-center justify-between px-3 sm:px-6 py-3 bg-slate-900 text-white border-b border-slate-800 gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-sm shrink-0">
              3D
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-xs sm:text-base text-white whitespace-nowrap overflow-hidden text-ellipsis">
                Phiếu Lương: {currentData.staffName}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 whitespace-nowrap overflow-hidden text-ellipsis">
                Tháng {formatMonthDisplay(currentData.month)} • {currentData.departmentName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 flex-nowrap">
            {/* Status switcher */}
            <select
              value={currentData.status}
              onChange={e => updateSlipStatus(currentData.id, e.target.value as any)}
              className={`text-xs font-bold py-1.5 px-2 rounded-lg border cursor-pointer whitespace-nowrap shrink-0 ${
                currentData.status === 'paid'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                  : currentData.status === 'approved'
                  ? 'bg-sky-950 text-sky-300 border-sky-700'
                  : 'bg-amber-950 text-amber-300 border-amber-700'
              }`}
            >
              <option value="draft">Bản nháp</option>
              <option value="approved">Đã duyệt</option>
              <option value="paid">Đã thanh toán</option>
            </select>

            {/* Edit mode toggle */}
            <button
              onClick={() => {
                if (isEditing) handleSave();
                else setIsEditing(true);
              }}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                isEditing
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            >
              {isEditing ? (
                <>
                  <Save className="w-3.5 h-3.5 shrink-0" />
                  <span className="whitespace-nowrap">Lưu</span>
                </>
              ) : (
                <>
                  <Edit3 className="w-3.5 h-3.5 shrink-0" />
                  <span className="whitespace-nowrap">Chỉnh sửa</span>
                </>
              )}
            </button>

            {/* Print button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer whitespace-nowrap shrink-0"
              title="In phiếu lương chuẩn A4"
            >
              <Printer className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline whitespace-nowrap">In</span>
            </button>

            {/* Export PDF */}
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer whitespace-nowrap shrink-0"
              title="Tải file PDF"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline whitespace-nowrap">PDF</span>
            </button>

            {/* Export PNG */}
            <button
              onClick={handleExportPNG}
              disabled={isExporting}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer whitespace-nowrap shrink-0"
              title="Tải ảnh PNG gửi Zalo"
            >
              <ImageIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline whitespace-nowrap">Ảnh</span>
            </button>

            {/* Copy Summary */}
            <button
              onClick={handleCopySummary}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer whitespace-nowrap shrink-0"
              title="Sao chép nội dung tóm tắt để gửi Zalo"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
              <span className="hidden sm:inline whitespace-nowrap">{copied ? 'Đã chép' : 'Copy'}</span>
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-0.5 shrink-0 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-8 bg-slate-100/70 flex justify-center">
          
          {/* Authentic Document Sheet (Print Area) */}
          <div
            id="printable-payslip-content"
            style={{ fontFamily: "'Times New Roman', Times, 'Liberation Serif', serif" }}
            className="print-container payslip-times-roman bg-white w-full max-w-[780px] p-5 sm:p-7 shadow-sm sm:rounded-xl border border-slate-300 text-slate-900 font-serif leading-normal my-auto"
          >
            
            {/* Title Header */}
            <div className="text-center mb-4">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-black uppercase">
                Phiếu Lương Tháng {formatMonthDisplay(currentData.month)}
              </h1>
            </div>

            {/* Header Info Table (Border Solid) */}
            <table className="w-full border-collapse border border-black text-sm sm:text-base mb-4">
              <tbody>
                <tr className="border-b border-black">
                  <td className="border-r border-black p-2.5 w-[70%]">
                    <span>Họ tên: </span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedSlip.staffName}
                        onChange={e => setEditedSlip({ ...editedSlip, staffName: e.target.value })}
                        className="font-bold border-b border-slate-400 px-1 py-0.5 w-60"
                      />
                    ) : (
                      <span className="font-bold text-black">{currentData.staffName}</span>
                    )}
                  </td>
                  <td className="p-2.5 w-[30%]">
                    <span>Mã NV: </span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedSlip.staffCode}
                        onChange={e => setEditedSlip({ ...editedSlip, staffCode: e.target.value })}
                        className="font-medium border-b border-slate-400 px-1 py-0.5 w-24"
                      />
                    ) : (
                      <span className="font-medium">{currentData.staffCode || ''}</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="border-r border-black p-2.5">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span>Chức danh: </span>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedSlip.role}
                            onChange={e => setEditedSlip({ ...editedSlip, role: e.target.value })}
                            className="font-medium border-b border-slate-400 px-1 py-0.5 w-28"
                          />
                        ) : (
                          <span className="font-medium">{currentData.role}</span>
                        )}
                      </div>
                      <div className="border-l border-black pl-2">
                        <span>Số TKNH: </span>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedSlip.bankAccount}
                            onChange={e => setEditedSlip({ ...editedSlip, bankAccount: e.target.value })}
                            className="font-medium border-b border-slate-400 px-1 py-0.5 w-32"
                          />
                        ) : (
                          <span className="font-medium">{currentData.bankAccount || ''}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-2.5">
                    <span>Bộ Phận: </span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedSlip.departmentName}
                        onChange={e => setEditedSlip({ ...editedSlip, departmentName: e.target.value })}
                        className="font-medium border-b border-slate-400 px-1 py-0.5 w-28"
                      />
                    ) : (
                      <span className="font-medium">{currentData.departmentName}</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* FORMAT 1: MẪU LƯƠNG DẠY HỌC */}
            {isTeachingType && (
              <div>
                <h4 className="font-bold text-sm sm:text-base mb-2 text-black">
                  Thành phần lương:
                </h4>

                <table className="w-full border-collapse border border-black text-sm sm:text-base mb-6">
                  <thead>
                    <tr className="bg-slate-50 border-b border-black text-center font-bold">
                      <th className="border-r border-black p-2.5 w-[25%] font-bold">Thành phần</th>
                      <th className="border-r border-black p-2.5 w-[15%] font-bold">Buổi</th>
                      <th className="border-r border-black p-2.5 w-[20%] font-bold">Đơn giá (Buổi)</th>
                      <th className="border-r border-black p-2.5 w-[18%] font-bold">
                        Hiệu suất (KPI)<sup>(1)</sup>
                      </th>
                      <th className="p-2.5 w-[22%] font-bold">
                        Nhận thực tế (tháng)<sup>(2)</sup>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Row 1: Lương dạy */}
                    <tr className="border-b border-black text-center">
                      <td className="border-r border-black p-2.5 text-left pl-3 font-medium">
                        1. Lương dạy
                      </td>
                      <td className="border-r border-black p-2.5">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editedSlip.primarySalary.daysOrSessions}
                            onChange={e =>
                              setEditedSlip({
                                ...editedSlip,
                                primarySalary: {
                                  ...editedSlip.primarySalary,
                                  daysOrSessions: Number(e.target.value),
                                },
                              })
                            }
                            className="w-16 text-center border border-slate-300 rounded p-1 font-bold"
                          />
                        ) : (
                          <span>{currentData.primarySalary.daysOrSessions}</span>
                        )}
                      </td>
                      <td className="border-r border-black p-2.5 text-right pr-3 font-medium">
                        {isEditing ? (
                          <input
                            type="number"
                            step="1000"
                            value={editedSlip.primarySalary.unitPrice}
                            onChange={e =>
                              setEditedSlip({
                                ...editedSlip,
                                primarySalary: {
                                  ...editedSlip.primarySalary,
                                  unitPrice: Number(e.target.value),
                                },
                              })
                            }
                            className="w-24 text-right border border-slate-300 rounded p-1 font-bold"
                          />
                        ) : (
                          formatVND(currentData.primarySalary.unitPrice)
                        )}
                      </td>
                      <td className="border-r border-black p-2.5 font-medium">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editedSlip.primarySalary.kpiPercent}
                            onChange={e =>
                              setEditedSlip({
                                ...editedSlip,
                                primarySalary: {
                                  ...editedSlip.primarySalary,
                                  kpiPercent: Number(e.target.value),
                                },
                              })
                            }
                            className="w-16 text-center border border-slate-300 rounded p-1 font-bold"
                          />
                        ) : (
                          `${currentData.primarySalary.kpiPercent}%`
                        )}
                      </td>
                      <td className="p-2.5 text-right pr-3 font-semibold text-black">
                        {formatVND(
                          Math.round(
                            currentData.primarySalary.daysOrSessions *
                              currentData.primarySalary.unitPrice *
                              (currentData.primarySalary.kpiPercent / 100)
                          )
                        )}
                      </td>
                    </tr>

                    {/* Row 2: Thưởng */}
                    <tr className="border-b border-black text-center">
                      <td className="border-r border-black p-2.5 text-left pl-3 font-medium">
                        2. Thưởng
                      </td>
                      <td className="border-r border-black p-2.5 bg-slate-300"></td>
                      <td className="border-r border-black p-2.5 text-right pr-3">
                        {isEditing ? (
                          <input
                            type="number"
                            step="10000"
                            value={editedSlip.primarySalary.bonus}
                            onChange={e =>
                              setEditedSlip({
                                ...editedSlip,
                                primarySalary: {
                                  ...editedSlip.primarySalary,
                                  bonus: Number(e.target.value),
                                },
                              })
                            }
                            className="w-24 text-right border border-slate-300 rounded p-1"
                          />
                        ) : (
                          currentData.primarySalary.bonus > 0 ? formatVND(currentData.primarySalary.bonus) : '—'
                        )}
                      </td>
                      <td className="border-r border-black p-2.5 bg-slate-300"></td>
                      <td className="p-2.5 text-right pr-3 font-medium">
                        {currentData.primarySalary.bonus > 0 ? formatVND(currentData.primarySalary.bonus) : '—'}
                      </td>
                    </tr>

                    {/* Additional Piecework / Duties if any (Kiêm nhiệm Trợ giảng, Chấm thi...) */}
                    {currentData.pieceworkItems.map((item, idx) => (
                      <tr key={item.id} className="border-b border-black text-center">
                        <td className="border-r border-black p-2.5 text-left pl-3 font-medium">
                          {idx + 3}. {item.workName}
                        </td>
                        <td className="border-r border-black p-2.5">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="border-r border-black p-2.5 text-right pr-3 font-medium">
                          {formatVND(item.unitPrice)}
                        </td>
                        <td className="border-r border-black p-2.5 font-medium">
                          {item.kpiPercent}%
                        </td>
                        <td className="p-2.5 text-right pr-3 font-semibold text-black">
                          {formatVND(item.totalAmount)}
                        </td>
                      </tr>
                    ))}

                    {/* Row 3: Tổng cộng */}
                    <tr className="font-bold">
                      <td className="border-r border-black p-2.5 text-left pl-3 text-slate-800">
                        Tổng cộng
                      </td>
                      <td colSpan={3} className="border-r border-black p-2.5"></td>
                      <td className="p-2.5 text-right pr-3 text-base text-slate-900 font-extrabold">
                        {formatVND(currentData.totalSalary)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* FORMAT 2: MẪU LƯƠNG TRỢ LÝ & LƯƠNG THEO SẢN PHẨM (LTSP) */}
            {!isTeachingType && (
              <div>
                {/* 1. Lương chính */}
                <h4 className="font-bold text-sm sm:text-base mb-2 text-black">
                  Lương chính: (1)
                </h4>

                <table className="w-full border-collapse border border-black text-sm sm:text-base mb-4">
                  <thead>
                    <tr className="bg-slate-50 border-b border-black text-center font-bold">
                      <th className="border-r border-black p-2.5 w-[25%] font-bold">Thành phần</th>
                      <th className="border-r border-black p-2.5 w-[15%] font-bold">Ngày công</th>
                      <th className="border-r border-black p-2.5 w-[20%] font-bold">Lương (ngày)</th>
                      <th className="border-r border-black p-2.5 w-[18%] font-bold">
                        Hiệu suất (KPI)<sup>(1)</sup>
                      </th>
                      <th className="p-2.5 w-[22%] font-bold">
                        Nhận thực tế (tháng)<sup>(2)</sup>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Row: Lương gốc */}
                    <tr className="border-b border-black text-center">
                      <td className="border-r border-black p-2.5 text-left pl-3 font-medium">
                        1. Lương gốc
                      </td>
                      <td className="border-r border-black p-2.5">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editedSlip.primarySalary.daysOrSessions}
                            onChange={e =>
                              setEditedSlip({
                                ...editedSlip,
                                primarySalary: {
                                  ...editedSlip.primarySalary,
                                  daysOrSessions: Number(e.target.value),
                                },
                              })
                            }
                            className="w-16 text-center border border-slate-300 rounded p-1 font-bold"
                          />
                        ) : (
                          <span>{currentData.primarySalary.daysOrSessions}</span>
                        )}
                      </td>
                      <td className="border-r border-black p-2.5 text-right pr-3 font-medium">
                        {isEditing ? (
                          <input
                            type="number"
                            step="1000"
                            value={editedSlip.primarySalary.unitPrice}
                            onChange={e =>
                              setEditedSlip({
                                ...editedSlip,
                                primarySalary: {
                                  ...editedSlip.primarySalary,
                                  unitPrice: Number(e.target.value),
                                },
                              })
                            }
                            className="w-24 text-right border border-slate-300 rounded p-1 font-bold"
                          />
                        ) : (
                          formatVND(currentData.primarySalary.unitPrice)
                        )}
                      </td>
                      <td className="border-r border-black p-2.5 font-medium">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editedSlip.primarySalary.kpiPercent}
                            onChange={e =>
                              setEditedSlip({
                                ...editedSlip,
                                primarySalary: {
                                  ...editedSlip.primarySalary,
                                  kpiPercent: Number(e.target.value),
                                },
                              })
                            }
                            className="w-16 text-center border border-slate-300 rounded p-1 font-bold"
                          />
                        ) : (
                          `${currentData.primarySalary.kpiPercent}%`
                        )}
                      </td>
                      <td className="p-2.5 text-right pr-3 font-semibold text-black">
                        {formatVND(
                          Math.round(
                            currentData.primarySalary.daysOrSessions *
                              currentData.primarySalary.unitPrice *
                              (currentData.primarySalary.kpiPercent / 100)
                          )
                        )}
                      </td>
                    </tr>

                    {/* Row: Thưởng */}
                    <tr className="text-center">
                      <td className="border-r border-black p-2.5 text-left pl-3 font-medium">
                        2. Thưởng
                      </td>
                      <td className="border-r border-black p-2.5 bg-slate-300"></td>
                      <td className="border-r border-black p-2.5 text-right pr-3 font-medium">
                        {isEditing ? (
                          <input
                            type="number"
                            step="10000"
                            value={editedSlip.primarySalary.bonus}
                            onChange={e =>
                              setEditedSlip({
                                ...editedSlip,
                                primarySalary: {
                                  ...editedSlip.primarySalary,
                                  bonus: Number(e.target.value),
                                },
                              })
                            }
                            className="w-24 text-right border border-slate-300 rounded p-1"
                          />
                        ) : (
                          currentData.primarySalary.bonus > 0 ? formatVND(currentData.primarySalary.bonus) : '—'
                        )}
                      </td>
                      <td className="border-r border-black p-2.5 bg-slate-300"></td>
                      <td className="p-2.5 text-right pr-3 font-medium">
                        {currentData.primarySalary.bonus > 0 ? formatVND(currentData.primarySalary.bonus) : '0'}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* 2. Lương theo sản phẩm (LTSP) */}
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-sm sm:text-base text-black">
                    Lương theo sản phẩm (LTSP): (2)
                  </h4>
                  {isEditing && (
                    <button
                      onClick={handleAddPieceworkItem}
                      className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-2 py-1 rounded flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Thêm công việc
                    </button>
                  )}
                </div>

                <table className="w-full border-collapse border border-black text-sm sm:text-base mb-6">
                  <thead>
                    <tr className="bg-slate-50 border-b border-black text-center font-bold">
                      <th className="border-r border-black p-2.5 w-[25%] font-bold">Công việc</th>
                      <th className="border-r border-black p-2.5 w-[15%] font-bold">Số lượng</th>
                      <th className="border-r border-black p-2.5 w-[20%] font-bold">
                        Đơn giá<sup>(3)</sup>
                      </th>
                      <th className="border-r border-black p-2.5 w-[18%] font-bold">Hiệu suất</th>
                      <th className="p-2.5 w-[22%] font-bold">Nhận thực tế (sản phẩm)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentData.pieceworkItems.map((item, idx) => (
                      <tr key={item.id} className="border-b border-black text-center">
                        <td className="border-r border-black p-2.5 text-left pl-3 font-medium">
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={item.workName}
                                onChange={e => {
                                  const copy = [...editedSlip.pieceworkItems];
                                  copy[idx].workName = e.target.value;
                                  setEditedSlip({ ...editedSlip, pieceworkItems: copy });
                                }}
                                className="w-full border border-slate-300 rounded px-1 py-0.5 text-xs font-medium"
                              />
                              <button
                                onClick={() => handleRemovePieceworkItem(item.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span>{item.workName}</span>
                          )}
                        </td>
                        <td className="border-r border-black p-2.5">
                          {item.workName.includes('Thưởng') ? (
                            <div className="bg-slate-300 h-full w-full py-2"></div>
                          ) : isEditing ? (
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={e => {
                                  const copy = [...editedSlip.pieceworkItems];
                                  copy[idx].quantity = Number(e.target.value);
                                  setEditedSlip({ ...editedSlip, pieceworkItems: copy });
                                }}
                                className="w-12 text-center border border-slate-300 rounded p-0.5"
                              />
                              <span className="text-xs">{item.unit}</span>
                            </div>
                          ) : (
                            <span>{item.quantity} {item.unit}</span>
                          )}
                        </td>
                        <td className="border-r border-black p-2.5 text-right pr-3 font-medium">
                          {isEditing ? (
                            <input
                              type="number"
                              step="1000"
                              value={item.unitPrice}
                              onChange={e => {
                                const copy = [...editedSlip.pieceworkItems];
                                copy[idx].unitPrice = Number(e.target.value);
                                setEditedSlip({ ...editedSlip, pieceworkItems: copy });
                              }}
                              className="w-20 text-right border border-slate-300 rounded p-0.5"
                            />
                          ) : (
                            formatVND(item.unitPrice)
                          )}
                        </td>
                        <td className="border-r border-black p-2.5 font-medium">
                          {item.workName.includes('Thưởng') ? (
                            <div className="bg-slate-300 h-full w-full py-2"></div>
                          ) : isEditing ? (
                            <input
                              type="number"
                              value={item.kpiPercent}
                              onChange={e => {
                                const copy = [...editedSlip.pieceworkItems];
                                copy[idx].kpiPercent = Number(e.target.value);
                                setEditedSlip({ ...editedSlip, pieceworkItems: copy });
                              }}
                              className="w-12 text-center border border-slate-300 rounded p-0.5"
                            />
                          ) : (
                            `${item.kpiPercent}%`
                          )}
                        </td>
                        <td className="p-2.5 text-right pr-3 font-semibold text-black">
                          {formatVND(
                            Math.round(item.quantity * item.unitPrice * (item.kpiPercent / 100)) +
                              Number(item.bonus || 0)
                          )}
                        </td>
                      </tr>
                    ))}

                    {/* Total Row */}
                    <tr className="font-bold">
                      <td className="border-r border-black p-2.5 text-left pl-3 text-slate-900">
                        Tổng cộng
                      </td>
                      <td colSpan={3} className="border-r border-black p-2.5"></td>
                      <td className="p-2.5 text-right pr-3 text-base text-slate-900 font-extrabold">
                        {formatVND(currentData.totalSalary)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Notes Section (Solid border) */}
            {(() => {
              const cleanNote = (text?: string, prefix?: string, fallback?: string) => {
                if (!text) return fallback || '';
                let cleaned = text;
                if (prefix && cleaned.startsWith(prefix)) {
                  cleaned = cleaned.slice(prefix.length).trim();
                }
                // Also remove general (1): / (2): / (3): prefixes if present
                cleaned = cleaned.replace(/^\(\d+\):\s*/, '').trim();
                if (cleaned.includes('5 hạng mục chuẩn')) {
                  return 'Đơn giá tính theo thỏa thuận ban đầu';
                }
                return cleaned;
              };
              return (
                <div className="border border-black p-3 text-xs sm:text-sm mb-5 text-slate-900 space-y-1 leading-relaxed">
                  <div className="grid grid-cols-[100px_1fr] items-start">
                    <div className="font-bold">Chú thích</div>
                    <div className="space-y-1">
                      <p>
                        <strong>(1):</strong> {cleanNote(currentData.notes?.note1, '(1):', isTeachingType ? 'Đánh giá dựa trên “Bảng Kiểm” tương ứng. KPI là giá trị % chất lượng công việc trong tháng.' : 'Đánh giá dựa trên “Bảng Kiểm” tương ứng.')}
                      </p>
                      <p>
                        <strong>(2):</strong> {cleanNote(currentData.notes?.note2, '(2):', isTeachingType ? 'Lương nhận thực tế là “Số lượng × Đơn Giá × KPI”' : 'Lương nhận thực tế là “Khối lượng (Ngày/Buổi/Bài) × Đơn Giá × KPI”')}
                      </p>
                      <p>
                        <strong>(3):</strong> {cleanNote(currentData.notes?.note3, '(3):', isTeachingType ? 'Đơn giá có thể tùy chỉnh linh hoạt theo từng nhân sự & ca dạy' : 'Đơn giá tính theo thỏa thuận ban đầu')}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Signatures Area */}
            <div className="grid grid-cols-2 gap-8 text-center pt-2">
              
              {/* Manager Column */}
              <div className="flex flex-col items-center">
                {isEditing ? (
                  <input
                    type="text"
                    value={editedSlip.signatures.managerTitle}
                    onChange={e => setEditedSlip({
                      ...editedSlip,
                      signatures: { ...editedSlip.signatures, managerTitle: e.target.value }
                    })}
                    className="font-bold text-xs sm:text-sm uppercase text-center border-b border-slate-400 px-1 py-0.5 w-48 mb-1"
                  />
                ) : (
                  <p className="font-bold text-sm sm:text-base uppercase tracking-tight text-black">
                    {currentData.signatures.managerTitle || orgSettings.managerTitle}
                  </p>
                )}
                
                <p className="text-xs sm:text-sm italic text-slate-600 mb-1">
                  (Ký và ghi rõ họ tên)
                </p>

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={editManagerImgRef}
                  onChange={e => handleEditSignatureUpload(e, 'managerSignatureImg')}
                  accept="image/*"
                  className="hidden"
                />
                
                {/* Signature Image / Vector */}
                <div className="h-20 flex items-center justify-center my-1">
                  {(() => {
                    const img = currentData.signatures.managerSignatureImg !== undefined
                      ? currentData.signatures.managerSignatureImg
                      : orgSettings.managerSignatureImg;

                    if (img && img !== 'none') {
                      return <img src={img} alt="Chữ ký người điều hành" className="max-h-18 max-w-[180px] object-contain" />;
                    }
                    if (img === 'none') {
                      return <span className="text-xs italic text-slate-400 no-print">(Chưa ký)</span>;
                    }
                    if (orgSettings.showSignatures) {
                      return <ManagerSignatureSvg className="w-44 h-18" />;
                    }
                    return null;
                  })()}
                </div>

                {isEditing && (
                  <div className="no-print my-1 flex items-center gap-1.5 flex-wrap justify-center">
                    <button
                      type="button"
                      onClick={() => editManagerImgRef.current?.click()}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded border border-slate-300 flex items-center gap-1 cursor-pointer"
                      title="Tải ảnh chữ ký lên"
                    >
                      <Upload className="w-3 h-3 text-slate-600" />
                      <span>Up ảnh</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditedSlip(prev => ({
                        ...prev,
                        signatures: { ...prev.signatures, managerSignatureImg: 'none' }
                      }))}
                      className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold rounded border border-rose-200 flex items-center gap-1 cursor-pointer"
                      title="Xóa chữ ký (để trống)"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Xóa</span>
                    </button>
                    {editedSlip.signatures.managerSignatureImg !== undefined && (
                      <button
                        type="button"
                        onClick={() => setEditedSlip(prev => ({
                          ...prev,
                          signatures: { ...prev.signatures, managerSignatureImg: undefined }
                        }))}
                        className="px-1.5 py-0.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[11px] font-semibold rounded border border-slate-200 cursor-pointer"
                        title="Khôi phục chữ ký mặc định"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}

                {isEditing ? (
                  <input
                    type="text"
                    value={editedSlip.signatures.managerName}
                    onChange={e => setEditedSlip({
                      ...editedSlip,
                      signatures: { ...editedSlip.signatures, managerName: e.target.value }
                    })}
                    className="font-bold text-xs sm:text-sm text-center border-b border-slate-400 px-1 py-0.5 w-48 mt-1"
                  />
                ) : (
                  <p className="font-bold text-sm sm:text-base text-black mt-1">
                    {currentData.signatures.managerName || orgSettings.managerName}
                  </p>
                )}
              </div>

              {/* Finance Column */}
              <div className="flex flex-col items-center">
                {isEditing ? (
                  <input
                    type="text"
                    value={editedSlip.signatures.financeTitle}
                    onChange={e => setEditedSlip({
                      ...editedSlip,
                      signatures: { ...editedSlip.signatures, financeTitle: e.target.value }
                    })}
                    className="font-bold text-xs sm:text-sm uppercase text-center border-b border-slate-400 px-1 py-0.5 w-48 mb-1"
                  />
                ) : (
                  <p className="font-bold text-sm sm:text-base uppercase tracking-tight text-black">
                    {currentData.signatures.financeTitle || orgSettings.financeTitle}
                  </p>
                )}

                <p className="text-xs sm:text-sm italic text-slate-600 mb-1">
                  (Ký và duyệt)
                </p>

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={editFinanceImgRef}
                  onChange={e => handleEditSignatureUpload(e, 'financeSignatureImg')}
                  accept="image/*"
                  className="hidden"
                />

                {/* Signature Image / Vector */}
                <div className="h-20 flex items-center justify-center my-1">
                  {(() => {
                    const img = currentData.signatures.financeSignatureImg !== undefined
                      ? currentData.signatures.financeSignatureImg
                      : orgSettings.financeSignatureImg;

                    if (img && img !== 'none') {
                      return <img src={img} alt="Chữ ký phụ trách kinh tế" className="max-h-18 max-w-[180px] object-contain" />;
                    }
                    if (img === 'none') {
                      return <span className="text-xs italic text-slate-400 no-print">(Chưa ký)</span>;
                    }
                    if (orgSettings.showSignatures) {
                      return <FinanceSignatureSvg className="w-44 h-18" />;
                    }
                    return null;
                  })()}
                </div>

                {isEditing && (
                  <div className="no-print my-1 flex items-center gap-1.5 flex-wrap justify-center">
                    <button
                      type="button"
                      onClick={() => editFinanceImgRef.current?.click()}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded border border-slate-300 flex items-center gap-1 cursor-pointer"
                      title="Tải ảnh chữ ký lên"
                    >
                      <Upload className="w-3 h-3 text-slate-600" />
                      <span>Up ảnh</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditedSlip(prev => ({
                        ...prev,
                        signatures: { ...prev.signatures, financeSignatureImg: 'none' }
                      }))}
                      className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold rounded border border-rose-200 flex items-center gap-1 cursor-pointer"
                      title="Xóa chữ ký (để trống)"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Xóa</span>
                    </button>
                    {editedSlip.signatures.financeSignatureImg !== undefined && (
                      <button
                        type="button"
                        onClick={() => setEditedSlip(prev => ({
                          ...prev,
                          signatures: { ...prev.signatures, financeSignatureImg: undefined }
                        }))}
                        className="px-1.5 py-0.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[11px] font-semibold rounded border border-slate-200 cursor-pointer"
                        title="Khôi phục chữ ký mặc định"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}

                {isEditing ? (
                  <input
                    type="text"
                    value={editedSlip.signatures.financeName}
                    onChange={e => setEditedSlip({
                      ...editedSlip,
                      signatures: { ...editedSlip.signatures, financeName: e.target.value }
                    })}
                    className="font-bold text-xs sm:text-sm text-center border-b border-slate-400 px-1 py-0.5 w-48 mt-1"
                  />
                ) : (
                  <p className="font-bold text-sm sm:text-base text-black mt-1">
                    {currentData.signatures.financeName || orgSettings.financeName}
                  </p>
                )}
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
