import { useCallback, useEffect, useMemo, useState } from 'react';
import { LS_PREFIX } from '../config';

/** 每日SOP任务模板项 */
export interface SopItem {
  id: string;
  label: string;
  required: boolean;
}

/** 某人某天的SOP执行记录（保存后即为历史记录，按 日期+人员 唯一） */
export interface SopRecord {
  date: string;          // YYYY-MM-DD
  personId: string;      // 用户 id
  done: string[];        // 已完成的 SopItem id
  extra: string[];       // 额外完成的自定义任务文案
  note: string;
  updatedAt: string;
}

const ITEMS_KEY = `${LS_PREFIX}sop_items`;
const RECORDS_KEY = `${LS_PREFIX}sop_records`;

/** 默认每日SOP模板：闲鱼自营账号日常动作 */
export const DEFAULT_SOP_ITEMS: SopItem[] = [
  { id: 'sop-1', label: '商品擦亮（全部在架商品）', required: true },
  { id: 'sop-2', label: '上新 / 补充新款（≥3 款）', required: true },
  { id: 'sop-3', label: '回复咨询消息（30 分钟内响应）', required: true },
  { id: 'sop-4', label: '议单催拍 / 促成转化', required: false },
  { id: 'sop-5', label: '订单处理与发货跟进', required: true },
  { id: 'sop-6', label: '同行竞品观察（记录 2 个爆款）', required: false },
  { id: 'sop-7', label: '当日数据记录（曝光/浏览/想要/成交）', required: true },
];

function loadItems(): SopItem[] {
  try {
    const raw = localStorage.getItem(ITEMS_KEY);
    if (raw) return JSON.parse(raw) as SopItem[];
  } catch { /* ignore */ }
  localStorage.setItem(ITEMS_KEY, JSON.stringify(DEFAULT_SOP_ITEMS));
  return DEFAULT_SOP_ITEMS;
}

function loadRecords(): Record<string, SopRecord> {
  try {
    const raw = localStorage.getItem(RECORDS_KEY);
    if (raw) return JSON.parse(raw) as Record<string, SopRecord>;
  } catch { /* ignore */ }
  return {};
}

export const recordKey = (date: string, personId: string) => `${date}__${personId}`;

export function useSop() {
  const [items, setItems] = useState<SopItem[]>(loadItems);
  const [records, setRecords] = useState<Record<string, SopRecord>>(loadRecords);

  useEffect(() => {
    localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  }, [records]);

  const getRecord = useCallback(
    (date: string, personId: string): SopRecord | undefined => records[recordKey(date, personId)],
    [records],
  );

  /** 保存（新增或覆盖）某天某人的执行记录 —— 即落一条历史记录 */
  const saveRecord = useCallback(
    (date: string, personId: string, patch: Partial<Omit<SopRecord, 'date' | 'personId'>>) => {
      setRecords((prev) => {
        const key = recordKey(date, personId);
        const base: SopRecord = prev[key] || { date, personId, done: [], extra: [], note: '', updatedAt: '' };
        return { ...prev, [key]: { ...base, ...patch, date, personId, updatedAt: new Date().toISOString() } };
      });
    },
    [],
  );

  const removeRecord = useCallback((date: string, personId: string) => {
    setRecords((prev) => {
      const next = { ...prev };
      delete next[recordKey(date, personId)];
      return next;
    });
  }, []);

  const addItem = useCallback((label: string, required: boolean) => {
    setItems((prev) => [...prev, { id: `sop-${Date.now()}`, label, required }]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const toggleItemRequired = useCallback((id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, required: !i.required } : i)));
  }, []);

  return { items, records, getRecord, saveRecord, removeRecord, addItem, removeItem, toggleItemRequired };
}

/** 月份工具：返回某月天数、首日星期等 */
export function useMonthGrid(year: number, month: number) {
  return useMemo(() => {
    const first = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const startWeek = first.getDay(); // 0=周日
    const cells: (string | null)[] = [];
    for (let i = 0; i < startWeek; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(`${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [year, month]);
}

export const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
