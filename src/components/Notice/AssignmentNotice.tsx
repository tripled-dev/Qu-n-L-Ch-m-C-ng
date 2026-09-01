import React from 'react';
import { useApp } from '../../context/AppContext';
import { FinanceSignatureSvg } from '../../utils/signatures';
import { Printer, ScrollText } from 'lucide-react';

export const AssignmentNotice: React.FC = () => {
  const { setActiveTab } = useApp();

  return (
    <div className="space-y-6">
      
      {/* Header bar */}
      <div className="no-print bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
        <div>
          <h3 className="font-bold text-base text-slate-900">
            Thông Báo Phân Chia Và Nhiệm Vụ Nhân Sự
          </h3>
          <p className="text-xs text-slate-500">
            Văn bản thông báo phân quyền và giao trách nhiệm chính thức của Triple D
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>In Thông Báo</span>
        </button>
      </div>

      {/* Official Sheet Area */}
      <div className="flex justify-center">
        <div className="print-container bg-white w-full max-w-[780px] p-8 sm:p-12 shadow-sm rounded-xl border border-slate-300 font-serif leading-relaxed text-slate-900">
          
          {/* Header Title */}
          <div className="flex justify-between items-start mb-6 font-sans">
            <div>
              <p className="font-extrabold text-sm sm:text-base tracking-wider uppercase">
                TRIPLE D
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-sm sm:text-base uppercase tracking-tight">
                ÔN THI HSGQG MÔN SINH HỌC
              </p>
              <p className="text-xs italic text-slate-600 mt-0.5">
                Hà Nội, ngày 05 tháng 09 năm 2026
              </p>
            </div>
          </div>

          <div className="text-center my-6">
            <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-black font-sans">
              THÔNG BÁO
            </h1>
            <p className="text-sm sm:text-base font-bold mt-1 text-slate-800 font-sans">
              Công Bố Phân Chia Và Nhiệm Vụ Của Nhân Sự Tại Triple D
            </p>
          </div>

          {/* Body Content */}
          <div className="text-xs sm:text-sm space-y-3 text-justify text-slate-900 leading-relaxed font-sans">
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
            <table className="w-full border-collapse border border-black text-xs sm:text-sm font-sans">
              <thead>
                <tr className="bg-slate-100 border-b border-black text-center font-bold">
                  <th className="border-r border-black p-2.5 w-[25%] font-bold">Tên Ban</th>
                  <th className="border-r border-black p-2.5 w-[35%] font-bold">Bộ Phận Trực Thuộc</th>
                  <th className="p-2.5 w-[40%] font-bold">Công Việc</th>
                </tr>
              </thead>
              <tbody>
                {/* CHUYÊN MÔN */}
                <tr className="border-b border-black">
                  <td rowSpan={3} className="border-r border-black p-3 text-center font-bold align-middle bg-slate-50">
                    CHUYÊN MÔN
                  </td>
                  <td className="border-r border-black p-2.5 font-medium">
                    Bộ phận Dạy Học
                  </td>
                  <td className="p-2.5">
                    Tham khảo{' '}
                    <button
                      onClick={() => setActiveTab('checklists')}
                      className="text-blue-700 hover:underline font-semibold"
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
                      className="text-blue-700 hover:underline font-semibold"
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
                      className="text-blue-700 hover:underline font-semibold"
                    >
                      “Bảng Kiểm Bộ Phận Chấm Thi”
                    </button>
                  </td>
                </tr>

                {/* HẬU CẦN */}
                <tr className="border-b border-black">
                  <td rowSpan={2} className="border-r border-black p-3 text-center font-bold align-middle bg-slate-50">
                    HẬU CẦN
                  </td>
                  <td className="border-r border-black p-2.5 font-medium">
                    Bộ Phận Trợ Lý
                  </td>
                  <td className="p-2.5">
                    Tham khảo{' '}
                    <button
                      onClick={() => setActiveTab('checklists')}
                      className="text-blue-700 hover:underline font-semibold"
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
                    Chịu chỉ đạo trực tiếp từ Triple D
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Signature Box */}
          <div className="flex justify-end mt-10 text-center font-sans">
            <div className="w-64 flex flex-col items-center">
              <p className="font-bold text-sm sm:text-base uppercase tracking-tight text-black">
                ĐIỀU HÀNH TRIPLE D
              </p>
              <p className="text-xs italic text-slate-600 mb-2">
                (Ký và duyệt)
              </p>

              {/* Signature */}
              <div className="h-20 flex items-center justify-center my-1">
                <FinanceSignatureSvg className="w-48 h-18" />
              </div>

              <p className="font-bold text-sm sm:text-base text-black mt-2">
                Trần Hạnh Dung
              </p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
