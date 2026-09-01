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
      className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-in slide-in-from-bottom-5 duration-300"
    >
      <div
        className={`flex items-start gap-3 p-4 rounded-2xl shadow-xl border backdrop-blur-md ${current.bg}`}
      >
        {current.icon}
        <div className="flex-1 text-xs font-medium leading-relaxed pr-2">
          {message}
        </div>
        <button
          onClick={onClose}
          className="p-1 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Đóng"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
