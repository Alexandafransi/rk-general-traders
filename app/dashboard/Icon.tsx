import type { ReactNode } from "react";

const PATHS: Record<string, ReactNode> = {
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  folder: <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h3.2l2 2.5h7.8A2.5 2.5 0 0 1 21 10v7.5a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z" />,
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.4" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M17 5.5a3.2 3.2 0 0 1 0 6" />
      <path d="M18 14.5a6 6 0 0 1 3.5 5.5" />
    </>
  ),
  tool: (
    <>
      <path d="M14.5 6a4 4 0 1 0 3.5 5.9L21 15l-3 3-3.1-3A4 4 0 0 0 14.5 6z" />
      <path d="M9.5 9.5L3 16v5h5l6.5-6.5" />
    </>
  ),
  "check-square": (
    <>
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M8 12.5l2.5 2.5L16 9.5" />
    </>
  ),
  life: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3.6" />
      <path d="M14.6 9.4L18 6M6 18l3.4-3.4M14.6 14.6L18 18M6 6l3.4 3.4" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </>
  ),
  bell: (
    <>
      <path d="M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" />
      <path d="M13.7 20a2 2 0 0 1-3.4 0" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </>
  ),
  dots: (
    <>
      <circle cx="5" cy="12" r="1.4" />
      <circle cx="12" cy="12" r="1.4" />
      <circle cx="19" cy="12" r="1.4" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  "chevron-r": <path d="M9 6l6 6-6 6" />,
  download: (
    <>
      <path d="M12 4v11M7.5 11l4.5 4.5L16.5 11" />
      <path d="M4.5 19.5h15" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  flag: <path d="M5 21V4h9l-1.2 3.5L14 11H5" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  edit: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
    </>
  ),
  x: <path d="M18 6L6 18M6 6l12 12" />,
  cart: (
    <>
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
      <path d="M2.5 3h2.5l2.7 12.4a2 2 0 0 0 2 1.6h8a2 2 0 0 0 2-1.6L21.5 7H6" />
    </>
  ),
  wallet: (
    <>
      <rect x="2.5" y="6" width="19" height="14" rx="2.2" />
      <path d="M2.5 10.5h19" />
      <circle cx="16.5" cy="14.5" r="1.4" />
    </>
  ),
  truck: (
    <>
      <rect x="1.5" y="7" width="13" height="10" rx="1.2" />
      <path d="M14.5 10.5h4l3 3.2V17h-7z" />
      <circle cx="6" cy="19" r="1.6" />
      <circle cx="17.5" cy="19" r="1.6" />
    </>
  ),
  "trending-up": (
    <>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </>
  ),
  receipt: (
    <>
      <path d="M6 2h12v19l-3-2-3 2-3-2-3 2z" />
      <path d="M8.5 8h7M8.5 12h7M8.5 16h4" />
    </>
  ),
  box: (
    <>
      <path d="M3 8l9-5 9 5-9 5-9-5z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </>
  ),
  store: (
    <>
      <path d="M3 9l1.5-5h15L21 9" />
      <path d="M3 9v11h18V9" />
      <path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
      <path d="M9 20v-6h6v6" />
    </>
  ),
  eye: (
    <>
      <path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7-10.5-7-10.5-7z" />
      <circle cx="12" cy="12" r="3.2" />
    </>
  ),
  "eye-off": (
    <>
      <path d="M3 3l18 18" />
      <path d="M10.6 5.2A10.6 10.6 0 0 1 12 5c7 0 10.5 7 10.5 7a15.6 15.6 0 0 1-3.4 4.4M6.7 6.7C3.7 8.6 1.5 12 1.5 12S5 19 12 19a10.4 10.4 0 0 0 4.2-.86" />
      <path d="M9.4 9.4a3.2 3.2 0 0 0 4.4 4.4" />
    </>
  ),
  "log-out": (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="15" r="4.5" />
      <path d="M11.2 11.8L20 3M16.5 7.5L19 5M20 3l1.5 1.5" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
};

export default function Icon({
  name,
  size = 16,
  strokeWidth = 1.75,
  className,
}: {
  name: keyof typeof PATHS;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
