import React, { useState, useMemo, useEffect } from 'react';
import { Staff, CustomRateTier } from '../../types';
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
  ClipboardList,
  FileText,
  Plus,
  Trash2,
  PenTool
} from 'lucide-react';

interface ContractModalProps {
  staff: Staff;
  onClose: () => void;
}

export const ContractModal: React.FC<ContractModalProps> = ({ staff, onClose }) => {
  const { checklistTemplates, showToast, orgSettings, updateStaff } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showSignature, setShowSignature] = useState<boolean>(orgSettings?.showSignatures !== false);

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

  const [agreementData, setAgreementData] = useState(() => {
    const tRate = staff.rates?.teachingRate ?? (staff.roleType === 'giang_vien' ? staff.baseRate : 70000);
    const tutRate = staff.rates?.tutoringRate ?? staff.defaultPieceworkRates?.troGiangPerSession ?? (staff.roleType === 'tro_giang' ? staff.baseRate : 70000);
    const gRate = staff.rates?.gradingRate ?? staff.defaultPieceworkRates?.chamBaiPerItem ?? (staff.roleType === 'cham_thi' ? staff.baseRate : 10000);
    const sRate = staff.defaultPieceworkRates?.soanBaiPerItem ?? (staff.roleType === 'soan_de_thi' ? staff.baseRate : 150000);
    const dRate = staff.rates?.dayWorkRate ?? (staff.roleType === 'tro_ly' ? staff.baseRate : 150000);

    return {
      contractNumber: '01/2026/HĐKV',
      signingLocation: orgSettings?.location ?? 'Hà Nội',
      signingDay: currentDay,
      signingMonth: currentMonth,
      signingYear: currentYear,
      
      // Party A (Bên giao khoán): Bà Trần Hạnh Dung - Lớp Ôn Thi HSGQG Sinh Học
      employerName: (orgSettings?.managerName && orgSettings.managerName !== 'Đại Diện Lớp') ? orgSettings.managerName : 'Trần Hạnh Dung',
      employerTitle: 'Người thuê',
      employerScope: orgSettings?.orgName || 'Lớp Ôn Thi HSGQG Sinh Học',
      employerAddress: orgSettings?.location || 'Hà Nội',
      employerPhone: orgSettings?.contactPhone || '',
      employerEmail: orgSettings?.contactEmail || '',

      // Party B (Bên nhận khoán): Collaborator
      staffName: staff.fullName,
      staffCode: staff.code,
      staffBirthDate: staff.birthDate || '',
      staffAddress: staff.address || '',
      citizenId: staff.citizenId || staff.cccd || '',
      citizenIssueDate: staff.citizenIssueDate || '',
      citizenIssuePlace: staff.citizenIssuePlace || '',
      staffRole: staff.role,
      phone: staff.phone || '',
      email: staff.email || '',
      bankAccount: staff.bankAccount || '',
      bankName: staff.bankName || '',
      bankOwner: staff.bankOwner || staff.fullName,

      // Work location & method
      workLocation: 'Trực tiếp tại phòng học Lớp Ôn Thi HSGQG Sinh Học (Hà Nội) hoặc làm việc từ xa (Online) theo phân công của Bên A',

      // Agreed Rates & Tiers
      teachingRate: tRate,
      teachingTiers: staff.rates?.teachingTiers ? [...staff.rates.teachingTiers] : [] as CustomRateTier[],
      tutoringRate: tutRate,
      tutoringTiers: staff.rates?.tutoringTiers ? [...staff.rates.tutoringTiers] : [] as CustomRateTier[],
      gradingRate: gRate,
      gradingTiers: staff.rates?.gradingTiers ? [...staff.rates.gradingTiers] : [] as CustomRateTier[],
      soanDeRate: sRate,
      dayWorkRate: dRate,
      customTiers: staff.rates?.customTiers ? [...staff.rates.customTiers] : [] as { id: string; name: string; unit?: string; rate: number }[],
    };
  });

  // Keep synced if staff changes externally and not in edit mode
  useEffect(() => {
    if (!isEditing) {
      const tRate = staff.rates?.teachingRate ?? (staff.roleType === 'giang_vien' ? staff.baseRate : 70000);
      const tutRate = staff.rates?.tutoringRate ?? staff.defaultPieceworkRates?.troGiangPerSession ?? (staff.roleType === 'tro_giang' ? staff.baseRate : 70000);
      const gRate = staff.rates?.gradingRate ?? staff.defaultPieceworkRates?.chamBaiPerItem ?? (staff.roleType === 'cham_thi' ? staff.baseRate : 10000);
      const sRate = staff.defaultPieceworkRates?.soanBaiPerItem ?? (staff.roleType === 'soan_de_thi' ? staff.baseRate : 150000);
      const dRate = staff.rates?.dayWorkRate ?? (staff.roleType === 'tro_ly' ? staff.baseRate : 150000);

      setAgreementData(prev => ({
        ...prev,
        staffName: staff.fullName,
        staffCode: staff.code,
        citizenId: staff.citizenId || staff.cccd || '',
        staffRole: staff.role,
        phone: staff.phone || '',
        email: staff.email || '',
        bankAccount: staff.bankAccount || '',
        bankName: staff.bankName || '',
        bankOwner: staff.bankOwner || staff.fullName,
        teachingRate: tRate,
        teachingTiers: staff.rates?.teachingTiers ? [...staff.rates.teachingTiers] : [],
        tutoringRate: tutRate,
        tutoringTiers: staff.rates?.tutoringTiers ? [...staff.rates.tutoringTiers] : [],
        gradingRate: gRate,
        gradingTiers: staff.rates?.gradingTiers ? [...staff.rates.gradingTiers] : [],
        soanDeRate: sRate,
        dayWorkRate: dRate,
        customTiers: staff.rates?.customTiers ? [...staff.rates.customTiers] : [],
      }));
    }
  }, [staff, isEditing]);

  // Handlers for managing custom rate tiers in the agreement
  const handleAddTutoringTier = () => {
    const newTier: CustomRateTier = {
      id: 'tut_' + Date.now(),
      name: 'Lớp chuyên biệt',
      rate: agreementData.tutoringRate || 70000,
    };
    setAgreementData(prev => ({
      ...prev,
      tutoringTiers: [...prev.tutoringTiers, newTier],
    }));
  };

  const handleUpdateTutoringTier = (id: string, field: 'name' | 'rate', value: string | number) => {
    setAgreementData(prev => ({
      ...prev,
      tutoringTiers: prev.tutoringTiers.map(t => t.id === id ? { ...t, [field]: value } : t),
    }));
  };

  const handleRemoveTutoringTier = (id: string) => {
    setAgreementData(prev => ({
      ...prev,
      tutoringTiers: prev.tutoringTiers.filter(t => t.id !== id),
    }));
  };

  const handleAddGradingTier = () => {
    const newTier: CustomRateTier = {
      id: 'grad_' + Date.now(),
      name: 'Bài thi thử / Chuyên đề',
      rate: 20000,
    };
    setAgreementData(prev => ({
      ...prev,
      gradingTiers: [...prev.gradingTiers, newTier],
    }));
  };

  const handleUpdateGradingTier = (id: string, field: 'name' | 'rate', value: string | number) => {
    setAgreementData(prev => ({
      ...prev,
      gradingTiers: prev.gradingTiers.map(t => t.id === id ? { ...t, [field]: value } : t),
    }));
  };

  const handleRemoveGradingTier = (id: string) => {
    setAgreementData(prev => ({
      ...prev,
      gradingTiers: prev.gradingTiers.filter(t => t.id !== id),
    }));
  };

  const handleAddTeachingTier = () => {
    const newTier: CustomRateTier = {
      id: 'teach_' + Date.now(),
      name: 'Lớp chuyên biệt',
      rate: agreementData.teachingRate || 70000,
    };
    setAgreementData(prev => ({
      ...prev,
      teachingTiers: [...prev.teachingTiers, newTier],
    }));
  };

  const handleUpdateTeachingTier = (id: string, field: 'name' | 'rate', value: string | number) => {
    setAgreementData(prev => ({
      ...prev,
      teachingTiers: prev.teachingTiers.map(t => t.id === id ? { ...t, [field]: value } : t),
    }));
  };

  const handleRemoveTeachingTier = (id: string) => {
    setAgreementData(prev => ({
      ...prev,
      teachingTiers: prev.teachingTiers.filter(t => t.id !== id),
    }));
  };

  const handleAddCustomTier = () => {
    const newTier = {
      id: 'cust_' + Date.now(),
      name: 'Đầu việc bổ sung',
      unit: 'Buổi / Đợt',
      rate: 100000,
    };
    setAgreementData(prev => ({
      ...prev,
      customTiers: [...prev.customTiers, newTier],
    }));
  };

  const handleUpdateCustomTier = (id: string, field: 'name' | 'unit' | 'rate', value: string | number) => {
    setAgreementData(prev => ({
      ...prev,
      customTiers: prev.customTiers.map(t => t.id === id ? { ...t, [field]: value } : t),
    }));
  };

  const handleRemoveCustomTier = (id: string) => {
    setAgreementData(prev => ({
      ...prev,
      customTiers: prev.customTiers.filter(t => t.id !== id),
    }));
  };

  // Save changes and permanently persist to staff profile
  const handleSaveEdit = () => {
    setIsEditing(false);
    const updatedStaff: Staff = {
      ...staff,
      fullName: agreementData.staffName.trim() || staff.fullName,
      birthDate: agreementData.staffBirthDate.trim() || staff.birthDate,
      address: agreementData.staffAddress.trim() || staff.address,
      citizenId: agreementData.citizenId.trim() || staff.citizenId,
      cccd: agreementData.citizenId.trim() || staff.cccd,
      citizenIssueDate: agreementData.citizenIssueDate.trim() || staff.citizenIssueDate,
      citizenIssuePlace: agreementData.citizenIssuePlace.trim() || staff.citizenIssuePlace,
      phone: agreementData.phone.trim() || staff.phone,
      email: agreementData.email.trim() || staff.email,
      bankAccount: agreementData.bankAccount.trim() || staff.bankAccount,
      bankName: agreementData.bankName.trim() || staff.bankName,
      bankOwner: agreementData.bankOwner.trim() || staff.bankOwner,
      rates: {
        ...staff.rates,
        teachingEnabled: activeRoleIds.has('giang_vien'),
        teachingRate: Number(agreementData.teachingRate) || 70000,
        teachingTiers: agreementData.teachingTiers,
        tutoringEnabled: activeRoleIds.has('tro_giang'),
        tutoringRate: Number(agreementData.tutoringRate) || 70000,
        tutoringTiers: agreementData.tutoringTiers,
        gradingEnabled: activeRoleIds.has('cham_thi'),
        gradingRate: Number(agreementData.gradingRate) || 10000,
        gradingTiers: agreementData.gradingTiers,
        dayWorkEnabled: activeRoleIds.has('tro_ly'),
        dayWorkRate: Number(agreementData.dayWorkRate) || 150000,
        customTiers: agreementData.customTiers,
      },
      defaultPieceworkRates: {
        ...staff.defaultPieceworkRates,
        troGiangPerSession: Number(agreementData.tutoringRate) || 70000,
        chamBaiPerItem: Number(agreementData.gradingRate) || 10000,
        soanBaiPerItem: Number(agreementData.soanDeRate) || 150000,
      },
      baseRate: activeRoleIds.has('giang_vien')
        ? Number(agreementData.teachingRate) || 70000
        : activeRoleIds.has('tro_ly')
          ? Number(agreementData.dayWorkRate) || 150000
          : activeRoleIds.has('tro_giang')
            ? Number(agreementData.tutoringRate) || 70000
            : activeRoleIds.has('soan_de_thi')
              ? Number(agreementData.soanDeRate) || 150000
              : Number(agreementData.gradingRate) || staff.baseRate,
    };
    updateStaff(updatedStaff);
    showToast('Đã lưu thông tin hợp đồng và cập nhật hồ sơ nhân sự thành công!', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    await exportElementToPDF(
      'printable-contract-content',
      `HopDongKhoanViec_${staff.fullName.replace(/\s+/g, '_')}_${staff.code}`
    );
    setIsExporting(false);
  };

  const handleExportPNG = async () => {
    setIsExporting(true);
    await exportElementToPNG(
      'printable-contract-content',
      `HopDongKhoanViec_${staff.fullName.replace(/\s+/g, '_')}_${staff.code}`
    );
    setIsExporting(false);
  };

  const handleCopyText = () => {
    const rateLines: string[] = [];
    if (activeRoleIds.has('giang_vien')) {
      if (agreementData.teachingTiers && agreementData.teachingTiers.length > 0) {
        agreementData.teachingTiers.forEach(t => {
          rateLines.push(`• Giảng dạy (${t.name}): ${formatVND(t.rate)} đ/buổi`);
        });
      } else {
        rateLines.push(`• Giảng dạy trực tiếp môn Sinh học: ${formatVND(agreementData.teachingRate)} đ/buổi`);
      }
    }
    if (activeRoleIds.has('tro_giang')) {
      if (agreementData.tutoringTiers && agreementData.tutoringTiers.length > 0) {
        agreementData.tutoringTiers.forEach(t => {
          rateLines.push(`• Trợ giảng (${t.name}): ${formatVND(t.rate)} đ/buổi`);
        });
      } else {
        rateLines.push(`• Trợ giảng & hỗ trợ học sinh: ${formatVND(agreementData.tutoringRate)} đ/buổi`);
      }
    }
    if (activeRoleIds.has('cham_thi')) {
      if (agreementData.gradingTiers && agreementData.gradingTiers.length > 0) {
        agreementData.gradingTiers.forEach(t => {
          rateLines.push(`• Chấm bài (${t.name}): ${formatVND(t.rate)} đ/bài`);
        });
      } else {
        rateLines.push(`• Chấm bài kiểm tra & bài tập: ${formatVND(agreementData.gradingRate)} đ/bài`);
      }
    }
    if (activeRoleIds.has('soan_de_thi')) {
      rateLines.push(`• Soạn đề thi & ngân hàng câu hỏi chuyên đề: ${formatVND(agreementData.soanDeRate)} đ/đề`);
    }
    if (activeRoleIds.has('tro_ly')) {
      rateLines.push(`• Trực ca học vụ & quản trị lớp: ${formatVND(agreementData.dayWorkRate)} đ/ca`);
    }
    if (agreementData.customTiers && agreementData.customTiers.length > 0) {
      agreementData.customTiers.forEach(ct => {
        rateLines.push(`• ${ct.name}: ${formatVND(ct.rate)} đ/${ct.unit || 'đợt'}`);
      });
    }
    if (rateLines.length === 0) {
      rateLines.push(`• ${staff.role || 'Thù lao công việc'}: ${formatVND(staff.baseRate || 70000)} đ/buổi`);
    }

    const text = `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc
-----------------

HỢP ĐỒNG KHOÁN VIỆC
(Số: ${agreementData.contractNumber})

- Căn cứ Bộ Luật dân sự năm 2015 số 91/2015/QH13 ngày 24/11/2015;
- Căn cứ nhu cầu và khả năng thực tế của các bên trong hợp đồng;

Hôm nay, ngày ${agreementData.signingDay} tháng ${agreementData.signingMonth} năm ${agreementData.signingYear}, tại ${agreementData.signingLocation || 'Hà Nội'}.
Chúng tôi gồm có:

BÊN A (Bên giao khoán):
- Họ và tên: ${agreementData.employerName || 'Trần Hạnh Dung'}
- Chức vụ / Tư cách: ${agreementData.employerTitle || 'Người thuê'}
- Địa chỉ: ${agreementData.employerAddress || 'Hà Nội'}
- Điện thoại: ${agreementData.employerPhone || ''}
- Email: ${agreementData.employerEmail || ''}

BÊN B (Bên nhận khoán):
- Họ và tên: ${agreementData.staffName}
- Ngày tháng năm sinh: ${agreementData.staffBirthDate || ''}
- Địa chỉ thường trú / liên hệ: ${agreementData.staffAddress || ''}
- Số CMND/CCCD: ${agreementData.citizenId || ''} (Ngày cấp: ${agreementData.citizenIssueDate || ''} • Nơi cấp: ${agreementData.citizenIssuePlace || ''})
- Điện thoại: ${agreementData.phone || ''} • Email: ${agreementData.email || ''}
- Tài khoản nhận thù lao: ${agreementData.bankAccount ? `${agreementData.bankAccount} (${agreementData.bankName || ''} - Chủ TK: ${agreementData.bankOwner || agreementData.staffName})` : ''}

Sau khi thỏa thuận, hai bên đồng ý ký kết và thực hiện Hợp đồng khoán việc với các điều khoản sau đây:

Điều 1. Nội dung công việc và tiêu chuẩn chất lượng
${roleChecklistItems.map(item => `
* Vị trí đảm nhiệm: ${item.roleTitle}
- Mô tả nhiệm vụ: ${item.roleDescription}
${item.checklist ? item.checklist.groups.map(g => `  + Nhóm ${g.stt}: ${g.groupName} (${g.totalWeight}%)
${g.criteria.map(crit => `    • ${crit.title} (${crit.weight}%)`).join('\n')}`).join('\n') : ''}`).join('\n')}

Điều 2. Nơi làm việc và hình thức thực hiện
- Nơi làm việc: ${agreementData.workLocation}

Điều 3. Tiến độ thực hiện công việc và thời hạn hợp đồng
- Cam kết thời hạn hợp tác tối thiểu: ít nhất 01 năm (12 tháng).
- Tiến độ thực hiện theo phân công ca/buổi. Bận đột xuất phải báo trước ít nhất 24 giờ.
- Quy định thôi việc: Báo trước bằng văn bản trước ít nhất 02 tháng (60 ngày) và bàn giao đầy đủ 100% công việc, giáo án, đề thi, bài tập và bảng điểm.

Điều 4. Lương khoán / Thù lao khoán việc và phương thức thanh toán
- Đơn giá thỏa thuận theo từng công việc:
${rateLines.join('\n')}
- Công thức tính thù lao thực nhận hàng tháng:
  Thù lao thực nhận = [ Khối lượng hoàn thành × Đơn giá ] × [ % Đạt Bảng kiểm ] + Tiền thưởng - Khấu trừ.
- Nghĩa vụ thuế thu nhập cá nhân: Thực hiện theo quy định của pháp luật.
- Thời hạn và hình thức thanh toán: Chốt bảng kê cuối tháng, thanh toán chuyển khoản từ ngày 05 đến ngày 10 hàng tháng qua tài khoản ngân hàng của Bên B.

Điều 5. Quyền và nghĩa vụ của Bên A (Bên giao khoán)
- Yêu cầu Bên B thực hiện đúng công việc đã thỏa thuận tại Điều 1, đảm bảo chất lượng theo Bảng kiểm và tiến độ tại Điều 3.
- Cung cấp tài liệu, đề thi mẫu, danh sách học sinh và công cụ để Bên B thực hiện công việc.
- Nghiệm thu khối lượng và thanh toán đầy đủ thù lao khoán cho Bên B theo Điều 4.

Điều 6. Quyền và nghĩa vụ của Bên B (Bên nhận khoán)
- Được cung cấp tài liệu, công cụ cần thiết để thực hiện công việc.
- Được hưởng thù lao khoán theo Điều 4 sau khi hoàn thành công việc theo tiến độ và tiêu chuẩn chất lượng.
- Thực hiện đúng, đủ công việc theo Điều 1 và đảm bảo tiến độ tại Điều 3.
- Nghĩa vụ bảo mật: Đề thi, giáo trình, ngân hàng bài tập là tài sản trí tuệ nội bộ của Bên A, tuyệt đối bảo mật, không sao chép hay phát tán ra ngoài khi chưa có sự đồng ý của Bên A.
- Cam kết không lôi kéo học sinh: Tuyệt đối không tiếp cận, rủ rê, lôi kéo học sinh hoặc phụ huynh chuyển lớp, học riêng ngoài chương trình hoặc chia sẻ thông tin học sinh cho bên thứ ba.

Điều 7. Chế tài xử lý vi phạm và bồi thường hợp đồng
- Đơn phương chấm dứt hợp tác trước hạn 01 năm, vi phạm thời hạn báo trước 02 tháng hoặc không hoàn thành bàn giao: Phải bồi thường thiệt hại và chịu phạt vi phạm bằng 50% tổng số tiền thù lao đã nhận kể từ khi bắt đầu hợp tác đến thời điểm vi phạm.
- Vi phạm quy định về lôi kéo học sinh: Lập tức chấm dứt hợp tác và chịu phạt vi phạm bằng 50% tổng số tiền thù lao đã nhận kể từ khi hợp tác đến lúc vi phạm, đồng thời bồi thường toàn bộ thiệt hại thực tế phát sinh.

Điều 8. Điều khoản chung
- Hai bên cam kết thi hành nghiêm chỉnh các điều khoản của hợp đồng này.
- Mọi tranh chấp phát sinh trong quá trình thực hiện hợp đồng sẽ được giải quyết trước tiên thông qua thương lượng thiện chí. Trường hợp không thương lượng được thì tranh chấp sẽ do Tòa án có thẩm quyền giải quyết.
- Hợp đồng này có hiệu lực kể từ ngày ký và tự động thanh lý khi hai bên đã hoàn thành trách nhiệm với nhau.
- Hợp đồng này được lập thành 02 bản có giá trị pháp lý như nhau, mỗi bên giữ 01 bản.

            BÊN A (Bên giao khoán)                  BÊN B (Bên nhận khoán)
             (ký, ghi rõ họ tên)                     (ký, ghi rõ họ tên)
               Trần Hạnh Dung                          ${agreementData.staffName}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast('Đã sao chép toàn văn Hợp Đồng Khoán Việc!', 'success');
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[96vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Top Control Bar (Hidden on Print) */}
        <div className="no-print flex items-center justify-between px-3 sm:px-6 py-3 bg-slate-900 text-white border-b border-slate-800 gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-sm shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-xs sm:text-base text-white whitespace-nowrap overflow-hidden text-ellipsis flex items-center gap-2">
                <span>Hợp Đồng Khoán Việc</span>
                <span className="text-slate-300 font-normal text-xs bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  Hợp đồng cá nhân
                </span>
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 whitespace-nowrap overflow-hidden text-ellipsis">
                Bộ Luật Dân Sự 2015 • Bên A: {agreementData.employerName || 'Trần Hạnh Dung'} • Bên B: {staff.fullName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 flex-nowrap">
            {/* Edit mode toggle */}
            <button
              onClick={() => {
                if (isEditing) {
                  handleSaveEdit();
                } else {
                  setIsEditing(true);
                }
              }}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                isEditing
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
              title={isEditing ? 'Lưu chỉnh sửa và cập nhật hồ sơ' : 'Chỉnh sửa đơn giá và các mức giá theo lớp/đầu việc'}
            >
              {isEditing ? <Save className="w-3.5 h-3.5 shrink-0" /> : <Edit3 className="w-3.5 h-3.5 shrink-0" />}
              <span className="hidden sm:inline whitespace-nowrap">{isEditing ? 'Xong (Lưu)' : 'Sửa'}</span>
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

            {/* Signature toggle button */}
            <button
              onClick={() => setShowSignature(!showSignature)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                showSignature
                  ? 'bg-teal-700 hover:bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
              title={showSignature ? 'Đang hiển thị chữ ký điện tử Trần Hạnh Dung (Bấm để ẩn / ký tay)' : 'Đang ẩn chữ ký (Bấm để hiển thị chữ ký điện tử)'}
            >
              <PenTool className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline whitespace-nowrap">{showSignature ? 'Chữ ký: Bật' : 'Ký tay'}</span>
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
            className="print-container payslip-times-roman bg-white w-full max-w-[800px] p-6 sm:p-10 text-slate-900 font-serif leading-relaxed my-auto text-[14px] sm:text-[15px]"
          >
            
            {/* National Motto & Contract Title */}
            <div className="text-center mb-6">
              <p className="font-bold text-sm sm:text-base uppercase tracking-widest text-black mb-0.5">
                CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
              </p>
              <p className="font-bold text-xs sm:text-sm text-black">
                Độc lập - Tự do - Hạnh phúc
              </p>
              <div className="w-28 h-[1px] bg-black mx-auto mt-1 mb-5"></div>

              <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-black leading-tight">
                HỢP ĐỒNG KHOÁN VIỆC
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-slate-700 mt-1 italic">
                (Số: {isEditing ? (
                  <input
                    type="text"
                    value={agreementData.contractNumber}
                    onChange={e => setAgreementData({ ...agreementData, contractNumber: e.target.value })}
                    className="border-b border-slate-400 px-1 font-mono text-black font-bold"
                  />
                ) : (
                  agreementData.contractNumber
                )})
              </p>
            </div>

            {/* Legal bases */}
            <div className="text-xs sm:text-[13px] italic text-slate-800 space-y-1 mb-4 leading-relaxed">
              <p>- Căn cứ Bộ Luật dân sự năm 2015 số 91/2015/QH13 ngày 24/11/2015;</p>
              <p>- Căn cứ nhu cầu giảng dạy, bồi dưỡng học sinh và khả năng thực tế của các bên trong hợp đồng;</p>
            </div>

            {/* Date & Location */}
            <div className="text-xs sm:text-[13.5px] text-slate-900 mb-4 leading-relaxed">
              Hôm nay, ngày{' '}
              {isEditing ? (
                <input
                  type="text"
                  value={agreementData.signingDay}
                  onChange={e => setAgreementData({ ...agreementData, signingDay: e.target.value })}
                  className="w-8 border-b border-slate-400 text-center font-bold"
                />
              ) : (
                <strong>{agreementData.signingDay}</strong>
              )}{' '}
              tháng{' '}
              {isEditing ? (
                <input
                  type="text"
                  value={agreementData.signingMonth}
                  onChange={e => setAgreementData({ ...agreementData, signingMonth: e.target.value })}
                  className="w-8 border-b border-slate-400 text-center font-bold"
                />
              ) : (
                <strong>{agreementData.signingMonth}</strong>
              )}{' '}
              năm{' '}
              {isEditing ? (
                <input
                  type="text"
                  value={agreementData.signingYear}
                  onChange={e => setAgreementData({ ...agreementData, signingYear: e.target.value })}
                  className="w-14 border-b border-slate-400 text-center font-bold"
                />
              ) : (
                <strong>{agreementData.signingYear}</strong>
              )}
              , tại{' '}
              {isEditing ? (
                <input
                  type="text"
                  value={agreementData.signingLocation}
                  onChange={e => setAgreementData({ ...agreementData, signingLocation: e.target.value })}
                  className="border-b border-slate-400 px-1 font-bold"
                />
              ) : (
                <strong>{agreementData.signingLocation || 'Hà Nội'}</strong>
              )}
              .<br />
              Chúng tôi gồm có:
            </div>

            {/* TWO PARTIES: INDIVIDUAL TO INDIVIDUAL */}
            <div className="space-y-3 mb-5">
              
              {/* Party 1: Bên Giao Khoán (Bên A) */}
              <table className="w-full border-collapse border border-black text-xs sm:text-[13px]">
                <thead>
                  <tr className="bg-slate-100 border-b border-black text-left">
                    <th colSpan={2} className="p-2 font-bold text-black uppercase">
                      BÊN A (BÊN GIAO KHOÁN):
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-black">
                    <td className="border-r border-black p-2 w-[50%]">
                      <span>Họ và tên đại diện: </span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={agreementData.employerName}
                          onChange={e => setAgreementData({ ...agreementData, employerName: e.target.value })}
                          className="border-b border-slate-400 px-1 font-bold text-black"
                        />
                      ) : (
                        <strong className="font-bold text-black">{agreementData.employerName || 'Trần Hạnh Dung'}</strong>
                      )}
                    </td>
                    <td className="p-2 w-[50%]">
                      <span>Chức vụ / Tư cách: </span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={agreementData.employerTitle}
                          onChange={e => setAgreementData({ ...agreementData, employerTitle: e.target.value })}
                          className="border-b border-slate-400 px-1 font-bold text-black"
                        />
                      ) : (
                        <span className="font-bold text-black">{agreementData.employerTitle || 'Người thuê'}</span>
                      )}
                    </td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="border-r border-black p-2" colSpan={2}>
                      <span>Địa chỉ: </span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={agreementData.employerAddress}
                          onChange={e => setAgreementData({ ...agreementData, employerAddress: e.target.value })}
                          className="border-b border-slate-400 px-1 w-2/3"
                        />
                      ) : (
                        <span>{agreementData.employerAddress || 'Hà Nội'}</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="border-r border-black p-2">
                      <span>Điện thoại / Zalo: </span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={agreementData.employerPhone}
                          onChange={e => setAgreementData({ ...agreementData, employerPhone: e.target.value })}
                          className="border-b border-slate-400 px-1"
                        />
                      ) : (
                        <span>{agreementData.employerPhone || ''}</span>
                      )}
                    </td>
                    <td className="p-2">
                      <span>Email liên hệ: </span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={agreementData.employerEmail}
                          onChange={e => setAgreementData({ ...agreementData, employerEmail: e.target.value })}
                          className="border-b border-slate-400 px-1"
                        />
                      ) : (
                        <span>{agreementData.employerEmail || ''}</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Party 2: Bên Nhận Khoán (Bên B) */}
              <table className="w-full border-collapse border border-black text-xs sm:text-[13px]">
                <thead>
                  <tr className="bg-slate-100 border-b border-black text-left">
                    <th colSpan={2} className="p-2 font-bold text-black uppercase">
                      BÊN B (BÊN NHẬN KHOÁN):
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-black">
                    <td className="border-r border-black p-2 w-[50%]">
                      <span>Họ và tên: </span>
                      <strong className="font-bold text-black">{agreementData.staffName}</strong>
                    </td>
                    <td className="p-2 w-[50%]">
                      <span>Ngày tháng năm sinh: </span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={agreementData.staffBirthDate}
                          onChange={e => setAgreementData({ ...agreementData, staffBirthDate: e.target.value })}
                          placeholder="VD: 15/08/2002"
                          className="border-b border-slate-400 px-1 font-mono text-black"
                        />
                      ) : (
                        <span>{agreementData.staffBirthDate || ''}</span>
                      )}
                    </td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="border-r border-black p-2" colSpan={2}>
                      <span>Địa chỉ thường trú / liên hệ: </span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={agreementData.staffAddress}
                          onChange={e => setAgreementData({ ...agreementData, staffAddress: e.target.value })}
                          placeholder="Số nhà, đường, quận/huyện, tỉnh/TP"
                          className="border-b border-slate-400 px-1 w-3/4"
                        />
                      ) : (
                        <span>{agreementData.staffAddress || ''}</span>
                      )}
                    </td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="border-r border-black p-2 w-[50%]">
                      <span>Số CMND/CCCD: </span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={agreementData.citizenId}
                          onChange={e => setAgreementData({ ...agreementData, citizenId: e.target.value })}
                          className="border-b border-slate-400 px-1 font-mono font-bold text-black"
                        />
                      ) : (
                        <strong className="font-mono text-black">{agreementData.citizenId || ''}</strong>
                      )}
                    </td>
                    <td className="p-2 w-[50%]">
                      <span>Ngày cấp: </span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={agreementData.citizenIssueDate}
                          onChange={e => setAgreementData({ ...agreementData, citizenIssueDate: e.target.value })}
                          placeholder="DD/MM/YYYY"
                          className="border-b border-slate-400 px-1 w-32 font-mono"
                        />
                      ) : (
                        <span>{agreementData.citizenIssueDate || ''}</span>
                      )}
                    </td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="border-r border-black p-2" colSpan={2}>
                      <span>Nơi cấp: </span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={agreementData.citizenIssuePlace}
                          onChange={e => setAgreementData({ ...agreementData, citizenIssuePlace: e.target.value })}
                          placeholder="VD: Cục Cảnh sát quản lý hành chính về trật tự xã hội"
                          className="border-b border-slate-400 px-1 w-3/4"
                        />
                      ) : (
                        <span>{agreementData.citizenIssuePlace || ''}</span>
                      )}
                    </td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="border-r border-black p-2">
                      <span>Điện thoại / Zalo: </span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={agreementData.phone}
                          onChange={e => setAgreementData({ ...agreementData, phone: e.target.value })}
                          className="border-b border-slate-400 px-1"
                        />
                      ) : (
                        <span>{agreementData.phone || ''}</span>
                      )}
                    </td>
                    <td className="p-2">
                      <span>Email liên hệ: </span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={agreementData.email}
                          onChange={e => setAgreementData({ ...agreementData, email: e.target.value })}
                          className="border-b border-slate-400 px-1"
                        />
                      ) : (
                        <span>{agreementData.email || ''}</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="border-r border-black p-2" colSpan={2}>
                      <span>Tài khoản nhận thù lao: </span>
                      {isEditing ? (
                        <div className="inline-flex gap-2 flex-wrap">
                          <input
                            type="text"
                            value={agreementData.bankAccount}
                            onChange={e => setAgreementData({ ...agreementData, bankAccount: e.target.value })}
                            placeholder="Số TK"
                            className="border-b border-slate-400 px-1 font-mono font-bold"
                          />
                          <input
                            type="text"
                            value={agreementData.bankName}
                            onChange={e => setAgreementData({ ...agreementData, bankName: e.target.value })}
                            placeholder="Tên ngân hàng"
                            className="border-b border-slate-400 px-1"
                          />
                          <input
                            type="text"
                            value={agreementData.bankOwner}
                            onChange={e => setAgreementData({ ...agreementData, bankOwner: e.target.value })}
                            placeholder="Chủ tài khoản"
                            className="border-b border-slate-400 px-1"
                          />
                        </div>
                      ) : agreementData.bankAccount ? (
                        <>
                          <strong className="font-mono text-black">{agreementData.bankAccount}</strong>
                          <span> tại {agreementData.bankName || 'Ngân hàng'} (Chủ TK: <strong>{agreementData.bankOwner || agreementData.staffName}</strong>)</span>
                        </>
                      ) : (
                        <span></span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>

            </div>

            {/* Transition sentence */}
            <div className="text-xs sm:text-[13.5px] text-slate-900 mb-5 leading-relaxed italic">
              Sau khi thỏa thuận, hai bên đồng ý ký kết và thực hiện Hợp đồng khoán việc với các điều khoản sau đây:
            </div>

            {/* AGREEMENT CLAUSES */}
            <div className="space-y-6 text-justify">
              
              {/* ARTICLE 1: ROLES & QUALITY CHECKLISTS */}
              <div>
                <div className="mb-3">
                  <h3 className="font-bold text-black text-xs sm:text-sm uppercase flex items-center gap-1.5 pb-1 border-b border-black">
                    <span>ĐIỀU 1. NỘI DUNG CÔNG VIỆC VÀ TIÊU CHUẨN CHẤT LƯỢNG</span>
                  </h3>
                  <p className="text-xs sm:text-[13px] text-slate-800 mt-2 leading-relaxed">
                    Bên A giao khoán và Bên B đồng ý nhận thực hiện các công việc chuyên môn phục vụ công tác bồi dưỡng học sinh giỏi Sinh học theo các vai trò và tiêu chuẩn Bảng kiểm (KPI 100%) dưới đây:
                  </p>
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
                            className="kpi-table-section w-full border-collapse border border-black text-xs sm:text-sm mb-4 break-inside-avoid print:break-inside-avoid"
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

              {/* ARTICLE 2: WORK LOCATION */}
              <div>
                <h3 className="font-bold text-black text-xs sm:text-sm uppercase mb-2 pb-1 border-b border-black">
                  <span>ĐIỀU 2. NƠI LÀM VIỆC VÀ HÌNH THỨC THỰC HIỆN</span>
                </h3>
                <p className="text-xs sm:text-[13px] text-slate-800 leading-relaxed [text-wrap:pretty]">
                  Công việc được thực hiện trực tiếp tại phòng học Lớp Ôn Thi HSGQG Sinh Học (Hà Nội) hoặc thực hiện từ xa (Online) qua hệ thống quản lý học tập, Google Drive, Zalo theo đúng lịch phân công và điều phối chuyên môn của&nbsp;Bên&nbsp;A.
                </p>
              </div>

              {/* ARTICLE 3: SCHEDULE, COMMITMENT & NOTICE */}
              <div className="break-inside-avoid print:break-inside-avoid" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <h3 className="font-bold text-black text-xs sm:text-sm uppercase mb-2 pb-1 border-b border-black">
                  <span>ĐIỀU 3. TIẾN ĐỘ THỰC HIỆN CÔNG VIỆC VÀ THỜI HẠN HỢP ĐỒNG</span>
                </h3>
                <div className="text-xs sm:text-[13px] text-slate-800 space-y-1.5 leading-relaxed [text-wrap:pretty]">
                  <p className="[text-wrap:pretty]">
                    <strong>3.1. Thời hạn cam kết hợp tác (tối thiểu 01 năm):</strong> Hai bên cùng xác lập thỏa thuận trên tinh thần trách nhiệm cao nhất đối với chất lượng đào tạo học sinh. Bên B cam kết đồng hành và duy trì công việc ổn định trong thời hạn ít nhất 01 năm (12 tháng) kể từ ngày&nbsp;ký&nbsp;hợp&nbsp;đồng.
                  </p>
                  <p className="[text-wrap:pretty]">
                    <strong>3.2. Tiến độ thực hiện & Báo vắng:</strong> Bên B thực hiện công việc đúng tiến độ, thời khóa biểu và ca trực được giao. Trường hợp bận đột xuất vì lý do bất khả kháng, Bên B bắt buộc phải thông báo trước cho Bên A ít nhất 24 giờ để kịp thời sắp xếp phương&nbsp;án&nbsp;hỗ&nbsp;trợ.
                  </p>
                  <p className="[text-wrap:pretty]">
                    <strong>3.3. Quy định thôi việc & Trách nhiệm bàn giao (Báo trước 02 tháng):</strong> Trường hợp Bên B có nguyện vọng thôi việc vì lý do chính đáng, bắt buộc phải gửi thông báo bằng văn bản cho Bên A trước ít nhất 02 tháng (60 ngày). Trong thời gian này, Bên B có trách nhiệm tiếp tục hoàn thành 100% nhiệm vụ được giao, hướng dẫn người thay thế và bàn giao đầy đủ toàn bộ giáo án, đề thi, bài tập và bảng điểm cho đến ngày làm&nbsp;việc&nbsp;cuối&nbsp;cùng.
                  </p>
                </div>
              </div>

              {/* ARTICLE 4: AGREED RATES & PAYMENT */}
              <div>
                <h3 className="font-bold text-black text-xs sm:text-sm uppercase mb-3 flex items-center gap-1.5 pb-1 border-b border-black">
                  <span>ĐIỀU 4. LƯƠNG KHOÁN / THÙ LAO VÀ PHƯƠNG THỨC THANH TOÁN</span>
                </h3>
                <p className="text-xs sm:text-[13px] text-slate-800 mb-2 leading-relaxed">
                  <strong>4.1. Đơn giá khoán việc thống nhất:</strong>
                </p>

                {/* Rates Table matching Payslip solid border format */}
                <table className="w-full border-collapse border border-black text-xs sm:text-sm mb-3">
                  <thead>
                    <tr className="bg-slate-100 text-left border-b border-black">
                      <th className="border-r border-black p-2 font-bold text-black w-[48%]">Đầu việc / Vai trò đảm nhiệm</th>
                      <th className="border-r border-black p-2 font-bold text-black text-center w-[22%]">Đơn vị tính</th>
                      <th className="p-2 font-bold text-black text-right pr-3 w-[30%]">Mức thù lao thỏa thuận</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* 1. GIẢNG DẠY */}
                    {activeRoleIds.has('giang_vien') && (
                      <>
                        {agreementData.teachingTiers.length === 0 ? (
                          <tr className="border-b border-black">
                            <td className="border-r border-black p-2 font-medium">
                              Giảng dạy trực tiếp môn Sinh học
                            </td>
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
                        ) : (
                          agreementData.teachingTiers.map(tier => (
                            <tr key={tier.id} className="border-b border-black">
                              <td className="border-r border-black p-2 font-medium text-slate-900">
                                {isEditing ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-slate-600 font-medium whitespace-nowrap">Giảng dạy - </span>
                                    <input
                                      type="text"
                                      value={tier.name}
                                      onChange={e => handleUpdateTeachingTier(tier.id, 'name', e.target.value)}
                                      placeholder="Tên lớp (VD: Lớp Đội tuyển HSG)"
                                      className="flex-1 border border-slate-300 rounded px-1.5 py-0.5 text-xs font-semibold"
                                    />
                                  </div>
                                ) : (
                                  <span>Giảng dạy trực tiếp: <strong className="font-semibold text-black">{tier.name}</strong></span>
                                )}
                              </td>
                              <td className="border-r border-black p-2 text-center">Buổi dạy</td>
                              <td className="p-2 text-right pr-3 font-bold text-black">
                                {isEditing ? (
                                  <div className="inline-flex items-center justify-end gap-1.5">
                                    <input
                                      type="number"
                                      value={tier.rate}
                                      onChange={e => handleUpdateTeachingTier(tier.id, 'rate', Number(e.target.value))}
                                      className="w-24 text-right border border-slate-300 rounded px-1 font-bold"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveTeachingTier(tier.id)}
                                      className="text-rose-500 hover:text-rose-700 p-0.5 cursor-pointer"
                                      title="Xóa mức giá này"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  `${formatVND(tier.rate)} đ`
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </>
                    )}

                    {/* 2. TRỢ GIẢNG */}
                    {activeRoleIds.has('tro_giang') && (
                      <>
                        {agreementData.tutoringTiers.length === 0 ? (
                          <tr className="border-b border-black">
                            <td className="border-r border-black p-2 font-medium">
                              Trợ giảng & hỗ trợ học sinh
                            </td>
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
                        ) : (
                          agreementData.tutoringTiers.map(tier => (
                            <tr key={tier.id} className="border-b border-black">
                              <td className="border-r border-black p-2 font-medium text-slate-900">
                                {isEditing ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-slate-600 font-medium whitespace-nowrap">Trợ giảng - </span>
                                    <input
                                      type="text"
                                      value={tier.name}
                                      onChange={e => handleUpdateTutoringTier(tier.id, 'name', e.target.value)}
                                      placeholder="Tên lớp (VD: Lớp 10 Chuyên, Lớp Đội tuyển)"
                                      className="flex-1 border border-slate-300 rounded px-1.5 py-0.5 text-xs font-semibold"
                                    />
                                  </div>
                                ) : (
                                  <span>Trợ giảng & hỗ trợ học sinh: <strong className="font-semibold text-black">{tier.name}</strong></span>
                                )}
                              </td>
                              <td className="border-r border-black p-2 text-center">Buổi trợ giảng</td>
                              <td className="p-2 text-right pr-3 font-bold text-black">
                                {isEditing ? (
                                  <div className="inline-flex items-center justify-end gap-1.5">
                                    <input
                                      type="number"
                                      value={tier.rate}
                                      onChange={e => handleUpdateTutoringTier(tier.id, 'rate', Number(e.target.value))}
                                      className="w-24 text-right border border-slate-300 rounded px-1 font-bold"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveTutoringTier(tier.id)}
                                      className="text-rose-500 hover:text-rose-700 p-0.5 cursor-pointer"
                                      title="Xóa mức giá này"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  `${formatVND(tier.rate)} đ`
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </>
                    )}

                    {/* 3. CHẤM THI */}
                    {activeRoleIds.has('cham_thi') && (
                      <>
                        {agreementData.gradingTiers.length === 0 ? (
                          <tr className="border-b border-black">
                            <td className="border-r border-black p-2 font-medium">
                              Chấm bài tập & bài kiểm tra học sinh
                            </td>
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
                        ) : (
                          agreementData.gradingTiers.map(tier => (
                            <tr key={tier.id} className="border-b border-black">
                              <td className="border-r border-black p-2 font-medium text-slate-900">
                                {isEditing ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-slate-600 font-medium whitespace-nowrap">Chấm bài - </span>
                                    <input
                                      type="text"
                                      value={tier.name}
                                      onChange={e => handleUpdateGradingTier(tier.id, 'name', e.target.value)}
                                      placeholder="Loại đề (VD: Đề thi thử HSGQG, Đề 15p)"
                                      className="flex-1 border border-slate-300 rounded px-1.5 py-0.5 text-xs font-semibold"
                                    />
                                  </div>
                                ) : (
                                  <span>Chấm bài tập & bài kiểm tra: <strong className="font-semibold text-black">{tier.name}</strong></span>
                                )}
                              </td>
                              <td className="border-r border-black p-2 text-center">Bài chấm</td>
                              <td className="p-2 text-right pr-3 font-bold text-black">
                                {isEditing ? (
                                  <div className="inline-flex items-center justify-end gap-1.5">
                                    <input
                                      type="number"
                                      value={tier.rate}
                                      onChange={e => handleUpdateGradingTier(tier.id, 'rate', Number(e.target.value))}
                                      className="w-24 text-right border border-slate-300 rounded px-1 font-bold"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveGradingTier(tier.id)}
                                      className="text-rose-500 hover:text-rose-700 p-0.5 cursor-pointer"
                                      title="Xóa mức giá này"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  `${formatVND(tier.rate)} đ`
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </>
                    )}

                    {/* 4. SOẠN ĐỀ THI */}
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

                    {/* 5. TRỢ LÝ HỌC VỤ */}
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

                    {/* 6. CUSTOM TIERS */}
                    {agreementData.customTiers.map(tier => (
                      <tr key={tier.id} className="border-b border-black bg-amber-50/20">
                        <td className="border-r border-black p-2 font-medium">
                          {isEditing ? (
                            <input
                              type="text"
                              value={tier.name}
                              onChange={e => handleUpdateCustomTier(tier.id, 'name', e.target.value)}
                              placeholder="Tên đầu việc"
                              className="w-full border border-slate-300 rounded px-1.5 py-0.5 text-xs font-semibold"
                            />
                          ) : (
                            tier.name
                          )}
                        </td>
                        <td className="border-r border-black p-2 text-center">
                          {isEditing ? (
                            <input
                              type="text"
                              value={tier.unit || 'Buổi'}
                              onChange={e => handleUpdateCustomTier(tier.id, 'unit', e.target.value)}
                              placeholder="Đơn vị"
                              className="w-20 text-center border border-slate-300 rounded px-1 py-0.5 text-xs"
                            />
                          ) : (
                            tier.unit || 'Buổi / Đợt'
                          )}
                        </td>
                        <td className="p-2 text-right pr-3 font-bold text-black">
                          {isEditing ? (
                            <div className="inline-flex items-center justify-end gap-1.5">
                              <input
                                type="number"
                                value={tier.rate}
                                onChange={e => handleUpdateCustomTier(tier.id, 'rate', Number(e.target.value))}
                                className="w-24 text-right border border-slate-300 rounded px-1 font-bold"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveCustomTier(tier.id)}
                                className="text-rose-500 hover:text-rose-700 p-0.5 cursor-pointer"
                                title="Xóa đầu việc này"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            `${formatVND(tier.rate)} đ`
                          )}
                        </td>
                      </tr>
                    ))}

                    {/* FALLBACK IF NO ROLES AND NO CUSTOM TIERS */}
                    {activeRoleIds.size === 0 && agreementData.customTiers.length === 0 && (
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

                {/* Inline Action Buttons for adding tiers (Only in Edit Mode) */}
                {isEditing && (
                  <div className="flex flex-wrap gap-2 mb-3 no-print">
                    {activeRoleIds.has('tro_giang') && (
                      agreementData.tutoringTiers.length > 0 ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={handleAddTutoringTier}
                            className="text-[11px] font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2.5 py-1 rounded-md cursor-pointer flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>+ Thêm lớp Trợ giảng khác</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setAgreementData(prev => ({ ...prev, tutoringTiers: [] }))}
                            className="text-[11px] font-medium text-slate-600 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 px-2 py-1 rounded-md cursor-pointer"
                            title="Bỏ chia theo lớp, quay lại dùng 1 đơn giá chuẩn chung"
                          >
                            Dùng đơn giá chuẩn
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleAddTutoringTier}
                          className="text-[11px] font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2.5 py-1 rounded-md cursor-pointer flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+ Chia đơn giá Trợ giảng theo lớp</span>
                        </button>
                      )
                    )}

                    {activeRoleIds.has('cham_thi') && (
                      agreementData.gradingTiers.length > 0 ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={handleAddGradingTier}
                            className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-md cursor-pointer flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>+ Thêm loại đề Chấm thi khác</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setAgreementData(prev => ({ ...prev, gradingTiers: [] }))}
                            className="text-[11px] font-medium text-slate-600 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 px-2 py-1 rounded-md cursor-pointer"
                            title="Bỏ chia theo đề, quay lại dùng 1 đơn giá chuẩn chung"
                          >
                            Dùng đơn giá chuẩn
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleAddGradingTier}
                          className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-md cursor-pointer flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+ Chia đơn giá Chấm thi theo đề</span>
                        </button>
                      )
                    )}

                    {activeRoleIds.has('giang_vien') && (
                      agreementData.teachingTiers.length > 0 ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={handleAddTeachingTier}
                            className="text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-md cursor-pointer flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>+ Thêm lớp Giảng dạy khác</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setAgreementData(prev => ({ ...prev, teachingTiers: [] }))}
                            className="text-[11px] font-medium text-slate-600 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 px-2 py-1 rounded-md cursor-pointer"
                            title="Bỏ chia theo lớp, quay lại dùng 1 đơn giá chuẩn chung"
                          >
                            Dùng đơn giá chuẩn
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleAddTeachingTier}
                          className="text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-md cursor-pointer flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+ Chia đơn giá Giảng dạy theo lớp</span>
                        </button>
                      )
                    )}

                    <button
                      type="button"
                      onClick={handleAddCustomTier}
                      className="text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-2.5 py-1 rounded-md cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ Thêm đầu việc & đơn giá khác</span>
                    </button>
                  </div>
                )}

                {/* 4.2 Calculation formula */}
                <p className="text-xs sm:text-[13px] text-slate-800 mb-1.5 leading-relaxed">
                  <strong>4.2. Công thức tính thù lao thực nhận hàng tháng:</strong>
                </p>
                <div className="border border-black p-2.5 text-xs sm:text-sm text-center font-medium text-slate-900 mb-2 bg-slate-50">
                  <span className="font-bold text-black">Thù lao thực nhận hàng tháng = </span>
                  [ Khối lượng hoàn thành × Đơn giá ] × [ % Đạt Bảng kiểm ] + Tiền thưởng - Khấu trừ
                </div>

                <div className="text-xs sm:text-[13px] text-slate-800 space-y-1 mt-2 leading-relaxed">
                  <p>
                    <strong>4.3. Nghĩa vụ thuế thu nhập cá nhân:</strong> Các khoản nghĩa vụ tài chính và thuế thu nhập cá nhân (TNCN) phát sinh từ hợp đồng khoán việc này được các bên thực hiện theo đúng quy định hiện hành của pháp luật về thuế.
                  </p>
                  <p>
                    <strong>4.4. Chu kỳ và phương thức thanh toán:</strong> Vào cuối mỗi tháng, Bên A tổng hợp khối lượng công việc và gửi <strong>Bảng Kê Thù Lao</strong> để Bên B đối soát. Tiền thù lao được chuyển khoản trực tiếp vào tài khoản ngân hàng của Bên B từ ngày <strong>05 đến ngày 10</strong> của tháng tiếp theo.
                  </p>
                </div>
              </div>

              {/* ARTICLE 5: RIGHTS & OBLIGATIONS OF PARTY A */}
              <div className="break-inside-avoid print:break-inside-avoid" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <h3 className="font-bold text-black text-xs sm:text-sm uppercase mb-2 pb-1 border-b border-black">
                  <span>ĐIỀU 5. QUYỀN VÀ NGHĨA VỤ CỦA BÊN A (BÊN GIAO KHOÁN)</span>
                </h3>
                <div className="text-xs sm:text-[13px] text-slate-800 space-y-2 leading-relaxed">
                  <div>
                    <strong>5.1. Quyền của Bên A:</strong>
                    <ul className="list-disc pl-5 mt-0.5 space-y-0.5 text-slate-800">
                      <li>Yêu cầu Bên B thực hiện đầy đủ, đúng hạn các công việc đã thỏa thuận tại Điều 1 và Điều 3.</li>
                      <li>Kiểm tra, nghiệm thu và đánh giá chất lượng kết quả công việc theo đúng Bảng kiểm chuyên môn (KPI).</li>
                      <li>Tạm dừng công việc hoặc áp dụng các chế tài xử lý nếu Bên B không bảo đảm tiêu chuẩn chất lượng hoặc vi phạm kỷ luật.</li>
                    </ul>
                  </div>
                  <div>
                    <strong>5.2. Nghĩa vụ của Bên A:</strong>
                    <ul className="list-disc pl-5 mt-0.5 space-y-0.5 text-slate-800 [text-wrap:pretty]">
                      <li>Cung cấp tài liệu hướng dẫn, bài tập mẫu, danh sách học sinh và các điều kiện cần thiết để Bên B hoàn thành tốt nhiệm vụ được giao.</li>
                      <li>Thanh toán đầy đủ, đúng thời hạn thù lao khoán cho Bên B theo đúng quy định tại Điều 4.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* ARTICLE 6: RIGHTS & OBLIGATIONS OF PARTY B */}
              <div className="break-inside-avoid print:break-inside-avoid" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <h3 className="font-bold text-black text-xs sm:text-sm uppercase mb-2 pb-1 border-b border-black">
                  <span>ĐIỀU 6. QUYỀN VÀ NGHĨA VỤ CỦA BÊN B (BÊN NHẬN KHOÁN)</span>
                </h3>
                <div className="text-xs sm:text-[13px] text-slate-800 space-y-2 leading-relaxed">
                  <div>
                    <strong>6.1. Quyền của Bên B:</strong>
                    <ul className="list-disc pl-5 mt-0.5 space-y-0.5 text-slate-800">
                      <li>Được Bên A cung cấp tài liệu, hướng dẫn và tạo điều kiện thuận lợi để hoàn thành công việc được giao.</li>
                      <li>Được thanh toán đầy đủ thù lao khoán việc theo đúng Điều 4 khi hoàn thành nhiệm vụ đạt chuẩn.</li>
                    </ul>
                  </div>
                  <div>
                    <strong>6.2. Nghĩa vụ của Bên B:</strong>
                    <ul className="list-disc pl-5 mt-0.5 space-y-0.5 text-slate-800">
                      <li>Trực tiếp thực hiện công việc với tinh thần trách nhiệm cao nhất, bảo đảm chất lượng theo đúng Bảng kiểm chuyên môn.</li>
                      <li>Chấp hành nghiêm túc thời gian làm việc, tiến độ giao bài và các quy định báo trước tại Điều 3.</li>
                      <li>
                        <strong>Nghĩa vụ bảo mật thông tin & tài sản trí tuệ:</strong> Toàn bộ đề thi chuyên đề, đề thi thử HSGQG, giáo án, tài liệu và ngân hàng bài tập là tài sản trí tuệ thuộc quyền sở hữu của Bên A. Bên B cam kết bảo mật tuyệt đối, chỉ phục vụ công tác nội bộ tại lớp, không được sao chép, phát tán, đăng tải lên không gian mạng hoặc chia sẻ cho bên thứ ba dưới bất kỳ hình thức nào khi chưa có sự đồng ý bằng văn bản của Bên A.
                      </li>
                      <li>
                        <strong>Cam kết nghiêm cấm lôi kéo học sinh:</strong> Bên B tuyệt đối không được phép lợi dụng danh nghĩa công việc, giờ dạy hoặc kênh liên lạc để tiếp cận, rủ rê, lôi kéo học sinh hoặc phụ huynh chuyển lớp, học riêng ngoài chương trình hoặc cung cấp thông tin học sinh cho cá nhân/tổ chức thứ ba.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* ARTICLE 7: PENALTIES & BREACH OF CONTRACT */}
              <div className="break-inside-avoid print:break-inside-avoid" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <h3 className="font-bold text-black text-xs sm:text-sm uppercase mb-2 pb-1 border-b border-black">
                  <span>ĐIỀU 7. CHẾ TÀI XỬ LÝ VI PHẠM VÀ BỒI THƯỜNG HỢP ĐỒNG</span>
                </h3>
                <div className="text-xs sm:text-[13px] text-slate-800 space-y-2 leading-relaxed">
                  <p>
                    <strong>7.1. Chế tài đối với hành vi phá vỡ hợp đồng:</strong> Mọi hành vi tự ý bỏ việc, ngưng hợp tác trước thời hạn cam kết 01 năm, không tuân thủ thời hạn thông báo trước 02 tháng, hoặc không hoàn tất trách nhiệm bàn giao 100% công việc đều bị xác định là hành vi đơn phương phá vỡ hợp đồng. Bên B có trách nhiệm bồi thường toàn bộ thiệt hại thực tế phát sinh và <strong>chịu phạt vi phạm bằng 50% tổng số tiền thù lao đã nhận</strong> kể từ khi bắt đầu hợp tác cho đến thời điểm vi phạm.
                  </p>
                  <p>
                    <strong>7.2. Chế tài đối với hành vi lôi kéo học sinh:</strong> Hành vi tiếp cận, rủ rê, lôi kéo học sinh hoặc chia sẻ dữ liệu học sinh khi bị phát hiện sẽ bị xử lý kỷ luật tương đương vi phạm phá vỡ hợp đồng: lập tức chấm dứt hợp đồng và <strong>chịu phạt vi phạm bằng 50% tổng số tiền thù lao đã nhận</strong> kể từ khi hợp tác đến lúc vi phạm, đồng thời phải bồi thường toàn bộ thiệt hại thực tế phát sinh cho Bên A.
                  </p>
                </div>
              </div>

              {/* ARTICLE 8: GENERAL PROVISIONS */}
              <div className="break-inside-avoid print:break-inside-avoid" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <h3 className="font-bold text-black text-xs sm:text-sm uppercase mb-2 pb-1 border-b border-black">
                  <span>ĐIỀU 8. ĐIỀU KHOẢN CHUNG</span>
                </h3>
                <div className="text-xs sm:text-[13px] text-slate-800 space-y-1.5 leading-relaxed [text-wrap:pretty]">
                  <p className="[text-wrap:pretty]">
                    8.1. Hai bên cam kết thực hiện nghiêm túc các điều khoản ghi trong hợp đồng này trên tinh thần trách nhiệm cao, thiện chí hợp tác và tôn&nbsp;trọng&nbsp;lẫn&nbsp;nhau.
                  </p>
                  <p className="[text-wrap:pretty]">
                    8.2. Mọi tranh chấp phát sinh trong quá trình thực hiện hợp đồng sẽ được ưu tiên giải quyết thông qua thương lượng trực tiếp. Trường hợp không thể thương lượng được thì tranh chấp sẽ do Tòa án nhân dân có thẩm quyền giải quyết theo đúng quy&nbsp;định&nbsp;pháp&nbsp;luật.
                  </p>
                  <p className="[text-wrap:pretty]">
                    8.3. Hợp đồng này có hiệu lực kể từ ngày ký và tự động thanh lý khi hai bên đã hoàn tất toàn bộ quyền và nghĩa vụ đối&nbsp;với&nbsp;nhau.
                  </p>
                  <p className="[text-wrap:pretty]">
                    8.4. Hợp đồng này được lập thành 02 (hai) bản có giá trị pháp lý như nhau, mỗi bên giữ 01 (một) bản để làm căn&nbsp;cứ&nbsp;thực&nbsp;hiện.
                  </p>
                </div>
              </div>

            </div>

            {/* SIGNATURE SECTION: TWO PARTIES */}
            <div 
              className="signature-container grid grid-cols-2 gap-8 text-center pt-6 mt-4 border-t border-slate-300 break-inside-avoid print:break-inside-avoid" 
              style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
            >
              
              {/* Bên A Column */}
              <div className="flex flex-col items-center justify-between min-h-[140px]">
                <div>
                  <p className="font-bold text-xs sm:text-sm uppercase tracking-wider text-black mb-0.5">
                    BÊN A (BÊN GIAO KHOÁN)
                  </p>
                  <p className="text-[11px] sm:text-xs italic text-slate-500">
                    (Ký & ghi rõ họ tên)
                  </p>
                </div>

                {/* Space for handwriting signature or electronic signature */}
                <div className="my-1.5 h-16 flex items-center justify-center">
                  {showSignature && orgSettings?.managerSignatureImg ? (
                    <img
                      src={orgSettings.managerSignatureImg}
                      alt="Chữ ký điện tử Trần Hạnh Dung"
                      className="max-h-16 max-w-[180px] object-contain pointer-events-none select-none drop-shadow-2xs"
                    />
                  ) : (
                    <div className="h-16"></div>
                  )}
                </div>

                <div>
                  <p className="font-bold text-sm sm:text-base text-black">
                    {agreementData.employerName || 'Trần Hạnh Dung'}
                  </p>
                  <p className="text-xs text-slate-600">{agreementData.employerTitle || 'Người thuê'}</p>
                </div>
              </div>

              {/* Bên B Column */}
              <div className="flex flex-col items-center justify-between min-h-[140px]">
                <div>
                  <p className="font-bold text-xs sm:text-sm uppercase tracking-wider text-black mb-0.5">
                    BÊN B (BÊN NHẬN KHOÁN)
                  </p>
                  <p className="text-[11px] sm:text-xs italic text-slate-500">
                    (Ký & ghi rõ họ tên)
                  </p>
                </div>

                {/* Space for handwriting signature */}
                <div className="my-1.5 h-16"></div>

                <div>
                  <p className="font-bold text-sm sm:text-base text-black">
                    {agreementData.staffName}
                  </p>
                  <p className="text-xs text-slate-600">
                    Bên nhận khoán
                  </p>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
