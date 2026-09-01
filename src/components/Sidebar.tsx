import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  FileText, 
  Clock, 
  CheckSquare, 
  Users, 
  Scale, 
  ScrollText, 
  Settings,
  Sparkles,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Upload,
  RotateCcw,
  X,
  Building2,
  CheckCircle2,
  ChevronDown,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { formatMonthDisplay } from '../utils/formatters';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
}) => {
  const {
    activeTab,
    setActiveTab,
    currentMonth,
    setCurrentMonth,
    payrollSlips,
    staffList,
    evaluations,
    monthlyStats,
    generateMonthlyPayrollForStaff,
    exportBackupJson,
    importBackupJson,
    resetToSampleData,
    orgSettings,
  } = useApp();

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const currentMonthSlips = payrollSlips.filter(s => s.month === currentMonth);
  const currentMonthEvals = evaluations.filter(e => e.month === currentMonth);
  const activeStaffList = staffList.filter(s => s.isActive);
  const activeStaffCount = activeStaffList.length;
  const evaluatedStaffCount = new Set(currentMonthEvals.map(e => e.staffId)).size;

  const availableMonths = [
    '2026-05',
    '2026-06',
    '2026-07',
    '2026-08',
    '2026-09',
    '2026-10',
    '2026-11',
    '2026-12',
  ];

  const handlePrevMonth = () => {
    const idx = availableMonths.indexOf(currentMonth);
    if (idx > 0) {
      setCurrentMonth(availableMonths[idx - 1]);
    }
  };

  const handleNextMonth = () => {
    const idx = availableMonths.indexOf(currentMonth);
    if (idx < availableMonths.length - 1) {
      setCurrentMonth(availableMonths[idx + 1]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = event => {
        const content = event.target?.result as string;
        if (content) {
          const success = importBackupJson(content);
          if (success) {
            alert('Khôi phục dữ liệu thành công!');
          } else {
            alert('File sao lưu không hợp lệ.');
          }
        }
      };
      reader.readAsText(file);
    }
  };

  const navGroups = [
    {
      groupTitle: 'LƯƠNG & CHẤM CÔNG',
      items: [
        {
          id: 'payroll',
          name: 'Bảng & Phiếu Lương',
          icon: FileText,
          badge: currentMonthSlips.length > 0 ? `${currentMonthSlips.length}` : undefined,
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
        },
        {
          id: 'timesheet',
          name: 'Chấm Công & Khối Lượng',
          icon: Clock,
          badge: `${monthlyStats.totalSessions} buổi`,
          badgeColor: 'bg-sky-500/20 text-sky-300 border border-sky-500/30',
        },
        {
          id: 'evaluation',
          name: 'Đánh Giá KPI Bảng Kiểm',
          icon: CheckSquare,
          badge: `${evaluatedStaffCount}/${activeStaffCount}`,
          badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
        },
      ],
    },
    {
      groupTitle: 'NHÂN SỰ & QUY ĐỊNH',
      items: [
        {
          id: 'staff',
          name: 'Danh Sách Nhân Sự',
          icon: Users,
          badge: `${staffList.length}`,
          badgeColor: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
        },
        {
          id: 'checklists',
          name: '5 Bộ Bảng Kiểm Trọng Số',
          icon: Scale,
          badge: '100%',
          badgeColor: 'bg-slate-700 text-slate-300',
        },
        {
          id: 'notice',
          name: 'Thông Báo Phân Công',
          icon: ScrollText,
        },
      ],
    },
    {
      groupTitle: 'HỆ THỐNG & ĐÁM MÂY',
      items: [
        {
          id: 'gsheet',
          name: 'Đồng Bộ Google Sheet & GitHub',
          icon: FileSpreadsheet,
          badge: 'Cloud Sync',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
        },
        {
          id: 'settings',
          name: 'Cấu Hình & Chữ Ký',
          icon: Settings,
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        className={`no-print fixed top-0 bottom-0 left-0 z-50 h-screen shrink-0 flex flex-col bg-slate-950 text-slate-200 border-r border-slate-800 transition-all duration-300 ease-in-out lg:sticky lg:top-0 lg:translate-x-0 select-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'lg:w-20' : 'w-72 sm:w-76 lg:w-72 xl:w-76'}`}
      >
        {/* Header Branding */}
        <div className="flex items-center justify-between h-18 px-4 border-b border-slate-800/80 bg-slate-950 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-amber-400 to-amber-600 text-slate-950 font-black text-lg flex items-center justify-center shrink-0 shadow-md tracking-tight">
              3D
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-white text-base tracking-tight truncate">
                    TRIPLE D
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                    PRO
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 truncate">
                  Ôn Thi HSGQG Sinh Học
                </span>
              </div>
            )}
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Month Switcher in Sidebar */}
        <div className={`p-3 border-b border-slate-800/60 bg-slate-900/40 shrink-0 ${isCollapsed ? 'px-2' : 'px-3.5'}`}>
          {!isCollapsed ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-amber-400" /> Kỳ Lương Đang Chọn
                </span>
                <span className="text-amber-400 font-mono">2026</span>
              </div>
              <div className="flex items-center gap-1 bg-slate-900 rounded-lg p-1 border border-slate-700/60 shadow-inner">
                <button
                  onClick={handlePrevMonth}
                  title="Tháng trước"
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <select
                  value={currentMonth}
                  onChange={e => setCurrentMonth(e.target.value)}
                  className="flex-1 bg-transparent text-center font-extrabold text-sm text-white focus:outline-none cursor-pointer"
                >
                  {availableMonths.map(m => (
                    <option key={m} value={m} className="bg-slate-900 text-white">
                      Tháng {formatMonthDisplay(m)}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleNextMonth}
                  title="Tháng tiếp theo"
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center py-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Tháng</span>
              <span className="text-xs font-black text-amber-300">{formatMonthDisplay(currentMonth)}</span>
            </div>
          )}
        </div>

        {/* Navigation Links Scrollable Area */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  {group.groupTitle}
                </div>
              )}
              <div className="space-y-1">
                {group.items.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      id={`sidebar-tab-${item.id}`}
                      onClick={() => {
                        setActiveTab(item.id);
                        if (window.innerWidth < 1024) onClose();
                      }}
                      title={isCollapsed ? item.name : undefined}
                      className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition-all cursor-pointer group ${
                        isActive
                          ? 'bg-amber-400 text-slate-950 font-extrabold shadow-sm'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                            isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-amber-300'
                          }`}
                        />
                        {!isCollapsed && <span className="truncate">{item.name}</span>}
                      </div>

                      {!isCollapsed && item.badge && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            isActive
                              ? 'bg-slate-900 text-amber-300'
                              : item.badgeColor || 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Quick Auto-calculate CTA Card */}
          {!isCollapsed && (
            <div className="p-3.5 bg-linear-to-b from-slate-900 to-slate-950 rounded-xl border border-slate-800/90 text-center space-y-2.5 shadow-md">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-300">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Đồng Bộ Dữ Liệu Lương</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Tự động tính toán lại bảng lương tháng {formatMonthDisplay(currentMonth)} theo công và KPI mới nhất.
              </p>
              <button
                onClick={() => {
                  generateMonthlyPayrollForStaff(currentMonth);
                  setActiveTab('payroll');
                }}
                className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-950 text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                Tính Lương Tháng Này
              </button>
            </div>
          )}
        </div>

        {/* Sidebar Footer (User & Backup Actions) */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950 shrink-0">
          {!isCollapsed ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-300 truncate">
                  {orgSettings.orgName || 'Triple D'}
                </span>
                <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                  v2.5
                </span>
              </div>

              {/* Data Tools */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                <div className="flex items-center gap-1">
                  <button
                    onClick={exportBackupJson}
                    title="Tải bản sao lưu JSON"
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    title="Khôi phục file JSON"
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".json"
                    className="hidden"
                  />
                  <button
                    onClick={() => {
                      if (confirm('Khôi phục lại dữ liệu mẫu gốc Triple D?')) {
                        resetToSampleData();
                      }
                    }}
                    title="Đặt lại dữ liệu gốc"
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-md transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={onToggleCollapse}
                  className="hidden lg:flex items-center gap-1 text-[11px] text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
                  title="Thu gọn sidebar"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={onToggleCollapse}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                title="Mở rộng sidebar"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
