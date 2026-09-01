import {
  Staff,
  TimesheetEntry,
  KpiEvaluation,
  MonthlyPayrollSlip,
  OrgSettings,
  ChecklistTemplate
} from '../types';

export interface GoogleSheetsPayload {
  staffList: Staff[];
  timesheetEntries: TimesheetEntry[];
  evaluations: KpiEvaluation[];
  payrollSlips: MonthlyPayrollSlip[];
  orgSettings: OrgSettings;
  checklistTemplates?: ChecklistTemplate[];
  lastUpdated?: string;
}

// Helper function to sanitize and normalize staff data
export function sanitizeStaff(s: Staff): Staff {
  let roles = s.roles;
  if (!roles || !Array.isArray(roles) || roles.length === 0) {
    if (typeof s.roleType === 'string' && (s.roleType as string).includes(',')) {
      roles = (s.roleType as string).split(',').map(r => r.trim() as any);
    } else if (s.roleType) {
      roles = [s.roleType];
    } else {
      roles = ['giang_vien'];
    }
  }

  let assignedChecklistIds = s.assignedChecklistIds;
  if (!assignedChecklistIds || !Array.isArray(assignedChecklistIds) || assignedChecklistIds.length === 0) {
    const defaultIds: string[] = [];
    if (roles.includes('giang_vien')) defaultIds.push('chk_day_hoc', 'chk_soan_bai');
    if (roles.includes('tro_giang')) defaultIds.push('chk_tro_giang');
    if (roles.includes('cham_thi')) defaultIds.push('chk_cham_thi');
    if (roles.includes('tro_ly')) defaultIds.push('chk_tro_ly');
    assignedChecklistIds = Array.from(new Set(defaultIds));
  }

  return {
    ...s,
    roleType: roles[0] || s.roleType || 'giang_vien',
    roles,
    assignedChecklistIds,
  };
}

// Helper function to sanitize and normalize timesheet entries
export function sanitizeTimesheetEntry(t: TimesheetEntry): TimesheetEntry {
  let month = (t.month || '').trim();
  let date = (t.date || '').trim();

  // Fix timezone shift issue if Google Sheets returns a UTC ISO string (e.g., "2024-04-30T17:00:00.000Z" for May 1st GMT+7)
  const fixIsoDate = (isoStr: string) => {
    if (isoStr.includes('T') && isoStr.endsWith('Z')) {
      const d = new Date(isoStr);
      // We assume the date was intended for Vietnam time (GMT+7), but it got converted to UTC
      // Wait, no. If we just create a Date object, its local time will be the user's browser time, which is usually correct if they are in Vietnam.
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return { yyyy_mm: `${yyyy}-${mm}`, yyyy_mm_dd: `${yyyy}-${mm}-${dd}` };
    }
    return null;
  };

  const fixedMonth = fixIsoDate(month);
  if (fixedMonth) month = fixedMonth.yyyy_mm;

  const fixedDate = fixIsoDate(date);
  if (fixedDate) date = fixedDate.yyyy_mm_dd;

  // Normalize DD/MM/YYYY -> YYYY-MM-DD
  if (date.includes('/')) {
    const parts = date.split('/');
    if (parts.length === 3) {
      const d = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      const y = parts[2];
      if (y.length === 4) date = `${y}-${m}-${d}`;
    }
  }

  // Normalize MM/YYYY or M/YYYY -> YYYY-MM
  if (month.includes('/')) {
    const mParts = month.split('/');
    if (mParts.length === 2) {
      const m = mParts[0].padStart(2, '0');
      const y = mParts[1];
      if (y.length === 4) month = `${y}-${m}`;
    }
  }

  if ((!month || month.length !== 7 || !month.includes('-')) && date.length >= 7 && date.includes('-')) {
    month = date.substring(0, 7);
  }

  let quantity = Number(t.quantity) || 0;
  let rate = Number(t.rate) || 0;
  let unit = (t.unit || '').trim();

  // Backward compatibility: Handle old spreadsheet schema where Column H was 'rate' and Column I was 'amount'
  // The new GAS script reads Column H as 'unit' and Column I as 'rate'.
  // If 'unit' is a string containing a valid large number (e.g. "500000"), it is actually the legacy rate.
  if (!isNaN(Number(unit)) && Number(unit) > 0 && String(unit).match(/^[0-9]+$/)) {
    rate = Number(unit);
    unit = 'Buổi'; // Default fallback unit
  }

  return {
    ...t,
    month,
    date,
    staffId: (t.staffId || '').trim(),
    quantity,
    rate,
    unit
  };
}

