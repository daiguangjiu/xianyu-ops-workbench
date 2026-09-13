import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListTodo, CalendarCheck, ShoppingBag, TrendingUp, ArrowRight } from 'lucide-react';
import { useTasks } from '../stores/taskStore';
import { useMetrics, metricOwner } from '../stores/analyticsStore';
import { useSop, todayStr, recordPct, recordKey } from '../stores/sopStore';
import { getUsers, currentUser, isSuperadmin } from '../auth/auth';
import { STATUS_LABEL } from '../stores/taskStore';

export function DashboardPage() {
  const navigate = useNavigate();
  const { tasks } = useTasks();
  const { metrics } = useMetrics();
  const { records } = useSop();
  const users = getUsers();
  const me = currentUser();
  const admin = isSuperadmin();
  const today = todayStr();

  const todayTasks = tasks.filter((t) => t.status !== 'done');
  const doneRate = tasks.length ? Math.round((tasks.filter((t) => t.status === 'done').length / tasks.length) * 100) : 0;

  const myTodayRecord = me ? records[recordKey(today, me.id)] : undefined;
  const sopPct = recordPct(today, myTodayRecord);

  /** 数据范围：管理员=全员合计，成员=仅本人 */
  const scopedMetrics = useMemo(
    () => (admin ? metrics : metrics.filter((m) => metricOwner(m) === me?.id)),
    [metrics, admin, me],
  );

  const monthPrefix = today.slice(0, 7);
  const monthMetrics = scopedMetrics.filter((m) => m.date.startsWith(monthPrefix));
  const monthOrders = monthMetrics.reduce((s, m) => s + m.orders, 0);
  const monthGmv = monthMetrics.reduce((s, m) => s + m.gmv, 0);

  /** 全员今日SOP完成情况（管理员） */
  const teamSop = useMemo(() => users.map((u) => {
    const r = records[recordKey(today, u.id)];
    return { name: u.name, pct: recordPct(today, r), has: !!r };
  }), [users, records, today]);

  /** 成员：近 7 天我的打卡 */
  const myWeek = useMemo(() => {
    if (admin) return [];
    const days: { date: string; pct: number; has: boolean }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const r = me ? records[recordKey(ds, me.id)] : undefined;
      days.push({ date: ds, pct: recordPct(ds, r), has: !!r });
    }
    return days;
  }, [admin, records, me]);

  const cards = [
    { Icon: ListTodo, label: '进行中任务', value: `${todayTasks.length}`, sub: `总完成率 ${doneRate}%`, color: 'var(--brand)', to: '/tasks' },
    { Icon: CalendarCheck, label: '今日我的SOP', value: `${sopPct}%`, sub: myTodayRecord ? '已打卡' : '今日尚未打卡', color: 'var(--accent-emerald)', to: '/ops/sop' },
    { Icon: ShoppingBag, label: admin ? '本月成交（全员合计）' : '本月成交', value: `${monthOrders} 单`, sub: `GMV ¥${monthGmv.toLocaleString()}`, color: 'var(--accent-amber)', to: '/ops/analytics' },
    { Icon: TrendingUp, label: admin ? '本月记录天数（全员合计）' : '本月记录天数', value: `${monthMetrics.length} 天`, sub: admin ? '汇总所有成员经营数据' : '经营数据持续追踪', color: 'var(--accent-sky)', to: '/ops/analytics' },
  ];

  return (
    <div className="space-y-4">
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

        {/* 打卡面板：管理员=全员今日，成员=近7天自己 */}
        <div className="card card-pad">
          {admin ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <div className="section-title">全员今日SOP打卡</div>
                <button className="btn btn-sm" onClick={() => navigate('/ops/records')}>打卡管理</button>
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
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <div className="section-title">近 7 天我的打卡</div>
                <button className="btn btn-sm" onClick={() => navigate('/ops/sop')}>去打卡</button>
              </div>
              <div className="space-y-2.5">
                {myWeek.map((d) => (
                  <div key={d.date}>
                    <div className="flex items-center justify-between text-[12.5px] mb-1">
                      <span style={{ color: 'var(--text-secondary)' }}>{d.date.slice(5)}</span>
                      <span className="font-bold tabular-nums" style={{ color: !d.has ? 'var(--text-muted)' : d.pct >= 80 ? 'var(--accent-emerald)' : d.pct >= 50 ? 'var(--accent-amber)' : 'var(--accent-rose)' }}>
                        {d.has ? `${d.pct}%` : '未打卡'}
                      </span>
                    </div>
                    <div className="progress-track"><div className="progress-fill" style={{ width: `${d.has ? d.pct : 0}%` }} /></div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
