import {
  ChecklistTemplate,
  MonthlyPayrollSlip,
  OrgSettings,
  Staff,
  TimesheetEntry,
  KpiEvaluation
} from '../types';

export const INITIAL_ORG_SETTINGS: OrgSettings = {
  orgName: 'Lớp Ôn Thi HSGQG Sinh Học',
  location: 'Hà Nội',
  managerTitle: 'Người thuê',
  managerName: 'Trần Hạnh Dung',
  contactPhone: '',
  contactEmail: '',
  financeTitle: 'Người chi trả thù lao',
  financeName: 'Trần Hạnh Dung',
  managerSignatureImg: '',
  showSignatures: true,
  currencySymbol: 'VNĐ',
  defaultWorkingDaysInMonth: 26,
};

export const INITIAL_CHECKLIST_TEMPLATES: ChecklistTemplate[] = [
  {
    id: 'chk_day_hoc',
    code: 'BK-DH',
    title: 'Bảng Kiểm Bộ Phận Dạy Học',
    targetDepartment: 'Bộ phận Dạy Học',
    description: 'Tiêu chuẩn đánh giá hiệu suất (KPI) cho giảng viên và người đứng lớp',
    linkedTemplateId: 'chk_soan_bai',
    groups: [
      {
        id: 'dh_g1',
        stt: 1,
        groupName: 'Chuẩn Bị & Duyệt Bài Giảng',
        totalWeight: 35,
        criteria: [
          {
            id: 'dh_c1_1',
            title: 'Chủ động tự soạn bài theo đúng lịch trình, thời khóa biểu và nội dung được phê duyệt. Đẩy tài liệu/slide giảng dạy lên drive để được kiểm duyệt trước ca dạy ít nhất 1 tuần.',
            details: ['Đúng lịch trình, TKB và nội dung được phê duyệt', 'Đẩy tài liệu/slide lên Drive trước ca dạy ≥ 1 tuần'],
            weight: 10,
          },
          {
            id: 'dh_c1_2',
            title: 'Đảm bảo chất lượng của tài liệu. Đánh giá theo tiêu chí của "Bảng Kiểm Soạn Bài". (Soạn bài giảng – soạn bài tập – soạn tài liệu chuẩn bị trước của mỗi buổi học theo yêu cầu).',
            details: ['Đạt chuẩn theo tiêu chí của "Bảng Kiểm Soạn Bài"', 'Soạn bài giảng – soạn bài tập – tài liệu chuẩn bị trước mỗi buổi'],
            weight: 15,
          },
          {
            id: 'dh_c1_3',
            title: 'Đảm bảo câu hỏi/nội dung thuộc bản quyền sở hữu có tính độc quyền.',
            details: ['Đảm bảo tính độc quyền của câu hỏi/nội dung', 'Bản quyền sở hữu thuộc về lớp học'],
            weight: 10,
          },
        ],
      },
      {
        id: 'dh_g2',
        stt: 2,
        groupName: 'Yêu Cầu Về Kỷ Luật',
        totalWeight: 15,
        criteria: [
          {
            id: 'dh_c2_1',
            title: 'Đứng lớp đúng lịch trình, thời khóa biểu đã được phê duyệt (nghỉ phải có bù).',
            details: ['Đứng lớp đúng lịch trình, TKB phê duyệt', 'Nghỉ phải sắp xếp có ca dạy bù'],
            weight: 10,
          },
          {
            id: 'dh_c2_2',
            title: 'Bắt đầu và kết thúc ca dạy đúng giờ, không được vào trễ, không nghỉ sớm. Nhắc nhở các em vào học trước 5 – 10 phút để ổn định lớp.',
            details: ['Đúng giờ bắt đầu & kết thúc ca dạy, không vào trễ, không nghỉ sớm', 'Nhắc nhở học sinh vào học trước 5 – 10 phút để ổn định lớp'],
            weight: 5,
          },
        ],
      },
      {
        id: 'dh_g3',
        stt: 3,
        groupName: 'Giảng Dạy & Tương Tác',
        totalWeight: 35,
        criteria: [
          {
            id: 'dh_c3_1',
            title: 'Giảng dạy đúng chuyên môn, đảm bảo tính chính xác về nội dung học thuật.',
            details: ['Giảng dạy đúng chuyên môn', 'Đảm bảo tính chính xác về nội dung học thuật'],
            weight: 15,
          },
          {
            id: 'dh_c3_2',
            title: 'Tương tác, giải đáp thắc mắc chuyên môn cho học viên ngay trong buổi học.',
            details: ['Tương tác tích cực với học viên', 'Giải đáp thắc mắc chuyên môn ngay trong buổi học'],
            weight: 15,
          },
          {
            id: 'dh_c3_3',
            title: 'Tạo không khí học tập tích cực, truyền cảm hứng cho học sinh.',
            details: ['Tạo không khí học tập tích cực', 'Truyền cảm hứng đam mê học tập cho học sinh'],
            weight: 5,
          },
        ],
      },
      {
        id: 'dh_g4',
        stt: 4,
        groupName: 'Quản Lý Video Record',
        totalWeight: 15,
        criteria: [
          {
            id: 'dh_c4_1',
            title: 'Bật ghi hình (Record) đầy đủ trong suốt ca học. Nếu có sự cố phải tự quay lại.',
            details: ['Bật ghi hình (Record) đầy đủ suốt ca học', 'Tự quay lại bù nếu gặp sự cố'],
            weight: 5,
          },
          {
            id: 'dh_c4_2',
            title: 'Đưa các video record lên hệ thống cho học viên đúng thời hạn (muộn nhất là một tuần). Đặt đúng tên của mỗi buổi học dựa vào sheet kế hoạch học tập, viết đúng in hoa thường.',
            details: ['Đưa video record lên hệ thống đúng hạn (muộn nhất 1 tuần)', 'Đặt đúng tên buổi học theo sheet kế hoạch, viết đúng in hoa thường'],
            weight: 5,
          },
          {
            id: 'dh_c4_3',
            title: 'Trả lời đầy đủ “Hỏi đáp bài giảng” trên web cho học sinh kịp thời, chính xác.',
            details: ['Trả lời mục "Hỏi đáp bài giảng" trên web kịp thời, chính xác'],
            weight: 5,
          },
        ],
      },
    ],
  },
  {
    id: 'chk_tro_giang',
    code: 'BK-TG',
    title: 'Bảng Kiểm Bộ Phận Trợ Giảng',
    targetDepartment: 'Bộ phận Trợ Giảng',
    description: 'Tiêu chuẩn đánh giá hiệu suất (KPI) cho đội ngũ Trợ giảng',
    groups: [
      {
        id: 'tg_g1',
        stt: 1,
        groupName: 'Chấm bài & Cập nhật đáp án',
        totalWeight: 35,
        criteria: [
          {
            id: 'tg_c1_1',
            title: 'Chấm BTVN đầy đủ và đúng hạn, kịp thời trên hệ thống web được cung cấp. Nhắc nhở học sinh nộp BTVN đúng hạn.',
            details: ['Chấm BTVN đầy đủ và đúng hạn, kịp thời trên hệ thống web', 'Nhắc nhở học sinh nộp BTVN đúng hạn'],
            weight: 20,
          },
          {
            id: 'tg_c1_2',
            title: 'Nhập chính xác số điểm của từng câu trên hệ thống. Nhận xét chi tiết từng câu và bài làm, chỉ rõ nhược điểm giúp học sinh cải thiện.',
            details: ['Nhập chính xác số điểm của từng câu trên hệ thống', 'Nhận xét chi tiết từng câu và bài làm, chỉ rõ nhược điểm'],
            weight: 10,
          },
          {
            id: 'tg_c1_3',
            title: 'Cập nhật đáp án (sẽ được cung cấp) kịp thời cho các bạn học sinh.',
            details: ['Cập nhật đáp án được cung cấp kịp thời cho học sinh'],
            weight: 5,
          },
        ],
      },
      {
        id: 'tg_g2',
        stt: 2,
        groupName: 'Đánh giá',
        totalWeight: 30,
        criteria: [
          {
            id: 'tg_c2_1',
            title: 'Điểm danh và theo dõi chuyên cần, sĩ số, tình hình đi học hoặc nghỉ học của học sinh.',
            details: ['Điểm danh và theo dõi chuyên cần, sĩ số', 'Nắm bắt tình hình đi học hoặc nghỉ học của học sinh'],
            weight: 10,
          },
          {
            id: 'tg_c2_2',
            title: 'Cập nhật chuyên cần, điểm số vào bảng theo dõi để đánh giá năng lực từng học sinh.',
            details: ['Cập nhật chuyên cần, điểm số vào bảng theo dõi', 'Đánh giá năng lực từng học sinh'],
            weight: 10,
          },
          {
            id: 'tg_c2_3',
            title: 'Lập bảng xếp hạng đánh giá năng lực, thái độ, điểm số và chuyên cần của học sinh.',
            details: ['Lập bảng xếp hạng đánh giá năng lực, thái độ, điểm số và chuyên cần'],
            weight: 10,
          },
        ],
      },
      {
        id: 'tg_g3',
        stt: 3,
        groupName: 'Chăm sóc & Động viên',
        totalWeight: 35,
        criteria: [
          {
            id: 'tg_c3_1',
            title: 'Duy trì không khí vui vẻ, tích cực trong nhóm tin nhắn của lớp. Chủ động tạo kết nối giữa người dạy, trợ giảng và học sinh.',
            details: ['Duy trì không khí vui vẻ, tích cực trong nhóm tin nhắn', 'Chủ động tạo kết nối giữa người dạy, trợ giảng và học sinh'],
            weight: 5,
          },
          {
            id: 'tg_c3_2',
            title: 'Chủ động hỏi thăm học sinh vào giữa mỗi đợt học để nắm tình hình & nguyện vọng. Thực hiện tổng hợp phản hồi/khó khăn của các em (nếu có) để báo cáo lại cho hệ thống.',
            details: ['Chủ động hỏi thăm học sinh vào giữa mỗi đợt học', 'Tổng hợp phản hồi/khó khăn báo cáo lại cho hệ thống'],
            weight: 10,
          },
          {
            id: 'tg_c3_3',
            title: 'Giải đáp câu hỏi và thắc mắc của học sinh.',
            details: ['Giải đáp câu hỏi và thắc mắc của học sinh kịp thời'],
            weight: 10,
          },
          {
            id: 'tg_c3_4',
            title: 'Sau mỗi đợt học, nhắn tin hỏi thăm từng học sinh và khuyến khích, động viên học sinh đăng ký tham gia các đợt học tiếp theo.',
            details: ['Sau mỗi đợt học, nhắn tin hỏi thăm từng học sinh', 'Khuyến khích, động viên đăng ký tham gia các đợt tiếp theo'],
            weight: 10,
          },
        ],
      },
    ],
  },
  {
    id: 'chk_cham_thi',
    code: 'BK-CT',
    title: 'Bảng Kiểm Bộ Phận Chấm Thi',
    targetDepartment: 'Bộ phận Chấm Thi',
    description: 'Tiêu chuẩn đánh giá hiệu suất (KPI) cho đội ngũ Chấm thi và khảo thí',
    groups: [
      {
        id: 'ct_g1',
        stt: 1,
        groupName: 'Thu nhận & Tiến độ chấm bài',
        totalWeight: 40,
        criteria: [
          {
            id: 'ct_c1_1',
            title: 'Kiểm tra học sinh đã nộp bài chưa và tiến hành nhắc nộp theo thời gian quy định.',
            details: ['Kiểm tra học sinh đã nộp bài chưa', 'Tiến hành nhắc nộp theo thời gian quy định'],
            weight: 10,
          },
          {
            id: 'ct_c1_2',
            title: 'Chấm và trả bài đúng hạn (muộn nhất 2 ngày sau khi hết hạn nộp), không để tồn đọng.',
            details: ['Chấm và trả bài đúng hạn (muộn nhất 2 ngày sau khi hết hạn)', 'Không để tồn đọng bài chấm'],
            weight: 30,
          },
        ],
      },
      {
        id: 'ct_g2',
        stt: 2,
        groupName: 'Chất lượng chấm & Sửa bài',
        totalWeight: 60,
        criteria: [
          {
            id: 'ct_c2_1',
            title: 'Chấm điểm chính xác, sửa lỗi chi tiết từng phần bài làm của học viên (như hướng dẫn).',
            details: ['Chấm điểm chính xác theo barem', 'Sửa lỗi chi tiết từng phần bài làm'],
            weight: 30,
          },
          {
            id: 'ct_c2_2',
            title: 'Đưa ra lời khuyên cụ thể cho từng học viên nhằm giúp cải thiện điểm số.',
            details: ['Đưa ra lời khuyên cụ thể cho từng học viên nhằm giúp cải thiện điểm số'],
            weight: 30,
          },
        ],
      },
    ],
  },
  {
    id: 'chk_tro_ly',
    code: 'BK-TL',
    title: 'Bảng Kiểm Bộ Phận Trợ Lý',
    targetDepartment: 'Bộ Phận Trợ Lý',
    description: 'Tiêu chuẩn đánh giá hiệu suất (KPI) cho Trợ lý học vụ & vận hành',
    linkedTemplateId: 'chk_soan_bai',
    groups: [
      {
        id: 'tl_g1',
        stt: 1,
        groupName: 'Soạn tài liệu',
        totalWeight: 80,
        criteria: [
          {
            id: 'tl_c1_1',
            title: 'Thực hiện soạn tài liệu theo yêu cầu của ban quản lý. Được đánh giá theo tiêu chí của "Bảng Kiểm Soạn Bài".',
            details: ['Thực hiện soạn tài liệu theo yêu cầu ban quản lý', 'Được đánh giá theo tiêu chí của "Bảng Kiểm Soạn Bài"'],
            weight: 80,
          },
        ],
      },
      {
        id: 'tl_g2',
        stt: 2,
        groupName: 'Hỗ trợ',
        totalWeight: 20,
        criteria: [
          {
            id: 'tl_c2_1',
            title: 'Hỗ trợ thực hiện công việc theo yêu cầu và theo chỉ đạo của ban quản lý.',
            details: ['Hỗ trợ thực hiện công việc theo yêu cầu và chỉ đạo của ban quản lý'],
            weight: 15,
          },
          {
            id: 'tl_c2_2',
            title: 'Cập nhật xu thế thị trường.',
            details: ['Cập nhật xu thế thị trường'],
            weight: 5,
          },
        ],
      },
    ],
  },
  {
    id: 'chk_soan_bai',
    code: 'BK-SB',
    title: 'Bảng Kiểm Soạn Bài',
    targetDepartment: 'Toàn hệ thống / Soạn Tài Liệu',
    description: 'Sử dụng để đánh giá tài liệu biên soạn. Dựa vào điểm tổng kết của “Bảng Kiểm Soạn Bài” sau đó nhân với trọng số của công việc tương ứng để thu được hiệu suất của công việc tương ứng.',
    groups: [
      {
        id: 'sb_g1',
        stt: 1,
        groupName: 'Tiến độ & Số lượng',
        totalWeight: 45,
        criteria: [
          {
            id: 'sb_c1_1',
            title: 'Hoàn thành đúng số lượng bài soạn, ngân hàng câu hỏi, đề thi thử, tài liệu ôn tập định kỳ,…theo yêu cầu được giao.',
            details: ['Hoàn thành đúng số lượng bài soạn, ngân hàng câu hỏi, đề thi thử, tài liệu ôn tập định kỳ'],
            weight: 25,
          },
          {
            id: 'sb_c1_2',
            title: 'Bàn giao tài liệu đúng thời hạn cam kết với.',
            details: ['Bàn giao tài liệu đúng thời hạn cam kết'],
            weight: 20,
          },
        ],
      },
      {
        id: 'sb_g2',
        stt: 2,
        groupName: 'Độ chính xác kiến thức',
        totalWeight: 35,
        criteria: [
          {
            id: 'sb_c2_1',
            title: 'Đảm bảo tính chính xác tuyệt đối về kiến thức (độ chính xác phải đạt >98%).',
            details: ['Đảm bảo tính chính xác tuyệt đối về kiến thức (>98%)'],
            weight: 10,
          },
          {
            id: 'sb_c2_2',
            title: 'Có đáp án/lời giải chi tiết kèm theo (nếu cần).',
            details: ['Có đáp án/lời giải chi tiết kèm theo (nếu cần)'],
            weight: 25,
          },
        ],
      },
      {
        id: 'sb_g3',
        stt: 3,
        groupName: 'Hình thức & Trình bày',
        totalWeight: 20,
        criteria: [
          {
            id: 'sb_c3_1',
            title: 'Trình bày sạch đẹp, chỉn chu, chuyên nghiệp trước khi bàn giao và đưa ra sử dụng.',
            details: ['Trình bày sạch đẹp, chỉn chu, chuyên nghiệp trước khi bàn giao'],
            weight: 10,
          },
          {
            id: 'sb_c3_2',
            title: 'Đúng phông chữ, mẫu căn chỉnh, hình ảnh minh họa rõ nét theo các yêu cầu.',
            details: ['Đúng phông chữ, mẫu căn chỉnh, hình ảnh minh họa rõ nét theo các yêu cầu'],
            weight: 10,
          },
        ],
      },
    ],
  },
];

