import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MonthlyPayrollSlip, PieceworkSalaryItem } from '../../types';
import { getStaffAssignedChecklists } from '../../data/roleDefinitions';
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
  const { savePayrollSlip, updateSlipStatus, orgSettings, showToast, staffList, evaluations, checklistTemplates } = useApp();
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
    const currentStaff = staffList.find(s => s.id === editedSlip.staffId || s.code === editedSlip.staffCode);
    const bankInfo = editedSlip.bankName || currentStaff?.bankName || '';
    const text = `📋 THÔNG BÁO PHIẾU LƯƠNG THÁNG ${formatMonthDisplay(editedSlip.month)} - TRIPLE D
👤 Họ tên: ${editedSlip.staffName} (Mã NV: ${editedSlip.staffCode || '---'})
🏷️ Chức danh: ${editedSlip.role}
💳 STK: ${editedSlip.bankAccount || '---'}${bankInfo ? ` (${bankInfo})` : ''}
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
  const currentStaff = staffList.find(s => s.id === currentData.staffId || s.code === currentData.staffCode);
  const staffBankName = currentStaff?.bankName || '';
  const isTeachingType = currentData.formatType === 'teaching';

  const normMonth = (currentData.month || '').trim().substring(0, 7);
  const staffEvaluations = evaluations.filter(e => {
    const isSameMonth = (e.month || '').trim().substring(0, 7) === normMonth;
    const isForStaff = e.staffId === currentData.staffId || 
                       (currentData.staffCode && e.staffId === currentData.staffCode) ||
                       (currentStaff?.id && e.staffId === currentStaff.id) ||
                       (currentStaff?.code && e.staffId === currentStaff.code);
    return isSameMonth && isForStaff;
  });

  // Fallback to virtual/unrated checklist templates if no official evaluations exist for this month
  let displayEvaluations: any[] = [...staffEvaluations];
  if (displayEvaluations.length === 0 && currentStaff) {
    const assignedTemplates = getStaffAssignedChecklists(currentStaff, checklistTemplates);
    if (assignedTemplates.length > 0) {
      displayEvaluations = assignedTemplates.map(t => ({
        id: `virtual_eval_${t.id}_${currentStaff.id}`,
        staffId: currentStaff.id,
        month: normMonth,
        templateId: t.id,
        evaluationDate: new Date().toISOString().substring(0, 10),
        evaluatorName: 'Ban kiểm duyệt',
        scores: {}, // Empty scores will fallback to 100% in the renderer
        calculatedTotalKpi: 100,
        notes: '',
        isVirtual: true,
      }));
    }
  }

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
                  <td className="border-r border-black p-2.5 w-[65%]">
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
                  <td className="p-2.5 w-[35%]">
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
                  <td className="border-r border-black p-2.5 w-[65%]">
                    <span>Chức danh: </span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedSlip.role}
                        onChange={e => setEditedSlip({ ...editedSlip, role: e.target.value })}
                        className="font-medium border-b border-slate-400 px-1 py-0.5 w-56"
                      />
                    ) : (
                      <span className="font-medium">{currentData.role}</span>
                    )}
                  </td>
                  <td className="p-2.5 w-[35%]">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-x-2.5 gap-y-1">
                      <div>
                        <span>Ngân hàng: </span>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedSlip.bankName || ''}
                            onChange={e => setEditedSlip({ ...editedSlip, bankName: e.target.value })}
                            className="font-medium border-b border-slate-400 px-1 py-0.5 w-24"
                            placeholder="Tên ngân hàng"
                          />
                        ) : (
                          <span className="font-medium">{currentData.bankName || staffBankName || '—'}</span>
                        )}
                      </div>
                      <div className="sm:border-l sm:border-slate-300 sm:pl-2">
                        <span>Số TK: </span>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedSlip.bankAccount}
                            onChange={e => setEditedSlip({ ...editedSlip, bankAccount: e.target.value })}
                            className="font-medium border-b border-slate-400 px-1 py-0.5 w-28"
                            placeholder="Số tài khoản"
                          />
                        ) : (
                          <span className="font-medium">{currentData.bankAccount || '—'}</span>
                        )}
                      </div>
                    </div>
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
                        Hiệu suất<sup>(1)</sup>
                      </th>
                      <th className="p-2.5 w-[22%] font-bold text-center leading-tight">
                        <span className="whitespace-nowrap">Nhận thực tế</span>
                        <br />
                        <span className="whitespace-nowrap font-bold text-xs sm:text-sm">(tháng)<sup>(2)</sup></span>
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
                        Hiệu suất<sup>(1)</sup>
                      </th>
                      <th className="p-2.5 w-[22%] font-bold text-center leading-tight">
                        <span className="whitespace-nowrap">Nhận thực tế</span>
                        <br />
                        <span className="whitespace-nowrap font-bold text-xs sm:text-sm">(tháng)<sup>(2)</sup></span>
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
                      <th className="p-2.5 w-[22%] font-bold text-center leading-tight">
                        <span className="whitespace-nowrap">Nhận thực tế</span>
                        <br />
                        <span className="whitespace-nowrap font-bold text-xs sm:text-sm">(sản phẩm)</span>
                      </th>
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
            <div className="grid grid-cols-2 gap-8 text-center pt-8 break-inside-avoid print:break-inside-avoid" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
              
              {/* Employee Column */}
              <div className="flex flex-col items-center justify-between min-h-[160px]">
                <div>
                  <p className="font-bold text-xs sm:text-sm uppercase tracking-wider text-slate-700 mb-1">
                    NHÂN SỰ ĐƯỢC ĐÁNH GIÁ
                  </p>
                  <p className="text-xs sm:text-sm italic text-slate-500">
                    (Ký xác nhận)
                  </p>
                </div>
                <div className="h-16"></div> {/* Whitespace for signing */}
                <p className="font-bold text-sm sm:text-base text-black">
                  {currentData.staffName}
                </p>
              </div>

              {/* Evaluator Column */}
              <div className="flex flex-col items-center justify-between min-h-[160px]">
                <div>
                  <p className="font-bold text-xs sm:text-sm uppercase tracking-wider text-slate-700 mb-1">
                    NGƯỜI ĐÁNH GIÁ / TRƯỞNG BỘ PHẬN
                  </p>
                  <p className="text-xs sm:text-sm italic text-slate-500">
                    (Ký và duyệt)
                  </p>
                </div>
                <div className="h-16"></div> {/* Whitespace for signing */}
                <p className="font-bold text-sm sm:text-base text-black">
                  Ban kiểm duyệt
                </p>
              </div>

            </div>

            {/* KPI Checklist Scores Block */}
            {displayEvaluations.length > 0 && (
              <div className="mt-8 border-t-2 border-slate-200 pt-6">
                {displayEvaluations.map((evalRec, evalIdx) => {
                  const template = checklistTemplates.find(t => t.id === evalRec.templateId);
                  return (
                    <div 
                      key={evalRec.id} 
                      className="border-t border-slate-300 pt-8 break-inside-avoid print:break-inside-avoid print:break-before-page mt-12"
                      style={{ 
                        pageBreakBefore: 'always', 
                        pageBreakInside: 'avoid', 
                        breakInside: 'avoid' 
                      }}
                    >
                      {/* Logo and Header */}
                      <div className="flex items-center justify-between border-b border-black pb-3 mb-6 break-inside-avoid print:break-inside-avoid" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                        <div>
                          <h4 className="font-bold text-lg text-black uppercase tracking-tight">ÔN THI HSGQG SINH HỌC</h4>
                          <p className="text-xs text-slate-500">Hệ thống quản trị nhân sự & đào tạo</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-mono text-xs font-bold border border-black px-2 py-0.5 rounded uppercase whitespace-nowrap">
                            KPI - {template?.code || 'BK'}
                          </span>
                        </div>
                      </div>

                      {/* Sheet Title */}
                      <div className="text-center mb-6 break-inside-avoid print:break-inside-avoid" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                        <h2 className="text-xl sm:text-2xl font-bold uppercase text-black leading-tight">
                          BẢNG ĐÁNH GIÁ CHẤT LƯỢNG CÔNG VIỆC (KPI)
                        </h2>
                        <p className="text-xs sm:text-sm italic font-serif text-slate-700 mt-1">
                          Áp dụng cho kỳ: Tháng {formatMonthDisplay(currentData.month)}
                        </p>
                      </div>

                      {/* Staff & Evaluator Metadata Table */}
                      <table 
                        className="w-full border-collapse border border-black text-xs sm:text-sm mb-6 break-inside-avoid print:break-inside-avoid"
                        style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
                      >
                        <tbody>
                          <tr className="border-b border-black break-inside-avoid print:break-inside-avoid" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                            <td className="border-r border-black p-2.5 w-[50%]">
                              <span>Nhân sự được đánh giá: </span>
                              <strong className="text-black">{currentData.staffName}</strong>
                            </td>
                            <td className="p-2.5 w-[50%]">
                              <span>Mã nhân viên: </span>
                              <strong className="text-black">{currentData.staffCode || '—'}</strong>
                            </td>
                          </tr>
                          <tr className="border-b border-black break-inside-avoid print:break-inside-avoid" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                            <td className="border-r border-black p-2.5">
                              <span>Người đánh giá: </span>
                              <strong className="text-black">{evalRec.evaluatorName || 'Ban kiểm duyệt'}</strong>
                            </td>
                            <td className="p-2.5">
                              <span>Ngày đánh giá: </span>
                              <strong className="text-black">{evalRec.evaluationDate ? new Date(evalRec.evaluationDate).toLocaleDateString('vi-VN') : '—'}</strong>
                            </td>
                          </tr>
                          <tr className="bg-slate-50 break-inside-avoid print:break-inside-avoid" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                            <td className="border-r border-black p-2.5">
                              <span>Bảng kiểm áp dụng: </span>
                              <strong className="text-black">{template?.title || 'Bảng kiểm chuyên môn'}</strong>
                            </td>
                            <td className="p-2.5">
                              <span>Điểm KPI tổng hợp: </span>
                              <strong className="text-base text-black font-extrabold">{evalRec.calculatedTotalKpi}%</strong>
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Criteria Scorecard Table */}
                      <table 
                        className="w-full border-collapse border border-black text-xs sm:text-sm mb-6 break-inside-avoid print:break-inside-avoid"
                        style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
                      >
                        <thead>
                          <tr className="bg-slate-100 border-b border-black font-bold text-center break-inside-avoid print:break-inside-avoid" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                            <th className="border-r border-black p-2 w-[8%] font-bold">STT</th>
                            <th className="border-r border-black p-2 w-[52%] text-left pl-3 font-bold">Tiêu chí chi tiết</th>
                            <th className="border-r border-black p-2 w-[12%] font-bold">Trọng số</th>
                            <th className="border-r border-black p-2 w-[13%] font-bold">Đánh giá</th>
                            <th className="p-2 w-[15%] font-bold text-center">Đóng góp</th>
                          </tr>
                        </thead>
                        <tbody>
                          {template?.groups.map((group) => (
                            <React.Fragment key={group.id}>
                              {/* Group Header Row */}
                              <tr className="bg-slate-50 border-b border-black font-bold break-inside-avoid print:break-inside-avoid" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                                <td className="border-r border-black p-2 text-center font-bold">{group.stt}</td>
                                <td className="border-r border-black p-2 pl-3 font-bold uppercase text-black" colSpan={4}>
                                  {group.groupName} (Trọng số nhóm: {group.totalWeight}%)
                                </td>
                              </tr>
                              {/* Criteria Rows */}
                              {group.criteria.map((crit, cIdx) => {
                                const score = evalRec.scores[crit.id] ?? 100;
                                const contribution = Math.round((crit.weight * score / 100) * 10) / 10;
                                return (
                                  <tr key={crit.id} className="border-b border-black text-center break-inside-avoid print:break-inside-avoid" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                                    <td className="border-r border-black p-2 text-slate-500 font-mono">
                                      {group.stt}.{cIdx + 1}
                                    </td>
                                    <td className="border-r border-black p-2 text-left pl-3 leading-relaxed">
                                      <div className="font-semibold text-black">{crit.title}</div>
                                      {crit.details && crit.details.length > 0 && (
                                        <div className="mt-1 pl-3 text-[11px] text-slate-600 space-y-0.5">
                                          {crit.details.map((detail, dIdx) => (
                                            <div key={dIdx} className="flex items-start gap-1">
                                              <span>•</span>
                                              <span>{detail}</span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </td>
                                    <td className="border-r border-black p-2 font-mono">{crit.weight}%</td>
                                    <td className="border-r border-black p-2 font-bold text-black font-mono">{score}%</td>
                                    <td className="p-2 font-bold text-slate-900 font-mono">{contribution}%</td>
                                  </tr>
                                );
                              })}
                            </React.Fragment>
                          ))}
                          
                          {/* Total KPI Summary Row */}
                          <tr className="border-t-2 border-black bg-slate-50 font-bold text-sm break-inside-avoid print:break-inside-avoid" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                            <td className="border-r border-black p-3 text-left pl-3" colSpan={2}>
                              TỔNG KẾT HIỆU SUẤT KPI THÁNG
                            </td>
                            <td className="border-r border-black p-3 font-mono">100%</td>
                            <td className="border-r border-black p-3"></td>
                            <td className="p-3 text-center font-black text-lg text-black font-mono">
                              {evalRec.calculatedTotalKpi}%
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Comments and Sign-off */}
                      {evalRec.notes && (
                        <div 
                          className="border border-black p-3 text-xs sm:text-sm mb-6 text-slate-900 break-inside-avoid print:break-inside-avoid"
                          style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
                        >
                          <strong>Ghi chú & Nhận xét chi tiết:</strong>
                          <p className="mt-1 italic text-slate-800 whitespace-pre-line leading-relaxed">
                            "{evalRec.notes}"
                          </p>
                        </div>
                      )}

                      {/* Signature row for Evaluation Sheet */}
                      <div 
                        className="grid grid-cols-2 gap-8 text-center pt-8 break-inside-avoid print:break-inside-avoid"
                        style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
                      >
                        <div className="flex flex-col items-center justify-between min-h-[150px]">
                          <div>
                            <p className="font-bold text-xs uppercase tracking-wider text-slate-700 mb-1">
                              NHÂN SỰ ĐƯỢC ĐÁNH GIÁ
                            </p>
                            <p className="text-[11px] italic text-slate-500">(Ký xác nhận)</p>
                          </div>
                          <div className="h-14"></div>
                          <p className="font-bold text-sm text-black">{currentData.staffName}</p>
                        </div>
                        <div className="flex flex-col items-center justify-between min-h-[150px]">
                          <div>
                            <p className="font-bold text-xs uppercase tracking-wider text-slate-700 mb-1">
                              NGƯỜI ĐÁNH GIÁ / TRƯỞNG BỘ PHẬN
                            </p>
                            <p className="text-[11px] italic text-slate-500">(Ký và duyệt)</p>
                          </div>
                          <div className="h-14"></div>
                          <p className="font-bold text-sm text-black">Ban kiểm duyệt</p>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
