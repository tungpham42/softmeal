import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import {
  CONTACT_TOPICS,
  validateEmail,
  validateMessage,
  validateName,
  type ContactErrors,
} from "@/lib/contactValidation";
import { SITE_NAME } from "@/lib/seo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ---------- config (server-only env, never NEXT_PUBLIC_) ---------- */
function getConfig() {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure =
    process.env.SMTP_SECURE !== undefined
      ? process.env.SMTP_SECURE === "true"
      : port === 465;
  const from = process.env.SMTP_FROM?.trim() || user;
  const to =
    process.env.CONTACT_TO_EMAIL?.trim() ||
    process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() ||
    process.env.NEXT_PUBLIC_ADMIN_EMAIL?.trim();

  if (!host || !user || !pass || !from || !to) return null;
  return { host, port, secure, user, pass, from, to };
}

/* ---------- tiny in-memory rate limit (per server instance) ---------- */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function rateLimited(key: string) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
    }
  }
  return false;
}

/* ---------- helpers ---------- */
const oneLine = (s: string) => s.replace(/[\r\n\t]+/g, " ").trim();
const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function smtpHint(e: {
  code?: string;
  responseCode?: number;
  message?: string;
}) {
  const msg = e.message ?? "";
  if (e.code === "EAUTH" || e.responseCode === 535)
    return "Sai SMTP_USER/SMTP_PASS (Gmail cần App Password, không dùng mật khẩu thường).";
  if (/wrong version number|ssl3_get_record|packet length/i.test(msg))
    return "Sai SMTP_SECURE: port 587 dùng SMTP_SECURE=false, port 465 dùng true.";
  if (
    e.code === "ETIMEDOUT" ||
    e.code === "ECONNECTION" ||
    e.code === "ESOCKET"
  )
    return "Không kết nối được tới SMTP_HOST:SMTP_PORT (sai host/port hoặc nhà cung cấp hosting chặn cổng SMTP).";
  if (e.code === "EDNS" || e.code === "ENOTFOUND")
    return "SMTP_HOST không tồn tại, kiểm tra lại tên máy chủ.";
  if (e.code === "EENVELOPE" || (e.responseCode && e.responseCode >= 550))
    return "SMTP_FROM / CONTACT_TO_EMAIL bị từ chối (địa chỉ gửi phải được nhà cung cấp cho phép).";
  return "Xem chi tiết trong log server.";
}

export async function POST(request: Request) {
  // Reject oversized bodies early
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 20_000) {
    return json(
      { ok: false, errors: { form: "Dữ liệu gửi lên quá lớn." } },
      413,
    );
  }

  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return json({ ok: false, errors: { form: "Dữ liệu không hợp lệ." } }, 400);
  }

  // Honeypot: real users never fill this hidden field. Pretend success.
  if (typeof data.website === "string" && data.website.trim() !== "") {
    return json({ ok: true });
  }

  const name = typeof data.name === "string" ? data.name : "";
  const email = typeof data.email === "string" ? data.email : "";
  const message = typeof data.message === "string" ? data.message : "";
  const topicRaw = typeof data.topic === "string" ? data.topic : "";
  const topic = (CONTACT_TOPICS as readonly string[]).includes(topicRaw)
    ? topicRaw
    : "Khác";

  const errors: ContactErrors = {
    name: validateName(name) || undefined,
    email: validateEmail(email) || undefined,
    message: validateMessage(message) || undefined,
  };
  if (errors.name || errors.email || errors.message) {
    return json({ ok: false, errors }, 400);
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  if (rateLimited(ip)) {
    return json(
      {
        ok: false,
        errors: {
          form: "Bạn đã gửi quá nhiều lời nhắn trong thời gian ngắn. Vui lòng thử lại sau ít phút.",
        },
      },
      429,
    );
  }

  const config = getConfig();
  if (!config) {
    console.error(
      "[contact] SMTP is not configured (SMTP_HOST, SMTP_USER, SMTP_PASS, CONTACT_TO_EMAIL).",
    );
    return json(
      {
        ok: false,
        errors: {
          form: "Hệ thống gửi thư chưa sẵn sàng. Vui lòng thử lại sau.",
        },
      },
      503,
    );
  }

  const cleanName = oneLine(name);
  const cleanEmail = email.trim();
  const cleanMessage = message.trim();

  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: { user: config.user, pass: config.pass },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });

    await transporter.sendMail({
      // Send from your own authenticated mailbox; reply goes to the visitor.
      from: { name: SITE_NAME, address: config.from },
      to: config.to,
      replyTo: { name: cleanName.replace(/["<>]/g, ""), address: cleanEmail },
      subject: `[${SITE_NAME}] ${topic} — ${cleanName}`,
      text: [
        cleanMessage,
        "",
        "—",
        `Họ tên: ${cleanName}`,
        `Email: ${cleanEmail}`,
        `Chủ đề: ${topic}`,
        `IP: ${ip}`,
      ].join("\n"),
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#3d2a1f">
          <h2 style="color:#9d2f20;margin:0 0 12px">Lời nhắn mới từ ${escapeHtml(SITE_NAME)}</h2>
          <table style="border-collapse:collapse;margin-bottom:16px">
            <tr><td style="padding:2px 12px 2px 0;color:#7c685d">Họ tên</td><td><b>${escapeHtml(cleanName)}</b></td></tr>
            <tr><td style="padding:2px 12px 2px 0;color:#7c685d">Email</td><td><a href="mailto:${escapeHtml(cleanEmail)}">${escapeHtml(cleanEmail)}</a></td></tr>
            <tr><td style="padding:2px 12px 2px 0;color:#7c685d">Chủ đề</td><td>${escapeHtml(topic)}</td></tr>
          </table>
          <div style="white-space:pre-wrap;border-left:3px solid #dca63a;padding-left:12px">${escapeHtml(cleanMessage)}</div>
        </div>`,
    });

    return json({ ok: true });
  } catch (error) {
    const e = error as {
      code?: string;
      command?: string;
      responseCode?: number;
      response?: string;
      message?: string;
    };
    // Full details go to the server log only (never to visitors).
    console.error("[contact] Failed to send mail", {
      code: e.code,
      command: e.command,
      responseCode: e.responseCode,
      response: e.response,
      message: e.message,
      smtp: `${config.host}:${config.port} secure=${config.secure} user=${config.user} from=${config.from}`,
      hint: smtpHint(e),
    });
    return json(
      {
        ok: false,
        errors: {
          form: "Không gửi được lời nhắn do lỗi hệ thống. Vui lòng thử lại sau.",
        },
        // Only exposed outside production, to help while setting up.
        ...(process.env.NODE_ENV !== "production"
          ? { debug: `${e.code ?? "ERR"}: ${e.message ?? ""} — ${smtpHint(e)}` }
          : {}),
      },
      502,
    );
  }
}
