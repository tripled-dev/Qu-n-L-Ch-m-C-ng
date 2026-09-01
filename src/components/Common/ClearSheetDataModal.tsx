import React, { useState } from 'react';
import { Lock, Trash2, X, AlertTriangle, Loader2 } from 'lucide-react';

interface ClearSheetDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmClear: () => Promise<void> | void;
}

export const ClearSheetDataModal: React.FC<ClearSheetDataModalProps> = ({
  isOpen,
  onClose,
  onConfirmClear,
}) => {
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim() !== '260606') {
      setErrorMsg('Mật khẩu xác nhận không chính xác! (Gợi ý: 260606)');
      return;
    }

    setErrorMsg('');
    setIsProcessing(true);
    try {
      await onConfirmClear();
      setPassword('');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Đã xảy ra lỗi khi thực hiện xóa dữ liệu.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (isProcessing) return;
    setPassword('');
    setErrorMsg('');
    onClose();
  };

  return (
    <div
      id="clear-sheet-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        id="clear-sheet-modal-card"
        className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-200 space-y-4 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          disabled={isProcessing}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
          aria-label="Đóng"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl shrink-0 bg-rose-100 text-rose-600">
            <Trash2 className="w-6 h-6" />
          </div>
          <div className="space-y-1.5 flex-1 pr-4">
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700 rounded-md">Bảo mật cấp cao</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 leading-snug">
              Xóa Hết Dữ Liệu Từ Google Sheet
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Hành động này sẽ <strong>xóa trắng toàn bộ dữ liệu</strong> trên Google Sheet liên kết (Nhân sự, Chấm công, Đánh giá KPI, Phiếu lương) và dọn sạch dữ liệu trên ứng dụng web.
            </p>
          </div>
        </div>

        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-800">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>Vui lòng nhập mật khẩu quản trị viên để xác thực thao tác nguy hiểm này.</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Mật khẩu xác nhận:
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="w-4 h-4 text-slate-400" />
              </div>
              <input
                id="clear-sheet-password-input"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="Nhập mã 260606..."
                autoFocus
                disabled={isProcessing}
                className={`w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border rounded-xl focus:bg-white focus:outline-hidden transition-all ${
                  errorMsg ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20' : 'border-slate-200 focus:border-slate-800 focus:ring-2 focus:ring-slate-800/10'
                }`}
              />
            </div>
            {errorMsg && (
              <p className="mt-1.5 text-xs font-semibold text-rose-600 flex items-center gap-1">
                <span>{errorMsg}</span>
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              disabled={isProcessing}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              id="confirm-clear-sheet-btn"
              disabled={!password.trim() || isProcessing}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 rounded-xl transition-colors cursor-pointer shadow-sm shadow-rose-600/30 flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang xóa trên Google Sheet...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xác nhận Xóa Hết (Pass: 260606)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
