import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { OrgSettings } from '../../types';
import { 
  Settings, 
  Save, 
  RotateCcw, 
  Download, 
  Upload, 
  FileCheck, 
  Trash2, 
  ShieldAlert, 
  Building2, 
  UserCheck, 
  CalendarDays, 
  Coins, 
  Phone, 
  Mail, 
  MapPin 
} from 'lucide-react';
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
    showConfirm,
    showToast,
  } = useApp();

  const [formData, setFormData] = useState<OrgSettings>({
    orgName: orgSettings.orgName || 'Lớp Ôn Thi HSGQG Sinh Học',
    location: orgSettings.location || 'Hà Nội',
    managerTitle: orgSettings.managerTitle || 'ĐẠI DIỆN LỚP',
    managerName: orgSettings.managerName || 'Đại Diện Lớp',
    contactPhone: orgSettings.contactPhone || '0912 345 678',
    contactEmail: orgSettings.contactEmail || 'hsgqg.sinhhoc@gmail.com',
    currencySymbol: orgSettings.currencySymbol || 'VNĐ',
    defaultWorkingDaysInMonth: orgSettings.defaultWorkingDaysInMonth || 26,
    financeTitle: 'Đại Diện Lớp',
    financeName: 'Đại Diện Lớp',
    showSignatures: false,
  });

  const [saved, setSaved] = useState(false);
  const [showClearSheetModal, setShowClearSheetModal] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setFormData({
      orgName: orgSettings.orgName || 'Lớp Ôn Thi HSGQG Sinh Học',
      location: orgSettings.location || 'Hà Nội',
      managerTitle: orgSettings.managerTitle || 'ĐẠI DIỆN LỚP',
      managerName: orgSettings.managerName || 'Đại Diện Lớp',
      contactPhone: orgSettings.contactPhone || '0912 345 678',
      contactEmail: orgSettings.contactEmail || 'hsgqg.sinhhoc@gmail.com',
      currencySymbol: orgSettings.currencySymbol || 'VNĐ',
      defaultWorkingDaysInMonth: orgSettings.defaultWorkingDaysInMonth || 26,
      financeTitle: 'Đại Diện Lớp',
      financeName: 'Đại Diện Lớp',
      showSignatures: false,
    });
  }, [orgSettings]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateOrgSettings({
      ...formData,
      financeTitle: formData.managerTitle,
      financeName: formData.managerName,
      showSignatures: false,
    });
    setSaved(true);
    showToast('Đã lưu cấu hình thông tin thành công!', 'success');
    setTimeout(() => setSaved(false), 3000);
  };

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
      
      {/* Main Settings Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base sm:text-lg text-slate-900">
              Cấu Hình Tổ Chức & Thông Tin Đại Diện
            </h3>
            <p className="text-xs text-slate-500">
              Thiết lập thông tin lớp học, người phụ trách trao đổi/chi trả và quy chuẩn chấm công
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Section 1: Thông tin Lớp Học */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wide">
              <Building2 className="w-4 h-4 text-slate-700" />
              <span>1. Thông Tin Lớp Học & Địa Điểm</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên Lớp Học / Tổ Chức:
                </label>
                <input
                  type="text"
                  value={formData.orgName}
                  onChange={e => setFormData({ ...formData, orgName: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs sm:text-sm font-bold text-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none"
                  placeholder="VD: Lớp Ôn Thi HSGQG Sinh Học"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Hiển thị ở tiêu đề phiếu lương, bảng thống nhất công việc và thông báo
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Địa Điểm Ban Hành:</span>
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium text-slate-800 focus:ring-1 focus:ring-slate-900 focus:outline-none"
                  placeholder="VD: Hà Nội"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Hiển thị trên phần địa danh ký tá (VD: Hà Nội, ngày...)
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Người Đại Diện & Chi Trả */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wide">
              <UserCheck className="w-4 h-4 text-teal-700" />
              <span>2. Người Đại Diện Lớp / Phụ Trách Giao Việc & Chi Trả</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Chức Danh / Danh Xưng Đại Diện:
                </label>
                <input
                  type="text"
                  value={formData.managerTitle}
                  onChange={e => setFormData({ ...formData, managerTitle: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs sm:text-sm font-bold text-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none"
                  placeholder="VD: ĐẠI DIỆN LỚP hoặc PHỤ TRÁCH LỚP"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Họ và Tên Người Đại Diện:
                </label>
                <input
                  type="text"
                  value={formData.managerName}
                  onChange={e => setFormData({ ...formData, managerName: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs sm:text-sm font-bold text-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none"
                  placeholder="VD: Đại Diện Lớp"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Điện Thoại / Zalo Liên Hệ:</span>
                </label>
                <input
                  type="text"
                  value={formData.contactPhone || ''}
                  onChange={e => setFormData({ ...formData, contactPhone: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-800 focus:ring-1 focus:ring-slate-900 focus:outline-none font-mono"
                  placeholder="VD: 0912 345 678"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Email Liên Hệ:</span>
                </label>
                <input
                  type="email"
                  value={formData.contactEmail || ''}
                  onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-800 focus:ring-1 focus:ring-slate-900 focus:outline-none"
                  placeholder="VD: hsgqg.sinhhoc@gmail.com"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Quy Chuẩn Tính Lương & Chấm Công */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wide">
              <Coins className="w-4 h-4 text-amber-600" />
              <span>3. Quy Chuẩn Tính Công & Tiền Tệ</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Đơn Vị Tiền Tệ:
                </label>
                <input
                  type="text"
                  value={formData.currencySymbol}
                  onChange={e => setFormData({ ...formData, currencySymbol: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs sm:text-sm font-bold text-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none"
                  placeholder="VNĐ hoặc đ"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                  <span>Số Ngày Công Tiêu Chuẩn / Tháng:</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={formData.defaultWorkingDaysInMonth}
                  onChange={e => setFormData({ ...formData, defaultWorkingDaysInMonth: Number(e.target.value) || 26 })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs sm:text-sm font-bold text-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none font-mono"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Mặc định là 26 ngày công / tháng (áp dụng cho trợ lý/nhân sự cố định)
                </p>
              </div>
            </div>
          </div>

          {/* Actions Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            {saved ? (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <FileCheck className="w-4 h-4" /> Đã lưu cấu hình thành công!
              </span>
            ) : <span></span>}

            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-lg shadow-sm cursor-pointer transition-colors"
            >
              <Save className="w-4 h-4 text-amber-300" />
              <span>Lưu Cấu Hình</span>
            </button>
          </div>

        </form>
      </div>

      {/* Backup & System Reset Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <h4 className="font-bold text-base text-slate-900 mb-1">
          Sao Lưu & Quản Trị Dữ Liệu
        </h4>
        <p className="text-xs text-slate-500 mb-4">
          Bạn có thể xuất bản sao lưu JSON, nạp lại dữ liệu hoặc xóa sạch dữ liệu mẫu để sẵn sàng đồng bộ Google Sheet.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <button
            type="button"
            onClick={exportBackupJson}
            className="flex items-center justify-center gap-1.5 px-2.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            title="Tải bản sao lưu JSON về máy"
          >
            <Download className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <span>Tải Sao Lưu</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-1.5 px-2.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            title="Khôi phục dữ liệu từ file JSON"
          >
            <Upload className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <span>Khôi Phục</span>
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
            className="flex items-center justify-center gap-1.5 px-2.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs shadow-rose-600/20 whitespace-nowrap"
            title="Xóa hết dữ liệu trên Google Sheet (Cần mật khẩu)"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-white shrink-0" />
            <span>Xóa Sheet</span>
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
            className="flex items-center justify-center gap-1.5 px-2.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            title="Xóa bộ nhớ tạm trên trình duyệt"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>Xóa Tạm</span>
          </button>

          <button
            type="button"
            onClick={() => {
              showConfirm({
                title: 'Khôi phục dữ liệu mẫu ban đầu',
                message: 'Thao tác này sẽ đặt lại hệ thống về trạng thái mẫu ban đầu của các lớp học. Bạn có muốn tiếp tục?',
                confirmText: 'Khôi phục mẫu',
                variant: 'warning',
                onConfirm: () => {
                  resetToSampleData();
                  showToast('Đã khôi phục dữ liệu mẫu ban đầu!', 'success');
                },
              });
            }}
            className="flex items-center justify-center gap-1.5 px-2.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap col-span-2 sm:col-span-1"
            title="Khôi phục lại dữ liệu mẫu ban đầu"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>Khôi Phục Mẫu</span>
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
