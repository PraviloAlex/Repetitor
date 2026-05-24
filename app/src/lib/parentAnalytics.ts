import type { Language as Lang } from "../i18n/types";
import { getSkillImprovementDelta, getSkillTimeSeries } from "../engine/skillAnalytics";
import { SKILLS_BY_ID } from "../engine/skills";
import type { ProgressState } from "../storage/localProgress";

export type RiskLevel = "low" | "medium" | "high";
export type ProgressTrend = "improving" | "stable" | "declining" | "not_enough_data";
export type ParentStatus = "stable" | "attention" | "needs_help" | "not_enough_data";

export type WeakSkillInsight = {
  skillId: string;
  skillName: string;
  risk: RiskLevel;
  reason: string;
  nextStep: string;
  accuracy?: number;
  mistakes?: number;
};

export type ParentNextStep = {
  title: string;
  description: string;
  actionLabel: string;
  targetSkill?: string;
  difficulty?: "easy" | "normal" | "hard";
  /** How many sessions to recommend this week for the primary weak skill */
  sessionsRecommended: number;
};

export type ParentDashboardInsight = {
  status: ParentStatus;
  summary: string;
  statusTitle: string;
  statusReason: string;
  weakSkills: WeakSkillInsight[];
  trend: ProgressTrend;
  trendExplanation: string;
  nextStep: ParentNextStep;
  metrics: {
    accuracy?: number;
    activeDays?: number;
    completedTasks?: number;
    weakSkillsCount: number;
    focusedMinutes?: number;
  };
  explainers: {
    accuracy: string;
    streak: string;
    weakSkills: string;
  };
  weakSkillTrend?: {
    skillId: string;
    skillName: string;
    delta7d: number | null;
    points: Array<{ date: string; accuracy: number | null }>;
    explanation: string;
  };
};

type SkillAggregate = {
  skillId: string;
  attempts: number;
  correct: number;
  wrong: number;
  lastPracticedAt?: string;
  recentWrongStreak: number;
  needsRepair: boolean;
};

