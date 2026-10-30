import { randomBytes } from 'node:crypto';
import { storage, ExistsError } from './storage.js';
import { slotKey, serviceSlotKey, isBookable } from './schedule.js';
import { httpError } from './http.js';
import { SERVICES } from './services.js';

const NONE = /^none/i;
const clean = (v, max = 2000) => String(v ?? '').trim().slice(0, max);

export async function takenSlots() {
  const files = await storage().list('slots/');
  return new Set(files.map((f) => f.slice('slots/'.length)));
}

// Bookings made before services existed have no suffix and were all HBOT.
export function isTaken(taken, date, time, service) {
  return taken.has(serviceSlotKey(date, time, service)) || (service === 'hbot' && taken.has(slotKey(date, time)));
}

async function findPath(id) {
  if (!/^[a-z0-9]{8,16}$/.test(id)) return null;
  const files = await storage().list('bookings/');
  return files.find((f) => f.endsWith(`__${id}.json`)) || null;
}

export async function getRecord(id) {
  const p = await findPath(id);
  if (!p) return null;
  const buf = await storage().read(p);
  return buf ? { path: p, record: JSON.parse(buf.toString('utf8')) } : null;
}

export async function listRecords() {
  const files = await storage().list('bookings/');
  const out = await Promise.all(files.filter((f) => f.endsWith('.json')).map(async (f) => {
    const b = await storage().read(f);
    return b ? JSON.parse(b.toString('utf8')) : null;
  }));
  return out.filter(Boolean);
}

export async function createRecord({ slot, service, screening, form, pdfBase64, meta }) {
  const s = storage();
  const f = form || {};
  if (!SERVICES[service]) throw httpError(400, 'Please choose a service.');
  if (!clean(f.name) || !clean(f.phone) || !clean(f.email)) throw httpError(400, 'Name, phone and email are required.');
  const pdf = Buffer.from(String(pdfBase64 || '').replace(/^data:application\/pdf;[^,]*,/, ''), 'base64');
  if (pdf.length < 1000 || pdf.subarray(0, 4).toString() !== '%PDF') throw httpError(400, 'The signed consent form is missing. Please sign and submit again.');
  if (pdf.length > 3_500_000) throw httpError(413, 'The signed form is too large. Please try again.');

  const id = randomBytes(6).toString('hex');
  const now = new Date().toISOString();
  let key = null;
  if (slot) {
    if (!isBookable(slot.date, slot.time)) throw httpError(400, 'That time is no longer available. Please choose another.');
    key = serviceSlotKey(slot.date, slot.time, service);
    const taken = await takenSlots();
    if (isTaken(taken, slot.date, slot.time, service)) throw httpError(409, 'Someone just booked that time. Please choose another.');
    try { await s.create(`slots/${key}`, id, 'text/plain'); }
    catch (e) { if (e instanceof ExistsError) throw httpError(409, 'Someone just booked that time. Please choose another.'); throw e; }
  }

  const contra = (f.contra || []).filter((c) => !NONE.test(c));
  const record = {
    id,
    type: slot ? 'booking' : 'consent',
    status: slot ? 'confirmed' : 'received',
    createdAt: now,
    service,
    serviceName: SERVICES[service],
    slot: slot ? { date: slot.date, time: slot.time } : null,
    patient: { name: clean(f.name, 200), email: clean(f.email, 200), phone: clean(f.phone, 50), dob: clean(f.dob, 20) },
    flags: [...contra, ...(f.rx || []).filter((c) => !NONE.test(c)), ...(f.dx || []).filter((c) => !NONE.test(c))],
    screening: (Array.isArray(screening) ? screening : []).slice(0, 6).map((g) => ({ title: clean(g?.title, 300), selected: (g?.selected || []).map((x) => clean(x, 200)) })),
    form: Object.fromEntries(Object.entries(f).map(([k, v]) => [k, Array.isArray(v) ? v.map((x) => clean(x, 200)) : clean(v)])),
    pdf: `consents/${(slot?.date || now.slice(0, 10))}_${clean(f.name, 80).replace(/[^A-Za-z -]/g, '').trim().replace(/\s+/g, '-') || 'Client'}_${service}_${id}.pdf`,
    history: [{ at: now, action: slot ? 'booked' : 'consent submitted' }],
    meta: { userAgent: clean(meta?.userAgent, 300) },
  };
  const file = `bookings/${key || 'consent-' + now.slice(0, 10)}__${id}.json`;
  try {
    await s.write(record.pdf, pdf, 'application/pdf');
    await s.write(file, JSON.stringify(record, null, 2), 'application/json');
  } catch (e) {
    if (key) await s.remove(`slots/${key}`).catch(() => {});
    throw e;
  }
  return record;
}

export async function updateRecord(id, action, by) {
  const found = await getRecord(id);
  if (!found) throw httpError(404, 'Appointment not found.');
  const { path, record } = found;
  const map = { cancel: 'cancelled', complete: 'completed', confirm: 'confirmed', noshow: 'no-show' };
  if (!map[action]) throw httpError(400, 'Unknown action.');
  if (record.slot) {
    // Records from before services existed use the plain slot key.
    const key = `slots/${record.service ? serviceSlotKey(record.slot.date, record.slot.time, record.service) : slotKey(record.slot.date, record.slot.time)}`;
    if (action === 'cancel') await storage().remove(key);
    if (action === 'confirm' && record.status === 'cancelled') {
      try { await storage().create(key, id, 'text/plain'); }
      catch (e) { if (e instanceof ExistsError) throw httpError(409, 'That time has been booked by someone else since it was cancelled.'); throw e; }
    }
  }
  record.status = map[action];
  record.history.push({ at: new Date().toISOString(), action: record.status, by });
  await storage().write(path, JSON.stringify(record, null, 2), 'application/json');
  return record;
}
