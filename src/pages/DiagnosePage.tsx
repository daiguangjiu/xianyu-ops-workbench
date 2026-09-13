import { useMemo, useState } from 'react';
import { Stethoscope, RotateCcw, CheckCircle2, AlertTriangle } from 'lucide-react';

/** 五段漏斗：曝光 → 浏览 → 想要/咨询 → 成交 → 复购 */
const STAGES = [
  { key: 'exposure', label: '曝光', hint: '商品被展示次数' },
  { key: 'views', label: '浏览', hint: '进入详情页次数' },
  { key: 'wants', label: '想要/咨询', hint: '想要人数+咨询人数' },
  { key: 'orders', label: '成交', hint: '付款单数' },
] as const;

type StageKey = (typeof STAGES)[number]['key'];
const emptyInput: Record<StageKey, string> = { exposure: '', views: '', wants: '', orders: '' };

/** 行业参考转化率（闲鱼大盘经验区间） */
const BENCHMARKS: { from: StageKey; to: StageKey; min: number; max: number; lowTip: string }[] = [
  { from: 'exposure', to: 'views', min: 4, max: 10, lowTip: '曝光→浏览偏低：主图吸引力不足或标题关键词不精准。建议：更换首图（真实场景/手持图）、标题埋入高频搜索词、测试不同封面风格。' },
  { from: 'views', to: 'wants', min: 6, max: 15, lowTip: '浏览→想要偏低：详情页转化弱。建议：补充实拍图/细节图、完善描述与瑕疵说明、设置诱饵价或小赠品、优化"想要"引导话术。' },
  { from: 'wants', to: 'orders', min: 15, max: 35, lowTip: '想要→成交偏低：议价与响应环节流失。建议：30 分钟内回复、预设议价底线话术、对意向用户主动催拍、适当让利促单。' },
];

