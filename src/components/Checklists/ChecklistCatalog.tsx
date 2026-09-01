import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ChecklistTemplate } from '../../types';
import { Scale, CheckSquare, Edit, Save, Plus, Trash2, Sparkles, BookOpen } from 'lucide-react';
import { KpiEvaluatorModal } from '../Evaluation/KpiEvaluatorModal';

export const ChecklistCatalog: React.FC = () => {
  const { checklistTemplates, updateChecklistTemplate } = useApp();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(checklistTemplates[0]?.id || 'chk_day_hoc');
  const [showEvalModal, setShowEvalModal] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const activeTemplate = checklistTemplates.find(t => t.id === selectedTemplateId) || checklistTemplates[0];

  return (
    <div className="space-y-6">
      
      {/* Top Template Dropdown Switcher */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <span className="text-xs font-bold text-slate-700 whitespace-nowrap">
              Chọn bảng kiểm trọng số:
            </span>
            <select
              value={selectedTemplateId}
              onChange={e => {
                setSelectedTemplateId(e.target.value);
                setIsEditing(false);
              }}
              className="bg-slate-50 border border-slate-300 text-slate-900 text-xs sm:text-sm font-bold rounded-lg px-3.5 py-2 focus:ring-2 focus:ring-slate-900 focus:outline-none cursor-pointer min-w-[260px]"
            >
              {checklistTemplates.map(t => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEvalModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
            >
              <CheckSquare className="w-4 h-4 text-amber-300" />
              <span>Chấm Điểm Theo Bảng Này</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Checklist Card (Authentic Official Document View) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Document Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
                {activeTemplate.code}
              </span>
              <h2 className="text-xl font-extrabold text-slate-900">
                {activeTemplate.title}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              {activeTemplate.description}
            </p>
          </div>

          <div className="text-right shrink-0 bg-white border border-slate-200 px-4 py-2 rounded-xl">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Tổng Trọng Số Chuẩn
            </span>
            <span className="text-2xl font-black text-emerald-700">100%</span>
          </div>
        </div>

        {/* Official Table Style */}
        <div className="p-4 sm:p-6 overflow-x-auto">
          <table className="w-full border-collapse border border-slate-900 text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-900 text-center font-bold">
                <th className="border-r border-slate-900 p-2.5 w-12 text-center">STT</th>
                <th className="border-r border-slate-900 p-2.5 w-48 text-left pl-3">Công Việc</th>
                <th className="border-r border-slate-900 p-2.5 text-left pl-3">Chi Tiết</th>
                <th className="border-r border-slate-900 p-2.5 w-24 text-center">Trọng Số</th>
                <th className="p-2.5 w-24 text-center font-bold">Tổng Kết</th>
              </tr>
            </thead>
            <tbody>
              {activeTemplate.groups.map(group => {
                const rowCount = group.criteria.length;

                return group.criteria.map((crit, cIdx) => (
                  <tr key={crit.id} className="border-b border-slate-900">
                    {/* STT & Group Name spans across rows */}
                    {cIdx === 0 && (
                      <td
                        rowSpan={rowCount}
                        className="border-r border-slate-900 p-2.5 text-center font-bold align-middle bg-slate-50/50"
                      >
                        {group.stt}
                      </td>
                    )}
                    {cIdx === 0 && (
                      <td
                        rowSpan={rowCount}
                        className="border-r border-slate-900 p-3 font-bold align-middle bg-slate-50/50"
                      >
                        <div className="text-slate-900">{group.groupName}</div>
                      </td>
                    )}

                    {/* Criteria Details */}
                    <td className="border-r border-slate-900 p-3 text-slate-800 leading-relaxed">
                      <div className="font-medium">{crit.title}</div>
                      {crit.details && crit.details.length > 0 && (
                        <div className="mt-1.5 text-slate-500 text-[11px] space-y-0.5">
                          {crit.details.map((d, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-slate-400"></span>
                              <span>{d}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Sub Weight */}
                    <td className="border-r border-slate-900 p-2.5 text-center font-semibold font-mono text-slate-900">
                      {crit.weight}%
                    </td>

                    {/* Group Total Weight */}
                    {cIdx === 0 && (
                      <td
                        rowSpan={rowCount}
                        className="p-2.5 text-center font-black font-mono text-slate-900 text-sm align-middle bg-slate-50/50"
                      >
                        {group.totalWeight}%
                      </td>
                    )}
                  </tr>
                ));
              })}

              {/* Total Row */}
              <tr className="bg-slate-100 font-bold border-t-2 border-slate-900">
                <td className="border-r border-slate-900 p-3 text-center">
                  {activeTemplate.groups.length + 1}
                </td>
                <td colSpan={3} className="border-r border-slate-900 p-3 font-bold text-slate-900">
                  Tổng Kết
                </td>
                <td className="p-3 text-center font-black text-slate-900 text-sm">
                  100%
                </td>
              </tr>
            </tbody>
          </table>

          {/* Footer Note */}
          {activeTemplate.id === 'chk_soan_bai' && (
            <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 italic">
              <strong>Ghi chú áp dụng:</strong> Sử dụng để đánh giá tài liệu biên soạn. Dựa vào điểm tổng kết của “Bảng Kiểm Soạn Bài” sau đó nhân với trọng số của công việc tương ứng để thu được hiệu suất của công việc tương ứng.
            </div>
          )}
        </div>

      </div>

      {/* KPI Evaluator Modal */}
      {showEvalModal && (
        <KpiEvaluatorModal
          onClose={() => setShowEvalModal(false)}
        />
      )}

    </div>
  );
};
