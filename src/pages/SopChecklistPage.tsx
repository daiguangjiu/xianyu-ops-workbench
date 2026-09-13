import { Link } from 'react-router-dom';
import { CalendarCheck, Info, ChevronRight } from 'lucide-react';
import { SOP_GROUPS, TIME_TABLE } from '../stores/sopStore';

const FREQ_TAG: Record<string, { text: string; style: React.CSSProperties }> = {
  daily: { text: '每日打卡', style: { background: 'rgba(16,185,129,0.1)', color: 'var(--accent-emerald)', border: '1px solid rgba(16,185,129,0.24)' } },
  weekly: { text: '每周日执行', style: { background: 'rgba(245,158,11,0.1)', color: 'var(--accent-amber)', border: '1px solid rgba(245,158,11,0.24)' } },
  'pre-publish': { text: '发品前逐项过', style: { background: 'rgba(14,165,233,0.1)', color: 'var(--accent-sky)', border: '1px solid rgba(14,165,233,0.24)' } },
};

export function SopChecklistPage() {
  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="page-title">每日Checklist · 单账号全维SOP</div>
          <div className="page-sub">源自《闲鱼自运营手册_3C数码与本地生活》④ 单账号全维SOP·Checklist</div>
        </div>
        <Link to="/ops/sop" className="btn btn-primary">
          <CalendarCheck size={15} /> 去运营日历打卡 <ChevronRight size={14} />
        </Link>
      </div>

      {/* 使用说明 */}
      <div className="card card-pad">
        <div className="section-title mb-2 flex items-center gap-2"><Info size={15} color="var(--brand)" /> 使用说明（先读 30 秒）</div>
        <ul className="space-y-1.5 text-[12.5px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          <li>· <b style={{ color: 'var(--text)' }}>打卡入口在「运营日历」：</b>本页是 Checklist 全文（含「怎么做」与「📊 数据影响」），日历页的每日打卡条目即来自这里——每日组（A/B/C/D）固定打卡，每周组（每周 Checklist + 账号权重养护）在<b>每周日</b>自动加入当日打卡。</li>
          <li>· <b style={{ color: 'var(--text)' }}>图例：</b>每条含「怎么做」+「📊 数据影响」，说明该动作影响了哪个数据指标——明白数据影响的动作才会主动做。</li>
          <li>· <b style={{ color: 'var(--text)' }}>执行口径：</b>每日 Checklist 是底线动作，做完才算当日合格；发品前 Checklist 是单商品动作；每周 Checklist 周日统一执行。</li>
        </ul>
      </div>

      {/* 每日时段总表 */}
      <div className="card card-pad">
        <div className="section-title mb-1">每日时段总表（60–90 分钟 · 三打卡 + 日结）</div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead><tr><th>时段</th><th>时长</th><th>对应 Checklist</th><th>当日合格线</th></tr></thead>
            <tbody>
              {TIME_TABLE.map((r) => (
                <tr key={r.slot}>
                  <td className="font-bold whitespace-nowrap" style={{ color: 'var(--text)' }}>{r.slot}</td>
                  <td className="whitespace-nowrap">{r.duration}</td>
                  <td>{r.check}</td>
                  <td className="text-[12px]">{r.standard}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 各组 Checklist 全文 */}
      {SOP_GROUPS.map((g) => {
        const tag = FREQ_TAG[g.freq];
        return (
          <div key={g.key} className="ck-group card-pad">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="section-title">{g.label}</span>
              <span className="chip" style={tag.style}>{tag.text}</span>
              <span className="chip" style={{ background: 'var(--bg-inset)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>{g.items.length} 项</span>
            </div>
            <div className="page-sub mb-3">{g.sub}</div>
            <div className="space-y-2">
              {g.items.map((it) => (
                <details key={it.id} className="ck-item">
                  <summary>
                    <span className="chip flex-shrink-0" style={{ background: 'var(--surface)', color: 'var(--brand-strong)', border: '1px solid rgba(99,102,241,0.24)' }}>{it.id}</span>
                    <span className="t flex-1 min-w-0">{it.title}</span>
                  </summary>
                  <div className="ck-how"><b>怎么做：</b>{it.how}</div>
                  <div className="ck-why">📊 {it.why}</div>
                </details>
              ))}
            </div>
          </div>
        );
      })}

      {/* 矩阵批量法 */}
      <div className="card card-pad">
        <div className="section-title mb-2">矩阵批量法（多账号版）</div>
        <ul className="space-y-1.5 text-[12.5px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          <li>· <b style={{ color: 'var(--text)' }}>1 人 2–3 号上限</b>，再多人效就崩；账号分设备、分网络环境固定绑定</li>
          <li>· 账号分角色：<b style={{ color: 'var(--text)' }}>主力号</b>每天完整跑 A–D 全部 Checklist；<b style={{ color: 'var(--text)' }}>铺量号</b>只做 A 组 1/2/4 + B 组 1/2/3 + 隔天上新</li>
          <li>· 商品错位：矩阵账号之间同品类不同关键词、不同价格带（±10%），<b style={{ color: 'var(--text)' }}>避免同图同文同价</b>互抢流量</li>
          <li>· 爆款共享机制：主力号验证的爆品，24 小时内铺到铺量号（必须改图改标题）</li>
          <li>· Checklist 复用：所有 Checklist 铺量号可复用，只是按角色裁剪条目</li>
        </ul>
      </div>
    </div>
  );
}
