import { createClient } from "@/lib/supabase/server";
import { HotelListClient } from "@/components/HotelListClient";
import type { HotelWithRooms } from "@/components/HotelCard";

export default async function HotelsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; area?: string; stay?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const { data: hotels } = await supabase
    .from("hotels")
    .select("*, room_types(*)")
    .eq("status", "approved")
    .order("created_at", { ascending: true });

  const typedHotels = (hotels ?? []) as HotelWithRooms[];
  const areas = Array.from(new Set(typedHotels.map((h) => h.area)));

  const initialStay =
    params.stay === "day" || params.stay === "night" ? params.stay : "all";

  return (
    <HotelListClient
      hotels={typedHotels}
      areas={areas}
      initialQuery={params.q ?? ""}
      initialArea={params.area ?? "All"}
      initialStay={initialStay}
    />
  );
}
