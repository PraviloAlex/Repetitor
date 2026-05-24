type Props = {
  topicId: string;
  size?: number;
};

export default function TopicGlyph({ topicId, size = 26 }: Props) {
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
  };

  if (topicId === "operaciones") {
    return (
      <svg {...common}>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
    );
  }

  if (topicId === "divisibilidad") {
    return (
      <svg {...common}>
        <path d="M6 12h12" />
        <circle cx="12" cy="6.5" r="1.4" fill="currentColor" stroke="none" />
        <circle cx="12" cy="17.5" r="1.4" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  if (topicId === "fracciones") {
    return (
      <svg {...common}>
        <path d="M6 18 18 6" />
        <path d="M7 7h3" />
        <path d="M8.5 5.5v3" />
        <path d="M14 17h4" />
      </svg>
    );
  }

  if (topicId === "decimales") {
    return (
      <svg {...common}>
        <path d="M7 7h3v10" />
        <path d="M16 7v10" />
        <path d="M14 7h4" />
        <path d="M14 12h3.5" />
        <circle cx="11.8" cy="17" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  if (topicId === "porcentajes") {
    return (
      <svg {...common}>
        <path d="M6 18 18 6" />
        <circle cx="7.5" cy="7.5" r="2.2" />
        <circle cx="16.5" cy="16.5" r="2.2" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M5 19h14" />
      <path d="M7 17 17 7" />
      <path d="M7 17h10V7" />
      <path d="M9.5 14.5 12 17" />
    </svg>
  );
}
