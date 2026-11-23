import type { ReactNode } from "react";

export type AvatarId = "classic" | "sunset" | "midnight" | "palm" | "compass";

export const AVATAR_OPTIONS: {
  id: AvatarId;
  label: string;
  bg: string;
  render: () => ReactNode;
}[] = [
  {
    id: "classic",
    label: "Cobalt",
    bg: "linear-gradient(135deg, #2457D6 0%, #4E86F7 100%)",
    render: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" className="h-[58%] w-[58%] text-white">
        <circle cx="12" cy="8.5" r="3.5" />
        <path d="M5.5 19.5c0-3.3 2.9-5.5 6.5-5.5s6.5 2.2 6.5 5.5" />
      </svg>
    ),
  },
  {
    id: "sunset",
    label: "Tangerine",
    bg: "linear-gradient(135deg, #FF7138 0%, #FF9B6A 100%)",
    render: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" className="h-[58%] w-[58%] text-white">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 3v2M12 19v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M3 12h2M19 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4" />
      </svg>
    ),
  },
  {
    id: "midnight",
    label: "Midnight",
    bg: "linear-gradient(135deg, #17243A 0%, #2D4368 100%)",
    render: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" className="h-[58%] w-[58%] text-white">
        <path d="M12 3a6.5 6.5 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      </svg>
    ),
  },
  {
    id: "palm",
    label: "Lagos",
    bg: "linear-gradient(135deg, #2457D6 0%, #FF7138 140%)",
    render: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" className="h-[58%] w-[58%] text-white">
        <path d="M12 20v-9" />
        <path d="M12 11c0-3.5-2.5-6-6-6 0 3.5 2.5 6 6 6Z" />
        <path d="M12 11c0-3.5 2.5-6 6-6 0 3.5-2.5 6-6 6Z" />
        <path d="M7 20h10" />
      </svg>
    ),
  },
  {
    id: "compass",
    label: "Explorer",
    bg: "linear-gradient(135deg, #17243A 0%, #2457D6 100%)",
    render: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" className="h-[58%] w-[58%] text-white">
        <circle cx="12" cy="12" r="8.5" />
        <polygon points="15.5 8.5 13.5 13.5 8.5 15.5 10.5 10.5 15.5 8.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
];

export function ProfileAvatar({
  avatarId = "classic",
  size = "md",
}: {
  avatarId?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const option =
    AVATAR_OPTIONS.find((a) => a.id === avatarId) ?? AVATAR_OPTIONS[0];

  const dims =
    size === "sm"
      ? "h-8 w-8"
      : size === "lg"
      ? "h-12 w-12"
      : "h-10 w-10";

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full shadow-xs ${dims}`}
      style={{ background: option.bg }}
    >
      {option.render()}
    </span>
  );
}
