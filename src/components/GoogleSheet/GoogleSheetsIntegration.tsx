import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { GOOGLE_APPS_SCRIPT_TEMPLATE } from '../../utils/googleSheetsSync';
import {
  FileSpreadsheet,
  CloudDownload,
  CloudUpload,
  RefreshCw,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Github,
  Rocket,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Code2,
  Layers,
  Database,
  ArrowRight
} from 'lucide-react';

export const GoogleSheetsIntegration: React.FC = () => {
  const {
    googleSheetUrl,
    setGoogleSheetUrl,
    isSyncingGoogleSheet,
    lastSyncTime,
    syncStatusMessage,
    pullDataFromGoogleSheet,
    pushDataToGoogleSheet,
    clearAllSampleData,
    resetToSampleData,
    staffList,
    timesheetEntries,
    evaluations,
    payrollSlips,
    currentMonth,
  } = useApp();

  const [inputUrl, setInputUrl] = useState(googleSheetUrl);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedGitCommands, setCopiedGitCommands] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'sync' | 'script' | 'github_deploy'>('sync');
  const [confirmClearModal, setConfirmClearModal] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSaveUrl = () => {
    setGoogleSheetUrl(inputUrl.trim());
    setActionFeedback({ type: 'success', text: 'Đã lưu URL kết nối Google Apps Script!' });
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handlePull = async () => {
    if (!inputUrl.trim()) {
      setActionFeedback({ type: 'error', text: 'Vui lòng nhập URL Google Apps Script trước khi tải dữ liệu!' });
      return;
    }
    setGoogleSheetUrl(inputUrl.trim());
    const res = await pullDataFromGoogleSheet(inputUrl.trim());
    if (res.success) {
      setActionFeedback({ type: 'success', text: res.message });
    } else {
      setActionFeedback({ type: 'error', text: res.message });
    }
  };

  const handlePush = async () => {
    if (!inputUrl.trim()) {
      setActionFeedback({ type: 'error', text: 'Vui lòng nhập URL Google Apps Script trước khi lưu dữ liệu!' });
      return;
    }
    setGoogleSheetUrl(inputUrl.trim());
    const res = await pushDataToGoogleSheet(inputUrl.trim());
    if (res.success) {
      setActionFeedback({ type: 'success', text: res.message });
    } else {
      setActionFeedback({ type: 'error', text: res.message });
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const gitCommands = `# 1. Khởi tạo Git trong thư mục dự án
git init
git add .
git commit -m "Triple D Payroll & Timesheet Web App"

# 2. Liên kết với Repository GitHub của bạn (thay username/repo của bạn)
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/triple-d-payroll.git
git push -u origin main`;

  const handleCopyGitCommands = () => {
    navigator.clipboard.writeText(gitCommands);
    setCopiedGitCommands(true);
    setTimeout(() => setCopiedGitCommands(false), 2500);
  };

  return (
    <div id="google-sheets-integration-page" className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div id="gsheet-header-banner" className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/20 backdrop-blur-sm rounded-xl border border-emerald-400/30 text-emerald-300">
                <FileSpreadsheet className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Đồng Bộ Dữ Liệu Google Sheet & Triển Khai GitHub</h1>
                <p className="text-sm text-emerald-200/80">
                  Lưu trữ tập trung trên Google Sheet, đồng bộ 2 chiều và hướng dẫn đẩy code lên GitHub để deploy web
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="tab-sync-btn"
              onClick={() => setActiveSubTab('sync')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                activeSubTab === 'sync'
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/40'
                  : 'bg-white/10 text-emerald-100 hover:bg-white/20'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              Bảng Đồng Bộ
            </button>
            <button
              id="tab-script-btn"
              onClick={() => setActiveSubTab('script')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                activeSubTab === 'script'
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/40'
                  : 'bg-white/10 text-emerald-100 hover:bg-white/20'
              }`}
            >
              <Code2 className="w-4 h-4" />
              Mã Nguồn Apps Script
            </button>
            <button
              id="tab-deploy-btn"
              onClick={() => setActiveSubTab('github_deploy')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                activeSubTab === 'github_deploy'
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/40'
                  : 'bg-white/10 text-emerald-100 hover:bg-white/20'
              }`}
            >
              <Rocket className="w-4 h-4" />
              Deploy & GitHub
            </button>
          </div>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionFeedback && (
        <div
          id="action-feedback-toast"
          className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium border animate-in fade-in duration-300 ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {actionFeedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{actionFeedback.text}</span>
        </div>
      )}

      {/* SUB-TAB 1: LIVE SYNC & CONTROL PANEL */}
      {activeSubTab === 'sync' && (
        <div id="subtab-sync-container" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: URL Config & Sync Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Connection Card */}
            <div id="gsheet-connection-card" className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800">Cấu Hình Kết Nối Google Sheet</h2>
                    <p className="text-xs text-slate-500">Dán URL triển khai Web App từ Google Apps Script của bạn</p>
                  </div>
                </div>
                {lastSyncTime && (
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-medium px-3 py-1 rounded-full flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Đồng bộ lần cuối: {lastSyncTime}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  URL Ứng Dụng Web Apps Script (Kết thúc bằng /exec)
                </label>
                <div className="flex gap-2">
                  <input
                    id="gsheet-url-input"
                    type="url"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                    className="flex-1 px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-800"
                  />
                  <button
                    id="save-gsheet-url-btn"
                    onClick={handleSaveUrl}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-semibold transition-all whitespace-nowrap"
                  >
                    Lưu URL
                  </button>
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  Chưa có URL? Hãy xem tab <strong>"Mã Nguồn Apps Script"</strong> ở góc trên để lấy mã nguồn và triển khai trong 2 phút!
                </p>
              </div>

              {/* Sync Controls */}
              <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  id="pull-from-gsheet-btn"
                  onClick={handlePull}
                  disabled={isSyncingGoogleSheet}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all"
                >
                  <CloudDownload className={`w-5 h-5 ${isSyncingGoogleSheet ? 'animate-bounce' : ''}`} />
                  {isSyncingGoogleSheet ? 'Đang tải dữ liệu...' : 'Tải Dữ Liệu Từ Sheet Về'}
                </button>

                <button
                  id="push-to-gsheet-btn"
                  onClick={handlePush}
                  disabled={isSyncingGoogleSheet}
                  className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white rounded-xl font-bold text-sm shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 transition-all"
                >
                  <CloudUpload className={`w-5 h-5 ${isSyncingGoogleSheet ? 'animate-bounce' : ''}`} />
                  {isSyncingGoogleSheet ? 'Đang lưu lên Sheet...' : 'Lưu & Đẩy Dữ Liệu Lên Sheet'}
                </button>
              </div>

              {syncStatusMessage.text && (
                <div
                  id="sync-status-indicator"
                  className={`p-3 rounded-lg text-xs flex items-center gap-2 font-medium ${
                    syncStatusMessage.type === 'error'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : syncStatusMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${
                    syncStatusMessage.type === 'error' ? 'bg-rose-500' : syncStatusMessage.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500 animate-ping'
                  }`} />
                  <span>{syncStatusMessage.text}</span>
                </div>
              )}
            </div>

            {/* Data Management & Sample Cleanup Card */}
            <div id="data-cleanup-card" className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">Quản Lý & Dọn Dẹp Dữ Liệu Mẫu</h2>
                  <p className="text-xs text-slate-500">Xóa dữ liệu mẫu để bắt đầu nhập dữ liệu nhân sự thật từ Google Sheet</p>
                </div>
              </div>

              <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-2">
                <p className="font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  Bạn muốn xóa bớt dữ liệu mẫu để nhập từ Google Sheet?
                </p>
                <p className="text-amber-800">
                  Nút <strong>"Xóa sạch dữ liệu mẫu"</strong> sẽ làm trống danh sách nhân sự, bảng chấm công, phiếu lương để bạn tải về danh sách nhân viên thật từ Google Sheet mà không bị lẫn dữ liệu thử nghiệm. (Hệ thống vẫn giữ nguyên các Bảng kiểm KPI chuẩn).
                </p>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  id="clean-sample-data-btn"
                  onClick={() => setConfirmClearModal(true)}
                  className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4 text-rose-500" />
                  Xóa Sạch Dữ Liệu Mẫu (Clean Slate)
                </button>

                <button
                  id="reset-sample-data-btn"
                  onClick={() => {
                    if (window.confirm('Khôi phục lại 2 nhân sự mẫu định dạng chuẩn ban đầu?')) {
                      resetToSampleData();
                      setActionFeedback({ type: 'success', text: 'Đã khôi phục dữ liệu mẫu chuẩn!' });
                    }
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4 text-slate-500" />
                  Khôi phục mẫu chuẩn ban đầu
                </button>
              </div>
            </div>
          </div>

          {/* Right Col: Live Data Stats & Architecture */}
          <div className="space-y-6">
            {/* Live Data Summary */}
            <div id="live-data-summary-card" className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                Dữ Liệu Hiện Tại Trên Web
              </h2>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-xs font-medium text-slate-600">Nhân sự (NhanSu):</span>
                  <span className="text-sm font-bold text-slate-800">{staffList.length} nhân viên</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-xs font-medium text-slate-600">Bản ghi chấm công (ChamCong):</span>
                  <span className="text-sm font-bold text-slate-800">{timesheetEntries.length} bản ghi</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-xs font-medium text-slate-600">Đánh giá KPI (DanhGiaKPI):</span>
                  <span className="text-sm font-bold text-slate-800">{evaluations.length} đánh giá</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-xs font-medium text-slate-600">Phiếu lương (PhieuLuong):</span>
                  <span className="text-sm font-bold text-slate-800">{payrollSlips.length} phiếu</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-emerald-800 space-y-1">
                <p className="font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Đồng bộ an toàn 2 chiều
                </p>
                <p className="text-emerald-700 text-[11px]">
                  Tất cả thay đổi trên giao diện web hoặc trên Google Sheet đều có thể đồng bộ qua lại mà không sợ mất mát dữ liệu.
                </p>
              </div>
            </div>

            {/* Quick deployment shortcut */}
            <div id="quick-deploy-card" className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <Rocket className="w-4 h-4" />
                Deploy Trang Web Lên Mạng
              </div>
              <h3 className="font-bold text-base">Đưa Web Lên GitHub & Vercel Miễn Phí</h3>
              <p className="text-xs text-slate-300">
                Chạy online 24/7, có đường link riêng để giáo viên & kế toán truy cập trên điện thoại hoặc máy tính.
              </p>
              <button
                id="view-deploy-guide-btn"
                onClick={() => setActiveSubTab('github_deploy')}
                className="w-full mt-2 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                Xem Hướng Dẫn Deploy Chi Tiết
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: APPS SCRIPT CODE & SETUP GUIDE */}
      {activeSubTab === 'script' && (
        <div id="subtab-script-container" className="space-y-6">
          {/* 4 Steps Tutorial */}
          <div id="apps-script-steps" className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Code2 className="w-5 h-5 text-emerald-600" />
                Hướng Dẫn Cài Đặt Google Apps Script Cho Google Sheet (Chỉ 2 Phút)
              </h2>
              <p className="text-xs text-slate-500">Thực hiện 4 bước đơn giản dưới đây để biến Google Sheet thành Database đám mây cho web</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="w-7 h-7 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                <h3 className="text-xs font-bold text-slate-800">Tạo Google Sheet</h3>
                <p className="text-xs text-slate-600">
                  Mở một Google Sheet mới trên Google Drive của bạn (hoặc sheet hiện có).
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="w-7 h-7 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                <h3 className="text-xs font-bold text-slate-800">Mở Apps Script</h3>
                <p className="text-xs text-slate-600">
                  Trên thanh menu, chọn <strong>Tiện ích mở rộng</strong> &gt; <strong>Apps Script</strong>.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="w-7 h-7 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                <h3 className="text-xs font-bold text-slate-800">Dán Code & Lưu</h3>
                <p className="text-xs text-slate-600">
                  Xóa hết mã cũ trong file <code className="text-emerald-600 font-bold">Code.gs</code>, dán toàn bộ mã nguồn bên dưới vào và bấm <strong>Lưu (Ctrl+S)</strong>.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="w-7 h-7 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
                <h3 className="text-xs font-bold text-slate-800">Triển Khai Web App</h3>
                <p className="text-xs text-slate-600">
                  Bấm <strong>Triển khai</strong> &gt; <strong>Triển khai mới</strong> &gt; Loại <strong>Ứng dụng web</strong> &gt; Ai có quyền truy cập chọn <strong>Bất kỳ ai (Anyone)</strong> &gt; Copy URL dán vào web.
                </p>
              </div>
            </div>
          </div>

          {/* Script Code Viewer */}
          <div id="apps-script-viewer-card" className="bg-slate-900 rounded-2xl p-6 text-slate-100 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 font-mono text-sm text-emerald-400">
                <FileSpreadsheet className="w-4 h-4" />
                <span>Code.gs (Toàn bộ mã nguồn API đồng bộ Google Sheet)</span>
              </div>
              <button
                id="copy-script-code-btn"
                onClick={handleCopyScript}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-500/20"
              >
                {copiedScript ? (
                  <>
                    <Check className="w-4 h-4 text-slate-900" />
                    Đã sao chép vào bộ nhớ tạm!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-900" />
                    Sao chép toàn bộ mã nguồn Apps Script
                  </>
                )}
              </button>
            </div>

            <div className="relative">
              <pre className="p-4 bg-slate-950 rounded-xl overflow-x-auto text-xs font-mono text-slate-300 leading-relaxed max-h-[500px]">
                {GOOGLE_APPS_SCRIPT_TEMPLATE}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: GITHUB PUSH & DEPLOYMENT GUIDE */}
      {activeSubTab === 'github_deploy' && (
        <div id="subtab-deploy-container" className="space-y-6">
          {/* Main GitHub & Deployment Guide Card */}
          <div id="deploy-instructions-card" className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-900 text-white rounded-xl">
                <Github className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Hướng Dẫn Đẩy Code Lên GitHub & Deploy Website Hoàn Toàn Miễn Phí</h2>
                <p className="text-xs text-slate-500">Chỉ cần 3 bước để có trang web chạy trực tuyến với tên miền riêng và kết nối Google Sheet</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* STEP 1 */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">1</span>
                    Tải Mã Nguồn Về Máy & Khởi Tạo Git
                  </h3>
                  <button
                    id="copy-git-cmd-btn"
                    onClick={handleCopyGitCommands}
                    className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    {copiedGitCommands ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedGitCommands ? 'Đã sao chép!' : 'Copy lệnh Git'}
                  </button>
                </div>
                <p className="text-xs text-slate-600">
                  Tại góc trên bên phải màn hình AI Studio, bạn bấm vào biểu tượng <strong>Tải về (Download ZIP)</strong> hoặc <strong>Export to GitHub</strong>. Nếu tải ZIP, hãy giải nén ra thư mục trên máy tính rồi mở terminal/cmd và chạy các lệnh sau:
                </p>
                <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed">
                  {gitCommands}
                </pre>
              </div>

              {/* STEP 2 */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                  Deploy Lên Vercel Hoặc Netlify (Miễn Phí 100%)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800">Phương Án 1: Vercel (Khuyên dùng)</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">Nhanh nhất</span>
                    </div>
                    <ol className="text-xs text-slate-600 list-decimal list-inside space-y-1 leading-relaxed">
                      <li>Truy cập <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-emerald-600 font-semibold underline">vercel.com</a> và đăng nhập bằng tài khoản GitHub.</li>
                      <li>Bấm <strong>"Add New Project"</strong> &gt; Chọn repository vừa đẩy lên.</li>
                      <li>Framework Preset tự nhận diện là <strong>Vite</strong>. Bấm <strong>"Deploy"</strong>.</li>
                      <li>Sau 1 phút, bạn sẽ nhận được đường link web có dạng <code className="text-slate-800 font-mono bg-slate-100 px-1 py-0.5 rounded">https://triple-d-payroll.vercel.app</code>.</li>
                    </ol>
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800">Phương Án 2: Netlify</span>
                      <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold">Dễ dàng</span>
                    </div>
                    <ol className="text-xs text-slate-600 list-decimal list-inside space-y-1 leading-relaxed">
                      <li>Truy cập <a href="https://www.netlify.com" target="_blank" rel="noreferrer" className="text-emerald-600 font-semibold underline">netlify.com</a> &gt; Đăng nhập bằng GitHub.</li>
                      <li>Chọn <strong>"Add new site"</strong> &gt; <strong>"Import an existing project"</strong>.</li>
                      <li>Build command: <code className="text-slate-800 font-mono bg-slate-100 px-1 py-0.5 rounded">npm run build</code>, Publish directory: <code className="text-slate-800 font-mono bg-slate-100 px-1 py-0.5 rounded">dist</code>.</li>
                      <li>Bấm <strong>"Deploy Site"</strong> để hoàn tất.</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* STEP 3 */}
              <div className="p-5 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-3 text-emerald-950">
                <h3 className="text-sm font-bold flex items-center gap-2 text-emerald-900">
                  <span className="w-6 h-6 rounded-full bg-emerald-700 text-white text-xs flex items-center justify-center font-bold">3</span>
                  Lưu Trữ Dữ Liệu Vĩnh Viễn Trên Google Sheet
                </h3>
                <p className="text-xs leading-relaxed text-emerald-900">
                  Sau khi web được deploy lên Vercel/Netlify, bạn chỉ cần mở link web trên bất kỳ máy tính/điện thoại nào, dán URL Google Apps Script vào ô kết nối. Dữ liệu bảng lương, chấm công, KPI của toàn bộ nhân viên Triple D sẽ được đọc & ghi trực tiếp trên Google Sheet của bạn!
                </p>
                <div className="flex items-center gap-2 pt-1 text-xs font-semibold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Không lo mất dữ liệu khi đổi thiết bị hay xóa lịch sử trình duyệt!
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal For Clear Sample Data */}
      {confirmClearModal && (
        <div id="confirm-clear-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-bold text-slate-900">Xác Nhận Xóa Sạch Dữ Liệu Mẫu?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Hành động này sẽ xóa toàn bộ nhân viên mẫu, bảng công mẫu và phiếu lương mẫu hiện tại. Hệ thống sẽ ở trạng thái trống sạch sẽ để sẵn sàng tải dữ liệu nhân viên thật từ Google Sheet của bạn.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                id="cancel-clear-btn"
                onClick={() => setConfirmClearModal(false)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
              >
                Hủy bỏ
              </button>
              <button
                id="confirm-clear-action-btn"
                onClick={() => {
                  clearAllSampleData();
                  setConfirmClearModal(false);
                  setActionFeedback({ type: 'success', text: 'Đã xóa sạch dữ liệu mẫu. Sẵn sàng kết nối Google Sheet!' });
                }}
                className="py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/20 transition-all"
              >
                Đồng ý xóa mẫu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