// Dữ liệu mẫu khởi đầu 1 nhân viên (khi chưa nhập URL Google Apps Script)
export const SAMPLE_ONE_STAFF: Staff[] = [
  {
    id: 'staff_1',
    code: 'TD-001',
    fullName: 'Lê Hoàng Nam',
    citizenId: '001201012345',
    cccd: '001201012345',
    role: 'Giảng viên Sinh học',
    roleType: 'giang_vien',
    roles: ['giang_vien'],
    assignedChecklistId: 'chk_day_hoc',
    assignedChecklistIds: ['chk_day_hoc'],
    departmentId: 'day_hoc',
    departmentName: 'Bộ phận Dạy Học',
    division: 'CHUYEN_MON',
    bankAccount: '1903456789012',
    bankName: 'Techcombank',
    bankOwner: 'LE HOANG NAM',
    phone: '0987654321',
    email: 'hoangnam.sinhhoc@gmail.com',
    salaryModel: 'session',
    baseRate: 70000,
    rates: {
      teachingRate: 70000,
      tutoringRate: 70000,
      gradingRate: 10000,
      dayWorkRate: 150000,
    },
    defaultPieceworkRates: {
      troGiangPerSession: 70000,
      chamBaiPerItem: 10000,
      soanBaiPerItem: 100000,
    },
    isActive: true,
  },
];