function txt(lang: Lang, ru: string, es: string): string {
  return lang === "ru" ? ru : es;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetweenIso(fromIso: string, toIso: string): number {
  const from = new Date(fromIso + "T00:00:00");
  const to = new Date(toIso + "T00:00:00");
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function buildSkillAggregates(state: ProgressState): SkillAggregate[] {
  const map = new Map<string, SkillAggregate>();
  const recent = state.sessions.slice(-6);

  for (const session of state.sessions) {
    if (session.skillOutcomes) {
      for (const [skillId, outcome] of Object.entries(session.skillOutcomes)) {
        if (!SKILLS_BY_ID.has(skillId)) continue;
        const current = map.get(skillId) ?? {
          skillId,
          attempts: 0,
          correct: 0,
          wrong: 0,
          recentWrongStreak: 0,
          needsRepair: false,
        };
        current.attempts += outcome.attempts;
        current.correct += outcome.correct;
        current.wrong += outcome.wrong;
        current.lastPracticedAt = session.endedAt?.slice(0, 10) ?? session.startedAt.slice(0, 10);
        map.set(skillId, current);
      }
    } else {
      const practiced = new Set(session.practicedSkillTags ?? session.wrongSkillTags);
      for (const skillId of practiced) {
        if (!SKILLS_BY_ID.has(skillId)) continue;
        const wrong = session.wrongSkillTags.includes(skillId);
        const current = map.get(skillId) ?? {
          skillId,
          attempts: 0,
          correct: 0,
          wrong: 0,
          recentWrongStreak: 0,
          needsRepair: false,
        };
        current.attempts += 1;
        current.correct += wrong ? 0 : 1;
        current.wrong += wrong ? 1 : 0;
        current.lastPracticedAt = session.endedAt?.slice(0, 10) ?? session.startedAt.slice(0, 10);
        map.set(skillId, current);
      }
    }
  }

  for (const aggregate of map.values()) {
    const recentWrong = recent.map((session) => {
      if (session.skillOutcomes?.[aggregate.skillId]) {
        return session.skillOutcomes[aggregate.skillId]!.wrong > 0;
      }
      return session.wrongSkillTags.includes(aggregate.skillId);
    });
    let streak = 0;
    for (let i = recentWrong.length - 1; i >= 0; i -= 1) {
      if (recentWrong[i]) streak += 1;
      else break;
    }
    aggregate.recentWrongStreak = streak;
    aggregate.needsRepair = state.skillProgress[aggregate.skillId]?.status === "needs_repair";
  }

  return Array.from(map.values());
}

export function explainMetric(metric: "accuracy" | "streak", value: number, lang: Lang): string {
  if (metric === "accuracy") {
    if (value >= 80) {
      return txt(
        lang,
        `${value}% точности — хороший рабочий уровень: тема в целом понимается.`,
        `${value}% de precision: nivel solido para avanzar sin apuro.`
      );
    }
    if (value >= 60) {
      return txt(
        lang,
        `${value}% точности — тема понята частично, но ошибки пока мешают двигаться дальше.`,
        `${value}% de precision: la base esta, pero todavia hay errores frecuentes.`
      );
    }
    return txt(
      lang,
      `${value}% точности — сейчас слишком много ошибок, лучше вернуться к базовым шагам.`,
      `${value}% de precision: conviene volver a ejercicios base antes de subir dificultad.`
    );
  }
  if (value >= 5) {
    return txt(
      lang,
      `${value} ответов подряд без ошибок — сильный сигнал закрепления.`,
      `${value} respuestas correctas seguidas: buena señal de consolidacion.`
    );
  }
  if (value >= 3) {
    return txt(
      lang,
      `${value} ответа подряд — хороший знак, но нужно ещё немного практики.`,
      `${value} respuestas seguidas: buen progreso, falta un poco para estabilizar.`
    );
  }
  return txt(
    lang,
    `${value} подряд — пока рано считать навык закреплённым.`,
    `${value} seguidas: todavia es temprano para considerar el skill estable.`
  );
}

export function getWeakSkills(state: ProgressState, lang: Lang, limit = 3): WeakSkillInsight[] {
  const today = todayIso();
  const aggregates = buildSkillAggregates(state);
  const insights: Array<WeakSkillInsight & { score: number }> = [];

  for (const item of aggregates) {
    if (item.attempts === 0) continue;
    const accuracy = Math.round((item.correct / item.attempts) * 100);
    const inactivityDays = item.lastPracticedAt ? daysBetweenIso(item.lastPracticedAt, today) : 99;
    const riskScore =
      (accuracy < 50 ? 4 : accuracy < 65 ? 3 : accuracy < 75 ? 2 : 1) +
      (item.wrong >= 6 ? 3 : item.wrong >= 4 ? 2 : item.wrong >= 2 ? 1 : 0) +
      (item.recentWrongStreak >= 3 ? 3 : item.recentWrongStreak === 2 ? 2 : 0) +
      (item.needsRepair ? 2 : 0) +
      (inactivityDays >= 7 ? 1 : 0);

    if (riskScore < 4) continue;

    const risk: RiskLevel = riskScore >= 8 ? "high" : riskScore >= 6 ? "medium" : "low";
    const name = SKILLS_BY_ID.get(item.skillId)?.titleEs ?? item.skillId;
    const reason =
      item.recentWrongStreak >= 3
        ? txt(
            lang,
            `Серия ошибок: ${item.recentWrongStreak} подряд в последних занятиях.`,
            `Hubo ${item.recentWrongStreak} errores seguidos en sesiones recientes.`
          )
        : accuracy < 65
          ? txt(
              lang,
              `Точность ${accuracy}%, это ниже комфортного уровня.`,
              `La precision es ${accuracy}%, por debajo del nivel comodo.`
            )
          : item.needsRepair
            ? txt(lang, "Навык отмечен как требующий повторения.", "El skill quedo marcado para refuerzo.")
            : txt(
                lang,
                "Есть повторяющиеся ошибки в этом типе задач.",
                "Hay errores repetidos en este tipo de ejercicios."
              );
    const nextStep =
      risk === "high"
        ? txt(
            lang,
            "Вернуться к простым заданиям по навыку на 5-7 минут.",
            "Volver a ejercicios simples del skill por 5-7 minutos."
          )
        : txt(
            lang,
            "Дать короткое повторение и проверить результат в следующей сессии.",
            "Hacer un repaso corto y revisar resultado en la proxima sesion."
          );

    insights.push({
      skillId: item.skillId,
      skillName: name,
      risk,
      reason,
      nextStep,
      accuracy,
      mistakes: item.wrong,
      score: riskScore,
    });
  }

  return insights
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ score, ...rest }) => rest);
}

export function getProgressTrend(state: ProgressState): ProgressTrend {
  const recent = state.sessions.slice(-8);
  if (recent.length < 4) return "not_enough_data";
  const accuracies = recent.map((session) =>
    session.questionsAnswered > 0 ? (session.correctAnswers / session.questionsAnswered) * 100 : 0
  );
  const mid = Math.floor(accuracies.length / 2);
  const prev = average(accuracies.slice(0, mid));
  const curr = average(accuracies.slice(mid));
  if (prev == null || curr == null) return "not_enough_data";
  const delta = curr - prev;
  if (delta >= 6) return "improving";
  if (delta <= -6) return "declining";
  return "stable";
}

