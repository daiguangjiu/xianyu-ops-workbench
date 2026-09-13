import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListTodo, CalendarCheck, ShoppingBag, TrendingUp, ArrowRight } from 'lucide-react';
import { useTasks } from '../stores/taskStore';
import { useMetrics } from '../stores/analyticsStore';
import { useSop, todayStr, recordPct, recordKey } from '../stores/sopStore';
import { getUsers, currentUser } from '../auth/auth';
import { STATUS_LABEL } from '../stores/taskStore';

export function DashboardPage() {
  const navigate = useNavigate();
  const { tasks } = useTasks();
  const { metrics } = useMetrics();
  const { records } = useSop();
  const users = getUsers();
  const me = currentUser();
  const today = todayStr();

  const todayTasks = tasks.filter((t) => t.status !== 'done');
  const doneRate = tasks.length ? Math.round((tasks.filter((t) => t.status === 'done').length / tasks.length) * 100) : 0;

  const myTodayRecord = me ? records[recordKey(today, me.id)] : undefined;
  const sopPct = recordPct(today, myTodayRecord);

  const monthPrefix = today.slice(0, 7);
  const monthMetrics = metrics.filter((m) => m.date.startsWith(monthPrefix));
  const monthOrders = monthMetrics.reduce((s, m) => s + m.orders, 0);
  const monthGmv = monthMetrics.reduce((s, m) => s + m.gmv, 0);

  /** 全员今日SOP完成情况 */
  const teamSop = useMemo(() => users.map((u) => {
    const r = records[recordKey(today, u.id)];
    return { name: u.name, pct: recordPct(today, r), has: !!r };
  }), [users, records, today]);

  const cards = [
    { Icon: ListTodo, label: '进行中任务', value: `${todayTasks.length}`, sub: `总完成率 ${doneRate}%`, color: 'var(--brand)', to: '/tasks' },
    { Icon: CalendarCheck, label: '今日我的SOP', value: `${sopPct}%`, sub: myTodayRecord ? '已打卡' : '今日尚未打卡', color: 'var(--accent-emerald)', to: '/ops/sop' },
    { Icon: ShoppingBag, label: '本月成交', value: `${monthOrders} 单`, sub: `GMV ¥${monthGmv.toLocaleString()}`, color: 'var(--accent-amber)', to: '/ops/analytics' },
    { Icon: TrendingUp, label: '本月记录天数', value: `${monthMetrics.length} 天`, sub: '经营数据持续追踪', color: 'var(--accent-sky)', to: '/ops/analytics' },
  ];

  return (
    <div className="space-y-4 max-w-6xl">
      <div>
        <div className="page-title">数据看板</div>
        <div className="page-sub">你好，{me?.name} · 经营指标与任务进度总览</div>
      </div>

      <div className="grid-cards">
        {cards.map(({ Icon, label, value, sub, color, to }) => (
          <div key={label} className="card card-pad cursor-pointer transition-transform hover:-translate-y-0.5" onClick={() => navigate(to)}>
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--bg-inset)' }}>
                <Icon size={17} color={color} />
              </div>
              <ArrowRight size={14} color="var(--text-muted)" />
            </div>
            <div className="text-[24px] font-black mt-3 tabular-nums" style={{ color: 'var(--text)' }}>{value}</div>
            <div className="text-[12.5px] font-semibold mt-0.5" style={{ color: 'var(--text-secondary)' }}>{label}</div>
            <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</div>
          </div>
        ))}
      </div>

      <div className="grid-2-eq">
        {/* 近期任务 */}
        <div className="card card-pad">
          <div className="section-title mb-3">近期任务</div>
          <div className="space-y-2">
            {tasks.slice(0, 5).map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-2 text-[13px] px-3 py-2 rounded-lg" style={{ background: 'var(--bg-inset)' }}>
                <span className="truncate" style={{ color: 'var(--text)' }}>{t.title}</span>
                <span className="chip flex-shrink-0" style={{ background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                  {STATUS_LABEL[t.status]}
                </span>
              </div>
            ))}
            {tasks.length === 0 && <div className="text-[12.5px] py-6 text-center" style={{ color: 'var(--text-muted)' }}>暂无任务</div>}
          </div>
        </div>

        {/* 全员今日SOP */}
        <div className="card card-pad">
          <div className="flex items-center justify-between mb-3">
            <div className="section-title">全员今日SOP打卡</div>
            <button className="btn btn-sm" onClick={() => navigate('/ops/sop')}>去打卡</button>
          </div>
          <div className="space-y-2.5">
            {teamSop.map((s) => (
              <div key={s.name}>
                <div className="flex items-center justify-between text-[12.5px] mb-1">
                  <span style={{ color: 'var(--text-secondary)' }}>{s.name}</span>
                  <span className="font-bold tabular-nums" style={{ color: !s.has ? 'var(--text-muted)' : s.pct >= 80 ? 'var(--accent-emerald)' : s.pct >= 50 ? 'var(--accent-amber)' : 'var(--accent-rose)' }}>
                    {s.has ? `${s.pct}%` : '未打卡'}
                  </span>
                </div>
                <div className="progress-track"><div className="progress-fill" style={{ width: `${s.has ? s.pct : 0}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
