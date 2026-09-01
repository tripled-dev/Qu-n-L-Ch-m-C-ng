const fs = require('fs');
let tsCode = fs.readFileSync('src/components/Timesheet/TimesheetManager.tsx', 'utf-8');

if (!tsCode.includes('calculateKpiFromScores')) {
  tsCode = tsCode.replace(
    "import { formatVND, formatMonthDisplay } from '../../utils/formatters';",
    "import { formatVND, formatMonthDisplay, calculateKpiFromScores } from '../../utils/formatters';"
  );
}

const targetBlock = `      // Existing slip bonus
      const existingSlip = payrollSlips.find(p => p.staffId === staff.id && p.month === currentMonth);
      const totalBonus = (existingSlip?.generalBonus ?? 0) + bonusQty;

      // Estimated Gross Pay using ACTUAL rates from logs if present, else fallback
      const teachingPay = teachingLogs.reduce((sum, t) => sum + (t.quantity * (t.rate || rates.teachingRate)), 0);
      const tutoringPay = tutoringLogs.reduce((sum, t) => sum + (t.quantity * (t.rate || rates.tutoringRate)), 0);
      const gradingPay = gradingLogs.reduce((sum, t) => sum + (t.quantity * (t.rate || rates.gradingRate)), 0);
      const dayWorkPay = dayWorkLogs.reduce((sum, t) => sum + (t.quantity * (t.rate || rates.dayWorkRate)), 0);
      const totalEstimatedPay = teachingPay + tutoringPay + gradingPay + dayWorkPay + totalBonus;

      // Evaluation info
      const staffEvaluations = evaluations.filter(e => e.staffId === staff.id && e.month === currentMonth);`;

const replacementBlock = `      // Existing slip bonus
      const existingSlip = payrollSlips.find(p => p.staffId === staff.id && p.month === currentMonth);
      const totalBonus = (existingSlip?.generalBonus ?? 0) + bonusQty;

      // Evaluation info
      const staffEvaluations = evaluations.filter(e => e.staffId === staff.id && e.month === currentMonth);

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

      // Estimated Gross Pay using ACTUAL rates from logs and applying KPI multipliers
      const teachingPayGross = teachingLogs.reduce((sum, t) => sum + (t.quantity * (t.rate || rates.teachingRate)), 0);
      const tutoringPayGross = tutoringLogs.reduce((sum, t) => sum + (t.quantity * (t.rate || rates.tutoringRate)), 0);
      const gradingPayGross = gradingLogs.reduce((sum, t) => sum + (t.quantity * (t.rate || rates.gradingRate)), 0);
      const dayWorkPayGross = dayWorkLogs.reduce((sum, t) => sum + (t.quantity * (t.rate || rates.dayWorkRate)), 0);

      const teachingPay = Math.round(teachingPayGross * (teachingKpi / 100));
      const tutoringPay = Math.round(tutoringPayGross * (tutoringKpi / 100));
      const gradingPay = Math.round(gradingPayGross * (gradingKpi / 100));
      const dayWorkPay = isAssistant ? Math.round(dayWorkPayGross * (dayWorkKpi / 100)) : 0;

      const totalEstimatedPay = teachingPay + tutoringPay + gradingPay + dayWorkPay + totalBonus;`;

if (tsCode.includes(targetBlock)) {
  tsCode = tsCode.replace(targetBlock, replacementBlock);
  fs.writeFileSync('src/components/Timesheet/TimesheetManager.tsx', tsCode);
  console.log("TimesheetManager KPI salary calculation successfully patched!");
} else {
  console.log("Error: targetBlock not found in TimesheetManager.tsx");
}
