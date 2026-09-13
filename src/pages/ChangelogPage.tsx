import { ScrollText } from 'lucide-react';

const LOGS = [
  {
    version: 'v0.1.0',
    date: '2026-09-13',
    title: '首个版本上线',
    items: [
      '用户体系：内置超级管理员（admin），其他用户由超管在「用户管理」中添加，支持重置密码、停用/启用、删除',
      '工作台：数据看板（任务进度 / 今日SOP / 本月成交总览）、任务管理（新建/编辑/状态流转/筛选）',
      '自营业务：运营SOP（运营日历，每人员每日任务打卡，自动保存历史记录，按月回溯）、数据分析（按日录入曝光/浏览/想要/成交，GMV趋势图）、投流诊断器（漏斗四段转化诊断与优化建议）',
      '系统：设置（改密/主题/清空数据）、更新日志',
      '技术：React 18 + Vite 5 + Tailwind，纯前端本地存储（localStorage），Hash 路由支持静态托管',
    ],
  },
];

export function ChangelogPage() {
  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <div className="page-title">更新日志</div>
        <div className="page-sub">版本迭代与变更记录</div>
      </div>

      <div className="relative pl-6">
        <div className="absolute left-[7px] top-2 bottom-2 w-px" style={{ background: 'var(--border)' }} />
        {LOGS.map((log) => (
          <div key={log.version} className="relative mb-6">
            <div className="absolute -left-6 top-1.5 w-[15px] h-[15px] rounded-full flex items-center justify-center" style={{ background: 'var(--gradient-brand)', boxShadow: '0 0 0 3px var(--bg)' }}>
              <ScrollText size={9} color="#fff" />
            </div>
            <div className="card card-pad">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="chip" style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--brand-strong)', border: '1px solid rgba(99,102,241,0.24)' }}>{log.version}</span>
                <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>{log.date}</span>
                <span className="font-bold text-[14px]" style={{ color: 'var(--text)' }}>{log.title}</span>
              </div>
              <ul className="mt-3 space-y-1.5">
                {log.items.map((it, i) => (
                  <li key={i} className="flex gap-2 text-[12.5px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--brand)' }}>•</span>{it}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
