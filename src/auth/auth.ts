import { LS_PREFIX } from '../config';

export interface User {
  id: string;
  username: string;
  name: string;
  password: string;
  role: 'superadmin' | 'member';
  status: 'active' | 'disabled';
  createdAt: string;
}

export interface Session {
  userId: string;
  loginAt: number;
  expireAt: number;
}

const USERS_KEY = `${LS_PREFIX}users`;
const SESSION_KEY = `${LS_PREFIX}session`;

/** 超级管理员初始账号（首启自动种子） */
export const SUPERADMIN_SEED: User = {
  id: 'u-admin',
  username: 'admin',
  name: '超级管理员',
  password: 'admin123',
  role: 'superadmin',
  status: 'active',
  createdAt: new Date().toISOString().slice(0, 10),
};

function loadUsers(): User[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (raw) return JSON.parse(raw) as User[];
  } catch { /* ignore */ }
  localStorage.setItem(USERS_KEY, JSON.stringify([SUPERADMIN_SEED]));
  return [SUPERADMIN_SEED];
}

function saveUsers(users: User[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

let cache: User[] | null = null;

export function getUsers(): User[] {
  if (!cache) cache = loadUsers();
  return cache;
}

export function getUserById(id: string): User | undefined {
  return getUsers().find((u) => u.id === id);
}

export function addUser(input: Pick<User, 'username' | 'name' | 'password' | 'role'>): { ok: boolean; msg?: string; user?: User } {
  const users = getUsers();
  if (!input.username.trim()) return { ok: false, msg: '用户名不能为空' };
  if (users.some((u) => u.username === input.username.trim())) return { ok: false, msg: '用户名已存在' };
  if (!input.password || input.password.length < 6) return { ok: false, msg: '密码至少 6 位' };
  const user: User = {
    id: `u-${Date.now()}`,
    username: input.username.trim(),
    name: input.name.trim() || input.username.trim(),
    password: input.password,
    role: input.role,
    status: 'active',
    createdAt: new Date().toISOString().slice(0, 10),
  };
  users.push(user);
  saveUsers(users);
  return { ok: true, user };
}

export function updateUser(id: string, patch: Partial<Omit<User, 'id' | 'username'>>): { ok: boolean; msg?: string } {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx < 0) return { ok: false, msg: '用户不存在' };
  if (users[idx].role === 'superadmin' && patch.role && patch.role !== 'superadmin') {
    return { ok: false, msg: '不能降级超级管理员' };
  }
  if (patch.status && users[idx].role === 'superadmin' && patch.status === 'disabled') {
    return { ok: false, msg: '不能停用超级管理员' };
  }
  users[idx] = { ...users[idx], ...patch };
  saveUsers(users);
  return { ok: true };
}

export function deleteUser(id: string): { ok: boolean; msg?: string } {
  const users = getUsers();
  const target = users.find((u) => u.id === id);
  if (!target) return { ok: false, msg: '用户不存在' };
  if (target.role === 'superadmin') return { ok: false, msg: '超级管理员不可删除' };
  saveUsers(users.filter((u) => u.id !== id));
  return { ok: true };
}

/* ---------- 登录态 ---------- */

export function login(username: string, password: string, remember: boolean): { ok: boolean; msg?: string } {
  const user = getUsers().find((u) => u.username === username.trim());
  if (!user || user.password !== password) return { ok: false, msg: '用户名或密码不正确' };
  if (user.status === 'disabled') return { ok: false, msg: '该账号已被停用，请联系超级管理员' };
  const days = remember ? 30 : 1;
  const session: Session = { userId: user.id, loginAt: Date.now(), expireAt: Date.now() + days * 86400_000 };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { ok: true };
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    if (Date.now() > s.expireAt) { logout(); return null; }
    return s;
  } catch { return null; }
}

export function isAuthed(): boolean {
  const s = getSession();
  return !!s && !!getUserById(s.userId);
}

export function currentUser(): User | null {
  const s = getSession();
  if (!s) return null;
  return getUserById(s.userId) ?? null;
}

export function isSuperadmin(): boolean {
  return currentUser()?.role === 'superadmin';
}

export function changeMyPassword(oldPwd: string, newPwd: string): { ok: boolean; msg?: string } {
  const me = currentUser();
  if (!me) return { ok: false, msg: '未登录' };
  if (me.password !== oldPwd) return { ok: false, msg: '原密码不正确' };
  if (newPwd.length < 6) return { ok: false, msg: '新密码至少 6 位' };
  return updateUser(me.id, { password: newPwd });
}
