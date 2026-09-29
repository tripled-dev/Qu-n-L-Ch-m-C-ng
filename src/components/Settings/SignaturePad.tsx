import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Trash2, 
  Check, 
  Eye, 
  Layers, 
  AlertCircle,
  FileImage,
  PenTool
} from 'lucide-react';
import { makeSignatureBackgroundTransparent } from '../../utils/signaturePresets';

interface SignaturePadProps {
  currentSignature?: string;
  showSignatures: boolean;
  onSaveSignature: (signatureDataUrl: string) => void;
  onToggleShowSignatures: (show: boolean) => void;
  onClearSignature: () => void;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  currentSignature,
  showSignatures,
  onSaveSignature,
  onToggleShowSignatures,
  onClearSignature,
}) => {
  // Upload state
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [autoRemoveWhiteBg, setAutoRemoveWhiteBg] = useState<boolean>(true);
  const [isProcessingImg, setIsProcessingImg] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const processFile = (file: File) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Kích thước ảnh không được vượt quá 5MB');
      return;
    }

    setIsProcessingImg(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      let dataUrl = event.target?.result as string;
      if (autoRemoveWhiteBg && (file.type === 'image/jpeg' || file.type === 'image/jpg' || file.type === 'image/png')) {
        try {
          dataUrl = await makeSignatureBackgroundTransparent(dataUrl);
        } catch (err) {
          console.warn('Không thể tự động tách nền, sử dụng ảnh gốc:', err);
        }
      }
      setUploadPreview(dataUrl);
      setIsProcessingImg(false);
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleSaveUploadedSignature = () => {
    if (uploadPreview) {
      onSaveSignature(uploadPreview);
      setUploadPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCancelPreview = () => {
    setUploadPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
      
      {/* Header & Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-700 text-white flex items-center justify-center shrink-0">
              <PenTool className="w-3.5 h-3.5" />
            </div>
            <h4 className="font-bold text-sm sm:text-base text-slate-900">
              Chữ Ký Điện Tử: Trần Hạnh Dung (Bên A / Người Thuê)
            </h4>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tải ảnh chữ ký thật để tự động chèn vào Hợp đồng khoán việc, Bảng thanh toán thù lao và Thông báo
          </p>
        </div>

        {/* Global Show/Hide Toggle */}
        <div className="flex items-center gap-2 shrink-0 bg-white px-3 py-1.5 rounded-lg border border-slate-300 shadow-2xs">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showSignatures}
              onChange={(e) => onToggleShowSignatures(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-700"></div>
          </label>
          <span className="text-xs font-bold text-slate-800">
            {showSignatures ? 'Đang bật hiển thị' : 'Tắt (Để trống ký tay)'}
          </span>
        </div>
      </div>

      {/* Current Active Signature Preview */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            Chữ ký đang áp dụng hiện tại:
          </span>
          {currentSignature ? (
            <button
              type="button"
              onClick={onClearSignature}
              className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 cursor-pointer transition-colors px-2 py-1 rounded hover:bg-red-50"
              title="Xóa ảnh chữ ký hiện tại để để trống"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa chữ ký</span>
            </button>
          ) : (
            <span className="text-xs text-slate-400 italic">Chưa có chữ ký (đang để trống để ký tay)</span>
          )}
        </div>

        <div className="h-28 bg-slate-50/70 border border-dashed border-slate-300 rounded-lg flex items-center justify-center p-3 relative overflow-hidden">
          {currentSignature ? (
            <div className="text-center">
              <img
                src={currentSignature}
                alt="Chữ ký Trần Hạnh Dung"
                className="max-h-20 max-w-full object-contain mx-auto pointer-events-none drop-shadow-2xs"
              />
              <p className="text-[11px] font-serif font-bold text-slate-700 mt-1">Trần Hạnh Dung</p>
            </div>
          ) : (
            <div className="text-center text-slate-400 text-xs">
              <FileImage className="w-6 h-6 mx-auto mb-1 opacity-40 text-slate-500" />
              <p className="font-medium text-slate-600">Chưa tải ảnh chữ ký.</p>
              <p className="text-[11px] text-slate-400">Khi để trống, các văn bản in ra sẽ có chỗ trống để ký bút mực trực tiếp.</p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Box */}
      <div className="bg-white rounded-lg p-4 border border-slate-200 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Upload className="w-4 h-4 text-teal-700" />
          <h5 className="font-bold text-xs sm:text-sm text-slate-900">
            Tải Ảnh Chữ Ký Lên (Từ máy tính hoặc điện thoại)
          </h5>
        </div>

        {/* Dropzone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-teal-600 bg-teal-50/50'
              : 'border-slate-300 hover:border-teal-500 hover:bg-slate-50/60'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            accept="image/png,image/jpeg,image/jpg,image/svg+xml"
            onChange={handleFileUpload}
            className="hidden"
          />
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 group-hover:scale-110 transition-transform">
              <Upload className="w-5 h-5 text-teal-700" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-slate-800">
                Nhấn vào đây để chọn file ảnh hoặc kéo thả ảnh chữ ký vào khung
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Hỗ trợ định dạng PNG (nền trong suốt), JPG, JPEG hoặc SVG (Tối đa 5MB)
              </p>
            </div>
          </div>
        </div>

        {/* Auto remove background option */}
        <label className="flex items-center gap-2.5 cursor-pointer select-none bg-slate-50 p-3 rounded-lg border border-slate-200">
          <input
            type="checkbox"
            checked={autoRemoveWhiteBg}
            onChange={(e) => setAutoRemoveWhiteBg(e.target.checked)}
            className="rounded border-slate-300 text-teal-700 focus:ring-teal-700 w-4 h-4"
          />
          <div className="text-xs">
            <span className="font-bold text-slate-800">Tự động tách nền trắng </span>
            <span className="text-slate-500">(Khuyên dùng khi bạn chụp ảnh chữ ký trên giấy trắng bằng điện thoại)</span>
          </div>
        </label>

        {isProcessingImg && (
          <div className="text-xs text-teal-700 font-medium animate-pulse flex items-center gap-1.5 p-2 bg-teal-50 rounded">
            <Layers className="w-4 h-4 animate-spin" />
            Đang xử lý ảnh & tách nền trong suốt...
          </div>
        )}

        {/* Preview of newly uploaded file before applying */}
        {uploadPreview && (
          <div className="space-y-3 pt-3 border-t border-slate-200 bg-teal-50/30 p-3 rounded-lg border">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-teal-700" />
              Xem trước ảnh chữ ký vừa chọn:
            </span>
            
            <div className="h-28 bg-white border border-dashed border-teal-300 rounded-lg flex items-center justify-center p-3">
              <img
                src={uploadPreview}
                alt="Xem trước ảnh tải lên"
                className="max-h-24 max-w-full object-contain pointer-events-none drop-shadow-2xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleCancelPreview}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 rounded font-semibold cursor-pointer transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSaveUploadedSignature}
                className="px-4 py-1.5 bg-teal-700 hover:bg-teal-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Lưu & Áp dụng chữ ký này</span>
              </button>
            </div>
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-start gap-2 text-[11px] text-amber-800">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
          <span>
            <strong>Gợi ý:</strong> Chụp ảnh chữ ký trên một tờ giấy trắng dưới ánh sáng đều. Khi tải lên, hệ thống sẽ tự động lọc nền trắng để chữ ký hòa nhập tự nhiên và sắc nét vào các bản hợp đồng.
          </span>
        </div>
      </div>

    </div>
  );
};
