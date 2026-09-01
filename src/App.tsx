import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { PayrollList } from './components/Payroll/PayrollList';
import { TimesheetManager } from './components/Timesheet/TimesheetManager';
import { EvaluationTab } from './components/Evaluation/EvaluationTab';
import { StaffManager } from './components/Staff/StaffManager';
import { ChecklistCatalog } from './components/Checklists/ChecklistCatalog';
import { AssignmentNotice } from './components/Notice/AssignmentNotice';
import { SettingsView } from './components/Settings/SettingsView';
import { GoogleSheetsIntegration } from './components/GoogleSheet/GoogleSheetsIntegration';

const MainContent: React.FC = () => {
  const { activeTab } = useApp();

  return (
    <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1">
      {activeTab === 'payroll' && <PayrollList />}
      {activeTab === 'timesheet' && <TimesheetManager />}
      {activeTab === 'evaluation' && <EvaluationTab />}
      {activeTab === 'staff' && <StaffManager />}
      {activeTab === 'checklists' && <ChecklistCatalog />}
      {activeTab === 'notice' && <AssignmentNotice />}
      {activeTab === 'settings' && <SettingsView />}
      {activeTab === 'gsheet' && <GoogleSheetsIntegration />}
    </main>
  );
};

const AppLayout: React.FC = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-100/70 text-slate-900 flex font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* Left Sidebar Navigation */}
      <Sidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Scrollable Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto overflow-x-hidden">
        <TopHeader onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)} />
        <MainContent />
        
        {/* Subtle Footer */}
        <footer className="no-print border-t border-slate-200/80 bg-white/60 py-3 text-center text-xs text-slate-500 mt-auto shrink-0">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>© 2026 Triple D - Hệ Thống Quản Lý Lương & Đánh Giá KPI Trọng Số</span>
            <span className="text-[11px] text-slate-400">Quy chuẩn chuyên môn HSGQG Sinh Học</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppLayout />
    </AppProvider>
  );
}

