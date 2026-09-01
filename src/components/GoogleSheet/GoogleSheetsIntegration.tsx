import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { GOOGLE_APPS_SCRIPT_TEMPLATE } from '../../utils/googleSheetsSync';
import {
  FileSpreadsheet,
  CloudDownload,
  CloudUpload,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  Code2,
  RotateCcw,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Database,
  Users,
  CalendarCheck,
  Receipt
} from 'lucide-react';

export const GoogleSheetsIntegration: React.FC = () => {
  const {
    googleSheetUrl,
    setGoogleSheetUrl,
    isSyncingGoogleSheet,
    lastSyncTime,
    pullDataFromGoogleSheet,
    pushDataToGoogleSheet,
    clearAllSampleData,
    resetToSampleData,
    staffList,
    timesheetEntries,
    evaluations,
    payrollSlips,
    showConfirm,
    showToast,
  } = useApp();

  const [inputUrl, setInputUrl] = useState(googleSheetUrl);
  const [copiedScript, setCopiedScript] = useState(false);
  const [showCodePreview, setShowCodePreview] = useState(false);

  const handleSaveUrl = () => {
    setGoogleSheetUrl(inputUrl.trim());
    showToast('Đã lưu URL kết nối Google Apps Script!', 'success');
  };

  const handlePull = async () => {
    if (!inputUrl.trim()) {
      showToast('Vui lòng nhập URL Google Apps Script trước khi tải dữ liệu!', 'warning');
      return;
    }
    setGoogleSheetUrl(inputUrl.trim());
    const res = await pullDataFromGoogleSheet(inputUrl.trim());
    if (res.success) {
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'error');
    }
  };

  const handlePush = async () => {
    if (!inputUrl.trim()) {
      showToast('Vui lòng nhập URL Google Apps Script trước khi lưu dữ liệu!', 'warning');
      return;
    }
    setGoogleSheetUrl(inputUrl.trim());
    const res = await pushDataToGoogleSheet(inputUrl.trim());
    if (res.success) {
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
    setCopiedScript(true);
    showToast('Đã sao chép toàn bộ mã nguồn Apps Script vào bộ nhớ tạm!', 'success');
    setTimeout(() => setCopiedScript(false), 2500);
  };

  return (
    <div id="google-sheets-integration-page" className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Đồng Bộ Dữ Liệu Google Sheet</h1>
            <p className="text-xs text-slate-500">Lưu trữ tập trung và đồng bộ 2 chiều dữ liệu nhân sự, công nhật & phiếu lương</p>
          </div>
        </div>

        {lastSyncTime && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-xl text-xs font-semibold self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Đã đồng bộ: {lastSyncTime}</span>
          </div>
        )}
      </div>

      {/* Main Connection & Sync Card */}
      <div id="gsheet-sync-card" className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            URL Ứng Dụng Web Apps Script (Kết thúc bằng /exec)
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="gsheet-url-input"
              type="url"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-800"
            />
            <button
              id="save-gsheet-url-btn"
              type="button"
              onClick={handleSaveUrl}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer"
            >
              Lưu URL
            </button>
          </div>
        </div>

        {/* Sync Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            id="pull-from-gsheet-btn"
            type="button"
            onClick={handlePull}
            disabled={isSyncingGoogleSheet}
            className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-xl font-bold text-xs shadow-sm shadow-emerald-600/20 flex items-center justify-center gap-2.5 transition-all cursor-pointer"
          >
            <CloudDownload className={`w-4 h-4 ${isSyncingGoogleSheet ? 'animate-bounce' : ''}`} />
            <span>{isSyncingGoogleSheet ? 'Đang kết nối...' : 'Tải Dữ Liệu Từ Sheet Về (Pull)'}</span>
          </button>

          <button
            id="push-to-gsheet-btn"
            type="button"
            onClick={handlePush}
            disabled={isSyncingGoogleSheet}
            className="py-3 px-4 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 text-white rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer"
          >
            <CloudUpload className={`w-4 h-4 ${isSyncingGoogleSheet ? 'animate-bounce' : ''}`} />
            <span>{isSyncingGoogleSheet ? 'Đang ghi lên Sheet...' : 'Lưu Dữ Liệu Lên Sheet (Push)'}</span>
          </button>
        </div>
      </div>

      {/* 3-Step Setup Guide & Script Copy */}
      <div id="gsheet-setup-guide-card" className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Hướng Dẫn Kết Nối Trong 2 Phút</h2>
            <p className="text-xs text-slate-500">Chỉ cần làm một lần duy nhất trên Google Sheet của bạn</p>
          </div>
          <button
            type="button"
            onClick={handleCopyScript}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
          >
            {copiedScript ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedScript ? 'Đã Sao Chép!' : 'Sao Chép Mã Apps Script'}</span>
          </button>
        </div>

        {/* 3 simple steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center">1</span>
              <span className="text-xs font-bold text-slate-800">Mở Apps Script</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Mở Google Sheet mới $\rightarrow$ Chọn <strong>Tiện ích mở rộng</strong> $\rightarrow$ <strong>Apps Script</strong>.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center">2</span>
              <span className="text-xs font-bold text-slate-800">Dán Mã & Lưu</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Xóa code cũ trong file <code>Code.gs</code>, dán mã vừa sao chép vào $\rightarrow$ Nhấn <strong>Lưu (Ctrl+S)</strong>.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center">3</span>
              <span className="text-xs font-bold text-slate-800">Triển Khai Web App</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Bấm <strong>Triển khai mới</strong> $\rightarrow$ Chọn <strong>Ứng dụng web</strong> $\rightarrow$ Quyền truy cập: <strong>Bất kỳ ai</strong> $\rightarrow$ Copy link dán vào ô trên.
            </p>
          </div>
        </div>

        {/* Toggle View Full Code if needed */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowCodePreview(!showCodePreview)}
            className="text-xs text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>{showCodePreview ? 'Ẩn xem trước mã nguồn' : 'Xem trước mã nguồn Apps Script (Code.gs)'}</span>
            {showCodePreview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showCodePreview && (
            <div className="mt-3 p-4 bg-slate-900 rounded-xl text-slate-200 font-mono text-[11px] max-h-72 overflow-y-auto border border-slate-800 animate-in fade-in">
              <pre>{GOOGLE_APPS_SCRIPT_TEMPLATE}</pre>
            </div>
          )}
        </div>
      </div>

      {/* Data Management & Current Count */}
      <div id="gsheet-data-stats-card" className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-800">Trạng Thái Dữ Liệu Trong Ứng Dụng</h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2.5">
            <Users className="w-4 h-4 text-indigo-600 shrink-0" />
            <div>
              <div className="text-base font-bold text-slate-900">{staffList.length}</div>
              <div className="text-[11px] text-slate-500">Nhân sự</div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2.5">
            <CalendarCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <div className="text-base font-bold text-slate-900">{timesheetEntries.length}</div>
              <div className="text-[11px] text-slate-500">Lượt công</div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <div className="text-base font-bold text-slate-900">{evaluations.length}</div>
              <div className="text-[11px] text-slate-500">Đánh giá KPI</div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2.5">
            <Receipt className="w-4 h-4 text-sky-600 shrink-0" />
            <div>
              <div className="text-base font-bold text-slate-900">{payrollSlips.length}</div>
              <div className="text-[11px] text-slate-500">Phiếu lương</div>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              showConfirm({
                title: 'Xóa sạch dữ liệu mẫu',
                message: 'Bạn có chắc chắn muốn xóa toàn bộ nhân sự mẫu, bảng công và phiếu lương mẫu để chuẩn bị nạp dữ liệu thật từ Google Sheet?',
                confirmText: 'Xóa sạch mẫu',
                variant: 'danger',
                icon: 'trash',
                onConfirm: () => {
                  clearAllSampleData();
                  showToast('Đã xóa sạch dữ liệu mẫu!', 'info');
                },
              });
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>Xóa Sạch Dữ Liệu Mẫu</span>
          </button>

          <button
            type="button"
            onClick={() => {
              showConfirm({
                title: 'Khôi phục dữ liệu mẫu ban đầu',
                message: 'Thao tác này sẽ đặt lại dữ liệu về trạng thái mẫu ban đầu của Triple D. Bạn có muốn tiếp tục?',
                confirmText: 'Khôi phục mẫu',
                variant: 'warning',
                onConfirm: () => {
                  resetToSampleData();
                  showToast('Đã khôi phục dữ liệu mẫu ban đầu!', 'success');
                },
              });
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>Khôi Phục Dữ Liệu Mẫu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
