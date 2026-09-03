import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Menu, 
  Search, 
  Sparkles, 
  Calendar, 
  Printer, 
  FileSpreadsheet,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { formatMonthDisplay, getPreviousMonth, getNextMonth, getAvailableYears, getMonthsForYear } from '../utils/formatters';

interface TopHeaderProps {
  onOpenMobileSidebar: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onOpenMobileSidebar }) => {
  const {
    activeTab,
    currentMonth,
    setCurrentMonth,
    searchQuery,
    setSearchQuery,
    generateMonthlyPayrollForStaff,
    setActiveTab,
    orgSettings,
    payrollSlips,
    evaluations,
    timesheetEntries,
  } = useApp();

  const tabTitles: Record<string, { title: string; subtitle: string }> = {
    payroll: {
      title: 'Quản Lý Thù Lao & Phiếu Thanh Toán',
      subtitle: `Kỳ thanh toán tháng ${formatMonthDisplay(currentMonth)} • Tính thù lao theo khối lượng & bảng kiểm`,
    },
    timesheet: {
      title: 'Chấm Công & Khối Lượng Giảng Dạy',
      subtitle: `Theo dõi buổi dạy, bài chấm, phản biện & hỗ trợ học sinh`,
    },
    evaluation: {
      title: 'Đánh Giá KPI Bảng Kiểm Trọng Số',
      subtitle: `5 bảng kiểm chính thức: Giảng dạy, Đề thi, Chấm bài, Vận hành & Dự án`,
    },
    staff: {
      title: 'Quản Lý Danh Sách Nhân Sự',
      subtitle: `Thông tin nhân sự, vị trí đảm nhiệm, tài khoản ngân hàng & mức lương cơ sở`,
    },
    checklists: {
      title: 'Danh Mục 5 Bộ Bảng Kiểm & Trọng Số KPI',
      subtitle: `Chi tiết 100% tiêu chí chấm điểm, trọng số thành phần và công thức tính`,
    },
    notice: {
      title: 'Thông Báo Phân Công & Chức Năng',
      subtitle: `Văn bản chính thức phân công nhiệm vụ và trách nhiệm nhân sự`,
    },
    gsheet: {
      title: 'Đồng Bộ Dữ Liệu Google Sheet',
      subtitle: `Lưu trữ tập trung trên đám mây và đồng bộ 2 chiều dữ liệu nhân sự & bảng lương`,
    },
    settings: {
      title: 'Cấu Hình Đơn Vị & Chữ Ký Phê Duyệt',
      subtitle: `Thông tin trung tâm, người lập biểu, người duyệt & quản lý dữ liệu`,
    },
  };

  const currentInfo = tabTitles[activeTab] || {
    title: 'Hệ Thống Quản Lý Thù Lao & Lớp Học',
    subtitle: 'Lớp Ôn Thi HSGQG Sinh Học • Đại Diện Lớp',
  };

  const allDataMonths = [
    ...payrollSlips.map(s => s.month),
    ...evaluations.map(e => e.month),
    ...timesheetEntries.map(t => t.month),
    currentMonth,
  ];
  const selectedYear = parseInt(currentMonth.split('-')[0], 10) || new Date().getFullYear();
  const monthsForCurrentYear = getMonthsForYear(selectedYear);

  return (
    <header className="no-print sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Left: Mobile hamburger & Dynamic page title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              id="btn-open-sidebar-mobile"
              onClick={onOpenMobileSidebar}
              className="lg:hidden p-2 -ml-1 text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
              title="Mở menu tính năng"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight truncate">
                {currentInfo.title}
              </h1>
              <p className="text-xs text-slate-500 font-medium hidden sm:block truncate">
                {currentInfo.subtitle}
              </p>
            </div>
          </div>

          {/* Right: Quick Search, Month Indicator & Sync Button */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Quick Search */}
            <div className="relative hidden md:block w-44 lg:w-56">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="header-search-input"
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm nhân sự..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100/80 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white text-slate-800 transition-all"
              />
            </div>

            {/* Month Quick Select */}
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 shadow-2xs">
              <div className="flex items-center px-1.5 py-0.5 text-slate-600 text-xs font-semibold gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Kỳ:</span>
              </div>
              <button
                id="btn-header-prev-month"
                onClick={() => setCurrentMonth(getPreviousMonth(currentMonth))}
                title="Kỳ trước (chuyển năm tự động)"
                className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <select
                id="header-month-select"
                value={currentMonth}
                onChange={e => setCurrentMonth(e.target.value)}
                className="bg-white text-slate-900 text-xs sm:text-sm font-bold py-1 px-1.5 rounded border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer shadow-2xs"
              >
                {monthsForCurrentYear.map(m => (
                  <option key={m} value={m}>
                    Tháng {formatMonthDisplay(m)}
                  </option>
                ))}
              </select>
              <button
                id="btn-header-next-month"
                onClick={() => setCurrentMonth(getNextMonth(currentMonth))}
                title="Kỳ tiếp theo (chuyển năm tự động)"
                className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Calculate Button */}
            <button
              id="btn-header-sync-payroll"
              onClick={() => {
                generateMonthlyPayrollForStaff(currentMonth);
                setActiveTab('payroll');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-xs transition-colors cursor-pointer"
              title="Tính toán và đồng bộ bảng lương theo công & KPI"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-950" />
              <span className="hidden sm:inline">Tính Lương Tự Động</span>
              <span className="sm:hidden">Tính Lương</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
