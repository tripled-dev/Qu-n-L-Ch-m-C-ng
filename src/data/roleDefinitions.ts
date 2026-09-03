import { StaffRoleMeta, StaffRoleType, Staff, ChecklistTemplate, StaffDutiesRates } from '../types';

export const STAFF_ROLE_DEFINITIONS: Record<StaffRoleType, StaffRoleMeta> = {
  giang_vien: {
    id: 'giang_vien',
    title: 'Giảng Viên',
    shortTitle: 'Giảng viên',
    shortCode: 'GV',
    departmentId: 'day_hoc',
    departmentName: 'Dạy Học',
    division: 'CHUYEN_MON',
    defaultChecklistIds: ['chk_day_hoc'],
    defaultChecklistId: 'chk_day_hoc',
    defaultChecklistName: 'Bảng Kiểm Dạy Học',
    description: 'Phụ trách giảng dạy trực tiếp, chuẩn bị bài giảng trước ≥ 2 ngày, tương tác giải đáp và quản lý video record.',
    defaultBaseRate: 70000,
    badgeBg: 'bg-blue-50 text-blue-700',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200',
  },
  tro_giang: {
    id: 'tro_giang',
    title: 'Trợ Giảng',
    shortTitle: 'Trợ giảng',
    shortCode: 'TG',
    departmentId: 'tro_giang',
    departmentName: 'Trợ Giảng',
    division: 'CHUYEN_MON',
    defaultChecklistIds: ['chk_tro_giang'],
    defaultChecklistId: 'chk_tro_giang',
    defaultChecklistName: 'Bảng Kiểm Trợ Giảng',
    description: 'Chấm BTVN, cập nhật đáp án, duy trì tương tác tích cực trong nhóm lớp và chăm sóc, động viên học sinh.',
    defaultBaseRate: 70000,
    badgeBg: 'bg-sky-50 text-sky-700',
    badgeText: 'text-sky-700',
    badgeBorder: 'border-sky-200',
  },
  cham_thi: {
    id: 'cham_thi',
    title: 'Chấm Thi',
    shortTitle: 'Chấm thi',
    shortCode: 'CT',
    departmentId: 'cham_thi',
    departmentName: 'Chấm Thi',
    division: 'CHUYEN_MON',
    defaultChecklistIds: ['chk_cham_thi'],
    defaultChecklistId: 'chk_cham_thi',
    defaultChecklistName: 'Bảng Kiểm Chấm Thi',
    description: 'Thu nhận bài, chấm thi chuẩn barem, trả bài đúng hạn ≤ 2 ngày và đưa ra nhận xét chi tiết giúp cải thiện điểm.',
    defaultBaseRate: 10000,
    badgeBg: 'bg-emerald-50 text-emerald-700',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
  },
  tro_ly: {
    id: 'tro_ly',
    title: 'Trợ Lý',
    shortTitle: 'Trợ lý',
    shortCode: 'TL',
    departmentId: 'tro_ly',
    departmentName: 'Trợ Lý',
    division: 'HAU_CAN',
    defaultChecklistIds: ['chk_tro_ly'],
    defaultChecklistId: 'chk_tro_ly',
    defaultChecklistName: 'Bảng Kiểm Trợ Lý',
    description: 'Hỗ trợ công tác học vụ, theo dõi ca trực ngày công và hỗ trợ quản lý các lớp học của Đại Diện Lớp.',
    defaultBaseRate: 70000,
    badgeBg: 'bg-amber-50 text-amber-800',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-200',
  },
  soan_de_thi: {
    id: 'soan_de_thi',
    title: 'Soạn Đề Thi',
    shortTitle: 'Soạn đề thi',
    shortCode: 'SĐT',
    departmentId: 'soan_de',
    departmentName: 'Soạn Đề Thi',
    division: 'CHUYEN_MON',
    defaultChecklistIds: ['chk_soan_bai'],
    defaultChecklistId: 'chk_soan_bai',
    defaultChecklistName: 'Bảng Kiểm Soạn Bài',
    description: 'Biên soạn ngân hàng câu hỏi, ma trận đề thi, đề thi thử và đáp án, lời giải chi tiết theo chuẩn chất lượng của lớp học.',
    defaultBaseRate: 150000,
    badgeBg: 'bg-violet-50 text-violet-700',
    badgeText: 'text-violet-700',
    badgeBorder: 'border-violet-200',
  },
};

export const STAFF_ROLE_LIST = Object.values(STAFF_ROLE_DEFINITIONS);

/**
 * Kiểm tra xem nhân sự có đảm nhiệm vai trò cụ thể hay không
 */
export function hasStaffRole(staff: Staff, roleType: StaffRoleType): boolean {
  if (staff.roles && staff.roles.length > 0) {
    return staff.roles.includes(roleType);
  }
  const resolved = resolveStaffRoleType(staff);
  return resolved === roleType;
}

/**
 * Lấy danh sách ID bảng kiểm tương ứng theo danh sách vai trò
 */
export function getRolesChecklistIds(roles: StaffRoleType[]): string[] {
  const checklistIdSet = new Set<string>();
  roles.forEach(role => {
    const meta = STAFF_ROLE_DEFINITIONS[role];
    if (meta?.defaultChecklistIds) {
      meta.defaultChecklistIds.forEach(id => checklistIdSet.add(id));
    }
  });
  return Array.from(checklistIdSet);
}

/**
 * Trích xuất tất cả các vai trò của nhân sự (hỗ trợ kiêm nhiệm nhiều vai trò)
 */
