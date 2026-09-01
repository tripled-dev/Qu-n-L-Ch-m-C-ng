const fs = require('fs');

// 1. Update TimesheetManager.tsx
let tsCode = fs.readFileSync('src/components/Timesheet/TimesheetManager.tsx', 'utf-8');

if (!tsCode.includes('calculateKpiFromScores')) {
  tsCode = tsCode.replace(
    "import { formatVND, formatMonthDisplay } from '../../utils/formatters';",
    "import { formatVND, formatMonthDisplay, calculateKpiFromScores } from '../../utils/formatters';"
  );
}

const oldTsCalc = `      // Existing slip bonus
      const existingSlip = payrollSlips.find(p => p.staffId === staff.id && p.month === currentMonth);
      const totalBonus = (existingSlip?.generalBonus ?? 0) + bonusQty;

      // Estimated Gross Pay using ACTUAL rates from logs if present, else fallback
      const teachingPay = teachingLogs.reduce((sum, t) => sum + (t.quantity * (t.rate || rates.teachingRate)), 0);
      const tutoringPay = tutoringLogs.reduce((sum, t) => sum + (t.quantity * (t.rate || rates.tutoringRate)), 0);
      const gradingPay = gradingLogs.reduce((sum, t) => sum + (t.quantity * (t.rate || rates.gradingRate)), 0);
      const dayWorkPay = dayWorkLogs.reduce((sum, t) => sum + (t.quantity * (t.rate || rates.dayWorkRate)), 0);
      const totalEstimatedPay = teachingPay + tutoringPay + gradingPay + dayWorkPay + totalBonus;

      // Evaluation info
      const staffEvaluations = evaluations.filter(e => e.staffId === staff.id && e.month === currentMonth);
      
      const roleMeta = STAFF_ROLE_DEFINITIONS[roleType] || STAFF_ROLE_DEFINITIONS.giang_vien;
      const assignedChecklists = getStaffAssignedChecklists(staff, checklistTemplates);
      
      const kpiScoresMap: Record<string, number> = {};
      assignedChecklists.forEach(c => {
        const ev = staffEvaluations.find(e => e.templateId === c.id);
        kpiScoresMap[c.id] = ev ? ev.calculatedTotalKpi : 100;
      });`;

const newTsCalc = `      // Existing slip bonus
      const existingSlip = payrollSlips.find(p => p.staffId === staff.id && p.month === currentMonth);
      const totalBonus = (existingSlip?.generalBonus ?? 0) + bonusQty;

      // Evaluation info
      const staffEvaluations = evaluations.filter(e => e.staffId === staff.id && e.month === currentMonth);
      
      const roleMeta = STAFF_ROLE_DEFINITIONS[roleType] || STAFF_ROLE_DEFINITIONS.giang_vien;
      const assignedChecklists = getStaffAssignedChecklists(staff, checklistTemplates);
      
      // Helper to fetch specific KPI for a target department
      const getKpiForDept = (targetDept: string) => {
        const deptTemplates = checklistTemplates.filter(t => t.targetDepartment === targetDept);
        if (deptTemplates.length === 0) return 100;
        
        const deptEval = staffEvaluations.find(e => deptTemplates.some(t => t.id === e.templateId));
        const soanBaiEval = staffEvaluations.find(e => e.templateId === 'chk_soan_bai');
        const soanBaiScore = soanBaiEval ? soanBaiEval.calculatedTotalKpi : undefined;

        if (deptEval) {
          const template = checklistTemplates.find(t => t.id === deptEval.templateId);
          if (template?.linkedTemplateId && (soanBaiScore !== undefined || deptEval.linkedSoanBaiScore !== undefined)) {
            const linkedScore = soanBaiScore !== undefined ? soanBaiScore : deptEval.linkedSoanBaiScore;
            return calculateKpiFromScores(template, deptEval.scores || {}, linkedScore);
          }
          return deptEval.calculatedTotalKpi;
        } else if (targetDept === 'day_hoc' && soanBaiScore !== undefined) {
          const template = checklistTemplates.find(t => t.id === 'chk_day_hoc');
          if (template) {
            return calculateKpiFromScores(template, {}, soanBaiScore);
          }
        }
        return 100;
      };

      const teachingKpi = getKpiForDept('day_hoc');
      const tutoringKpi = getKpiForDept('tro_giang');
      const gradingKpi = getKpiForDept('cham_thi');
      const dayWorkKpi = getKpiForDept('tro_ly');

      const kpiScoresMap: Record<string, number> = {};
      assignedChecklists.forEach(c => {
        const ev = staffEvaluations.find(e => e.templateId === c.id);
        kpiScoresMap[c.id] = ev ? ev.calculatedTotalKpi : 100;
      });

      // Estimated Gross Pay using ACTUAL rates from logs and applying KPI multipliers
      const teachingPay = teachingLogs.reduce((sum, t) => sum + (t.quantity * (t.rate || rates.teachingRate)), 0);
      const tutoringPay = tutoringLogs.reduce((sum, t) => sum + (t.quantity * (t.rate || rates.tutoringRate)), 0);
      const gradingPay = gradingLogs.reduce((sum, t) => sum + (t.quantity * (t.rate || rates.gradingRate)), 0);
      const dayWorkPay = dayWorkLogs.reduce((sum, t) => sum + (t.quantity * (t.rate || rates.dayWorkRate)), 0);

      const teachingAmount = Math.round(teachingPay * (teachingKpi / 100));
      const tutoringAmount = Math.round(tutoringPay * (tutoringKpi / 100));
      const gradingAmount = Math.round(gradingPay * (gradingKpi / 100));
      const dayWorkAmount = isAssistant ? Math.round(dayWorkPay * (dayWorkKpi / 100)) : 0;

      const totalEstimatedPay = teachingAmount + tutoringAmount + gradingAmount + dayWorkAmount + totalBonus;`;

if (tsCode.includes(oldTsCalc)) {
  tsCode = tsCode.replace(oldTsCalc, newTsCalc);
  fs.writeFileSync('src/components/Timesheet/TimesheetManager.tsx', tsCode);
  console.log("TimesheetManager KPI salary calculation updated successfully!");
} else {
  console.log("Warning: oldTsCalc not found in TimesheetManager.tsx");
}

// 2. Update AppContext.tsx to auto-sync payroll slips on evaluation / timesheet changes
let appContextCode = fs.readFileSync('src/context/AppContext.tsx', 'utf-8');

const targetSyncEffect = `  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(\`\${LOCAL_STORAGE_KEY_PREFIX}staff\`, JSON.stringify(staffList));
  }, [staffList]);`;

const addedSyncEffect = `  // Auto-sync payroll slips when evaluations, timesheets or month change
  useEffect(() => {
    generateMonthlyPayrollForStaff(currentMonth);
  }, [evaluations, timesheetEntries, currentMonth, staffList]);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(\`\${LOCAL_STORAGE_KEY_PREFIX}staff\`, JSON.stringify(staffList));
  }, [staffList]);`;

if (!appContextCode.includes('generateMonthlyPayrollForStaff(currentMonth);') && appContextCode.includes(targetSyncEffect)) {
  appContextCode = appContextCode.replace(targetSyncEffect, addedSyncEffect);
  fs.writeFileSync('src/context/AppContext.tsx', appContextCode);
  console.log("AppContext auto-sync payroll effect added successfully!");
} else {
  console.log("AppContext auto-sync payroll effect already present or target not found");
}