export const INITIAL_STAFF: Staff[] = SAMPLE_ONE_STAFF;

export const INITIAL_PAYROLL_SLIPS: MonthlyPayrollSlip[] = [];

export const INITIAL_TIMESHEET_ENTRIES: TimesheetEntry[] = [
  {
    id: 'ts_1',
    staffId: 'staff_1',
    month: '2026-07',
    date: '2026-07-01',
    type: 'teaching_session',
    label: 'Ca dạy học chuyên môn',
    quantity: 12,
    unit: 'Buổi',
    rate: 70000,
    kpiScore: 100,
    note: 'Mẫu 1 nhân viên ban đầu',
  },
];

export const INITIAL_EVALUATIONS: KpiEvaluation[] = [
  {
    id: 'eval_1',
    staffId: 'staff_1',
    month: '2026-07',
    templateId: 'chk_day_hoc',
    evaluationDate: '2026-07-31',
    evaluatorName: 'Đại Diện Lớp',
    scores: {
      dh_c1_1: 100,
      dh_c1_2: 100,
      dh_c1_3: 100,
      dh_c2_1: 100,
      dh_c2_2: 100,
      dh_c3_1: 100,
      dh_c3_2: 100,
      dh_c3_3: 100,
      dh_c4_1: 100,
      dh_c4_2: 100,
      dh_c4_3: 100,
    },
    calculatedTotalKpi: 100,
    notes: 'Đánh giá mẫu 1 nhân viên',
  },
];


