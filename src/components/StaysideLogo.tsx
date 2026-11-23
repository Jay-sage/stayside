export function StaysideLogoMark({
  className = "h-8 w-8",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="48" height="48" rx="13" fill="#17243A" />
      <path d="M17 24C17 20.134 20.134 17 24 17C27.866 17 31 20.134 31 24" fill="#FF7138" />
      <path
        d="M10 28L24 17.5L38 28"
        stroke="white"
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 26.5V35.5H34V26.5"
        stroke="#2457D6"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="21.5" y="29" width="5" height="6.5" rx="1.5" fill="white" />
    </svg>
  );
}
