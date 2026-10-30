// Booking schedule. Times are clinic-local (America/New_York).
export const SCHEDULE = {
  timeZone: 'America/New_York',
  slotMinutes: 90,          // session plus changeover
  capacity: 1,              // appointments per service in each slot
  opensOn: '2026-11-02',    // first bookable day
  minLeadMinutes: 120,      // earliest a slot can be booked from now
  maxDaysAhead: 60,
  // 0 = Sunday ... 6 = Saturday. Matches the Google Business hours: Mon–Fri 8 AM–5 PM.
  hours: { 1: ['08:00', '17:00'], 2: ['08:00', '17:00'], 3: ['08:00', '17:00'], 4: ['08:00', '17:00'], 5: ['08:00', '17:00'] },
  closedDates: [],          // e.g. '2026-12-25'
};

const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const toTime = (m) => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');

export function nowInClinic() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: SCHEDULE.timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date()).map((p) => [p.type, p.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}

export function addDays(date, n) {
  const d = new Date(date + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function weekday(date) { return new Date(date + 'T12:00:00Z').getUTCDay(); }

export function slotsForDate(date) {
  if (SCHEDULE.closedDates.includes(date)) return [];
  const h = SCHEDULE.hours[weekday(date)];
  if (!h) return [];
  const out = [];
  for (let m = toMin(h[0]); m + SCHEDULE.slotMinutes <= toMin(h[1]); m += SCHEDULE.slotMinutes) out.push(toTime(m));
  return out;
}

export function isBookable(date, time) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return false;
  if (!slotsForDate(date).includes(time)) return false;
  const now = nowInClinic();
  if (date < now.date || date < SCHEDULE.opensOn || date > addDays(now.date, SCHEDULE.maxDaysAhead)) return false;
  if (date === now.date && toMin(time) < now.minutes + SCHEDULE.minLeadMinutes) return false;
  return true;
}

export const slotKey = (date, time) => `${date}T${time.replace(':', '-')}`;
// Each service is booked separately, so a massage and Botox can share a time.
export const serviceSlotKey = (date, time, service) => `${slotKey(date, time)}__${service}`;
export function parseSlotKey(key) {
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})/.exec(key);
  return m ? { date: m[1], time: `${m[2]}:${m[3]}` } : null;
}
