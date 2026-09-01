import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { OrgSettings } from '../../types';
import { Settings, Save, RotateCcw, Download, Upload, ShieldCheck, FileCheck, Trash2, Image as ImageIcon, FileSpreadsheet, ArrowRight, ShieldAlert } from 'lucide-react';
import { ManagerSignatureSvg, FinanceSignatureSvg } from '../../utils/signatures';
import { ClearSheetDataModal } from '../Common/ClearSheetDataModal';

export const SettingsView: React.FC = () => {
  const { 
    orgSettings, 
    updateOrgSettings, 
    resetToSampleData, 
    exportBackupJson, 
    importBackupJson, 
    clearAllSampleData,
    wipeGoogleSheetAndLocalData,
    googleSheetUrl,
    setActiveTab,
    showConfirm,
    showToast,
  } = useApp();
  const [formData, setFormData] = useState<OrgSettings>({ ...orgSettings });
  const [saved, setSaved] = useState(false);
  const [showClearSheetModal, setShowClearSheetModal] = useState(false);
  const managerImgInputRef = React.useRef<HTMLInputElement>(null);
  const financeImgInputRef = React.useRef<HTMLInputElement>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateOrgSettings(formData);
    setSaved(true);
    showToast('Đã lưu cấu hình đơn vị & chữ ký thành công!', 'success');
    setTimeout(() => setSaved(false), 3000);
  };

  const handleSignatureImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'managerSignatureImg' | 'financeSignatureImg'
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('Vui lòng chọn ảnh dung lượng dưới 2MB', 'warning');
        return;
      }
      const reader = new FileReader();
      reader.onload = event => {
        const base64 = event.target?.result as string;
        setFormData(prev => ({ ...prev, [field]: base64 }));
        showToast('Đã tải ảnh chữ ký thành công!', 'success');
      };
      reader.readAsDataURL(file);
    }
  };
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = event => {
        const content = event.target?.result as string;
        if (content) {
          const success = importBackupJson(content);
          if (success) {
            showToast('Khôi phục dữ liệu từ file JSON thành công!', 'success');
            setTimeout(() => window.location.reload(), 800);
          } else {
            showToast('File sao lưu không hợp lệ.', 'error');
          }
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900">
              Cấu Hình Tổ Chức & Chữ Ký Phê Duyệt
            </h3>
            <p className="text-xs text-slate-500">
              Thiết lập thông tin trung tâm, người ký duyệt trên phiếu lương và thông báo
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Org Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tên Tổ Chức / Trung Tâm:
              </label>
              <input
                type="text"
                value={formData.orgName}
                onChange={e => setFormData({ ...formData, orgName: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Địa Điểm Ban Hành:
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium"
                required
              />
            </div>
          </div>

          {/* Signatures Configuration */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900">
                Thông Tin Ký Duyệt Trên Phiếu Lương
              </span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.showSignatures}
                  onChange={e => setFormData({ ...formData, showSignatures: e.target.checked })}
                  className="rounded text-slate-900 focus:ring-slate-900 w-4 h-4"
                />
                <span className="text-xs font-semibold text-slate-700">
                  Hiển thị chữ ký điện tử
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Manager */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Chức Danh Người Điều Hành:
                  </label>
                  <input
                    type="text"
                    value={formData.managerTitle}
                    onChange={e => setFormData({ ...formData, managerTitle: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Họ và Tên Người Điều Hành:
                  </label>
                  <input
                    type="text"
                    value={formData.managerName}
                    onChange={e => setFormData({ ...formData, managerName: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold"
                  />
                </div>
                
                {formData.showSignatures && (
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <label className="block text-xs font-bold text-slate-700">
                      Hình Ảnh Chữ Ký Người Điều Hành:
                    </label>

                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col items-center justify-center min-h-[90px]">
                      {formData.managerSignatureImg && formData.managerSignatureImg !== 'none' ? (
                        <img
                          src={formData.managerSignatureImg}
                          alt="Chữ ký người điều hành"
                          className="max-h-16 max-w-full object-contain"
                        />
                      ) : formData.managerSignatureImg === 'none' ? (
                        <div className="text-xs italic text-amber-700 font-semibold bg-amber-50 px-3 py-1 rounded-md border border-amber-200">
                          (Đã xóa / Không hiển thị chữ ký này)
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <span className="text-[11px] text-slate-400 mb-1">Chữ ký mẫu mặc định:</span>
                          <ManagerSignatureSvg className="w-36 h-14" />
                        </div>
                      )}
                    </div>

                    <input
                      type="file"
                      ref={managerImgInputRef}
                      onChange={e => handleSignatureImageUpload(e, 'managerSignatureImg')}
                      accept="image/*"
                      className="hidden"
                    />

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => managerImgInputRef.current?.click()}
                        className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-slate-600" />
                        <span>Up Ảnh Chữ Ký</span>
                      </button>

                      {formData.managerSignatureImg !== 'none' && (
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, managerSignatureImg: 'none' }))}
                          className="flex items-center justify-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-md text-xs font-bold transition-colors cursor-pointer"
                          title="Xóa chữ ký (không hiển thị hình chữ ký)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Xóa</span>
                        </button>
                      )}

                      {formData.managerSignatureImg !== undefined && (
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, managerSignatureImg: undefined }))}
                          className="flex items-center justify-center gap-1 px-2 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-md text-xs font-semibold cursor-pointer"
                          title="Khôi phục về chữ ký mẫu mặc định"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Dùng Mẫu</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Finance */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Chức Danh Ban Kinh Tế / Kế Toán:
                  </label>
                  <input
                    type="text"
                    value={formData.financeTitle}
                    onChange={e => setFormData({ ...formData, financeTitle: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Họ và Tên Phụ Trách Kinh Tế:
                  </label>
                  <input
                    type="text"
                    value={formData.financeName}
                    onChange={e => setFormData({ ...formData, financeName: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold"
                  />
                </div>

                {formData.showSignatures && (
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <label className="block text-xs font-bold text-slate-700">
                      Hình Ảnh Chữ Ký Phụ Trách Kinh Tế:
                    </label>

                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col items-center justify-center min-h-[90px]">
                      {formData.financeSignatureImg && formData.financeSignatureImg !== 'none' ? (
                        <img
                          src={formData.financeSignatureImg}
                          alt="Chữ ký phụ trách kinh tế"
                          className="max-h-16 max-w-full object-contain"
                        />
                      ) : formData.financeSignatureImg === 'none' ? (
                        <div className="text-xs italic text-amber-700 font-semibold bg-amber-50 px-3 py-1 rounded-md border border-amber-200">
                          (Đã xóa / Không hiển thị chữ ký này)
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <span className="text-[11px] text-slate-400 mb-1">Chữ ký mẫu mặc định:</span>
                          <FinanceSignatureSvg className="w-36 h-14" />
                        </div>
                      )}
                    </div>

                    <input
                      type="file"
                      ref={financeImgInputRef}
                      onChange={e => handleSignatureImageUpload(e, 'financeSignatureImg')}
                      accept="image/*"
                      className="hidden"
                    />

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => financeImgInputRef.current?.click()}
                        className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-slate-600" />
                        <span>Up Ảnh Chữ Ký</span>
                      </button>

                      {formData.financeSignatureImg !== 'none' && (
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, financeSignatureImg: 'none' }))}
                          className="flex items-center justify-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-md text-xs font-bold transition-colors cursor-pointer"
                          title="Xóa chữ ký (không hiển thị hình chữ ký)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Xóa</span>
                        </button>
                      )}

                      {formData.financeSignatureImg !== undefined && (
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, financeSignatureImg: undefined }))}
                          className="flex items-center justify-center gap-1 px-2 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-md text-xs font-semibold cursor-pointer"
                          title="Khôi phục về chữ ký mẫu mặc định"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Dùng Mẫu</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            {saved ? (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <FileCheck className="w-4 h-4" /> Đã lưu cấu hình thành công!
              </span>
            ) : <span></span>}

            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-lg shadow-sm cursor-pointer"
            >
              <Save className="w-4 h-4 text-amber-300" />
              <span>Lưu Cấu Hình</span>
            </button>
          </div>

        </form>
      </div>

      {/* Backup & System Reset Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h4 className="font-bold text-base text-slate-900 mb-2">
          Sao Lưu & Quản Lý Dữ Liệu
        </h4>
        <p className="text-xs text-slate-500 mb-4">
          Bạn có thể xuất file sao lưu JSON, khôi phục từ file hoặc xóa dữ liệu mẫu để sẵn sàng tải dữ liệu từ Google Sheet.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={exportBackupJson}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Tải Bản Sao Lưu (JSON)</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4 text-slate-600" />
            <span>Khôi Phục Từ File JSON</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => setShowClearSheetModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-sm shadow-rose-600/20"
          >
            <ShieldAlert className="w-4 h-4 text-white" />
            <span>Xóa Hết Dữ Liệu Sheet (Pass: 260606)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              showConfirm({
                title: 'Xác nhận xóa sạch dữ liệu mẫu',
                message: 'Bạn có chắc chắn muốn xóa toàn bộ nhân sự mẫu, bảng công và phiếu lương mẫu để chuẩn bị nạp dữ liệu thật từ Google Sheet?',
                confirmText: 'Xóa sạch mẫu',
                variant: 'warning',
                icon: 'trash',
                onConfirm: () => {
                  clearAllSampleData();
                  showToast('Đã xóa sạch dữ liệu mẫu!', 'info');
                },
              });
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>Xóa Dữ Liệu Tạm</span>
          </button>

          <button
            type="button"
            onClick={() => {
              showConfirm({
                title: 'Khôi phục dữ liệu mẫu ban đầu',
                message: 'Thao tác này sẽ đặt lại hệ thống về trạng thái mẫu ban đầu của Triple D. Bạn có muốn tiếp tục?',
                confirmText: 'Khôi phục mẫu',
                variant: 'warning',
                onConfirm: () => {
                  resetToSampleData();
                  showToast('Đã khôi phục dữ liệu mẫu ban đầu!', 'success');
                },
              });
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg transition-colors cursor-pointer ml-auto"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>Khôi Phục Mẫu Ban Đầu</span>
          </button>
        </div>
      </div>

      {/* Modal Xóa Toàn Bộ Dữ Liệu Sheet có mật khẩu bảo vệ */}
      <ClearSheetDataModal
        isOpen={showClearSheetModal}
        onClose={() => setShowClearSheetModal(false)}
        onConfirmClear={async () => {
          const res = await wipeGoogleSheetAndLocalData(googleSheetUrl);
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
