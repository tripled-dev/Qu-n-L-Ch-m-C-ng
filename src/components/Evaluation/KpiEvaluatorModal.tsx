import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Staff, ChecklistTemplate, ChecklistGroup, ChecklistCriterion } from '../../types';
import { getAssignedChecklist, resolveStaffRoleType, STAFF_ROLE_DEFINITIONS, getStaffAssignedChecklists } from '../../data/roleDefinitions';
import { calculateKpiFromScores, formatMonthDisplay } from '../../utils/formatters';
import { 
  CheckSquare, 
  X, 
  Save, 
  Sparkles, 
  AlertCircle, 
  Sliders, 
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface KpiEvaluatorModalProps {
  initialTemplateId?: string;
  initialStaff?: Staff | null;
  onClose: () => void;
}

export const KpiEvaluatorModal: React.FC<KpiEvaluatorModalProps> = ({ initialStaff, initialTemplateId, onClose }) => {
  const { 
    staffList, 
    checklistTemplates, 
    currentMonth, 
    saveEvaluation, 
    getStaffEvaluationForMonth 
  } = useApp();

  const [selectedStaffId, setSelectedStaffId] = useState<string>(
    initialStaff?.id || staffList[0]?.id || ''
  );
  
  const currentStaff = staffList.find(s => s.id === selectedStaffId);

  // Auto pick template based on staff assigned checklist & role
  const defaultTemplateId = useMemo(() => {
    if (initialTemplateId && checklistTemplates.some(t => t.id === initialTemplateId)) {
      return initialTemplateId;
    }
    if (!currentStaff) return checklistTemplates[0]?.id || 'chk_day_hoc';
    const assigned = getAssignedChecklist(currentStaff, checklistTemplates);
    return assigned?.id || checklistTemplates[0]?.id || 'chk_day_hoc';
  }, [currentStaff, checklistTemplates]);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(defaultTemplateId);

  useEffect(() => {
    if (initialTemplateId && checklistTemplates.some(t => t.id === initialTemplateId)) {
      setSelectedTemplateId(initialTemplateId);
    } else if (defaultTemplateId) {
      setSelectedTemplateId(defaultTemplateId);
    }
  }, [defaultTemplateId, initialTemplateId, checklistTemplates]);

  const template = checklistTemplates.find(t => t.id === selectedTemplateId) || checklistTemplates[0];
  const soanBaiTemplate = checklistTemplates.find(t => t.id === 'chk_soan_bai');

  // Existing evaluation data
  const existingEval = currentStaff ? getStaffEvaluationForMonth(currentStaff.id, currentMonth, selectedTemplateId) : undefined;

  const [scores, setScores] = useState<Record<string, number>>({});
  const [soanBaiScores, setSoanBaiScores] = useState<Record<string, number>>({});
  const [showSoanBaiSubModal, setShowSoanBaiSubModal] = useState(false);
  const [evaluatorName, setEvaluatorName] = useState('Ban Quản Lý Triple D');
  const [notes, setNotes] = useState('');

  // Load existing or initialize with 100%
  useEffect(() => {
    if (existingEval) {
      setScores(existingEval.scores || {});
      setEvaluatorName(existingEval.evaluatorName || 'Ban Quản Lý Triple D');
      setNotes(existingEval.notes || '');
    } else {
      // Default all criteria to 100%
      const initial: Record<string, number> = {};
      template?.groups.forEach(g => {
        g.criteria.forEach(c => {
          initial[c.id] = 100;
        });
      });
      setScores(initial);
    }
  }, [selectedStaffId, selectedTemplateId, currentMonth]);

  // Auto-fetch linked Soan Bai score if evaluated this month
  const calculatedSoanBaiScore = useMemo(() => {
    if (!currentStaff) return undefined;
    const soanBaiEval = getStaffEvaluationForMonth(currentStaff.id, currentMonth, 'chk_soan_bai');
    return soanBaiEval ? soanBaiEval.calculatedTotalKpi : undefined;
  }, [currentStaff, currentMonth, getStaffEvaluationForMonth]);

  // Total KPI calculation
  const totalKpi = useMemo(() => {
    if (!template) return 100;
    return calculateKpiFromScores(template, scores, calculatedSoanBaiScore);
  }, [template, scores, calculatedSoanBaiScore]);

  const handleScoreChange = (criterionId: string, value: number) => {
    setScores(prev => ({
      ...prev,
      [criterionId]: Math.max(0, Math.min(100, value)),
    }));
  };

  const handleSaveEvaluation = () => {
    if (!currentStaff) return;

    saveEvaluation({
      staffId: currentStaff.id,
      month: currentMonth,
      templateId: selectedTemplateId,
      evaluationDate: new Date().toISOString().slice(0, 10),
      evaluatorName,
      scores,
      calculatedTotalKpi: totalKpi,
      notes,
      linkedSoanBaiScore: calculatedSoanBaiScore,
    });

    alert(`Đã lưu đánh giá KPI: ${totalKpi}% cho nhân sự ${currentStaff.fullName}. Điểm đã tự động cập nhật vào phiếu lương tháng ${formatMonthDisplay(currentMonth)}!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[94vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                Đánh Giá KPI Theo Bảng Kiểm Trọng Số
              </h3>
              <p className="text-xs text-slate-400">
                Tháng {formatMonthDisplay(currentMonth)} • Tự động tính điểm & đồng bộ vào phiếu lương
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selection Bar */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          {/* Staff Select */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Chọn Nhân Sự Đánh Giá:
            </label>
            <select
              value={selectedStaffId}
              onChange={e => setSelectedStaffId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-slate-900"
            >
              {staffList.map(s => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.departmentName} - {s.code || 'NV'})
                </option>
              ))}
            </select>
          </div>

          {/* Template Select */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Bảng Kiểm Áp Dụng:
            </label>
            <select
              value={selectedTemplateId}
              onChange={e => setSelectedTemplateId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-slate-900"
            >
              {(currentStaff ? getStaffAssignedChecklists(currentStaff, checklistTemplates) : checklistTemplates).map(t => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.code})
                </option>
              ))}
            </select>
          </div>

          {/* KPI Total Summary Box */}
          <div className="bg-white rounded-xl border border-slate-200 p-2.5 flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Tổng Điểm Hiệu Suất (KPI)
              </span>
              <span className="text-xs text-slate-600">Trọng số 100% chuẩn</span>
            </div>
            <div className="text-right">
              <span
                className={`text-2xl font-black ${
                  totalKpi >= 95
                    ? 'text-emerald-600'
                    : totalKpi >= 80
                    ? 'text-sky-600'
                    : 'text-amber-600'
                }`}
              >
                {totalKpi}%
              </span>
            </div>
          </div>

        </div>

        {/* Scrollable Checklist Form */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-100/50">
          
          {template?.groups.map((group, gIdx) => (
            <div
              key={group.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs"
            >
              {/* Group Header */}
              <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-amber-300 text-xs font-bold flex items-center justify-center">
                    {group.stt}
                  </span>
                  <h4 className="font-bold text-sm sm:text-base tracking-tight">
                    {group.groupName}
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold bg-amber-400/20 text-amber-300 px-2.5 py-1 rounded-md">
                    Tổng Trọng Số: {group.totalWeight}%
                  </span>
                </div>
              </div>

              {/* Criteria List */}
              <div className="divide-y divide-slate-100">
                {group.criteria.map(crit => {
                  const isLinkedSoanBai = crit.id === 'tl_c1_1' || crit.id === 'dh_c1_2';
                  const isAutoLinked = isLinkedSoanBai && calculatedSoanBaiScore !== undefined;
                  const score = isAutoLinked ? calculatedSoanBaiScore : (scores[crit.id] ?? 100);

                  return (
                    <div key={crit.id} className="p-4 hover:bg-slate-50/80 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        
                        {/* Criterion Description */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              Trọng số: {crit.weight}%
                            </span>
                            {isLinkedSoanBai && (
                              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> Đánh giá qua Bảng Kiểm Soạn Bài
                              </span>
                            )}
                          </div>
                          
                          <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                            {crit.title}
                          </p>

                          {crit.details && crit.details.length > 0 && (
                            <ul className="mt-2 space-y-1">
                              {crit.details.map((d, dIdx) => (
                                <li key={dIdx} className="text-xs text-slate-600 flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                  <span>{d}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        {/* Scoring Control */}
                        <div className="w-full md:w-64 flex flex-col items-end gap-2 shrink-0">
                          
                          {/* Quick preset buttons */}
                          <div className="flex items-center gap-1">
                            {[100, 90, 80, 50].map(val => (
                              <button
                                key={val}
                                onClick={() => handleScoreChange(crit.id, val)}
                                className={`text-[11px] font-bold px-2 py-1 rounded transition-colors ${
                                  score === val
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                              >
                                {val}%
                              </button>
                            ))}
                          </div>

                          {/* Slider & manual input */}
                          <div className="flex items-center gap-2 w-full justify-end">
                            {isAutoLinked ? (
                              <div className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200">
                                Đã đồng bộ từ Bảng kiểm Soạn Bài ({score}%)
                              </div>
                            ) : (
                              <>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  step="5"
                                  value={score}
                                  onChange={e => handleScoreChange(crit.id, Number(e.target.value))}
                                  className="w-32 accent-slate-900 cursor-pointer"
                                />
                                <div className="flex items-center">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={score}
                                    onChange={e => handleScoreChange(crit.id, Number(e.target.value))}
                                    className="w-14 text-center font-bold text-sm bg-slate-50 border border-slate-300 rounded p-1"
                                  />
                                  <span className="ml-1 text-xs font-bold text-slate-600">%</span>
                                </div>
                              </>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium">
                            Đóng góp vào tổng: {Math.round((score * crit.weight) / 100 * 10) / 10}% / {crit.weight}%
                          </div>

                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          ))}

          {/* Notes & Evaluator info */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 shadow-xs">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Người Đánh Giá / Ký Duyệt:
              </label>
              <input
                type="text"
                value={evaluatorName}
                onChange={e => setEvaluatorName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nhận Xét / Đánh Giá Tổng Thể:
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Nhận xét sự chuyên cần, chất lượng công việc..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

        </div>

        {/* Footer actions */}
        <div className="bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Kết quả đánh giá:</span>
            <span className="text-lg font-black text-slate-900">{totalKpi}%</span>
            <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200">
              {totalKpi >= 100 ? 'Xuất sắc' : totalKpi >= 85 ? 'Tốt' : 'Đạt'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              onClick={handleSaveEvaluation}
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4 text-amber-300" />
              <span>Lưu & Cập Nhật Phiếu Lương</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
