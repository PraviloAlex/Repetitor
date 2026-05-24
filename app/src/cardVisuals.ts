import type { CardRarity, CardType } from "./engine/types";
import type { LocalizedText } from "./i18n/types";

/** Rarity order, weak → strong. Also used to map difficulty 1–5 → rarity. */
export const RARITY_ORDER: CardRarity[] = [
  "common",
  "rare",
  "epic",
  "mythic",
  "legend",
];

type RarityVisual = {
  /** Frame / border colour of the card. */
  border: string;
  /** Soft background tint for the rarity chip. */
  soft: string;
  /** Chip text colour. */
  text: string;
  label: LocalizedText;
};

export const RARITY_VISUALS: Record<CardRarity, RarityVisual> = {
  common: {
    border: "#94a3b8",
    soft: "#f1f5f9",
    text: "#475569",
    label: { es: "Común", ru: "Обычная" },
  },
  rare: {
    border: "#2563eb",
    soft: "#dbeafe",
    text: "#1d4ed8",
    label: { es: "Rara", ru: "Редкая" },
  },
  epic: {
    border: "#7c3aed",
    soft: "#ede9fe",
    text: "#6d28d9",
    label: { es: "Épica", ru: "Эпическая" },
  },
  mythic: {
    border: "#d97706",
    soft: "#fef3c7",
    text: "#b45309",
    label: { es: "Mítica", ru: "Мифическая" },
  },
  legend: {
    border: "#0f172a",
    soft: "#fde68a",
    text: "#0f172a",
    label: { es: "Leyenda", ru: "Легендарная" },
  },
};

/**
 * Resolve a question's rarity. If not set explicitly, derive it from
 * difficulty (1→common … 5→legend) so old questions still render as cards.
 */
export function deriveRarity(q: {
  rarity?: CardRarity;
  difficulty?: number;
}): CardRarity {
  if (q.rarity) return q.rarity;
  const d = Math.min(Math.max(q.difficulty ?? 2, 1), 5);
  return RARITY_ORDER[d - 1];
}

type CardTypeVisual = {
  icon: string;
  label: LocalizedText;
};

export const CARD_TYPE_VISUALS: Record<CardType, CardTypeVisual> = {
  training: { icon: "🎯", label: { es: "Práctica", ru: "Тренировка" } },
  trick: { icon: "⚠️", label: { es: "Trampa", ru: "Ловушка" } },
  speed: { icon: "⚡", label: { es: "Velocidad", ru: "Скорость" } },
  explain: { icon: "💡", label: { es: "Explicación", ru: "Объяснение" } },
  visual: { icon: "🖼️", label: { es: "Visual", ru: "Визуальная" } },
  boss: { icon: "🏆", label: { es: "Desafío final", ru: "Босс" } },
  comeback: { icon: "🔁", label: { es: "Revancha", ru: "Реванш" } },
};

export function deriveCardType(q: { cardType?: CardType }): CardType {
  return q.cardType ?? "training";
}
