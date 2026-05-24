import type { LocalizedText } from "../i18n/types";
import {
  CONTEXT_BANK,
  CONTEXT_THEMES,
  type ContextEntry,
  type ContextScenario,
  type ProblemTheme,
  type StoryTemplateId,
} from "./contextBank";
import { REAL_WORLD_CONSTANTS, STADIUM_KEYS, type StadiumKey } from "../data/realWorldConstants";

export type StoryBuildInput = {
  template: StoryTemplateId;
  params: number[];
  difficulty: number;
  idSeed: string;
  locale?: "es-AR";
  recentScenarioHistory: string[];
  forcedThemeCode?: number;
  forcedScenarioCode?: number;
  forcedStadiumKey?: StadiumKey;
};

export type StoryBuildOutput = {
  theme: ProblemTheme;
  themeCode: number;
  scenarioId: string;
  scenarioCode: number;
  prompt: LocalizedText;
  stadiumKey?: StadiumKey;
  stadiumName?: string;
};

type PlaceholderMap = Record<string, string | number>;

function hashText(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function weightedPick<T>(items: Array<{ item: T; weight: number }>, seed: number): T {
  const total = items.reduce((sum, it) => sum + Math.max(it.weight, 0), 0);
  if (total <= 0) return items[0]!.item;
  const target = seed % total;
  let acc = 0;
  for (const it of items) {
    acc += Math.max(it.weight, 0);
    if (target < acc) return it.item;
  }
  return items[items.length - 1]!.item;
}

function selectTheme(template: StoryTemplateId, seed: number, recentScenarioHistory: string[]): ProblemTheme {
  const previousTheme = recentScenarioHistory[recentScenarioHistory.length - 1]?.split(":")[0] as ProblemTheme | undefined;
  const candidates = CONTEXT_THEMES.filter(
    (theme) =>
      CONTEXT_BANK[theme].templates.includes(template) &&
      CONTEXT_BANK[theme].scenarios.some((scenario) => scenario.templates.includes(template))
  );
  if (candidates.length === 0) {
    return "shop";
  }
  const weighted = candidates.map((theme) => ({
    item: theme,
    weight: CONTEXT_BANK[theme].weight - (previousTheme === theme ? Math.max(1, Math.floor(CONTEXT_BANK[theme].weight / 4)) : 0),
  }));
  return weightedPick(weighted, seed);
}

function selectScenario(theme: ProblemTheme, template: StoryTemplateId, seed: number, recentScenarioHistory: string[]): ContextScenario {
  const entry = CONTEXT_BANK[theme];
  const relevant = entry.scenarios.filter((scenario) => scenario.templates.includes(template));
  if (relevant.length === 0) {
    return {
      id: "fallback",
      antiRepeatKey: `${theme}.fallback`,
      label: { es: "Fallback", ru: "Базовый" },
      templates: [template],
      patterns: {},
    };
  }
  const blockedKeys = new Set(recentScenarioHistory.slice(-2).map((key) => key.split(":")[0]));
  const free = relevant.filter((scenario) => !blockedKeys.has(scenario.antiRepeatKey));
  const pool = free.length > 0 ? free : relevant;
  return pool[seed % pool.length]!;
}

function difficultyClause(entry: ContextEntry, difficulty: number): string {
  if (difficulty <= 2) return entry.difficultyModifiers.easy;
  if (difficulty <= 3) return entry.difficultyModifiers.medium;
  return entry.difficultyModifiers.hard;
}

function fraction(n: number, d: number): string {
  return `${n}/${d}`;
}

function makeVars(
  template: StoryTemplateId,
  params: number[],
  extra?: { stadiumName?: string }
): PlaceholderMap {
  const vars: PlaceholderMap = {};
  if (extra?.stadiumName) {
    vars.stadiumName = extra.stadiumName;
  }
  if (
    template === "fraction-of-number" ||
    template === "fraction-of-number-remainder"
  ) {
    const [num, den, total] = params;
    vars.num = num;
    vars.den = den;
    vars.total = total;
    vars.fraction = fraction(num, den);
  } else if (
    template === "fraction-add-diff-den" ||
    template === "fraction-sub-diff-den" ||
    template === "fraction-word-add"
  ) {
    const [n1, d1, n2, d2] = params;
    vars.n1 = n1;
    vars.d1 = d1;
    vars.n2 = n2;
    vars.d2 = d2;
    vars.f1 = fraction(n1, d1);
    vars.f2 = fraction(n2, d2);
  } else if (template === "discount-price" || template === "discount-amount") {
    const [amount, pct] = params;
    vars.amount = amount;
    vars.pct = pct;
  } else if (template === "discount-budget" || template === "discount-leftover-money") {
    const [budget, price, pct] = params;
    vars.budget = budget;
    vars.price = price;
    vars.pct = pct;
  } else if (template === "compare-discounts") {
    const [priceA, pctA, priceB, pctB] = params;
    vars.priceA = priceA;
    vars.pctA = pctA;
    vars.priceB = priceB;
    vars.pctB = pctB;
  } else if (template === "double-discount") {
    const [price, pctA, pctB] = params;
    vars.price = price;
    vars.pctA = pctA;
    vars.pctB = pctB;
  } else if (template === "reverse-discount") {
    const [finalPrice, pct] = params;
    vars.finalPrice = finalPrice;
    vars.pct = pct;
  }
  return vars;
}

function pickStadium(seed: number, forcedStadiumKey?: StadiumKey): { key: StadiumKey; name: string } {
  if (forcedStadiumKey) {
    return {
      key: forcedStadiumKey,
      name: REAL_WORLD_CONSTANTS.stadiums[forcedStadiumKey].name,
    };
  }
  const key = STADIUM_KEYS[seed % STADIUM_KEYS.length]!;
  return { key, name: REAL_WORLD_CONSTANTS.stadiums[key].name };
}

function injectNumbers(pattern: string, vars: PlaceholderMap): string {
  return pattern.replace(/\$\{([a-zA-Z0-9_]+)\}/g, (_, key: string) => String(vars[key] ?? ""));
}

function validateNaturalness(prompt: LocalizedText): LocalizedText {
  const es = prompt.es.trim().length > 0 ? prompt.es.trim() : "Resuelve la situacion y responde.";
  const ru = prompt.ru.trim().length > 0 ? prompt.ru.trim() : "Реши ситуацию и ответь.";
  return { es, ru };
}

export function buildContextStory(input: StoryBuildInput): StoryBuildOutput {
  const seed = hashText(`${input.idSeed}:${input.template}:${input.params.join("_")}:${input.difficulty}`);
  const theme =
    input.forcedThemeCode == null
      ? selectTheme(input.template, seed, input.recentScenarioHistory)
      : CONTEXT_THEMES[Math.abs(input.forcedThemeCode) % CONTEXT_THEMES.length]!;
  const themeCode = input.forcedThemeCode ?? CONTEXT_THEMES.indexOf(theme);
  const scenario =
    input.forcedScenarioCode == null
      ? selectScenario(theme, input.template, seed + 97, input.recentScenarioHistory)
      : CONTEXT_BANK[theme].scenarios[Math.abs(input.forcedScenarioCode) % Math.max(1, CONTEXT_BANK[theme].scenarios.length)] ??
        selectScenario(theme, input.template, seed + 97, input.recentScenarioHistory);
  const scenarioCode =
    input.forcedScenarioCode ??
    CONTEXT_BANK[theme].scenarios.findIndex((s) => s.id === scenario.id);
  const patterns = scenario.patterns[input.template];
  const fallback = CONTEXT_BANK[theme].difficultyModifiers;
  const difficultyText = difficultyClause(CONTEXT_BANK[theme], input.difficulty);
  const basePattern =
    patterns && patterns.length > 0
      ? patterns[seed % patterns.length]!
      : {
          es: `Escenario ${scenario.label.es}: resuelve la cuenta. ${difficultyText}`,
          ru: `Сценарий ${scenario.label.ru}: реши задачу. ${difficultyText}`,
        };

  const needsStadiumName =
    theme === "stadium" &&
    (
      input.template === "discount-price" ||
      input.template === "discount-amount" ||
      input.template === "discount-budget" ||
      input.template === "discount-leftover-money" ||
      input.template === "compare-discounts" ||
      input.template === "double-discount" ||
      input.template === "reverse-discount"
    );
  const stadium = needsStadiumName ? pickStadium(seed + scenarioCode * 31, input.forcedStadiumKey) : null;
  const vars = makeVars(input.template, input.params, {
    stadiumName: stadium?.name,
  });
  const built = validateNaturalness({
    es: injectNumbers(basePattern.es, vars),
    ru: injectNumbers(basePattern.ru, vars),
  });

  input.recentScenarioHistory.push(`${scenario.antiRepeatKey}:${scenario.id}:${scenarioCode}`);

  return {
    theme,
    themeCode,
    scenarioId: scenario.id,
    scenarioCode: Math.max(0, scenarioCode),
    prompt: built,
    stadiumKey: stadium?.key,
    stadiumName: stadium?.name,
  };
}
