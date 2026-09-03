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
          className="print-container payslip-times-roman bg-white w-full max-w-[780px] p-8 sm:p-12 shadow-sm rounded-xl border border-slate-300 font-serif leading-relaxed text-slate-900"
        >
          
          {/* Header Title */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="font-extrabold text-sm sm:text-base tracking-wider uppercase text-black">
                ĐẠI DIỆN LỚP
              </p>
              <p className="text-xs italic text-slate-600">
                Phụ trách Lớp Ôn Thi HSGQG Sinh Học
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-sm sm:text-base uppercase tracking-tight text-black">
                {orgSettings.orgName || 'LỚP ÔN THI HSGQG SINH HỌC'}
              </p>
              <p className="text-xs italic text-slate-600 mt-0.5">
                {orgSettings.location || 'Hà Nội'}, ngày 05 tháng {currentMonthStr} năm {currentYearStr}
              </p>
            </div>
          </div>

          <div className="text-center my-6">
            <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-black">
              BẢNG PHÂN CHIA CÔNG VIỆC LỚP HỌC
            </h1>
            <p className="text-sm sm:text-base font-bold mt-1 text-slate-800">
              Hướng dẫn đầu việc & tiêu chuẩn bảng kiểm hỗ trợ Lớp Ôn Thi HSGQG Sinh Học
            </p>
          </div>

          {/* Body Content */}
          <div className="text-xs sm:text-sm space-y-3 text-justify text-slate-900 leading-relaxed">
            <p>
              Để công tác giảng dạy và hỗ trợ học sinh tại các lớp ôn thi bồi dưỡng Sinh học đạt hiệu quả tốt nhất, <strong>Đại Diện Lớp</strong> trao đổi bảng phân chia công việc và hướng dẫn tiêu chuẩn cụ thể cho từng vị trí hỗ trợ lớp học.
            </p>
            <p>
              Việc phân công được trao đổi rõ ràng, minh bạch, bảo đảm mỗi cá nhân đều nắm được phạm vi trách nhiệm và mục tiêu chất lượng công việc của mình. Các cộng tác viên nhận nhiệm vụ thực hiện theo các tiêu chuẩn quy định tại <strong>“Bảng Kiểm”</strong> đính kèm. Đây là cơ sở để theo dõi chất lượng và tính thù lao hàng tháng một cách công bằng, thỏa đáng.
            </p>
            <p>
              Nội dung phân công nhiệm vụ được tóm tắt như sau:
            </p>
          </div>

          {/* Assignment Table */}
          <div className="my-6">
            <table className="w-full border-collapse border border-black text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-100 border-b border-black text-center font-bold">
                  <th className="border-r border-black p-2.5 w-[25%] font-bold">Bộ Phận</th>
                  <th className="border-r border-black p-2.5 w-[35%] font-bold">Đầu Việc Nhận Làm</th>
                  <th className="p-2.5 w-[40%] font-bold">Quy Định & Bảng Kiểm Áp Dụng</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-black">
                  <td rowSpan={4} className="border-r border-black p-2.5 font-bold text-center bg-slate-50">
                    BỘ PHẬN CHUYÊN MÔN
                  </td>
                  <td className="border-r border-black p-2.5 font-medium">
                    1. Đứng Lớp Giảng Dạy
                  </td>
                  <td className="p-2.5">
                    Thực hiện đúng và đầy đủ tiêu chí tại{' '}
                    <button
                      onClick={() => setActiveTab('checklists')}
                      className="text-blue-700 hover:underline font-semibold cursor-pointer"
                    >
                      “Bảng Kiểm Dạy Học”
                    </button>
                  </td>
                </tr>
                <tr className="border-b border-black">
                  <td className="border-r border-black p-2.5 font-medium">
                    2. Biên Soạn Tài Liệu & Đề Thi
                  </td>
                  <td className="p-2.5">
                    Thực hiện đúng và đầy đủ tiêu chí tại{' '}
                    <button
                      onClick={() => setActiveTab('checklists')}
                      className="text-blue-700 hover:underline font-semibold cursor-pointer"
                    >
                      “Bảng Kiểm Soạn Bài”
                    </button>
                  </td>
                </tr>
                <tr className="border-b border-black">
                  <td className="border-r border-black p-2.5 font-medium">
                    3. Trợ Giảng Lớp Học
                  </td>
                  <td className="p-2.5">
                    Thực hiện đúng và đầy đủ tiêu chí tại{' '}
                    <button
                      onClick={() => setActiveTab('checklists')}
                      className="text-blue-700 hover:underline font-semibold cursor-pointer"
                    >
                      “Bảng Kiểm Trợ Giảng”
                    </button>
                  </td>
                </tr>
                <tr className="border-b border-black">
                  <td className="border-r border-black p-2.5 font-medium">
                    4. Chấm Thi & Chữa Bài Tập
                  </td>
                  <td className="p-2.5">
                    Thực hiện đúng và đầy đủ tiêu chí tại{' '}
                    <button
                      onClick={() => setActiveTab('checklists')}
                      className="text-blue-700 hover:underline font-semibold cursor-pointer"
                    >
                      “Bảng Kiểm Chấm Bài”
                    </button>
                  </td>
                </tr>

                <tr className="border-b border-black">
                  <td rowSpan={2} className="border-r border-black p-2.5 font-bold text-center bg-slate-50">
                    BỘ PHẬN HỌC VỤ & HỖ TRỢ
                  </td>
                  <td className="border-r border-black p-2.5 font-medium">
                    1. Trực Ca Học Vụ & Điểm Danh
                  </td>
                  <td className="p-2.5">
                    Thực hiện đúng và đầy đủ tiêu chí tại{' '}
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
                    2. Hỗ Trợ Truyền Thông & Tư Vấn
                  </td>
                  <td className="p-2.5">
                    Phối hợp trực tiếp cùng Đại Diện Lớp
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Signature Box */}
          <div className="flex justify-end mt-12 text-center">
            <div className="w-72 flex flex-col items-center justify-between min-h-[160px]">
              <div>
                <p className="font-bold text-xs sm:text-sm uppercase tracking-wider text-slate-800 mb-1">
                  PHỤ TRÁCH LỚP HỌC
                </p>
                <p className="text-xs sm:text-sm italic text-slate-500">
                  (Xác nhận phân công)
                </p>
              </div>
              <div className="h-16 my-1"></div>
              <p className="font-bold text-sm sm:text-base text-black">
                {cleanPersonName(orgSettings.managerName, 'Đại Diện Lớp')}
              </p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
