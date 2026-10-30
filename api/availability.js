import { allow, send, query, fail } from './_lib/http.js';
import { SCHEDULE, nowInClinic, addDays, slotsForDate, isBookable } from './_lib/schedule.js';
import { takenSlots, isTaken } from './_lib/records.js';
import { SERVICE_IDS } from './_lib/services.js';

export default async function handler(req, res) {
  if (!allow(req, res, ['GET'])) return;
  try {
    const q = query(req);
    const today = nowInClinic().date;
    const first = today > SCHEDULE.opensOn ? today : SCHEDULE.opensOn;
    const from = /^\d{4}-\d{2}-\d{2}$/.test(q.from || '') && q.from > first ? q.from : first;
    const days = Math.min(Math.max(Number(q.days) || 28, 1), SCHEDULE.maxDaysAhead);
    const taken = await takenSlots();
    const out = [];
    for (let i = 0; i < days; i++) {
      const date = addDays(from, i);
      if (date > addDays(today, SCHEDULE.maxDaysAhead)) break;
      const all = slotsForDate(date);
      if (!all.length) continue;
      out.push({ date, times: all.map((time) => {
        const services = isBookable(date, time) ? SERVICE_IDS.filter((id) => !isTaken(taken, date, time, id)) : [];
        return { time, open: services.length > 0, services };
      }) });
    }
    send(res, 200, { timeZone: SCHEDULE.timeZone, slotMinutes: SCHEDULE.slotMinutes, opensOn: SCHEDULE.opensOn, days: out });
  } catch (e) { fail(res, e); }
}