export function calculateOverallStatus(args: {
  accuracy: number | null;
  weakSkills: WeakSkillInsight[];
  trend: ProgressTrend;
}): ParentStatus {
  const { accuracy, weakSkills, trend } = args;
  if (accuracy == null) return "not_enough_data";
  const hasHighRisk = weakSkills.some((skill) => skill.risk === "high");
  if (accuracy < 60 || hasHighRisk || trend === "declining") return "needs_help";
  if (accuracy < 80 || weakSkills.length > 0) return "attention";
  return "stable";
}

export function getParentNextStep(input: {
  overallStatus: ParentStatus;
  weakSkills: WeakSkillInsight[];
  trend: ProgressTrend;
  lastSession?: ProgressState["sessions"][number];
  skillProgress: ProgressState["skillProgress"];
  lang: Lang;
}): ParentNextStep {
  const { lang } = input;
  const primaryWeak = input.weakSkills[0];

  // Compute sessions-per-week recommendation based on skillProgress status
  const primarySkillStatus = primaryWeak
    ? (input.skillProgress[primaryWeak.skillId]?.status ?? "learning")
    : null;
  const sessionsRecommended =
    primarySkillStatus === "needs_repair" ? 3 :
    primarySkillStatus === "learning"     ? 2 :
    primarySkillStatus === "stable"       ? 1 :
    primaryWeak ? 2 : 1;
  if (primaryWeak) {
    return {
      title: txt(lang, "Повторить слабый навык", "Reforzar skill debil"),
      description: txt(
        lang,
        `Лучше начать с простых заданий по теме "${primaryWeak.skillName}", потому что там больше всего ошибок.`,
        `Conviene empezar con ejercicios simples de "${primaryWeak.skillName}" porque ahi se concentran mas errores.`
      ),
      actionLabel: txt(
        lang,
        `Начать тренировку: ${primaryWeak.skillName}`,
        `Practicar ahora: ${primaryWeak.skillName}`
      ),
      targetSkill: primaryWeak.skillId,
      difficulty: "easy",
      sessionsRecommended,
    };
  }
  if (input.overallStatus === "stable") {
    return {
      title: txt(lang, "Закрепить успех", "Consolidar avance"),
      description: txt(
        lang,
        "Результат стабильный. Дайте короткую тренировку без повышения сложности.",
        "El resultado es estable. Conviene una practica corta sin subir dificultad."
      ),
      actionLabel: txt(lang, "Закрепить текущий уровень", "Consolidar nivel actual"),
      difficulty: "normal",
      sessionsRecommended,
    };
  }
  if (input.trend === "declining") {
    return {
      title: txt(lang, "Снизить сложность на шаг", "Bajar dificultad un paso"),
      description: txt(
        lang,
        "Точность падает. Лучше временно упростить задания и вернуть уверенность.",
        "La precision viene bajando. Mejor simplificar un poco para recuperar confianza."
      ),
      actionLabel: txt(lang, "Запустить мягкое повторение", "Iniciar repaso suave"),
      difficulty: "easy",
      sessionsRecommended,
    };
  }
  return {
    title: txt(lang, "Поддержать темп", "Mantener ritmo"),
    description: txt(
      lang,
      "Нужна короткая, но регулярная практика: 8-10 минут сегодня.",
      "Conviene una practica corta y constante: 8-10 minutos hoy."
    ),
    actionLabel: txt(lang, "Начать короткую сессию", "Iniciar sesion corta"),
    difficulty: "normal",
    sessionsRecommended,
  };
}

