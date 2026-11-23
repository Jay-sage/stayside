export const AMENITY_CATALOG = [
  "Free Wi-Fi",
  "Pool Access",
  "Free Breakfast",
  "Coffee & Tea",
  "Workspace",
  "24/7 Power",
  "Free Parking",
  "Air Conditioning",
  "Gym Access",
  "Restaurant & Bar",
] as const;

export type AmenityName = (typeof AMENITY_CATALOG)[number];