export const GOOGLE_APPS_SCRIPT_TEMPLATE = `/**
 * =========================================================================
 * TRIPLE D - GOOGLE APPS SCRIPT ĐỒNG BỘ DỮ LIỆU BẢNG LƯƠNG & CHẤM CÔNG
 * =========================================================================
 * 
 * HƯỚNG DẪN CÀI ĐẶT 3 BƯỚC:
 * 1. Mở Google Sheet của bạn -> Menu 'Tiện ích mở rộng' (Extensions) -> 'Apps Script'
 * 2. Xóa hết code cũ trong file Code.gs, Dán toàn bộ mã nguồn này vào -> Bấm nút 'Lưu' (hình đĩa mềm)
 * 3. Bấm nút 'Triển khai' (Deploy) màu xanh góc phải trên -> Chọn 'Triển khai mới' (New deployment)
 *    - Loại: 'Ứng dụng web' (Web app)
 *    - Mô tả: 'Triple D Payroll API'
 *    - Thực thi dưới dạng: 'Tôi' (Me)
 *    - Ai có quyền truy cập: 'Bất kỳ ai' (Anyone)
 *    - Bấm 'Triển khai' -> Cấp quyền nếu hỏi -> Copy 'URL Ứng dụng web' (kết thúc bằng /exec)
 *    - Dán URL đó vào mục Cài Đặt / Đồng bộ Google Sheet trên Web app!
 */

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'readAll';
    
    if (action === 'readAll') {
      var data = readAllDataFromSheets(ss);
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        data: data,
        message: 'Đã tải dữ liệu thành công từ Google Sheet!'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Triple D Apps Script API is running!'
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var postData = null;
    
    if (e && e.postData && e.postData.contents) {
      postData = JSON.parse(e.postData.contents);
    }
    
    if (!postData) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: 'Không tìm thấy dữ liệu tải lên!'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    var action = postData.action || 'writeAll';
    
    if (action === 'writeAll' && postData.data) {
      writeAllDataToSheets(ss, postData.data);
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Đã lưu và đồng bộ toàn bộ dữ liệu lên Google Sheet thành công!'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === 'clearAll') {
      clearAllSheetsData(ss);
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Đã xóa toàn bộ dữ liệu trên các Sheet thành công!'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Hành động không hợp lệ: ' + action
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ==========================================
// 1. ĐỌC DỮ LIỆU TỪ GOOGLE SHEET VỀ WEB APP
// ==========================================
function readAllDataFromSheets(ss) {
  var result = {
    staffList: [],
    timesheetEntries: [],
    evaluations: [],
    payrollSlips: [],
    orgSettings: null
  };
  
  // 1.1 Đọc Nhân Sự (NhanSu)
  var sheetStaff = ss.getSheetByName('NhanSu');
  if (sheetStaff && sheetStaff.getLastRow() > 1) {
    var staffRows = sheetStaff.getRange(2, 1, sheetStaff.getLastRow() - 1, sheetStaff.getLastColumn()).getValues();
    result.staffList = staffRows.map(function(r, index) {
      var ratesObj = {};
      try {
        if (r[15]) {
          ratesObj = typeof r[15] === 'string' ? JSON.parse(r[15]) : r[15];
        }
      } catch(e) {}
      
      var rawRoleType = String(r[4] || 'giang_vien');
      var rolesArr = [];
      if (ratesObj._roles && Array.isArray(ratesObj._roles) && ratesObj._roles.length > 0) {
        rolesArr = ratesObj._roles;
      } else if (rawRoleType.indexOf(',') !== -1) {
        rolesArr = rawRoleType.split(',').map(function(s) { return s.trim(); });
      } else if (rawRoleType) {
        rolesArr = [rawRoleType];
      } else {
        rolesArr = ['giang_vien'];
      }

      var assignedChecklistsArr = [];
      if (ratesObj._assignedChecklistIds && Array.isArray(ratesObj._assignedChecklistIds) && ratesObj._assignedChecklistIds.length > 0) {
        assignedChecklistsArr = ratesObj._assignedChecklistIds;
      }
      
      return {
        id: String(r[0]) || ('staff_' + (index + 1)),
        code: String(r[1] || ''),
        fullName: String(r[2] || ''),
        role: String(r[3] || 'Thành Viên'),
        roleType: rolesArr[0] || 'giang_vien',
        roles: rolesArr,
        assignedChecklistIds: assignedChecklistsArr,
        departmentId: String(r[5] || 'day_hoc'),
        departmentName: String(r[6] || 'Dạy Học'),
        division: String(r[7] || 'CHUYEN_MON'),
        bankAccount: String(r[8] || ''),
        bankName: String(r[9] || ''),
        bankOwner: String(r[10] || ''),
        phone: String(r[11] || ''),
        email: String(r[12] || ''),
        baseRate: Number(r[13]) || 70000,
        isActive: r[14] !== false && r[14] !== 'false' && r[14] !== 'FALSE',
        rates: Object.keys(ratesObj).length > 0 ? ratesObj : {
          teachingRate: Number(r[13]) || 70000,
          tutoringRate: 70000,
          gradingRate: 10000,
          dayWorkRate: 70000
        }
      };
    }).filter(function(s) { return s.fullName.trim().length > 0; });
  }
  
  // 1.2 Đọc Chấm Công (ChamCong)
  var sheetTs = ss.getSheetByName('ChamCong');
  if (sheetTs && sheetTs.getLastRow() > 1) {
    var tsRows = sheetTs.getRange(2, 1, sheetTs.getLastRow() - 1, sheetTs.getLastColumn()).getValues();
    result.timesheetEntries = tsRows.map(function(r, index) {
      var dateVal = r[3];
      var dateStr = '';
      if (dateVal instanceof Date) {
        dateStr = Utilities.formatDate(dateVal, "GMT+7", "yyyy-MM-dd");
      } else {
        dateStr = String(dateVal || '').trim();
        if (dateStr.indexOf('/') !== -1) {
          var parts = dateStr.split('/');
          if (parts.length === 3) {
            var day = parts[0].padStart(2, '0');
            var month = parts[1].padStart(2, '0');
            var year = parts[2];
            if (year.length === 4) dateStr = year + '-' + month + '-' + day;
          }
        }
      }

      var monthVal = r[2];
      var monthStr = '';
      if (monthVal instanceof Date) {
        monthStr = Utilities.formatDate(monthVal, "GMT+7", "yyyy-MM");
      } else {
        monthStr = String(monthVal || '').trim();
        if (monthStr.indexOf('/') !== -1) {
          var mParts = monthStr.split('/');
          if (mParts.length === 2) {
            var mMonth = mParts[0].padStart(2, '0');
            var mYear = mParts[1];
            if (mYear.length === 4) monthStr = mYear + '-' + mMonth;
          }
        }
      }

      if ((!monthStr || monthStr.length !== 7 || monthStr.indexOf('-') === -1) && dateStr.length >= 7 && dateStr.indexOf('-') !== -1) {
        monthStr = dateStr.substring(0, 7);
      }

      return {
        id: String(r[0]) || ('ts_' + (index + 1)),
        staffId: String(r[1] || '').trim(),
        month: monthStr,
        date: dateStr,
        type: String(r[4] || 'teaching_session'),
        label: String(r[5] || ''),
        quantity: Number(r[6]) || 0,
        unit: String(r[7] || 'Buổi'),
        rate: Number(r[8]) || 0,
        kpiScore: Number(r[9]) || 100,
        note: String(r[10] || '')
      };
    }).filter(function(t) { return t.staffId && t.month; });
  }
  
  // 1.3 Đọc Đánh Giá KPI (DanhGiaKPI)
  var sheetEval = ss.getSheetByName('DanhGiaKPI');
  if (sheetEval && sheetEval.getLastRow() > 1) {
    var evalRows = sheetEval.getRange(2, 1, sheetEval.getLastRow() - 1, sheetEval.getLastColumn()).getValues();
    result.evaluations = evalRows.map(function(r, index) {
      var dateVal = r[4];
      var dateStr = '';
      if (dateVal instanceof Date) {
        dateStr = Utilities.formatDate(dateVal, "GMT+7", "yyyy-MM-dd");
      } else {
        dateStr = String(dateVal || '').trim();
      }

      var monthVal = r[2];
      var monthStr = '';
      if (monthVal instanceof Date) {
        monthStr = Utilities.formatDate(monthVal, "GMT+7", "yyyy-MM");
      } else {
        monthStr = String(monthVal || '').trim();
      }

      if ((!monthStr || monthStr.length !== 7 || monthStr.indexOf('-') === -1) && dateStr.length >= 7 && dateStr.indexOf('-') !== -1) {
        monthStr = dateStr.substring(0, 7);
      }

      var scoresObj = {};
      try {
        if (r[7]) {
          scoresObj = typeof r[7] === 'string' ? JSON.parse(r[7]) : r[7];
        }
      } catch(e) {}
      
      return {
        id: String(r[0]) || ('eval_' + (index + 1)),
        staffId: String(r[1] || '').trim(),
        month: monthStr,
        templateId: String(r[3] || 'chk_day_hoc'),
        evaluationDate: dateStr,
        evaluatorName: String(r[5] || ''),
        calculatedTotalKpi: Number(r[6]) || 100,
        scores: scoresObj,
        notes: String(r[8] || '')
      };
    }).filter(function(ev) { return ev.staffId && ev.month; });
  }
  
  // 1.4 Đọc Cấu Hình (CauHinh)
  var sheetCfg = ss.getSheetByName('CauHinh');
  if (sheetCfg && sheetCfg.getLastRow() > 1) {
    var cfgRows = sheetCfg.getRange(2, 1, sheetCfg.getLastRow() - 1, 2).getValues();
    var cfgMap = {};
    for (var i = 0; i < cfgRows.length; i++) {
      cfgMap[String(cfgRows[i][0])] = cfgRows[i][1];
    }
    result.orgSettings = {
      orgName: cfgMap['orgName'] || 'TRIPLE D ÔN THI HSGQG MÔN SINH HỌC',
      location: cfgMap['location'] || 'Hà Nội',
      managerTitle: cfgMap['managerTitle'] || 'ĐIỀU HÀNH TRIPLE D',
      managerName: cfgMap['managerName'] || 'Đặng Tuấn Anh',
      financeTitle: cfgMap['financeTitle'] || 'BAN KINH TẾ & VẬN HÀNH',
      financeName: cfgMap['financeName'] || 'Trần Hạnh Dung',
      showSignatures: cfgMap['showSignatures'] !== false && cfgMap['showSignatures'] !== 'false',
      currencySymbol: cfgMap['currencySymbol'] || 'VNĐ',
      defaultWorkingDaysInMonth: Number(cfgMap['defaultWorkingDaysInMonth']) || 26
    };
  }
  
  return result;
}

// ==========================================
// 2. GHI TOÀN BỘ DỮ LIỆU TỪ WEB LÊN GOOGLE SHEET
// ==========================================
function writeAllDataToSheets(ss, data) {
  // 2.1 Sheet NhanSu
  var sheetStaff = getOrCreateSheet(ss, 'NhanSu');
  sheetStaff.clear();
  var staffHeaders = [
    'ID', 'Mã NV', 'Họ và Tên', 'Chức Danh', 'Role Type', 'Mã Bộ Phận', 
    'Tên Bộ Phận', 'Nhánh', 'Số TKNH', 'Ngân Hàng', 'Chủ Tài Khoản', 
    'SĐT', 'Email', 'Lương Gốc / Đơn Giá', 'Trạng Thái', 'Tùy Biến Đơn Giá (JSON)'
  ];
  sheetStaff.appendRow(staffHeaders);
  formatHeaderRow(sheetStaff, '#1e293b');
  
  if (data.staffList && data.staffList.length > 0) {
    var staffData = data.staffList.map(function(s) {
      var ratesPayload = Object.assign({}, s.rates || {});
      if (s.roles && Array.isArray(s.roles)) {
        ratesPayload._roles = s.roles;
      }
      if (s.assignedChecklistIds && Array.isArray(s.assignedChecklistIds)) {
        ratesPayload._assignedChecklistIds = s.assignedChecklistIds;
      }
      var roleTypeStr = (s.roles && s.roles.length > 0) ? s.roles.join(',') : (s.roleType || 'giang_vien');

      return [
        s.id || '',
        s.code || '',
        s.fullName || '',
        s.role || '',
        roleTypeStr,
        s.departmentId || '',
        s.departmentName || '',
        s.division || '',
        s.bankAccount || '',
        s.bankName || '',
        s.bankOwner || '',
        s.phone || '',
        s.email || '',
        s.baseRate || 0,
        s.isActive ? true : false,
        JSON.stringify(ratesPayload)
      ];
    });
    sheetStaff.getRange(2, 1, staffData.length, staffHeaders.length).setValues(staffData);
  }
  
  // 2.2 Sheet ChamCong
  var sheetTs = getOrCreateSheet(ss, 'ChamCong');
  sheetTs.clear();
  var tsHeaders = [
    'ID', 'Mã NV', 'Kỳ Lương (Tháng)', 'Ngày', 'Loại Công Việc', 
    'Nội Dung / Tên Ca', 'Số Lượng', 'Đơn Vị', 'Đơn Giá (VNĐ)', 'KPI (%)', 'Ghi Chú'
  ];
  sheetTs.appendRow(tsHeaders);
  formatHeaderRow(sheetTs, '#0369a1');
  
  if (data.timesheetEntries && data.timesheetEntries.length > 0) {
    var tsData = data.timesheetEntries.map(function(t) {
      return [
        t.id || '',
        t.staffId || '',
        t.month || '',
        t.date || '',
        t.type || '',
        t.label || '',
        t.quantity || 0,
        t.unit || '',
        t.rate || 0,
        t.kpiScore || 100,
        t.note || ''
      ];
    });
    sheetTs.getRange(2, 1, tsData.length, tsHeaders.length).setValues(tsData);
  }
  
  // 2.3 Sheet DanhGiaKPI
  var sheetEval = getOrCreateSheet(ss, 'DanhGiaKPI');
  sheetEval.clear();
  var evalHeaders = [
    'ID', 'Mã NV', 'Kỳ Lương (Tháng)', 'Mã Bảng Kiểm', 'Ngày Đánh Giá', 
    'Người Đánh Giá', 'Tổng Điểm KPI (%)', 'Chi Tiết Điểm Tiêu Chí (JSON)', 'Ghi Chú Đánh Giá'
  ];
  sheetEval.appendRow(evalHeaders);
  formatHeaderRow(sheetEval, '#b45309');
  
  if (data.evaluations && data.evaluations.length > 0) {
    var evalData = data.evaluations.map(function(e) {
      return [
        e.id || '',
        e.staffId || '',
        e.month || '',
        e.templateId || '',
        e.evaluationDate || '',
        e.evaluatorName || '',
        e.calculatedTotalKpi || 100,
        JSON.stringify(e.scores || {}),
        e.notes || ''
      ];
    });
    sheetEval.getRange(2, 1, evalData.length, evalHeaders.length).setValues(evalData);
  }
  
  // 2.4 Sheet PhieuLuong (Lưu lại lịch sử phiếu lương)
  var sheetSlips = getOrCreateSheet(ss, 'PhieuLuong');
  sheetSlips.clear();
  var slipHeaders = [
    'Mã Phiếu', 'Kỳ Lương', 'Mã NV', 'Họ và Tên', 'Bộ Phận', 
    'Lương Chính (VNĐ)', 'Lương Sản Phẩm LTSP', 'Thưởng (VNĐ)', 'Khấu Trừ (VNĐ)', 
    'TỔNG THỰC NHẬN (VNĐ)', 'Số TKNH', 'Ngân Hàng', 'Trạng Thái', 'Ngày Cập Nhật'
  ];
  sheetSlips.appendRow(slipHeaders);
  formatHeaderRow(sheetSlips, '#047857');
  
  if (data.payrollSlips && data.payrollSlips.length > 0) {
    var slipData = data.payrollSlips.map(function(s) {
      var pwTotal = s.pieceworkItems ? s.pieceworkItems.reduce(function(acc, p){ return acc + p.totalAmount; }, 0) : 0;
      return [
        s.id || '',
        s.month || '',
        s.staffCode || '',
        s.staffName || '',
        s.departmentName || '',
        s.primarySalary ? s.primarySalary.totalAmount : 0,
        pwTotal,
        s.generalBonus || 0,
        s.deductions || 0,
        s.totalSalary || 0,
        s.bankAccount || '',
        s.bankName || '',
        s.status || 'draft',
        s.updatedAt || ''
      ];
    });
    sheetSlips.getRange(2, 1, slipData.length, slipHeaders.length).setValues(slipData);
  }
  
  // 2.5 Sheet CauHinh
  if (data.orgSettings) {
    var sheetCfg = getOrCreateSheet(ss, 'CauHinh');
    sheetCfg.clear();
    sheetCfg.appendRow(['Khóa Cấu Hình', 'Giá Trị']);
    formatHeaderRow(sheetCfg, '#334155');
    
    var cfgRows = [
      ['orgName', data.orgSettings.orgName || ''],
      ['location', data.orgSettings.location || ''],
      ['managerTitle', data.orgSettings.managerTitle || ''],
      ['managerName', data.orgSettings.managerName || ''],
      ['financeTitle', data.orgSettings.financeTitle || ''],
      ['financeName', data.orgSettings.financeName || ''],
      ['showSignatures', data.orgSettings.showSignatures ? 'true' : 'false'],
      ['currencySymbol', data.orgSettings.currencySymbol || 'VNĐ'],
      ['defaultWorkingDaysInMonth', data.orgSettings.defaultWorkingDaysInMonth || 26],
      ['lastUpdated', new Date().toISOString()]
    ];
    sheetCfg.getRange(2, 1, cfgRows.length, 2).setValues(cfgRows);
  }
}

// 3. XÓA TOÀN BỘ DỮ LIỆU TRÊN CÁC SHEETS (GIỮ NGUYÊN TIÊU ĐỀ)
function clearAllSheetsData(ss) {
  var sheetNames = ['NhanSu', 'ChamCong', 'DanhGiaKPI', 'PhieuLuong'];
  for (var i = 0; i < sheetNames.length; i++) {
    var sheet = ss.getSheetByName(sheetNames[i]);
    if (sheet && sheet.getLastRow() > 1) {
      sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
    }
  }
}

function getOrCreateSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function formatHeaderRow(sheet, bgColor) {
  var range = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  range.setBackground(bgColor);
  range.setFontColor('#ffffff');
  range.setFontWeight('bold');
  range.setFontSize(10);
  range.setHorizontalAlignment('center');
  sheet.setFrozenRows(1);
}
`;

