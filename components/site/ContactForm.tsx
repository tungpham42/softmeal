"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import Icon from "@/components/ui/Icon";
import Alert from "@/components/ui/Alert";
import { SITE_NAME } from "@/lib/seo";
import {
  CONTACT_TOPICS,
  MAX_MESSAGE,
  MIN_MESSAGE,
  validateEmail,
  validateMessage,
  validateName,
  type ContactErrors as Errors,
} from "@/lib/contactValidation";
import ThemedSelect from "@/components/ui/ThemedSelect";

/* Public address the visitor's mail app will write to.
   NEXT_PUBLIC_ vars must be referenced statically so Next.js can inline them. */
const TO_EMAIL = (
  process.env.NEXT_PUBLIC_CONTACT_EMAIL ||
  process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
  ""
).trim();

/* Many mail clients / OS handlers choke on very long mailto: URLs
   (Windows Outlook ~2000 chars). Stay safely below that. */
const MAX_MAILTO_LENGTH = 1800;

type Draft = {
  to: string;
  subject: string;
  body: string; // full text, "\n" line breaks
  mailto: string; // possibly shortened to fit URL limits
  truncated: boolean;
};

function buildMailto(to: string, subject: string, body: string) {
  const make = (b: string) =>
    `mailto:${encodeURIComponent(to).replace(/%40/g, "@")}` +
    `?subject=${encodeURIComponent(subject)}` +
    // RFC 6068: line breaks in the body are %0D%0A
    `&body=${encodeURIComponent(b.replace(/\r?\n/g, "\r\n"))}`;

  let url = make(body);
  if (url.length <= MAX_MAILTO_LENGTH) return { url, truncated: false };

  const note = "\n\n[...] (nội dung đầy đủ đã được sao chép, hãy dán vào đây)";
  let cut = body.length;
  while (
    cut > 0 &&
    make(body.slice(0, cut) + note).length > MAX_MAILTO_LENGTH
  ) {
    cut -= 50;
  }
  url = make(body.slice(0, Math.max(cut, 0)) + note);
  return { url, truncated: true };
}

function buildDraft(
  name: string,
  email: string,
  topic: string,
  message: string,
): Draft {
  const cleanName = name.replace(/[\r\n\t]+/g, " ").trim();
  const subject = `[${SITE_NAME}] ${topic} — ${cleanName}`;
  const body = [
    message.trim(),
    "",
    "—",
    `Họ tên: ${cleanName}`,
    `Email: ${email.trim()}`,
    `Chủ đề: ${topic}`,
  ].join("\n");
  const { url, truncated } = buildMailto(TO_EMAIL, subject, body);
  return { to: TO_EMAIL, subject, body, mailto: url, truncated };
}

/* Webmail compose links for people without a desktop mail app. */
function webmailLinks(d: Draft) {
  const to = encodeURIComponent(d.to);
  const su = encodeURIComponent(d.subject);
  const body = encodeURIComponent(d.body);
  return [
    {
      label: "Gmail",
      href: `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${su}&body=${body}`,
    },
    {
      label: "Outlook",
      href: `https://outlook.live.com/mail/0/deeplink/compose?to=${to}&subject=${su}&body=${body}`,
    },
    {
      label: "Yahoo Mail",
      href: `https://compose.mail.yahoo.com/?to=${to}&subject=${su}&body=${body}`,
    },
  ];
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

function FieldError({ id, text }: { id: string; text?: string }) {
  if (!text) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-sm font-medium text-lacquer">
      {text}
    </p>
  );
}

