export const FREE_TOPIC_IDS = new Set(["operaciones", "divisibilidad"]);

// Deep, calm topic accents. Cards stay mostly white; color is used for
// hierarchy, progress and a restrained icon surface.
export const TOPIC_VISUALS: Record<
  string,
  { accent: string; soft: string; gradient: string; text: string }
> = {
  operaciones: {
    accent: "#2563eb",
    soft: "#dbeafe",
    gradient: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)",
    text: "#1d4ed8",
  },
  divisibilidad: {
    accent: "#0f766e",
    soft: "#ccfbf1",
    gradient: "linear-gradient(135deg, #134e4a 0%, #115e59 100%)",
    text: "#0f766e",
  },
  fracciones: {
    accent: "#16a34a",
    soft: "#dcfce7",
    gradient: "linear-gradient(135deg, #14532d 0%, #166534 100%)",
    text: "#15803d",
  },
  decimales: {
    accent: "#7c3aed",
    soft: "#ede9fe",
    gradient: "linear-gradient(135deg, #4c1d95 0%, #5b21b6 100%)",
    text: "#6d28d9",
  },
  porcentajes: {
    accent: "#ea580c",
    soft: "#ffedd5",
    gradient: "linear-gradient(135deg, #7c2d12 0%, #9a3412 100%)",
    text: "#c2410c",
  },
  geometria: {
    accent: "#db2777",
    soft: "#fce7f3",
    gradient: "linear-gradient(135deg, #831843 0%, #9d174d 100%)",
    text: "#be185d",
  },
};

export function getTopicVisual(topicId: string) {
  return (
    TOPIC_VISUALS[topicId] ?? {
      accent: "#2563eb",
      soft: "#dbeafe",
      gradient: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)",
      text: "#1d4ed8",
    }
  );
}

export function getAccuracyPct(
  accuracy: Record<string, { correct: number; total: number }>,
  topicId: string
) {
  const acc = accuracy[topicId];
  if (!acc || acc.total === 0) return null;
  return Math.round((acc.correct / acc.total) * 100);
}
