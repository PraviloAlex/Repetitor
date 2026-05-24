import type { CardRarity } from "../engine/types";
import type { LocalizedText } from "../i18n/types";

export type PlayerPosition = "GK" | "DEF" | "MID" | "FW";

/**
 * Unlock conditions are evaluated against the locally stored topic accuracy.
 * No purchases, no time gates — only real practice unlocks a player.
 */
export type UnlockCondition =
  | { kind: "first_session" }
  | { kind: "topic"; topicId: string; minAccuracy: number; minAnswered: number }
  | { kind: "any_topic"; minAccuracy: number; minAnswered: number }
  | { kind: "all_topics"; minAccuracy: number };

export type Footballer = {
  id: string;
  /** Invented, language-neutral name. No real players are used. */
  name: string;
  number: number;
  position: PlayerPosition;
  rarity: CardRarity;
  unlock: UnlockCondition;
  /** Short flavour text — a specialty, not an active game bonus (Stage Game-1). */
  specialty: LocalizedText;
  /** Human-readable hint shown while the player is locked. */
  unlockHint: LocalizedText;
};

export const FOOTBALLERS: Footballer[] = [
  {
    id: "gk_beto",
    name: "Beto Murallón",
    number: 1,
    position: "GK",
    rarity: "common",
    unlock: { kind: "first_session" },
    specialty: { es: "Atajadas seguras", ru: "Надёжно тащит мяч" },
    unlockHint: {
      es: "Completá tu primera sesión de práctica.",
      ru: "Заверши первую тренировочную сессию.",
    },
  },
  {
    id: "def_lucho",
    name: "Lucho Ancla",
    number: 2,
    position: "DEF",
    rarity: "common",
    unlock: { kind: "topic", topicId: "operaciones", minAccuracy: 50, minAnswered: 10 },
    specialty: { es: "Marca firme", ru: "Цепкая опека" },
    unlockHint: {
      es: "Llegá al 50% en Operaciones (10 respuestas).",
      ru: "Набери 50% в теме «Действия» (10 ответов).",
    },
  },
  {
    id: "def_nahuel",
    name: "Nahuel Bloque",
    number: 4,
    position: "DEF",
    rarity: "rare",
    unlock: { kind: "topic", topicId: "divisibilidad", minAccuracy: 60, minAnswered: 12 },
    specialty: { es: "Corta el ataque rival", ru: "Обрывает атаку соперника" },
    unlockHint: {
      es: "Llegá al 60% en Divisibilidad (12 respuestas).",
      ru: "Набери 60% в теме «Делимость» (12 ответов).",
    },
  },
  {
    id: "def_santi",
    name: "Santi Escudo",
    number: 5,
    position: "DEF",
    rarity: "rare",
    unlock: { kind: "topic", topicId: "geometria", minAccuracy: 60, minAnswered: 12 },
    specialty: { es: "Lee bien los espacios", ru: "Хорошо читает пространство" },
    unlockHint: {
      es: "Llegá al 60% en Perímetro y área (12 respuestas).",
      ru: "Набери 60% в теме «Периметр и площадь» (12 ответов).",
    },
  },
  {
    id: "mid_juampi",
    name: "Juampi Brújula",
    number: 6,
    position: "MID",
    rarity: "rare",
    unlock: { kind: "topic", topicId: "fracciones", minAccuracy: 65, minAnswered: 15 },
    specialty: { es: "Reparte el juego", ru: "Распределяет игру" },
    unlockHint: {
      es: "Llegá al 65% en Fracciones (15 respuestas).",
      ru: "Набери 65% в теме «Дроби» (15 ответов).",
    },
  },
  {
    id: "mid_dieguito",
    name: "Dieguito Compás",
    number: 8,
    position: "MID",
    rarity: "epic",
    unlock: { kind: "topic", topicId: "decimales", minAccuracy: 75, minAnswered: 15 },
    specialty: { es: "Precisión en el pase", ru: "Точный пас" },
    unlockHint: {
      es: "Llegá al 75% en Decimales (15 respuestas).",
      ru: "Набери 75% в теме «Десятичные» (15 ответов).",
    },
  },
  {
    id: "mid_tomi",
    name: "Tomi Rayo",
    number: 10,
    position: "MID",
    rarity: "epic",
    unlock: { kind: "topic", topicId: "divisibilidad", minAccuracy: 80, minAnswered: 20 },
    specialty: { es: "Cambia el ritmo del partido", ru: "Меняет ритм матча" },
    unlockHint: {
      es: "Llegá al 80% en Divisibilidad (20 respuestas).",
      ru: "Набери 80% в теме «Делимость» (20 ответов).",
    },
  },
  {
    id: "fw_mateo",
    name: "Mateo Gol",
    number: 9,
    position: "FW",
    rarity: "epic",
    unlock: { kind: "topic", topicId: "porcentajes", minAccuracy: 75, minAnswered: 15 },
    specialty: { es: "Olfato de gol", ru: "Чувство гола" },
    unlockHint: {
      es: "Llegá al 75% en Porcentajes (15 respuestas).",
      ru: "Набери 75% в теме «Проценты» (15 ответов).",
    },
  },
  {
    id: "fw_valen",
    name: "Valen Cohete",
    number: 11,
    position: "FW",
    rarity: "mythic",
    unlock: { kind: "any_topic", minAccuracy: 90, minAnswered: 20 },
    specialty: { es: "Velocidad pura", ru: "Чистая скорость" },
    unlockHint: {
      es: "Alcanzá el 90% en cualquier tema (20 respuestas).",
      ru: "Достигни 90% в любой теме (20 ответов).",
    },
  },
  {
    id: "fw_ciro",
    name: "Capitán Ciro",
    number: 7,
    position: "FW",
    rarity: "legend",
    unlock: { kind: "all_topics", minAccuracy: 70 },
    specialty: { es: "Lidera a todo el equipo", ru: "Ведёт за собой всю команду" },
    unlockHint: {
      es: "Llegá al 70% en los 6 temas.",
      ru: "Набери 70% во всех 6 темах.",
    },
  },
];
