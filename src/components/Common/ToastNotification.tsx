import React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export interface ToastProps {
  isOpen: boolean;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
}

export const ToastNotification: React.FC<ToastProps> = ({
  isOpen,
  message,
  type = 'success',
  onClose,
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'error':
        return {
          bg: 'bg-rose-900/95 text-rose-50 border-rose-700/50',
          icon: <AlertCircle className="w-5 h-5 text-rose-300 shrink-0" />,
        };
      case 'warning':
        return {
          bg: 'bg-amber-900/95 text-amber-50 border-amber-700/50',
          icon: <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0" />,
        };
      case 'info':
        return {
          bg: 'bg-slate-900/95 text-slate-50 border-slate-700/50',
          icon: <Info className="w-5 h-5 text-sky-300 shrink-0" />,
        };
      case 'success':
      default:
        return {
          bg: 'bg-emerald-900/95 text-emerald-50 border-emerald-700/50',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />,
        };
    }
  };

  const current = getTypeStyles();

  return (
    <div
      id="global-toast-notification"
      className="fixed bottom-6 right-6 z-50 flex justify-end pointer-events-none"
    >
      <div
        className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md max-w-md w-fit animate-in slide-in-from-bottom-3 duration-200 ${current.bg}`}
      >
        <div className="shrink-0 flex items-center justify-center">
          {current.icon}
        </div>
        <div className="text-xs font-semibold leading-snug whitespace-normal break-words text-left">
          {message}
        </div>
        <button
          onClick={onClose}
          className="p-1 -mr-1 text-white/70 hover:text-white rounded-md hover:bg-white/10 transition-colors shrink-0 ml-1.5 cursor-pointer"
          aria-label="Đóng"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
