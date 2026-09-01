import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Staff, DepartmentId, DivisionType, StaffRoleType, CustomRateTier } from '../../types';
import { 
  STAFF_ROLE_DEFINITIONS, 
  STAFF_ROLE_LIST, 
  getStaffAssignedChecklists, 
  getStaffDutyRates, 
  resolveStaffRoleType,
  hasStaffRole,
  getRolesChecklistIds
} from '../../data/roleDefinitions';
import { formatVND } from '../../utils/formatters';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  CreditCard, 
  Mail, 
  Phone, 
  CheckSquare, 
  CheckCircle2, 
  Briefcase, 
  Sparkles, 
  Search, 
  AlertTriangle,
  Layers,
  Tag,
  DollarSign,
  X
} from 'lucide-react';
import { KpiEvaluatorModal } from '../Evaluation/KpiEvaluatorModal';

export const StaffManager: React.FC = () => {
  const { 
    staffList, 
    checklistTemplates, 
    addStaff, 
    updateStaff, 
    deleteStaff, 
    generateMonthlyPayrollForStaff,
    currentMonth,
    setActiveTab 
  } = useApp();

  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Modal states
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [evalStaff, setEvalStaff] = useState<Staff | null>(null);
  const [deletingStaff, setDeletingStaff] = useState<Staff | null>(null);

  // New tier inputs in modal
  const [newTutoringTierName, setNewTutoringTierName] = useState<string>('');
  const [newTutoringTierRate, setNewTutoringTierRate] = useState<number>(80000);
  const [showAddTutoringTier, setShowAddTutoringTier] = useState<boolean>(false);

  const [newGradingTierName, setNewGradingTierName] = useState<string>('');
  const [newGradingTierRate, setNewGradingTierRate] = useState<number>(15000);
  const [showAddGradingTier, setShowAddGradingTier] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState<{
    code: string;
    fullName: string;
    role: string;
    roles: StaffRoleType[];
    assignedChecklistIds: string[];
    departmentId: DepartmentId;
    departmentName: string;
    division: DivisionType;
    bankAccount: string;
    bankName: string;
    bankOwner: string;
    phone: string;
    email: string;
    isActive: boolean;
    // 5 Billable items configuration
    teachingRate: number;
    tutoringRate: number;
    tutoringTiers: CustomRateTier[];
    gradingRate: number;
    gradingTiers: CustomRateTier[];
    dayWorkRate: number;
  }>({
    code: '',
    fullName: '',
    role: 'Giảng Viên',
    roles: ['giang_vien'],
    assignedChecklistIds: ['chk_day_hoc', 'chk_soan_bai'],
    departmentId: 'day_hoc',
    departmentName: 'Dạy Học',
    division: 'CHUYEN_MON',
    bankAccount: '',
    bankName: 'Techcombank',
    bankOwner: '',
    phone: '',
    email: '',
    isActive: true,
    teachingRate: 70000,
    tutoringRate: 70000,
    tutoringTiers: [],
    gradingRate: 10000,
    gradingTiers: [],
    dayWorkRate: 70000,
  });

  const handleOpenModal = (staff?: Staff) => {
    setShowAddTutoringTier(false);
    setShowAddGradingTier(false);
    setNewTutoringTierName('');
    setNewGradingTierName('');

    if (staff) {
      setEditingStaff(staff);
      const staffRoles = staff.roles && staff.roles.length > 0 ? staff.roles : [resolveStaffRoleType(staff)];
      const rates = getStaffDutyRates(staff);
      const assignedList = getStaffAssignedChecklists(staff, checklistTemplates);
      
      setFormData({
        code: staff.code,
        fullName: staff.fullName,
        role: staff.role,
        roles: staffRoles,
        assignedChecklistIds: staff.assignedChecklistIds && staff.assignedChecklistIds.length > 0
          ? staff.assignedChecklistIds
          : assignedList.map(c => c.id),
        departmentId: staff.departmentId,
        departmentName: staff.departmentName,
        division: staff.division,
        bankAccount: staff.bankAccount,
        bankName: staff.bankName,
        bankOwner: staff.bankOwner || '',
        phone: staff.phone || '',
        email: staff.email || '',
        isActive: staff.isActive,
        teachingRate: rates.teachingRate,
        tutoringRate: rates.tutoringRate,
        tutoringTiers: rates.tutoringTiers || [],
        gradingRate: rates.gradingRate,
        gradingTiers: rates.gradingTiers || [],
        dayWorkRate: rates.dayWorkRate,
      });
    } else {
      setEditingStaff(null);
      const defaultRole = STAFF_ROLE_DEFINITIONS.giang_vien;
      setFormData({
        code: `TD-${Date.now().toString().slice(-4)}`,
        fullName: '',
        role: defaultRole.title,
        roles: ['giang_vien'],
        assignedChecklistIds: defaultRole.defaultChecklistIds || ['chk_day_hoc', 'chk_soan_bai'],
        departmentId: defaultRole.departmentId,
        departmentName: defaultRole.departmentName,
        division: defaultRole.division,
        bankAccount: '',
        bankName: 'Techcombank',
        bankOwner: '',
        phone: '',
        email: '',
        isActive: true,
        teachingRate: 70000,
        tutoringRate: 70000,
        tutoringTiers: [],
        gradingRate: 10000,
        gradingTiers: [],
        dayWorkRate: 70000,
      });
    }
    setShowModal(true);
  };

  const handleToggleRole = (roleType: StaffRoleType) => {
    setFormData(prev => {
      const exists = prev.roles.includes(roleType);
      let newRoles: StaffRoleType[];
      if (exists) {
        newRoles = prev.roles.length > 1 ? prev.roles.filter(r => r !== roleType) : prev.roles;
      } else {
        newRoles = [...prev.roles, roleType];
      }

      // Auto update allowed checklists according to newly selected roles
      const allowedChecklistIds = getRolesChecklistIds(newRoles);

      const primaryRoleDef = STAFF_ROLE_DEFINITIONS[newRoles[0]] || STAFF_ROLE_DEFINITIONS.giang_vien;

      return {
        ...prev,
        roles: newRoles,
        role: newRoles.map(r => STAFF_ROLE_DEFINITIONS[r]?.title).join(' & '),
        departmentId: primaryRoleDef.departmentId,
        departmentName: primaryRoleDef.departmentName,
        division: primaryRoleDef.division,
        assignedChecklistIds: allowedChecklistIds,
      };
    });
  };

  const handleToggleChecklist = (chkId: string) => {
    setFormData(prev => {
      const exists = prev.assignedChecklistIds.includes(chkId);
      let updated: string[];
      if (exists) {
        updated = prev.assignedChecklistIds.length > 1 
          ? prev.assignedChecklistIds.filter(id => id !== chkId) 
          : prev.assignedChecklistIds;
      } else {
        updated = [...prev.assignedChecklistIds, chkId];
      }
      return { ...prev, assignedChecklistIds: updated };
    });
  };

  // Tutoring Tiers Management
  const handleAddTutoringTier = () => {
    if (!newTutoringTierName.trim()) return;
    const newTier: CustomRateTier = {
      id: `tier_tut_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      name: newTutoringTierName.trim(),
      rate: Number(newTutoringTierRate) || 80000,
    };
    setFormData(prev => ({
      ...prev,
      tutoringTiers: [...prev.tutoringTiers, newTier],
    }));
    setNewTutoringTierName('');
    setShowAddTutoringTier(false);
  };

  const handleRemoveTutoringTier = (tierId: string) => {
    setFormData(prev => ({
      ...prev,
      tutoringTiers: prev.tutoringTiers.filter(t => t.id !== tierId),
    }));
  };

  // Grading Tiers Management
  const handleAddGradingTier = () => {
    if (!newGradingTierName.trim()) return;
    const newTier: CustomRateTier = {
      id: `tier_grd_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      name: newGradingTierName.trim(),
      rate: Number(newGradingTierRate) || 15000,
    };
    setFormData(prev => ({
      ...prev,
      gradingTiers: [...prev.gradingTiers, newTier],
    }));
    setNewGradingTierName('');
    setShowAddGradingTier(false);
  };

  const handleRemoveGradingTier = (tierId: string) => {
    setFormData(prev => ({
      ...prev,
      gradingTiers: prev.gradingTiers.filter(t => t.id !== tierId),
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) return;

    const isTeacher = formData.roles.includes('giang_vien');
    const isTutor = formData.roles.includes('tro_giang');
    const isGrader = formData.roles.includes('cham_thi');
    const isAssistant = formData.roles.includes('tro_ly');

    const rates = {
      teachingEnabled: isTeacher,
      teachingRate: Number(formData.teachingRate) || 70000,
      tutoringEnabled: isTutor,
      tutoringRate: Number(formData.tutoringRate) || 70000,
      tutoringTiers: formData.tutoringTiers,
      gradingEnabled: isGrader,
      gradingRate: Number(formData.gradingRate) || 10000,
      gradingTiers: formData.gradingTiers,
      dayWorkEnabled: isAssistant,
      dayWorkRate: Number(formData.dayWorkRate) || 70000,
    };

    let baseRate = 70000;
    if (isTeacher) baseRate = rates.teachingRate;
    else if (isAssistant) baseRate = rates.dayWorkRate;
    else if (isTutor) baseRate = rates.tutoringRate;
    else if (isGrader) baseRate = rates.gradingRate;

    const primaryRole = formData.roles[0] || 'giang_vien';

    const payload: Omit<Staff, 'id'> = {
      code: formData.code.trim() || `TD-${Date.now().toString().slice(-4)}`,
      fullName: formData.fullName.trim(),
      role: formData.role.trim() || 'Thành Viên',
      roleType: primaryRole,
      roles: formData.roles,
      assignedChecklistId: formData.assignedChecklistIds[0] || 'chk_day_hoc',
      assignedChecklistIds: formData.assignedChecklistIds,
      departmentId: formData.departmentId,
      departmentName: formData.departmentName,
      division: formData.division,
      bankAccount: formData.bankAccount.trim(),
      bankName: formData.bankName.trim() || 'Techcombank',
      bankOwner: formData.bankOwner.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      salaryModel: isAssistant ? 'daily_piecework' : 'session',
      baseRate,
      rates,
      defaultPieceworkRates: {
        troGiangPerSession: rates.tutoringRate,
        chamBaiPerItem: rates.gradingRate,
        soanBaiPerItem: 150000,
      },
      isActive: formData.isActive,
    };

    if (editingStaff) {
      updateStaff({
        ...payload,
        id: editingStaff.id,
      });
    } else {
      addStaff(payload);
    }
    
    setTimeout(() => {
      generateMonthlyPayrollForStaff(currentMonth);
    }, 100);

    setShowModal(false);
  };

  const confirmDelete = () => {
    if (deletingStaff) {
      deleteStaff(deletingStaff.id);
      setDeletingStaff(null);
      setTimeout(() => {
        generateMonthlyPayrollForStaff(currentMonth);
      }, 100);
    }
  };

  const filteredStaff = staffList.filter(s => {
    const resolvedRole = resolveStaffRoleType(s);
    if (roleFilter !== 'all') {
      const roles = s.roles && s.roles.length > 0 ? s.roles : [resolvedRole];
      if (!roles.includes(roleFilter as StaffRoleType)) return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = s.fullName.toLowerCase().includes(q);
      const matchCode = s.code.toLowerCase().includes(q);
      const matchRole = s.role.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchRole) return false;
    }
    return true;
  });

  // Modal active roles checks
  const isTeacher = formData.roles.includes('giang_vien');
  const isTutor = formData.roles.includes('tro_giang');
  const isGrader = formData.roles.includes('cham_thi');
  const isAssistant = formData.roles.includes('tro_ly');

  // Filtered checklists strictly applicable to selected roles
  const validModalChecklistIds = getRolesChecklistIds(formData.roles);
  const relevantChecklists = checklistTemplates.filter(t => validModalChecklistIds.includes(t.id));

  return (
    <div className="space-y-6">
      
      {/* Top Filter and Actions Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Role Filter Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 shrink-0">
            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
            <span>Lọc vai trò:</span>
          </span>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-slate-900 focus:outline-none cursor-pointer"
          >
            <option value="all">Tất Cả Vai Trò ({staffList.length})</option>
            {STAFF_ROLE_LIST.map(role => {
              const count = staffList.filter(s => hasStaffRole(s, role.id)).length;
              return (
                <option key={role.id} value={role.id}>
                  {role.title} ({count})
                </option>
              );
            })}
          </select>
        </div>

        {/* Search Input and Add Button */}
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm tên, mã NV..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm Nhân Sự</span>
          </button>
        </div>
      </div>

      {/* Staff Minimalist Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStaff.map(staff => {
          const roles = staff.roles && staff.roles.length > 0 ? staff.roles : [resolveStaffRoleType(staff)];
          const assignedChecklists = getStaffAssignedChecklists(staff, checklistTemplates);
          const rates = getStaffDutyRates(staff);

          const hasTeacher = hasStaffRole(staff, 'giang_vien');
          const hasTutor = hasStaffRole(staff, 'tro_giang');
          const hasGrader = hasStaffRole(staff, 'cham_thi');
          const hasAssistant = hasStaffRole(staff, 'tro_ly');

          // Initials for clean avatar
          const nameParts = staff.fullName.trim().split(' ');
          const initials = nameParts.length >= 2
            ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
            : staff.fullName.slice(0, 2).toUpperCase();

          return (
            <div
              key={staff.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header: Avatar, Name, Code & Role Badges */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-300 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                    {initials}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-bold text-sm text-slate-900 truncate">
                        {staff.fullName}
                      </h4>
                      <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200 shrink-0">
                        {staff.code || 'NV'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1 mt-1">
                      {roles.map(r => {
                        const meta = STAFF_ROLE_DEFINITIONS[r];
                        if (!meta) return null;
                        return (
                          <span
                            key={r}
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border whitespace-nowrap ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}
                          >
                            {meta.shortTitle}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Minimalist Rates & Checklists Row */}
                <div className="bg-slate-50 rounded-lg p-2.5 mb-3 border border-slate-100 text-xs space-y-1.5">
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px]">
                    {hasTeacher && (
                      <span className="text-blue-900 font-medium">
                        Dạy: <strong className="font-mono font-bold">{formatVND(rates.teachingRate)}đ</strong>
                      </span>
                    )}
                    {hasTutor && (
                      <span className="text-sky-900 font-medium">
                        Trợ giảng: <strong className="font-mono font-bold">{formatVND(rates.tutoringRate)}đ</strong>
                        {rates.tutoringTiers && rates.tutoringTiers.length > 0 && (
                          <span className="ml-1 text-[9px] text-sky-700 font-semibold">(+{rates.tutoringTiers.length} lớp)</span>
                        )}
                      </span>
                    )}
                    {hasGrader && (
                      <span className="text-emerald-900 font-medium">
                        Chấm bài: <strong className="font-mono font-bold">{formatVND(rates.gradingRate)}đ</strong>
                        {rates.gradingTiers && rates.gradingTiers.length > 0 && (
                          <span className="ml-1 text-[9px] text-emerald-700 font-semibold">(+{rates.gradingTiers.length} đề)</span>
                        )}
                      </span>
                    )}
                    {hasAssistant && (
                      <span className="text-amber-900 font-medium">
                        Ngày công: <strong className="font-mono font-bold">{formatVND(rates.dayWorkRate)}đ</strong>
                      </span>
                    )}
                  </div>

                  {/* Assigned Checklists */}
                  <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200/60 text-[10px] text-slate-500">
                    <span className="text-slate-400 font-medium">Bảng kiểm:</span>
                    <div className="flex flex-wrap gap-1">
                      {assignedChecklists.map(c => (
                        <span key={c.id} className="font-mono font-bold bg-white text-slate-700 px-1 py-0.2 rounded border border-slate-200">
                          {c.code}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenModal(staff)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                    title="Chỉnh sửa chi tiết thông tin và tùy chỉnh đơn giá"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Chi Tiết & Sửa</span>
                  </button>
                  
                  <button
                    onClick={() => setDeletingStaff(staff)}
                    className="inline-flex items-center gap-1 p-1 text-xs text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                    title="Xóa nhân sự"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => setEvalStaff(staff)}
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-2xs transition-colors cursor-pointer"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-amber-300" />
                  <span>Chấm KPI</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* Add / Edit Staff Comprehensive Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-lg text-slate-900">
                  {editingStaff ? 'Chỉnh Sửa Nhân Sự & Tùy Chỉnh Đơn Giá' : 'Thêm Nhân Sự Mới & Gán Vai Trò'}
                </h3>
                <p className="text-xs text-slate-500">
                  Gán chuẩn vai trò, đơn giá và bảng kiểm tương ứng gọn gàng
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              
              {/* 4 Roles Multi-Select */}
              <div>
                <label className="block text-slate-800 font-bold mb-1.5 text-xs">
                  Chọn vai trò đảm nhiệm (hỗ trợ kiêm nhiệm nhiều vai trò):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {STAFF_ROLE_LIST.map(role => {
                    const isSelected = formData.roles.includes(role.id);
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => handleToggleRole(role.id)}
                        className={`p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'border-slate-900 bg-slate-900 text-white font-bold shadow-xs'
                            : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-bold">{role.shortTitle}</span>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />}
                        </div>
                        <div className="text-[10px] opacity-80 truncate">{role.title}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Full Name & Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-xs">
                    Mã nhân viên:
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                    placeholder="VD: TD-01"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-bold mb-1 text-xs">
                    Họ và tên nhân sự:
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                    placeholder="VD: Nguyễn Đoàn Thanh Ngân"
                  />
                </div>
              </div>

              {/* Title display */}
              <div>
                <label className="block text-slate-700 font-bold mb-1 text-xs">
                  Chức danh hiển thị trên phiếu lương:
                </label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  placeholder="VD: Giảng Viên Sinh Học"
                />
              </div>

              {/* TÙY CHỈNH ĐƠN GIÁ - CHỈ HIỂN THỊ CÁC MỤC THUỘC ROLE ĐÃ CHỌN */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    <DollarSign className="w-4 h-4 text-emerald-600" /> 
                    <span>Đơn Giá Theo Vai Trò Đã Chọn:</span>
                  </span>
                  <span className="text-[11px] text-slate-500">Tùy biến linh hoạt</span>
                </div>

                <div className="space-y-3">
                  
                  {/* 1. Giảng viên -> Buổi dạy học */}
                  {isTeacher && (
                    <div className="bg-white p-3 rounded-lg border border-blue-200 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          <span className="text-xs font-bold text-blue-950">Giảng Viên - Đơn giá buổi dạy học:</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="5000"
                            value={formData.teachingRate}
                            onChange={e => setFormData({ ...formData, teachingRate: Number(e.target.value) })}
                            className="w-28 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-mono font-bold text-right"
                          />
                          <span className="text-[11px] text-slate-600">đ/buổi</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 2. Trợ giảng -> Buổi trợ giảng + Tùy biến đơn giá theo lớp */}
                  {isTutor && (
                    <div className="bg-white p-3 rounded-lg border border-sky-200 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                          <span className="text-xs font-bold text-sky-950">Trợ Giảng - Đơn giá mặc định:</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="5000"
                            value={formData.tutoringRate}
                            onChange={e => setFormData({ ...formData, tutoringRate: Number(e.target.value) })}
                            className="w-28 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-mono font-bold text-right"
                          />
                          <span className="text-[11px] text-slate-600">đ/buổi</span>
                        </div>
                      </div>

                      {/* Custom Class Rate Tiers for Trợ giảng */}
                      <div className="pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-bold text-slate-700">
                            Tùy biến mức giá theo từng lớp (nếu có khác nhau):
                          </span>
                          {!showAddTutoringTier && (
                            <button
                              type="button"
                              onClick={() => setShowAddTutoringTier(true)}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 px-2 py-0.5 rounded cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>+ Thêm mức giá lớp</span>
                            </button>
                          )}
                        </div>

                        {/* Tiers List */}
                        {formData.tutoringTiers && formData.tutoringTiers.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {formData.tutoringTiers.map(tier => (
                              <div
                                key={tier.id}
                                className="inline-flex items-center gap-1.5 px-2 py-1 bg-sky-50 border border-sky-200 text-sky-900 rounded-md text-[11px]"
                              >
                                <span className="font-semibold">{tier.name}:</span>
                                <span className="font-mono font-bold">{formatVND(tier.rate)} đ</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveTutoringTier(tier.id)}
                                  className="text-sky-400 hover:text-rose-600 p-0.5 rounded cursor-pointer"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-400 italic mb-1">
                            Chưa có mức giá lớp riêng (sẽ dùng đơn giá mặc định {formatVND(formData.tutoringRate)}đ/buổi).
                          </p>
                        )}

                        {/* Add Tier Inline Form */}
                        {showAddTutoringTier && (
                          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200 mt-1.5">
                            <input
                              type="text"
                              placeholder="Tên lớp (VD: Lớp Đội Tuyển 10)"
                              value={newTutoringTierName}
                              onChange={e => setNewTutoringTierName(e.target.value)}
                              className="flex-1 px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                            />
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                step="5000"
                                placeholder="80000"
                                value={newTutoringTierRate}
                                onChange={e => setNewTutoringTierRate(Number(e.target.value))}
                                className="w-20 px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono font-bold text-right"
                              />
                              <span className="text-[10px] text-slate-500">đ</span>
                            </div>
                            <button
                              type="button"
                              onClick={handleAddTutoringTier}
                              className="px-2.5 py-1 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded cursor-pointer"
                            >
                              Thêm
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowAddTutoringTier(false)}
                              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 3. Chấm thi -> Số bài chấm + Tùy biến đơn giá theo loại bài/đề thi */}
                  {isGrader && (
                    <div className="bg-white p-3 rounded-lg border border-emerald-200 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span className="text-xs font-bold text-emerald-950">Chấm Thi - Đơn giá mặc định:</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="1000"
                            value={formData.gradingRate}
                            onChange={e => setFormData({ ...formData, gradingRate: Number(e.target.value) })}
                            className="w-28 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-mono font-bold text-right"
                          />
                          <span className="text-[11px] text-slate-600">đ/bài</span>
                        </div>
                      </div>

                      {/* Custom Exam Rate Tiers for Chấm thi */}
                      <div className="pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-bold text-slate-700">
                            Tùy biến mức giá theo từng loại bài/đề thi (nếu có khác nhau):
                          </span>
                          {!showAddGradingTier && (
                            <button
                              type="button"
                              onClick={() => setShowAddGradingTier(true)}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>+ Thêm mức giá đề</span>
                            </button>
                          )}
                        </div>

                        {/* Tiers List */}
                        {formData.gradingTiers && formData.gradingTiers.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {formData.gradingTiers.map(tier => (
                              <div
                                key={tier.id}
                                className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-md text-[11px]"
                              >
                                <span className="font-semibold">{tier.name}:</span>
                                <span className="font-mono font-bold">{formatVND(tier.rate)} đ</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveGradingTier(tier.id)}
                                  className="text-emerald-400 hover:text-rose-600 p-0.5 rounded cursor-pointer"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-400 italic mb-1">
                            Chưa có mức giá bài riêng (sẽ dùng đơn giá mặc định {formatVND(formData.gradingRate)}đ/bài).
                          </p>
                        )}

                        {/* Add Tier Inline Form */}
                        {showAddGradingTier && (
                          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200 mt-1.5">
                            <input
                              type="text"
                              placeholder="Loại đề (VD: Đề thi thử HSGQG)"
                              value={newGradingTierName}
                              onChange={e => setNewGradingTierName(e.target.value)}
                              className="flex-1 px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                            />
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                step="1000"
                                placeholder="15000"
                                value={newGradingTierRate}
                                onChange={e => setNewGradingTierRate(Number(e.target.value))}
                                className="w-20 px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono font-bold text-right"
                              />
                              <span className="text-[10px] text-slate-500">đ</span>
                            </div>
                            <button
                              type="button"
                              onClick={handleAddGradingTier}
                              className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded cursor-pointer"
                            >
                              Thêm
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowAddGradingTier(false)}
                              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 4. Trợ lý -> Ngày công */}
                  {isAssistant && (
                    <div className="bg-white p-3 rounded-lg border border-amber-200 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                          <span className="text-xs font-bold text-amber-950">Trợ Lý - Đơn giá ngày công:</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="5000"
                            value={formData.dayWorkRate}
                            onChange={e => setFormData({ ...formData, dayWorkRate: Number(e.target.value) })}
                            className="w-28 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-mono font-bold text-right"
                          />
                          <span className="text-[11px] text-slate-600">đ/ngày</span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* BẢNG KIỂM KPI ÁP DỤNG - CHỈ HIỂN THỊ CÁC BẢNG KIỂM THUỘC ROLE ĐÃ CHỌN */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-slate-800 font-bold text-xs flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Bảng Kiểm KPI Áp Dụng (Theo Vai Trò):</span>
                  </label>
                  <span className="text-[11px] text-indigo-600 font-medium">
                    {formData.assignedChecklistIds.length} bảng kiểm
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {relevantChecklists.map(t => {
                    const isChecked = formData.assignedChecklistIds.includes(t.id);
                    return (
                      <label
                        key={t.id}
                        className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-950 font-semibold'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleChecklist(t.id)}
                          className="mt-0.5 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-[11px]">{t.code}: {t.title}</div>
                          <div className="text-[10px] text-slate-500 truncate">{t.targetDepartment}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Bank & Phone Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-xs">
                    Ngân hàng:
                  </label>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={e => setFormData({ ...formData, bankName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    placeholder="Techcombank, Vietcombank..."
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-xs">
                    Số tài khoản:
                  </label>
                  <input
                    type="text"
                    value={formData.bankAccount}
                    onChange={e => setFormData({ ...formData, bankAccount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                    placeholder="Số tài khoản nhận lương"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-xs">
                    Số điện thoại:
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    placeholder="0912345678"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  {editingStaff ? 'Lưu Thay Đổi' : 'Thêm Nhân Sự'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="font-bold text-base text-slate-900 mb-1">
                Xác nhận xóa nhân sự?
              </h3>
              <p className="text-xs text-slate-500">
                Bạn có chắc chắn muốn xóa nhân sự <span className="font-bold text-slate-800">{deletingStaff.fullName}</span> ({deletingStaff.code})? Dữ liệu chấm công và phiếu lương liên quan sẽ được gỡ bỏ.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingStaff(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Xác Nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KPI Evaluator Modal */}
      {evalStaff && (
        <KpiEvaluatorModal
          staff={evalStaff}
          onClose={() => setEvalStaff(null)}
        />
      )}
    </div>
  );
};
