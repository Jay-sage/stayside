"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createPartnerHotelAccountAction,
  updateHotelPlanAndCommissionAction,
  updateHotelStatusAction,
} from "@/app/actions/super-admin";
import type { Hotel, HotelPlan, HotelStatus } from "@/types/database";

export function AdminHotelsTab({ hotels }: { hotels: Hotel[] }) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<"all" | HotelStatus>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  // Create partner form
  const [email, setEmail] = useState("");
  const [tempPassword, setTempPassword] = useState("StaysideHotel123!");
  const [ownerName, setOwnerName] = useState("");
  const [hotelName, setHotelName] = useState("");
  const [area, setArea] = useState("Victoria Island");
  const [whatsapp, setWhatsapp] = useState("");
  const [creating, setCreating] = useState(false);

  // Per-hotel commission draft state
  const [commDrafts, setCommDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(hotels.map((h) => [h.id, String(h.commission_rate)]))
  );
  const [planDrafts, setPlanDrafts] = useState<Record<string, HotelPlan>>(() =>
    Object.fromEntries(hotels.map((h) => [h.id, h.plan]))
  );

  const filtered = useMemo(() => {
    if (statusFilter === "all") return hotels;
    return hotels.filter((h) => h.status === statusFilter);
  }, [hotels, statusFilter]);

  async function handleStatus(hotelId: string, nextStatus: HotelStatus) {
    setFeedback(null);
    setBusyId(hotelId);
    const res = await updateHotelStatusAction(hotelId, nextStatus);
    setBusyId(null);
    setFeedback(
      res.ok
        ? { ok: true, text: `Hotel status updated to ${nextStatus}.` }
        : { ok: false, text: res.error ?? "Failed to update status." }
    );
    router.refresh();
  }

  async function handleSavePlan(hotelId: string) {
    setFeedback(null);
    setBusyId(hotelId);
    const res = await updateHotelPlanAndCommissionAction(
      hotelId,
      planDrafts[hotelId] ?? "free",
      Number(commDrafts[hotelId] ?? 10)
    );
    setBusyId(null);
    setFeedback(
      res.ok
        ? { ok: true, text: "Plan and commission rate saved." }
        : { ok: false, text: res.error ?? "Failed to update plan." }
    );
    router.refresh();
  }

  async function handleCreatePartner(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    setCreating(true);
    const res = await createPartnerHotelAccountAction({
      email,
      tempPassword,
      ownerName,
      hotelName,
      area,
      whatsapp,
    });
    setCreating(false);

    if (!res.ok) {
      setFeedback({ ok: false, text: res.error ?? "Could not create partner." });
      return;
    }

    setFeedback({
      ok: true,
      text: `Partner account created for ${hotelName} (${email}).`,
    });
    setShowCreate(false);
    setEmail("");
    setOwnerName("");
    setHotelName("");
    setWhatsapp("");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-[0_2px_20px_rgba(23,36,58,0.05)]">
        <div className="flex flex-wrap gap-1.5">
          {(["all", "approved", "pending", "suspended"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition ${
                statusFilter === s
                  ? "bg-brand-primary text-white"
                  : "bg-brand-bg text-brand-muted hover:text-brand-ink"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          className="cursor-pointer rounded-full bg-brand-ink px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-primary"
        >
          {showCreate ? "Close Form" : "+ Create Partner Hotel"}
        </button>
      </div>

      {feedback && (
        <div
          className={`rounded-xl px-4 py-2.5 text-xs font-medium ${
            feedback.ok
              ? "bg-night-bg text-brand-primary"
              : "border border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {showCreate && (
        <form
          onSubmit={handleCreatePartner}
          className="space-y-4 rounded-2xl border border-brand-primary/20 bg-white p-6 shadow-[0_6px_28px_rgba(23,36,58,0.08)]"
        >
          <div>
            <h3 className="text-sm font-bold text-brand-ink">
              Create Partner Hotel Account
            </h3>
            <p className="text-xs text-brand-muted">
              Provisions a hotel admin login with a temporary password and approves their listing.
            </p>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            <input
              type="text"
              required
              value={hotelName}
              onChange={(e) => setHotelName(e.target.value)}
              placeholder="Hotel Name"
              className="rounded-xl border border-brand-border bg-brand-bg/40 px-3.5 py-2.5 text-sm outline-none focus:border-brand-primary focus:bg-white"
            />
            <input
              type="text"
              required
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="Lagos Area (e.g. Ikoyi)"
              className="rounded-xl border border-brand-border bg-brand-bg/40 px-3.5 py-2.5 text-sm outline-none focus:border-brand-primary focus:bg-white"
            />
            <input
              type="text"
              required
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="Owner Full Name"
              className="rounded-xl border border-brand-border bg-brand-bg/40 px-3.5 py-2.5 text-sm outline-none focus:border-brand-primary focus:bg-white"
            />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Partner Email"
              className="rounded-xl border border-brand-border bg-brand-bg/40 px-3.5 py-2.5 text-sm outline-none focus:border-brand-primary focus:bg-white"
            />
            <input
              type="text"
              required
              minLength={8}
              value={tempPassword}
              onChange={(e) => setTempPassword(e.target.value)}
              placeholder="Temporary Password"
              className="rounded-xl border border-brand-border bg-brand-bg/40 px-3.5 py-2.5 text-sm outline-none focus:border-brand-primary focus:bg-white"
            />
            <input
              type="tel"
              required
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="WhatsApp (0803...)"
              className="rounded-xl border border-brand-border bg-brand-bg/40 px-3.5 py-2.5 text-sm outline-none focus:border-brand-primary focus:bg-white"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={creating}
              className="cursor-pointer rounded-full bg-brand-primary px-6 py-2.5 text-xs font-semibold text-white hover:bg-brand-primary-hover disabled:opacity-60"
            >
              {creating ? "Creating..." : "Create Partner Account"}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_20px_rgba(23,36,58,0.05)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-brand-border bg-brand-bg/60 text-brand-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Hotel</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Plan &amp; Commission %</th>
                <th className="px-4 py-3 text-right font-semibold">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/70">
              {filtered.map((h) => (
                <tr key={h.id} className="hover:bg-brand-bg/30">
                  <td className="px-4 py-3.5">
                    <div className="font-bold text-brand-ink">{h.name}</div>
                    <div className="text-[11px] text-brand-muted">
                      {h.area} · /{h.slug}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${
                        h.status === "approved"
                          ? "bg-emerald-50 text-emerald-700"
                          : h.status === "pending"
                          ? "bg-day-bg text-day-text"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {h.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={planDrafts[h.id] ?? h.plan}
                        onChange={(e) =>
                          setPlanDrafts((prev) => ({
                            ...prev,
                            [h.id]: e.target.value as HotelPlan,
                          }))
                        }
                        className="rounded-lg border border-brand-border bg-brand-bg/50 px-2.5 py-1 text-xs font-medium"
                      >
                        <option value="free">Free</option>
                        <option value="paid">Paid</option>
                      </select>

                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={0.5}
                          value={commDrafts[h.id] ?? String(h.commission_rate)}
                          onChange={(e) =>
                            setCommDrafts((prev) => ({
                              ...prev,
                              [h.id]: e.target.value,
                            }))
                          }
                          className="w-16 rounded-lg border border-brand-border bg-brand-bg/50 px-2 py-1 text-xs"
                        />
                        <span className="text-brand-muted">%</span>
                      </div>

                      <button
                        type="button"
                        disabled={busyId === h.id}
                        onClick={() => handleSavePlan(h.id)}
                        className="cursor-pointer rounded-lg bg-night-bg px-2.5 py-1 text-[11px] font-semibold text-brand-primary hover:bg-brand-primary hover:text-white"
                      >
                        Save
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex justify-end gap-1.5">
                      {h.status !== "approved" && (
                        <button
                          type="button"
                          disabled={busyId === h.id}
                          onClick={() => handleStatus(h.id, "approved")}
                          className="cursor-pointer rounded-lg bg-brand-primary px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-brand-primary-hover"
                        >
                          {h.status === "suspended" ? "Reactivate" : "Approve"}
                        </button>
                      )}
                      {h.status !== "suspended" && (
                        <button
                          type="button"
                          disabled={busyId === h.id}
                          onClick={() => handleStatus(h.id, "suspended")}
                          className="cursor-pointer rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] font-semibold text-red-700 hover:bg-red-100"
                        >
                          Suspend
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
