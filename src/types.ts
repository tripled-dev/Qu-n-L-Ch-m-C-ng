export type DepartmentId = 'day_hoc' | 'tro_giang' | 'cham_thi' | 'tro_ly' | 'truyen_thong' | 'khac';

export type DivisionType = 'CHUYEN_MON' | 'HAU_CAN';

export type StaffRoleType = 
  | 'giang_vien'    // Giảng viên chuyên môn đứng lớp
  | 'tro_giang'     // Trợ giảng học vụ & quản lý nhóm lớp
  | 'cham_thi'      // Chuyên viên chấm thi & khảo thí
  | 'tro_ly';       // Trợ lý học vụ & hỗ trợ vận hành

export type BillableWorkType = 'teaching' | 'tutoring' | 'grading' | 'day_work' | 'bonus';

export interface CustomRateTier {
  id: string;
  name: string; // Tên lớp (VD: Lớp Đội tuyển HSG 10) hoặc Tên bài thi (VD: Đề thi thử số 1)
  rate: number; // Đơn giá VNĐ
}

export interface StaffDutiesRates {
  // 1. Buổi dạy học (Giảng viên)
  teachingEnabled?: boolean;
  teachingRate?: number; // Đơn giá mỗi buổi dạy (VNĐ)

  // 2. Buổi trợ giảng (Trợ giảng)
  tutoringEnabled?: boolean;
  tutoringRate?: number; // Đơn giá mặc định mỗi buổi trợ giảng (VNĐ)
  tutoringTiers?: CustomRateTier[]; // Tùy biến đơn giá theo từng lớp/nhóm

  // 3. Số bài chấm (Chấm thi)
  gradingEnabled?: boolean;
  gradingRate?: number; // Đơn giá mặc định mỗi bài chấm (VNĐ)
  gradingTiers?: CustomRateTier[]; // Tùy biến đơn giá theo từng loại bài/đề thi

  // 4. Ngày công (Trợ lý)
  dayWorkEnabled?: boolean;
  dayWorkRate?: number; // Đơn giá mỗi ngày công (VNĐ)
}

