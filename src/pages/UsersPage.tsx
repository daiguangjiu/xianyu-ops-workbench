import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { UserPlus, KeyRound, Trash2, Power, ShieldCheck, X, Pencil } from 'lucide-react';
import { getUsers, addUser, updateUser, deleteUser, currentUser, type User } from '../auth/auth';

type FormState = {
  id?: string;
  username: string;
  name: string;
  password: string;
  role: 'member' | 'superadmin';
};

const emptyForm: FormState = { username: '', name: '', password: '', role: 'member' };

export function UsersPage() {
  const me = currentUser();
  const [, force] = useState(0);
  const refresh = () => force((n) => n + 1);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editing, setEditing] = useState(false);
  const [msg, setMsg] = useState('');

  if (me?.role !== 'superadmin') return <Navigate to="/dashboard" replace />;

  const users = getUsers();

  const openAdd = () => { setForm(emptyForm); setEditing(false); setMsg(''); setShowModal(true); };
  const openEdit = (u: User) => {
    setForm({ id: u.id, username: u.username, name: u.name, password: '', role: u.role });
    setEditing(true); setMsg(''); setShowModal(true);
  };

  const submit = () => {
    if (editing && form.id) {
      const patch: Partial<User> = { name: form.name, role: form.role };
      if (form.password) {
        if (form.password.length < 6) { setMsg('密码至少 6 位'); return; }
        patch.password = form.password;
      }
      const res = updateUser(form.id, patch);
      if (!res.ok) { setMsg(res.msg!); return; }
    } else {
      const res = addUser(form);
      if (!res.ok) { setMsg(res.msg!); return; }
    }
    setShowModal(false);
    refresh();
  };

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="page-title">用户管理</div>
          <div className="page-sub">仅超级管理员可见：添加运营成员、重置密码、停用/启用账号</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><UserPlus size={15} /> 添加用户</button>
      </div>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>用户</th><th>用户名</th><th>角色</th><th>状态</th><th>创建日期</th><th style={{ width: 150 }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[12px] font-bold flex-shrink-0" style={{ background: 'var(--gradient-brand)' }}>
                      {u.name.slice(0, 1)}
                    </div>
                    <div>
                      <div className="font-semibold" style={{ color: 'var(--text)' }}>{u.name}</div>
                      {u.id === me.id && <div className="text-[10.5px]" style={{ color: 'var(--text-muted)' }}>（当前登录）</div>}
                    </div>
                  </div>
                </td>
                <td className="font-mono text-[12px]">@{u.username}</td>
                <td>
                  {u.role === 'superadmin' ? (
                    <span className="chip" style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--brand-strong)', border: '1px solid rgba(99,102,241,0.24)' }}>
                      <ShieldCheck size={11} /> 超级管理员
                    </span>
                  ) : (
                    <span className="chip" style={{ background: 'var(--bg-inset)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>运营成员</span>
                  )}
                </td>
                <td>
                  <span className="chip" style={u.status === 'active'
                    ? { background: 'rgba(16,185,129,0.1)', color: 'var(--accent-emerald)', border: '1px solid rgba(16,185,129,0.24)' }
                    : { background: 'rgba(244,63,94,0.1)', color: 'var(--accent-rose)', border: '1px solid rgba(244,63,94,0.24)' }}>
                    {u.status === 'active' ? '启用' : '停用'}
                  </span>
                </td>
                <td className="text-[12px]">{u.createdAt}</td>
                <td>
                  <div className="flex items-center gap-1.5">
                    <button className="btn btn-sm" onClick={() => openEdit(u)}><Pencil size={12} /> 编辑</button>
                    {u.role !== 'superadmin' && (
                      <>
                        <button className="btn btn-sm" title={u.status === 'active' ? '停用' : '启用'}
                          onClick={() => { updateUser(u.id, { status: u.status === 'active' ? 'disabled' : 'active' }); refresh(); }}>
                          <Power size={12} />
                        </button>
                        <button className="btn btn-sm btn-danger" title="删除"
                          onClick={() => { if (confirm(`确认删除用户「${u.name}」？`)) { deleteUser(u.id); refresh(); } }}>
                          <Trash2 size={12} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-mask" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <div className="section-title flex items-center gap-2">
                {editing ? <Pencil size={15} color="var(--brand)" /> : <UserPlus size={15} color="var(--brand)" />}
                {editing ? `编辑用户：@${form.username}` : '添加用户'}
              </div>
              <button className="icon-btn" onClick={() => setShowModal(false)}><X size={14} /></button>
            </div>
            <div className="px-5 pb-5 space-y-3.5">
              {!editing && (
                <div>
                  <label className="form-label">用户名（登录用，唯一）</label>
                  <input className="input" value={form.username} placeholder="如 xiaoyu"
                    onChange={(e) => setForm({ ...form, username: e.target.value })} />
                </div>
              )}
              <div>
                <label className="form-label">姓名 / 显示名</label>
                <input className="input" value={form.name} placeholder="如 小雨"
                  onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="form-label">{editing ? '重置密码（留空则不修改）' : '初始密码（至少 6 位）'}</label>
                <input className="input" type="text" value={form.password} placeholder="至少 6 位"
                  onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
              <div>
                <label className="form-label">角色</label>
                <select className="select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as FormState['role'] })}>
                  <option value="member">运营成员</option>
                  <option value="superadmin" disabled>超级管理员（仅系统内置一个）</option>
                </select>
              </div>
              {msg && <div className="text-[12px] font-medium" style={{ color: 'var(--accent-rose)' }}>{msg}</div>}
              <div className="flex justify-end gap-2 pt-1">
                <button className="btn" onClick={() => setShowModal(false)}>取消</button>
                <button className="btn btn-primary" onClick={submit}>
                  <KeyRound size={14} /> {editing ? '保存修改' : '创建用户'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
