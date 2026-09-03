import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MonthlyPayrollSlip, Staff } from '../../types';
import { formatVND, formatMonthDisplay, exportPayrollTableToCSV } from '../../utils/formatters';
import { 
  FileText, 
  Printer, 
  Download, 
  Sparkles, 
  CheckSquare, 
  Edit, 
  Trash2, 
  CheckCircle,
  CheckCircle2, 
  Clock, 
  Filter, 
  DollarSign, 
  Users, 
  Award,
  ChevronRight,
  Plus
} from 'lucide-react';
import { PayslipModal } from './PayslipModal';
import { KpiEvaluatorModal } from '../Evaluation/KpiEvaluatorModal';
import { STAFF_ROLE_DEFINITIONS, resolveStaffRoleType } from '../../data/roleDefinitions';

export const PayrollList: React.FC = () => {
  const {
    payrollSlips,
    currentMonth,
    monthlyStats,
    staffList,
    departmentFilter,
    setDepartmentFilter,
    searchQuery,
    setSearchQuery,
    generateMonthlyPayrollForStaff,
    deletePayrollSlip,
    updateSlipStatus,
    showConfirm,
    showToast,
    pushDataToGoogleSheet,
  } = useApp();

  const [activeSlip, setActiveSlip] = useState<MonthlyPayrollSlip | null>(null);
  const [evalStaff, setEvalStaff] = useState<Staff | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [syncedToast, setSyncedToast] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string>('');

  const handleSyncFromTimesheets = async () => {
    generateMonthlyPayrollForStaff(currentMonth);
    setSyncedToast(true);
    setSyncMessage('Đang đồng bộ sang phiếu lương và Google Sheet...');
    try {
      const res = await pushDataToGoogleSheet();
      if (res.success) {
        setSyncMessage('Đã đồng bộ sang phiếu lương và Google Sheet thành công!');
      } else {
        setSyncMessage(`Phiếu lương cập nhật xong. Sheet lỗi: ${res.message}`);
      }
    } catch (e: any) {
      setSyncMessage(`Phiếu lương cập nhật xong. Lỗi Sheet: ${e.message || e}`);
    }
    setTimeout(() => {
      setSyncedToast(false);
      setSyncMessage('');
    }, 5000);
  };

  // Filter slips for current month
  const normCurMonth = (currentMonth || '').trim().substring(0, 7);
  const currentMonthSlips = payrollSlips.filter(slip => {
    const normSlipMonth = (slip.month || '').trim().substring(0, 7);
    if (normSlipMonth !== normCurMonth) return false;
    if (departmentFilter !== 'all' && slip.departmentId !== departmentFilter) return false;
    if (statusFilter !== 'all' && slip.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = slip.staffName.toLowerCase().includes(q);
      const matchCode = (slip.staffCode || '').toLowerCase().includes(q);
      const matchDept = slip.departmentName.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchDept) return false;
    }
    return true;
  });

  const handleExportCSV = () => {
    const exportData = currentMonthSlips.map(s => ({
      'Tháng': formatMonthDisplay(s.month),
      'Mã NV': s.staffCode || '',
      'Họ và Tên': s.staffName,
      'Chức Danh': s.role,
      'Bộ Phận': s.departmentName,
      'Mẫu Phiếu': s.formatType === 'teaching' ? 'Dạy Học' : 'Trợ Lý & LTSP',
      'Số Lượng (Buổi/Ngày)': s.primarySalary.daysOrSessions,
      'Đơn Giá Gốc': s.primarySalary.unitPrice,
      'KPI (%)': s.primarySalary.kpiPercent,
      'Lương Chính': s.primarySalary.totalAmount,
      'Lương Sản Phẩm (LTSP)': s.pieceworkItems.reduce((acc, item) => acc + item.totalAmount, 0),
      'Thưởng Chung': s.generalBonus,
      'Khấu Trừ': s.deductions,
      'TỔNG THỰC NHẬN': s.totalSalary,
      'Số TKNH': s.bankAccount,
      'Ngân Hàng': s.bankName,
      'Trạng Thái': s.status === 'paid' ? 'Đã thanh toán' : s.status === 'approved' ? 'Đã duyệt' : 'Bản nháp',
    }));

    exportPayrollTableToCSV(exportData, `BangLuong_TripleD_Thang_${currentMonth}`);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Payroll */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tổng Quỹ Lương Tháng
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {formatVND(monthlyStats.totalPayroll)} <span className="text-sm font-bold text-slate-500">VNĐ</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Đã bao gồm lương dạy, lương ngày công, LTSP và thưởng
          </p>
        </div>

        {/* Employee Count */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Nhân Sự Đã Lập Phiếu
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {monthlyStats.totalEmployees} <span className="text-sm font-semibold text-slate-500">/ {staffList.length} nhân sự</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {monthlyStats.approvedSlipsCount} phiếu đã duyệt / thanh toán
          </p>
        </div>

        {/* Total Sessions & Workload */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Khối Lượng Hoàn Thành
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {monthlyStats.totalSessions} <span className="text-sm font-normal text-slate-500">buổi</span> & {monthlyStats.totalSubmissions} <span className="text-sm font-normal text-slate-500">bài</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tổng ca dạy, trợ giảng và bài chấm trong tháng
          </p>
        </div>

        {/* Average KPI */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              KPI Trung Bình Tổ Chức
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {monthlyStats.averageKpi}%
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Đánh giá theo 5 bộ Bảng Kiểm Trọng Số chuyên môn
          </p>
        </div>

      </div>

      {/* Control Bar & Filter */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
        
        {/* Left Filter Group */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Department Filter */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={departmentFilter}
              onChange={e => setDepartmentFilter(e.target.value)}
              className="text-xs font-semibold bg-transparent text-slate-800 pr-1 py-0.5 focus:outline-none cursor-pointer whitespace-nowrap"
            >
              <option value="all">Tất cả bộ phận</option>
              <option value="day_hoc">Bộ phận Dạy Học</option>
              <option value="tro_giang">Bộ phận Trợ Giảng</option>
              <option value="cham_thi">Bộ phận Chấm Thi</option>
              <option value="soan_de">Bộ phận Soạn Đề Thi</option>
              <option value="tro_ly">Bộ phận Trợ Lý</option>
              <option value="dieu_hanh">Ban Điều Hành</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 shrink-0">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-xs font-semibold bg-transparent text-slate-800 py-0.5 focus:outline-none cursor-pointer whitespace-nowrap"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="draft">Bản nháp</option>
              <option value="approved">Đã duyệt</option>
              <option value="paid">Đã thanh toán</option>
            </select>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end shrink-0 relative">
          
          {/* Real-time Auto-Sync Status Badge */}
          <span className="hidden lg:inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 whitespace-nowrap shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Tự động đồng bộ</span>
          </span>

          {/* Toast feedback */}
          {syncedToast && (
            <div className="absolute -top-12 right-0 bg-emerald-800 text-emerald-100 text-xs font-bold px-3.5 py-2.5 rounded-lg shadow-lg flex items-center gap-1.5 animate-bounce z-20 whitespace-nowrap border border-emerald-600">
              <CheckCircle className="w-4 h-4 text-emerald-300" />
              <span>{syncMessage || 'Đã đồng bộ thành công dữ liệu Chấm công sang Phiếu lương!'}</span>
            </div>
          )}

          {/* Manual Sync Button */}
          <button
            onClick={handleSyncFromTimesheets}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer shadow-xs whitespace-nowrap shrink-0"
            title="Bấm để đồng bộ lại toàn bộ phiếu lương tháng theo dữ liệu chấm công mới nhất"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Đồng Bộ Thủ Công</span>
          </button>

          {/* Export CSV / Excel */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
            title="Xuất bảng lương tổng hợp ra file CSV / Excel"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span>Xuất Excel/CSV</span>
          </button>

          {/* Print All */}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
            title="In bảng tổng hợp hoặc phiếu lương"
          >
            <Printer className="w-3.5 h-3.5 shrink-0" />
            <span>In Bảng Lương</span>
          </button>

        </div>

      </div>

      {/* Payroll Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              Bảng Tổng Hợp Lương Tháng {formatMonthDisplay(currentMonth)}
            </h3>
            <p className="text-xs text-slate-500">
              Danh sách phiếu thù lao chi tiết của người hỗ trợ lớp học
            </p>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-slate-200/80 px-2.5 py-1 rounded-full">
            {currentMonthSlips.length} phiếu
          </span>
        </div>

        {currentMonthSlips.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-slate-800 mb-1">
              Chưa có dữ liệu bảng lương tháng {formatMonthDisplay(currentMonth)}
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              Nhấn nút bên dưới để tự động tạo phiếu lương cho tất cả nhân sự dựa trên dữ liệu chấm công và bảng kiểm KPI.
            </p>
            <button
              onClick={handleSyncFromTimesheets}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Tạo Bảng Lương Tháng {formatMonthDisplay(currentMonth)}</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-3 px-3.5 whitespace-nowrap min-w-[180px]">Nhân sự</th>
                  <th className="py-3 px-2 text-right whitespace-nowrap min-w-[120px]">1. Dạy Học</th>
                  <th className="py-3 px-2 text-right whitespace-nowrap min-w-[130px]">2. Trợ Giảng</th>
                  <th className="py-3 px-2 text-right whitespace-nowrap min-w-[120px]">3. Chấm Thi</th>
                  <th className="py-3 px-2 text-right whitespace-nowrap min-w-[120px]">4. Ngày Công</th>
                  <th className="py-3 px-2 text-right whitespace-nowrap min-w-[110px]">5. Thưởng/Trừ</th>
                  <th className="py-3 px-2 text-center whitespace-nowrap min-w-[70px]">KPI</th>
                  <th className="py-3 px-3 text-right whitespace-nowrap min-w-[120px]">Thực Nhận</th>
                  <th className="py-3 px-2 text-center whitespace-nowrap min-w-[110px]">Trạng Thái</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap min-w-[80px]">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentMonthSlips.map(slip => {
                  const matchingStaff = staffList.find(s => s.id === slip.staffId);
                  const roleType = matchingStaff ? resolveStaffRoleType(matchingStaff) : 'giang_vien';
                  const roleMeta = STAFF_ROLE_DEFINITIONS[roleType] || STAFF_ROLE_DEFINITIONS.giang_vien;
                  const b = slip.billableBreakdown;

                  const tch = b?.teaching;
                  const tut = b?.tutoring;
                  const grd = b?.grading;
                  const day = b?.dayWork;
                  const bon = (slip.generalBonus || 0) + (slip.allowances || 0) - (slip.deductions || 0);

                  return (
                    <tr key={slip.id} className="hover:bg-slate-50 transition-colors">
                      {/* Staff Name & Roles */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="font-bold text-slate-900 whitespace-nowrap text-xs sm:text-sm">{slip.staffName}</div>
                        <div className="flex items-center gap-1 mt-1 flex-nowrap">
                          <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1 py-0.2 rounded border border-slate-200 whitespace-nowrap shrink-0">
                            {slip.staffCode || '---'}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border whitespace-nowrap shrink-0 ${roleMeta.badgeBg} ${roleMeta.badgeText} ${roleMeta.badgeBorder}`}>
                            {roleMeta.shortTitle}
                          </span>
                        </div>
                      </td>

                      {/* 1. Dạy học */}
                      <td className="py-3 px-2 text-right whitespace-nowrap">
                        {tch && tch.sessions > 0 ? (
                          <div>
                            <div className="font-bold text-slate-900 whitespace-nowrap">{formatVND(tch.amount)} đ</div>
                            <div className="text-[10px] text-slate-500 whitespace-nowrap">
                              {tch.sessions} buổi × {formatVND(tch.rate)} đ
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* 2. Trợ giảng */}
                      <td className="py-3 px-2 text-right whitespace-nowrap">
                        {tut && tut.sessions > 0 ? (
                          <div>
                            <div className="font-bold text-sky-900 whitespace-nowrap">{formatVND(tut.amount)} đ</div>
                            <div className="text-[10px] text-slate-500 whitespace-nowrap">
                              {tut.sessions} buổi × {formatVND(tut.rate)} đ
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* 3. Chấm thi */}
                      <td className="py-3 px-2 text-right whitespace-nowrap">
                        {grd && grd.items > 0 ? (
                          <div>
                            <div className="font-bold text-emerald-900 whitespace-nowrap">{formatVND(grd.amount)} đ</div>
                            <div className="text-[10px] text-slate-500 whitespace-nowrap">
                              {grd.items} bài × {formatVND(grd.rate)} đ
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* 4. Ngày công */}
                      <td className="py-3 px-2 text-right whitespace-nowrap">
                        {day && day.days > 0 ? (
                          <div>
                            <div className="font-bold text-amber-900 whitespace-nowrap">{formatVND(day.amount)} đ</div>
                            <div className="text-[10px] text-slate-500 whitespace-nowrap">
                              {day.days} ngày × {formatVND(day.rate)} đ
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* 5. Thưởng / Trừ */}
                      <td className="py-3 px-2 text-right whitespace-nowrap">
                        {bon !== 0 ? (
                          <div>
                            <div className={`font-bold whitespace-nowrap ${bon > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                              {bon > 0 ? `+${formatVND(bon)}` : formatVND(bon)} đ
                            </div>
                            <div className="text-[10px] text-slate-500 whitespace-nowrap">
                              {slip.generalBonus > 0 ? 'Thưởng ' : ''}{slip.deductions > 0 ? `Trừ ${formatVND(slip.deductions)}` : ''}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* KPI */}
                      <td className="py-3 px-2 text-center whitespace-nowrap">
                        <button
                          onClick={() => {
                            if (matchingStaff) setEvalStaff(matchingStaff);
                          }}
                          className={`inline-flex items-center gap-0.5 font-bold text-[11px] px-1.5 py-0.5 rounded cursor-pointer hover:ring-2 hover:ring-slate-400 whitespace-nowrap ${
                            slip.primarySalary.kpiPercent >= 95
                              ? 'bg-emerald-100 text-emerald-800'
                              : slip.primarySalary.kpiPercent >= 80
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                          title="Bấm để xem / chấm Bảng Kiểm KPI"
                        >
                          <span>{slip.primarySalary.kpiPercent}%</span>
                        </button>
                      </td>

                      {/* Thực nhận */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="font-extrabold text-slate-900 text-sm whitespace-nowrap">
                          {formatVND(slip.totalSalary)} đ
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-2 text-center whitespace-nowrap">
                        <select
                          value={slip.status}
                          onChange={e => updateSlipStatus(slip.id, e.target.value as any)}
                          className={`text-[10px] font-bold py-0.5 px-2 rounded-full border cursor-pointer whitespace-nowrap ${
                            slip.status === 'paid'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : slip.status === 'approved'
                              ? 'bg-sky-50 text-sky-700 border-sky-300'
                              : 'bg-amber-50 text-amber-700 border-amber-300'
                          }`}
                        >
                          <option value="draft">Bản nháp</option>
                          <option value="approved">Đã duyệt</option>
                          <option value="paid">Đã thanh toán</option>
                        </select>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setActiveSlip(slip)}
                            className="p-1 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                            title="Xem & Xuất phiếu thù lao chi tiết"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (matchingStaff) setEvalStaff(matchingStaff);
                            }}
                            className="p-1 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                            title="Đánh giá theo Bảng Kiểm Trọng Số"
                          >
                            <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                          </button>
                          <button
                            onClick={() => {
                              showConfirm({
                                title: 'Xác nhận xóa phiếu lương',
                                message: `Bạn có chắc chắn muốn xóa phiếu lương tháng ${formatMonthDisplay(currentMonth)} của ${slip.staffName}?`,
                                confirmText: 'Xóa phiếu',
                                variant: 'danger',
                                icon: 'trash',
                                onConfirm: () => {
                                  deletePayrollSlip(slip.id);
                                  showToast(`Đã xóa phiếu lương của ${slip.staffName}`, 'info');
                                },
                              });
                            }}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                            title="Xóa phiếu lương này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payslip Modal */}
      {activeSlip && (
        <PayslipModal
          slip={activeSlip}
          onClose={() => setActiveSlip(null)}
        />
      )}

      {/* KPI Evaluation Modal */}
      {evalStaff && (
        <KpiEvaluatorModal
          initialStaff={evalStaff}
          onClose={() => setEvalStaff(null)}
        />
      )}

    </div>
  );
};
