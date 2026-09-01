import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { GOOGLE_APPS_SCRIPT_TEMPLATE, FIXED_GOOGLE_APPS_SCRIPT_URL } from '../../utils/googleSheetsSync';
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
  Lock,
  Zap,
  Users,
  CalendarCheck,
  Receipt,
  RefreshCw
} from 'lucide-react';

export const GoogleSheetsIntegration: React.FC = () => {
  const {
    googleSheetUrl,
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
    showConfirm,
    showToast,
  } = useApp();

  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [showCodePreview, setShowCodePreview] = useState(false);

  const activeUrl = googleSheetUrl || FIXED_GOOGLE_APPS_SCRIPT_URL;

  const handlePull = async () => {
    const res = await pullDataFromGoogleSheet(activeUrl);
    if (res.success) {
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'error');
    }
  };

  const handlePush = async () => {
    const res = await pushDataToGoogleSheet(activeUrl);
    if (res.success) {
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(activeUrl);
    setCopiedUrl(true);
    showToast('Đã sao chép liên kết Google Apps Script!', 'success');
    setTimeout(() => setCopiedUrl(false), 2500);
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
            <p className="text-xs text-slate-500">Lưu trữ tập trung và tự động đồng bộ 2 chiều dữ liệu nhân sự, công nhật & bảng lương</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {lastSyncTime ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-xl text-xs font-semibold self-start sm:self-auto">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Đồng bộ: {lastSyncTime}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              <span>Tự động đồng bộ bật</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Connection & Fixed URL Card */}
      <div id="gsheet-sync-card" className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold">
              <Lock className="w-3.5 h-3.5" />
              Đã Khóa Cố Định GAS URL
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-200/60">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Tự Động Ghi Nhận Mọi Chỉnh Sửa
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopyUrl}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold px-2 py-1 rounded-md hover:bg-slate-100 transition-colors self-start cursor-pointer"
          >
            {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedUrl ? 'Đã chép link' : 'Sao chép link GAS'}</span>
          </button>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Liên Kết Quản Lý Google Apps Script Cố Định
          </label>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-slate-800 font-mono text-xs overflow-x-auto select-all">
            <span className="text-emerald-900 font-semibold truncate">{activeUrl}</span>
            <span className="shrink-0 px-2 py-0.5 bg-emerald-200/80 text-emerald-900 rounded text-[11px] font-sans font-bold">
              KẾT NỐI CHÍNH THỨC
            </span>
          </div>
          <p className="text-xs text-slate-500 italic">
            Tất cả thao tác chỉnh sửa nhân sự, thêm/xóa công, đánh giá KPI, phê duyệt phiếu lương và cài đặt đều được tự động lưu lên liên kết Google Apps Script này.
          </p>
        </div>

        {/* Sync Status Banner */}
        {syncStatusMessage.text && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
              syncStatusMessage.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : syncStatusMessage.type === 'syncing'
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            {syncStatusMessage.type === 'syncing' && <RefreshCw className="w-4 h-4 animate-spin text-amber-600 shrink-0" />}
            {syncStatusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {syncStatusMessage.type === 'error' && <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />}
            <span className="font-medium">{syncStatusMessage.text}</span>
          </div>
        )}

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
            className="py-3 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer"
          >
            <CloudUpload className={`w-4 h-4 ${isSyncingGoogleSheet ? 'animate-bounce' : ''}`} />
            <span>{isSyncingGoogleSheet ? 'Đang ghi lên Sheet...' : 'Lưu Dữ Liệu Lên Sheet Ngay (Push)'}</span>
          </button>
        </div>
      </div>

      {/* Data Management & Current Count */}
      <div id="gsheet-data-stats-card" className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-800">Trạng Thái Dữ Liệu Đồng Bộ</h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2.5">
            <Users className="w-4 h-4 text-indigo-600 shrink-0" />
            <div>
              <div className="text-base font-bold text-slate-900">{staffList.length}</div>
              <div className="text-[11px] text-slate-500">Nhân sự (Sheet NhanSu)</div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2.5">
            <CalendarCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <div className="text-base font-bold text-slate-900">{timesheetEntries.length}</div>
              <div className="text-[11px] text-slate-500">Lượt công (Sheet ChamCong)</div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <div className="text-base font-bold text-slate-900">{evaluations.length}</div>
              <div className="text-[11px] text-slate-500">Đánh giá (Sheet DanhGiaKPI)</div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2.5">
            <Receipt className="w-4 h-4 text-sky-600 shrink-0" />
            <div>
              <div className="text-base font-bold text-slate-900">{payrollSlips.length}</div>
              <div className="text-[11px] text-slate-500">Phiếu lương (Sheet PhieuLuong)</div>
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

      {/* Reference Script Code & Guide */}
      <div id="gsheet-setup-guide-card" className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Mã Nguồn Google Apps Script Mẫu (Code.gs)</h2>
            <p className="text-xs text-slate-500">Mã nguồn đồng bộ 5 sheets (NhanSu, ChamCong, DanhGiaKPI, PhieuLuong, CauHinh)</p>
          </div>
          <button
            type="button"
            onClick={handleCopyScript}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
          >
            {copiedScript ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedScript ? 'Đã Sao Chép!' : 'Sao Chép Code.gs'}</span>
          </button>
        </div>

        {/* Toggle View Full Code */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowCodePreview(!showCodePreview)}
            className="text-xs text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
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
    </div>
  );
};

