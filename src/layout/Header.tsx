import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, PanelLeftClose, PanelLeftOpen, Sun, Moon, LogOut } from 'lucide-react';
import { routeMeta } from './navConfig';
import { logout, currentUser } from '../auth/auth';
import type { Theme } from '../hooks/useTheme';

interface Props {
  sidebarOpen: boolean;
  isMobile: boolean;
  theme: Theme;
  onToggleSidebar: () => void;
  onOpenMobileMenu: () => void;
  onToggleTheme: () => void;
}

export function Header({ sidebarOpen, isMobile, theme, onToggleSidebar, onOpenMobileMenu, onToggleTheme }: Props) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const meta = routeMeta(pathname);
  const me = currentUser();

  return (
    <header className="header">
      {isMobile ? (
        <button className="icon-btn" onClick={onOpenMobileMenu} aria-label="打开菜单"><Menu size={16} /></button>
      ) : (
        <button className="icon-btn" onClick={onToggleSidebar} aria-label="收起/展开侧栏">
          {sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
        </button>
      )}

      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-[11.5px] font-medium" style={{ color: 'var(--text-muted)' }}>
          <span className="hidden sm:inline">{meta.group}</span>
          <span className="hidden sm:inline">/</span>
          <span className="font-semibold truncate" style={{ color: 'var(--text)' }}>{meta.title}</span>
        </div>
        <div className="text-[11px] truncate hidden md:block" style={{ color: 'var(--text-muted)' }}>{meta.sub}</div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button className="icon-btn" onClick={onToggleTheme} aria-label="切换主题">
          {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
        </button>
        {me && (
          <button
            className="btn btn-sm"
            onClick={() => { logout(); navigate('/login', { replace: true }); }}
            title="退出登录"
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">{me.name} · 退出</span>
          </button>
        )}
      </div>
    </header>
  );
}
