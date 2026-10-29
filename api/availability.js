import { allow, send, query, fail } from './_lib/http.js';
import { SCHEDULE, nowInClinic, addDays, slotsForDate, isBookable, slotKey } from './_lib/schedule.js';
import { takenSlots } from './_lib/records.js';

export default async function handler(req, res) {
  if (!allow(req, res, ['GET'])) return;
  try {
    const q = query(req);
    const today = nowInClinic().date;
    const from = /^\d{4}-\d{2}-\d{2}$/.test(q.from || '') && q.from > today ? q.from : today;
    const days = Math.min(Math.max(Number(q.days) || 28, 1), SCHEDULE.maxDaysAhead);
    const taken = await takenSlots();
    const out = [];
    for (let i = 0; i < days; i++) {
      const date = addDays(from, i);
      if (date > addDays(today, SCHEDULE.maxDaysAhead)) break;
      const all = slotsForDate(date);
      if (!all.length) continue;
      out.push({ date, times: all.map((time) => ({ time, open: isBookable(date, time) && !taken.has(slotKey(date, time)) })) });
    }
    send(res, 200, { timeZone: SCHEDULE.timeZone, slotMinutes: SCHEDULE.slotMinutes, days: out });
  } catch (e) { fail(res, e); }
}
