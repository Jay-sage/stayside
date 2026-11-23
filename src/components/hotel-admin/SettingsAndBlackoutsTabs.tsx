"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  addBlackoutDateAction,
  deleteBlackoutDateAction,
  updateDayStaySettingsAction,
  updateHotelProfileAction,
  updateHotelSiteContentAction,
} from "@/app/actions/hotel-admin";
import { PhotoUploader } from "@/components/hotel-admin/PhotoUploader";
import { AMENITY_CATALOG } from "@/lib/amenities";
import type { Hotel, RoomType } from "@/types/database";

export interface BlackoutDateRow {
  id: string;
  room_type_id: string | null;
  date: string;
  applies_to: "day" | "night" | "both";
  reason: string | null;
}

export function DayStaySettingsTab({ hotel }: { hotel: Hotel }) {
  const router = useRouter();
  const [dayStart, setDayStart] = useState(hotel.day_start.slice(0, 5));
  const [dayEnd, setDayEnd] = useState(hotel.day_end.slice(0, 5));
  const [checkInTime, setCheckInTime] = useState(hotel.check_in_time.slice(0, 5));
  const [checkOutTime, setCheckOutTime] = useState(hotel.check_out_time.slice(0, 5));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    const res = await updateDayStaySettingsAction({
      hotelId: hotel.id,
      dayStart,
      dayEnd,
      checkInTime,
      checkOutTime,
    });
    setSaving(false);

    if (!res.ok) {
      setMessage({ ok: false, text: res.error ?? "Failed to update settings." });
      return;
    }
    setMessage({
      ok: true,
      text: "Day-stay window and check-in hours updated on the live guest site.",
    });
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-xl space-y-5 rounded-2xl bg-white p-6 shadow-[0_2px_20px_rgba(23,36,58,0.05)]"
    >
      <div>
        <h2 className="text-base font-bold text-brand-ink">Day-Stay &amp; Check-in Hours</h2>
        <p className="mt-0.5 text-xs text-brand-muted">
          Guests see this fixed daytime window and cannot alter the hours. Changes reflect immediately on your public listing.
        </p>
      </div>

      {message && (
        <div
          className={`rounded-xl px-4 py-2.5 text-xs font-medium ${
            message.ok
              ? "bg-night-bg text-brand-primary"
              : "border border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-brand-ink">
            Day-Stay Start
          </label>
          <input
            type="time"
            required
            value={dayStart}
            onChange={(e) => setDayStart(e.target.value)}
            className="w-full rounded-xl border border-brand-border bg-brand-bg/40 px-3.5 py-2.5 text-sm text-brand-ink outline-none focus:border-brand-primary focus:bg-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-brand-ink">
            Day-Stay End
          </label>
          <input
            type="time"
            required
            value={dayEnd}
            onChange={(e) => setDayEnd(e.target.value)}
            className="w-full rounded-xl border border-brand-border bg-brand-bg/40 px-3.5 py-2.5 text-sm text-brand-ink outline-none focus:border-brand-primary focus:bg-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-brand-ink">
            Overnight Check-in Time
          </label>
          <input
            type="time"
            required
            value={checkInTime}
            onChange={(e) => setCheckInTime(e.target.value)}
            className="w-full rounded-xl border border-brand-border bg-brand-bg/40 px-3.5 py-2.5 text-sm text-brand-ink outline-none focus:border-brand-primary focus:bg-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-brand-ink">
            Overnight Check-out Time
          </label>
          <input
            type="time"
            required
            value={checkOutTime}
            onChange={(e) => setCheckOutTime(e.target.value)}
            className="w-full rounded-xl border border-brand-border bg-brand-bg/40 px-3.5 py-2.5 text-sm text-brand-ink outline-none focus:border-brand-primary focus:bg-white"
          />
        </div>
      </div>

      <div className="rounded-xl bg-brand-bg p-3.5 text-xs text-brand-muted">
        <strong>Room turnover rule:</strong> When overnight check-in is after day-stay end, the same physical room can host both a day stay and a night stay on the same date.
      </div>

      <button
        type="submit"
        disabled={saving}
        className="cursor-pointer rounded-full bg-brand-primary px-6 py-2.5 text-xs font-semibold text-white transition hover:bg-brand-primary-hover disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save Hours"}
      </button>
    </form>
  );
}

export function BlackoutDatesTab({
  hotelId,
  rooms,
  blackouts,
}: {
  hotelId: string;
  rooms: RoomType[];
  blackouts: BlackoutDateRow[];
}) {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [roomTypeId, setRoomTypeId] = useState<string>("");
  const [appliesTo, setAppliesTo] = useState<"day" | "night" | "both">("both");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const res = await addBlackoutDateAction({
      hotelId,
      roomTypeId: roomTypeId || null,
      date,
      appliesTo,
      reason,
    });
    setSaving(false);

    if (!res.ok) {
      setError(res.error ?? "Failed to add blackout date.");
      return;
    }

    setDate("");
    setReason("");
    router.refresh();
  }

  async function handleRemove(id: string) {
    setError(null);
    const res = await deleteBlackoutDateAction(hotelId, id);
    if (!res.ok) {
      setError(res.error ?? "Failed to remove blackout date.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <form
        onSubmit={handleAdd}
        className="space-y-4 rounded-2xl bg-white p-6 shadow-[0_2px_20px_rgba(23,36,58,0.05)] lg:col-span-5"
      >
        <div>
          <h2 className="text-base font-bold text-brand-ink">Block a Date</h2>
          <p className="mt-0.5 text-xs text-brand-muted">
            Blocked dates are immediately rejected by the guest booking form.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs font-semibold text-brand-ink">Date</label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-brand-border bg-brand-bg/40 px-3.5 py-2.5 text-sm text-brand-ink outline-none focus:border-brand-primary focus:bg-white"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-brand-ink">
            Scope
          </label>
          <select
            value={roomTypeId}
            onChange={(e) => setRoomTypeId(e.target.value)}
            className="w-full rounded-xl border border-brand-border bg-brand-bg/40 px-3.5 py-2.5 text-sm text-brand-ink outline-none focus:border-brand-primary focus:bg-white"
          >
            <option value="">Whole Hotel</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-brand-ink">
            Applies to
          </label>
          <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-brand-bg p-1 text-xs font-semibold">
            {(["day", "night", "both"] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setAppliesTo(opt)}
                className={`cursor-pointer rounded-lg py-2 capitalize transition ${
                  appliesTo === opt
                    ? "bg-brand-primary text-white"
                    : "text-brand-muted hover:text-brand-ink"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-brand-ink">
            Reason (optional)
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Private corporate event"
            className="w-full rounded-xl border border-brand-border bg-brand-bg/40 px-3.5 py-2.5 text-sm text-brand-ink outline-none focus:border-brand-primary focus:bg-white"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full cursor-pointer rounded-full bg-brand-primary py-2.5 text-xs font-semibold text-white transition hover:bg-brand-primary-hover disabled:opacity-60"
        >
          {saving ? "Blocking..." : "Add Blackout Date"}
        </button>
      </form>

      <div className="rounded-2xl bg-white p-6 shadow-[0_2px_20px_rgba(23,36,58,0.05)] lg:col-span-7">
        <h3 className="text-base font-bold text-brand-ink">
          Active Blackout Dates ({blackouts.length})
        </h3>

        {blackouts.length === 0 ? (
          <p className="mt-4 text-xs text-brand-muted">
            No blackout dates configured. All future dates follow your standard room inventory.
          </p>
        ) : (
          <div className="mt-4 divide-y divide-brand-border/70">
            {blackouts.map((b) => {
              const roomName = b.room_type_id
                ? rooms.find((r) => r.id === b.room_type_id)?.name ?? "Room"
                : "Whole Hotel";
              return (
                <div
                  key={b.id}
                  className="flex items-center justify-between gap-3 py-3 text-xs"
                >
                  <div>
                    <div className="font-bold text-brand-ink">
                      {b.date} · <span className="font-medium text-brand-primary">{roomName}</span>
                    </div>
                    <div className="mt-0.5 text-brand-muted">
                      Blocks: <strong className="capitalize">{b.applies_to}</strong>
                      {b.reason ? ` — ${b.reason}` : ""}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(b.id)}
                    className="cursor-pointer rounded-lg px-2.5 py-1 font-semibold text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function HotelProfileTab({
  hotel,
  site,
  rootDomain,
}: {
  hotel: Hotel;
  site: { subdomain: string; published: boolean; content: { tagline?: string; featured_photos?: string[] } } | null;
  rootDomain: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(hotel.name);
  const [area, setArea] = useState(hotel.area);
  const [address, setAddress] = useState(hotel.address);
  const [description, setDescription] = useState(hotel.description);
  const [whatsapp, setWhatsapp] = useState(hotel.whatsapp);
  const [phone, setPhone] = useState(hotel.phone);
  const [photos, setPhotos] = useState<string[]>(hotel.photos ?? []);
  const [amenities, setAmenities] = useState<string[]>(hotel.amenities ?? []);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  // One-pager customization state
  const [tagline, setTagline] = useState(site?.content?.tagline ?? "");
  const [featuredPhotos, setFeaturedPhotos] = useState<string[]>(
    site?.content?.featured_photos?.length ? site.content.featured_photos : hotel.photos ?? []
  );
  const [savingSite, setSavingSite] = useState(false);
  const [siteMsg, setSiteMsg] = useState<string | null>(null);

  async function handleSaveSite(e: React.FormEvent) {
    e.preventDefault();
    setSiteMsg(null);
    setSavingSite(true);
    const res = await updateHotelSiteContentAction({
      hotelId: hotel.id,
      tagline,
      featuredPhotos,
    });
    setSavingSite(false);
    setSiteMsg(
      res.ok ? "One-pager tagline and photos saved!" : res.error ?? "Failed to save."
    );
    router.refresh();
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    const res = await updateHotelProfileAction({
      hotelId: hotel.id,
      name,
      area,
      address,
      description,
      phone,
      whatsapp,
      photos,
      amenities,
    });
    setSaving(false);

    if (!res.ok) {
      setMessage({ ok: false, text: res.error ?? "Failed to update profile." });
      return;
    }
    setMessage({ ok: true, text: "Hotel profile saved and updated live." });
    router.refresh();
  }

  return (
    <div className="space-y-6">
    <form
      onSubmit={handleSave}
      className="max-w-2xl space-y-5 rounded-2xl bg-white p-6 shadow-[0_2px_20px_rgba(23,36,58,0.05)]"
    >
      <div>
        <h2 className="text-base font-bold text-brand-ink">Hotel Profile</h2>
        <p className="mt-0.5 text-xs text-brand-muted">
          Keep your name, Lagos address, description, WhatsApp line, and photos up to date.
        </p>
      </div>

      {message && (
        <div
          className={`rounded-xl px-4 py-2.5 text-xs font-medium ${
            message.ok
              ? "bg-night-bg text-brand-primary"
              : "border border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-brand-ink">
            Hotel Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-brand-border bg-brand-bg/40 px-3.5 py-2.5 text-sm text-brand-ink outline-none focus:border-brand-primary focus:bg-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-brand-ink">
            Lagos Area
          </label>
          <input
            type="text"
            required
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="w-full rounded-xl border border-brand-border bg-brand-bg/40 px-3.5 py-2.5 text-sm text-brand-ink outline-none focus:border-brand-primary focus:bg-white"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-brand-ink">
          Street Address
        </label>
        <input
          type="text"
          required
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full rounded-xl border border-brand-border bg-brand-bg/40 px-3.5 py-2.5 text-sm text-brand-ink outline-none focus:border-brand-primary focus:bg-white"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-brand-ink">
            WhatsApp Number (Nigeria)
          </label>
          <input
            type="tel"
            required
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            className="w-full rounded-xl border border-brand-border bg-brand-bg/40 px-3.5 py-2.5 text-sm text-brand-ink outline-none focus:border-brand-primary focus:bg-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-brand-ink">
            Front Desk Phone
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-xl border border-brand-border bg-brand-bg/40 px-3.5 py-2.5 text-sm text-brand-ink outline-none focus:border-brand-primary focus:bg-white"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-brand-ink">
          Description
        </label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-xl border border-brand-border bg-brand-bg/40 px-3.5 py-2.5 text-sm text-brand-ink outline-none focus:border-brand-primary focus:bg-white"
        />
      </div>

      <div>
        <label className="mb-2 block text-xs font-semibold text-brand-ink">
          Hotel Amenities &amp; Day-Stay Perks
        </label>
        <div className="flex flex-wrap gap-2">
          {AMENITY_CATALOG.map((item) => {
            const active = amenities.includes(item);
            return (
              <button
                key={item}
                type="button"
                onClick={() =>
                  setAmenities((prev) =>
                    prev.includes(item)
                      ? prev.filter((a) => a !== item)
                      : [...prev, item]
                  )
                }
                className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "bg-brand-primary text-white"
                    : "bg-brand-bg text-brand-muted hover:text-brand-ink"
                }`}
              >
                {active ? "✓ " : "+ "}
                {item}
              </button>
            );
          })}
        </div>
      </div>

      <PhotoUploader
        hotelId={hotel.id}
        photos={photos}
        onChange={setPhotos}
        label="Hotel Gallery Photos"
      />

      <button
        type="submit"
        disabled={saving}
        className="cursor-pointer rounded-full bg-brand-primary px-6 py-2.5 text-xs font-semibold text-white transition hover:bg-brand-primary-hover disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save Profile"}
      </button>
    </form>

    {/* Free One-Page Website Customiser (Stage 5) */}
    <form
      onSubmit={handleSaveSite}
      className="max-w-2xl space-y-4 rounded-2xl bg-white p-6 shadow-[0_2px_20px_rgba(23,36,58,0.05)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-brand-ink">Free One-Page Website</h3>
          <p className="mt-0.5 font-mono text-xs text-brand-primary">
            {site?.subdomain ?? hotel.slug}.{rootDomain}
          </p>
        </div>
        <a
          href={`/sites/${site?.subdomain ?? hotel.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-night-bg px-3.5 py-1.5 text-xs font-semibold text-brand-primary transition hover:bg-brand-primary hover:text-white"
        >
          Preview One-Pager ↗
        </a>
      </div>

      {siteMsg && (
        <div className="rounded-xl bg-night-bg px-4 py-2 text-xs font-medium text-brand-primary">
          {siteMsg}
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-semibold text-brand-ink">
          Short Tagline
        </label>
        <input
          type="text"
          maxLength={120}
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="e.g. Quiet luxury day stays in Old Ikoyi"
          className="w-full rounded-xl border border-brand-border bg-brand-bg/40 px-3.5 py-2.5 text-sm text-brand-ink outline-none focus:border-brand-primary focus:bg-white"
        />
      </div>

      {photos.length > 0 && (
        <div>
          <label className="mb-2 block text-xs font-semibold text-brand-ink">
            Select Photos for Your One-Pager ({featuredPhotos.length} selected)
          </label>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
            {photos.map((url) => {
              const selected = featuredPhotos.includes(url);
              return (
                <button
                  key={url}
                  type="button"
                  onClick={() =>
                    setFeaturedPhotos((prev) =>
                      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
                    )
                  }
                  className={`relative h-20 cursor-pointer overflow-hidden rounded-xl border-2 transition ${
                    selected ? "border-brand-primary" : "border-transparent opacity-60 hover:opacity-90"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="Site option" className="h-full w-full object-cover" />
                  {selected && (
                    <span className="absolute top-1 right-1 rounded-full bg-brand-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={savingSite}
        className="cursor-pointer rounded-full bg-brand-ink px-6 py-2.5 text-xs font-semibold text-white transition hover:bg-brand-primary disabled:opacity-60"
      >
        {savingSite ? "Saving..." : "Save One-Pager Settings"}
      </button>
    </form>
    </div>
  );
}
