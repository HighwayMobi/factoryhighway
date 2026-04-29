/**
 * Tracks plan changes that have been confirmed by a successful PUT api/paidPlan
 * response in this client. The banner for a scheduled plan change must only
 * show when WE actually triggered + got success from the API — never based
 * solely on user.new_paid_plan_id (which can be stale/phantom from BO).
 *
 * Stored in sessionStorage so it survives navigation but resets per session.
 * Key per subscriber_id, value = confirmed new plan id.
 */
const KEY = "highway:confirmedPlanChange";

type Map = Record<string, number>;

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

export function markPlanChangeConfirmed(subscriberId: number, newPlanId: number) {
  const map = read();
  map[String(subscriberId)] = newPlanId;
  write(map);
}

export function clearPlanChangeConfirmed(subscriberId: number) {
  const map = read();
  delete map[String(subscriberId)];
  write(map);
}

export function getConfirmedPlanChange(subscriberId: number): number | null {
  const map = read();
  const v = map[String(subscriberId)];
  return typeof v === "number" && v > 0 ? v : null;
}
