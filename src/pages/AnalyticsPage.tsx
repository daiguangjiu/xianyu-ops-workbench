import { useMemo, useState } from 'react';
import { Plus, Trash2, BarChart3, User as UserIcon } from 'lucide-react';
import { useMetrics, metricOwner, type DailyMetric } from '../stores/analyticsStore';
import { todayStr } from '../stores/sopStore';
import { getUsers, currentUser, isSuperadmin } from '../auth/auth';

const emptyForm = { date: todayStr(), exposure: '', views: '', wants: '', orders: '', gmv: '', note: '' };

export function AnalyticsPage() {
  const { metrics, upsert, remove } = useMetrics();
  const users = getUsers();
  const me = currentUser();
  const admin = isSuperadmin();
  const [form, setForm] = useState(emptyForm);

  /** 数据范围：管理员可切换人员，成员锁定本人 */
  const [scopeId, setScopeId] = useState(me?.id || '');
  const scopeUser = users.find((u) => u.id === scopeId) || me;
  const scoped = useMemo(
    () => metrics.filter((m) => metricOwner(m) === (scopeUser?.id || '')),
    [metrics, scopeUser],
  );

  const sorted = useMemo(() => [...scoped].sort((a, b) => a.date.localeCompare(b.date)), [scoped]);
  const recent = sorted.slice(-14);

  /** 14 天 GMV 柱状图（纯 SVG） */
  const chart = useMemo(() => {
    const W = 640, H = 180, pad = 28;
    const max = Math.max(1, ...recent.map((m) => m.gmv));
    const bw = recent.length ? (W - pad * 2) / recent.length : 0;
    return recent.map((m, i) => {
      const h = (m.gmv / max) * (H - pad * 2);
      return { x: pad + i * bw, y: H - pad - h, w: Math.max(6, bw - 6), h, gmv: m.gmv, date: m.date.slice(5) };
    });
  }, [recent]);

  const totals = useMemo(() => {
    const sum = (f: (m: DailyMetric) => number) => sorted.reduce((s, m) => s + f(m), 0);
    return {
      exposure: sum((m) => m.exposure),
      views: sum((m) => m.views),
      wants: sum((m) => m.wants),
      orders: sum((m) => m.orders),
      gmv: sum((m) => m.gmv),
    };
  }, [sorted]);

  const submit = () => {
    if (!form.date || !scopeUser) return;
    upsert({
      userId: scopeUser.id,
      date: form.date,
      exposure: Number(form.exposure) || 0,
      views: Number(form.views) || 0,
      wants: Number(form.wants) || 0,
      orders: Number(form.orders) || 0,
      gmv: Number(form.gmv) || 0,
      note: form.note,
    });
    setForm({ ...emptyForm, date: form.date });
  };

  const fmt = (n: number) => n >= 10000 ? `${(n / 10000).toFixed(1)} 万` : n.toLocaleString();

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="page-title">数据分析</div>
          <div className="page-sub">曝光 → 浏览 → 想要 → 成交 全链路量化追踪（按日录入，同人同日覆盖更新）</div>
        </div>
        <div className="flex items-center gap-2">
          <UserIcon size={14} color="var(--text-muted)" />
          {admin ? (
            <select className="select" style={{ width: 170 }} value={scopeId} onChange={(e) => setScopeId(e.target.value)} title="选择查看/录入的人员">
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}{u.role === 'superadmin' ? '（管理员）' : ''}</option>)}
            </select>
          ) : (
            <span className="chip" style={{ background: 'var(--bg-inset)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
              {me?.name}（本人数据）
            </span>
          )}
        </div>
      </div>

      {/* 汇总卡 */}
      <div className="grid-form">
        {[
          { label: '累计曝光', value: fmt(totals.exposure) },
          { label: '累计浏览', value: fmt(totals.views) },
          { label: '累计想要', value: fmt(totals.wants) },
          { label: '累计成交', value: `${totals.orders} 单` },
          { label: '累计 GMV', value: `¥${totals.gmv.toLocaleString()}` },
        ].map(({ label, value }) => (
          <div key={label} className="card card-pad text-center">
            <div className="text-[19px] font-black tabular-nums" style={{ color: 'var(--text)' }}>{value}</div>
            <div className="text-[11.5px] mt-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        {/* 图表 + 表格 */}
        <div className="space-y-4 min-w-0">
          <div className="card card-pad">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 size={15} color="var(--brand)" />
              <span className="section-title">{scopeUser?.name} · 近 14 天 GMV 趋势</span>
            </div>
            {recent.length === 0 ? (
              <div className="text-[12.5px] py-10 text-center" style={{ color: 'var(--text-muted)' }}>暂无数据，右侧录入后自动生成图表</div>
            ) : (
              <svg viewBox="0 0 640 180" className="w-full" style={{ maxHeight: 200 }}>
                {chart.map((b) => (
                  <g key={b.date}>
                    <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={4} fill="url(#gmvGrad)" />
                    {b.gmv > 0 && (
                      <text x={b.x + b.w / 2} y={b.y - 4} textAnchor="middle" fontSize="8.5" fill="var(--text-muted)">
                        {b.gmv >= 1000 ? `${(b.gmv / 1000).toFixed(1)}k` : b.gmv}
                      </text>
                    )}
                    <text x={b.x + b.w / 2} y="176" textAnchor="middle" fontSize="8.5" fill="var(--text-muted)">{b.date}</text>
                  </g>
                ))}
                <defs>
                  <linearGradient id="gmvGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </svg>
            )}
          </div>

          <div className="card overflow-x-auto">
            <table className="table">
              <thead><tr><th>日期</th><th>曝光</th><th>浏览</th><th>想要</th><th>成交</th><th>GMV</th><th>备注</th>{admin && <th />} </tr></thead>
              <tbody>
                {sorted.length === 0 && <tr><td colSpan={admin ? 8 : 7} className="text-center py-8" style={{ color: 'var(--text-muted)' }}>暂无数据</td></tr>}
                {[...sorted].reverse().map((m) => (
                  <tr key={m.id}>
                    <td className="font-mono text-[12px]" style={{ color: 'var(--text)' }}>{m.date}</td>
                    <td>{fmt(m.exposure)}</td>
                    <td>{fmt(m.views)}</td>
                    <td>{m.wants}</td>
                    <td className="font-bold" style={{ color: m.orders > 0 ? 'var(--accent-emerald)' : undefined }}>{m.orders}</td>
                    <td>¥{m.gmv.toLocaleString()}</td>
                    <td className="text-[12px] max-w-[160px] truncate">{m.note || '—'}</td>
                    {admin && <td><button className="btn btn-sm btn-danger" onClick={() => { if (confirm(`删除 ${scopeUser?.name} ${m.date} 的数据？`)) remove(m.id); }}><Trash2 size={12} /></button></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 录入表单 */}
        <div className="card card-pad h-fit">
          <div className="section-title mb-3">录入当日数据<span className="ml-1.5 text-[12px] font-normal" style={{ color: 'var(--text-muted)' }}>→ {scopeUser?.name}</span></div>
          <div className="space-y-3">
            <div>
              <label className="form-label">日期</label>
              <input className="input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {([['exposure', '曝光'], ['views', '浏览'], ['wants', '想要/咨询'], ['orders', '成交单数'], ['gmv', '成交金额 ¥']] as const).map(([k, label]) => (
                <div key={k} className={k === 'gmv' ? 'col-span-2' : ''}>
                  <label className="form-label">{label}</label>
                  <input className="input" type="number" min={0} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
                </div>
              ))}
            </div>
            <div>
              <label className="form-label">备注</label>
              <textarea className="textarea" rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </div>
            <button className="btn btn-primary w-full" onClick={submit}><Plus size={14} /> 保存数据</button>
          </div>
        </div>
      </div>
    </div>
  );
}
