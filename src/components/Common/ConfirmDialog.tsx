import React from 'react';
import { AlertTriangle, AlertCircle, Info, Trash2, X } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode | string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  icon?: 'trash' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
  variant = 'primary',
  icon,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconBg: 'bg-rose-100 text-rose-600',
          btnClass: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-600/30',
        };
      case 'warning':
        return {
          iconBg: 'bg-amber-100 text-amber-600',
          btnClass: 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm shadow-amber-600/30',
        };
      case 'primary':
      default:
        return {
          iconBg: 'bg-emerald-100 text-emerald-700',
          btnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/30',
        };
    }
  };

  const styles = getVariantStyles();

  const renderIcon = () => {
    if (icon === 'trash' || variant === 'danger') {
      return <Trash2 className="w-6 h-6" />;
    }
    if (variant === 'warning') {
      return <AlertTriangle className="w-6 h-6" />;
    }
    return <Info className="w-6 h-6" />;
  };

  return (
    <div
      id="global-confirm-dialog-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onCancel}
    >
      <div
        id="global-confirm-dialog-card"
        className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200/80 space-y-4 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Đóng"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-2xl shrink-0 ${styles.iconBg}`}>
            {renderIcon()}
          </div>
          <div className="space-y-1.5 flex-1 pr-4">
            <h3 className="text-base font-bold text-slate-900 leading-snug">{title}</h3>
            <div className="text-xs text-slate-600 leading-relaxed font-normal">
              {typeof message === 'string' ? <p>{message}</p> : message}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onCancel();
            }}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer ${styles.btnClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
