import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Staff } from '../../types';
import { STAFF_ROLE_DEFINITIONS, STAFF_ROLE_LIST, getAssignedChecklist, resolveStaffRoleType } from '../../data/roleDefinitions';
import { formatMonthDisplay } from '../../utils/formatters';
import { CheckSquare, Award, Clock, Users, Sparkles, ChevronRight, CheckCircle2, AlertCircle, Briefcase, Filter } from 'lucide-react';
import { KpiEvaluatorModal } from './KpiEvaluatorModal';

export const EvaluationTab: React.FC = () => {
  const { staffList, evaluations, currentMonth, checklistTemplates } = useApp();
  const [evaluatingStaff, setEvaluatingStaff] = useState<Staff | null>(null);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');

  const activeStaff = staffList.filter(s => s.isActive);

  const normCurMonth = (currentMonth || '').trim().substring(0, 7);

  const filteredStaff = activeStaff.filter(s => {
    if (selectedRoleFilter === 'all') return true;
    return resolveStaffRoleType(s) === selectedRoleFilter;
  });

  // Calculate stats
  const totalEvaluated = activeStaff.filter(s => 
    evaluations.some(e => e.staffId === s.id && (e.month || '').trim().substring(0, 7) === normCurMonth)
  ).length;

  return (
    <div className="space-y-6">
      
      {/* Header Info */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-slate-900 text-amber-300 flex items-center justify-center font-bold shadow-xs">
              <CheckSquare className="w-4 h-4" />
            </span>
            <h3 className="font-extrabold text-lg text-slate-900">
              Đánh Giá KPI Theo Bảng Kiểm Trọng Số Tháng {formatMonthDisplay(currentMonth)}
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            Mỗi vị trí chuyên môn (Giảng viên, Trợ giảng, Chấm thi, Trợ lý, Soạn đề) có bảng kiểm 100% trọng số riêng biệt. Điểm KPI tổng kết được tự động tính vào công thức chi trả lương trên phiếu lương.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Tiến độ đánh giá</span>
            <span className="text-xs font-black text-slate-900 font-mono">
              {totalEvaluated} / {activeStaff.length} nhân sự
            </span>
          </div>

          <button
            onClick={() => setEvaluatingStaff(activeStaff[0] || null)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold rounded-lg shadow-xs cursor-pointer shrink-0"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Mở Bảng Đánh Giá KPI</span>
          </button>
        </div>
      </div>

      {/* Role Filter Dropdown */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Lọc theo vai trò:</span>
          </span>
          <select
            value={selectedRoleFilter}
            onChange={e => setSelectedRoleFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-slate-900 focus:outline-none cursor-pointer"
          >
            <option value="all">Tất Cả Vai Trò ({activeStaff.length})</option>
            {STAFF_ROLE_LIST.map(role => {
              const count = activeStaff.filter(s => resolveStaffRoleType(s) === role.id).length;
              return (
                <option key={role.id} value={role.id}>
                  {role.title} ({count})
                </option>
              );
            })}
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Hiển thị <span className="font-bold text-slate-900">{filteredStaff.length}</span> nhân sự
        </div>
      </div>

      {/* Staff Evaluation Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredStaff.map(staff => {
          const evalRecord = evaluations.find(
            e => e.staffId === staff.id && (e.month || '').trim().substring(0, 7) === normCurMonth
          );
          const hasEvaluated = !!evalRecord;
          const kpiScore = evalRecord ? evalRecord.calculatedTotalKpi : 100;
          
          const roleType = resolveStaffRoleType(staff);
          const roleMeta = STAFF_ROLE_DEFINITIONS[roleType] || STAFF_ROLE_DEFINITIONS.giang_vien;
          const assignedChecklist = getAssignedChecklist(staff, checklistTemplates);

          return (
            <div
              key={staff.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition-all"
            >
              <div>
                {/* Header with Role */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h4 className="font-bold text-base text-slate-900">
                      {staff.fullName}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                      <span className="font-mono bg-slate-100 px-1.5 py-0.2 rounded font-bold border border-slate-200">
                        {staff.code || 'NV'}
                      </span>
                      <span className="font-medium text-slate-700 truncate max-w-[170px]">{staff.role}</span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap inline-flex items-center shrink-0 ${roleMeta.badgeBg} ${roleMeta.badgeText} ${roleMeta.badgeBorder}`}
                  >
                    {roleMeta.shortTitle}
                  </span>
                </div>

                {/* Assigned Checklist Box */}
                <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1.5 mb-4 border border-slate-200">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                      Bảng kiểm áp dụng:
                    </span>
                    <span className="font-mono font-bold bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded text-[10px]">
                      {assignedChecklist?.code || 'BK'}
                    </span>
                  </div>
                  <div className="font-bold text-slate-900 text-xs">
                    {assignedChecklist?.title || 'Bảng Kiểm Chuẩn Lớp Học'}
                  </div>
                  {evalRecord?.evaluatorName ? (
                    <div className="text-slate-500 text-[11px] pt-1.5 border-t border-slate-200 flex justify-between">
                      <span>Người chấm:</span>
                      <span className="font-semibold text-slate-800">{evalRecord.evaluatorName}</span>
                    </div>
                  ) : (
                    <div className="text-slate-400 text-[11px] pt-1.5 border-t border-slate-200 italic">
                      Chưa có đánh giá chi tiết (áp dụng 100%)
                    </div>
                  )}
                </div>

                {/* KPI Score Box */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 text-white mb-4">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-400" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Điểm KPI Tháng</span>
                      <span className="text-xs text-slate-300">
                        {hasEvaluated ? 'Đã chấm theo tiêu chí' : 'Mặc định (chưa sửa)'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-amber-300 font-mono">{kpiScore}%</span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <button
                onClick={() => setEvaluatingStaff(staff)}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <CheckSquare className="w-4 h-4 text-amber-300" />
                <span>{hasEvaluated ? 'Cập Nhật Đánh Giá KPI' : 'Chấm Điểm Theo Bảng Kiểm'}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Evaluator Modal */}
      {evaluatingStaff && (
        <KpiEvaluatorModal
          initialStaff={evaluatingStaff}
          onClose={() => setEvaluatingStaff(null)}
        />
      )}
    </div>
  );
};
