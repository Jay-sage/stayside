"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteRoomTypeAction,
  upsertRoomTypeAction,
} from "@/app/actions/hotel-admin";
import { PhotoUploader } from "@/components/hotel-admin/PhotoUploader";
import { AMENITY_CATALOG } from "@/lib/amenities";
import { formatNaira, type RoomType } from "@/types/database";

export function RoomsManagerTab({
  hotelId,
  rooms,
}: {
  hotelId: string;
  rooms: RoomType[];
}) {
  const router = useRouter();
  const [editingRoom, setEditingRoom] = useState<RoomType | "new" | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dayPrice, setDayPrice] = useState("");
  const [nightPrice, setNightPrice] = useState("");
  const [capacity, setCapacity] = useState("2");
  const [totalRooms, setTotalRooms] = useState("5");
  const [dayRooms, setDayRooms] = useState("2");
  const [photos, setPhotos] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openNew() {
    setEditingRoom("new");
    setName("");
    setDescription("");
    setDayPrice("35000");
    setNightPrice("80000");
    setCapacity("2");
    setTotalRooms("5");
    setDayRooms("2");
    setPhotos([]);
    setAmenities(["Free Wi-Fi", "Air Conditioning"]);
    setError(null);
  }

  function openEdit(room: RoomType) {
    setEditingRoom(room);
    setName(room.name);
    setDescription(room.description);
    setDayPrice(room.day_price_ngn ? String(room.day_price_ngn) : "");
    setNightPrice(String(room.night_price_ngn));
    setCapacity(String(room.capacity));
    setTotalRooms(String(room.total_rooms));
    setDayRooms(String(room.day_rooms_per_day));
    setPhotos(room.photos ?? []);
    setAmenities(room.amenities ?? []);
    setError(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const res = await upsertRoomTypeAction({
      id: editingRoom && editingRoom !== "new" ? editingRoom.id : undefined,
      hotelId,
      name,
      description,
      nightPriceNgn: Number(nightPrice),
      dayPriceNgn: dayPrice.trim() ? Number(dayPrice) : null,
      capacity: Number(capacity),
      totalRooms: Number(totalRooms),
      dayRoomsPerDay: Number(dayRooms),
      photos,
      amenities,
    });

    setSaving(false);
    if (!res.ok) {
      setError(res.error ?? "Failed to save room type.");
      return;
    }

    setEditingRoom(null);
    router.refresh();
  }

  async function handleDelete(roomId: string) {
    setError(null);
    const res = await deleteRoomTypeAction(hotelId, roomId);
    if (!res.ok) {
      setError(res.error ?? "Could not delete room type.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-brand-ink">Room Types ({rooms.length})</h2>
          <p className="text-xs text-brand-muted">
            Manage daytime &amp; overnight pricing, inventory, and room photos.
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="cursor-pointer rounded-full bg-brand-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-primary-hover"
        >
          + Add Room Type
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-700">
          {error}
        </div>
      )}

      {editingRoom && (
        <form
          onSubmit={handleSave}
          className="space-y-4 rounded-2xl border border-brand-primary/20 bg-white p-5 shadow-[0_6px_28px_rgba(23,36,58,0.08)]"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-brand-ink">
              {editingRoom === "new" ? "New Room Type" : `Edit: ${editingRoom.name}`}
            </h3>
            <button
              type="button"
              onClick={() => setEditingRoom(null)}
              className="cursor-pointer text-xs font-medium text-brand-muted hover:text-brand-ink"
            >
              Cancel
            </button>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-brand-ink">
                Room Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Deluxe King"
                className="w-full rounded-xl border border-brand-border bg-brand-bg/40 px-3.5 py-2 text-sm text-brand-ink outline-none focus:border-brand-primary focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-brand-ink">
                Capacity (guests)
              </label>
              <input
                type="number"
                min={1}
                required
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full rounded-xl border border-brand-border bg-brand-bg/40 px-3.5 py-2 text-sm text-brand-ink outline-none focus:border-brand-primary focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-brand-ink">
                Day-Stay Price (₦)
              </label>
              <input
                type="number"
                min={0}
                value={dayPrice}
                onChange={(e) => setDayPrice(e.target.value)}
                placeholder="45000"
                className="w-full rounded-xl border border-brand-border bg-brand-bg/40 px-3.5 py-2 text-sm text-brand-ink outline-none focus:border-brand-primary focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-brand-ink">
                Night-Stay Price (₦)
              </label>
              <input
                type="number"
                min={1}
                required
                value={nightPrice}
                onChange={(e) => setNightPrice(e.target.value)}
                placeholder="95000"
                className="w-full rounded-xl border border-brand-border bg-brand-bg/40 px-3.5 py-2 text-sm text-brand-ink outline-none focus:border-brand-primary focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-brand-ink">
                Total Rooms
              </label>
              <input
                type="number"
                min={1}
                required
                value={totalRooms}
                onChange={(e) => setTotalRooms(e.target.value)}
                className="w-full rounded-xl border border-brand-border bg-brand-bg/40 px-3.5 py-2 text-sm text-brand-ink outline-none focus:border-brand-primary focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-brand-ink">
                Day Rooms Allotment / Day
              </label>
              <input
                type="number"
                min={0}
                required
                value={dayRooms}
                onChange={(e) => setDayRooms(e.target.value)}
                className="w-full rounded-xl border border-brand-border bg-brand-bg/40 px-3.5 py-2 text-sm text-brand-ink outline-none focus:border-brand-primary focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-brand-ink">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Bed size, amenities, pool access..."
              className="w-full rounded-xl border border-brand-border bg-brand-bg/40 px-3.5 py-2 text-sm text-brand-ink outline-none focus:border-brand-primary focus:bg-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold text-brand-ink">
              Included Room &amp; Day-Stay Perks
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
            hotelId={hotelId}
            photos={photos}
            onChange={setPhotos}
            label="Room Photos"
          />

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditingRoom(null)}
              className="cursor-pointer rounded-full border border-brand-border px-4 py-2 text-xs font-semibold text-brand-ink"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="cursor-pointer rounded-full bg-brand-primary px-5 py-2 text-xs font-semibold text-white transition hover:bg-brand-primary-hover disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Room Type"}
            </button>
          </div>
        </form>
      )}

      {/* Room Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {rooms.map((room) => (
          <div
            key={room.id}
            className="flex flex-col justify-between rounded-2xl bg-white p-4 shadow-[0_2px_20px_rgba(23,36,58,0.05)]"
          >
            <div className="flex gap-3.5">
              {room.photos[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={room.photos[0]}
                  alt={room.name}
                  className="h-20 w-24 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-20 w-24 shrink-0 items-center justify-center rounded-xl bg-brand-bg text-[11px] text-brand-muted">
                  No photo
                </div>
              )}

              <div className="min-w-0 flex-1 space-y-1">
                <h3 className="truncate text-sm font-bold text-brand-ink">{room.name}</h3>
                <p className="line-clamp-2 text-xs text-brand-muted">
                  {room.description || "No description yet."}
                </p>
                <div className="flex flex-wrap gap-2 pt-1 text-xs">
                  <span className="rounded-full bg-day-bg px-2.5 py-0.5 font-semibold text-day-text">
                    Day {room.day_price_ngn ? formatNaira(room.day_price_ngn) : "Off"}
                  </span>
                  <span className="font-semibold text-brand-primary">
                    Night {formatNaira(room.night_price_ngn)}
                  </span>
                </div>
                {room.amenities && room.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {room.amenities.slice(0, 4).map((a) => (
                      <span
                        key={a}
                        className="rounded-md bg-brand-bg px-2 py-0.5 text-[10px] font-medium text-brand-muted"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-brand-border/70 pt-3 text-xs">
              <span className="text-brand-muted">
                {room.total_rooms} total · <strong>{room.day_rooms_per_day}</strong> day/day
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(room)}
                  className="cursor-pointer rounded-lg bg-brand-bg px-3 py-1 font-semibold text-brand-ink hover:bg-night-bg hover:text-brand-primary"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(room.id)}
                  className="cursor-pointer rounded-lg px-2.5 py-1 font-semibold text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
