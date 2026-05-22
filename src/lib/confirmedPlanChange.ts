/**
 * Tracks plan changes that have been confirmed by a successful PUT api/paidPlan
 * response in this client. The banner for a scheduled plan change must only
 * show when WE actually triggered + got success from the API — never based
 * solely on user.new_paid_plan_id (which can be stale/phantom from BO).
 *
 * Stored in sessionStorage so it survives navigation but resets per session.
 * Key per subscriber_id, value = { planId, now }.
 */
const KEY = "highway:confirmedPlanChange";

type Entry = { planId: number; now?: boolean };
// legacy: stored as plain number
type Map = Record<string, Entry | number>;

function read(): Map {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function write(map: Map) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

function normalizeEntry(value: any): Entry | null {
  if (!value) return null;
  if (typeof value === "number") return { planId: value, now: false };
  if (typeof value === "object" && typeof value.planId === "number") {
    return { planId: value.planId, now: !!value.now };
  }
  return null;
}

export function markPlanChangeConfirmed(subscriberId: number, newPlanId: number, now = false) {
  const map = read();
  map[String(subscriberId)] = { planId: newPlanId, now };
  write(map);
}

export function clearPlanChangeConfirmed(subscriberId: number) {
  const map = read();
  delete map[String(subscriberId)];
  write(map);
}

export function getConfirmedPlanChange(subscriberId: number): Entry | null {
  const map = read();
  const v = map[String(subscriberId)];
  return normalizeEntry(v);
}