export function DiagnosePage() {
  const [input, setInput] = useState(emptyInput);
  const [gmv, setGmv] = useState('');

  const nums = useMemo(() => {
    const n = (k: StageKey) => Number(input[k]) || 0;
    return { exposure: n('exposure'), views: n('views'), wants: n('wants'), orders: n('orders') };
  }, [input]);

  const valid = nums.exposure > 0 && nums.views > 0 && nums.wants > 0 && nums.orders > 0;

  const rate = (a: number, b: number) => (a > 0 ? Math.round((b / a) * 1000) / 10 : 0);

  const stages = useMemo(() => [
    { label: '曝光', value: nums.exposure, pct: 100 },
    { label: '浏览', value: nums.views, pct: nums.exposure ? (nums.views / nums.exposure) * 100 : 0 },
    { label: '想要/咨询', value: nums.wants, pct: nums.exposure ? (nums.wants / nums.exposure) * 100 : 0 },
    { label: '成交', value: nums.orders, pct: nums.exposure ? (nums.orders / nums.exposure) * 100 : 0 },
  ], [nums]);

  const diagnoses = useMemo(() => {
    if (!valid) return [];
    const pairs: [StageKey, StageKey][] = [['exposure', 'views'], ['views', 'wants'], ['wants', 'orders']];
    return pairs.map(([from, to]) => {
      const bench = BENCHMARKS.find((b) => b.from === from && b.to === to)!;
      const r = rate(nums[from], nums[to]);
      const status = r >= bench.min ? (r > bench.max ? 'excellent' : 'ok') : 'low';
      return { label: `${STAGES.find((s) => s.key === from)!.label}→${STAGES.find((s) => s.key === to)!.label}`, r, bench, status, tip: bench.lowTip };
    });
  }, [nums, valid]);

  const avgPrice = nums.orders > 0 ? Math.round((Number(gmv) || 0) / nums.orders) : 0;

  return (
    <div className="space-y-4 max-w-4xl">
      <div>
        <div className="page-title">投流诊断器</div>
        <div className="page-sub">五段漏斗转化诊断 · 断点定位 · 优化建议（参考闲鱼大盘经验区间）</div>
      </div>

      <div className="card card-pad">
        <div className="section-title mb-3">输入周期数据（如近 7 天）</div>
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
          {STAGES.map((s) => (
            <div key={s.key}>
              <label className="form-label">{s.label}</label>
              <input className="input" type="number" min={0} placeholder={s.hint} value={input[s.key]}
                onChange={(e) => setInput({ ...input, [s.key]: e.target.value })} />
            </div>
          ))}
          <div>
            <label className="form-label">成交金额 ¥（可选）</label>
            <input className="input" type="number" min={0} placeholder="GMV" value={gmv} onChange={(e) => setGmv(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <button className="btn btn-primary" disabled={!valid}><Stethoscope size={14} /> 生成诊断</button>
          <button className="btn" onClick={() => { setInput(emptyInput); setGmv(''); }}><RotateCcw size={14} /> 重置</button>
          {!valid && <span className="text-[12px] self-center" style={{ color: 'var(--text-muted)' }}>填写全部漏斗数据后自动出诊断</span>}
        </div>
      </div>

      {valid && (
        <>
          <div className="card card-pad">
            <div className="section-title mb-3">漏斗概览</div>
            <div className="space-y-2.5">
              {stages.map((s, i) => (
                <div key={s.label} className="funnel-stage">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between text-[12.5px] mb-1.5">
                      <span className="font-semibold" style={{ color: 'var(--text)' }}>{s.label}</span>
                      <span className="tabular-nums" style={{ color: 'var(--text-secondary)' }}>{s.value.toLocaleString()}{i > 0 && <span className="ml-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>总体 {s.pct.toFixed(1)}%</span>}</span>
                    </div>
                    <div className="progress-track"><div className="progress-fill" style={{ width: `${Math.max(2, Math.min(100, s.pct))}%` }} /></div>
                  </div>
                </div>
              ))}
            </div>
            {avgPrice > 0 && (
              <div className="mt-3 text-[12.5px]" style={{ color: 'var(--text-secondary)' }}>
                客单价：<b style={{ color: 'var(--text)' }}>¥{avgPrice}</b>
                <span className="ml-3" style={{ color: 'var(--text-muted)' }}>（GMV ¥{Number(gmv).toLocaleString()} ÷ {nums.orders} 单）</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {diagnoses.map((d) => {
              const ok = d.status !== 'low';
              const excellent = d.status === 'excellent';
              return (
                <div key={d.label} className="card card-pad flex items-start gap-3"
                  style={{ borderColor: ok ? 'rgba(16,185,129,0.35)' : 'rgba(244,63,94,0.35)' }}>
                  {ok
                    ? <CheckCircle2 size={18} color="var(--accent-emerald)" className="flex-shrink-0 mt-0.5" />
                    : <AlertTriangle size={18} color="var(--accent-rose)" className="flex-shrink-0 mt-0.5" />}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[13.5px]" style={{ color: 'var(--text)' }}>{d.label}</span>
                      <span className="chip" style={ok
                        ? { background: 'rgba(16,185,129,0.1)', color: 'var(--accent-emerald)', border: '1px solid rgba(16,185,129,0.24)' }
                        : { background: 'rgba(244,63,94,0.1)', color: 'var(--accent-rose)', border: '1px solid rgba(244,63,94,0.24)' }}>
                        {d.r}%{excellent ? ' · 优于大盘' : ok ? ' · 正常区间' : ' · 低于参考'}
                      </span>
                      <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>参考区间 {d.bench.min}%–{d.bench.max}%</span>
                    </div>
                    <div className="text-[12.5px] mt-1.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {ok
                        ? (excellent ? '该环节表现优秀，注意保持当前素材与话术节奏，沉淀为 SOP。' : '该环节处于正常区间，维持现状并持续观察波动。')
                        : d.tip}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
