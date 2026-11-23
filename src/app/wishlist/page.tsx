import { createClient } from "@/lib/supabase/server";
import { WishlistClient } from "@/components/WishlistClient";
import type { HotelWithRooms } from "@/components/HotelCard";

export default async function WishlistPage() {
  const supabase = await createClient();
  const { data: hotels } = await supabase
    .from("hotels")
    .select("*, room_types(*)")
    .eq("status", "approved")
    .order("created_at", { ascending: true });

  return <WishlistClient hotels={(hotels ?? []) as HotelWithRooms[]} />;
}
