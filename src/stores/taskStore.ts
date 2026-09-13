import { useCallback, useEffect, useState } from 'react';
import { LS_PREFIX } from '../config';

export type TaskStatus = 'todo' | 'doing' | 'done';
export type TaskPriority = 'high' | 'mid' | 'low';

export interface Task {
  id: string;
  title: string;
  assignee: string;      // 用户名或姓名
  priority: TaskPriority;
  status: TaskStatus;
  due: string;           // YYYY-MM-DD
  note: string;
  createdAt: string;
}

const KEY = `${LS_PREFIX}tasks`;

function load(): Task[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Task[];
  } catch { /* ignore */ }
  return [];
}

export const PRIORITY_LABEL: Record<TaskPriority, string> = { high: '高', mid: '中', low: '低' };
export const STATUS_LABEL: Record<TaskStatus, string> = { todo: '待办', doing: '进行中', done: '已完成' };

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  high: 'rgba(244,63,94,0.1)|var(--accent-rose)|rgba(244,63,94,0.24)',
  mid: 'rgba(245,158,11,0.1)|var(--accent-amber)|rgba(245,158,11,0.24)',
  low: 'rgba(14,165,233,0.1)|var(--accent-sky)|rgba(14,165,233,0.24)',
};

export function priorityChip(p: TaskPriority) {
  const [bg, color, border] = PRIORITY_COLOR[p].split('|');
  return { background: bg, color, border: `1px solid ${border}` };
}

const STATUS_COLOR: Record<TaskStatus, string> = {
  todo: 'rgba(138,146,168,0.12)|var(--text-muted)|var(--border)',
  doing: 'rgba(99,102,241,0.1)|var(--brand-strong)|rgba(99,102,241,0.24)',
  done: 'rgba(16,185,129,0.1)|var(--accent-emerald)|rgba(16,185,129,0.24)',
};

export function statusChip(s: TaskStatus) {
  const [bg, color, border] = STATUS_COLOR[s].split('|');
  return { background: bg, color, border: `1px solid ${border}` };
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(load);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(tasks));
  }, [tasks]);

  const add = useCallback((t: Omit<Task, 'id' | 'createdAt'>) => {
    setTasks((prev) => [
      { ...t, id: `t-${Date.now()}`, createdAt: new Date().toISOString().slice(0, 10) },
      ...prev,
    ]);
  }, []);

  const update = useCallback((id: string, patch: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  const remove = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { tasks, add, update, remove };
}
