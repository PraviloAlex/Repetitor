export type IconName = "today" | "topics" | "review" | "progress" | "parent" | "academy" | "skills";

type Props = {
  name: IconName;
  size?: number;
  className?: string;
};

export default function Icon({ name, size = 20, className }: Props) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    className,
  };

  if (name === "today") {
    return (
      <svg {...common}>
        <path d="M4 10.5 12 4l8 6.5" />
        <path d="M6.5 10.5V20h11v-9.5" />
        <path d="M10 20v-5h4v5" />
      </svg>
    );
  }

  if (name === "topics") {
    return (
      <svg {...common}>
        <path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4Z" />
        <path d="M8 4v13a3 3 0 0 0 3 3" />
      </svg>
    );
  }

  if (name === "review") {
    return (
      <svg {...common}>
        <path d="M17 2v5h-5" />
        <path d="M7 22v-5h5" />
        <path d="M20 11a8 8 0 0 0-13.7-5.7L2 9.5" />
        <path d="M4 13a8 8 0 0 0 13.7 5.7L22 14.5" />
      </svg>
    );
  }

  if (name === "progress") {
    return (
      <svg {...common}>
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="M8 15l3-3 3 2 5-7" />
      </svg>
    );
  }

  if (name === "academy") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3v5M12 16v5M4 8l5 3.5M20 8l-5 3.5M7 19l2.5-4.5M17 19l-2.5-4.5" />
      </svg>
    );
  }

  if (name === "skills") {
    return (
      <svg {...common}>
        <path d="M7 7h10" />
        <path d="M7 12h7" />
        <path d="M7 17h4" />
        <circle cx="4" cy="7" r="1" />
        <circle cx="4" cy="12" r="1" />
        <circle cx="4" cy="17" r="1" />
        <path d="M17 14l3 3 3-5" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <circle cx="12" cy="8" r="4" />
      <path d="M5 21a7 7 0 0 1 14 0" />
    </svg>
  );
}
