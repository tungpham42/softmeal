"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import Icon from "@/components/ui/Icon";
import Alert from "@/components/ui/Alert";
import {
  CONTACT_TOPICS,
  MAX_MESSAGE,
  MIN_MESSAGE,
  validateEmail,
  validateMessage,
  validateName,
  type ContactErrors as Errors,
} from "@/lib/contactValidation";

function FieldError({ id, text }: { id: string; text?: string }) {
  if (!text) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-sm font-medium text-lacquer">
      {text}
    </p>
  );
}

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState<string>(CONTACT_TOPICS[0]);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [website, setWebsite] = useState(""); // honeypot
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setSent(false);

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

    setBusy(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, topic, message, website }),
      });
      const data: { ok?: boolean; errors?: Errors } = await res
        .json()
        .catch(() => ({}));

      if (res.ok && data.ok) {
        setSent(true);
        setErrors({});
        setName("");
        setEmail("");
        setMessage("");
        setTopic(CONTACT_TOPICS[0]);
        return;
      }
      setErrors(
        data.errors ?? {
          form: "Không gửi được lời nhắn. Vui lòng thử lại sau.",
        },
      );
    } catch {
      setErrors({
        form: "Không thể kết nối tới máy chủ. Vui lòng kiểm tra mạng và thử lại.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Honeypot: hidden from people, bots tend to fill it */}
      <div
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
      >
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>
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
        <select
          id="contact-topic"
          className="form-input"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        >
          {CONTACT_TOPICS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
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
      {sent && (
        <Alert tone="success">
          Cảm ơn bạn! Lời nhắn đã được gửi thành công. Chúng tôi sẽ phản hồi qua
          email sớm nhất có thể.
        </Alert>
      )}

      <button
        type="submit"
        disabled={busy}
        className="btn-primary w-full sm:w-auto"
      >
        <Icon name="send" size={17} /> {busy ? "Đang gửi..." : "Gửi lời nhắn"}
      </button>
    </form>
  );
}
