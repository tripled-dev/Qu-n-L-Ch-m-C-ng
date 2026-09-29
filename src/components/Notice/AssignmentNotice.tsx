import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { exportElementToPDF, cleanPersonName } from '../../utils/formatters';
import { TranHanhDungSignatureSvg } from '../../utils/signatures';
import { Download, ScrollText } from 'lucide-react';

export const AssignmentNotice: React.FC = () => {
  const { orgSettings, setActiveTab } = useApp();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    setIsExporting(true);
    await exportElementToPDF('printable-assignment-notice', 'Thong_Bao_Phan_Cong_Nhiem_Vu_Dai_Dien_Lop');
    setIsExporting(false);
  };

  const today = new Date();
  const currentMonthStr = (today.getMonth() + 1).toString().padStart(2, '0');
  const currentYearStr = today.getFullYear().toString();

  return (
    <div className="space-y-6">
      
      {/* Control Action Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 border border-amber-200/60 flex items-center justify-center shrink-0">
            <ScrollText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900">
              Bảng Phân Chia Công Việc Lớp Học
            </h3>
            <p className="text-xs text-slate-500">
              Bảng phân chia công việc và tiêu chuẩn Bảng kiểm của Lớp Ôn Thi HSGQG Sinh Học
            </p>
          </div>
        </div>

        <button
          onClick={handleExportPDF}
          disabled={isExporting}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs cursor-pointer transition-colors disabled:opacity-50 whitespace-nowrap"
          title="Tải định dạng PDF"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isExporting ? 'Đang xuất...' : 'Xuất PDF'}</span>
        </button>
      </div>

      {/* Official Sheet Area */}
      <div className="flex justify-center">
        <div 
          id="printable-assignment-notice"
          style={{ fontFamily: "'Times New Roman', Times, 'Liberation Serif', serif" }}
          className="print-container payslip-times-roman bg-white w-full max-w-[780px] p-8 sm:p-12 font-serif leading-relaxed text-slate-900"
        >
          
          {/* Header Title */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="font-extrabold text-sm sm:text-base tracking-wider uppercase text-black">
                TRIPLE D
              </p>
              <p className="text-xs italic text-slate-600">
                ÔN THI HSGQG MÔN SINH HỌC
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs italic text-slate-600 mt-0.5">
                {orgSettings.location || 'Hà Nội'}, ngày 05 tháng {currentMonthStr} năm {currentYearStr}
              </p>
            </div>
          </div>

          <div className="text-center my-6">
            <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-black">
              THÔNG BÁO
            </h1>
            <p className="text-sm sm:text-base font-bold mt-1 text-slate-800">
              Công Bố Phân Chia Và Nhiệm Vụ Của Nhân Sự Tại Triple D
            </p>
          </div>

          {/* Body Content */}
          <div className="text-xs sm:text-sm space-y-3 text-justify text-slate-900 leading-relaxed">
            <p>
              Nhằm xây dựng bộ máy vận hành hiệu quả, tối ưu hóa quy trình làm việc và phát huy thế mạnh của từng thành viên, ban quản lý Triple D triển khai việc phân chức năng và phân chia nhiệm vụ nhân sự theo từng vị trí cụ thể.
            </p>
            <p>
              Việc phân công được công khai rõ ràng, minh bạch, bảo đảm mỗi cá nhân đều nắm được phạm vi trách nhiệm, quyền hạn cũng như mục tiêu công việc của mình, đồng thời tăng cường sự phối hợp giữa các bộ phận trong quá trình triển khai hoạt động. Các bộ phận và cá nhân được phân công trách nhiệm bắt buộc phải thực hiện đúng và đầy đủ các tiêu chuẩn, quy trình, công việc được quy định chi tiết tại các <strong>“Bảng Kiểm”</strong> đính kèm. Đây là cơ sở để có thể nâng cao hiệu suất làm việc, đảm bảo chất lượng vận hành và hướng tới sự phát triển bền vững của Triple D.
            </p>
            <p>
              Nội dung phân công nhân sự được trình bày như sau:
            </p>
          </div>

          {/* Assignment Table */}
          <div className="my-6">
            <table className="w-full border-collapse border border-black text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-100 border-b border-black text-center font-bold">
                  <th className="border-r border-black p-2.5 w-[25%] font-bold">Tên Ban</th>
                  <th className="border-r border-black p-2.5 w-[35%] font-bold">Bộ Phận Trực Thuộc</th>
                  <th className="p-2.5 w-[40%] font-bold">Công Việc</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-black">
                  <td rowSpan={3} className="border-r border-black p-2.5 font-bold text-center bg-slate-50">
                    CHUYÊN MÔN
                  </td>
                  <td className="border-r border-black p-2.5 font-medium">
                    Bộ phận Dạy Học
                  </td>
                  <td className="p-2.5">
                    Tham khảo{' '}
                    <button
                      onClick={() => setActiveTab('checklists')}
                      className="text-blue-700 hover:underline font-semibold cursor-pointer"
                    >
                      “Bảng Kiểm Bộ Phận Dạy Học”
                    </button>
                  </td>
                </tr>
                <tr className="border-b border-black">
                  <td className="border-r border-black p-2.5 font-medium">
                    Bộ phận Trợ Giảng
                  </td>
                  <td className="p-2.5">
                    Tham khảo{' '}
                    <button
                      onClick={() => setActiveTab('checklists')}
                      className="text-blue-700 hover:underline font-semibold cursor-pointer"
                    >
                      “Bảng Kiểm Bộ Phận Trợ Giảng”
                    </button>
                  </td>
                </tr>
                <tr className="border-b border-black">
                  <td className="border-r border-black p-2.5 font-medium">
                    Bộ phận Chấm Thi
                  </td>
                  <td className="p-2.5">
                    Tham khảo{' '}
                    <button
                      onClick={() => setActiveTab('checklists')}
                      className="text-blue-700 hover:underline font-semibold cursor-pointer"
                    >
                      “Bảng Kiểm Bộ Phận Chấm Thi”
                    </button>
                  </td>
                </tr>

                <tr className="border-b border-black">
                  <td rowSpan={2} className="border-r border-black p-2.5 font-bold text-center bg-slate-50">
                    HẬU CẦN
                  </td>
                  <td className="border-r border-black p-2.5 font-medium">
                    Bộ Phận Trợ Lý
                  </td>
                  <td className="p-2.5">
                    Tham khảo{' '}
                    <button
                      onClick={() => setActiveTab('checklists')}
                      className="text-blue-700 hover:underline font-semibold cursor-pointer"
                    >
                      “Bảng Kiểm Trợ Lý”
                    </button>
                  </td>
                </tr>
                <tr>
                  <td className="border-r border-black p-2.5 font-medium">
                    Bộ Phận Truyền Thông
                  </td>
                  <td className="p-2.5">
                    Chịu sự chỉ đạo trực tiếp từ Cô Trần Hạnh Dung
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Signature Box */}
          <div className="signature-container break-inside-avoid print:break-inside-avoid flex justify-end mt-12 text-center" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
            <div className="w-72 flex flex-col items-center justify-between min-h-[160px]">
              <div>
                <p className="font-bold text-xs sm:text-sm uppercase tracking-wider text-slate-800 mb-1">
                  {orgSettings.managerTitle ? orgSettings.managerTitle.toUpperCase() : 'NGƯỜI THUÊ / PHỤ TRÁCH'}
                </p>
                <p className="text-xs sm:text-sm italic text-slate-500">
                  (Ký và duyệt)
                </p>
              </div>
              <div className="h-16 my-1 flex items-center justify-center">
                {orgSettings?.showSignatures !== false && orgSettings?.managerSignatureImg ? (
                  <img
                    src={orgSettings.managerSignatureImg}
                    alt="Chữ ký Trần Hạnh Dung"
                    className="max-h-16 max-w-[180px] object-contain pointer-events-none select-none drop-shadow-2xs"
                  />
                ) : (
                  <div className="h-16"></div>
                )}
              </div>
              <p className="font-bold text-sm sm:text-base text-black">
                {orgSettings.managerName || 'Trần Hạnh Dung'}
              </p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