export interface StaffRoleMeta {
  id: StaffRoleType;
  title: string;
  shortTitle: string; // e.g. "Giảng viên", "Trợ giảng", "Chấm thi", "Trợ lý"
  shortCode: string;  // e.g. "GV", "TG", "CT", "TL"
  departmentId: DepartmentId;
  departmentName: string;
  division: DivisionType;
  defaultChecklistIds: string[]; // Danh sách bảng kiểm chuẩn theo role
  defaultChecklistId: string;
  defaultChecklistName: string;
  description: string;
  defaultBaseRate: number;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export interface Staff {
  id: string;
  code: string; // Mã NV (e.g. TD-0507)
  fullName: string;
  role: string; // Chức danh hiển thị
  roleType?: StaffRoleType;
  roles?: StaffRoleType[]; // Hỗ trợ kiêm nhiệm nhiều vai trò (GV, TG, CT, TL)
  assignedChecklistId?: string; // Bảng kiểm chính
  assignedChecklistIds?: string[]; // Danh sách các bảng kiểm đảm nhiệm nếu làm nhiều việc
  departmentId: DepartmentId;
  departmentName: string;
  division: DivisionType;
  bankAccount: string; // Số TKNH
  bankName: string;
  bankOwner?: string;
  phone?: string;
  email?: string;
  salaryModel?: 'session' | 'daily_piecework' | 'piecework_only' | 'fixed';
  baseRate: number; // Đơn giá chính hoặc lương ngày gốc
  
  // Tùy chỉnh đơn giá riêng cho từng loại công việc
  rates?: StaffDutiesRates;
  defaultPieceworkRates?: {
    troGiangPerSession?: number;
    chamBaiPerItem?: number;
    soanBaiPerItem?: number;
  };
  isActive: boolean;
}

export interface ChecklistCriterion {
  id: string;
  title: string;
  details: string[];
  weight: number; // Trọng số con (ví dụ 10 = 10%)
}

export interface ChecklistGroup {
  id: string;
  stt: number;
  groupName: string;
  totalWeight: number; // Trọng số nhóm (ví dụ 35%)
  criteria: ChecklistCriterion[];
}

export interface ChecklistTemplate {
  id: string;
  code: string;
  title: string;
  targetDepartment: string;
  description?: string;
  groups: ChecklistGroup[];
  linkedTemplateId?: string;
}

export interface CriterionScore {
  criterionId: string;
  scorePercent: number; // 0 to 100%
  note?: string;
}

export interface KpiEvaluation {
  id: string;
  staffId: string;
  month: string; // YYYY-MM (e.g. 2026-07)
  templateId: string;
  evaluationDate: string;
  evaluatorName: string;
  scores: Record<string, number>; // criterionId -> percentage (0-100)
  calculatedTotalKpi: number; // 0 - 100%
  notes?: string;
  linkedSoanBaiScore?: number; // Score from linked soan bai checklist
  checklistScores?: Record<string, number>; // templateId -> kpiScore (if multiple checklists)
}

export interface TimesheetEntry {
  id: string;
  staffId: string;
  month: string; // YYYY-MM
  date: string; // YYYY-MM-DD
  type: 'teaching_session' | 'tutoring_session' | 'grading' | 'day_work' | 'bonus';
  label: string;
  quantity: number; // Số buổi / số ngày / số bài / số tiền (nếu thưởng)
  unit: string; // Buổi, Ngày, Bài, VNĐ
  rate: number; // Đơn giá
  kpiScore: number; // 100 (%)
  note?: string;
}

export interface BillableWorkItem {
  id: string;
  category: 'teaching' | 'tutoring' | 'grading' | 'day_work';
  title: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  kpiPercent: number;
  totalAmount: number;
  note?: string;
}

export interface PieceworkSalaryItem {
  id: string;
  workName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  kpiPercent: number;
  bonus: number;
  totalAmount: number;
  note?: string;
}

export interface PrimarySalaryItem {
  name: string;
  daysOrSessions: number;
  unitName: string;
  unitPrice: number;
  kpiPercent: number;
  bonus: number;
  totalAmount: number;
}

export interface MonthlyPayrollSlip {
  id: string;
  month: string; // YYYY-MM
  staffId: string;
  staffName: string;
  staffCode: string;
  role: string;
  departmentName: string;
  departmentId: DepartmentId;
  bankAccount: string;
  bankName: string;
  
  formatType: 'teaching' | 'assistant_piecework' | 'custom';

  // 5 Mục tính lương chuẩn
  billableBreakdown?: {
    teaching?: { sessions: number; rate: number; kpi: number; amount: number };
    tutoring?: { sessions: number; rate: number; kpi: number; amount: number };
    grading?: { items: number; rate: number; kpi: number; amount: number };
    dayWork?: { days: number; rate: number; kpi: number; amount: number };
    bonus?: { amount: number; reason?: string };
  };

  // Primary salary block
  primarySalary: PrimarySalaryItem;

  // Secondary Piecework block
  pieceworkItems: PieceworkSalaryItem[];

  // Custom adjustments
  deductions: number;
  deductionReason?: string;
  allowances: number;
  generalBonus: number; // Mục 5: Thưởng
  bonusReason?: string;
  
  totalSalary: number; // Tổng cộng thực nhận

  // Notes
  notes: {
    note1?: string;
    note2?: string;
    note3?: string;
    customNote?: string;
  };

  // Signatures
  signatures: {
    managerTitle: string;
    managerName: string;
    managerSignatureImg?: string;
    financeTitle: string;
    financeName: string;
    financeSignatureImg?: string;
    approvedDate?: string;
  };

  status: 'draft' | 'approved' | 'paid';
  updatedAt: string;
}

export interface OrgSettings {
  orgName: string; // TRIPLE D ÔN THI HSGQG MÔN SINH HỌC
  location: string; // Hà Nội
  managerTitle: string; // ĐIỀU HÀNH TRIPLE D
  managerName: string; // Đặng Tuấn Anh
  managerSignatureImg?: string;
  financeTitle: string; // BAN KINH TẾ & VẬN HÀNH
  financeName: string; // Trần Hạnh Dung
  financeSignatureImg?: string;
  showSignatures: boolean;
  currencySymbol: string; // đ / VNĐ
  defaultWorkingDaysInMonth: number; // 26
}