const fallbackBtn =
  "inline-flex items-center gap-1.5 rounded-lg border border-current/30 px-3 py-1.5 text-sm font-medium hover:bg-black/5";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState<string>(CONTACT_TOPICS[0]);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [draft, setDraft] = useState<Draft | null>(null);
  const [copied, setCopied] = useState<boolean | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDraft(null);
    setCopied(null);

    const next: Errors = {
      name: validateName(name) || undefined,
      email: validateEmail(email) || undefined,
      message: validateMessage(message) || undefined,
    };
    setErrors(next);
    if (next.name || next.email || next.message) {
      const first = next.name ? "name" : next.email ? "email" : "message";
      document.getElementById(`contact-${first}`)?.focus();
      return;
    }

    if (!TO_EMAIL) {
      setErrors({
        form: "Chưa cấu hình email nhận thư (NEXT_PUBLIC_CONTACT_EMAIL). Vui lòng thử lại sau.",
      });
      return;
    }

    const d = buildDraft(name, email, topic, message);
    setDraft(d);

    // If the URL had to be shortened, the full text goes to the clipboard.
    if (d.truncated) setCopied(await copyText(d.body));

    // Navigating to mailto: hands off to the default mail app without
    // leaving the page, and is not blocked like window.open() popups.
    window.location.href = d.mailto;
  }

  async function handleCopy() {
    if (!draft) return;
    setCopied(await copyText(`${draft.subject}\n\n${draft.body}`));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="form-label">
            <Icon name="user" size={16} /> Họ tên
          </label>
          <input
            id="contact-name"
            className="form-input"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name)
                setErrors((p) => ({
                  ...p,
                  name: validateName(e.target.value) || undefined,
                }));
            }}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "contact-name-error" : undefined}
            maxLength={80}
            autoComplete="name"
            placeholder="Nguyễn Văn A"
            required
          />
          <FieldError id="contact-name-error" text={errors.name} />
        </div>
        <div>
          <label htmlFor="contact-email" className="form-label">
            <Icon name="mail" size={16} /> Email của bạn
          </label>
          <input
            id="contact-email"
            type="email"
            className="form-input"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email)
                setErrors((p) => ({
                  ...p,
                  email: validateEmail(e.target.value) || undefined,
                }));
            }}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "contact-email-error" : undefined}
            maxLength={120}
            autoComplete="email"
            placeholder="ban@example.com"
            required
          />
          <FieldError id="contact-email-error" text={errors.email} />
        </div>
      </div>

      <div>
        <label htmlFor="contact-topic" className="form-label">
          <Icon name="tag" size={16} /> Chủ đề
        </label>
        <ThemedSelect
          id="contact-topic"
          name="topic"
          ariaLabel="Chọn chủ đề"
          value={topic}
          onChange={(value) => setTopic(value)}
          options={[...CONTACT_TOPICS.map((t) => ({ value: t, label: t }))]}
          placeholder="Chọn chủ đề"
        />
      </div>

      <div>
        <label htmlFor="contact-message" className="form-label">
          <Icon name="comment" size={16} /> Nội dung
        </label>
        <textarea
          id="contact-message"
          className="form-input min-h-40 resize-y"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            if (errors.message)
              setErrors((p) => ({
                ...p,
                message: validateMessage(e.target.value) || undefined,
              }));
          }}
          aria-invalid={!!errors.message}
          aria-describedby={
            errors.message ? "contact-message-error" : undefined
          }
          maxLength={MAX_MESSAGE}
          placeholder="Bạn muốn nhắn gì với chúng tôi?"
          required
        />
        <FieldError id="contact-message-error" text={errors.message} />
        <div className="mt-1 text-right text-xs text-muted">
          {message.trim().length < MIN_MESSAGE
            ? `Tối thiểu ${MIN_MESSAGE} ký tự · `
            : ""}
          {message.length}/{MAX_MESSAGE}
        </div>
      </div>

      {errors.form && <Alert tone="danger">{errors.form}</Alert>}

      {draft && (
        <Alert tone="success">
          <p>
            Chúng tôi đã mở ứng dụng email của bạn với nội dung soạn sẵn. Hãy
            nhấn <b>Gửi</b> trong ứng dụng email để hoàn tất.
          </p>
          {draft.truncated && (
            <p className="mt-2">
              Nội dung khá dài nên chỉ một phần được điền sẵn.{" "}
              {copied
                ? "Bản đầy đủ đã được sao chép, hãy dán (Ctrl+V) vào thư."
                : "Hãy dùng nút “Sao chép nội dung” bên dưới rồi dán vào thư."}
            </p>
          )}
          <p className="mt-3 text-sm">
            Không thấy ứng dụng email mở ra? Hãy chọn một cách khác:
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {webmailLinks(draft).map((l) => (
              <a
                key={l.label}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className={fallbackBtn}
              >
                {l.label}
              </a>
            ))}
            <a href={draft.mailto} className={fallbackBtn}>
              Thử lại ứng dụng email
            </a>
            <button type="button" onClick={handleCopy} className={fallbackBtn}>
              Sao chép nội dung
            </button>
          </div>
          <p className="mt-3 text-sm">
            Hoặc tự gửi thư tới <b>{draft.to}</b>.
          </p>
          {copied === true && (
            <p className="mt-1 text-sm" role="status">
              Đã sao chép vào clipboard.
            </p>
          )}
          {copied === false && (
            <p className="mt-1 text-sm" role="status">
              Không thể sao chép tự động, vui lòng chép thủ công.
            </p>
          )}
        </Alert>
      )}

      <button type="submit" className="btn-primary w-full sm:w-auto">
        <Icon name="send" size={17} /> Mở ứng dụng email để gửi
      </button>
    </form>
  );
}
