import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Lock, Eye, EyeOff, ArrowRight, ShieldCheck, LayoutDashboard, CalendarCheck, BarChart3, User,
} from 'lucide-react';
import { APP_CONFIG } from '../config';
import { login, isAuthed, SUPERADMIN_SEED } from './auth';

const HIGHLIGHTS = [
  { Icon: LayoutDashboard, title: '数据看板', desc: '经营指标与任务进度一屏总览' },
  { Icon: CalendarCheck, title: '运营SOP日历', desc: '每人员每日任务打卡，历史留痕' },
  { Icon: BarChart3, title: '数据分析', desc: '曝光到成交全链路量化追踪' },
];

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || '/dashboard';

  const [username, setUsername] = useState('');
  const [pwd, setPwd] = useState('');
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthed()) navigate(from, { replace: true });
  }, [navigate, from]);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!username || !pwd) { setError('请输入用户名和密码'); return; }
      setLoading(true);
      setError('');
      setTimeout(() => {
        const res = login(username, pwd, remember);
        if (res.ok) navigate(from, { replace: true });
        else { setError(res.msg || '登录失败'); setLoading(false); }
      }, 260);
    },
    [username, pwd, remember, navigate, from],
  );

  return (
    <div className="login-root">
      <div className="glow-orb" style={{ width: 460, height: 460, top: '-12%', left: '-8%', background: 'var(--brand)', opacity: 0.3 }} />
      <div className="glow-orb" style={{ width: 380, height: 380, bottom: '-14%', right: '-6%', background: 'var(--accent-sky)', opacity: 0.22, animation: 'aurora-float-2 12s ease-in-out infinite' }} />

      <div className="login-card">
        <aside className="login-brand">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--gradient-brand)', boxShadow: '0 8px 28px rgba(99,102,241,0.42)' }}>
              <span className="text-white text-xl font-black">{APP_CONFIG.nameInitial}</span>
            </div>
            <div className="leading-tight">
              <div className="text-[19px] font-black tracking-tight" style={{ color: 'var(--text)' }}>{APP_CONFIG.name}</div>
              <div className="text-[12px] font-medium" style={{ color: 'var(--text-muted)' }}>{APP_CONFIG.subtitle}</div>
            </div>
          </div>

          <div className="mt-9 space-y-3.5">
            {HIGHLIGHTS.map(({ Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <Icon size={16} color="var(--brand)" />
                </div>
                <div className="min-w-0">
                  <div className="text-[13.5px] font-semibold" style={{ color: 'var(--text)' }}>{title}</div>
                  <div className="text-[11.5px] mt-0.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-8">
            <span className="chip" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--accent-emerald)', border: '1px solid rgba(16,185,129,0.24)' }}>
              <ShieldCheck size={12} /> 数据全部保存在本机浏览器
            </span>
          </div>
        </aside>

        <section className="login-form">
          <div className="mb-7">
            <h1 className="text-[26px] font-black tracking-tight" style={{ color: 'var(--text)' }}>欢迎回来</h1>
            <p className="text-[13px] mt-1.5" style={{ color: 'var(--text-secondary)' }}>输入账号密码进入运营工作台</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label" htmlFor="username">用户名</label>
              <div className="login-input-wrap">
                <User size={16} color="var(--text-muted)" className="flex-shrink-0" />
                <input id="username" type="text" value={username} autoFocus autoComplete="username"
                  placeholder="请输入用户名" onChange={(e) => { setUsername(e.target.value); setError(''); }} className="login-input" />
              </div>
            </div>

            <div>
              <label className="form-label" htmlFor="pwd">密码</label>
              <div className="login-input-wrap">
                <Lock size={16} color="var(--text-muted)" className="flex-shrink-0" />
                <input id="pwd" type={show ? 'text' : 'password'} value={pwd} autoComplete="current-password"
                  placeholder="请输入密码" onChange={(e) => { setPwd(e.target.value); setError(''); }} className="login-input" />
                <button type="button" onClick={() => setShow((s) => !s)} className="flex-shrink-0 p-1 rounded-md" style={{ color: 'var(--text-muted)' }} aria-label={show ? '隐藏密码' : '显示密码'}>
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {error && <div className="text-[12px] mt-2 font-medium" style={{ color: '#f43f5e' }}>{error}</div>}
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer select-none w-fit">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="login-checkbox" />
              <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>记住登录（30 天内免密）</span>
            </label>

            <button type="submit" disabled={loading} className="btn btn-primary w-full py-3 text-[14.5px]" style={{ opacity: loading ? 0.7 : 1 }}>
              {loading ? '验证中…' : '进入工作台'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <div className="login-hint">
            <ShieldCheck size={14} color="var(--accent-amber)" className="flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-[12.5px]" style={{ color: 'var(--text)' }}>首次使用</div>
              <div className="text-[12px] mt-0.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                超级管理员账号 <code className="login-code">{SUPERADMIN_SEED.username}</code> / <code className="login-code">{SUPERADMIN_SEED.password}</code>，登录后请在「设置」中修改密码；其他用户由超级管理员在「用户管理」中添加。
              </div>
            </div>
          </div>

          <p className="text-[11px] text-center mt-6" style={{ color: 'var(--text-muted)' }}>
            {APP_CONFIG.name} v{APP_CONFIG.version} · 本地存储 · 无数据上传
          </p>
        </section>
      </div>
    </div>
  );
}
