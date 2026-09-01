import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { GOOGLE_APPS_SCRIPT_TEMPLATE, FIXED_GOOGLE_APPS_SCRIPT_URL } from '../../utils/googleSheetsSync';
import { ClearSheetDataModal } from '../Common/ClearSheetDataModal';
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
  RefreshCw,
  ShieldAlert,
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
    wipeGoogleSheetAndLocalData,
    clearAllSampleData,
    resetToSampleData,
    staffList,
    timesheetEntries,
    evaluations,
    payrollSlips,
    showConfirm,
    showToast,
  } = useApp();

  const [inputUrl, setInputUrl] = useState<string>(googleSheetUrl);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [showCodePreview, setShowCodePreview] = useState(false);
  const [showClearSheetModal, setShowClearSheetModal] = useState(false);

  const handleSaveUrl = async () => {
    const trimmed = inputUrl.trim();
    setGoogleSheetUrl(trimmed);
    if (trimmed) {
      showToast('Đã lưu liên kết! Đang tải dữ liệu từ Google Sheet...', 'info');
      const res = await pullDataFromGoogleSheet(trimmed);
      if (res.success) {
        showToast('Đồng bộ dữ liệu từ Google Sheet thành công!', 'success');
      } else {
        showToast(res.message, 'error');
      }
    } else {
      showToast('Đã xóa URL. Chuyển sang dữ liệu mẫu 1 nhân viên.', 'success');
    }
  };

  const handleClearUrlAndReset = () => {
    showConfirm({
      title: 'Xóa kết nối Google Sheet?',
      message: 'Hành động này sẽ gỡ bỏ URL liên kết, đồng thời xóa toàn bộ dữ liệu cục bộ hiện tại và khôi phục về dữ liệu mẫu 1 nhân viên. Dữ liệu trên Google Sheet của bạn (nếu có) sẽ không bị ảnh hưởng. Bạn có chắc chắn không?',
      confirmText: 'Xác nhận xóa',
      variant: 'warning',
      onConfirm: () => {
        setInputUrl('');
        setGoogleSheetUrl('');
        resetToSampleData();
        showToast('Đã xóa URL và khôi phục mẫu 1 nhân viên!', 'info');
      }
    });
  };

  const handlePull = async () => {
    const urlToUse = inputUrl.trim() || googleSheetUrl;
    if (!urlToUse) {
      showToast('Vui lòng nhập URL Google Apps Script trước khi tải dữ liệu!', 'warning');
      return;
    }
    
    showConfirm({
      title: 'Tải Dữ Liệu Từ Google Sheet?',
      message: 'Hành động này sẽ TẢI toàn bộ dữ liệu từ Google Sheet về máy, GHI ĐÈ lên các thay đổi cục bộ chưa được đồng bộ (nếu có). Bạn có chắc chắn muốn tiếp tục?',
      confirmText: 'Tải dữ liệu',
      variant: 'primary',
      onConfirm: async () => {
        setGoogleSheetUrl(urlToUse);
        const res = await pullDataFromGoogleSheet(urlToUse);
        if (res.success) {
          showToast(res.message, 'success');
        } else {
          showToast(res.message, 'error');
        }
      }
    });
  };

  const handlePush = async () => {
    const urlToUse = inputUrl.trim() || googleSheetUrl;
    if (!urlToUse) {
      showToast('Vui lòng nhập URL Google Apps Script trước khi đẩy dữ liệu!', 'warning');
      return;
    }

    showConfirm({
      title: 'Đẩy Dữ Liệu Lên Google Sheet?',
      message: 'Hành động này sẽ đẩy dữ liệu hiện tại lên Google Sheet, GHI ĐÈ dữ liệu đang có trên Sheet. Hãy chắc chắn bạn muốn lưu phiên bản hiện tại lên máy chủ. Tiếp tục?',
      confirmText: 'Đẩy dữ liệu',
      variant: 'primary',
      onConfirm: async () => {
        setGoogleSheetUrl(urlToUse);
        const res = await pushDataToGoogleSheet(urlToUse);
        if (res.success) {
          showToast(res.message, 'success');
        } else {
          showToast(res.message, 'error');
        }
      }
    });
  };

  const handleCopyUrl = () => {
    const urlToCopy = inputUrl || googleSheetUrl || FIXED_GOOGLE_APPS_SCRIPT_URL;
    navigator.clipboard.writeText(urlToCopy);
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
              <span>{googleSheetUrl ? 'Tự động đồng bộ bật' : 'Chế độ Nội Bộ (Mẫu 1 NV)'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Connection & Dynamic Input URL Card */}
      <div id="gsheet-sync-card" className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            {googleSheetUrl ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Đã Cấu Hình URL Google Apps Script
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-bold">
                <Users className="w-3.5 h-3.5 text-amber-600" />
                Chưa Nhập URL - Hiển Thị Mẫu 1 Nhân Viên
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-200/60">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Tự Động Lưu Dữ Liệu
            </span>
          </div>

          {(inputUrl || googleSheetUrl) && (
            <button
              type="button"
              onClick={handleCopyUrl}
              className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold px-2 py-1 rounded-md hover:bg-slate-100 transition-colors self-start cursor-pointer"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedUrl ? 'Đã chép link' : 'Sao chép link Web App'}</span>
            </button>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="input-gas-web-app-url" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Nhập Liên Kết Web App Google Apps Script
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              id="input-gas-web-app-url"
              type="url"
              value={inputUrl}
              onChange={e => setInputUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/20 rounded-xl text-slate-900 font-mono text-xs transition-all outline-none"
            />
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleSaveUrl}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Lưu URL
              </button>
              {googleSheetUrl && (
                <button
                  type="button"
                  onClick={handleClearUrlAndReset}
                  title="Xóa URL đã lưu và khôi phục mẫu 1 nhân viên"
                  className="px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Xóa URL
                </button>
              )}
            </div>
          </div>
          <p className="text-xs text-slate-500 italic">
            {!googleSheetUrl
              ? '💡 Bạn chưa nhập URL Google Sheet. Ứng dụng đang ở chế độ nội bộ với dữ liệu mẫu 1 nhân viên. Nhập URL ứng dụng web Google Apps Script để kết nối và tự động lưu dữ liệu thực.'
              : 'Tất cả thao tác chỉnh sửa nhân sự, thêm/xóa công nhật, đánh giá KPI và bảng lương sẽ được tự động đồng bộ 2 chiều với liên kết Google Sheet này.'}
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
          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="open-clear-sheet-password-modal-btn"
              type="button"
              onClick={() => setShowClearSheetModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-rose-600/20 cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4 text-white" />
              <span>Xóa Hết Dữ Liệu Từ Sheet (Pass: 260606)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                showConfirm({
                  title: 'Làm sạch dữ liệu hiển thị trên ứng dụng',
                  message: 'Bạn có chắc chắn muốn dọn sạch bảng tạm trên web để chuẩn bị nạp lại từ Google Sheet?',
                  confirmText: 'Làm sạch giao diện',
                  variant: 'warning',
                  icon: 'trash',
                  onConfirm: () => {
                    clearAllSampleData();
                    showToast('Đã làm sạch dữ liệu hiển thị trên ứng dụng!', 'info');
                  },
                });
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Làm Sạch Dữ Liệu Tạm</span>
            </button>
          </div>

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

      {/* Modal Xóa Toàn Bộ Dữ Liệu Sheet có bảo mật mật khẩu 260606 */}
      <ClearSheetDataModal
        isOpen={showClearSheetModal}
        onClose={() => setShowClearSheetModal(false)}
        onConfirmClear={async () => {
          const res = await wipeGoogleSheetAndLocalData(inputUrl.trim() || googleSheetUrl);
          if (res.success) {
            showToast(res.message || 'Đã xóa toàn bộ dữ liệu trên Google Sheet và ứng dụng!', 'success');
          } else {
            showToast(res.message || 'Lỗi khi xóa dữ liệu trên Google Sheet.', 'error');
          }
        }}
      />
    </div>
  );
};

