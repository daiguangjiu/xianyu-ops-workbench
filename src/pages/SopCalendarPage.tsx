import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, Save, Plus, Trash2, ListChecks, History, Star } from 'lucide-react';
import { useSop, useMonthGrid, todayStr, recordKey } from '../stores/sopStore';
import { getUsers, currentUser } from '../auth/auth';

function monthAdd(year: number, month: number, delta: number): [number, number] {
  const m = month + delta;
  if (m < 1) return [year - 1, 12];
  if (m > 12) return [year + 1, 1];
  return [year, m];
}

export function SopCalendarPage() {
  const users = getUsers();
  const me = currentUser();
  const { items, records, getRecord, saveRecord, addItem, removeItem, toggleItemRequired } = useSop();

  const today = todayStr();
  const [year, setYear] = useState(() => Number(today.slice(0, 4)));
  const [month, setMonth] = useState(() => Number(today.slice(5, 7)));
  const [personId, setPersonId] = useState(me?.id || users[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState(today);
  const [extraInput, setExtraInput] = useState('');
  const [savedTip, setSavedTip] = useState('');

  const cells = useMonthGrid(year, month);
  const person = users.find((u) => u.id === personId) || users[0];

  /** 当前选中日期+人员的记录（正在编辑的草稿） */
  const record = person ? getRecord(selectedDate, person.id) : undefined;
  const [done, setDone] = useState<Set<string>>(new Set());
  const [extra, setExtra] = useState<string[]>([]);
  const [note, setNote] = useState('');
  // 通过 key 重置编辑状态：记录变化时同步
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

  const requiredIds = useMemo(() => items.filter((i) => i.required).map((i) => i.id), [items]);

  /** 某天某人的完成率（日历格子上显示） */
  const pctOf = (date: string, pid: string): { pct: number; has: boolean } => {
    const r = records[recordKey(date, pid)];
    if (!r || items.length === 0) return { pct: 0, has: !!r };
    const required = items.filter((i) => i.required);
    const hitRequired = required.filter((i) => r.done.includes(i.id)).length;
    const bonus = (r.extra?.length || 0) * 0.5;
    const total = required.length + (items.length - required.length) * 0.5;
    const pct = total > 0 ? Math.min(100, Math.round(((hitRequired + bonus) / total) * 100)) : 0;
    return { pct, has: true };
  };

  const handleSave = () => {
    if (!person) return;
    saveRecord(selectedDate, person.id, { done: [...done], extra, note });
    setSavedTip('已保存，历史记录已更新');
    setTimeout(() => setSavedTip(''), 2200);
  };

  /** 当月历史记录汇总 */
  const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
  const monthRecords = useMemo(
    () => Object.values(records)
      .filter((r) => r.date.startsWith(monthPrefix))
      .sort((a, b) => b.date.localeCompare(a.date) || a.personId.localeCompare(b.personId)),
    [records, monthPrefix],
  );

  return (
    <div className="space-y-4">
      {/* 顶栏：人员 + 月份切换 */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="page-title">运营SOP · 运营日历</div>
          <div className="page-sub">每人员每日任务打卡 · 自动保存历史记录 · 按月回溯</div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select className="select" style={{ width: 150 }} value={personId} onChange={(e) => setPersonId(e.target.value)}>
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

      <div className="grid gap-4" style={{ gridTemplateColumns: 'minmax(0, 1.7fr) minmax(300px, 1fr)' }}>
        {/* 左：日历 */}
        <div className="space-y-4 min-w-0">
          <div className="card card-pad">
            <div className="flex items-center gap-2 mb-3">
              <CalendarDays size={15} color="var(--brand)" />
              <span className="section-title">{person?.name} 的执行日历</span>
              <span className="chip ml-auto" style={{ background: 'var(--bg-inset)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                点击日期填写当日SOP
              </span>
            </div>
            <div className="cal-grid">
              {['日', '一', '二', '三', '四', '五', '六'].map((d) => <div key={d} className="cal-head">{d}</div>)}
              {cells.map((date, i) => {
                if (!date) return <div key={`e-${i}`} />;
                const dayNum = Number(date.slice(8));
                const { pct, has } = pctOf(date, personId);
                const cls = [
                  'cal-cell',
                  date === today ? 'today' : '',
                  date === selectedDate ? 'selected' : '',
                ].join(' ');
                return (
                  <div key={date} className={cls} onClick={() => setSelectedDate(date)}>
                    <div className="flex items-center justify-between">
                      <span className="cal-day-num">{dayNum}</span>
                      {has && <span className="cal-pct">{pct}%</span>}
                    </div>
                    <div className="cal-bar"><i style={{ width: `${pct}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 历史记录（当月） */}
          <div className="card card-pad">
            <div className="flex items-center gap-2 mb-3">
              <History size={15} color="var(--brand)" />
              <span className="section-title">{monthPrefix} 历史记录</span>
              <span className="chip" style={{ background: 'var(--bg-inset)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>{monthRecords.length} 条</span>
            </div>
            <div className="overflow-x-auto max-h-64 overflow-y-auto">
              <table className="table">
                <thead><tr><th>日期</th><th>人员</th><th>完成率</th><th>备注</th><th>保存时间</th></tr></thead>
                <tbody>
                  {monthRecords.length === 0 && <tr><td colSpan={5} className="text-center py-6" style={{ color: 'var(--text-muted)' }}>当月暂无记录</td></tr>}
                  {monthRecords.map((r) => {
                    const u = users.find((x) => x.id === r.personId);
                    const p = pctOf(r.date, r.personId);
                    return (
                      <tr key={recordKey(r.date, r.personId)}>
                        <td className="font-mono text-[12px]" style={{ color: 'var(--text)' }}>{r.date}</td>
                        <td>{u?.name || r.personId}</td>
                        <td><span className="font-bold" style={{ color: p.pct >= 80 ? 'var(--accent-emerald)' : p.pct >= 50 ? 'var(--accent-amber)' : 'var(--accent-rose)' }}>{p.pct}%</span></td>
                        <td className="text-[12px] max-w-[200px] truncate">{r.note || '—'}</td>
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
            <div className="section-title mb-1">{selectedDate} · {person?.name}</div>
            <div className="page-sub mb-3">勾选已完成的每日SOP任务</div>
            <div className="space-y-2">
              {items.map((it) => {
                const checked = done.has(it.id);
                return (
                  <label key={it.id} className="flex items-start gap-2.5 p-2.5 rounded-xl cursor-pointer transition-colors"
                    style={{ background: checked ? 'rgba(16,185,129,0.08)' : 'var(--bg-inset)', border: `1px solid ${checked ? 'rgba(16,185,129,0.3)' : 'var(--border)'}` }}>
                    <input type="checkbox" className="login-checkbox mt-0.5" checked={checked}
                      onChange={() => setDone((prev) => { const n = new Set(prev); if (n.has(it.id)) n.delete(it.id); else n.add(it.id); return n; })} />
                    <span className="text-[13px] leading-snug" style={{ color: checked ? 'var(--accent-emerald)' : 'var(--text)' }}>
                      {it.label}
                      {it.required && <Star size={11} className="inline ml-1 mb-0.5" color="var(--accent-amber)" />}
                    </span>
                  </label>
                );
              })}
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
              <textarea className="textarea" rows={2} placeholder="当日备注（卡点、数据、明日计划…）" value={note} onChange={(e) => setNote(e.target.value)} />
              <button className="btn btn-primary w-full" onClick={handleSave}><Save size={14} /> 保存打卡记录</button>
              {savedTip && <div className="text-[12px] font-semibold text-center" style={{ color: 'var(--accent-emerald)' }}>{savedTip}</div>}
            </div>
          </div>

          {/* SOP 模板管理 */}
          <div className="card card-pad">
            <div className="flex items-center gap-2 mb-3">
              <ListChecks size={15} color="var(--brand)" />
              <span className="section-title">每日SOP模板</span>
            </div>
            <div className="space-y-1.5 mb-3">
              {items.map((it) => (
                <div key={it.id} className="flex items-center justify-between gap-2 text-[12.5px] px-2 py-1.5 rounded-lg" style={{ background: 'var(--bg-inset)' }}>
                  <button className="flex items-center gap-1.5 text-left min-w-0" onClick={() => toggleItemRequired(it.id)} title="点击切换 必做/选做">
                    {it.required ? <Star size={11} color="var(--accent-amber)" className="flex-shrink-0" /> : <span className="w-[11px]" />}
                    <span className="truncate" style={{ color: 'var(--text-secondary)' }}>{it.label}</span>
                  </button>
                  <button onClick={() => removeItem(it.id)}><Trash2 size={12} color="var(--text-muted)" /></button>
                </div>
              ))}
            </div>
            <AddSopItem onAdd={addItem} />
            <div className="text-[10.5px] mt-2" style={{ color: 'var(--text-muted)' }}>★ 为必做项计入完成率；选做项按 0.5 权重折算。</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddSopItem({ onAdd }: { onAdd: (label: string, required: boolean) => void }) {
  const [label, setLabel] = useState('');
  return (
    <div className="flex gap-2">
      <input className="input" style={{ flex: 1 }} placeholder="新增SOP任务项…" value={label}
        onChange={(e) => setLabel(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && label.trim()) { onAdd(label.trim(), false); setLabel(''); } }} />
      <button className="btn" onClick={() => { if (label.trim()) { onAdd(label.trim(), false); setLabel(''); } }}><Plus size={14} /></button>
    </div>
  );
}
