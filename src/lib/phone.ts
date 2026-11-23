/**
 * Normalise a Nigerian mobile/WhatsApp number to E.164 (+234XXXXXXXXXX).
 * Accepts formats like: 0803 123 4567, 8031234567, 2348031234567, +2348031234567.
 */
export function normalizeNigerianPhone(raw: string): string | null {
  const cleaned = raw.replace(/[\s\-().]/g, "");

  let digits = cleaned;
  if (digits.startsWith("+")) {
    digits = digits.slice(1);
  }

  if (digits.startsWith("0") && digits.length === 11) {
    digits = "234" + digits.slice(1);
  } else if (digits.length === 10 && /^[789][01]\d{8}$/.test(digits)) {
    digits = "234" + digits;
  }

  if (!/^234[789][01]\d{8}$/.test(digits)) {
    return null;
  }

  return `+${digits}`;
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
