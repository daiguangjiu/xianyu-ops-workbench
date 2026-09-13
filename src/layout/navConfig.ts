import {
  LayoutDashboard, ListTodo, CalendarCheck, BarChart3, Stethoscope,
  Settings, ScrollText, Users, ListChecks,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  path: string;
  label: string;
  sub: string;
  Icon: LucideIcon;
  /** 仅超级管理员可见 */
  superOnly?: boolean;
  /** 三级子页面 */
  children?: NavItem[];
}

export interface NavGroup {
  key: string;
  title: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    key: 'workspace',
    title: '工作台',
    items: [
      { path: '/dashboard', label: '数据看板', sub: '经营与任务总览', Icon: LayoutDashboard },
      { path: '/tasks', label: '任务管理', sub: '待办 · 进度 · 验收', Icon: ListTodo },
    ],
  },
  {
    key: 'ops',
    title: '自营业务',
    items: [
      {
        path: '/ops/sop', label: '运营SOP', sub: '运营日历 · 每日任务打卡', Icon: CalendarCheck,
        children: [
          { path: '/ops/sop', label: '运营日历', sub: '每人员每日打卡 · 历史留痕', Icon: CalendarCheck },
          { path: '/ops/sop/checklist', label: '每日Checklist', sub: '单账号全维SOP · 手册原文', Icon: ListChecks },
        ],
      },
      { path: '/ops/analytics', label: '数据分析', sub: '曝光→成交全链路量化', Icon: BarChart3 },
      { path: '/ops/diagnose', label: '投流诊断器', sub: '五段漏斗 · 断点定位', Icon: Stethoscope },
    ],
  },
  {
    key: 'system',
    title: '系统',
    items: [
      { path: '/settings', label: '设置', sub: '账户 · 主题 · 数据', Icon: Settings },
      { path: '/changelog', label: '更新日志', sub: '版本与变更记录', Icon: ScrollText },
      { path: '/users', label: '用户管理', sub: '账号开通与权限', Icon: Users, superOnly: true },
    ],
  },
];

/** 路由 → 页面标题映射，供 Header 面包屑使用 */
export const ROUTE_TITLES: Record<string, { title: string; sub: string; group: string }> = {
  '/dashboard': { title: '数据看板', sub: '经营指标与任务进度总览', group: '工作台' },
  '/tasks': { title: '任务管理', sub: '自营业务的待办与项目跟踪', group: '工作台' },
  '/ops/sop': { title: '运营SOP · 运营日历', sub: '每人员每日任务执行与历史留痕', group: '自营业务' },
  '/ops/sop/checklist': { title: '运营SOP · 每日Checklist', sub: '单账号全维SOP·Checklist（源自《闲鱼自运营手册》）', group: '自营业务' },
  '/ops/analytics': { title: '数据分析', sub: '曝光/浏览/想要/成交全链路量化看板', group: '自营业务' },
  '/ops/diagnose': { title: '投流诊断器', sub: '漏斗五段转化诊断与优化建议', group: '自营业务' },
  '/settings': { title: '设置', sub: '账户、主题与数据管理', group: '系统' },
  '/changelog': { title: '更新日志', sub: '版本迭代与变更记录', group: '系统' },
  '/users': { title: '用户管理', sub: '账号开通、停用与密码重置（仅超级管理员）', group: '系统' },
};

export function routeMeta(path: string) {
  return ROUTE_TITLES[path] || { title: '工作台', sub: '', group: '工作台' };
}
