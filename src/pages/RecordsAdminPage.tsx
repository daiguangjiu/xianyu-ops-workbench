import { useMemo, useState } from 'react';
import {
  ChevronLeft, ChevronRight, ClipboardList, Eye, EyeOff, X,
  CheckCircle2, XCircle, NotebookPen, PlusCircle,
} from 'lucide-react';
import {
  useSop, useMonthGrid, todayStr, recordKey, applicableItems, recordPct, SOP_GROUPS,
  type SopRecord,
} from '../stores/sopStore';
import { getUsers, isSuperadmin } from '../auth/auth';

function monthAdd(year: number, month: number, delta: number): [number, number] {
  const m = month + delta;
  if (m < 1) return [year - 1, 12];
  if (m > 12) return [year + 1, 1];
  return [year, m];
}

interface CellInfo { pct: number; has: boolean; future: boolean }
interface Detail { date: string; personId: string }

/** 打卡明细弹窗：某人某天的逐项完成情况 */
function RecordDetailModal({ detail, onClose, getRecord }: {
  detail: Detail;
  onClose: () => void;
  getRecord: (date: string, personId: string) => SopRecord | undefined;
}) {
  const users = getUsers();
  const user = users.find((u) => u.id === detail.personId);
  const record = getRecord(detail.date, detail.personId);
  const applicable = applicableItems(detail.date);
  const done = new Set(record?.done || []);
  const groups = SOP_GROUPS.filter((g) => applicable.some((i) => i.group === g.key));
  const pct = recordPct(detail.date, record);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <div className="text-[15px] font-black" style={{ color: 'var(--text)' }}>
              {user?.name || detail.personId} · {detail.date} 打卡明细
            </div>
            <div className="text-[11.5px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              应打卡 {applicable.length} 项 · 完成 {done.size} 项
              {record?.updatedAt ? ` · 保存于 ${new Date(record.updatedAt).toLocaleString('zh-CN')}` : ''}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="chip font-bold" style={{
              background: !record ? 'rgba(244,63,94,0.12)' : pct >= 80 ? 'rgba(16,185,129,0.12)' : pct >= 50 ? 'rgba(245,158,11,0.12)' : 'rgba(244,63,94,0.12)',
              color: !record ? 'var(--accent-rose)' : pct >= 80 ? 'var(--accent-emerald)' : pct >= 50 ? 'var(--accent-amber)' : 'var(--accent-rose)',
              border: '1px solid var(--border)',
            }}>
              {record ? `完成率 ${pct}%` : '当日未打卡'}
            </span>
            <button className="icon-btn" onClick={onClose} aria-label="关闭"><X size={15} /></button>
          </div>
        </div>

        <div className="modal-scroll space-y-3 pr-0.5">
          {!record && (
            <div className="text-[13px] p-4 rounded-xl text-center" style={{ background: 'rgba(244,63,94,0.07)', border: '1px dashed rgba(244,63,94,0.35)', color: 'var(--text-secondary)' }}>
              该用户当天没有任何打卡记录，可安排 1 对 1 对齐了解卡点。
            </div>
          )}
          {groups.map((g) => {
            const items = applicable.filter((i) => i.group === g.key);
            const hit = items.filter((i) => done.has(i.id)).length;
            return (
              <div key={g.key}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11.5px] font-bold" style={{ color: 'var(--text-muted)' }}>{g.label}</span>
                  <span className="text-[11px] font-bold tabular-nums" style={{ color: hit === items.length ? 'var(--accent-emerald)' : hit === 0 ? 'var(--accent-rose)' : 'var(--accent-amber)' }}>
                    {hit}/{items.length}
                  </span>
                </div>
                <div className="space-y-1">
                  {items.map((it) => {
                    const ok = done.has(it.id);
                    return (
                      <div key={it.id} className="flex items-start gap-2 p-2 rounded-lg text-[12.5px]" style={{ background: ok ? 'rgba(16,185,129,0.07)' : 'var(--bg-inset)' }}>
                        {ok
                          ? <CheckCircle2 size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--accent-emerald)' }} />
                          : <XCircle size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--accent-rose)', opacity: record ? 1 : 0.55 }} />}
                        <span style={{ color: ok ? 'var(--accent-emerald)' : 'var(--text-secondary)' }}>{it.title}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {record && (record.extra.length > 0 || record.note) && (
            <div className="p-3 rounded-xl space-y-2" style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.24)' }}>
              {record.extra.length > 0 && (
                <div className="flex items-start gap-2 text-[12.5px]" style={{ color: 'var(--brand-strong)' }}>
                  <PlusCircle size={14} className="flex-shrink-0 mt-0.5" />
                  <span>额外完成：{record.extra.join('；')}</span>
                </div>
              )}
              {record.note && (
                <div className="flex items-start gap-2 text-[12.5px]" style={{ color: 'var(--text-secondary)' }}>
                  <NotebookPen size={14} className="flex-shrink-0 mt-0.5" />
                  <span>备注：{record.note}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function RecordsAdminPage() {
  const admin = isSuperadmin();
  const { records, getRecord } = useSop();
  const users = getUsers();
  const today = todayStr();

  const [year, setYear] = useState(() => Number(today.slice(0, 4)));
  const [month, setMonth] = useState(() => Number(today.slice(5, 7)));
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [detail, setDetail] = useState<Detail | null>(null);

  const daysInMonth = new Date(year, month, 0).getDate();
  const days = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);

  const cellOf = (day: number, personId: string): CellInfo => {
    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const future = date > today;
    const has = !future && !!records[recordKey(date, personId)];
    return { pct: has ? recordPct(date, records[recordKey(date, personId)]) : 0, has, future };
  };

  /** 每人当月汇总（只统计今天及以前） */
  const summaryOf = (personId: string) => {
    let done = 0, missing = 0, pctSum = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const c = cellOf(d, personId);
      if (c.future) continue;
      if (c.has) { done++; pctSum += c.pct; } else missing++;
    }
    const tracked = done + missing;
    return { done, missing, avg: done ? Math.round(pctSum / done) : 0, tracked };
  };

  const todayCells = users.map((u) => cellOf(Number(today.slice(8)), u.id));
  const todayMissing = admin ? todayCells.filter((c) => !c.future && !c.has).length : 0;
  const monthAvg = admin
    ? Math.round(users.reduce((s, u) => s + summaryOf(u.id).avg, 0) / Math.max(1, users.length))
    : 0;

  if (!admin) {
    return (
      <div className="space-y-4">
        <div className="page-title">打卡管理</div>
        <div className="card card-pad text-[13px]" style={{ color: 'var(--text-muted)' }}>仅超级管理员可查看全员打卡情况。</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 顶栏 */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="page-title">打卡管理</div>
          <div className="page-sub">全员打卡 / 未打卡总览 · 点击任意格子查看当日逐项明细，便于定位问题并给予指导</div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            className={`btn btn-sm ${onlyMissing ? 'btn-primary' : ''}`}
            onClick={() => setOnlyMissing((v) => !v)}
            title="切换只看未打卡"
          >
            {onlyMissing ? <EyeOff size={13} /> : <Eye size={13} />} {onlyMissing ? '只看未打卡（已开启）' : '只看未打卡'}
          </button>
          <div className="flex items-center gap-1">
            <button className="icon-btn" onClick={() => { const [y, m] = monthAdd(year, month, -1); setYear(y); setMonth(m); }} aria-label="上一月"><ChevronLeft size={15} /></button>
            <span className="text-[13.5px] font-bold px-2 tabular-nums" style={{ color: 'var(--text)' }}>{year} 年 {month} 月</span>
            <button className="icon-btn" onClick={() => { const [y, m] = monthAdd(year, month, 1); setYear(y); setMonth(m); }} aria-label="下一月"><ChevronRight size={15} /></button>
            <button className="btn btn-sm" onClick={() => { setYear(Number(today.slice(0, 4))); setMonth(Number(today.slice(5, 7))); }}>今</button>
          </div>
        </div>
      </div>

      {/* 汇总卡 */}
      <div className="grid-cards">
        {[
          { label: '运营成员数', value: `${users.length}`, sub: '全部启用账号', color: 'var(--brand)' },
          { label: '今日已打卡', value: `${users.length - todayMissing}`, sub: `${today}`, color: 'var(--accent-emerald)' },
          { label: '今日未打卡', value: `${todayMissing}`, sub: todayMissing > 0 ? '建议今日内提醒' : '全员完成 ✅', color: 'var(--accent-rose)' },
          { label: '当月平均完成率', value: `${monthAvg}%`, sub: '全员已打卡日均', color: 'var(--accent-amber)' },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="card card-pad">
            <div className="text-[24px] font-black tabular-nums" style={{ color }}>{value}</div>
            <div className="text-[12.5px] font-semibold mt-0.5" style={{ color: 'var(--text-secondary)' }}>{label}</div>
            <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* 矩阵总览 */}
      <div className="card card-pad">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <ClipboardList size={15} color="var(--brand)" />
          <span className="section-title">当月打卡矩阵</span>
          <span className="chip ml-auto" style={{ background: 'var(--bg-inset)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
            绿 ≥80% · 黄 ≥50% · 红 &lt;50% · 「缺」=未打卡 · 点击看明细
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="matrix-table">
            <thead>
              <tr>
                <th className="sticky-col">人员</th>
                {days.map((d) => <th key={d} className="tabular-nums">{d}</th>)}
                <th className="sticky-col-right">当月汇总</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const sm = summaryOf(u.id);
                const rowHasMissing = sm.missing > 0;
                if (onlyMissing && !rowHasMissing) return null;
                return (
                  <tr key={u.id}>
                    <td className="sticky-col font-semibold whitespace-nowrap" style={{ color: 'var(--text)' }}>
                      {u.name}{u.role === 'superadmin' ? '（管理员）' : ''}
                    </td>
                    {days.map((d) => {
                      const c = cellOf(d, u.id);
                      const date = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                      if (c.future) return <td key={d} className="matrix-cell future">·</td>;
                      if (!c.has) return (
                        <td key={d} className="matrix-cell missing" title={`${u.name} ${date} 未打卡`} onClick={() => setDetail({ date, personId: u.id })}>缺</td>
                      );
                      return (
                        <td
                          key={d}
                          className="matrix-cell"
                          style={{
                            background: c.pct >= 80 ? 'rgba(16,185,129,0.14)' : c.pct >= 50 ? 'rgba(245,158,11,0.16)' : 'rgba(244,63,94,0.14)',
                            color: c.pct >= 80 ? 'var(--accent-emerald)' : c.pct >= 50 ? 'var(--accent-amber)' : 'var(--accent-rose)',
                          }}
                          title={`${u.name} ${date} 完成率 ${c.pct}%`}
                          onClick={() => setDetail({ date, personId: u.id })}
                        >
                          {c.pct}
                        </td>
                      );
                    })}
                    <td className="sticky-col-right whitespace-nowrap text-[11.5px]">
                      <span className="font-bold" style={{ color: sm.missing === 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                        {sm.missing === 0 ? '全勤' : `缺 ${sm.missing} 天`}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}> · 均 {sm.avg}%</span>
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && <tr><td colSpan={days.length + 2} className="text-center py-8" style={{ color: 'var(--text-muted)' }}>暂无用户，请先在「用户管理」添加</td></tr>}
            </tbody>
          </table>
        </div>
        {onlyMissing && (
          <div className="text-[12px] mt-2" style={{ color: 'var(--text-muted)' }}>
            已开启「只看未打卡」：仅显示当月存在未打卡日期的成员。
          </div>
        )}
      </div>

      {detail && <RecordDetailModal detail={detail} onClose={() => setDetail(null)} getRecord={getRecord} />}
    </div>
  );
}
