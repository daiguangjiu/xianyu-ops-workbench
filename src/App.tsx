import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './layout/AppLayout';
import { LoginPage } from './auth/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { TasksPage } from './pages/TasksPage';
import { SopCalendarPage } from './pages/SopCalendarPage';
import { SopChecklistPage } from './pages/SopChecklistPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { DiagnosePage } from './pages/DiagnosePage';
import { SettingsPage } from './pages/SettingsPage';
import { ChangelogPage } from './pages/ChangelogPage';
import { UsersPage } from './pages/UsersPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<AppLayout />}>
        {/* 一级菜单：工作台 */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        {/* 一级菜单：自营业务 */}
        <Route path="/ops/sop" element={<SopCalendarPage />} />
        <Route path="/ops/sop/checklist" element={<SopChecklistPage />} />
        <Route path="/ops/analytics" element={<AnalyticsPage />} />
        <Route path="/ops/diagnose" element={<DiagnosePage />} />
        {/* 一级菜单：系统 */}
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/changelog" element={<ChangelogPage />} />
        <Route path="/users" element={<UsersPage />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
