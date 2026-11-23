import { createClient } from "@/lib/supabase/server";
import { HomeExplorer } from "@/components/HomeExplorer";
import type { HotelWithRooms } from "@/components/HotelCard";

export default async function HomePage() {
  const supabase = await createClient();

  const { data: hotels } = await supabase
    .from("hotels")
    .select("*, room_types(*)")
    .eq("status", "approved")
    .order("created_at", { ascending: true });

  const typedHotels = (hotels ?? []) as HotelWithRooms[];
  const areas = Array.from(new Set(typedHotels.map((h) => h.area)));

  return <HomeExplorer hotels={typedHotels} areas={areas} />;
}
