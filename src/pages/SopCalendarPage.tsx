import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, Save, Plus, Trash2, History, Users as UsersIcon, Info } from 'lucide-react';
import {
  useSop, useMonthGrid, todayStr, recordKey, applicableItems, recordPct, SOP_GROUPS,
} from '../stores/sopStore';
import { getUsers, currentUser, isSuperadmin } from '../auth/auth';

function monthAdd(year: number, month: number, delta: number): [number, number] {
  const m = month + delta;
  if (m < 1) return [year - 1, 12];
  if (m > 12) return [year + 1, 1];
  return [year, m];
}

export function SopCalendarPage() {
  const users = getUsers();
  const me = currentUser();
  const admin = isSuperadmin();
  const { records, getRecord, saveRecord } = useSop();

  const today = todayStr();
  const [year, setYear] = useState(() => Number(today.slice(0, 4)));
  const [month, setMonth] = useState(() => Number(today.slice(5, 7)));
  const [personId, setPersonId] = useState(me?.id || '');
  const [selectedDate, setSelectedDate] = useState(today);
  const [extraInput, setExtraInput] = useState('');
  const [savedTip, setSavedTip] = useState('');

  const cells = useMonthGrid(year, month);
  const person = users.find((u) => u.id === personId) || users[0];

  /** 当日应打卡条目（每日组固定，周日加每周组） */
  const applicable = useMemo(() => applicableItems(selectedDate), [selectedDate]);
  const groupsToday = useMemo(() => {
    const keys = new Set(applicable.map((i) => i.group));
    return SOP_GROUPS.filter((g) => keys.has(g.key));
  }, [applicable]);
  const isSunday = new Date(`${selectedDate}T00:00:00`).getDay() === 0;

  const record = person ? getRecord(selectedDate, person.id) : undefined;
  const [done, setDone] = useState<Set<string>>(new Set());
  const [extra, setExtra] = useState<string[]>([]);
  const [note, setNote] = useState('');
  // 切换 日期/人员 时重置编辑草稿
  const editKey = `${selectedDate}__${personId}`;
  const [lastEditKey, setLastEditKey] = useState(editKey);
  if (lastEditKey !== editKey) {
    setLastEditKey(editKey);
    setDone(new Set(record?.done || []));
    setExtra(record?.extra || []);
    setNote(record?.note || '');
    setSavedTip('');
    setExtraInput('');
  }

  const pctOf = (date: string, pid: string) => recordPct(date, records[recordKey(date, pid)]);

  const handleSave = () => {
    if (!person) return;
    saveRecord(selectedDate, person.id, { done: [...done], extra, note });
    setSavedTip('已保存，历史记录已更新');
    setTimeout(() => setSavedTip(''), 2200);
  };

  /** 当月历史记录：成员只看自己，管理员看全员 */
  const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
  const monthRecords = useMemo(
    () => Object.values(records)
      .filter((r) => r.date.startsWith(monthPrefix) && (admin || r.personId === personId))
      .sort((a, b) => b.date.localeCompare(a.date) || a.personId.localeCompare(b.personId)),
    [records, monthPrefix, admin, personId],
  );

  /** 管理员：选定日期的全员进度 */
  const teamOfDay = useMemo(() => {
    if (!admin) return [];
    return users.map((u) => ({ user: u, pct: pctOf(selectedDate, u.id), has: !!records[recordKey(selectedDate, u.id)] }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin, users, selectedDate, records]);

  const myPct = pctOf(selectedDate, personId);

  return (
    <div className="space-y-4">
      {/* 顶栏：人员 + 月份切换 */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="page-title">运营SOP · 运营日历</div>
          <div className="page-sub">
            每人员每日 Checklist 打卡 · 历史留痕
            {admin ? ' · 管理员可查看全员记录' : ''}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select className="select" style={{ width: 150 }} value={personId} disabled={!admin}
            onChange={(e) => setPersonId(e.target.value)} title={admin ? '选择人员' : '普通用户仅可打卡本人'}>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}{u.role === 'superadmin' ? '（管理员）' : ''}</option>)}
          </select>
          <div className="flex items-center gap-1">
            <button className="icon-btn" onClick={() => { const [y, m] = monthAdd(year, month, -1); setYear(y); setMonth(m); }} aria-label="上一月"><ChevronLeft size={15} /></button>
            <span className="text-[13.5px] font-bold px-2 tabular-nums" style={{ color: 'var(--text)' }}>{year} 年 {month} 月</span>
            <button className="icon-btn" onClick={() => { const [y, m] = monthAdd(year, month, 1); setYear(y); setMonth(m); }} aria-label="下一月"><ChevronRight size={15} /></button>
            <button className="btn btn-sm" onClick={() => { setYear(Number(today.slice(0, 4))); setMonth(Number(today.slice(5, 7))); setSelectedDate(today); }}>今</button>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* 左：日历 + 历史 */}
        <div className="space-y-4 min-w-0">
          <div className="card card-pad">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <CalendarDays size={15} color="var(--brand)" />
              <span className="section-title">{person?.name} 的执行日历</span>
              <span className="chip ml-auto" style={{ background: 'var(--bg-inset)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                点击日期查看 / 打卡
              </span>
            </div>
            <div className="cal-grid">
              {['日', '一', '二', '三', '四', '五', '六'].map((d) => <div key={d} className="cal-head">{d}</div>)}
              {cells.map((date, i) => {
                if (!date) return <div key={`e-${i}`} />;
                const dayNum = Number(date.slice(8));
                const pct = pctOf(date, personId);
                const has = !!records[recordKey(date, personId)];
                const cls = ['cal-cell', date === today ? 'today' : '', date === selectedDate ? 'selected' : ''].join(' ');
                return (
                  <div key={date} className={cls} onClick={() => setSelectedDate(date)}>
                    <div className="flex items-center justify-between">
                      <span className="cal-day-num">{dayNum}</span>
                      {has && <span className="cal-pct" style={{ color: pct >= 80 ? 'var(--accent-emerald)' : pct >= 50 ? 'var(--accent-amber)' : 'var(--accent-rose)' }}>{pct}%</span>}
                    </div>
                    <div className="cal-bar"><i style={{ width: `${pct}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 历史记录 */}
          <div className="card card-pad">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <History size={15} color="var(--brand)" />
              <span className="section-title">{monthPrefix} 打卡历史记录</span>
              {admin && <span className="chip" style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--brand-strong)', border: '1px solid rgba(99,102,241,0.24)' }}>全员</span>}
              <span className="chip" style={{ background: 'var(--bg-inset)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>{monthRecords.length} 条</span>
            </div>
            <div className="overflow-x-auto max-h-72 overflow-y-auto">
              <table className="table">
                <thead><tr>{admin && <th>人员</th>}<th>日期</th><th>完成率</th><th>备注</th><th>保存时间</th></tr></thead>
                <tbody>
                  {monthRecords.length === 0 && <tr><td colSpan={admin ? 5 : 4} className="text-center py-6" style={{ color: 'var(--text-muted)' }}>当月暂无记录</td></tr>}
                  {monthRecords.map((r) => {
                    const u = users.find((x) => x.id === r.personId);
                    const p = recordPct(r.date, r);
                    return (
                      <tr key={recordKey(r.date, r.personId)}>
                        {admin && <td className="font-medium" style={{ color: 'var(--text)' }}>{u?.name || r.personId}</td>}
                        <td className="font-mono text-[12px]" style={{ color: 'var(--text)' }}>{r.date}{new Date(`${r.date}T00:00:00`).getDay() === 0 && <span className="ml-1 text-[10px]" style={{ color: 'var(--accent-amber)' }}>含每周</span>}</td>
                        <td><span className="font-bold" style={{ color: p >= 80 ? 'var(--accent-emerald)' : p >= 50 ? 'var(--accent-amber)' : 'var(--accent-rose)' }}>{p}%</span></td>
                        <td className="text-[12px] max-w-[180px] truncate">{r.note || '—'}</td>
                        <td className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{r.updatedAt ? new Date(r.updatedAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 右：当日填写面板 */}
        <div className="space-y-4 min-w-0">
          <div className="card card-pad">
            <div className="flex items-center justify-between flex-wrap gap-1 mb-1">
              <div className="section-title">{selectedDate} · {person?.name}</div>
              <span className="chip" style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--brand-strong)', border: '1px solid rgba(99,102,241,0.24)' }}>
                完成率 {myPct}%
              </span>
            </div>
            <div className="page-sub mb-3 flex items-center gap-1">
              <Info size={11} /> {applicable.length} 项（每日 {SOP_GROUPS.filter((g) => g.freq === 'daily').reduce((s, g) => s + g.items.length, 0)} 项{isSunday ? ' + 周日每周 15 项' : ''}）· 点击条目展开「怎么做/数据影响」
            </div>
            <div className="day-panel-scroll space-y-3 pr-0.5">
              {groupsToday.map((g) => (
                <div key={g.key}>
                  <div className="text-[11.5px] font-bold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    {g.label}
                    <span className="font-normal ml-1.5">（{applicable.filter((i) => i.group === g.key).length} 项）</span>
                  </div>
                  <div className="space-y-1.5">
                    {applicable.filter((i) => i.group === g.key).map((it) => {
                      const checked = done.has(it.id);
                      return (
                        <details key={it.id} className="ck-item" style={checked ? { background: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.3)' } : {}}>
                          <summary>
                            <input type="checkbox" className="login-checkbox mt-1" checked={checked} readOnly style={{ pointerEvents: 'none' }} />
                            <span className="t flex-1 min-w-0" style={checked ? { color: 'var(--accent-emerald)' } : {}}>{it.title}</span>
                          </summary>
                          <div className="ck-how"><b>怎么做：</b>{it.how}</div>
                          <div className="ck-why">📊 {it.why}</div>
                          <button
                            className="btn btn-sm mt-2"
                            style={checked ? {} : { background: 'var(--gradient-brand)', color: '#fff', border: 'none' }}
                            onClick={(e) => {
                              e.preventDefault();
                              setDone((prev) => { const n = new Set(prev); if (n.has(it.id)) n.delete(it.id); else n.add(it.id); return n; });
                            }}
                          >
                            {checked ? '取消勾选' : '✅ 完成此项'}
                          </button>
                        </details>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 mt-3">
              {extra.map((ex, i) => (
                <div key={i} className="flex items-center justify-between gap-2 p-2.5 rounded-xl" style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.24)' }}>
                  <span className="text-[13px]" style={{ color: 'var(--brand-strong)' }}>＋ {ex}</span>
                  <button onClick={() => setExtra((prev) => prev.filter((_, j) => j !== i))}><Trash2 size={13} color="var(--accent-rose)" /></button>
                </div>
              ))}
              <div className="flex gap-2">
                <input className="input" style={{ flex: 1 }} placeholder="补充额外完成的任务…" value={extraInput}
                  onChange={(e) => setExtraInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && extraInput.trim()) { setExtra((p) => [...p, extraInput.trim()]); setExtraInput(''); } }} />
                <button className="btn" onClick={() => { if (extraInput.trim()) { setExtra((p) => [...p, extraInput.trim()]); setExtraInput(''); } }}><Plus size={14} /></button>
              </div>
              <textarea className="textarea" rows={2} placeholder="当日备注（卡点、数据、异常标记、明日待办…）" value={note} onChange={(e) => setNote(e.target.value)} />
              <button className="btn btn-primary w-full" onClick={handleSave}><Save size={14} /> 保存打卡记录</button>
              {savedTip && <div className="text-[12px] font-semibold text-center" style={{ color: 'var(--accent-emerald)' }}>{savedTip}</div>}
            </div>
          </div>

          {/* 管理员：当日全员进度 */}
          {admin && (
            <div className="card card-pad">
              <div className="flex items-center gap-2 mb-3">
                <UsersIcon size={15} color="var(--brand)" />
                <span className="section-title">{selectedDate} 全员打卡情况</span>
              </div>
              <div className="space-y-2.5">
                {teamOfDay.map(({ user, pct, has }) => (
                  <div key={user.id}>
                    <div className="flex items-center justify-between text-[12.5px] mb-1">
                      <span style={{ color: 'var(--text-secondary)' }}>{user.name}{user.role === 'superadmin' ? '（管理员）' : ''}</span>
                      <span className="font-bold tabular-nums" style={{ color: !has ? 'var(--text-muted)' : pct >= 80 ? 'var(--accent-emerald)' : pct >= 50 ? 'var(--accent-amber)' : 'var(--accent-rose)' }}>
                        {has ? `${pct}%` : '未打卡'}
                      </span>
                    </div>
                    <div className="progress-track"><div className="progress-fill" style={{ width: `${has ? pct : 0}%` }} /></div>
                  </div>
                ))}
                {users.length === 0 && <div className="text-[12px]" style={{ color: 'var(--text-muted)' }}>暂无用户</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
