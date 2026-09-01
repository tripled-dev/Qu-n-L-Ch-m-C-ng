import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';
import {
  ChecklistTemplate,
  DepartmentId,
  KpiEvaluation,
  MonthlyPayrollSlip,
  OrgSettings,
  Staff,
  TimesheetEntry,
} from '../types';
import {
  INITIAL_CHECKLIST_TEMPLATES,
  INITIAL_EVALUATIONS,
  INITIAL_ORG_SETTINGS,
  INITIAL_PAYROLL_SLIPS,
  INITIAL_STAFF,
  INITIAL_TIMESHEET_ENTRIES,
} from '../data/initialData';
import { getStaffDutyRates, resolveStaffRoleType, hasStaffRole } from '../data/roleDefinitions';
import { calculateKpiFromScores, getDefaultSalaryMonth } from '../utils/formatters';
import {
  fetchFromGoogleSheet,
  pushToGoogleSheet,
  clearGoogleSheetData,
  FIXED_GOOGLE_APPS_SCRIPT_URL,
} from '../utils/googleSheetsSync';
import { ConfirmDialog } from '../components/Common/ConfirmDialog';
import { ToastNotification } from '../components/Common/ToastNotification';

export interface ConfirmModalOptions {
  title: string;
  message: React.ReactNode | string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  icon?: 'trash' | 'warning' | 'info';
  onConfirm: () => void;
}

