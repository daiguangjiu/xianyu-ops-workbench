import { useCallback, useEffect, useState } from 'react';
import { LS_PREFIX } from '../config';

/** 每日经营数据（自营账号汇总） */
export interface DailyMetric {
  id: string;
  date: string;      // YYYY-MM-DD
  exposure: number;  // 曝光
  views: number;     // 浏览
  wants: number;     // 想要/咨询
  orders: number;    // 成交单数
  gmv: number;       // 成交金额 ¥
  note: string;
}

const KEY = `${LS_PREFIX}metrics`;

function load(): DailyMetric[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as DailyMetric[];
  } catch { /* ignore */ }
  return [];
}

export function useMetrics() {
  const [metrics, setMetrics] = useState<DailyMetric[]>(load);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(metrics));
  }, [metrics]);

  const upsert = useCallback((m: Omit<DailyMetric, 'id'>) => {
    setMetrics((prev) => {
      const exist = prev.find((x) => x.date === m.date);
      if (exist) {
        return prev.map((x) => (x.date === m.date ? { ...m, id: x.id } : x));
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
