import type { Subscriber, UserClient } from "./api";

const KEY = "selected_subscriber_id";
const EVENT = "selected-subscriber-changed";

export const getSelectedSubscriberId = (): number | null => {
  const v = sessionStorage.getItem(KEY);
  return v ? Number(v) : null;
};

export const setSelectedSubscriberId = (id: number) => {
  sessionStorage.setItem(KEY, String(id));
  window.dispatchEvent(new CustomEvent(EVENT, { detail: id }));
};

export const onSelectedSubscriberChange = (cb: (id: number) => void) => {
  const handler = (e: Event) => cb((e as CustomEvent<number>).detail);
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
};

const VISIBLE_STATUSES = new Set(["active", "activated", "suspend", "suspended"]);
const normalizeStatus = (s?: string) => (s || "").toLowerCase().replace(/[\s_-]+/g, "");

const rawList = (c: UserClient): Subscriber[] =>
  Array.isArray(c.subscribers) ? c.subscribers : c.subscribers ? [c.subscribers as unknown as Subscriber] : [];

/**
 * Visible subscribers for the line-selector UI.
 * - Single-line account: return as-is (a dedicated overlay handles inactive single lines).
 * - Multi-line account (typical email login): hide lines whose status is not active/suspend.
 */
export const getVisibleSubscribers = (c: UserClient): Subscriber[] => {
  const list = rawList(c);
  if (list.length <= 1) return list;
  return list.filter((s) => VISIBLE_STATUSES.has(normalizeStatus(s.status)));
};

/** Returns the chosen subscriber from a client payload. */
export const pickSubscriber = (c: UserClient): Subscriber | undefined => {
  const full = rawList(c);
  if (full.length === 0) return undefined;
  // Single line: always return it so the inactive-line overlay can react to its status.
  if (full.length === 1) return full[0];
  const visible = getVisibleSubscribers(c);
  const pool = visible.length > 0 ? visible : full;
  const selectedId = getSelectedSubscriberId();
  const found = selectedId != null ? pool.find((s) => s.id === selectedId) : undefined;
  if (found) return found;
  if (pool[0]) sessionStorage.setItem(KEY, String(pool[0].id));
  return pool[0];
};

export const getSubscribersList = (c: UserClient): Subscriber[] => rawList(c);

export const clearSelectedSubscriber = () => {
  sessionStorage.removeItem(KEY);
};
