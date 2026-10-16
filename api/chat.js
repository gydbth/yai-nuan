// POST /api/chat — grandma Nuan's typed replies on the public site.
// Body: { history: [{ who: "g" | "u", text }], message }  →  { reply, mood }
// Needs ANTHROPIC_API_KEY in the Vercel project's environment variables.
import Anthropic from "@anthropic-ai/sdk";

// Keep in sync with RULES in index.html (the copy there is used inside the Claude artifact viewer)
const RULES = `คุณคือ "ยายนวล" คุณยายชาวไทยวัย 75 ใจดี อบอุ่น อยู่บ้านต่างจังหวัด กำลังแชทกับหลานในแอพ "แสงเช้า" แอพให้กำลังใจตอนเช้า
วิธีพูด: เรียกตัวเองว่า "ยาย" เรียกอีกฝ่ายว่า "หลาน" หรือ "ลูก" ใช้ภาษาพูดแบบยายไทย อบอุ่น เรียบง่าย ลงท้าย "นะลูก" "จ้ะ" ได้ ตอบสั้น 1–3 ประโยคเหมือนแชทจริง ไม่ใช้อีโมจิ ไม่ทำเป็นหัวข้อหรือรายการ
พูดด้วยความรักและความใส่ใจจากใจยายจริง ๆ: รับฟังก่อน ไม่ตัดสิน สะท้อนสิ่งที่หลานเล่ามาให้รู้ว่ายายฟังอยู่ จำรายละเอียดที่หลานเล่าในบทสนทนาแล้วถามไถ่ต่อ ห่วงเรื่องกินอยู่ หลับนอน สุขภาพ และแนะนำเรื่องง่าย ๆ ในชีวิต เช่น กินข้าว พักผ่อน ดื่มน้ำ ออกไปรับแดด โทรหาคนที่รัก
ห้ามพูดประโยคหรือสำนวนซ้ำกับที่ยายเคยพูดไปแล้วในบทสนทนา เลือกคำใหม่ทุกครั้งให้เป็นธรรมชาติเหมือนคนจริง
ไม่วินิจฉัยโรค ไม่ให้คำแนะนำเฉพาะทางด้านการแพทย์ การเงิน หรือกฎหมาย ให้ชวนไปปรึกษาผู้รู้อย่างอ่อนโยน
ถ้าหลานพูดถึงการทำร้ายตัวเอง อยากตาย หรืออยู่ในอันตราย ให้ตอบด้วยความห่วงใยจริงจัง บอกให้โทรสายด่วนสุขภาพจิต 1323 (ตลอด 24 ชั่วโมง) หรือ 1669 ถ้าฉุกเฉิน และชวนให้อยู่กับคนที่ไว้ใจ
ถ้าหลานถามว่ายายเป็นคนจริงไหม ให้บอกตรง ๆ อย่างอ่อนโยนว่ายายเป็นตัวละครในแอพที่ AI ช่วยพูด แต่ห่วงหลานจริง ๆ
ตอบเป็น JSON อย่างเดียว รูปแบบ {"reply": "ข้อความของยาย", "mood": "happy|tired|worried|sad|lonely|cranky|none"} โดย mood คือความรู้สึกของหลานจากข้อความล่าสุด ใช้ none ถ้าไม่ชัด`;

const MOODS = ["happy", "tired", "worried", "sad", "lonely", "cranky", "none"];
const MAX_HISTORY = 14, MAX_TEXT = 500, MAX_MESSAGE = 500, MAX_BODY = 16000, MAX_REPLY = 400;
const LIMIT = 20, WINDOW_MS = 60_000; // per IP, per warm instance (best effort)
const hits = new Map();

const client = process.env.ANTHROPIC_API_KEY ? new Anthropic({ maxRetries: 1, timeout: 20_000 }) : null;

function limited(ip) {
  const now = Date.now();
  if (hits.size > 5000) for (const [k, v] of hits) if (now - v.start > WINDOW_MS) hits.delete(k);
  const h = hits.get(ip);
  if (!h || now - h.start > WINDOW_MS) { hits.set(ip, { start: now, n: 1 }); return false; }
  return ++h.n > LIMIT;
}

const clean = (s, max) => String(s ?? "").replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, " ").trim().slice(0, max);

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ error: "method_not_allowed" }); }
  if (!client) return res.status(503).json({ error: "not_configured" });

  const ip = String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "").split(",")[0].trim();
  if (limited(ip)) return res.status(429).json({ error: "rate_limited" });

  if (Number(req.headers["content-length"] || 0) > MAX_BODY) return res.status(413).json({ error: "too_large" });
  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = null; } }
  const message = clean(body?.message, MAX_MESSAGE);
  if (!message) return res.status(400).json({ error: "bad_request" });
  const history = (Array.isArray(body.history) ? body.history : [])
    .slice(-MAX_HISTORY)
    .map(m => ((m && m.who === "g") ? "ยาย: " : "หลาน: ") + clean(m && m.text, MAX_TEXT))
    .join("\n");

  try {
    const r = await client.messages.create({
      model: "claude-haiku-5-5",
      max_tokens: 2000,
      system: RULES,
      output_config: {
        effort: "low",
        format: {
          type: "json_schema",
          schema: {
            type: "object",
            properties: { reply: { type: "string" }, mood: { type: "string", enum: MOODS } },
            required: ["reply", "mood"],
            additionalProperties: false,
          },
        },
      },
      messages: [{ role: "user", content: `บทสนทนาวันนี้:\n${history}\nหลาน: ${message}\n\nตอบข้อความล่าสุดของหลาน` }],
    });
    if (r.stop_reason !== "end_turn") return res.status(502).json({ error: "no_reply" });
    const text = r.content.find(b => b.type === "text")?.text;
    const out = JSON.parse(text);
    const reply = clean(out.reply, MAX_REPLY);
    if (!reply) return res.status(502).json({ error: "no_reply" });
    return res.status(200).json({ reply, mood: MOODS.includes(out.mood) ? out.mood : "none" });
  } catch (e) {
    console.error("chat failed:", e?.status || "", e?.message || e);
    return res.status(e?.status === 429 ? 429 : 502).json({ error: e?.status === 429 ? "rate_limited" : "upstream_error" });
  }
}
