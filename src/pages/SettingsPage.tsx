import { useState } from 'react';
import { KeyRound, Sun, Moon, Trash2, ShieldAlert } from 'lucide-react';
import { APP_CONFIG, LS_PREFIX } from '../config';
import { changeMyPassword, currentUser } from '../auth/auth';

export function SettingsPage() {
  const me = currentUser();
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

  return (
    <div className="space-y-4 max-w-2xl">
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

      <div className="text-[11px] text-center pt-2" style={{ color: 'var(--text-muted)' }}>
        {APP_CONFIG.name} v{APP_CONFIG.version}
      </div>
    </div>
  );
}
