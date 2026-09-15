import { useMemo, useState } from 'react';
import { KeyRound, Sun, Moon, Trash2, ShieldAlert, Stethoscope, ArrowRightLeft } from 'lucide-react';
import { APP_CONFIG, LS_PREFIX } from '../config';
import { changeMyPassword, currentUser, getUsers, isSuperadmin } from '../auth/auth';
import { useSop } from '../stores/sopStore';
import { useMetrics } from '../stores/analyticsStore';
import { useTasks } from '../stores/taskStore';

export function SettingsPage() {
  const me = currentUser();
  const admin = isSuperadmin();
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const theme = document.documentElement.getAttribute('data-theme') || 'light';

  const submitPwd = () => {
    const res = changeMyPassword(oldPwd, newPwd);
    setMsg({ ok: res.ok, text: res.ok ? '密码修改成功' : res.msg! });
    if (res.ok) { setOldPwd(''); setNewPwd(''); }
  };

  const clearAllData = () => {
    if (!confirm('⚠️ 将清空本系统的所有本地数据（任务/SOP记录/经营数据，不含账号），不可恢复，确认继续？')) return;
    if (!confirm('再次确认：真的要清空全部业务数据吗？')) return;
    Object.keys(localStorage).filter((k) => k.startsWith(LS_PREFIX) && k !== `${LS_PREFIX}users` && k !== `${LS_PREFIX}session`).forEach((k) => localStorage.removeItem(k));
    location.reload();
  };

  /* ---------- 数据诊断（管理员） ---------- */
  const { records, reassignRecords } = useSop();
  const { metrics } = useMetrics();
  const { tasks } = useTasks();
  const users = getUsers();
  const [repairTarget, setRepairTarget] = useState('');
  const [repairTip, setRepairTip] = useState('');

  /** 孤儿记录：personId 已不在用户列表中（用户被删除重建过） */
  const orphans = useMemo(() => {
    const ids = new Set(users.map((u) => u.id));
    const map = new Map<string, number>();
    Object.values(records).forEach((r) => {
      if (!ids.has(r.personId)) map.set(r.personId, (map.get(r.personId) || 0) + 1);
    });
    return [...map.entries()];
  }, [records, users]);

  const doRepair = (fromId: string) => {
    if (!repairTarget) return;
    const to = users.find((u) => u.id === repairTarget);
    reassignRecords(fromId, repairTarget);
    setRepairTip(`已把 ${fromId} 的记录归属到「${to?.name}」`);
    setTimeout(() => setRepairTip(''), 3000);
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="page-title">设置</div>
        <div className="page-sub">账户、主题与数据管理</div>
      </div>

      {/* 账户信息 */}
      <div className="card card-pad">
        <div className="section-title mb-3">账户信息</div>
        <div className="space-y-1.5 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
          <div>姓名：<b style={{ color: 'var(--text)' }}>{me?.name}</b></div>
          <div>用户名：<span className="font-mono">@{me?.username}</span></div>
          <div>角色：{me?.role === 'superadmin' ? '超级管理员' : '运营成员'}</div>
        </div>
      </div>

      <div className="grid-2-eq items-start">
        {/* 修改密码 */}
        <div className="card card-pad">
          <div className="section-title mb-3 flex items-center gap-2"><KeyRound size={15} color="var(--brand)" /> 修改密码</div>
          <div className="space-y-3">
            <div>
              <label className="form-label">原密码</label>
              <input className="input" type="password" value={oldPwd} onChange={(e) => setOldPwd(e.target.value)} />
            </div>
            <div>
              <label className="form-label">新密码（至少 6 位）</label>
              <input className="input" type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
            </div>
            {msg && <div className="text-[12px] font-semibold" style={{ color: msg.ok ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>{msg.text}</div>}
            <button className="btn btn-primary" onClick={submitPwd}>保存新密码</button>
          </div>
        </div>

        <div className="space-y-4">
          {/* 主题 */}
          <div className="card card-pad">
            <div className="section-title mb-3 flex items-center gap-2">
              {theme === 'light' ? <Sun size={15} color="var(--brand)" /> : <Moon size={15} color="var(--brand)" />} 外观
            </div>
            <div className="text-[12.5px]" style={{ color: 'var(--text-secondary)' }}>
              当前主题：{theme === 'light' ? '浅色' : '深色'}（点击右上角顶栏的月亮/太阳图标切换）
            </div>
          </div>

          {/* 数据 */}
          <div className="card card-pad" style={{ borderColor: 'rgba(244,63,94,0.35)' }}>
            <div className="section-title mb-2 flex items-center gap-2"><ShieldAlert size={15} color="var(--accent-rose)" /> 数据管理</div>
            <div className="text-[12.5px] mb-3" style={{ color: 'var(--text-secondary)' }}>
              所有数据保存在本机浏览器 localStorage。清空操作不影响账号，但会删除任务、SOP 打卡记录与经营数据，且不可恢复。
            </div>
            <button className="btn btn-danger" onClick={clearAllData}><Trash2 size={14} /> 清空业务数据</button>
          </div>
        </div>
      </div>

      {/* 数据诊断（仅管理员） */}
      {admin && (
        <div className="card card-pad">
          <div className="section-title mb-3 flex items-center gap-2"><Stethoscope size={15} color="var(--brand)" /> 数据诊断</div>
          <div className="grid gap-3 mb-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }}>
            {[
              { label: '用户数', value: users.length },
              { label: '打卡记录', value: Object.keys(records).length },
              { label: '经营数据（天）', value: metrics.length },
              { label: '任务数', value: tasks.length },
              { label: '孤儿记录', value: orphans.reduce((s, [, n]) => s + n, 0) },
            ].map(({ label, value }) => (
              <div key={label} className="p-3 rounded-xl text-center" style={{ background: 'var(--bg-inset)' }}>
                <div className="text-[18px] font-black tabular-nums" style={{ color: 'var(--text)' }}>{value}</div>
                <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</div>
              </div>
            ))}
          </div>

          {orphans.length > 0 ? (
            <div className="p-3 rounded-xl space-y-2" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.35)' }}>
              <div className="text-[12.5px] font-bold" style={{ color: 'var(--accent-amber)' }}>
                发现 {orphans.length} 个「已不存在人员」的历史打卡记录（通常是用户被删除后重建导致 id 变化），请指定新归属：
              </div>
              {orphans.map(([pid, count]) => (
                <div key={pid} className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[11.5px]" style={{ color: 'var(--text-secondary)' }}>{pid}</span>
                  <span className="chip text-[11px]" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>{count} 条</span>
                  <ArrowRightLeft size={13} style={{ color: 'var(--text-muted)' }} />
                  <select className="select" style={{ width: 150 }} value={repairTarget} onChange={(e) => setRepairTarget(e.target.value)}>
                    <option value="">选择归属用户…</option>
                    {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                  <button className="btn btn-sm" disabled={!repairTarget} onClick={() => doRepair(pid)}>迁移</button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[12.5px]" style={{ color: 'var(--accent-emerald)' }}>✅ 数据完整：所有打卡记录都能对应到现有用户</div>
          )}
          {repairTip && <div className="text-[12px] font-semibold mt-2" style={{ color: 'var(--accent-emerald)' }}>{repairTip}</div>}

          <div className="text-[11.5px] mt-3 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            提示：数据按「浏览器 + 地址」隔离保存——<b>本地 http://localhost:5181</b> 与 <b>线上 https://daiguangjiu.github.io/xianyu-ops-workbench/</b> 是两套独立数据，在一边打卡另一边看不到属正常现象；同地址换浏览器或清除缓存也会丢失数据。重要数据请固定在同一个地址使用。
          </div>
        </div>
      )}

      <div className="text-[11px] text-center pt-2" style={{ color: 'var(--text-muted)' }}>
        {APP_CONFIG.name} v{APP_CONFIG.version}
      </div>
    </div>
  );
}
