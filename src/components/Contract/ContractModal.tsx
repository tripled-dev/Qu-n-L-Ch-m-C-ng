import React, { useState, useMemo } from 'react';
import { Staff } from '../../types';
import { useApp } from '../../context/AppContext';
import { 
  formatVND, 
  exportElementToPDF,
  exportElementToPNG 
} from '../../utils/formatters';
import { 
  getStaffRoles, 
  getStaffAssignedChecklists,
  STAFF_ROLE_LIST,
  resolveStaffRoleType
} from '../../data/roleDefinitions';
import { TranHanhDungSignatureSvg } from '../../utils/signatures';
import { 
  Printer, 
  Download, 
  Image as ImageIcon, 
  Copy, 
  Check, 
  X, 
  CheckCircle2, 
  Edit3, 
  Save, 
  ClipboardList 
} from 'lucide-react';

interface ContractModalProps {
  staff: Staff;
  onClose: () => void;
}

export const ContractModal: React.FC<ContractModalProps> = ({ staff, onClose }) => {
  const { checklistTemplates, showToast, orgSettings } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const assignedChecklists = useMemo(() => {
    return getStaffAssignedChecklists(staff, checklistTemplates);
  }, [staff, checklistTemplates]);

  const roleChecklistItems = useMemo(() => {
    return assignedChecklists.map(chk => {
      const matchingRole = STAFF_ROLE_LIST.find(r =>
        r.defaultChecklistIds?.some(id => chk.id.includes(id) || chk.code.toLowerCase().includes(id.toLowerCase()))
      ) || STAFF_ROLE_LIST.find(r => chk.targetDepartment.toLowerCase().includes(r.title.toLowerCase()));

      return {
        id: chk.id,
        roleId: matchingRole?.id,
        roleTitle: matchingRole?.title || chk.targetDepartment,
        roleDescription: matchingRole?.description || chk.description,
        checklist: chk,
        isAssigned: true,
      };
    });
  }, [assignedChecklists]);

  const staffRoles = useMemo(() => {
    return getStaffRoles(staff);
  }, [staff]);

  const activeRoleIds = useMemo(() => {
    const ids = new Set<string>();
    staffRoles.forEach(r => ids.add(r.id));
    return ids;
  }, [staffRoles]);

  const today = new Date();
  const currentDay = today.getDate().toString().padStart(2, '0');
  const currentMonth = (today.getMonth() + 1).toString().padStart(2, '0');
  const currentYear = today.getFullYear().toString();

  const [agreementData, setAgreementData] = useState({
    signingLocation: orgSettings?.location || 'Hà Nội',
    signingDay: currentDay,
    signingMonth: currentMonth,
    signingYear: currentYear,
    
    // Personal organizer: Đại Diện Lớp
    employerName: orgSettings?.managerName || 'Đại Diện Lớp',
    employerTitle: orgSettings?.managerTitle || 'Đại Diện Lớp',
    employerScope: orgSettings?.orgName || 'Lớp Ôn Thi HSGQG Sinh Học',
    employerPhone: orgSettings?.contactPhone || '0912 345 678',
    employerEmail: orgSettings?.contactEmail || 'hsgqg.sinhhoc@gmail.com',

    // Collaborator (Personal)
    staffName: staff.fullName,
    staffCode: staff.code,
    citizenId: staff.citizenId || staff.cccd || '',
    staffRole: staff.role,
    phone: staff.phone || '0987.654.321',
    email: staff.email || 'thanhvien.dayhoc@gmail.com',
    bankAccount: staff.bankAccount || '---',
    bankName: staff.bankName || 'Techcombank / Ngân hàng',
    bankOwner: staff.bankOwner || staff.fullName,

    // Agreed Rates
    teachingRate: staff.rates?.teachingRate || 70000,
    tutoringRate: staff.rates?.tutoringRate || 70000,
    gradingRate: staff.rates?.gradingRate || 10000,
    soanDeRate: staff.rates?.gradingRate || staff.baseRate || 150000,
    dayWorkRate: staff.rates?.dayWorkRate || 150000,
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    await exportElementToPDF(
      'printable-contract-content',
      `ThongNhatCongViec_${staff.fullName.replace(/\s+/g, '_')}_${staff.code}`
    );
    setIsExporting(false);
  };

  const handleExportPNG = async () => {
    setIsExporting(true);
    await exportElementToPNG(
      'printable-contract-content',
      `ThongNhatCongViec_${staff.fullName.replace(/\s+/g, '_')}_${staff.code}`
    );
    setIsExporting(false);
  };

  const handleCopyText = () => {
    const text = `📋 BẢNG THỐNG NHẤT CÔNG VIỆC & MỨC THÙ LAO
(Lớp Ôn Thi HSGQG Sinh Học • Đại Diện Lớp)
Ngày trao đổi: ${agreementData.signingDay}/${agreementData.signingMonth}/${agreementData.signingYear}

1. BÊN GIAO VIỆC & CHI TRẢ THÙ LAO:
- Người phụ trách: ${agreementData.employerName} (${agreementData.employerTitle})
- Đơn vị: ${agreementData.employerScope}
- Liên hệ: ${agreementData.employerPhone} • Email: ${agreementData.employerEmail}

2. CỘNG TÁC VIÊN NHẬN VIỆC:
- Họ và tên: ${agreementData.staffName} (Mã: ${agreementData.staffCode}${agreementData.citizenId ? ` • CCCD: ${agreementData.citizenId}` : ''})
- Vị trí đảm nhiệm: ${roleChecklistItems.map(r => r.roleTitle).join(', ') || agreementData.staffRole}
- Liên hệ: ${agreementData.phone} • Email: ${agreementData.email}
- Tài khoản nhận thù lao: ${agreementData.bankAccount} (${agreementData.bankName} - Chủ TK: ${agreementData.bankOwner})

3. NỘI DUNG CÔNG VIỆC & TIÊU CHUẨN BẢNG KIỂM (100%):
${roleChecklistItems.map(item => `
📌 Vị trí: ${item.roleTitle}${item.checklist ? ` [Mã: ${item.checklist.code}]` : ''}
• Nhiệm vụ: ${item.roleDescription}
${item.checklist ? item.checklist.groups.map(g => `  [Nhóm ${g.stt}: ${g.groupName} (${g.totalWeight}%)]
${g.criteria.map(crit => `    - ${crit.title} (${crit.weight}%)`).join('\n')}`).join('\n') : ''}`).join('\n')}

4. MỨC THÙ LAO THỐNG NHẤT & QUY ĐỊNH CHI TRẢ:
${activeRoleIds.has('soan_de_thi') ? `• Soạn đề thi & barem: ${formatVND(agreementData.soanDeRate)} đ/đề\n` : ''}${activeRoleIds.has('giang_vien') ? `• Giảng dạy: ${formatVND(agreementData.teachingRate)} đ/buổi\n` : ''}${activeRoleIds.has('tro_giang') ? `• Trợ giảng: ${formatVND(agreementData.tutoringRate)} đ/buổi\n` : ''}${activeRoleIds.has('cham_thi') ? `• Chấm bài tập/thi: ${formatVND(agreementData.gradingRate)} đ/bài\n` : ''}${activeRoleIds.has('tro_ly') ? `• Ca trực học vụ: ${formatVND(agreementData.dayWorkRate)} đ/ca\n` : ''}
* Công thức tính hàng tháng:
Thù lao thực nhận = [ Khối lượng hoàn thành × Đơn giá ] × [ % Đạt Bảng kiểm ] + Tiền thưởng - Khấu trừ.
* Đại Diện Lớp trực tiếp tổng hợp bảng kê và chuyển khoản từ ngày 05 - 10 hàng tháng.

5. NGUYÊN TẮC PHỐI HỢP & BẢO MẬT:
- Tự nguyện, trách nhiệm, vì chất lượng học tập của học sinh Lớp Ôn Thi HSGQG Sinh Học.
- Nếu bận việc đột xuất cần báo trước ít nhất 24h để sắp xếp người hỗ trợ thay thế.
- Tài liệu học tập và đề thi lưu hành nội bộ, bảo quản cẩn thận.`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast('Đã sao chép nội dung thống nhất công việc!', 'success');
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[96vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Top Control Bar (Hidden on Print) */}
        <div className="no-print flex items-center justify-between px-3 sm:px-6 py-3 bg-slate-900 text-white border-b border-slate-800 gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-sm shrink-0">
              <ClipboardList className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-xs sm:text-base text-white whitespace-nowrap overflow-hidden text-ellipsis flex items-center gap-2">
                <span>Thống Nhất Công Việc & Mức Thù Lao</span>
                <span className="text-teal-300 font-mono text-xs bg-teal-950/80 px-2 py-0.5 rounded border border-teal-700/50">
                  {staff.code}
                </span>
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 whitespace-nowrap overflow-hidden text-ellipsis">
                Đại Diện Lớp • Người nhận việc: {staff.fullName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 flex-nowrap">
            {/* Edit mode toggle */}
            <button
              onClick={() => {
                if (isEditing) {
                  setIsEditing(false);
                  showToast('Đã lưu thông tin tạm thời!', 'success');
                } else {
                  setIsEditing(true);
                }
              }}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                isEditing
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
              title={isEditing ? 'Lưu chỉnh sửa' : 'Chỉnh sửa đơn giá và thông tin'}
            >
              {isEditing ? <Save className="w-3.5 h-3.5 shrink-0" /> : <Edit3 className="w-3.5 h-3.5 shrink-0" />}
              <span className="hidden sm:inline whitespace-nowrap">{isEditing ? 'Xong' : 'Sửa'}</span>
            </button>

            {/* Print button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer whitespace-nowrap shrink-0"
              title="In bản thống nhất chuẩn khổ A4"
            >
              <Printer className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline whitespace-nowrap">In</span>
            </button>

            {/* Export PDF */}
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer whitespace-nowrap shrink-0"
              title="Tải định dạng PDF"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline whitespace-nowrap">PDF</span>
            </button>

            {/* Export PNG */}
            <button
              onClick={handleExportPNG}
              disabled={isExporting}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer whitespace-nowrap shrink-0"
              title="Tải ảnh"
            >
              <ImageIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline whitespace-nowrap">Ảnh</span>
            </button>

            {/* Copy text */}
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer whitespace-nowrap shrink-0"
              title="Sao chép nội dung"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
              <span className="hidden sm:inline whitespace-nowrap">{copied ? 'Đã chép' : 'Sao chép'}</span>
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
          
          {/* Personal Hiring Agreement Document Sheet (Print Area) */}
          <div
            id="printable-contract-content"
            style={{ fontFamily: "'Times New Roman', Times, 'Liberation Serif', serif" }}
            className="print-container payslip-times-roman bg-white w-full max-w-[800px] p-6 sm:p-10 shadow-sm sm:rounded-xl border border-slate-300 text-slate-900 font-serif leading-relaxed my-auto text-[14px] sm:text-[15px]"
          >
            
            {/* Header: Personal Tutoring Classes */}
            <div className="border-b-2 border-slate-800 pb-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h2 className="font-bold text-base sm:text-lg uppercase tracking-wide text-black">
                  LỚP ÔN THI HSGQG SINH HỌC • ĐẠI DIỆN LỚP
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 italic">
                  Thống nhất nội dung công việc, tiêu chuẩn bảng kiểm & mức thù lao hỗ trợ lớp học
                </p>
              </div>
              <div className="text-left sm:text-right text-xs sm:text-sm text-slate-700">
                <p className="italic">
                  {agreementData.signingLocation}, ngày {agreementData.signingDay} tháng {agreementData.signingMonth} năm {agreementData.signingYear}
                </p>
              </div>
            </div>

            {/* Document Main Title */}
            <div className="text-center my-6">
              <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-black leading-tight">
                BẢNG THỐNG NHẤT CÔNG VIỆC & MỨC THÙ LAO
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-slate-700 mt-1 italic">
                (Phân công công việc, tiêu chuẩn bảng kiểm & mức thù lao Lớp Ôn Thi HSGQG Sinh Học)
              </p>
            </div>

            {/* TWO PARTIES: INDIVIDUAL TO INDIVIDUAL */}
            <div className="space-y-4 mb-6">
              
              {/* Party 1: Đại Diện Lớp */}
              <table className="w-full border-collapse border border-black text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-100 border-b border-black text-left">
                    <th colSpan={2} className="p-2 font-bold text-black uppercase">
                      1. NGƯỜI PHỤ TRÁCH & CHI TRẢ THÙ LAO:
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-black">
                    <td className="border-r border-black p-2.5 w-[50%]">
                      <span>Họ và tên: </span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={agreementData.employerName}
                          onChange={e => setAgreementData({ ...agreementData, employerName: e.target.value })}
                          className="border-b border-slate-400 px-1 font-bold text-black"
                        />
                      ) : (
                        <strong className="font-bold text-black">{agreementData.employerName}</strong>
                      )}
                    </td>
                    <td className="p-2.5 w-[50%]">
                      <span>Vai trò: </span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={agreementData.employerTitle}
                          onChange={e => setAgreementData({ ...agreementData, employerTitle: e.target.value })}
                          className="border-b border-slate-400 px-1 font-bold text-black"
                        />
                      ) : (
                        <span className="font-bold text-black">{agreementData.employerTitle}</span>
                      )}
                    </td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="border-r border-black p-2.5">
                      <span>Phạm vi: </span>
                      <span>{agreementData.employerScope}</span>
                    </td>
                    <td className="p-2.5">
                      <span>Khu vực: </span>
                      <span>{agreementData.signingLocation}</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="border-r border-black p-2.5">
                      <span>Điện thoại / Zalo: </span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={agreementData.employerPhone}
                          onChange={e => setAgreementData({ ...agreementData, employerPhone: e.target.value })}
                          className="border-b border-slate-400 px-1"
                        />
                      ) : (
                        <span>{agreementData.employerPhone}</span>
                      )}
                    </td>
                    <td className="p-2.5">
                      <span>Email liên hệ: </span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={agreementData.employerEmail}
                          onChange={e => setAgreementData({ ...agreementData, employerEmail: e.target.value })}
                          className="border-b border-slate-400 px-1"
                        />
                      ) : (
                        <span>{agreementData.employerEmail}</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Party 2: Collaborator */}
              <table className="w-full border-collapse border border-black text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-100 border-b border-black text-left">
                    <th colSpan={2} className="p-2 font-bold text-black uppercase">
                      2. THẦY CÔ / ANH CHỊ NHẬN VIỆC HỖ TRỢ:
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-black">
                    <td className="border-r border-black p-2.5 w-[50%]">
                      <span>Họ và tên: </span>
                      <strong className="font-bold text-black">{agreementData.staffName}</strong>
                    </td>
                    <td className="p-2.5 w-[50%]">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span>Mã NV: </span>
                          <strong className="font-mono text-black">{agreementData.staffCode || '—'}</strong>
                        </div>
                        <div>
                          <span>Số CCCD: </span>
                          <strong className="font-mono text-black">{agreementData.citizenId || '—'}</strong>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="border-r border-black p-2.5">
                      <span>Nội dung nhận làm: </span>
                      <strong className="text-black">
                        {roleChecklistItems.map(r => r.roleTitle).join(', ') || agreementData.staffRole}
                      </strong>
                    </td>
                    <td className="p-2.5">
                      <span>Điện thoại / Zalo: </span>
                      <span>{agreementData.phone || '—'}</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="border-r border-black p-2.5">
                      <span>Tài khoản nhận tiền: </span>
                      <strong className="font-mono text-black">{agreementData.bankAccount || '—'}</strong>
                    </td>
                    <td className="p-2.5">
                      <span>Ngân hàng: </span>
                      <strong className="text-black">{agreementData.bankName ? `${agreementData.bankName} (${agreementData.bankOwner})` : '—'}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>

            </div>

            {/* AGREEMENT CLAUSES */}
            <div className="space-y-6 text-justify">
              
              {/* SECTION 1: ROLES & QUALITY CHECKLISTS (ASSIGNED WORK ONLY) */}
              <div>
                <div className="mb-3">
                  <h3 className="font-bold text-black text-xs sm:text-sm uppercase flex items-center gap-1.5">
                    <span className="font-mono">1.</span> BẢNG KIỂM CHUYÊN MÔN & TIÊU CHUẨN ĐÁNH GIÁ
                  </h3>
                </div>

                {/* Unified Quality Checklists matching Payslip Layout */}
                <div className="space-y-6 mb-4">
                  {roleChecklistItems.map(item => (
                    <div
                      key={item.id}
                      className="break-inside-avoid print:break-inside-avoid"
                      style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
                    >
                      {item.checklist ? (
                        <div>
                          {/* Header Banner */}
                          <div className="flex items-center justify-between border-b border-black pb-2 mb-3">
                            <h4 className="font-bold text-xs sm:text-sm text-black uppercase tracking-tight">
                              BẢNG KIỂM CHUYÊN MÔN: {item.checklist.title.toUpperCase()}
                            </h4>
                            <div className="text-right shrink-0">
                              <span className="font-mono text-xs font-bold border border-black px-2 py-0.5 rounded uppercase whitespace-nowrap bg-slate-50">
                                KPI - {item.checklist.code}
                              </span>
                            </div>
                          </div>

                          {/* Criteria Scorecard Table (Identical to Payslip) */}
                          <table 
                            className="w-full border-collapse border border-black text-xs sm:text-sm mb-4 break-inside-avoid print:break-inside-avoid"
                            style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
                          >
                            <thead>
                              <tr className="bg-slate-100 border-b border-black font-bold text-center">
                                <th className="border-r border-black p-2 w-[8%] font-bold">STT</th>
                                <th className="border-r border-black p-2 w-[62%] text-left pl-3 font-bold">Tiêu chí chi tiết & Yêu cầu chất lượng</th>
                                <th className="border-r border-black p-2 w-[15%] font-bold">Trọng số</th>
                                <th className="p-2 w-[15%] font-bold text-center">Chuẩn đạt</th>
                              </tr>
                            </thead>
                            <tbody>
                              {item.checklist.groups.map(group => (
                                <React.Fragment key={group.id}>
                                  {/* Group Header Row */}
                                  <tr className="bg-slate-50 border-b border-black font-bold break-inside-avoid print:break-inside-avoid">
                                    <td className="border-r border-black p-2 text-center font-bold">{group.stt}</td>
                                    <td className="border-r border-black p-2 pl-3 font-bold uppercase text-black" colSpan={3}>
                                      {group.groupName} (Trọng số nhóm: {group.totalWeight}%)
                                    </td>
                                  </tr>
                                  {/* Criteria Rows */}
                                  {group.criteria.map((crit, cIdx) => (
                                    <tr key={crit.id} className="border-b border-black text-center break-inside-avoid print:break-inside-avoid">
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
                                      <td className="p-2 font-bold text-slate-900 font-mono">100%</td>
                                    </tr>
                                  ))}
                                </React.Fragment>
                              ))}

                              {/* Total KPI Summary Row */}
                              <tr className="border-t-2 border-black bg-slate-50 font-bold text-xs sm:text-sm break-inside-avoid print:break-inside-avoid">
                                <td className="border-r border-black p-2.5 text-left pl-3" colSpan={2}>
                                  TỔNG ĐIỂM CHUẨN BẢNG KIỂM ({item.checklist.code})
                                </td>
                                <td className="border-r border-black p-2.5 text-center font-mono font-bold">100%</td>
                                <td className="p-2.5 text-center font-black text-sm text-black font-mono">100%</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="border border-black p-3 text-xs sm:text-sm text-slate-700 italic bg-slate-50">
                          Vị trí <strong>{item.roleTitle}</strong>: Đánh giá theo chất lượng bàn giao công việc và hoàn thành nhiệm vụ được giao.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 2: AGREED RATES & PAYMENT */}
              <div>
                <h3 className="font-bold text-black text-xs sm:text-sm uppercase mb-3 flex items-center gap-1.5">
                  <span className="font-mono">2.</span> MỨC THÙ LAO THỐNG NHẤT & CHI TRẢ HÀNG THÁNG
                </h3>

                {/* Rates Table matching Payslip solid border format */}
                <table className="w-full border-collapse border border-black text-xs sm:text-sm mb-3">
                  <thead>
                    <tr className="bg-slate-100 text-left border-b border-black">
                      <th className="border-r border-black p-2 font-bold text-black w-[50%]">Đầu việc / Vai trò đảm nhiệm</th>
                      <th className="border-r border-black p-2 font-bold text-black text-center w-[20%]">Đơn vị tính</th>
                      <th className="p-2 font-bold text-black text-right pr-3 w-[30%]">Mức thù lao thỏa thuận</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeRoleIds.has('giang_vien') && (
                      <tr className="border-b border-black">
                        <td className="border-r border-black p-2 font-medium">Giảng dạy trực tiếp môn Sinh học</td>
                        <td className="border-r border-black p-2 text-center">Buổi dạy</td>
                        <td className="p-2 text-right pr-3 font-bold text-black">
                          {isEditing ? (
                            <input
                              type="number"
                              value={agreementData.teachingRate}
                              onChange={e => setAgreementData({ ...agreementData, teachingRate: Number(e.target.value) })}
                              className="w-24 text-right border border-slate-300 rounded px-1 font-bold"
                            />
                          ) : (
                            `${formatVND(agreementData.teachingRate)} đ`
                          )}
                        </td>
                      </tr>
                    )}
                    {activeRoleIds.has('tro_giang') && (
                      <tr className="border-b border-black">
                        <td className="border-r border-black p-2 font-medium">Trợ giảng & hỗ trợ học sinh</td>
                        <td className="border-r border-black p-2 text-center">Buổi trợ giảng</td>
                        <td className="p-2 text-right pr-3 font-bold text-black">
                          {isEditing ? (
                            <input
                              type="number"
                              value={agreementData.tutoringRate}
                              onChange={e => setAgreementData({ ...agreementData, tutoringRate: Number(e.target.value) })}
                              className="w-24 text-right border border-slate-300 rounded px-1 font-bold"
                            />
                          ) : (
                            `${formatVND(agreementData.tutoringRate)} đ`
                          )}
                        </td>
                      </tr>
                    )}
                    {activeRoleIds.has('cham_thi') && (
                      <tr className="border-b border-black">
                        <td className="border-r border-black p-2 font-medium">Chấm bài tập & bài kiểm tra học sinh</td>
                        <td className="border-r border-black p-2 text-center">Bài chấm</td>
                        <td className="p-2 text-right pr-3 font-bold text-black">
                          {isEditing ? (
                            <input
                              type="number"
                              value={agreementData.gradingRate}
                              onChange={e => setAgreementData({ ...agreementData, gradingRate: Number(e.target.value) })}
                              className="w-24 text-right border border-slate-300 rounded px-1 font-bold"
                            />
                          ) : (
                            `${formatVND(agreementData.gradingRate)} đ`
                          )}
                        </td>
                      </tr>
                    )}
                    {activeRoleIds.has('soan_de_thi') && (
                      <tr className="border-b border-black">
                        <td className="border-r border-black p-2 font-medium">Biên soạn tài liệu & đề thi chuyên đề</td>
                        <td className="border-r border-black p-2 text-center">Đề thi / Tài liệu</td>
                        <td className="p-2 text-right pr-3 font-bold text-black">
                          {isEditing ? (
                            <input
                              type="number"
                              value={agreementData.soanDeRate}
                              onChange={e => setAgreementData({ ...agreementData, soanDeRate: Number(e.target.value) })}
                              className="w-24 text-right border border-slate-300 rounded px-1 font-bold"
                            />
                          ) : (
                            `${formatVND(agreementData.soanDeRate)} đ`
                          )}
                        </td>
                      </tr>
                    )}
                    {activeRoleIds.has('tro_ly') && (
                      <tr className="border-b border-black">
                        <td className="border-r border-black p-2 font-medium">Trực ca học vụ & quản lý lớp</td>
                        <td className="border-r border-black p-2 text-center">Ca trực / Ngày</td>
                        <td className="p-2 text-right pr-3 font-bold text-black">
                          {isEditing ? (
                            <input
                              type="number"
                              value={agreementData.dayWorkRate}
                              onChange={e => setAgreementData({ ...agreementData, dayWorkRate: Number(e.target.value) })}
                              className="w-24 text-right border border-slate-300 rounded px-1 font-bold"
                            />
                          ) : (
                            `${formatVND(agreementData.dayWorkRate)} đ`
                          )}
                        </td>
                      </tr>
                    )}
                    {activeRoleIds.size === 0 && (
                      <tr className="border-b border-black">
                        <td className="border-r border-black p-2 font-medium">{staff.role || 'Thù lao công việc'}</td>
                        <td className="border-r border-black p-2 text-center">Buổi / Đợt</td>
                        <td className="p-2 text-right pr-3 font-bold text-black">
                          {formatVND(staff.baseRate || 70000)} đ
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Calculation formula */}
                <div className="border border-black p-2.5 text-xs sm:text-sm text-center font-medium text-slate-900 mb-2 bg-slate-50">
                  <span className="font-bold text-black">Thù lao thực nhận hàng tháng = </span>
                  [ Khối lượng hoàn thành × Đơn giá ] × [ % Đạt Bảng kiểm ] + Tiền thưởng - Khấu trừ
                </div>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <strong>Chu kỳ thanh toán:</strong> Vào cuối mỗi tháng, Đại Diện Lớp tổng hợp khối lượng công việc và gửi <strong>Bảng Kê Thù Lao</strong> để cộng tác viên đối soát. Tiền thù lao sẽ được chuyển khoản trực tiếp vào tài khoản ngân hàng của cộng tác viên từ ngày <strong>05 đến ngày 10</strong> hàng tháng.
                </p>
              </div>

              {/* SECTION 3: PERSONAL COLLABORATION SPIRIT & CONFIDENTIALITY */}
              <div>
                <h3 className="font-bold text-black text-xs sm:text-sm uppercase mb-2 flex items-center gap-1.5">
                  <span className="font-mono">3.</span> NGUYÊN TẮC PHỐI HỢP & BẢO MẬT
                </h3>
                <ul className="text-xs sm:text-sm space-y-1.5 text-slate-800 list-disc pl-5">
                  <li>
                    <strong>Tự nguyện & trách nhiệm:</strong> Hai bên phối hợp trên tinh thần tự nguyện, tôn trọng lẫn nhau, cùng có trách nhiệm hỗ trợ học sinh học tập tiến bộ.
                  </li>
                  <li>
                    <strong>Chủ động thông tin:</strong> Nếu có việc bận đột xuất, vui lòng báo trước cho Đại Diện Lớp ít nhất 24 giờ để chủ động sắp xếp người hỗ trợ thay thế cho Lớp Ôn Thi HSGQG Sinh Học.
                  </li>
                  <li>
                    <strong>Bảo quản tài liệu:</strong> Đề thi, giáo trình và tài liệu của Lớp Ôn Thi HSGQG Sinh Học lưu hành nội bộ, bảo quản cẩn thận và không chia sẻ ra ngoài khi chưa có trao đổi.
                  </li>
                  <li>
                    <strong>Trao đổi cởi mở:</strong> Mọi ý kiến đóng góp hoặc thắc mắc về công việc, thù lao đều được trao đổi trực tiếp, thiện chí và giải quyết thỏa đáng.
                  </li>
                </ul>
              </div>

            </div>

            {/* SIGNATURE SECTION: TWO INDIVIDUALS */}
            <div className="grid grid-cols-2 gap-8 text-center pt-8 mt-6 border-t border-slate-300 break-inside-avoid print:break-inside-avoid" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
              
              {/* Employer Column (Đại Diện Lớp - Personal) */}
              <div className="flex flex-col items-center justify-between min-h-[170px]">
                <div>
                  <p className="font-bold text-xs sm:text-sm uppercase tracking-wider text-black mb-0.5">
                    NGƯỜI CHI TRẢ THÙ LAO
                  </p>
                  <p className="text-[11px] sm:text-xs italic text-slate-500">
                    (Đã duyệt & chi trả)
                  </p>
                </div>

                {/* Space for manual handwriting signature */}
                <div className="my-2 h-20"></div>

                <div>
                  <p className="font-bold text-sm sm:text-base text-black">
                    {agreementData.employerName}
                  </p>
                  <p className="text-xs text-slate-600">{agreementData.employerTitle}</p>
                </div>
              </div>

              {/* Collaborator Column */}
              <div className="flex flex-col items-center justify-between min-h-[170px]">
                <div>
                  <p className="font-bold text-xs sm:text-sm uppercase tracking-wider text-black mb-0.5">
                    NGƯỜI NHẬN VIỆC
                  </p>
                  <p className="text-[11px] sm:text-xs italic text-slate-500">
                    (Xác nhận nhận việc)
                  </p>
                </div>

                {/* Member signature line */}
                <div className="my-2 h-20 flex items-end justify-center pb-2">
                  <span className="italic font-serif text-slate-500 text-sm">
                    {agreementData.staffName}
                  </span>
                </div>

                <div>
                  <p className="font-bold text-sm sm:text-base text-black">
                    {agreementData.staffName}
                  </p>
                  <p className="text-xs text-slate-600 font-mono">Mã: {agreementData.staffCode}</p>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
