export type UserRole = "guest" | "hotel_admin" | "super_admin";
export type HotelStatus = "pending" | "approved" | "suspended";
export type HotelPlan = "free" | "paid";
export type BookingType = "night" | "day";
export type BookingStatus =
  | "pending_payment"
  | "requested"
  | "confirmed"
  | "declined"
  | "cancelled"
  | "completed"
  | "expired";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  phone: string | null;
  created_at: string;
}

export interface Hotel {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  area: string;
  address: string;
  description: string;
  photos: string[];
  phone: string;
  whatsapp: string;
  check_in_time: string;
  check_out_time: string;
  day_start: string;
  day_end: string;
  status: HotelStatus;
  plan: HotelPlan;
  commission_rate: number;
  amenities?: string[];
  lat?: number | null;
  lng?: number | null;
  parent_hotel_id?: string | null;
  branch_label?: string | null;
  created_at: string;
}

export interface SavedCard {
  id: string;
  brand: string;
  last4: string;
  exp_month: string;
  exp_year: string;
  bank: string;
  cardholder_name: string;
  created_at: string;
}

export interface RoomType {
  id: string;
  hotel_id: string;
  name: string;
  description: string;
  night_price_ngn: number;
  day_price_ngn: number | null;
  capacity: number;
  total_rooms: number;
  day_rooms_per_day: number;
  photos: string[];
  amenities?: string[];
  created_at: string;
}

export type ReviewStatus = "pending" | "approved" | "rejected";

export interface HotelReview {
  id: string;
  hotel_id: string;
  booking_id: string;
  guest_user_id: string;
  guest_name: string;
  rating: number;
  comment: string;
  stay_type: BookingType;
  status: ReviewStatus;
  created_at: string;
}

export interface EligibleReviewBooking {
  id: string;
  booking_type: BookingType;
  check_in_date: string;
}

export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG")}`;
}

export function formatTimeShort(timeStr: string): string {
  const [hStr, mStr] = timeStr.split(":");
  const h = Number(hStr);
  const m = Number(mStr ?? "0");
  const period = h >= 12 ? "pm" : "am";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour12}${period}` : `${hour12}:${String(m).padStart(2, "0")}${period}`;
}
