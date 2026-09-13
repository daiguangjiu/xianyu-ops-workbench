import { useMemo, useState } from 'react';
import { Plus, X, Trash2, Pencil } from 'lucide-react';
import { useTasks, PRIORITY_LABEL, STATUS_LABEL, priorityChip, statusChip, type Task, type TaskStatus } from '../stores/taskStore';
import { getUsers } from '../auth/auth';
import { todayStr } from '../stores/sopStore';

const emptyForm = { title: '', assignee: '', priority: 'mid' as Task['priority'], status: 'todo' as TaskStatus, due: todayStr(), note: '' };

export function TasksPage() {
  const { tasks, add, update, remove } = useTasks();
  const users = getUsers();

  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = useMemo(
    () => tasks.filter((t) => statusFilter === 'all' || t.status === statusFilter),
    [tasks, statusFilter],
  );

  const counts = useMemo(() => ({
    todo: tasks.filter((t) => t.status === 'todo').length,
    doing: tasks.filter((t) => t.status === 'doing').length,
    done: tasks.filter((t) => t.status === 'done').length,
  }), [tasks]);

  const openAdd = () => {
    setEditingId(null); setForm({ ...emptyForm, assignee: '' }); setShowModal(true);
  };
  const openEdit = (t: Task) => {
    setEditingId(t.id);
    setForm({ title: t.title, assignee: t.assignee, priority: t.priority, status: t.status, due: t.due, note: t.note });
    setShowModal(true);
  };

  const submit = () => {
    if (!form.title.trim()) return;
    if (editingId) update(editingId, form);
    else add(form);
    setShowModal(false);
  };

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="page-title">任务管理</div>
          <div className="page-sub">自营业务待办 · 进度跟踪 · 验收闭环</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={15} /> 新建任务</button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {(['all', 'todo', 'doing', 'done'] as const).map((s) => (
          <button key={s} className="btn btn-sm" onClick={() => setStatusFilter(s)}
            style={statusFilter === s ? { background: 'var(--gradient-brand)', color: '#fff', border: 'none' } : {}}>
            {s === 'all' ? `全部 ${tasks.length}` : `${STATUS_LABEL[s]} ${counts[s]}`}
          </button>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr><th>任务</th><th>负责人</th><th>优先级</th><th>状态</th><th>截止</th><th style={{ width: 120 }}>操作</th></tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center py-10" style={{ color: 'var(--text-muted)' }}>暂无任务，点击右上角「新建任务」开始</td></tr>
            )}
            {filtered.map((t) => (
              <tr key={t.id}>
                <td>
                  <div className="font-semibold" style={{ color: 'var(--text)' }}>{t.title}</div>
                  {t.note && <div className="text-[11.5px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{t.note}</div>}
                </td>
                <td>{t.assignee || '—'}</td>
                <td><span className="chip" style={priorityChip(t.priority)}>{PRIORITY_LABEL[t.priority]}</span></td>
                <td>
                  <select className="select" style={{ width: 96, padding: '4px 8px', fontSize: 12 }}
                    value={t.status} onChange={(e) => update(t.id, { status: e.target.value as TaskStatus })}>
                    <option value="todo">待办</option>
                    <option value="doing">进行中</option>
                    <option value="done">已完成</option>
                  </select>
                </td>
                <td className="text-[12px]">{t.due}</td>
                <td>
                  <div className="flex gap-1.5">
                    <button className="btn btn-sm" onClick={() => openEdit(t)}><Pencil size={12} /></button>
                    <button className="btn btn-sm btn-danger" onClick={() => { if (confirm('确认删除该任务？')) remove(t.id); }}><Trash2 size={12} /></button>
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
              <div className="section-title">{editingId ? '编辑任务' : '新建任务'}</div>
              <button className="icon-btn" onClick={() => setShowModal(false)}><X size={14} /></button>
            </div>
            <div className="px-5 pb-5 space-y-3.5">
              <div>
                <label className="form-label">任务标题 *</label>
                <input className="input" value={form.title} autoFocus placeholder="如：主账号上新 5 款秋冬女包"
                  onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">负责人</label>
                  <select className="select" value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })}>
                    <option value="">未指定</option>
                    {users.map((u) => <option key={u.id} value={u.name}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">优先级</label>
                  <select className="select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Task['priority'] })}>
                    <option value="high">高</option><option value="mid">中</option><option value="low">低</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">状态</label>
                  <select className="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}>
                    <option value="todo">待办</option><option value="doing">进行中</option><option value="done">已完成</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">截止日期</label>
                  <input className="input" type="date" value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="form-label">备注</label>
                <textarea className="textarea" rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button className="btn" onClick={() => setShowModal(false)}>取消</button>
                <button className="btn btn-primary" onClick={submit}>{editingId ? '保存' : '创建'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
