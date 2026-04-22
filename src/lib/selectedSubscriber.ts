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

/** Returns the chosen subscriber from a client payload, falling back to the first. */
export const pickSubscriber = (c: UserClient): Subscriber | undefined => {
  const list = Array.isArray(c.subscribers) ? c.subscribers : c.subscribers ? [c.subscribers as unknown as Subscriber] : [];
  if (list.length === 0) return undefined;
  const selectedId = getSelectedSubscriberId();
  const found = selectedId != null ? list.find((s) => s.id === selectedId) : undefined;
  if (found) return found;
  // initialize with the first one
  if (selectedId == null && list[0]) {
    sessionStorage.setItem(KEY, String(list[0].id));
  }
  return list[0];
};

export const getSubscribersList = (c: UserClient): Subscriber[] => {
  return Array.isArray(c.subscribers) ? c.subscribers : c.subscribers ? [c.subscribers as unknown as Subscriber] : [];
};

export const clearSelectedSubscriber = () => {
  sessionStorage.removeItem(KEY);
};
