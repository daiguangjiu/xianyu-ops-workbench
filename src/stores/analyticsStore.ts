import { useCallback, useEffect, useState } from 'react';
import { LS_PREFIX } from '../config';

/** 每日经营数据（按归属用户隔离：成员记自己账号，管理员看/录全员汇总） */
export interface DailyMetric {
  id: string;
  userId?: string;   // 归属用户 id；旧数据（无归属）视为超级管理员 u-admin
  date: string;      // YYYY-MM-DD
  exposure: number;  // 曝光
  views: number;     // 浏览
  wants: number;     // 想要/咨询
  orders: number;    // 成交单数
  gmv: number;       // 成交金额 ¥
  note: string;
}

const KEY = `${LS_PREFIX}metrics`;

/** 旧数据（上线 v0.3 前录入、无归属）默认归到超级管理员名下 */
export const LEGACY_USER_ID = 'u-admin';

export const metricOwner = (m: DailyMetric): string => m.userId || LEGACY_USER_ID;

function load(): DailyMetric[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const arr = JSON.parse(raw) as DailyMetric[];
      // 归一化：补齐旧数据的归属
      return arr.map((m) => (m.userId ? m : { ...m, userId: LEGACY_USER_ID }));
    }
  } catch { /* ignore */ }
  return [];
}

export function useMetrics() {
  const [metrics, setMetrics] = useState<DailyMetric[]>(load);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(metrics));
  }, [metrics]);

  /** 同一用户同一日期覆盖更新 */
  const upsert = useCallback((m: Omit<DailyMetric, 'id'>) => {
    setMetrics((prev) => {
      const exist = prev.find((x) => x.date === m.date && metricOwner(x) === metricOwner(m as DailyMetric));
      if (exist) {
        return prev.map((x) => (x.id === exist.id ? { ...m, id: exist.id } : x));
      }
      return [...prev, { ...m, id: `m-${Date.now()}` }].sort((a, b) => a.date.localeCompare(b.date));
    });
  }, []);

  const remove = useCallback((id: string) => {
    setMetrics((prev) => prev.filter((m) => m.id !== id));
  }, []);

  return { metrics, upsert, remove };
}

/** 环比工具 */
export function calcDelta(cur: number, prev: number): number | null {
  if (!prev) return null;
  return Math.round(((cur - prev) / prev) * 1000) / 10;
}
