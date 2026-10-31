// Help chat: Claude answers questions and can check availability and book.
// The key comes from the ANTHROPIC_API_KEY environment variable, never from code.
import Anthropic from '@anthropic-ai/sdk';
import { allow, send, readJson, httpError } from './_lib/http.js';
import { MODEL, SYSTEM_PROMPT, TOOLS } from './_lib/assistant.js';
import { SCHEDULE, nowInClinic, addDays, slotsForDate, isBookable } from './_lib/schedule.js';
import { takenSlots, isTaken, createChatBooking } from './_lib/records.js';

const SITE = 'https://www.oxyluxsolutions.com';
const FALLBACK = 'I can’t complete that right now. Please call us at (305) 205-2738 and we’ll help you.';
const hits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 600_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 30;
}

function cleanMessages(raw) {
  if (!Array.isArray(raw) || !raw.length) throw httpError(400, 'Message is required.');
  const out = raw.slice(-24).filter((m) => (m?.role === 'user' || m?.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .map((m) => ({ role: m.role, content: m.content.slice(0, 1500) }));
  while (out.length && out[0].role !== 'user') out.shift();
  if (!out.length || out[out.length - 1].role !== 'user') throw httpError(400, 'Message is required.');
  return out;
}

async function runTool(block) {
  const i = block.input || {};
  if (block.name === 'check_availability') {
    const today = nowInClinic().date;
    const earliest = today > SCHEDULE.opensOn ? today : SCHEDULE.opensOn;
    const from = /^\d{4}-\d{2}-\d{2}$/.test(i.from_date) && i.from_date > earliest ? i.from_date : earliest;
    const taken = await takenSlots();
    const days = [];
    for (let d = 0; d < 14; d++) {
      const date = addDays(from, d);
      const times = slotsForDate(date).filter((t) => isBookable(date, t) && !isTaken(taken, date, t, i.service));
      if (times.length) days.push({ date, times });
    }
    return { service: i.service, timeZone: SCHEDULE.timeZone, days };
  }
  if (block.name === 'book_appointment') {
    const r = await createChatBooking(i);
    return { booked: true, service: r.serviceName, date: r.slot.date, time: r.slot.time, consent_link: `${SITE}/consent.html?service=${r.service}&booking=${r.id}` };
  }
  throw new Error('Unknown tool');
}

export default async function handler(req, res) {
  if (!allow(req, res, ['POST'])) return;
  if (!process.env.ANTHROPIC_API_KEY) return send(res, 503, { error: 'Chat is not available right now.' });
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
  if (rateLimited(ip)) return send(res, 429, { error: 'Too many messages. Please call us at (305) 205-2738.' });
  try {
    const body = await readJson(req, 40_000);
    if (body.website) return send(res, 200, { reply: '' }); // honeypot
    const messages = cleanMessages(body.messages);
    const client = new Anthropic({ timeout: 50_000, maxRetries: 1 });
    const system = [
      { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
      { type: 'text', text: `Today in Hialeah is ${nowInClinic().date}.` },
    ];
    let booked = false;
    for (let turn = 0; turn < 6; turn++) {
      const r = await client.beta.messages.create({
        model: MODEL,
        max_tokens: 8000,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: { effort: 'low' },
        system,
        tools: TOOLS,
        messages,
      });
      if (r.stop_reason === 'tool_use') {
        messages.push({ role: 'assistant', content: r.content }); // keep every block, including thinking
        const results = [];
        for (const b of r.content.filter((x) => x.type === 'tool_use')) {
          try {
            const out = await runTool(b);
            if (out.booked) booked = true;
            results.push({ type: 'tool_result', tool_use_id: b.id, content: JSON.stringify(out) });
          } catch (e) {
            if (!e.status || e.status >= 500) console.error(e);
            results.push({ type: 'tool_result', tool_use_id: b.id, is_error: true, content: e.status && e.status < 500 ? e.message : 'Booking system error.' });
          }
        }
        messages.push({ role: 'user', content: results });
        continue;
      }
      if (r.stop_reason === 'refusal') return send(res, 200, { reply: FALLBACK, booked });
      const reply = r.content.filter((x) => x.type === 'text').map((x) => x.text).join('\n').trim();
      return send(res, 200, { reply: reply || FALLBACK, booked });
    }
    send(res, 200, { reply: FALLBACK, booked });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return send(res, 200, { reply: 'We’re a little busy right now. Please try again in a minute or call (305) 205-2738.' });
    if (e.status === 400 && !(e instanceof Anthropic.APIError)) return send(res, 400, { error: e.message });
    console.error(e);
    send(res, 200, { reply: FALLBACK });
  }
}