interface AppContextType {
  currentMonth: string;
  setCurrentMonth: (m: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  
  staffList: Staff[];
  payrollSlips: MonthlyPayrollSlip[];
  checklistTemplates: ChecklistTemplate[];
  timesheetEntries: TimesheetEntry[];
  evaluations: KpiEvaluation[];
  orgSettings: OrgSettings;

  selectedSlip: MonthlyPayrollSlip | null;
  setSelectedSlip: (slip: MonthlyPayrollSlip | null) => void;
  selectedStaffForEval: Staff | null;
  setSelectedStaffForEval: (staff: Staff | null) => void;

  searchQuery: string;
  setSearchQuery: (q: string) => void;
  departmentFilter: string;
  setDepartmentFilter: (d: string) => void;

  // Google Sheets Sync
  googleSheetUrl: string;
  setGoogleSheetUrl: (url: string) => void;
  isSyncingGoogleSheet: boolean;
  lastSyncTime: string | null;
  syncStatusMessage: { type: 'idle' | 'syncing' | 'success' | 'error'; text: string };
  pullDataFromGoogleSheet: (customUrl?: string) => Promise<{ success: boolean; message: string }>;
  pushDataToGoogleSheet: (customUrl?: string) => Promise<{ success: boolean; message: string }>;
  wipeGoogleSheetAndLocalData: (customUrl?: string) => Promise<{ success: boolean; message: string }>;

  // Global Dialogs & Notifications
  showConfirm: (options: ConfirmModalOptions) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;

  // CRUD Staff
  addStaff: (staff: Omit<Staff, 'id'>) => void;
  updateStaff: (staff: Staff) => void;
  deleteStaff: (id: string) => void;

  // Payroll
  savePayrollSlip: (slip: MonthlyPayrollSlip) => void;
  deletePayrollSlip: (id: string) => void;
  generateMonthlyPayrollForStaff: (month: string) => void;
  updateSlipStatus: (id: string, status: 'draft' | 'approved' | 'paid') => void;

  // Timesheet
  addTimesheetEntry: (entry: Omit<TimesheetEntry, 'id'>) => void;
  updateTimesheetEntry: (entry: TimesheetEntry) => void;
  deleteTimesheetEntry: (id: string) => void;
  bulkUpdateStaffWorkload: (
    staffId: string,
    month: string,
    items: Array<{
      type: TimesheetEntry['type'];
      label: string;
      quantity: number;
      unit: string;
      rate: number;
      date?: string;
      note?: string;
    }>
  ) => void;

  // Evaluation
  saveEvaluation: (evaluation: Omit<KpiEvaluation, 'id'>) => void;
  getStaffEvaluationForMonth: (staffId: string, month: string) => KpiEvaluation | undefined;

  // Checklists & Org
  updateChecklistTemplate: (template: ChecklistTemplate) => void;
  updateOrgSettings: (settings: OrgSettings) => void;
  
  // Backup & Reset
  clearAllSampleData: () => void;
  resetToSampleData: () => void;
  exportBackupJson: () => void;
  importBackupJson: (jsonString: string) => boolean;

  // Summary Metrics
  monthlyStats: {
    totalPayroll: number;
    totalEmployees: number;
    totalSessions: number;
    totalSubmissions: number;
    averageKpi: number;
    approvedSlipsCount: number;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_PREFIX = 'triple_d_payroll_v3_';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Tự động xác định kỳ lương:
  // - Nếu ngày <= 15 (nửa đầu tháng): hiển thị kỳ lương tháng trước
  // - Nếu ngày > 15 (nửa sau tháng): hiển thị kỳ lương tháng hiện tại
  const [currentMonth, setCurrentMonthState] = useState<string>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}current_month`);
    return saved || getDefaultSalaryMonth();
  });

  const setCurrentMonth = (m: string) => {
    setCurrentMonthState(m);
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}current_month`, m);
  };

  const [activeTab, setActiveTab] = useState<string>('payroll');
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  const [selectedSlip, setSelectedSlip] = useState<MonthlyPayrollSlip | null>(null);
  const [selectedStaffForEval, setSelectedStaffForEval] = useState<Staff | null>(null);

  // Global Dialog State
  const [confirmDialogState, setConfirmDialogState] = useState<{
    isOpen: boolean;
    title: string;
    message: React.ReactNode | string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'primary';
    icon?: 'trash' | 'warning' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Global Toast State
  const [toastState, setToastState] = useState<{
    isOpen: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({
    isOpen: false,
    message: '',
    type: 'success',
  });

  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showConfirm = (options: ConfirmModalOptions) => {
    setConfirmDialogState({
      isOpen: true,
      title: options.title,
      message: options.message,
      confirmText: options.confirmText,
      cancelText: options.cancelText,
      variant: options.variant || 'primary',
      icon: options.icon,
      onConfirm: options.onConfirm,
    });
  };

  const closeConfirm = () => {
    setConfirmDialogState((prev) => ({ ...prev, isOpen: false }));
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastState({
      isOpen: true,
      message,
      type,
    });
    toastTimerRef.current = setTimeout(() => {
      setToastState((prev) => ({ ...prev, isOpen: false }));
    }, 3800);
  };

  const closeToast = () => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastState((prev) => ({ ...prev, isOpen: false }));
  };

  // Load from local storage or fallback to initial data
  const [staffList, setStaffList] = useState<Staff[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}staff`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_STAFF;
  });

  const [payrollSlips, setPayrollSlips] = useState<MonthlyPayrollSlip[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}slips`);
    return saved ? JSON.parse(saved) : INITIAL_PAYROLL_SLIPS;
  });

  const [checklistTemplates, setChecklistTemplates] = useState<ChecklistTemplate[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}templates`);
    return saved ? JSON.parse(saved) : INITIAL_CHECKLIST_TEMPLATES;
  });

  const [timesheetEntries, setTimesheetEntries] = useState<TimesheetEntry[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}timesheets`);
    return saved ? JSON.parse(saved) : INITIAL_TIMESHEET_ENTRIES;
  });

  const [evaluations, setEvaluations] = useState<KpiEvaluation[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}evaluations`);
    return saved ? JSON.parse(saved) : INITIAL_EVALUATIONS;
  });

  const [orgSettings, setOrgSettings] = useState<OrgSettings>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}org_settings`);
    return saved ? JSON.parse(saved) : INITIAL_ORG_SETTINGS;
  });

  const [googleSheetUrl, setGoogleSheetUrlState] = useState<string>(() => {
    return localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}gsheet_url`) || '';
  });

  const [isSyncingGoogleSheet, setIsSyncingGoogleSheet] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => {
    return localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}last_sync_time`) || null;
  });
  const [syncStatusMessage, setSyncStatusMessage] = useState<{ type: 'idle' | 'syncing' | 'success' | 'error'; text: string }>({
    type: 'idle',
    text: '',
  });

  const isInitialSyncDoneRef = useRef<boolean>(false);
  const autoPushTimerRef = useRef<NodeJS.Timeout | null>(null);

  const setGoogleSheetUrl = (url: string) => {
    const targetUrl = url.trim();
    setGoogleSheetUrlState(targetUrl);
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}gsheet_url`, targetUrl);
  };

  // State refs to guarantee fresh data inside synchronous/asynchronous calculation closures
  const staffListRef = useRef(staffList);
  staffListRef.current = staffList;

  const payrollSlipsRef = useRef(payrollSlips);
  payrollSlipsRef.current = payrollSlips;

  const checklistTemplatesRef = useRef(checklistTemplates);
  checklistTemplatesRef.current = checklistTemplates;

  const timesheetEntriesRef = useRef(timesheetEntries);
  timesheetEntriesRef.current = timesheetEntries;

  const evaluationsRef = useRef(evaluations);
  evaluationsRef.current = evaluations;

  const orgSettingsRef = useRef(orgSettings);
  orgSettingsRef.current = orgSettings;

  // Auto Generate or Sync Payroll for whole Month strictly with 5 Billable Categories & Ca lẻ synchronization
  const generateMonthlyPayrollForStaff = (month: string) => {
    const curStaff = staffListRef.current;
    const curTimesheets = timesheetEntriesRef.current;
    const curEvals = evaluationsRef.current;
    const curTemplates = checklistTemplatesRef.current;
    const curOrgSettings = orgSettingsRef.current;
    const curSlips = payrollSlipsRef.current;

    const newSlips: MonthlyPayrollSlip[] = [];

    curStaff.forEach(staff => {
      if (!staff.isActive) return;

      const rates = getStaffDutyRates(staff);
      const roleType = resolveStaffRoleType(staff);
      const isAssistant = roleType === 'tro_ly' || staff.departmentId === 'tro_ly' || hasStaffRole(staff, 'tro_ly');

      const existingSlip = curSlips.find(s => s.staffId === staff.id && s.month === month);
      
      // Helper to fetch specific KPI for a target department
      const getKpiForDept = (templateId: string, deptKeyword: string) => {
        const directEval = curEvals.find(e => e.staffId === staff.id && e.month === month && e.templateId === templateId);
        const soanBaiEval = curEvals.find(e => e.staffId === staff.id && e.month === month && e.templateId === 'chk_soan_bai');
        const soanBaiScore = soanBaiEval ? soanBaiEval.calculatedTotalKpi : undefined;

        if (directEval) {
          const template = curTemplates.find(t => t.id === templateId);
          if (template?.linkedTemplateId && (soanBaiScore !== undefined || directEval.linkedSoanBaiScore !== undefined)) {
            const linkedScore = soanBaiScore !== undefined ? soanBaiScore : directEval.linkedSoanBaiScore;
            return calculateKpiFromScores(template, directEval.scores || {}, linkedScore);
          }
          return directEval.calculatedTotalKpi;
        }

        const deptTemplates = curTemplates.filter(t => t.targetDepartment?.toLowerCase().includes(deptKeyword.toLowerCase()) || t.id === templateId);
        const deptEval = curEvals.find(e => e.staffId === staff.id && e.month === month && deptTemplates.some(t => t.id === e.templateId));
        if (deptEval) {
          const template = curTemplates.find(t => t.id === deptEval.templateId);
          if (template?.linkedTemplateId && (soanBaiScore !== undefined || deptEval.linkedSoanBaiScore !== undefined)) {
            const linkedScore = soanBaiScore !== undefined ? soanBaiScore : deptEval.linkedSoanBaiScore;
            return calculateKpiFromScores(template, deptEval.scores || {}, linkedScore);
          }
          return deptEval.calculatedTotalKpi;
        } else if (templateId === 'chk_day_hoc' && soanBaiScore !== undefined) {
          const template = curTemplates.find(t => t.id === 'chk_day_hoc');
          if (template) {
            return calculateKpiFromScores(template, {}, soanBaiScore);
          }
        }

        const staffEvals = curEvals.filter(e => e.staffId === staff.id && e.month === month);
        if (staffEvals.length > 0) {
          return staffEvals[0].calculatedTotalKpi;
        }
        return 100;
      };

      const teachingKpi = getKpiForDept('chk_day_hoc', 'Dạy Học');
      const tutoringKpi = getKpiForDept('chk_tro_giang', 'Trợ Giảng');
      const gradingKpi = getKpiForDept('chk_cham_thi', 'Chấm Thi');
      const dayWorkKpi = getKpiForDept('chk_tro_ly', 'Trợ Lý');

      // Filter staff timesheets for this month
      const staffTimesheets = curTimesheets.filter(
        t => t.staffId === staff.id && t.month === month
      );

      // Helper to group timesheet items by label & rate for exact workload transparency
      const groupLogsByTier = (logs: TimesheetEntry[], defaultUnit: string, fallbackRate: number, specificKpi: number) => {
        const map = new Map<string, { label: string; unit: string; rate: number; quantity: number; amount: number }>();
        logs.forEach(e => {
          const rate = e.rate > 0 ? e.rate : fallbackRate;
          const unit = e.unit || defaultUnit;
          const label = e.label || 'Khối lượng thực hiện';
          const key = `${label}__${rate}`;
          if (!map.has(key)) {
            map.set(key, { label, unit, rate, quantity: 0, amount: 0 });
          }
          const item = map.get(key)!;
          item.quantity += e.quantity;
          item.amount += Math.round(e.quantity * rate * (specificKpi / 100));
        });
        return Array.from(map.values());
      };

      // 1. DẠY HỌC
      const teachingLogs = staffTimesheets.filter(t => t.type === 'teaching_session');
      const teachingTiers = groupLogsByTier(teachingLogs, 'Buổi', rates.teachingRate, teachingKpi);
      const teachingQty = teachingLogs.reduce((sum, t) => sum + t.quantity, 0);
      const teachingGross = teachingLogs.reduce((sum, t) => sum + (t.quantity * (t.rate || rates.teachingRate)), 0);
      const effectiveTeachingRate = teachingQty > 0 ? Math.round(teachingGross / teachingQty) : rates.teachingRate;
      const teachingAmount = Math.round(teachingGross * (teachingKpi / 100));

      // 2. TRỢ GIẢNG
      const tutoringLogs = staffTimesheets.filter(t => t.type === 'tutoring_session');
      const tutoringTiers = groupLogsByTier(tutoringLogs, 'Buổi', rates.tutoringRate, tutoringKpi);
      const tutoringQty = tutoringLogs.reduce((sum, t) => sum + t.quantity, 0);
      const tutoringGross = tutoringLogs.reduce((sum, t) => sum + (t.quantity * (t.rate || rates.tutoringRate)), 0);
      const effectiveTutoringRate = tutoringQty > 0 ? Math.round(tutoringGross / tutoringQty) : rates.tutoringRate;
      const tutoringAmount = Math.round(tutoringGross * (tutoringKpi / 100));

      // 3. CHẤM THI
      const gradingLogs = staffTimesheets.filter(t => t.type === 'grading');
      const gradingTiers = groupLogsByTier(gradingLogs, 'Bài', rates.gradingRate, gradingKpi);
      const gradingQty = gradingLogs.reduce((sum, t) => sum + t.quantity, 0);
      const gradingGross = gradingLogs.reduce((sum, t) => sum + (t.quantity * (t.rate || rates.gradingRate)), 0);
      const effectiveGradingRate = gradingQty > 0 ? Math.round(gradingGross / gradingQty) : rates.gradingRate;
      const gradingAmount = Math.round(gradingGross * (gradingKpi / 100));

      // 4. NGÀY CÔNG (TRỢ LÝ)
      const dayWorkLogs = staffTimesheets.filter(t => t.type === 'day_work');
      const dayWorkTiers = groupLogsByTier(dayWorkLogs, 'Ngày công', rates.dayWorkRate, dayWorkKpi);
      const dayWorkQty = dayWorkLogs.reduce((sum, t) => sum + t.quantity, 0);
      const dayWorkGross = dayWorkLogs.reduce((sum, t) => sum + (t.quantity * (t.rate || rates.dayWorkRate)), 0);
      const effectiveDayWorkRate = dayWorkQty > 0 ? Math.round(dayWorkGross / dayWorkQty) : rates.dayWorkRate;
      const dayWorkAmount = isAssistant ? Math.round(dayWorkGross * (dayWorkKpi / 100)) : 0;

      // 5. THƯỞNG
      const bonusLogs = staffTimesheets.filter(t => t.type === 'bonus');
      const bonusFromTs = bonusLogs.reduce((sum, t) => sum + (t.quantity * t.rate || t.rate || t.quantity), 0);
      const generalBonus = (existingSlip?.generalBonus ?? 0) + bonusFromTs;

      // Primary salary selection aligned strictly with 5 items
      let primaryName = '1. Lương dạy học';
      let daysOrSessions = teachingQty;
      let primaryUnit = 'Buổi';
      let primaryUnitPrice = effectiveTeachingRate;
      let primaryTotal = teachingAmount;
      let primaryKpi = teachingKpi;

      if (isAssistant && teachingQty === 0) {
        primaryName = '1. Lương ngày công (Trợ lý)';
        daysOrSessions = dayWorkQty;
        primaryUnit = 'Ngày công';
        primaryUnitPrice = effectiveDayWorkRate;
        primaryTotal = dayWorkAmount;
        primaryKpi = dayWorkKpi;
      } else if (roleType === 'tro_giang' && teachingQty === 0) {
        primaryName = '1. Lương trợ giảng';
        daysOrSessions = tutoringQty;
        primaryUnit = 'Buổi';
        primaryUnitPrice = effectiveTutoringRate;
        primaryTotal = tutoringAmount;
        primaryKpi = tutoringKpi;
      } else if (roleType === 'cham_thi' && teachingQty === 0 && tutoringQty === 0) {
        primaryName = '1. Lương chấm bài / thi';
        daysOrSessions = gradingQty;
        primaryUnit = 'Bài';
        primaryUnitPrice = effectiveGradingRate;
        primaryTotal = gradingAmount;
        primaryKpi = gradingKpi;
      }

      // Secondary piecework items for remaining billable activities with exact ca lẻ itemization
      const pieceworkItems: MonthlyPayrollSlip['pieceworkItems'] = [];

      // Add teaching if not primary
      if (primaryName !== '1. Lương dạy học' && teachingQty > 0) {
        if (teachingTiers.length > 1) {
          teachingTiers.forEach((tier, i) => {
            pieceworkItems.push({
              id: `pw_tch_${staff.id}_${i}`,
              workName: `Buổi dạy: ${tier.label}`,
              quantity: tier.quantity,
              unit: tier.unit,
              unitPrice: tier.rate,
              kpiPercent: teachingKpi,
              bonus: 0,
              totalAmount: tier.amount,
            });
          });
        } else {
          pieceworkItems.push({
            id: `pw_tch_${staff.id}`,
            workName: 'Buổi dạy học',
            quantity: teachingQty,
            unit: 'Buổi',
            unitPrice: effectiveTeachingRate,
            kpiPercent: teachingKpi,
            bonus: 0,
            totalAmount: teachingAmount,
          });
        }
      }

      // Add tutoring if not primary
      if (primaryName !== '1. Lương trợ giảng' && tutoringQty > 0) {
        if (tutoringTiers.length > 1) {
          tutoringTiers.forEach((tier, i) => {
            pieceworkItems.push({
              id: `pw_tut_${staff.id}_${i}`,
              workName: `Trợ giảng: ${tier.label}`,
              quantity: tier.quantity,
              unit: tier.unit,
              unitPrice: tier.rate,
              kpiPercent: tutoringKpi,
              bonus: 0,
              totalAmount: tier.amount,
            });
          });
        } else {
          pieceworkItems.push({
            id: `pw_tut_${staff.id}`,
            workName: 'Buổi trợ giảng',
            quantity: tutoringQty,
            unit: 'Buổi',
            unitPrice: effectiveTutoringRate,
            kpiPercent: tutoringKpi,
            bonus: 0,
            totalAmount: tutoringAmount,
          });
        }
      }

      // Add grading if not primary
      if (primaryName !== '1. Lương chấm bài / thi' && gradingQty > 0) {
        if (gradingTiers.length > 1) {
          gradingTiers.forEach((tier, i) => {
            pieceworkItems.push({
              id: `pw_grd_${staff.id}_${i}`,
              workName: `Chấm thi: ${tier.label}`,
              quantity: tier.quantity,
              unit: tier.unit,
              unitPrice: tier.rate,
              kpiPercent: gradingKpi,
              bonus: 0,
              totalAmount: tier.amount,
            });
          });
        } else {
          pieceworkItems.push({
            id: `pw_grd_${staff.id}`,
            workName: 'Số bài chấm',
            quantity: gradingQty,
            unit: 'Bài',
            unitPrice: effectiveGradingRate,
            kpiPercent: gradingKpi,
            bonus: 0,
            totalAmount: gradingAmount,
          });
        }
      }

      // Add dayWork if not primary
      if (isAssistant && primaryName !== '1. Lương ngày công (Trợ lý)' && dayWorkQty > 0) {
        pieceworkItems.push({
          id: `pw_day_${staff.id}`,
          workName: 'Ngày công (Trợ lý)',
          quantity: dayWorkQty,
          unit: 'Ngày công',
          unitPrice: effectiveDayWorkRate,
          kpiPercent: dayWorkKpi,
          bonus: 0,
          totalAmount: dayWorkAmount,
        });
      }

      const deductions = existingSlip?.deductions || 0;
      const allowances = existingSlip?.allowances || 0;
      const totalSalary = teachingAmount + tutoringAmount + gradingAmount + dayWorkAmount + generalBonus + allowances - deductions;

      const isTeachingFormat = roleType === 'giang_vien' || (teachingQty > 0 && !isAssistant);

      const slip: MonthlyPayrollSlip = {
        id: existingSlip ? existingSlip.id : `slip_${month.replace('-', '_')}_${staff.id}`,
        month,
        staffId: staff.id,
        staffName: staff.fullName,
        staffCode: staff.code,
        role: staff.role,
        departmentId: staff.departmentId,
        departmentName: staff.departmentName,
        bankAccount: staff.bankAccount,
        bankName: staff.bankName,
        formatType: isTeachingFormat ? 'teaching' : 'assistant_piecework',
        billableBreakdown: {
          teaching: {
            sessions: teachingQty,
            rate: effectiveTeachingRate,
            kpi: teachingKpi,
            amount: teachingAmount,
          },
          tutoring: {
            sessions: tutoringQty,
            rate: effectiveTutoringRate,
            kpi: tutoringKpi,
            amount: tutoringAmount,
          },
          grading: {
            items: gradingQty,
            rate: effectiveGradingRate,
            kpi: gradingKpi,
            amount: gradingAmount,
          },
          dayWork: (isAssistant || dayWorkQty > 0)
            ? {
                days: dayWorkQty,
                rate: effectiveDayWorkRate,
                kpi: dayWorkKpi,
                amount: dayWorkAmount,
              }
            : undefined,
          bonus: {
            amount: generalBonus,
            reason: existingSlip?.bonusReason || 'Thưởng',
          },
        },
        primarySalary: {
          name: primaryName,
          daysOrSessions,
          unitName: primaryUnit,
          unitPrice: primaryUnitPrice,
          kpiPercent: primaryKpi,
          bonus: 0,
          totalAmount: primaryTotal,
        },
        pieceworkItems,
        deductions,
        deductionReason: existingSlip?.deductionReason || '',
        allowances,
        generalBonus,
        bonusReason: existingSlip?.bonusReason || '',
        totalSalary,
        notes: isTeachingFormat
          ? {
              note1: '(1): Đánh giá dựa trên “Bảng Kiểm” tương ứng. KPI là giá trị % chất lượng công việc trong tháng.',
              note2: '(2): Lương nhận thực tế là “Số lượng × Đơn Giá × KPI”',
              note3: '(3): Đơn giá có thể tùy chỉnh linh hoạt theo từng nhân sự & ca dạy',
            }
          : {
              note1: '(1): Đánh giá dựa trên “Bảng Kiểm” tương ứng.',
              note2: '(2): Lương nhận thực tế là “Khối lượng (Ngày/Buổi/Bài) × Đơn Giá × KPI”',
              note3: '(3): Đơn giá tính theo thỏa thuận ban đầu',
            },
        signatures: {
          managerTitle: existingSlip?.signatures?.managerTitle || curOrgSettings.managerTitle,
          managerName: existingSlip?.signatures?.managerName || curOrgSettings.managerName,
          managerSignatureImg: existingSlip?.signatures?.managerSignatureImg !== undefined
            ? existingSlip.signatures.managerSignatureImg
            : curOrgSettings.managerSignatureImg,
          financeTitle: existingSlip?.signatures?.financeTitle || curOrgSettings.financeTitle,
          financeName: existingSlip?.signatures?.financeName || curOrgSettings.financeName,
          financeSignatureImg: existingSlip?.signatures?.financeSignatureImg !== undefined
            ? existingSlip.signatures.financeSignatureImg
            : curOrgSettings.financeSignatureImg,
          approvedDate: existingSlip?.signatures?.approvedDate || `${month}-28`,
        },
        status: existingSlip?.status || 'draft',
        updatedAt: new Date().toISOString(),
      };

      newSlips.push(slip);
    });

    setPayrollSlips(prev => {
      const others = prev.filter(s => s.month !== month);
      const updated = [...others, ...newSlips];
      payrollSlipsRef.current = updated;
      return updated;
    });
  };

  // Auto-sync payroll slips whenever evaluations, timesheets, staff, templates or settings change
  useEffect(() => {
    const months = new Set<string>();
    months.add(currentMonth);
    timesheetEntries.forEach(t => { if (t.month) months.add(t.month); });
    evaluations.forEach(e => { if (e.month) months.add(e.month); });

    months.forEach(m => {
      generateMonthlyPayrollForStaff(m);
    });
  }, [evaluations, timesheetEntries, currentMonth, staffList, checklistTemplates, orgSettings]);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}staff`, JSON.stringify(staffList));
  }, [staffList]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}slips`, JSON.stringify(payrollSlips));
  }, [payrollSlips]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}templates`, JSON.stringify(checklistTemplates));
  }, [checklistTemplates]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}timesheets`, JSON.stringify(timesheetEntries));
  }, [timesheetEntries]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}evaluations`, JSON.stringify(evaluations));
  }, [evaluations]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}org_settings`, JSON.stringify(orgSettings));
  }, [orgSettings]);

  // 1. Auto-fetch data from Google Sheet on initial mount if URL is configured
  useEffect(() => {
    let isMounted = true;
    const initialSync = async () => {
      const url = (localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}gsheet_url`) || googleSheetUrl).trim();
      if (!url || !url.startsWith('http')) {
        isInitialSyncDoneRef.current = true;
        return;
      }
      try {
        const result = await fetchFromGoogleSheet(url);
        if (isMounted && result.success && result.data) {
          if (result.data.staffList && Array.isArray(result.data.staffList) && result.data.staffList.length > 0) {
            setStaffList(result.data.staffList);
            staffListRef.current = result.data.staffList;
          }
          if (result.data.timesheetEntries && Array.isArray(result.data.timesheetEntries) && result.data.timesheetEntries.length > 0) {
            setTimesheetEntries(result.data.timesheetEntries);
            timesheetEntriesRef.current = result.data.timesheetEntries;
          }
          if (result.data.evaluations && Array.isArray(result.data.evaluations) && result.data.evaluations.length > 0) {
            setEvaluations(result.data.evaluations);
            evaluationsRef.current = result.data.evaluations;
          }
          if (result.data.orgSettings && typeof result.data.orgSettings === 'object') {
            setOrgSettings(result.data.orgSettings);
            orgSettingsRef.current = result.data.orgSettings;
          }
          if (result.data.checklistTemplates && Array.isArray(result.data.checklistTemplates) && result.data.checklistTemplates.length > 0) {
            setChecklistTemplates(result.data.checklistTemplates);
            checklistTemplatesRef.current = result.data.checklistTemplates;
          }
          const now = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          setLastSyncTime(now);
          localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}last_sync_time`, now);
          setSyncStatusMessage({ type: 'success', text: `Tự động đồng bộ từ Google Sheet lúc ${now}` });
        }
      } catch (e) {
        console.warn('Initial Google Sheet fetch skipped or failed:', e);
      } finally {
        isInitialSyncDoneRef.current = true;
      }
    };

    initialSync();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Auto-push all modifications directly to Google Apps Script if URL is configured (debounced 1.5s)
  useEffect(() => {
    if (!isInitialSyncDoneRef.current) return;
    const url = (localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}gsheet_url`) || googleSheetUrl).trim();
    if (!url || !url.startsWith('http')) return;

    if (autoPushTimerRef.current) {
      clearTimeout(autoPushTimerRef.current);
    }

    autoPushTimerRef.current = setTimeout(async () => {
      try {
        const payload = {
          staffList: staffListRef.current,
          timesheetEntries: timesheetEntriesRef.current,
          evaluations: evaluationsRef.current,
          payrollSlips: payrollSlipsRef.current,
          orgSettings: orgSettingsRef.current,
          checklistTemplates: checklistTemplatesRef.current,
          lastUpdated: new Date().toISOString(),
        };

        setSyncStatusMessage({ type: 'syncing', text: 'Đang tự động lưu lên Google Sheet...' });
        const result = await pushToGoogleSheet(url, payload);
        if (result.success) {
          const now = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          setLastSyncTime(now);
          localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}last_sync_time`, now);
          setSyncStatusMessage({ type: 'success', text: `Tự động ghi nhận lên Google Sheet lúc ${now}` });
        } else {
          setSyncStatusMessage({ type: 'error', text: result.message || 'Lỗi tự động lưu lên Google Sheet' });
        }
      } catch (err: any) {
        console.error('Auto sync to Google Sheet error:', err);
        setSyncStatusMessage({ type: 'error', text: 'Không thể kết nối Google Sheet' });
      }
    }, 1500);

    return () => {
      if (autoPushTimerRef.current) {
        clearTimeout(autoPushTimerRef.current);
      }
    };
  }, [staffList, timesheetEntries, evaluations, payrollSlips, orgSettings, checklistTemplates]);

  // Staff CRUD
  const addStaff = (staffData: Omit<Staff, 'id'>) => {
    const newStaff: Staff = {
      ...staffData,
      id: `staff_${Date.now()}`,
    };
    const nextList = [...staffListRef.current, newStaff];
    staffListRef.current = nextList;
    setStaffList(nextList);
    generateMonthlyPayrollForStaff(currentMonth);
  };

  const updateStaff = (updatedStaff: Staff) => {
    const nextList = staffListRef.current.map(s => (s.id === updatedStaff.id ? updatedStaff : s));
    staffListRef.current = nextList;
    setStaffList(nextList);

    setPayrollSlips(prev => {
      const updated = prev.map(slip =>
        slip.staffId === updatedStaff.id
          ? {
              ...slip,
              staffName: updatedStaff.fullName,
              staffCode: updatedStaff.code,
              role: updatedStaff.role,
              departmentName: updatedStaff.departmentName,
              bankAccount: updatedStaff.bankAccount,
              bankName: updatedStaff.bankName,
            }
          : slip
      );
      payrollSlipsRef.current = updated;
      return updated;
    });
    generateMonthlyPayrollForStaff(currentMonth);
  };

  const deleteStaff = (id: string) => {
    const nextList = staffListRef.current.filter(s => s.id !== id);
    staffListRef.current = nextList;
    setStaffList(nextList);

    setPayrollSlips(prev => {
      const updated = prev.filter(s => s.staffId !== id);
      payrollSlipsRef.current = updated;
      return updated;
    });
    const nextTs = timesheetEntriesRef.current.filter(t => t.staffId !== id);
    timesheetEntriesRef.current = nextTs;
    setTimesheetEntries(nextTs);

    const nextEvals = evaluationsRef.current.filter(e => e.staffId !== id);
    evaluationsRef.current = nextEvals;
    setEvaluations(nextEvals);
  };

  // Timesheet
  const addTimesheetEntry = (entryData: Omit<TimesheetEntry, 'id'>) => {
    const newEntry: TimesheetEntry = {
      ...entryData,
      id: `ts_${Date.now()}`,
    };
    const nextTs = [...timesheetEntriesRef.current, newEntry];
    timesheetEntriesRef.current = nextTs;
    setTimesheetEntries(nextTs);
    generateMonthlyPayrollForStaff(entryData.month);
  };

  const updateTimesheetEntry = (entry: TimesheetEntry) => {
    const nextTs = timesheetEntriesRef.current.map(e => (e.id === entry.id ? entry : e));
    timesheetEntriesRef.current = nextTs;
    setTimesheetEntries(nextTs);
    generateMonthlyPayrollForStaff(entry.month);
  };

  const deleteTimesheetEntry = (id: string) => {
    const entryToDelete = timesheetEntriesRef.current.find(e => e.id === id);
    const nextTs = timesheetEntriesRef.current.filter(e => e.id !== id);
    timesheetEntriesRef.current = nextTs;
    setTimesheetEntries(nextTs);
    if (entryToDelete) {
      generateMonthlyPayrollForStaff(entryToDelete.month);
    }
  };

  // Evaluation
  const saveEvaluation = (evalData: Omit<KpiEvaluation, 'id'>) => {
    const curEvals = evaluationsRef.current;
    const existingIndex = curEvals.findIndex(
      e => e.staffId === evalData.staffId && e.month === evalData.month && e.templateId === evalData.templateId
    );

    let updatedList: KpiEvaluation[];
    if (existingIndex >= 0) {
      const updated = { ...curEvals[existingIndex], ...evalData };
      updatedList = [...curEvals];
      updatedList[existingIndex] = updated;
    } else {
      const newEval: KpiEvaluation = {
        ...evalData,
        id: `eval_${Date.now()}`,
      };
      updatedList = [...curEvals, newEval];
    }
    evaluationsRef.current = updatedList;
    setEvaluations(updatedList);
    generateMonthlyPayrollForStaff(evalData.month);
  };

  const getStaffEvaluationForMonth = (staffId: string, month: string, templateId?: string) => {
    if (templateId) {
      return evaluations.find(e => e.staffId === staffId && e.month === month && e.templateId === templateId);
    }
    return evaluations.find(e => e.staffId === staffId && e.month === month);
  };

  // Payroll Slips
  const savePayrollSlip = (slip: MonthlyPayrollSlip) => {
    setPayrollSlips(prev => {
      const idx = prev.findIndex(s => s.id === slip.id);
      let updated: MonthlyPayrollSlip[];
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = slip;
      } else {
        updated = [...prev, slip];
      }
      payrollSlipsRef.current = updated;
      return updated;
    });
  };

  const deletePayrollSlip = (id: string) => {
    setPayrollSlips(prev => {
      const updated = prev.filter(s => s.id !== id);
      payrollSlipsRef.current = updated;
      return updated;
    });
  };

  const updateSlipStatus = (id: string, status: 'draft' | 'approved' | 'paid') => {
    setPayrollSlips(prev => {
      const updated = prev.map(s => (s.id === id ? { ...s, status, updatedAt: new Date().toISOString() } : s));
      payrollSlipsRef.current = updated;
      return updated;
    });
  };

  // Bulk update workload for a staff member in a specific month
  const bulkUpdateStaffWorkload = (
    staffId: string,
    month: string,
    items: Array<{
      type: TimesheetEntry['type'];
      label: string;
      quantity: number;
      unit: string;
      rate: number;
      date?: string;
      note?: string;
    }>
  ) => {
    // Remove existing entries of matching types
    const newTypes = new Set(items.map(i => i.type));
    const filtered = timesheetEntriesRef.current.filter(
      entry => !(entry.staffId === staffId && entry.month === month && newTypes.has(entry.type))
    );

    const createdEntries: TimesheetEntry[] = items
      .filter(item => item.quantity > 0)
      .map((item, idx) => ({
        id: `ts_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
        staffId,
        month,
        date: item.date || `${month}-15`,
        type: item.type,
        label: item.label,
        quantity: item.quantity,
        unit: item.unit,
        rate: item.rate,
        kpiScore: 100,
        note: item.note,
      }));

    const nextTs = [...filtered, ...createdEntries];
    timesheetEntriesRef.current = nextTs;
    setTimesheetEntries(nextTs);
    generateMonthlyPayrollForStaff(month);
  };

  const updateChecklistTemplate = (template: ChecklistTemplate) => {
    setChecklistTemplates(prev => prev.map(t => (t.id === template.id ? template : t)));
  };

  const updateOrgSettings = (settings: OrgSettings) => {
    setOrgSettings(settings);
  };

  // Google Sheets Pull & Push implementations
  const pullDataFromGoogleSheet = async (customUrl?: string): Promise<{ success: boolean; message: string }> => {
    const url = (customUrl || googleSheetUrl).trim();
    if (!url) {
      const err = 'Chưa cấu hình URL Google Apps Script. Vui lòng nhập URL triển khai ứng dụng web.';
      setSyncStatusMessage({ type: 'error', text: err });
      return { success: false, message: err };
    }

    setIsSyncingGoogleSheet(true);
    setSyncStatusMessage({ type: 'syncing', text: 'Đang kết nối và tải dữ liệu từ Google Sheet...' });

    try {
      const result = await fetchFromGoogleSheet(url);
      if (result.success && result.data) {
        if (result.data.staffList && Array.isArray(result.data.staffList)) {
          setStaffList(result.data.staffList);
          staffListRef.current = result.data.staffList;
        }
        if (result.data.timesheetEntries && Array.isArray(result.data.timesheetEntries)) {
          setTimesheetEntries(result.data.timesheetEntries);
          timesheetEntriesRef.current = result.data.timesheetEntries;
        }
        if (result.data.evaluations && Array.isArray(result.data.evaluations)) {
          setEvaluations(result.data.evaluations);
          evaluationsRef.current = result.data.evaluations;
        }
        if (result.data.orgSettings && typeof result.data.orgSettings === 'object') {
          setOrgSettings(result.data.orgSettings);
          orgSettingsRef.current = result.data.orgSettings;
        }
        if (result.data.checklistTemplates && Array.isArray(result.data.checklistTemplates) && result.data.checklistTemplates.length > 0) {
          setChecklistTemplates(result.data.checklistTemplates);
          checklistTemplatesRef.current = result.data.checklistTemplates;
        }

        // Recalculate payroll for current month
        generateMonthlyPayrollForStaff(currentMonth);

        const now = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastSyncTime(now);
        localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}last_sync_time`, now);
        setSyncStatusMessage({ type: 'success', text: `Đồng bộ thành công lúc ${now}` });
        return { success: true, message: result.message };
      } else {
        setSyncStatusMessage({ type: 'error', text: result.message });
        return { success: false, message: result.message };
      }
    } catch (err: any) {
      const msg = err.message || 'Lỗi không xác định khi tải từ Google Sheet';
      setSyncStatusMessage({ type: 'error', text: msg });
      return { success: false, message: msg };
    } finally {
      setIsSyncingGoogleSheet(false);
    }
  };

  const pushDataToGoogleSheet = async (customUrl?: string): Promise<{ success: boolean; message: string }> => {
    const url = (customUrl || googleSheetUrl).trim();
    if (!url) {
      const err = 'Chưa cấu hình URL Google Apps Script. Vui lòng nhập URL triển khai ứng dụng web.';
      setSyncStatusMessage({ type: 'error', text: err });
      return { success: false, message: err };
    }

    setIsSyncingGoogleSheet(true);
    setSyncStatusMessage({ type: 'syncing', text: 'Đang đẩy toàn bộ dữ liệu lên Google Sheet...' });

    try {
      const payload = {
        staffList: staffListRef.current,
        timesheetEntries: timesheetEntriesRef.current,
        evaluations: evaluationsRef.current,
        payrollSlips: payrollSlipsRef.current,
        orgSettings: orgSettingsRef.current,
        checklistTemplates: checklistTemplatesRef.current,
        lastUpdated: new Date().toISOString(),
      };

      const result = await pushToGoogleSheet(url, payload);
      if (result.success) {
        const now = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastSyncTime(now);
        localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}last_sync_time`, now);
        setSyncStatusMessage({ type: 'success', text: `Đã lưu lên Google Sheet lúc ${now}` });
        return { success: true, message: result.message };
      } else {
        setSyncStatusMessage({ type: 'error', text: result.message });
        return { success: false, message: result.message };
      }
    } catch (err: any) {
      const msg = err.message || 'Lỗi khi lưu lên Google Sheet';
      setSyncStatusMessage({ type: 'error', text: msg });
      return { success: false, message: msg };
    } finally {
      setIsSyncingGoogleSheet(false);
    }
  };

  // Wipe all data from Google Sheet and clear local state
  const wipeGoogleSheetAndLocalData = async (customUrl?: string): Promise<{ success: boolean; message: string }> => {
    const url = (customUrl || googleSheetUrl).trim();
    setIsSyncingGoogleSheet(true);
    setSyncStatusMessage({ type: 'syncing', text: 'Đang gửi yêu cầu xóa sạch toàn bộ dữ liệu trên Google Sheet...' });

    try {
      // 1. Clear local state and localStorage first
      setStaffList([]);
      setTimesheetEntries([]);
      setEvaluations([]);
      setPayrollSlips([]);
      staffListRef.current = [];
      timesheetEntriesRef.current = [];
      evaluationsRef.current = [];
      payrollSlipsRef.current = [];
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}staff`, JSON.stringify([]));
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}timesheets`, JSON.stringify([]));
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}evaluations`, JSON.stringify([]));
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}slips`, JSON.stringify([]));

      // 2. Clear data on Google Sheet if URL exists
      if (url) {
        const result = await clearGoogleSheetData(url);
        const now = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastSyncTime(now);
        localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}last_sync_time`, now);
        setSyncStatusMessage({ type: 'idle', text: 'Đã xóa toàn bộ dữ liệu trên Google Sheet và ứng dụng web.' });
        return result;
      }

      setSyncStatusMessage({ type: 'idle', text: 'Đã xóa toàn bộ dữ liệu trên ứng dụng web.' });
      return { success: true, message: 'Đã làm sạch toàn bộ dữ liệu thành công!' };
    } catch (err: any) {
      const msg = err.message || 'Lỗi khi xóa dữ liệu trên Google Sheet';
      setSyncStatusMessage({ type: 'error', text: msg });
      return { success: false, message: msg };
    } finally {
      setIsSyncingGoogleSheet(false);
    }
  };

  // Clear all sample data to start fresh or receive from Google Sheets
  const clearAllSampleData = () => {
    setStaffList([]);
    setTimesheetEntries([]);
    setEvaluations([]);
    setPayrollSlips([]);
    staffListRef.current = [];
    timesheetEntriesRef.current = [];
    evaluationsRef.current = [];
    payrollSlipsRef.current = [];
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}staff`, JSON.stringify([]));
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}timesheets`, JSON.stringify([]));
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}evaluations`, JSON.stringify([]));
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}slips`, JSON.stringify([]));
    setSyncStatusMessage({ type: 'idle', text: 'Đã làm sạch dữ liệu mẫu. Sẵn sàng nhập dữ liệu từ Google Sheet.' });
  };

  const resetToSampleData = () => {
    localStorage.clear();
    setStaffList(INITIAL_STAFF);
    setPayrollSlips(INITIAL_PAYROLL_SLIPS);
    setChecklistTemplates(INITIAL_CHECKLIST_TEMPLATES);
    setTimesheetEntries(INITIAL_TIMESHEET_ENTRIES);
    setEvaluations(INITIAL_EVALUATIONS);
    setOrgSettings(INITIAL_ORG_SETTINGS);
    setCurrentMonth('2026-07');
    setSyncStatusMessage({ type: 'idle', text: 'Đã khôi phục dữ liệu mẫu mặc định.' });
  };

  const exportBackupJson = () => {
    const data = {
      staffList,
      payrollSlips,
      checklistTemplates,
      timesheetEntries,
      evaluations,
      orgSettings,
      exportedAt: new Date().toISOString(),
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `TripleD_Payroll_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const importBackupJson = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.staffList) setStaffList(parsed.staffList);
      if (parsed.payrollSlips) setPayrollSlips(parsed.payrollSlips);
      if (parsed.checklistTemplates) setChecklistTemplates(parsed.checklistTemplates);
      if (parsed.timesheetEntries) setTimesheetEntries(parsed.timesheetEntries);
      if (parsed.evaluations) setEvaluations(parsed.evaluations);
      if (parsed.orgSettings) setOrgSettings(parsed.orgSettings);
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  };

  // Derived Monthly statistics
  const monthlyStats = useMemo(() => {
    const slipsForMonth = payrollSlips.filter(s => s.month === currentMonth);
    const totalPayroll = slipsForMonth.reduce((sum, s) => sum + s.totalSalary, 0);
    const totalEmployees = slipsForMonth.length;
    const approvedSlipsCount = slipsForMonth.filter(s => s.status === 'approved' || s.status === 'paid').length;

    let totalSessions = 0;
    let totalSubmissions = 0;
    let totalKpiSum = 0;

    slipsForMonth.forEach(slip => {
      if (slip.formatType === 'teaching') {
        totalSessions += slip.primarySalary.daysOrSessions;
      }
      slip.pieceworkItems.forEach(pw => {
        if (pw.unit === 'Buổi') totalSessions += pw.quantity;
        if (pw.unit === 'Bài') totalSubmissions += pw.quantity;
      });
      totalKpiSum += slip.primarySalary.kpiPercent;
    });

    const averageKpi = totalEmployees > 0 ? Math.round((totalKpiSum / totalEmployees) * 10) / 10 : 100;

    return {
      totalPayroll,
      totalEmployees,
      totalSessions,
      totalSubmissions,
      averageKpi,
      approvedSlipsCount,
    };
  }, [payrollSlips, currentMonth]);

  return (
    <AppContext.Provider
      value={{
        currentMonth,
        setCurrentMonth,
        activeTab,
        setActiveTab,
        staffList,
        payrollSlips,
        checklistTemplates,
        timesheetEntries,
        evaluations,
        orgSettings,
        selectedSlip,
        setSelectedSlip,
        selectedStaffForEval,
        setSelectedStaffForEval,
        searchQuery,
        setSearchQuery,
        departmentFilter,
        setDepartmentFilter,
        googleSheetUrl,
        setGoogleSheetUrl,
        isSyncingGoogleSheet,
        lastSyncTime,
        syncStatusMessage,
        pullDataFromGoogleSheet,
        pushDataToGoogleSheet,
        wipeGoogleSheetAndLocalData,
        addStaff,
        updateStaff,
        deleteStaff,
        savePayrollSlip,
        deletePayrollSlip,
        generateMonthlyPayrollForStaff,
        updateSlipStatus,
        addTimesheetEntry,
        updateTimesheetEntry,
        deleteTimesheetEntry,
        bulkUpdateStaffWorkload,
        saveEvaluation,
        getStaffEvaluationForMonth,
        updateChecklistTemplate,
        updateOrgSettings,
        showConfirm,
        showToast,
        clearAllSampleData,
        resetToSampleData,
        exportBackupJson,
        importBackupJson,
        monthlyStats,
      }}
    >
      {children}
      <ConfirmDialog
        isOpen={confirmDialogState.isOpen}
        title={confirmDialogState.title}
        message={confirmDialogState.message}
        confirmText={confirmDialogState.confirmText}
        cancelText={confirmDialogState.cancelText}
        variant={confirmDialogState.variant}
        icon={confirmDialogState.icon}
        onConfirm={confirmDialogState.onConfirm}
        onCancel={closeConfirm}
      />
      <ToastNotification
        isOpen={toastState.isOpen}
        message={toastState.message}
        type={toastState.type}
        onClose={closeToast}
      />
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