export const FIXED_GOOGLE_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbwT6d4DFbe8DQ38ZAJqbTLn4oqNvfUPSZcgn5nJgsMR99-RW-Rt7edygms0T0q0lG8bMg/exec';

export async function fetchFromGoogleSheet(
  webAppUrl: string = ''
): Promise<{ success: boolean; data?: GoogleSheetsPayload; message: string }> {
  try {
    const cleanUrl = (webAppUrl || '').trim();
    if (!cleanUrl || !cleanUrl.startsWith('http')) {
      return {
        success: false,
        message: 'Chưa cấu hình URL Ứng dụng web Google Apps Script hợp lệ (bắt đầu bằng https://script.google.com/macros/s/.../exec)',
      };
    }

    const targetUrl = cleanUrl.includes('?') ? `${cleanUrl}&action=readAll` : `${cleanUrl}?action=readAll`;
    
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Máy chủ Google phản hồi mã lỗi HTTP ${response.status}`);
    }

    const resJson = await response.json();
    if (resJson.status === 'success' && resJson.data) {
      if (Array.isArray(resJson.data.staffList)) {
        resJson.data.staffList = resJson.data.staffList.map(s => sanitizeStaff(s));
      }
      if (Array.isArray(resJson.data.timesheetEntries)) {
        resJson.data.timesheetEntries = resJson.data.timesheetEntries.map(t => sanitizeTimesheetEntry(t));
      }
      return {
        success: true,
        data: resJson.data,
        message: resJson.message || 'Đã đồng bộ dữ liệu từ Google Sheet thành công!',
      };
    } else {
      return {
        success: false,
        message: resJson.message || 'Không thể lấy dữ liệu từ Google Sheet.',
      };
    }
  } catch (err: any) {
    console.error('Fetch Google Sheet failed:', err);
    return {
      success: false,
      message: `Lỗi kết nối Google Sheet: ${err.message || 'Vui lòng kiểm tra quyền truy cập Anyone trên Google Apps Script'}`,
    };
  }
}

export async function pushToGoogleSheet(
  webAppUrl: string = '',
  payload: GoogleSheetsPayload
): Promise<{ success: boolean; message: string }> {
  try {
    const cleanUrl = (webAppUrl || '').trim();
    if (!cleanUrl || !cleanUrl.startsWith('http')) {
      return { success: false, message: 'Chưa cấu hình URL Ứng dụng web Google Apps Script hợp lệ' };
    }

    // Prepare a backward-compatible payload for users who haven't updated their GAS script.
    // Old GAS scripts rely on 'roleType' column and don't automatically inject 'roles' into 'rates'.
    const compatPayload = {
      ...payload,
      staffList: payload.staffList.map(s => {
        const ratesPayload = { ...(s.rates || {}) } as any;
        if (s.roles && Array.isArray(s.roles)) ratesPayload._roles = s.roles;
        if (s.assignedChecklistIds && Array.isArray(s.assignedChecklistIds)) ratesPayload._assignedChecklistIds = s.assignedChecklistIds;
        
        return {
          ...s,
          rates: ratesPayload,
          roleType: (s.roles && s.roles.length > 0) ? s.roles.join(', ') : (s.roleType || 'giang_vien')
        };
      })
    };

    const bodyData = {
      action: 'writeAll',
      data: compatPayload,
    };

    // Google Apps Script accepts text/plain to bypass CORS preflight
    const response = await fetch(cleanUrl, {
      method: 'POST',
      body: JSON.stringify(bodyData),
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
    });

    if (!response.ok) {
      throw new Error(`Máy chủ Google phản hồi mã lỗi HTTP ${response.status}`);
    }

    const resJson = await response.json();
    if (resJson.status === 'success') {
      return {
        success: true,
        message: resJson.message || 'Đã đẩy dữ liệu lên Google Sheet thành công!',
      };
    } else {
      return {
        success: false,
        message: resJson.message || 'Google Sheet từ chối cập nhật dữ liệu.',
      };
    }
  } catch (err: any) {
    console.error('Push Google Sheet failed:', err);
    return {
      success: false,
      message: `Lỗi đồng bộ lên Google Sheet: ${err.message || 'Vui lòng kiểm tra URL Apps Script và quyền triển khai Anyone.'}`,
    };
  }
}

export async function clearGoogleSheetData(
  webAppUrl: string = ''
): Promise<{ success: boolean; message: string }> {
  try {
    const cleanUrl = (webAppUrl || '').trim();
    if (!cleanUrl || !cleanUrl.startsWith('http')) {
      return { success: false, message: 'Chưa cấu hình URL Ứng dụng web Google Apps Script hợp lệ' };
    }

    // Pass empty payload as fallback if legacy script, plus action: clearAll
    const bodyData = {
      action: 'clearAll',
      data: {
        staffList: [],
        timesheetEntries: [],
        evaluations: [],
        payrollSlips: [],
      },
    };

    const response = await fetch(cleanUrl, {
      method: 'POST',
      body: JSON.stringify(bodyData),
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
    });

    if (!response.ok) {
      throw new Error(`Máy chủ Google phản hồi mã lỗi HTTP ${response.status}`);
    }

    const resJson = await response.json();
    if (resJson.status === 'success') {
      return {
        success: true,
        message: resJson.message || 'Đã xóa toàn bộ dữ liệu trên Google Sheet thành công!',
      };
    } else {
      return {
        success: false,
        message: resJson.message || 'Google Sheet từ chối xóa dữ liệu.',
      };
    }
  } catch (err: any) {
    console.error('Clear Google Sheet failed:', err);
    return {
      success: false,
      message: `Lỗi khi xóa dữ liệu trên Google Sheet: ${err.message || 'Vui lòng kiểm tra kết nối.'}`,
    };
  }
}