export function getStaffRoles(staff: Staff): StaffRoleMeta[] {
  const roleIds: StaffRoleType[] = [];

  if (staff.roles && staff.roles.length > 0) {
    staff.roles.forEach(r => {
      if (STAFF_ROLE_DEFINITIONS[r] && !roleIds.includes(r)) {
        roleIds.push(r);
      }
    });
  }

  const primaryRole = resolveStaffRoleType(staff);
  if (!roleIds.includes(primaryRole)) {
    roleIds.unshift(primaryRole);
  }

  return roleIds.map(id => STAFF_ROLE_DEFINITIONS[id]);
}

/**
 * Trích xuất đơn giá tùy chỉnh linh hoạt cho từng nhân sự
 */
export function getStaffDutyRates(staff: Staff): StaffDutiesRates {
  const hasTeaching = hasStaffRole(staff, 'giang_vien');
  const hasTutoring = hasStaffRole(staff, 'tro_giang');
  const hasGrading = hasStaffRole(staff, 'cham_thi');
  const hasAssistant = hasStaffRole(staff, 'tro_ly');

  return {
    teachingEnabled: staff.rates?.teachingEnabled ?? hasTeaching,
    teachingRate: staff.rates?.teachingRate ?? (hasTeaching ? staff.baseRate || 70000 : 70000),

    tutoringEnabled: staff.rates?.tutoringEnabled ?? hasTutoring,
    tutoringRate: staff.rates?.tutoringRate ?? staff.defaultPieceworkRates?.troGiangPerSession ?? 70000,
    tutoringTiers: staff.rates?.tutoringTiers ?? [],

    gradingEnabled: staff.rates?.gradingEnabled ?? hasGrading,
    gradingRate: staff.rates?.gradingRate ?? staff.defaultPieceworkRates?.chamBaiPerItem ?? (hasGrading ? 10000 : 10000),
    gradingTiers: staff.rates?.gradingTiers ?? [],

    dayWorkEnabled: staff.rates?.dayWorkEnabled ?? hasAssistant,
    dayWorkRate: staff.rates?.dayWorkRate ?? (hasAssistant ? staff.baseRate || 70000 : 70000),
  };
}

/**
 * Lấy danh sách tất cả các bảng kiểm được giao của nhân sự (chuẩn theo vai trò và công việc đảm nhiệm)
 */
export function getStaffAssignedChecklists(
  staff: Staff,
  checklistTemplates: ChecklistTemplate[]
): ChecklistTemplate[] {
  // 1. Ưu tiên danh sách bảng kiểm được gán cụ thể cho nhân sự
  const customIds = (staff.assignedChecklistIds && staff.assignedChecklistIds.length > 0)
    ? staff.assignedChecklistIds
    : (staff.assignedChecklistId ? [staff.assignedChecklistId] : []);

  if (customIds.length > 0) {
    const valid = customIds
      .map(id => checklistTemplates.find(t => t.id === id || t.code.toLowerCase() === id.toLowerCase()))
      .filter((t): t is ChecklistTemplate => !!t);
    if (valid.length > 0) {
      return valid;
    }
  }

  // 2. Nếu không có gán riêng, lấy theo các vai trò thực tế của nhân sự
  const roles = getStaffRoles(staff).map(r => r.id);
  const allowedChecklistIds = getRolesChecklistIds(roles);

  const matched = allowedChecklistIds
    .map(id => checklistTemplates.find(t => t.id === id))
    .filter((t): t is ChecklistTemplate => !!t);

  if (matched.length > 0) {
    return matched;
  }

  // 3. Fallback: lấy bảng kiểm theo vai trò chính
  const primaryRole = resolveStaffRoleType(staff);
  const primaryMeta = STAFF_ROLE_DEFINITIONS[primaryRole];
  if (primaryMeta?.defaultChecklistId) {
    const fallbackChk = checklistTemplates.find(t => t.id === primaryMeta.defaultChecklistId);
    if (fallbackChk) return [fallbackChk];
  }

  return checklistTemplates.slice(0, 1);
}

/**
 * Lấy Bảng kiểm chính tương ứng của nhân sự
 */
export function getAssignedChecklist(
  staff: Staff,
  checklistTemplates: ChecklistTemplate[]
): ChecklistTemplate | undefined {
  const lists = getStaffAssignedChecklists(staff, checklistTemplates);
  return lists[0];
}

/**
 * Nhận diện roleType chính của nhân sự từ staff data (chỉ 4 role)
 */
export function resolveStaffRoleType(staff: Staff): StaffRoleType {
  if (staff.roleType && STAFF_ROLE_DEFINITIONS[staff.roleType]) return staff.roleType;
  if (staff.roles && staff.roles.length > 0 && STAFF_ROLE_DEFINITIONS[staff.roles[0]]) return staff.roles[0];

  if (staff.departmentId === 'day_hoc') return 'giang_vien';
  if (staff.departmentId === 'tro_giang') return 'tro_giang';
  if (staff.departmentId === 'cham_thi') return 'cham_thi';
  if (staff.departmentId === 'tro_ly') return 'tro_ly';
  if (staff.departmentId === 'soan_de') return 'soan_de_thi';

  if (typeof staff.role === 'string') {
    const rLower = staff.role.toLowerCase();
    if (rLower.includes('soạn đề') || rLower.includes('soan de') || rLower.includes('đề thi') || rLower.includes('de thi')) {
      return 'soan_de_thi';
    }
  }

  return 'giang_vien';
}
