import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import { APP_CONFIG } from '../config';
import { NAV_GROUPS } from './navConfig';
import { currentUser, isSuperadmin } from '../auth/auth';

interface Props {
  open: boolean;
  mobileOpen: boolean;
  isMobile: boolean;
  onCloseMobile: () => void;
  onToggle: () => void;
}

export function Sidebar({ open, mobileOpen, isMobile, onCloseMobile }: Props) {
  const me = currentUser();
  const admin = isSuperadmin();

  return (
    <aside className={`sidebar ${!open && !isMobile ? 'collapsed' : ''} ${mobileOpen && isMobile ? 'mobile-open' : ''}`}>
      <div className="sidebar-brand">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--gradient-brand)' }}>
          <span className="text-white text-base font-black">{APP_CONFIG.nameInitial}</span>
        </div>
        <div className="leading-tight min-w-0">
          <div className="text-[14.5px] font-black truncate" style={{ color: 'var(--text)' }}>{APP_CONFIG.short}</div>
          <div className="text-[10.5px]" style={{ color: 'var(--text-muted)' }}>v{APP_CONFIG.version}</div>
        </div>
        {isMobile && (
          <button className="icon-btn ml-auto" onClick={onCloseMobile} aria-label="关闭菜单">
            <X size={15} />
          </button>
        )}
      </div>

      <nav className="sidebar-nav">
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter((i) => !i.superOnly || admin);
          if (!items.length) return null;
          return (
            <div key={group.key}>
              <div className="nav-group-title">{group.title}</div>
              {items.map((item) => (
                <div key={item.path}>
                  <NavLink to={item.path} end={item.children?.some((c) => c.path === item.path)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <item.Icon size={16} className="flex-shrink-0" />
                    <span className="min-w-0">
                      <span className="block truncate">{item.label}</span>
                      <span className="nav-sub block truncate">{item.sub}</span>
                    </span>
                  </NavLink>
                  {item.children && (
                    <div className="nav-children">
                      {item.children.map((c) => (
                        <NavLink key={c.path} to={c.path} end={c.path === item.path} className={({ isActive }) => `nav-item nav-child ${isActive ? 'active' : ''}`}>
                          <c.Icon size={13} className="flex-shrink-0" />
                          <span className="min-w-0">
                            <span className="block truncate">{c.label}</span>
                            <span className="nav-sub block truncate">{c.sub}</span>
                          </span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </nav>

      {me && (
        <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="text-[12px] font-semibold truncate" style={{ color: 'var(--text)' }}>{me.name}</div>
          <div className="text-[10.5px]" style={{ color: 'var(--text-muted)' }}>
            {me.role === 'superadmin' ? '超级管理员' : '运营成员'} · @{me.username}
          </div>
        </div>
      )}
    </aside>
  );
}
