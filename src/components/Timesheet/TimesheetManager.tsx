import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Staff, TimesheetEntry } from '../../types';
import { 
  STAFF_ROLE_DEFINITIONS, 
  STAFF_ROLE_LIST, 
  getStaffAssignedChecklists, 
  getStaffDutyRates, 
  resolveStaffRoleType,
  hasStaffRole
} from '../../data/roleDefinitions';
import { formatVND, formatMonthDisplay, calculateKpiFromScores } from '../../utils/formatters';
import { KpiEvaluatorModal } from '../Evaluation/KpiEvaluatorModal';
import { 
  Clock, 
  Edit, 
  BookOpen, 
  FileCheck, 
  CheckSquare, 
  TrendingUp, 
  Search, 
  Check, 
  Users, 
  DollarSign,
  Filter,
  RefreshCw
} from 'lucide-react';

export const TimesheetManager: React.FC = () => {
  const { 
    timesheetEntries, 
    staffList, 
    currentMonth, 
    checklistTemplates,
    evaluations,
    addTimesheetEntry,
    updateTimesheetEntry,
    deleteTimesheetEntry,
    bulkUpdateStaffWorkload,
    generateMonthlyPayrollForStaff,
    payrollSlips,
    pushDataToGoogleSheet
  } = useApp();

  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  const [evaluatingTarget, setEvaluatingTarget] = useState<{ staff: Staff; templateId: string } | null>(null);

  // Quick Bulk Workload Modal State (Strictly 5 Billable Items)
  const [bulkStaff, setBulkStaff] = useState<Staff | null>(null);
  const [bulkFormData, setBulkFormData] = useState({
    teachingSessions: 0,
    teachingRate: 70000,
    tutoringTiers: [] as { rate: number, label: string, quantity: number, unit: string }[],
    gradingTiers: [] as { rate: number, label: string, quantity: number, unit: string }[],
    dayWorkCount: 0,
    dayWorkRate: 70000,
    bonusAmount: 0,
    bonusReason: '',
    note: '',
  });

  // State feedback banner
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

  // Filtered timesheets for current month
  const monthTimesheets = useMemo(() => {
    const normCurMonth = (currentMonth || '').trim().substring(0, 7);
    return timesheetEntries.map(t => {
      let m = (t.month || '').trim();
      if (m.length > 7 && m.includes('-')) {
        m = m.substring(0, 7);
      } else if (m.length > 7 || !m.includes('-')) {
        const d = new Date(m);
        if (!isNaN(d.getTime())) {
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          m = `${yyyy}-${mm}`;
        }
      }
      return { ...t, month: m };
    }).filter(t => (t.month || '').trim().substring(0, 7) === normCurMonth);
  }, [timesheetEntries, currentMonth]);

  // Aggregate monthly workload per staff according to the 5 standard items
  const staffWorkloadMatrix = useMemo(() => {
    const normCurMonth = (currentMonth || '').trim().substring(0, 7);
    return staffList.filter(s => s.isActive).map(staff => {
      const staffLogs = monthTimesheets.filter(t => 
        t.staffId === staff.id || 
        (staff.code && t.staffId === staff.code) || 
        (staff.fullName && t.staffId.trim().toLowerCase() === staff.fullName.trim().toLowerCase())
      );
      const rates = getStaffDutyRates(staff);
      const roleType = resolveStaffRoleType(staff);
      const isTeacher = hasStaffRole(staff, 'giang_vien');
      const isTutor = hasStaffRole(staff, 'tro_giang');
      const isGrader = hasStaffRole(staff, 'cham_thi');
      const isAssistant = hasStaffRole(staff, 'tro_ly');
      const isExamCrafter = hasStaffRole(staff, 'soan_de_thi');

      const teachingLogs = staffLogs.filter(t => t.type === 'teaching_session');
      const tutoringLogs = staffLogs.filter(t => t.type === 'tutoring_session');
      const gradingLogs = staffLogs.filter(t => t.type === 'grading');
      const dayWorkLogs = staffLogs.filter(t => t.type === 'day_work');
      const bonusLogs = staffLogs.filter(t => t.type === 'bonus');

      const teachingQty = teachingLogs.reduce((sum, t) => sum + t.quantity, 0);
      const tutoringQty = tutoringLogs.reduce((sum, t) => sum + t.quantity, 0);
      const gradingQty = gradingLogs.reduce((sum, t) => sum + t.quantity, 0);
      const dayWorkQty = dayWorkLogs.reduce((sum, t) => sum + t.quantity, 0);
      const bonusQty = bonusLogs.reduce((sum, t) => sum + (t.quantity * t.rate || t.rate || t.quantity), 0);

      // Existing slip bonus
      const existingSlip = payrollSlips.find(p => (p.staffId === staff.id || (staff.code && p.staffCode === staff.code)) && (p.month || '').trim().substring(0, 7) === normCurMonth);
      const totalBonus = (existingSlip?.generalBonus ?? 0) + bonusQty;

      // Evaluation info
      const staffEvaluations = evaluations.filter(e => (e.staffId === staff.id || (staff.code && e.staffId === staff.code)) && (e.month || '').trim().substring(0, 7) === normCurMonth);
      
      const roleMeta = STAFF_ROLE_DEFINITIONS[roleType] || STAFF_ROLE_DEFINITIONS.giang_vien;
      const assignedChecklists = getStaffAssignedChecklists(staff, checklistTemplates);

      // Helper to fetch specific KPI for a target department
      const getKpiForDept = (templateId: string, deptKeyword: string) => {
        const directEval = staffEvaluations.find(e => e.templateId === templateId);
        const soanBaiEval = staffEvaluations.find(e => e.templateId === 'chk_soan_bai');
        const soanBaiScore = soanBaiEval ? soanBaiEval.calculatedTotalKpi : undefined;

        if (directEval) {
          const template = checklistTemplates.find(t => t.id === templateId);
          if (template?.linkedTemplateId && (soanBaiScore !== undefined || directEval.linkedSoanBaiScore !== undefined)) {
            const linkedScore = soanBaiScore !== undefined ? soanBaiScore : directEval.linkedSoanBaiScore;
            return calculateKpiFromScores(template, directEval.scores || {}, linkedScore);
          }
          return directEval.calculatedTotalKpi;
        }

        const deptTemplates = checklistTemplates.filter(t => t.targetDepartment?.toLowerCase().includes(deptKeyword.toLowerCase()) || t.id === templateId);
        const deptEval = staffEvaluations.find(e => deptTemplates.some(t => t.id === e.templateId));
        if (deptEval) {
          const template = checklistTemplates.find(t => t.id === deptEval.templateId);
          if (template?.linkedTemplateId && (soanBaiScore !== undefined || deptEval.linkedSoanBaiScore !== undefined)) {
            const linkedScore = soanBaiScore !== undefined ? soanBaiScore : deptEval.linkedSoanBaiScore;
            return calculateKpiFromScores(template, deptEval.scores || {}, linkedScore);
          }
          return deptEval.calculatedTotalKpi;
        } else if (templateId === 'chk_day_hoc' && soanBaiScore !== undefined) {
          const template = checklistTemplates.find(t => t.id === 'chk_day_hoc');
          if (template) {
            return calculateKpiFromScores(template, {}, soanBaiScore);
          }
        }

        return 100;
      };

      const teachingKpi = getKpiForDept('chk_day_hoc', 'Dạy Học');
      const tutoringKpi = getKpiForDept('chk_tro_giang', 'Trợ Giảng');
      const gradingKpi = getKpiForDept('chk_cham_thi', 'Chấm Thi');
      const dayWorkKpi = getKpiForDept('chk_tro_ly', 'Trợ Lý');
      const soanBaiKpi = getKpiForDept('chk_soan_bai', 'Soạn Bài');

      const kpiScoresMap: Record<string, number> = {};
      assignedChecklists.forEach(c => {
        const ev = staffEvaluations.find(e => e.templateId === c.id);
        kpiScoresMap[c.id] = ev ? ev.calculatedTotalKpi : 100;
      });

      // Estimated Gross Pay using ACTUAL rates from logs and applying KPI multipliers
      const teachingPayGross = teachingLogs.reduce((sum, t) => sum + (t.quantity * (t.rate || rates.teachingRate)), 0);
      const tutoringPayGross = tutoringLogs.reduce((sum, t) => sum + (t.quantity * (t.rate || rates.tutoringRate)), 0);
      const gradingPayGross = gradingLogs.reduce((sum, t) => sum + (t.quantity * (t.rate || rates.gradingRate)), 0);
      const dayWorkPayGross = dayWorkLogs.reduce((sum, t) => sum + (t.quantity * (t.rate || rates.dayWorkRate)), 0);

      const effectiveGradingKpi = isExamCrafter ? soanBaiKpi : gradingKpi;
      const teachingPay = Math.round(teachingPayGross * (teachingKpi / 100));
      const tutoringPay = Math.round(tutoringPayGross * (tutoringKpi / 100));
      const gradingPay = Math.round(gradingPayGross * (effectiveGradingKpi / 100));
      const dayWorkPay = isAssistant 
        ? Math.round(dayWorkPayGross * (dayWorkKpi / 100)) 
        : isExamCrafter 
          ? Math.round(dayWorkPayGross * (soanBaiKpi / 100)) 
          : 0;

      const totalEstimatedPay = teachingPay + tutoringPay + gradingPay + dayWorkPay + totalBonus;

      // Helper to group logs by tier for input rendering
      const groupLogsByTier = (logs: TimesheetEntry[], defaultUnit: string, fallbackRate: number, fallbackLabel: string, tiers: any[]) => {
        const result = [];
        
        // Always include tiers defined in staff rates (even if 0)
        if (tiers && tiers.length > 0) {
          tiers.forEach(tier => {
            const qty = logs.filter(l => l.rate === tier.rate).reduce((sum, l) => sum + l.quantity, 0);
            result.push({ label: tier.label, rate: tier.rate, unit: defaultUnit, quantity: qty });
          });
        } else {
          // If no custom tiers defined, use generic fallback
          const qty = logs.reduce((sum, l) => sum + l.quantity, 0);
          result.push({ label: fallbackLabel, rate: fallbackRate, unit: defaultUnit, quantity: qty });
        }
        return result;
      };

      const tutoringTiersData = groupLogsByTier(
        tutoringLogs, 
        'Buổi', 
        rates.tutoringRate, 
        `Trợ giảng tháng ${formatMonthDisplay(currentMonth)}`, 
        rates.tutoringTiers || []
      );

      const gradingTiersData = groupLogsByTier(
        gradingLogs, 
        isExamCrafter ? 'Đề' : 'Bài', 
        rates.gradingRate, 
        isExamCrafter ? `Biên soạn đề thi tháng ${formatMonthDisplay(currentMonth)}` : `Chấm thi tháng ${formatMonthDisplay(currentMonth)}`, 
        rates.gradingTiers || []
      );

      return {
        staff,
        roleType,
        roleMeta,
        assignedChecklists,
        rates,
        isTeacher,
        isTutor,
        isGrader,
        isAssistant,
        isExamCrafter,
        totalLogs: staffLogs.length,
        teachingQty,
        tutoringQty,
        tutoringTiersData,
        gradingQty,
        gradingTiersData,
        dayWorkQty,
        totalBonus,
        totalEstimatedPay,
        kpiScoresMap,
        hasEvaluation: staffEvaluations.length > 0,
      };
    });
  }, [staffList, monthTimesheets, evaluations, currentMonth, checklistTemplates, payrollSlips]);

  // Overall Totals for Stats Bar
  const overallTotals = useMemo(() => {
    const totalTeaching = staffWorkloadMatrix.reduce((sum, s) => sum + s.teachingQty, 0);
    const totalTutoring = staffWorkloadMatrix.reduce((sum, s) => sum + s.tutoringQty, 0);
    const totalGrading = staffWorkloadMatrix.reduce((sum, s) => sum + s.gradingQty, 0);
    const totalDayWork = staffWorkloadMatrix.reduce((sum, s) => sum + s.dayWorkQty, 0);
    const totalBonus = staffWorkloadMatrix.reduce((sum, s) => sum + s.totalBonus, 0);
    const totalPay = staffWorkloadMatrix.reduce((sum, s) => sum + s.totalEstimatedPay, 0);

    return {
      totalTeaching,
      totalTutoring,
      totalGrading,
      totalDayWork,
      totalBonus,
      totalPay,
    };
  }, [staffWorkloadMatrix]);

  // Handle direct inline quantity adjustments precisely (preserve specific tiers/dates)
  const handleInlineWorkloadChange = (
    staff: Staff,
    type: 'teaching_session' | 'tutoring_session' | 'grading' | 'day_work' | 'bonus',
    newQty: number,
    targetRate: number,
    targetLabel: string,
    targetUnit: string
  ) => {
    const targetQty = Math.max(0, newQty);
    
    // Find logs that precisely match the target rate
    const normCurMonth = (currentMonth || '').trim().substring(0, 7);
    const existingLogs = timesheetEntries.filter(
      t => t.staffId === staff.id && (t.month || '').trim().substring(0, 7) === normCurMonth && t.type === type && t.rate === targetRate
    );

    if (existingLogs.length > 0) {
      // Modify the primary existing log
      const mainLog = existingLogs[0];
      if (targetQty === 0) {
        deleteTimesheetEntry(mainLog.id);
      } else {
        updateTimesheetEntry({ ...mainLog, quantity: targetQty });
      }
      
      // Clean up duplicates matching this exact tier to consolidate
      for (let i = 1; i < existingLogs.length; i++) {
        deleteTimesheetEntry(existingLogs[i].id);
      }
    } else if (targetQty > 0) {
      // Add a new specific tier log
      addTimesheetEntry({
        staffId: staff.id,
        month: currentMonth,
        date: `${currentMonth}-15`,
        type,
        label: targetLabel,
        quantity: targetQty,
        unit: targetUnit,
        rate: targetRate,
        kpiScore: 100
      });
    }

    setTimeout(() => {
      generateMonthlyPayrollForStaff(currentMonth);
    }, 150);
  };

  // Open Bulk Modal
  const handleOpenBulkModal = (staff: Staff) => {
    setBulkStaff(staff);
    const staffLogs = monthTimesheets.filter(t => t.staffId === staff.id);
    const rates = getStaffDutyRates(staff);

    const teachingLogs = staffLogs.filter(t => t.type === 'teaching_session');
    const tutoringLogs = staffLogs.filter(t => t.type === 'tutoring_session');
    const gradingLogs = staffLogs.filter(t => t.type === 'grading');
    const dayWorkLogs = staffLogs.filter(t => t.type === 'day_work');
    const bonusLogs = staffLogs.filter(t => t.type === 'bonus');

    const normCurMonth = (currentMonth || '').trim().substring(0, 7);
    const existingSlip = payrollSlips.find(p => p.staffId === staff.id && (p.month || '').trim().substring(0, 7) === normCurMonth);

    const groupLogsByTier = (logs: TimesheetEntry[], defaultUnit: string, fallbackRate: number, fallbackLabel: string, tiers: any[]) => {
      const result = [];
      if (tiers && tiers.length > 0) {
        tiers.forEach(tier => {
          const qty = logs.filter(l => l.rate === tier.rate).reduce((sum, l) => sum + l.quantity, 0);
          result.push({ label: tier.label, rate: tier.rate, unit: defaultUnit, quantity: qty });
        });
      } else {
        const qty = logs.reduce((sum, l) => sum + l.quantity, 0);
        result.push({ label: fallbackLabel, rate: fallbackRate, unit: defaultUnit, quantity: qty });
      }
      return result;
    };

    setBulkFormData({
      teachingSessions: teachingLogs.reduce((sum, t) => sum + t.quantity, 0),
      teachingRate: rates.teachingRate,
      tutoringTiers: groupLogsByTier(tutoringLogs, 'Buổi', rates.tutoringRate, `Trợ giảng tháng ${formatMonthDisplay(currentMonth)}`, rates.tutoringTiers || []),
      gradingTiers: groupLogsByTier(gradingLogs, hasStaffRole(staff, 'soan_de_thi') ? 'Đề' : 'Bài', rates.gradingRate, hasStaffRole(staff, 'soan_de_thi') ? `Soạn đề thi tháng ${formatMonthDisplay(currentMonth)}` : `Chấm thi tháng ${formatMonthDisplay(currentMonth)}`, rates.gradingTiers || []),
      dayWorkCount: dayWorkLogs.reduce((sum, t) => sum + t.quantity, 0),
      dayWorkRate: rates.dayWorkRate,
      bonusAmount: (existingSlip?.generalBonus || 0) + bonusLogs.reduce((sum, t) => sum + (t.quantity * t.rate || t.rate || t.quantity), 0),
      bonusReason: existingSlip?.bonusReason || '',
      note: `Cập nhật khối lượng công việc tháng ${formatMonthDisplay(currentMonth)}`,
    });
  };

  // Submit Bulk Quick Entry
  const handleSaveBulkWorkload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkStaff) return;

    const items: Array<{
      type: TimesheetEntry['type'];
      label: string;
      quantity: number;
      unit: string;
      rate: number;
      note?: string;
    }> = [];

    if (bulkFormData.teachingSessions > 0) {
      items.push({
        type: 'teaching_session',
        label: `Giảng dạy chuyên môn tháng ${formatMonthDisplay(currentMonth)}`,
        quantity: Number(bulkFormData.teachingSessions),
        unit: 'Buổi',
        rate: Number(bulkFormData.teachingRate),
        note: bulkFormData.note,
      });
    }

    bulkFormData.tutoringTiers.forEach(tier => {
      if (tier.quantity > 0) {
        items.push({
          type: 'tutoring_session',
          label: tier.label,
          quantity: Number(tier.quantity),
          unit: tier.unit,
          rate: Number(tier.rate),
          note: bulkFormData.note,
        });
      }
    });

    bulkFormData.gradingTiers.forEach(tier => {
      if (tier.quantity > 0) {
        items.push({
          type: 'grading',
          label: tier.label,
          quantity: Number(tier.quantity),
          unit: tier.unit,
          rate: Number(tier.rate),
          note: bulkFormData.note,
        });
      }
    });

    if (bulkFormData.dayWorkCount > 0) {
      items.push({
        type: 'day_work',
        label: `Ngày công trực & học vụ tháng ${formatMonthDisplay(currentMonth)}`,
        quantity: Number(bulkFormData.dayWorkCount),
        unit: 'Ngày',
        rate: Number(bulkFormData.dayWorkRate),
        note: bulkFormData.note,
      });
    }

    if (bulkFormData.bonusAmount > 0) {
      items.push({
        type: 'bonus',
        label: bulkFormData.bonusReason || `Thưởng hiệu suất tháng ${formatMonthDisplay(currentMonth)}`,
        quantity: 1,
        unit: 'Lần',
        rate: Number(bulkFormData.bonusAmount),
        note: bulkFormData.bonusReason,
      });
    }

    bulkUpdateStaffWorkload(bulkStaff.id, currentMonth, items);
    generateMonthlyPayrollForStaff(currentMonth);
    setBulkStaff(null);

    setSavedFeedback(`Đã lưu trọn gói 5 mục tính tiền tháng ${formatMonthDisplay(currentMonth)} cho ${bulkStaff.fullName}`);
    setTimeout(() => setSavedFeedback(null), 3000);
  };

  // Filtered Matrix List
  const filteredMatrix = staffWorkloadMatrix.filter(({ staff, roleType }) => {
    if (selectedRoleFilter !== 'all' && roleType !== selectedRoleFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = staff.fullName.toLowerCase().includes(q);
      const matchCode = staff.code.toLowerCase().includes(q);
      if (!matchName && !matchCode) return false;
    }
    return true;
  });

  return (
    <div className="space-y-5">
      
      {/* Top Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-900" />
            <span>Chấm Công & Khối Lượng Tháng {formatMonthDisplay(currentMonth)}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Chuẩn hóa 5 hạng mục tính tiền: Buổi dạy, Trợ giảng, Chấm bài, Ngày công trợ lý, Thưởng
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              generateMonthlyPayrollForStaff(currentMonth);
              setSavedFeedback('Đang đồng bộ khối lượng sang phiếu lương và Google Sheet...');
              try {
                const res = await pushDataToGoogleSheet();
                if (res.success) {
                  setSavedFeedback('Đã đồng bộ sang phiếu lương và Google Sheet thành công!');
                } else {
                  setSavedFeedback(`Đã đồng bộ phiếu lương. Sheet: ${res.message}`);
                }
              } catch (e: any) {
                setSavedFeedback(`Đã đồng bộ phiếu lương. Lỗi gửi Sheet: ${e.message || e}`);
              }
              setTimeout(() => setSavedFeedback(null), 5000);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
            title="Đồng bộ lại công thức và khối lượng sang phiếu lương"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-300" />
            <span>Đồng Bộ Bảng Lương</span>
          </button>
        </div>
      </div>

      {/* Quick Feedback Toast (Fixed bottom-right to prevent layout shift) */}
      {savedFeedback && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-900 text-emerald-100 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-3 shadow-2xl border border-emerald-700 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{savedFeedback}</span>
        </div>
      )}

      {/* SUMMARY STATS BAR FOR THE 5 BILLABLE ITEMS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        
        {/* 1. Teaching */}
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">1. Buổi Dạy Học</span>
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">
            {overallTotals.totalTeaching} <span className="text-xs font-normal text-slate-500">buổi</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Giảng viên chuyên môn
          </div>
        </div>

        {/* 2. Tutoring */}
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">2. Buổi Trợ Giảng</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">
            {overallTotals.totalTutoring} <span className="text-xs font-normal text-slate-500">buổi</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Trợ giảng lớp học
          </div>
        </div>

        {/* 3. Grading */}
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">3. Số Bài Chấm</span>
            <FileCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">
            {overallTotals.totalGrading} <span className="text-xs font-normal text-slate-500">bài</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            BTVN & Bài thi
          </div>
        </div>

        {/* 4. Day work (Assistant only) */}
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">4. Ngày Công (Trợ lý)</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">
            {overallTotals.totalDayWork} <span className="text-xs font-normal text-slate-500">ngày</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Chỉ tính cho trợ lý
          </div>
        </div>

        {/* 5. Total Cost */}
        <div className="bg-slate-900 text-white rounded-xl p-3.5 shadow-xs col-span-2 sm:col-span-1 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">5. Tổng Tiền Công</span>
            <TrendingUp className="w-4 h-4 text-amber-300" />
          </div>
          <div className="text-lg sm:text-xl font-black text-amber-300 font-mono truncate">
            {formatVND(overallTotals.totalPay)} đ
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Thưởng: {formatVND(overallTotals.totalBonus)} đ
          </div>
        </div>

      </div>

      {/* MONTHLY WORKLOAD MATRIX (BẢNG CHẤM CÔNG THEO VAI TRÒ) */}
      <div className="space-y-4">
        
        {/* Controls Bar: Filters & Search */}
        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            
            {/* Role Filter Dropdown Select */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 shrink-0">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>Lọc vai trò:</span>
              </span>
              <select
                value={selectedRoleFilter}
                onChange={e => setSelectedRoleFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-slate-900 focus:outline-none cursor-pointer"
              >
                <option value="all">Tất Cả Vai Trò ({staffList.filter(s => s.isActive).length})</option>
                {STAFF_ROLE_LIST.map(role => {
                  const count = staffList.filter(s => s.isActive && resolveStaffRoleType(s) === role.id).length;
                  return (
                    <option key={role.id} value={role.id}>
                      {role.title} ({count})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Search and Sync Action */}
            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-48">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm nhân sự..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <button
                onClick={() => {
                  generateMonthlyPayrollForStaff(currentMonth);
                  setSavedFeedback('Đã đồng bộ toàn bộ khối lượng sang phiếu lương tháng!');
                  setTimeout(() => setSavedFeedback(null), 3000);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-xs"
                title="Đồng bộ lại công thức và khối lượng sang phiếu lương"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden sm:inline">Đồng Bộ Bảng Lương</span>
              </button>
            </div>

          </div>

          {/* Main Matrix Table strictly with 5 Billable Columns */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 min-w-[200px]">Nhân sự & Vai trò</th>
                    <th className="py-3 px-2 text-center min-w-[130px] bg-slate-800 text-amber-200">
                      Bảng Kiểm & KPI <span className="text-[9px] font-normal block text-amber-300">(Chấm tại đây)</span>
                    </th>
                    <th className="py-3 px-2 text-center bg-blue-950/80 min-w-[95px] text-blue-200">
                      1. Dạy Học <span className="text-[9px] font-normal block text-blue-300">(Buổi)</span>
                    </th>
                    <th className="py-3 px-2 text-center bg-purple-950/80 min-w-[95px] text-purple-200">
                      2. Trợ Giảng <span className="text-[9px] font-normal block text-purple-300">(Buổi)</span>
                    </th>
                    <th className="py-3 px-2 text-center bg-emerald-950/80 min-w-[95px] text-emerald-200">
                      3. Chấm Bài / Đề <span className="text-[9px] font-normal block text-emerald-300">(Bài/Đề)</span>
                    </th>
                    <th className="py-3 px-2 text-center bg-amber-950/80 min-w-[95px] text-amber-200">
                      4. Ngày Công <span className="text-[9px] font-normal block text-amber-300">(Trợ lý)</span>
                    </th>
                    <th className="py-3 px-2 text-center bg-rose-950/80 min-w-[95px] text-rose-200">
                      5. Thưởng <span className="text-[9px] font-normal block text-rose-300">(VNĐ)</span>
                    </th>
                    <th className="py-3 px-3 text-right min-w-[130px] text-amber-300">Dự Toán Lương</th>
                    <th className="py-3 px-3 text-center min-w-[100px]">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {filteredMatrix.map(({ staff, roleMeta, assignedChecklists, isTeacher, isTutor, isGrader, isAssistant, isExamCrafter, teachingQty, tutoringQty, gradingQty, dayWorkQty, totalBonus, totalEstimatedPay, kpiScoresMap, tutoringTiersData, gradingTiersData, rates }) => (
                    <tr key={staff.id} className="hover:bg-slate-50/80 transition-colors">
                      
                      {/* Staff & Role with Short Tag */}
                      <td className="py-2.5 px-4">
                        <div className="font-bold text-slate-900 text-xs sm:text-sm">
                          {staff.fullName}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 flex-nowrap">
                          <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200 whitespace-nowrap shrink-0">
                            {staff.code || 'NV'}
                          </span>
                          
                          {/* Short Role Badge that NEVER wraps */}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap inline-flex items-center shrink-0 max-w-[90px] truncate ${roleMeta.badgeBg} ${roleMeta.badgeText} ${roleMeta.badgeBorder}`}>
                            {roleMeta.shortTitle}
                          </span>
                        </div>
                      </td>

                      {/* Checklists & Specific KPIs */}
                      <td className="py-2.5 px-2 text-center min-w-[130px]">
                        <div className="flex flex-col gap-1 items-stretch">
                          {assignedChecklists.map(c => (
                            <button
                              type="button"
                              key={c.id}
                              onClick={() => setEvaluatingTarget({ staff, templateId: c.id })}
                              className="flex items-center justify-between bg-slate-50 hover:bg-indigo-50/80 border border-slate-200 hover:border-indigo-300 rounded px-2 py-0.5 shadow-2xs transition-all cursor-pointer group"
                              title={`Nhấn để chấm/sửa bảng kiểm: ${c.title}`}
                            >
                              <span className="font-mono text-[10px] font-bold text-slate-600 group-hover:text-indigo-700 pr-2">
                                {c.code}
                              </span>
                              <span className={`text-[10px] font-bold font-mono ${kpiScoresMap[c.id] < 100 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {kpiScoresMap[c.id]}%
                              </span>
                            </button>
                          ))}
                          {assignedChecklists.length === 0 && (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </div>
                      </td>

                      {/* 1. Teaching Input (Giảng viên) */}
                      <td className="py-2 px-2 text-center bg-blue-50/20">
                        {isTeacher ? (
                          <div className="inline-flex items-center justify-center border border-blue-200 rounded-lg bg-white overflow-hidden shadow-2xs">
                            <button
                              type="button"
                              onClick={() => handleInlineWorkloadChange(staff, 'teaching_session', teachingQty - 1, rates.teachingRate, `Giảng dạy chuyên môn tháng ${formatMonthDisplay(currentMonth)}`, 'Buổi')}
                              className="w-5 h-7 text-slate-400 hover:text-blue-700 hover:bg-blue-50 flex items-center justify-center font-bold text-xs cursor-pointer border-r border-blue-100"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={teachingQty}
                              onChange={e => handleInlineWorkloadChange(staff, 'teaching_session', parseInt(e.target.value) || 0, rates.teachingRate, `Giảng dạy chuyên môn tháng ${formatMonthDisplay(currentMonth)}`, 'Buổi')}
                              className="w-9 h-7 text-center font-mono font-bold text-xs text-blue-700 focus:outline-none focus:bg-blue-50/50"
                            />
                            <button
                              type="button"
                              onClick={() => handleInlineWorkloadChange(staff, 'teaching_session', teachingQty + 1, rates.teachingRate, `Giảng dạy chuyên môn tháng ${formatMonthDisplay(currentMonth)}`, 'Buổi')}
                              className="w-5 h-7 text-slate-400 hover:text-blue-700 hover:bg-blue-50 flex items-center justify-center font-bold text-xs cursor-pointer border-l border-blue-100"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-300 text-xs select-none">—</span>
                        )}
                      </td>

                      {/* 2. Tutoring Input (Trợ giảng) */}
                      <td className="py-2 px-2 text-center bg-purple-50/20">
                        {isTutor ? (
                          <div className="flex flex-col gap-1 items-center justify-center">
                            {tutoringTiersData.map((tier, idx) => (
                              <div key={idx} className={`flex ${tutoringTiersData.length > 1 ? 'flex-row items-center gap-1.5 justify-between w-[95px] mx-auto' : 'flex-col items-center'}`}>
                                {tutoringTiersData.length > 1 && (
                                  <span className="text-[9px] text-purple-800/80 font-bold truncate max-w-[40px] text-left" title={tier.label}>{tier.label}</span>
                                )}
                                <div className="inline-flex shrink-0 items-center justify-center border border-purple-200 rounded-lg bg-white overflow-hidden shadow-2xs">
                                  <button
                                    type="button"
                                    onClick={() => handleInlineWorkloadChange(staff, 'tutoring_session', tier.quantity - 1, tier.rate, tier.label, tier.unit)}
                                    className="w-5 h-7 text-slate-400 hover:text-purple-700 hover:bg-purple-50 flex items-center justify-center font-bold text-xs cursor-pointer border-r border-purple-100"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    min="0"
                                    value={tier.quantity}
                                    onChange={e => handleInlineWorkloadChange(staff, 'tutoring_session', parseInt(e.target.value) || 0, tier.rate, tier.label, tier.unit)}
                                    className="w-9 h-7 text-center font-mono font-bold text-xs text-purple-700 focus:outline-none focus:bg-purple-50/50"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleInlineWorkloadChange(staff, 'tutoring_session', tier.quantity + 1, tier.rate, tier.label, tier.unit)}
                                    className="w-5 h-7 text-slate-400 hover:text-purple-700 hover:bg-purple-50 flex items-center justify-center font-bold text-xs cursor-pointer border-l border-purple-100"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-300 text-xs select-none">—</span>
                        )}
                      </td>

                      {/* 3. Grading Input (Chấm thi / Soạn đề) */}
                      <td className="py-2 px-2 text-center bg-emerald-50/20">
                        {(isGrader || isExamCrafter) ? (
                          <div className="flex flex-col gap-1 items-center justify-center">
                            {gradingTiersData.map((tier, idx) => (
                              <div key={idx} className={`flex ${gradingTiersData.length > 1 ? 'flex-row items-center gap-1.5 justify-between w-[95px] mx-auto' : 'flex-col items-center'}`}>
                                {gradingTiersData.length > 1 && (
                                  <span className="text-[9px] text-emerald-800/80 font-bold truncate max-w-[40px] text-left" title={tier.label}>{tier.label}</span>
                                )}
                                <div className="inline-flex shrink-0 items-center justify-center border border-emerald-200 rounded-lg bg-white overflow-hidden shadow-2xs">
                                  <button
                                    type="button"
                                    onClick={() => handleInlineWorkloadChange(staff, 'grading', tier.quantity - 1, tier.rate, isExamCrafter ? `Biên soạn đề thi tháng ${formatMonthDisplay(currentMonth)}` : tier.label, isExamCrafter ? 'Đề' : tier.unit)}
                                    className="w-5 h-7 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 flex items-center justify-center font-bold text-xs cursor-pointer border-r border-emerald-100"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    min="0"
                                    value={tier.quantity}
                                    onChange={e => handleInlineWorkloadChange(staff, 'grading', parseInt(e.target.value) || 0, tier.rate, isExamCrafter ? `Biên soạn đề thi tháng ${formatMonthDisplay(currentMonth)}` : tier.label, isExamCrafter ? 'Đề' : tier.unit)}
                                    className="w-10 h-7 text-center font-mono font-bold text-xs text-emerald-700 focus:outline-none focus:bg-emerald-50/50"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleInlineWorkloadChange(staff, 'grading', tier.quantity + 1, tier.rate, isExamCrafter ? `Biên soạn đề thi tháng ${formatMonthDisplay(currentMonth)}` : tier.label, isExamCrafter ? 'Đề' : tier.unit)}
                                    className="w-5 h-7 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 flex items-center justify-center font-bold text-xs cursor-pointer border-l border-emerald-100"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-300 text-xs select-none">—</span>
                        )}
                      </td>

                      {/* 4. Day Work Input (Trợ lý only) */}
                      <td className="py-2 px-2 text-center bg-amber-50/20">
                        {isAssistant ? (
                          <div className="inline-flex items-center justify-center border border-amber-200 rounded-lg bg-white overflow-hidden shadow-2xs">
                            <button
                              type="button"
                              onClick={() => handleInlineWorkloadChange(staff, 'day_work', dayWorkQty - 1, rates.dayWorkRate, `Ngày công trực & học vụ tháng ${formatMonthDisplay(currentMonth)}`, 'Ngày')}
                              className="w-5 h-7 text-slate-400 hover:text-amber-800 hover:bg-amber-50 flex items-center justify-center font-bold text-xs cursor-pointer border-r border-amber-100"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={dayWorkQty}
                              onChange={e => handleInlineWorkloadChange(staff, 'day_work', parseInt(e.target.value) || 0, rates.dayWorkRate, `Ngày công trực & học vụ tháng ${formatMonthDisplay(currentMonth)}`, 'Ngày')}
                              className="w-9 h-7 text-center font-mono font-bold text-xs text-amber-800 focus:outline-none focus:bg-amber-50/50"
                            />
                            <button
                              type="button"
                              onClick={() => handleInlineWorkloadChange(staff, 'day_work', dayWorkQty + 1, rates.dayWorkRate, `Ngày công trực & học vụ tháng ${formatMonthDisplay(currentMonth)}`, 'Ngày')}
                              className="w-5 h-7 text-slate-400 hover:text-amber-800 hover:bg-amber-50 flex items-center justify-center font-bold text-xs cursor-pointer border-l border-amber-100"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-300 text-xs select-none">—</span>
                        )}
                      </td>

                      {/* 5. Bonus */}
                      <td className="py-2 px-2 text-center bg-rose-50/20">
                        <span className="font-mono text-xs font-bold text-rose-700">
                          {totalBonus > 0 ? `${formatVND(totalBonus)} đ` : '0 đ'}
                        </span>
                      </td>

                      {/* Estimated Total */}
                      <td className="py-2.5 px-3 text-right">
                        <div className="font-black text-slate-900 font-mono text-xs sm:text-sm">
                          {formatVND(totalEstimatedPay)} đ
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => handleOpenBulkModal(staff)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                          title="Nhập nhanh & tùy biến đơn giá tháng này"
                        >
                          <Edit className="w-3 h-3" />
                          <span>Chi tiết</span>
                        </button>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      {/* QUICK BULK WORKLOAD MODAL (5 BILLABLE ITEMS ONLY) */}
      {bulkStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Nhập Khối Lượng Tháng {formatMonthDisplay(currentMonth)}
                </h3>
                <p className="text-xs text-slate-500">
                  Nhân sự: <span className="font-bold text-slate-800">{bulkStaff.fullName}</span> ({bulkStaff.code})
                </p>
              </div>
              <button
                onClick={() => setBulkStaff(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBulkWorkload} className="space-y-3.5">
              
              {/* 1. Buổi dạy học */}
              {hasStaffRole(bulkStaff, 'giang_vien') && (
                <div className="bg-blue-50/50 p-2.5 rounded-xl border border-blue-200/80 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-xs text-blue-950">1. Buổi dạy học</div>
                    <div className="text-[11px] text-blue-800">Đơn giá: {formatVND(bulkFormData.teachingRate)} đ/buổi</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      value={bulkFormData.teachingSessions}
                      onChange={e => setBulkFormData({ ...bulkFormData, teachingSessions: Number(e.target.value) })}
                      className="w-20 px-2 py-1 bg-white border border-blue-200 rounded text-xs font-mono font-bold text-center"
                    />
                    <span className="text-xs text-slate-600">Buổi</span>
                  </div>
                </div>
              )}

              {/* 2. Buổi trợ giảng */}
              {hasStaffRole(bulkStaff, 'tro_giang') && (
                <div className="bg-purple-50/50 p-2.5 rounded-xl border border-purple-200/80 flex flex-col gap-2">
                  <div className="font-bold text-xs text-purple-950">2. Buổi trợ giảng</div>
                  {bulkFormData.tutoringTiers.map((tier, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-3 bg-white p-2 rounded-lg border border-purple-100">
                      <div>
                        <div className="font-bold text-[11px] text-purple-900">{tier.label}</div>
                        <div className="text-[10px] text-purple-600">Đơn giá: {formatVND(tier.rate)} đ/{tier.unit}</div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <input
                          type="number"
                          min="0"
                          value={tier.quantity}
                          onChange={e => {
                            const newTiers = [...bulkFormData.tutoringTiers];
                            newTiers[idx].quantity = Number(e.target.value);
                            setBulkFormData({ ...bulkFormData, tutoringTiers: newTiers });
                          }}
                          className="w-16 px-2 py-1 bg-purple-50 border border-purple-200 rounded text-xs font-mono font-bold text-center focus:bg-white"
                        />
                        <span className="text-[10px] text-slate-500 w-6">{tier.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 3. Số bài chấm / soạn đề */}
              {(hasStaffRole(bulkStaff, 'cham_thi') || hasStaffRole(bulkStaff, 'soan_de_thi')) && (
                <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-200/80 flex flex-col gap-2">
                  <div className="font-bold text-xs text-emerald-950">
                    {hasStaffRole(bulkStaff, 'soan_de_thi') ? '3. Số đề thi biên soạn' : '3. Số bài chấm'}
                  </div>
                  {bulkFormData.gradingTiers.map((tier, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-3 bg-white p-2 rounded-lg border border-emerald-100">
                      <div>
                        <div className="font-bold text-[11px] text-emerald-900">{tier.label}</div>
                        <div className="text-[10px] text-emerald-600">Đơn giá: {formatVND(tier.rate)} đ/{tier.unit}</div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <input
                          type="number"
                          min="0"
                          value={tier.quantity}
                          onChange={e => {
                            const newTiers = [...bulkFormData.gradingTiers];
                            newTiers[idx].quantity = Number(e.target.value);
                            setBulkFormData({ ...bulkFormData, gradingTiers: newTiers });
                          }}
                          className="w-16 px-2 py-1 bg-emerald-50 border border-emerald-200 rounded text-xs font-mono font-bold text-center focus:bg-white"
                        />
                        <span className="text-[10px] text-slate-500 w-6">{tier.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 4. Ngày công (chỉ trợ lý) */}
              {hasStaffRole(bulkStaff, 'tro_ly') && (
                <div className="bg-amber-50/50 p-2.5 rounded-xl border border-amber-200/80 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-xs text-amber-950">4. Ngày công (Trợ lý)</div>
                    <div className="text-[11px] text-amber-800">Đơn giá: {formatVND(bulkFormData.dayWorkRate)} đ/ngày</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      value={bulkFormData.dayWorkCount}
                      onChange={e => setBulkFormData({ ...bulkFormData, dayWorkCount: Number(e.target.value) })}
                      className="w-20 px-2 py-1 bg-white border border-amber-200 rounded text-xs font-mono font-bold text-center"
                    />
                    <span className="text-xs text-slate-600">Ngày</span>
                  </div>
                </div>
              )}

              {/* 5. Thưởng */}
              <div className="bg-rose-50/50 p-2.5 rounded-xl border border-rose-200/80 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-bold text-xs text-rose-950">5. Thưởng tháng</div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="50000"
                      value={bulkFormData.bonusAmount}
                      onChange={e => setBulkFormData({ ...bulkFormData, bonusAmount: Number(e.target.value) })}
                      className="w-28 px-2 py-1 bg-white border border-rose-200 rounded text-xs font-mono font-bold text-right"
                    />
                    <span className="text-xs text-slate-600">VNĐ</span>
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Lý do thưởng (VD: Thưởng hoàn thành xuất sắc tài liệu)"
                  value={bulkFormData.bonusReason}
                  onChange={e => setBulkFormData({ ...bulkFormData, bonusReason: e.target.value })}
                  className="w-full px-2.5 py-1 text-xs bg-white border border-rose-200 rounded"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setBulkStaff(null)}
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs cursor-pointer"
                >
                  Lưu Khối Lượng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KPI EVALUATOR MODAL */}
      {evaluatingTarget && (
        <KpiEvaluatorModal
          initialStaff={evaluatingTarget.staff}
          initialTemplateId={evaluatingTarget.templateId}
          onClose={() => setEvaluatingTarget(null)}
        />
      )}

    </div>
  );
};
