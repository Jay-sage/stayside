"use client";

import { useState } from "react";
import { buildWhatsAppUrl } from "@/lib/phone";
import { CheckCircleIcon } from "@/components/Icons";

const TOPICS = [
  "Guest Support",
  "Partner My Hotel",
  "Payment / Refund",
  "General Inquiry",
] as const;

export function ContactFormClient() {
  const [topic, setTopic] = useState<string>(TOPICS[0]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  const waUrl = buildWhatsAppUrl(
    "+2348000000001",
    [
      `Hello Stayside Team (${topic}),`,
      name ? `• Name: ${name}` : null,
      email ? `• Email: ${email}` : null,
      phone ? `• Phone: ${phone}` : null,
      message ? `• Message: ${message}` : null,
    ]
      .filter(Boolean)
      .join("\n")
  );

  if (submitted) {
    return (
      <div className="rounded-[28px] bg-white p-8 text-center shadow-[0_12px_40px_rgba(23,36,58,0.08)]">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-night-bg text-brand-primary">
          <CheckCircleIcon className="h-6 w-6" />
        </span>
        <h2 className="mt-4 font-jakarta text-xl font-bold text-brand-ink">
          Message Ready!
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-brand-muted">
          Thanks, <strong>{name || "there"}</strong>. For the fastest response in Lagos, tap below to send this directly to our WhatsApp desk—or we&apos;ll reply to <strong>{email}</strong>.
        </p>
        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-brand-primary px-6 py-3 text-xs font-bold text-white transition hover:bg-brand-primary-hover"
          >
            Send on WhatsApp →
          </a>
          <button
            type="button"
            onClick={() => {
              setSubmitted(false);
              setMessage("");
            }}
            className="cursor-pointer rounded-full border border-brand-border px-5 py-3 text-xs font-semibold text-brand-ink hover:bg-brand-bg"
          >
            Send Another Message
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-[28px] bg-white p-6 shadow-[0_12px_40px_rgba(23,36,58,0.08)] sm:p-8"
    >
      <div>
        <h2 className="font-jakarta text-lg font-bold text-brand-ink">
          Send us a message
        </h2>
        <p className="mt-0.5 text-xs text-brand-muted">
          Pick a topic and tell us how we can help.
        </p>
      </div>

      {/* Topic Pills */}
      <div className="flex flex-wrap gap-2">
        {TOPICS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTopic(item)}
            className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              topic === item
                ? "bg-brand-primary text-white"
                : "bg-brand-bg text-brand-muted hover:text-brand-ink"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2">
        <div>
          <label htmlFor="c-name" className="mb-1 block text-xs font-semibold text-brand-ink">
            Full Name
          </label>
          <input
            id="c-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Tobi Adesina"
            className="w-full rounded-full bg-brand-bg px-4 py-3 text-sm text-brand-ink outline-none focus:ring-2 focus:ring-brand-primary/30"
          />
        </div>
        <div>
          <label htmlFor="c-email" className="mb-1 block text-xs font-semibold text-brand-ink">
            Email Address
          </label>
          <input
            id="c-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-full bg-brand-bg px-4 py-3 text-sm text-brand-ink outline-none focus:ring-2 focus:ring-brand-primary/30"
          />
        </div>
      </div>

      <div>
        <label htmlFor="c-phone" className="mb-1 block text-xs font-semibold text-brand-ink">
          WhatsApp Number <span className="font-normal text-brand-muted">(optional)</span>
        </label>
        <input
          id="c-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="0803 123 4567"
          className="w-full rounded-full bg-brand-bg px-4 py-3 text-sm text-brand-ink outline-none focus:ring-2 focus:ring-brand-primary/30"
        />
      </div>

      <div>
        <label htmlFor="c-msg" className="mb-1 block text-xs font-semibold text-brand-ink">
          Message
        </label>
        <textarea
          id="c-msg"
          rows={4}
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us about your stay or your hotel in Lagos..."
          className="w-full resize-none rounded-2xl bg-brand-bg px-4 py-3 text-sm text-brand-ink outline-none focus:ring-2 focus:ring-brand-primary/30"
        />
      </div>

      <button
        type="submit"
        className="w-full cursor-pointer rounded-full bg-brand-ink py-3.5 text-sm font-bold text-white transition hover:bg-brand-primary"
      >
        Send Message
      </button>
    </form>
  );
}
