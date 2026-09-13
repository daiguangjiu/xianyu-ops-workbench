import { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useTheme } from '../hooks/useTheme';
import { isAuthed } from '../auth/auth';

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // 路由守卫
  useEffect(() => {
    if (!isAuthed()) {
      navigate('/login', { replace: true, state: { from: location.pathname } });
    }
  }, [navigate, location.pathname]);

  // 切换路由时关闭移动端抽屉
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [isMobile]);

  const handleToggleSidebar = useCallback(() => setSidebarOpen((s) => !s), []);

  if (!isAuthed()) return null;

  return (
    <div className="app-shell">
      <Sidebar
        open={sidebarOpen}
        mobileOpen={mobileOpen}
        isMobile={isMobile}
        onCloseMobile={() => setMobileOpen(false)}
        onToggle={handleToggleSidebar}
      />
      <main className="app-main">
        <Header
          sidebarOpen={sidebarOpen}
          isMobile={isMobile}
          theme={theme}
          onToggleSidebar={handleToggleSidebar}
          onOpenMobileMenu={() => setMobileOpen(true)}
          onToggleTheme={toggleTheme}
        />
        <div className="app-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