export function buildParentDashboardInsight(state: ProgressState, lang: Lang): ParentDashboardInsight {
  const last7 = state.sessions.slice(-7);
  const totalAnswered = last7.reduce((sum, session) => sum + session.questionsAnswered, 0);
  const totalCorrect = last7.reduce((sum, session) => sum + session.correctAnswers, 0);
  const focusedMinutes = Math.round(last7.reduce((sum, session) => sum + session.activeSeconds, 0) / 60);
  const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : null;
  const weakSkills = getWeakSkills(state, lang, 3);
  const trend = getProgressTrend(state);
  const status = calculateOverallStatus({ accuracy, weakSkills, trend });
  const activeDays = new Set(last7.map((session) => (session.endedAt ?? session.startedAt).slice(0, 10))).size;
  const completedTasks = totalAnswered;
  const nextStep = getParentNextStep({
    overallStatus: status,
    weakSkills,
    trend,
    lastSession: state.sessions[state.sessions.length - 1],
    skillProgress: state.skillProgress,
    lang,
  });

  const primaryWeak = weakSkills[0];
  const weakSkillTrend = primaryWeak
    ? (() => {
        const delta7d = getSkillImprovementDelta(state, primaryWeak.skillId, 7);
        const points = getSkillTimeSeries(state, primaryWeak.skillId, 5).map((point) => ({
          date: point.date,
          accuracy: point.accuracy,
        }));
        const explanation =
          delta7d == null
            ? txt(
                lang,
                "Пока недостаточно данных по этому навыку, нужно ещё 1-2 занятия.",
                "Todavia faltan datos en este skill; hacen falta 1-2 sesiones mas."
              )
            : delta7d >= 6
              ? txt(
                  lang,
                  `Навык улучшается: за неделю точность выросла на ${delta7d} п.п.`,
                  `El skill mejora: en 7 dias la precision subio ${delta7d} pp.`
                )
              : delta7d <= -6
                ? txt(
                    lang,
                    `Есть просадка: за неделю точность снизилась на ${Math.abs(delta7d)} п.п.`,
                    `Hay caida: en 7 dias la precision bajo ${Math.abs(delta7d)} pp.`
                  )
                : txt(
                    lang,
                    "Динамика почти ровная: навык пока держится на одном уровне.",
                    "La dinamica esta estable: el skill se mantiene sin cambios fuertes."
                  );
        return {
          skillId: primaryWeak.skillId,
          skillName: primaryWeak.skillName,
          delta7d,
          points,
          explanation,
        };
      })()
    : undefined;

  const trendExplanation =
    trend === "improving"
      ? txt(
          lang,
          "За последние занятия ошибок стало меньше: навык закрепляется.",
          "En las ultimas sesiones hubo menos errores: el aprendizaje se esta consolidando."
        )
      : trend === "stable"
        ? txt(
            lang,
            "Результат держится на одном уровне: продолжайте короткие регулярные тренировки.",
            "El rendimiento se mantiene parejo: conviene seguir con practicas cortas y constantes."
          )
        : trend === "declining"
          ? txt(
              lang,
              "Точность снизилась: пока лучше не повышать сложность и закрепить базу.",
              "La precision bajo: por ahora no conviene subir dificultad y es mejor reforzar base."
            )
          : txt(
              lang,
              "Пока мало данных: после 1-2 занятий динамика станет понятнее.",
              "Todavia hay pocos datos: con 1-2 sesiones mas la tendencia sera mas clara."
            );

  const statusTitle =
    status === "stable"
      ? txt(lang, "Всё стабильно", "Todo estable")
      : status === "attention"
        ? txt(lang, "Есть зона внимания", "Hay una zona de atencion")
        : status === "needs_help"
          ? txt(lang, "Нужно помочь", "Hace falta apoyo")
          : txt(lang, "Пока мало данных", "Aun faltan datos");

  const statusReason =
    status === "stable"
      ? txt(
          lang,
          "Ребёнок уверенно справляется с текущим уровнем.",
          "Tu hijo/a viene resolviendo con seguridad el nivel actual."
        )
      : status === "attention"
        ? txt(
            lang,
            "Прогресс есть, но один из навыков пока нестабилен.",
            "Hay progreso, pero un skill aun no esta estable."
          )
        : status === "needs_help"
          ? txt(
              lang,
              "Слишком много ошибок в одном типе задач, лучше вернуться к базе.",
              "Se concentran muchos errores en un tipo de ejercicio: mejor volver a base."
            )
          : txt(
              lang,
              "После 1-2 коротких занятий здесь появится точный вывод.",
              "Con 1-2 sesiones cortas mas, este panel dara una conclusion precisa."
            );

  const summary = `${statusTitle}. ${statusReason}`;
  const streak =
    state.sessions.length > 0
      ? Math.max(
          0,
          ...state.sessions.slice(-3).map((session) => {
            const answered = Math.max(session.questionsAnswered, 1);
            return Math.round((session.correctAnswers / answered) * 10);
          })
        )
      : 0;

  return {
    status,
    summary,
    statusTitle,
    statusReason,
    weakSkills,
    trend,
    trendExplanation,
    nextStep,
    metrics: {
      accuracy: accuracy ?? undefined,
      activeDays,
      completedTasks,
      weakSkillsCount: weakSkills.length,
      focusedMinutes,
    },
    explainers: {
      accuracy:
        accuracy == null
          ? txt(lang, "Недостаточно данных по точности.", "Todavia no hay datos suficientes de precision.")
          : explainMetric("accuracy", accuracy, lang),
      streak: explainMetric("streak", streak, lang),
      weakSkills:
        weakSkills.length === 0
          ? txt(lang, "Критичных провалов по навыкам не видно.", "No aparecen riesgos criticos por skill.")
          : txt(
              lang,
              "Риски считаются по точности, повторяющимся ошибкам, последним сессиям и статусу повторения.",
              "El riesgo combina precision, errores repetidos, sesiones recientes y estado de repaso."
            ),
    },
    weakSkillTrend,
  };
}
