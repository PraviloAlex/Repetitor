import type { Question } from "./types";
import { getTemplatesForSkillTags } from "./skills";
import { buildContextStory } from "./contextEngine";
import type { StoryTemplateId } from "./contextBank";
import {
  REAL_WORLD_CONSTANTS,
  getContextNumber,
  type StadiumKey,
} from "../data/realWorldConstants";

export type TemplateId =
  | "add"
  | "sub"
  | "mul"
  | "exact-division"
  | "order-of-operations"
  | "shopping-change"
  | "divisibility-rule"
  | "next-multiple"
  | "count-multiples"
  | "conditional-number"
  | "missing-digit-divisibility"
  | "divisibility-select-all"
  | "fraction-simplify"
  | "fraction-compare"
  | "fraction-compare-to-unit"
  | "fraction-compare-same-den"
  | "fraction-equivalent-missing"
  | "fraction-equivalent-true-false"
  | "fraction-add-same-den"
  | "fraction-sub-same-den"
  | "fraction-add-whole-and-fraction"
  | "fraction-of-number"
  | "fraction-of-number-remainder"
  | "fraction-part-of-set"
  | "fraction-complement-to-whole"
  | "mixed-to-improper"
  | "decimal-add"
  | "decimal-sub"
  | "decimal-compare"
  | "decimal-times-10"
  | "decimal-money-change"
  | "decimal-round"
  | "decimal-measure-convert"
  | "percent-of"
  | "discount-price"
  | "increase-price"
  | "compare-discounts"
  | "discount-budget"
  | "reverse-discount"
  | "discount-leftover-money"
  | "percent-find-rate"
  | "discount-amount"
  | "discount-quantity-total"
  | "discount-quantity-savings"
  | "double-discount"
  | "increase-budget-gap"
  | "rect-area"
  | "rect-perimeter"
  | "compound-area"
  | "area-compare"
  | "perimeter-fence-cost"
  | "rect-missing-side-area"
  | "rect-missing-side-perimeter"
  | "square-area"
  | "square-perimeter"
  | "rect-missing-side-perimeter-with-half"
  // ── Fracciones profundas (ingreso) ──────────────────────────────────────
  | "fraction-add-diff-den"
  | "fraction-sub-diff-den"
  | "fraction-mul"
  | "fraction-div"
  | "fraction-word-add"
  // ── Divisibilidad profunda (ingreso) ────────────────────────────────────
  | "divisibility-prime-factor"
  | "divisibility-gcd"
  | "divisibility-lcm"
  | "divisibility-lcm-word"
  | "divisibility-trap"
  | "inequality-range"
  | "division-find-n"
  | "geometry-formula-choice"
  | "multi-step-word-problem";

const TOPIC_TEMPLATES: Record<string, TemplateId[]> = {
  operaciones: ["add", "sub", "mul", "exact-division", "order-of-operations", "shopping-change", "inequality-range"],
  divisibilidad: [
    "divisibility-rule", "next-multiple", "count-multiples", "conditional-number",
    "missing-digit-divisibility", "divisibility-select-all",
    "divisibility-prime-factor", "divisibility-gcd", "divisibility-lcm",
    "divisibility-lcm-word", "divisibility-trap", "division-find-n",
  ],
  fracciones: [
    "fraction-simplify", "fraction-compare", "fraction-compare-to-unit", "fraction-compare-same-den",
    "fraction-equivalent-missing", "fraction-equivalent-true-false",
    "fraction-add-same-den", "fraction-sub-same-den", "fraction-add-whole-and-fraction",
    "fraction-of-number", "fraction-of-number-remainder", "fraction-part-of-set", "fraction-complement-to-whole", "mixed-to-improper",
    "fraction-add-diff-den", "fraction-sub-diff-den", "fraction-mul", "fraction-div", "fraction-word-add", "multi-step-word-problem",
  ],
  decimales: ["decimal-add", "decimal-sub", "decimal-compare", "decimal-times-10", "decimal-money-change", "decimal-round", "decimal-measure-convert"],
  porcentajes: ["percent-of", "percent-find-rate", "discount-price", "discount-amount", "discount-quantity-total", "discount-quantity-savings", "increase-price", "increase-budget-gap", "compare-discounts", "discount-budget", "discount-leftover-money", "double-discount", "reverse-discount"],
  geometria: ["rect-area", "rect-perimeter", "compound-area", "area-compare", "perimeter-fence-cost", "rect-missing-side-area", "square-area", "rect-missing-side-perimeter", "rect-missing-side-perimeter-with-half", "square-perimeter", "geometry-formula-choice"],
};

export type GeneratorOptions = {
  difficultyShift?: -1 | 0 | 1;
  focusSkillTags?: string[];
  minDifficulty?: 1 | 2 | 3 | 4 | 5;
  templateAllowlist?: TemplateId[];
};

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return function () {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function randInt(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

function pick<T>(rng: () => number, values: T[]): T {
  return values[randInt(rng, 0, values.length - 1)];
}

function pickRealWorldPrice(rng: () => number): number {
  const scenario = pick(rng, [
    "stadium.child_ticket.bombonera",
    "stadium.child_ticket.monumental",
    "stadium.child_ticket.amalfitani",
    "stadium.child_ticket.cilindro",
    "stadium.child_ticket.gasometro",
    "panini.pack_price",
    "shop.album_price",
    "shop.football_ball_price",
    "food.cola_500ml",
  ] as const);

  const theme = scenario.startsWith("stadium")
    ? "stadium"
    : scenario.startsWith("panini")
    ? "panini"
    : scenario.startsWith("shop")
      ? "shop"
      : "worldcup";

  return getContextNumber({
    theme,
    scenario,
    variationPercent: REAL_WORLD_CONSTANTS.variationRules.productPricePercent / 100,
    rng,
  });
}

function stadiumTicketScenarioFor(stadiumKey: StadiumKey):
  | "stadium.child_ticket.bombonera"
  | "stadium.child_ticket.monumental"
  | "stadium.child_ticket.amalfitani"
  | "stadium.child_ticket.cilindro"
  | "stadium.child_ticket.gasometro" {
  switch (stadiumKey) {
    case "laBombonera":
      return "stadium.child_ticket.bombonera";
    case "estadioMonumental":
      return "stadium.child_ticket.monumental";
    case "joseAmalfitani":
      return "stadium.child_ticket.amalfitani";
    case "elCilindro":
      return "stadium.child_ticket.cilindro";
    case "nuevoGasometro":
      return "stadium.child_ticket.gasometro";
    default:
      return "stadium.child_ticket.bombonera";
  }
}

function isStadiumDiscountScenarioId(scenarioId: string): boolean {
  return (
    scenarioId === "stadium-monumental-ticket" ||
    scenarioId === "stadium-child-ticket" ||
    scenarioId === "stadium-training-perimeter" ||
    scenarioId === "stadium-banner-area"
  );
}

function pickPromoDiscountBySeed(seed: number): number {
  const values = REAL_WORLD_CONSTANTS.panini.promo_discounts;
  return values[Math.abs(seed) % values.length]!;
}

function clampDifficulty(difficulty: number): 1 | 2 | 3 | 4 | 5 {
  return Math.min(Math.max(Math.round(difficulty), 1), 5) as 1 | 2 | 3 | 4 | 5;
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b);
}

function cleanDecimal(value: number): string {
  return Number(value.toFixed(2)).toString();
}

function decimalComma(value: number): string {
  return cleanDecimal(value).replace(".", ",");
}

function fraction(n: number, d: number): string {
  return `${n}/${d}`;
}

function divisibilitySkill(divisor: number): string {
  return `divisibility-${divisor}`;
}

function makeId(topicId: string, template: TemplateId, difficulty: number, params: number[]): string {
  return `gen-${topicId}-${template}-${clampDifficulty(difficulty)}-${params.join("_")}`;
}

function baseQuestion(
  topicId: string,
  template: TemplateId,
  difficulty: number,
  params: number[],
  type: Question["type"] = "numeric_input"
) {
  return {
    id: makeId(topicId, template, difficulty, params),
    topicId,
    difficulty: clampDifficulty(difficulty),
    type,
    verified: true,
    generator: { template },
    cardType: "training" as const,
  };
}

function phraseVariant<T>(
  topicId: string,
  template: TemplateId,
  difficulty: number,
  params: number[],
  variants: T[]
): T {
  let hash = 2166136261;
  const raw = `${topicId}:${template}:${clampDifficulty(difficulty)}:${params.join(":")}`;
  for (let i = 0; i < raw.length; i++) {
    hash ^= raw.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return variants[(hash >>> 0) % variants.length];
}

function hashText(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function promptPatternKey(text: string): string {
  return text
    .toLowerCase()
    .replace(/\d+[.,]?\d*/g, "#")
    .replace(/\s+/g, " ")
    .trim();
}

function parseGeneratedId(id: string):
  | { topicId: string; template: TemplateId; difficulty: number; params: number[] }
  | null {
  const legacy = id.split("-");
  if (legacy.length === 5 && ["add", "sub", "mul"].includes(legacy[1])) {
    return {
      topicId: "operaciones",
      template: legacy[1] as TemplateId,
      difficulty: Number(legacy[2]),
      params: [Number(legacy[3]), Number(legacy[4])],
    };
  }
  const match = /^gen-([a-z]+)-(.+)-([1-5])-([0-9._]+)$/.exec(id);
  if (!match) return null;
  const [, topicId, template, difficulty, rawParams] = match;
  return {
    topicId,
    template: template as TemplateId,
    difficulty: Number(difficulty),
    params: rawParams.split("_").map(Number),
  };
}

function isStoryTemplate(template: TemplateId): boolean {
  const STORY_TEMPLATES = new Set<TemplateId>([
    "fraction-of-number",
    "fraction-of-number-remainder",
    "fraction-add-diff-den",
    "fraction-sub-diff-den",
    "fraction-word-add",
    "discount-price",
    "discount-amount",
    "discount-budget",
    "discount-leftover-money",
    "compare-discounts",
    "double-discount",
    "reverse-discount",
  ]);
  return STORY_TEMPLATES.has(template);
}

/* legacy story block disabled: data-driven context engine is used via buildContextStory
function pickContextTheme(seed: number, recentContextHistory: string[]): { theme: never; themeCode: number } {
  const first = THEME_PRIORITY[seed % THEME_PRIORITY.length];
  const previous = recentContextHistory[recentContextHistory.length - 1]?.split(":")[0];
  if (first !== previous) return { theme: first, themeCode: seed % THEME_PRIORITY.length };
  for (let offset = 1; offset < THEME_PRIORITY.length; offset += 1) {
    const idx = (seed + offset) % THEME_PRIORITY.length;
    const alt = THEME_PRIORITY[idx];
    if (alt !== previous) return { theme: alt, themeCode: idx };
  }
  return { theme: first, themeCode: seed % THEME_PRIORITY.length };
}

function contextualPrompt(question: Question, template: TemplateId, params: number[], theme: ProblemTheme): Question {
  const p = params;
  let promptEs = question.prompt.es;
  let promptRu = question.prompt.ru;

  if (template === "fraction-of-number") {
    const [num, den, total] = p;
    if (theme === "panini") {
      promptEs = `En un pack hay ${total} figuritas y ${fraction(num, den)} son de seleccionados. Que parte del pack es esa?`;
      promptRu = `В наборе ${total} наклеек, и ${fraction(num, den)} — это игроки сборных. Какую часть набора это составляет?`;
    } else if (theme === "minecraft") {
      promptEs = `Para una pared hay ${total} bloques. Si ${fraction(num, den)} son de vidrio, cuantos bloques son?`;
      promptRu = `Для стены нужно ${total} блоков. Если ${fraction(num, den)} — стеклянные, сколько это блоков?`;
    }
  }

  if (template === "fraction-of-number-remainder") {
    const [num, den, total] = p;
    if (theme === "football" || theme === "worldcup") {
      promptEs = `En una tribuna hay ${total} lugares. Se ocupa ${fraction(num, den)}. Cuantos quedan libres?`;
      promptRu = `На трибуне ${total} мест. Занято ${fraction(num, den)}. Сколько мест осталось свободно?`;
    } else if (theme === "panini") {
      promptEs = `Tomas tiene ${total} figuritas; cambia ${fraction(num, den)}. Cuantas le quedan?`;
      promptRu = `У Томаса ${total} наклеек; он обменял ${fraction(num, den)}. Сколько осталось?`;
    }
  }

  if (template === "fraction-add-diff-den" || template === "fraction-word-add") {
    const [n1, d1, n2, d2] = p;
    if (theme === "panini") {
      promptEs = `En el album, el lunes completo ${fraction(n1, d1)} de una pagina y el martes ${fraction(n2, d2)}. Que fraccion completo en total?`;
      promptRu = `В альбоме в понедельник заполнил ${fraction(n1, d1)} страницы, во вторник ${fraction(n2, d2)}. Какую часть заполнил всего?`;
    } else if (theme === "building") {
      promptEs = `En una obra se levanto ${fraction(n1, d1)} de una pared y luego ${fraction(n2, d2)}. Que parte de la pared ya esta hecha?`;
      promptRu = `На стройке подняли ${fraction(n1, d1)} стены, потом ещё ${fraction(n2, d2)}. Какая часть стены уже готова?`;
    } else if (theme === "minecraft") {
      promptEs = `En Minecraft, Alex construyo ${fraction(n1, d1)} del muro y despues ${fraction(n2, d2)} mas. Cuanto muro completo en total?`;
      promptRu = `В Minecraft Алекс построил ${fraction(n1, d1)} стены и потом ещё ${fraction(n2, d2)}. Сколько стены готово всего?`;
    }
  }

  if (template === "fraction-sub-diff-den") {
    const [n1, d1, n2, d2] = p;
    if (theme === "football" || theme === "stadium") {
      promptEs = `En un sector del estadio estaba ocupado ${fraction(n1, d1)} y salio ${fraction(n2, d2)} de la gente. Que fraccion sigue ocupada?`;
      promptRu = `В секторе стадиона было занято ${fraction(n1, d1)}, затем ушло ${fraction(n2, d2)} людей. Какая доля сектора остаётся занятой?`;
    } else if (theme === "panini") {
      promptEs = `De una caja de figuritas raras, se tenia ${fraction(n1, d1)} y se intercambio ${fraction(n2, d2)}. Que fraccion queda?`;
      promptRu = `Из коллекции редких наклеек было ${fraction(n1, d1)}, обменяли ${fraction(n2, d2)}. Какая часть осталась?`;
    }
  }

  if (template === "discount-price") {
    const [amount, pct] = p;
    if (theme === "panini") {
      promptEs = `Un pack Panini cuesta $${amount}. Con descuento del ${pct}% por torneo, cuanto cuesta ahora?`;
      promptRu = `Пак Panini стоит $${amount}. По акции турнира скидка ${pct}%. Сколько стоит теперь?`;
    } else if (theme === "football") {
      promptEs = `La entrada infantil salia $${amount} y tiene ${pct}% de descuento. Precio final?`;
      promptRu = `Детский билет стоил $${amount} и имеет скидку ${pct}%. Какая итоговая цена?`;
    } else if (theme === "minecraft") {
      promptEs = `Un kit de bloques cuesta ${amount} monedas y tiene ${pct}% off. Cuanto pagas?`;
      promptRu = `Набор блоков стоит ${amount} монет и имеет скидку ${pct}%. Сколько платишь?`;
    }
  }

  if (template === "discount-amount") {
    const [amount, pct] = p;
    if (theme === "panini") {
      promptEs = `En la tienda de figuritas, un pack vale $${amount} y hay ${pct}% de descuento. Cuanto ahorras?`;
      promptRu = `В магазине наклеек пак стоит $${amount}, скидка ${pct}%. Сколько экономишь?`;
    } else if (theme === "shop") {
      promptEs = `Un producto cuesta $${amount} con rebaja ${pct}%. Cual es el monto del descuento?`;
      promptRu = `Товар стоит $${amount}, скидка ${pct}%. Какова сумма скидки?`;
    }
  }

  if (template === "discount-budget" || template === "discount-leftover-money") {
    const [budget, price, pct] = p;
    if (theme === "panini") {
      promptEs = `Tenes $${budget} para figuritas. Un combo sale $${price} con ${pct}% off. Cuanto dinero te queda?`;
      promptRu = `У тебя $${budget} на наклейки. Набор стоит $${price} со скидкой ${pct}%. Сколько денег останется?`;
    } else if (theme === "football") {
      promptEs = `Llevas $${budget} para entradas. El precio es $${price} con ${pct}% de descuento. Cuanto sobra?`;
      promptRu = `У тебя $${budget} на билеты. Цена $${price} со скидкой ${pct}%. Сколько останется?`;
    }
  }

  if (template === "compare-discounts") {
    const [priceA, pctA, priceB, pctB] = p;
    if (theme === "football" || theme === "worldcup") {
      promptEs = `Para el partido hay dos promos: A ($${priceA}, ${pctA}% off) y B ($${priceB}, ${pctB}% off). Cual conviene mas?`;
      promptRu = `На матч две акции: A ($${priceA}, ${pctA}% скидка) и B ($${priceB}, ${pctB}% скидка). Что выгоднее?`;
    } else if (theme === "panini") {
      promptEs = `Dos locales venden packs: A $${priceA} (-${pctA}%) y B $${priceB} (-${pctB}%). Que oferta termina mas barata?`;
      promptRu = `Два магазина продают паки: A $${priceA} (-${pctA}%) и B $${priceB} (-${pctB}%). Где итог дешевле?`;
    }
  }

  if (template === "double-discount") {
    const [price, pctA, pctB] = p;
    if (theme === "panini") {
      promptEs = `Pack coleccionable: precio $${price}. Primero promo ${pctA}% y despues ${pctB}% extra. Cuanto terminas pagando?`;
      promptRu = `Коллекционный пак: цена $${price}. Сначала скидка ${pctA}%, потом ещё ${pctB}%. Сколько платишь в итоге?`;
    } else if (theme === "shop") {
      promptEs = `Producto de $${price} con doble promo (${pctA}% y luego ${pctB}%). Precio final?`;
      promptRu = `Товар за $${price} с двойной акцией (${pctA}% и потом ${pctB}%). Итоговая цена?`;
    }
  }

  if (template === "reverse-discount") {
    const [finalPrice, pct] = p;
    if (theme === "football" || theme === "stadium") {
      promptEs = `Una entrada se pago $${finalPrice} tras un descuento del ${pct}%. Cual era el precio original?`;
      promptRu = `Билет оплатили за $${finalPrice} после скидки ${pct}%. Какова была исходная цена?`;
    } else if (theme === "panini") {
      promptEs = `Un pack de figuritas quedo en $${finalPrice} con ${pct}% de descuento. Cuanto costaba antes?`;
      promptRu = `Пак наклеек стал $${finalPrice} после скидки ${pct}%. Сколько стоил до скидки?`;
    }
  }

  return {
    ...question,
    prompt: { es: promptEs, ru: promptRu },
  };
}

*/
function applyStoryEngine(
  question: Question,
  parsed: { topicId: string; template: TemplateId; difficulty: number; params: number[] },
  recentContextHistory: string[]
): Question {
  if (!isStoryTemplate(parsed.template)) return question;
  const STORY_BASE_ARITY: Partial<Record<TemplateId, number>> = {
    "fraction-of-number": 3,
    "fraction-of-number-remainder": 3,
    "fraction-add-diff-den": 4,
    "fraction-sub-diff-den": 4,
    "fraction-word-add": 4,
    "discount-price": 2,
    "discount-amount": 2,
    "discount-budget": 3,
    "discount-leftover-money": 3,
    "compare-discounts": 4,
    "double-discount": 3,
    "reverse-discount": 2,
  };
  const expectedCore = STORY_BASE_ARITY[parsed.template] ?? parsed.params.length;
  const providedThemeCode = parsed.params.length >= 2 ? parsed.params[parsed.params.length - 2] : undefined;
  const providedScenarioCode = parsed.params.length >= 2 ? parsed.params[parsed.params.length - 1] : undefined;
  const hasContextCodes =
    parsed.params.length === expectedCore + 2 &&
    providedThemeCode != null &&
    providedScenarioCode != null &&
    providedThemeCode >= 0 &&
    providedThemeCode <= 7;
  const coreParams = hasContextCodes ? parsed.params.slice(0, -2) : parsed.params.slice();
  const initialStory = buildContextStory({
    template: parsed.template as StoryTemplateId,
    params: coreParams,
    difficulty: parsed.difficulty,
    idSeed: question.id,
    recentScenarioHistory: recentContextHistory,
    forcedThemeCode: hasContextCodes ? providedThemeCode : undefined,
    forcedScenarioCode: hasContextCodes ? providedScenarioCode : undefined,
  });

  const nextCoreParams = coreParams.slice();
  const isDiscountTemplate = new Set<TemplateId>([
    "discount-price",
    "discount-amount",
    "discount-budget",
    "discount-leftover-money",
    "compare-discounts",
    "double-discount",
    "reverse-discount",
  ]).has(parsed.template);

  if (
    !hasContextCodes &&
    isDiscountTemplate &&
    initialStory.theme === "stadium" &&
    initialStory.scenarioId &&
    isStadiumDiscountScenarioId(initialStory.scenarioId) &&
    initialStory.stadiumKey
  ) {
    const storySeed = hashText(`${question.id}:${initialStory.scenarioId}:${initialStory.stadiumKey}`);
    const storyRng = mulberry32(storySeed);
    const basePrice = getContextNumber({
      theme: "stadium",
      scenario: stadiumTicketScenarioFor(initialStory.stadiumKey),
      variationPercent: REAL_WORLD_CONSTANTS.variationRules.productPricePercent / 100,
      rng: storyRng,
    });
    const dA = pickPromoDiscountBySeed(storySeed);
    const dB = pickPromoDiscountBySeed(storySeed + 1);

    if (parsed.template === "discount-price" || parsed.template === "discount-amount") {
      nextCoreParams.splice(0, nextCoreParams.length, basePrice, dA);
    } else if (parsed.template === "discount-budget" || parsed.template === "discount-leftover-money") {
      const qty = initialStory.scenarioId === "stadium-training-perimeter" ? 3 : 1;
      const fullBudget = Math.max(basePrice * qty + 2000, Math.round(basePrice * qty * 1.4));
      nextCoreParams.splice(0, nextCoreParams.length, fullBudget, basePrice * qty, dA);
    } else if (parsed.template === "compare-discounts") {
      const priceB = Math.max(1000, Math.round(basePrice * (0.9 + storyRng() * 0.35)));
      nextCoreParams.splice(0, nextCoreParams.length, basePrice, dA, priceB, dB);
    } else if (parsed.template === "double-discount") {
      nextCoreParams.splice(0, nextCoreParams.length, basePrice, dA, dB);
    } else if (parsed.template === "reverse-discount") {
      const finalPrice = Math.max(1000, Math.round(basePrice * (1 - dA / 100)));
      nextCoreParams.splice(0, nextCoreParams.length, finalPrice, dA);
    }

    question = buildQuestion(parsed.topicId, parsed.template, parsed.difficulty, nextCoreParams);
  }

  const forcedStadiumKey = initialStory.stadiumKey;

  const story = buildContextStory({
    template: parsed.template as StoryTemplateId,
    params: nextCoreParams,
    difficulty: parsed.difficulty,
    idSeed: question.id,
    recentScenarioHistory: recentContextHistory,
    forcedThemeCode: initialStory.themeCode,
    forcedScenarioCode: initialStory.scenarioCode,
    forcedStadiumKey,
  });

  const nextParams = [...nextCoreParams, story.themeCode, story.scenarioCode];
  return {
    ...question,
    id: makeId(parsed.topicId, parsed.template, parsed.difficulty, nextParams),
    prompt: story.prompt,
  };
}

function withPromptVariation(question: Question): Question {
  if (question.topicId !== "fracciones" && question.topicId !== "porcentajes") return question;

  const idx = hashText(question.id) % 4;
  if (idx === 0) return question;

  const esBase = question.prompt.es.trim();
  const ruBase = question.prompt.ru.trim();

  const esPrompt =
    idx === 1
      ? `Resuelve: ${esBase}`
      : idx === 2
        ? `${esBase} Escribe solo el resultado final.`
        : `Mision rapida: ${esBase}`;

  const ruPrompt =
    idx === 1
      ? `Реши: ${ruBase}`
      : idx === 2
        ? `${ruBase} Запиши только итоговый ответ.`
        : `Быстрая миссия: ${ruBase}`;

  return {
    ...question,
    prompt: {
      es: esPrompt,
      ru: ruPrompt,
    },
  };
}

function withHintMicroSteps(question: Question): Question {
  const parsed = parseGeneratedId(question.id);
  if (!parsed) return question;

  if (parsed.template === "decimal-compare") {
    const [rawA, rawB] = parsed.params;
    const a = rawA / 100;
    const b = rawB / 100;
    return {
      ...question,
      hint: {
        es: `Paso 1: compara enteros (${Math.trunc(a)} vs ${Math.trunc(b)}). Paso 2: si empatan, compara decimales.`,
        ru: `Шаг 1: сравни целые части (${Math.trunc(a)} и ${Math.trunc(b)}). Шаг 2: если равны — сравни десятые/сотые.`,
      },
    };
  }

  if (parsed.template === "shopping-change") {
    const [priceA, countA, priceB, countB] = parsed.params;
    return {
      ...question,
      hint: {
        es: `Paso 1: ${countA} x ${priceA} y ${countB} x ${priceB}. Paso 2: suma esos totales. Paso 3: resta al dinero pagado.`,
        ru: `Шаг 1: ${countA} x ${priceA} и ${countB} x ${priceB}. Шаг 2: сложи суммы. Шаг 3: вычти из оплаты.`,
      },
    };
  }

  if (parsed.template === "divisibility-select-all") {
    const [divisor] = parsed.params;
    return {
      ...question,
      hint: {
        es: `Paso 1: revisa cada opcion. Paso 2: divide por ${divisor}. Solo una opcion da resto 0.`,
        ru: `Шаг 1: проверь каждый вариант. Шаг 2: раздели на ${divisor}. Только один вариант без остатка.`,
      },
    };
  }

  return question;
}

function withLanguagePolish(question: Question): Question {
  const parsed = parseGeneratedId(question.id);
  if (!parsed) return question;

  if (parsed.template === "divisibility-lcm-word") {
    const [a, b] = parsed.params;
    return {
      ...question,
      prompt: {
        es: `Dos ritmos: ${a} y ${b}. Si empiezan juntos, en cuanto vuelven a coincidir?`,
        ru: question.prompt.ru,
      },
      hint: {
        es: "Cuando dos ritmos coinciden, busca el MCM.",
        ru: question.hint?.ru ?? "",
      },
      explanation: {
        es: `Buscamos la primera coincidencia. Es el MCM de ${a} y ${b}.`,
        ru: question.explanation.ru,
      },
      commonMistake: {
        es: "Sumar los periodos en vez de buscar el MCM.",
        ru: question.commonMistake?.ru ?? "",
      },
    };
  }

  return question;
}

function buildOperaciones(template: TemplateId, difficulty: number, params: number[]): Question {
  const [a, b] = params;
  const base = baseQuestion("operaciones", template, difficulty, params);

  if (template === "add") {
    const answer = a + b;
    const prompt = phraseVariant("operaciones", template, difficulty, params, [
      { es: `Cuanto es ${a} + ${b}?`, ru: `Сколько будет ${a} + ${b}?` },
      { es: `Suma ${a} y ${b}.`, ru: `Сложи ${a} и ${b}.` },
      { es: `Si tenes ${a} y agregas ${b}, cuanto queda?`, ru: `Если есть ${a} и добавить ${b}, сколько получится?` },
    ]);
    return {
      ...base,
      prompt,
      answer: String(answer),
      explanation: {
        es: `${a} + ${b} = ${answer}. Suma por partes: decenas con decenas y unidades con unidades.`,
        ru: `${a} + ${b} = ${answer}. Складывай по частям: десятки с десятками, единицы с единицами.`,
      },
      hint: { es: `Empeza desde ${a} y agrega ${b}.`, ru: `Начни с ${a} и прибавь ${b}.` },
      commonMistake: { es: "Olvidar llevar una decena.", ru: "Забыть перенос десятка." },
      skillTags: ["addition"],
    };
  }

  if (template === "sub") {
    const answer = a - b;
    const prompt = phraseVariant("operaciones", template, difficulty, params, [
      { es: `Cuanto es ${a} - ${b}?`, ru: `Сколько будет ${a} - ${b}?` },
      { es: `Resta ${b} a ${a}.`, ru: `Вычти ${b} из ${a}.` },
      { es: `De ${a} sacamos ${b}. Cuanto queda?`, ru: `Из ${a} убрали ${b}. Сколько осталось?` },
    ]);
    return {
      ...base,
      prompt,
      answer: String(answer),
      explanation: {
        es: `${a} - ${b} = ${answer}. Resta por partes y revisa si hace falta pedir prestado.`,
        ru: `${a} - ${b} = ${answer}. Вычитай по частям и проверь, нужен ли заём.`,
      },
      hint: { es: `Pensa cuanto le falta a ${b} para llegar a ${a}.`, ru: `Подумай, сколько не хватает от ${b} до ${a}.` },
      commonMistake: { es: "Cambiar el orden de los numeros.", ru: "Поменять числа местами." },
      skillTags: ["subtraction"],
    };
  }

  if (template === "shopping-change") {
    const [priceA, countA, priceB, countB, paid] = params;
    const total = priceA * countA + priceB * countB;
    const answer = paid - total;
    const prompt = phraseVariant("operaciones", template, difficulty, params, [
      {
        es: `Compras ${countA} cuadernos de $${priceA} y ${countB} lapiceras de $${priceB}. Pagas con $${paid}. Cuanto vuelto recibis?`,
        ru: `Покупаешь ${countA} тетради по $${priceA} и ${countB} ручки по $${priceB}. Платишь $${paid}. Сколько сдачи?`,
      },
      {
        es: `En una libreria: ${countA} articulos de $${priceA} y ${countB} de $${priceB}. Si entregas $${paid}, cuanto sobra?`,
        ru: `В магазине: ${countA} товара по $${priceA} и ${countB} по $${priceB}. Если дать $${paid}, сколько останется?`,
      },
    ]);
    return {
      ...base,
      prompt,
      answer: String(answer),
      explanation: {
        es: `Total = ${countA} x ${priceA} + ${countB} x ${priceB} = ${total}. Vuelto = ${paid} - ${total} = ${answer}.`,
        ru: `Итого = ${countA} x ${priceA} + ${countB} x ${priceB} = ${total}. Сдача = ${paid} - ${total} = ${answer}.`,
      },
      hint: { es: "Primero calcula el total de la compra, despues resta al dinero entregado.", ru: "Сначала посчитай сумму покупки, потом вычти из оплаты." },
      commonMistake: { es: "Sumar precios sin multiplicar por la cantidad.", ru: "Сложить цены и забыть умножить на количество." },
      skillTags: ["shopping-change", "multiplication", "subtraction"],
    };
  }

  if (template === "exact-division") {
    const [dividend, divisor] = params;
    const answer = dividend / divisor;
    const prompt = phraseVariant("operaciones", template, difficulty, params, [
      { es: `Cuanto es ${dividend} / ${divisor}?`, ru: `Сколько будет ${dividend} / ${divisor}?` },
      { es: `Reparti ${dividend} en grupos iguales de ${divisor}. Cuantos grupos hay?`, ru: `Раздели ${dividend} на равные группы по ${divisor}. Сколько групп получится?` },
      { es: `Que numero multiplicado por ${divisor} da ${dividend}?`, ru: `Какое число, умноженное на ${divisor}, даёт ${dividend}?` },
    ]);
    return {
      ...base,
      prompt,
      answer: String(answer),
      explanation: {
        es: `${dividend} / ${divisor} = ${answer}, porque ${answer} x ${divisor} = ${dividend}.`,
        ru: `${dividend} / ${divisor} = ${answer}, потому что ${answer} x ${divisor} = ${dividend}.`,
      },
      hint: { es: "Pensa que multiplicacion da el dividendo.", ru: "Подумай, какое умножение даёт делимое." },
      commonMistake: { es: "Invertir divisor y resultado.", ru: "Перепутать делитель и результат." },
      skillTags: ["division", "multiplication"],
    };
  }

  if (template === "order-of-operations") {
    const [start, factorA, factorB, subtract] = params;
    const product = factorA * factorB;
    const answer = start + product - subtract;
    const prompt = phraseVariant("operaciones", template, difficulty, params, [
      { es: `Cuanto es ${start} + ${factorA} x ${factorB} - ${subtract}?`, ru: `Посчитай (умножение — первым): ${start} + ${factorA} x ${factorB} - ${subtract}` },
      { es: `Calcula: ${start} + ${factorA} x ${factorB} - ${subtract}`, ru: `Посчитай: ${start} + ${factorA} x ${factorB} - ${subtract}` },
      { es: `Cuanto da ${start} + ${factorA} x ${factorB} - ${subtract}?`, ru: `Сколько будет: ${start} + ${factorA} x ${factorB} - ${subtract}?` },
    ]);
    return {
      ...base,
      prompt,
      answer: String(answer),
      explanation: {
        es: `Primero la multiplicacion: ${factorA} x ${factorB} = ${product}. Luego ${start} + ${product} - ${subtract} = ${answer}.`,
        ru: `Сначала умножение: ${factorA} x ${factorB} = ${product}. Потом ${start} + ${product} - ${subtract} = ${answer}.`,
      },
      hint: { es: "La multiplicacion va antes que suma y resta.", ru: "Умножение выполняется раньше сложения и вычитания." },
      commonMistake: { es: "Resolver todo de izquierda a derecha.", ru: "Решать всё подряд слева направо." },
      skillTags: ["order-of-operations", "multiplication", "addition", "subtraction"],
    };
  }

  if (template === "inequality-range") {
    return buildInequalityRange(template, difficulty, params);
  }

  const answer = a * b;
  const prompt = phraseVariant("operaciones", template, difficulty, params, [
    { es: `Cuanto es ${a} x ${b}?`, ru: `Сколько будет ${a} x ${b}?` },
    { es: `Calcula ${a} multiplicado por ${b}.`, ru: `Вычисли ${a}, умноженное на ${b}.` },
    { es: `${a} grupos de ${b}: cuantos hay en total?`, ru: `${a} групп по ${b}: сколько всего?` },
  ]);
  return {
    ...base,
    prompt,
    answer: String(answer),
    explanation: {
      es: `${a} x ${b} = ${answer}. Descompone un factor y multiplica por partes.`,
      ru: `${a} x ${b} = ${answer}. Разложи один множитель и умножай по частям.`,
    },
    hint: { es: "Separa un factor en decenas y unidades.", ru: "Разложи множитель на десятки и единицы." },
    commonMistake: { es: "Multiplicar solo una parte del numero.", ru: "Умножить только одну часть числа." },
    skillTags: ["multiplication"],
  };
}

function buildInequalityRange(template: TemplateId, difficulty: number, params: number[]): Question {
  const [A, B, boundaryType, contextType] = params;
  const LEQ = "≤";
  type BoundConf = { loSym: string; hiSym: string };
  const BOUND_CONFIGS: BoundConf[] = [
    { loSym: "<",  hiSym: "<"  },
    { loSym: "<",  hiSym: LEQ  },
    { loSym: LEQ,  hiSym: "<"  },
    { loSym: LEQ,  hiSym: LEQ  },
  ];
  const bc = BOUND_CONFIGS[boundaryType % 4];
  const VAR_NAMES = ["e", "p", "x", "t"];
  const NOUN_ES = [
    "la edad de la persona",
    "la cantidad de paginas leidas",
    "el precio del producto",
    "los puntos del torneo",
  ];
  const NOUN_RU = [
    "возраст человека",
    "количество прочитанных страниц",
    "цена товара",
    "очки на турнире",
  ];
  const varName = VAR_NAMES[contextType % 4];
  const nounEs  = NOUN_ES[contextType % 4];
  const nounRu  = NOUN_RU[contextType % 4];
  const buildIneq = (lo: string, hi: string, a: number, b: number): string =>
    `${a} ${lo} ${varName} ${hi} ${b}`;
  const correct = buildIneq(bc.loSym, bc.hiSym, A, B);
  type DC = { lo: string; hi: string; dA?: number; dB?: number };
  const DIST_CONFIGS: DC[][] = [
    [{ lo: LEQ, hi: "<"  }, { lo: "<",  hi: LEQ  }, { lo: LEQ, hi: LEQ  }],
    [{ lo: "<",  hi: "<"  }, { lo: LEQ,  hi: LEQ  }, { lo: LEQ, hi: "<",  dA: -1 }],
    [{ lo: "<",  hi: "<"  }, { lo: LEQ,  hi: LEQ  }, { lo: "<",  hi: LEQ, dB: 1  }],
    [{ lo: "<",  hi: LEQ  }, { lo: LEQ,  hi: "<"  }, { lo: "<",  hi: "<"  }],
  ];
  const distractors = DIST_CONFIGS[boundaryType % 4].map(dc =>
    buildIneq(dc.lo, dc.hi, A + (dc.dA ?? 0), B + (dc.dB ?? 0))
  );
  const allOpts = [correct, ...distractors];
  const idHash = hashText(makeId("operaciones", template, difficulty, params));
  const shuffled = allOpts
    .map((opt, i) => ({ opt, sort: ((idHash >>> 0) + i * 2654435761) >>> 0 }))
    .sort((a, b) => a.sort - b.sort)
    .map(x => x.opt);
  const VERBAL_ES = [
    `es mayor que ${A} y menor que ${B}`,
    `es mayor que ${A} y no supera ${B}`,
    `es al menos ${A} y menor que ${B}`,
    `es al menos ${A} y a lo sumo ${B}`,
  ];
  const VERBAL_RU = [
    `больше ${A} и меньше ${B}`,
    `больше ${A} и не превышает ${B}`,
    `не меньше ${A} и меньше ${B}`,
    `не меньше ${A} и не более ${B}`,
  ];
  const verbalEs = VERBAL_ES[boundaryType % 4];
  const verbalRu = VERBAL_RU[boundaryType % 4];
  const nounEsCap = nounEs[0].toUpperCase() + nounEs.slice(1);
  const nounRuCap = nounRu[0].toUpperCase() + nounRu.slice(1);
  const prompt = phraseVariant("operaciones", template, difficulty, params, [
    {
      es: `${nounEsCap} ${verbalEs}. Cual expresion lo representa?`,
      ru: `${nounRuCap} ${verbalRu}. Какое неравенство это описывает?`,
    },
    {
      es: `Marca la expresion correcta si ${nounEs} ${verbalEs}.`,
      ru: `Отметь правильное неравенство, если ${nounRu} ${verbalRu}.`,
    },
  ]);
  const closedEs = (s: string): string => s === LEQ ? "incluido" : "no incluido";
  const closedRu = (s: string): string => s === LEQ ? "входит" : "не входит";
  return {
    ...baseQuestion("operaciones", template, difficulty, params, "multiple_choice"),
    prompt,
    options: shuffled.map(opt => ({ es: opt, ru: opt })),
    answer: correct,
    explanation: {
      es: `Extremo ${A}: ${closedEs(bc.loSym)}. Extremo ${B}: ${closedEs(bc.hiSym)}. Expresion: ${correct}.`,
      ru: `Граница ${A}: ${closedRu(bc.loSym)}. Граница ${B}: ${closedRu(bc.hiSym)}. Неравенство: ${correct}.`,
    },
    hint: {
      es: '"Mayor que" sin igualdad usa <. "No supera" / "a lo sumo" usa ≤.',
      ru: '"Больше" без равенства — знак <. "Не превышает" / "не более" — знак ≤.',
    },
    commonMistake: {
      es: '"Mayor que A" no incluye A (usa <). "Al menos A" si incluye A (usa ≤).',
      ru: '"Больше A" — A не входит. "Не меньше A" — A входит.',
    },
    skillTags: ["inequality-read"],
    xp: difficulty >= 3 ? 15 : 10,
  };
}

function buildDivisibilidad(template: TemplateId, difficulty: number, params: number[]): Question {
  if (template === "divisibility-select-all") {
    const [divisor, start, step, answerIndex] = params;
    const values = [start, start + step, start + 2 * step, start + 3 * step];
    let answer = values[answerIndex];
    const used = new Set<number>();

    // Guardrail: single-choice question must have exactly one divisible option.
    if (answer % divisor !== 0) {
      answer = Math.ceil(answer / divisor) * divisor;
      values[answerIndex] = answer;
    }
    used.add(values[answerIndex]);
    for (let i = 0; i < values.length; i += 1) {
      if (i === answerIndex) continue;
      let candidate = values[i];
      if (candidate % divisor === 0) candidate += 1;
      while (candidate % divisor === 0 || used.has(candidate)) candidate += 1;
      values[i] = candidate;
      used.add(candidate);
    }
    const prompt = phraseVariant("divisibilidad", template, difficulty, params, [
      { es: `Cual de estos numeros es divisible por ${divisor}?`, ru: `Какое из этих чисел делится на ${divisor}?` },
      { es: `Marca el numero que se divide exacto por ${divisor}.`, ru: `Отметь число, которое делится на ${divisor} без остатка.` },
    ]);
    return {
      ...baseQuestion("divisibilidad", template, difficulty, params, "multiple_choice"),
      prompt,
      options: values.map((value) => ({ es: String(value), ru: String(value) })),
      answer: String(answer),
      explanation: {
        es: `${answer} es divisible por ${divisor}; los otros dejan resto.`,
        ru: `${answer} делится на ${divisor}, остальные дают остаток.`,
      },
      hint: { es: "Aplica la regla de divisibilidad para cada opcion.", ru: "Проверь признак делимости для каждого варианта." },
      commonMistake: { es: "Elegir por intuicion sin comprobar.", ru: "Выбрать наугад без проверки." },
      skillTags: [divisibilitySkill(divisor)],
    };
  }

  if (template === "divisibility-rule") {
    const [n, divisor] = params;
    const ok = n % divisor === 0;
    const prompt = phraseVariant("divisibilidad", template, difficulty, params, [
      { es: `${n} es divisible por ${divisor}.`, ru: `${n} делится на ${divisor}.` },
      { es: `Verdadero o falso: ${n} se divide exacto por ${divisor}.`, ru: `Верно или нет: ${n} делится на ${divisor} без остатка.` },
      { es: `Podemos repartir ${n} en grupos de ${divisor} sin que sobre nada?`, ru: `Можно разделить ${n} на группы по ${divisor} без остатка?` },
    ]);
    return {
      ...baseQuestion("divisibilidad", template, difficulty, params, "true_false"),
      prompt,
      answer: String(ok),
      explanation: {
        es: ok
          ? `Si. ${n} se divide exactamente por ${divisor}.`
          : `No. ${n} no se divide exactamente por ${divisor}.`,
        ru: ok ? `Да. ${n} делится на ${divisor} без остатка.` : `Нет. ${n} не делится на ${divisor} без остатка.`,
      },
      hint: { es: "Usa el criterio de divisibilidad o divide y mira el resto.", ru: "Используй признак делимости или проверь остаток." },
      commonMistake: { es: "Mirar solo la ultima cifra cuando no alcanza.", ru: "Смотреть только на последнюю цифру, когда этого мало." },
      skillTags: [`divisibility-${divisor}`],
    };
  }

  if (template === "next-multiple") {
    const [base, after] = params;
    const answer = Math.ceil((after + 1) / base) * base;
    const prompt = phraseVariant("divisibilidad", template, difficulty, params, [
      { es: `Cual es el primer multiplo de ${base} mayor que ${after}?`, ru: `Какое первое кратное ${base} больше ${after}?` },
      { es: `Busca el menor numero mayor que ${after} que sea multiplo de ${base}.`, ru: `Найди наименьшее число больше ${after}, кратное ${base}.` },
      { es: `Despues de ${after}, cual es el proximo multiplo de ${base}?`, ru: `После ${after} какое следующее кратное ${base}?` },
    ]);
    return {
      ...baseQuestion("divisibilidad", template, difficulty, params),
      prompt,
      answer: String(answer),
      explanation: {
        es: `${answer} es multiplo de ${base} y es el primero mayor que ${after}.`,
        ru: `${answer} кратно ${base} и это первое такое число больше ${after}.`,
      },
      hint: { es: `Segui contando de ${base} en ${base}.`, ru: `Считай шагами по ${base}.` },
      commonMistake: { es: "Dar un multiplo que no es mayor que el numero pedido.", ru: "Дать кратное, которое не больше указанного числа." },
      skillTags: ["multiples"],
    };
  }

  if (template === "conditional-number") {
    const [divA, divB, min, max, exclude] = params;
    let answer = min;
    while (answer <= max) {
      if (answer % divA === 0 && answer % divB === 0 && (exclude === 0 || answer % exclude !== 0)) break;
      answer += 1;
    }
    const excludeTextEs = exclude === 0 ? "" : ` y no sea divisible por ${exclude}`;
    const excludeTextRu = exclude === 0 ? "" : ` и не делилось на ${exclude}`;
    const prompt = phraseVariant("divisibilidad", template, difficulty, params, [
      {
        es: `Busca un numero entre ${min} y ${max} que sea divisible por ${divA} y por ${divB}${excludeTextEs}.`,
        ru: `Найди число от ${min} до ${max}, которое делится на ${divA} и на ${divB}${excludeTextRu}.`,
      },
      {
        es: `Que numero puede cumplir estas condiciones: multiplo de ${divA}, multiplo de ${divB}, entre ${min} y ${max}${excludeTextEs}?`,
        ru: `Какое число подходит: кратно ${divA}, кратно ${divB}, от ${min} до ${max}${excludeTextRu}?`,
      },
    ]);
    return {
      ...baseQuestion("divisibilidad", template, difficulty, params),
      prompt,
      answer: String(answer),
      explanation: {
        es: `${answer} cumple: es divisible por ${divA} y por ${divB}${excludeTextEs}.`,
        ru: `${answer} подходит: делится на ${divA} и на ${divB}${excludeTextRu}.`,
      },
      hint: { es: "Busca multiplos comunes y revisa la condicion extra.", ru: "Ищи общие кратные и проверь дополнительное условие." },
      commonMistake: { es: "Encontrar un multiplo comun pero ignorar la condicion extra.", ru: "Найти общее кратное, но забыть дополнительное условие." },
      skillTags: ["divisibility-conditions"],
    };
  }

  if (template === "missing-digit-divisibility") {
    const [hundreds, tens, divisor] = params;
    let answer = 0;
    while (answer <= 9 && (hundreds * 100 + tens * 10 + answer) % divisor !== 0) {
      answer += 1;
    }
    const prompt = phraseVariant("divisibilidad", template, difficulty, params, [
      { es: `Completa el digito: ${hundreds}${tens}? debe ser divisible por ${divisor}.`, ru: `Вставь цифру: ${hundreds}${tens}? должно делиться на ${divisor}.` },
      { es: `Que cifra puede ir al final de ${hundreds}${tens}_ para que sea multiplo de ${divisor}?`, ru: `Какая цифра может стоять в конце ${hundreds}${tens}_, чтобы число было кратно ${divisor}?` },
    ]);
    return {
      ...baseQuestion("divisibilidad", template, difficulty, params),
      prompt,
      answer: String(answer),
      explanation: {
        es: `${hundreds}${tens}${answer} es divisible por ${divisor}. Probamos la regla de divisibilidad.`,
        ru: `${hundreds}${tens}${answer} делится на ${divisor}. Проверяем признак делимости.`,
      },
      hint: { es: "Proba cifras de 0 a 9 y usa la regla de divisibilidad.", ru: "Проверь цифры от 0 до 9 и используй признак делимости." },
      commonMistake: { es: "Elegir una cifra que cumple otra regla de divisibilidad.", ru: "Выбрать цифру, которая подходит для другого признака делимости." },
      skillTags: ["divisibility-conditions", divisibilitySkill(divisor)],
    };
  }

  // ── divisibility-prime-factor ────────────────────────────────────────────
  if (template === "divisibility-prime-factor") {
    const [n] = params;
    // Find largest prime factor
    const largestPrimeFactor = (x: number): number => {
      let largest = 2;
      let y = x;
      while (y % 2 === 0) { largest = 2; y /= 2; }
      for (let f = 3; f * f <= y; f += 2) {
        while (y % f === 0) { largest = f; y /= f; }
      }
      if (y > 1) largest = y;
      return largest;
    };
    const countPrimeFactors = (x: number): number => {
      let count = 0;
      let y = x;
      for (let f = 2; f * f <= y; f++) {
        while (y % f === 0) { count++; y /= f; }
      }
      if (y > 1) count++;
      return count;
    };
    const lpf = largestPrimeFactor(n);
    const totalFactors = countPrimeFactors(n);
    const prompt = phraseVariant("divisibilidad", template, difficulty, params, [
      { es: `¿Cuál es el mayor factor primo de ${n}?`, ru: `Какой наибольший простой множитель числа ${n}?` },
      { es: `Descomponé ${n} en factores primos. ¿Cuál es el mayor de ellos?`, ru: `Разложи ${n} на простые множители. Какой из них наибольший?` },
      {
        es: `¿Cuántos factores primos tiene ${n} contando las repeticiones?`,
        ru: `Сколько простых множителей у ${n}, считая повторения?`,
      },
    ]);
    // Third variant answers totalFactors instead of lpf
    const isCountVariant = phraseVariant("divisibilidad", template, difficulty, params, [false, false, true]) as boolean;
    return {
      ...baseQuestion("divisibilidad", template, difficulty, params),
      prompt,
      answer: String(isCountVariant ? totalFactors : lpf),
      explanation: {
        es: isCountVariant
          ? `${n} tiene ${totalFactors} factores primos contando repeticiones en su descomposición.`
          : `El mayor factor primo de ${n} es ${lpf}. Se obtiene descomponiendo: dividí sucesivamente por los primos más pequeños.`,
        ru: isCountVariant
          ? `У ${n} всего ${totalFactors} простых множителей с учётом повторений.`
          : `Наибольший простой множитель ${n} равен ${lpf}. Разложи: дели последовательно на простые числа.`,
      },
      hint: { es: "Dividí por 2, 3, 5, 7… hasta que quede 1.", ru: "Дели на 2, 3, 5, 7… пока не останется 1." },
      commonMistake: { es: "Confundir divisores con factores primos.", ru: "Путать делители с простыми множителями." },
      skillTags: ["divisibility-prime-factor"],
    };
  }

  // ── divisibility-gcd ─────────────────────────────────────────────────────
  if (template === "divisibility-gcd") {
    const [a, b] = params;
    const g = gcd(a, b);
    const prompt = phraseVariant("divisibilidad", template, difficulty, params, [
      { es: `¿Cuál es el Máximo Común Divisor de ${a} y ${b}?`, ru: `Каков НОД чисел ${a} и ${b}?` },
      { es: `Hallá el MCD de ${a} y ${b}.`, ru: `Найди НОД(${a}, ${b}).` },
      {
        es: `Tenés ${a} lapiceras y ${b} cuadernos. Querés repartirlos en grupos iguales sin sobrar nada. ¿Cuántos grupos como máximo podés armar?`,
        ru: `У тебя ${a} ручек и ${b} тетрадей. Хочешь разделить на равные группы без остатка. Сколько максимум групп?`,
      },
      {
        es: `Un rectángulo de ${a} cm por ${b} cm se quiere cubrir con cuadrados iguales del mayor tamaño posible. ¿Cuánto mide el lado de cada cuadrado?`,
        ru: `Прямоугольник ${a} см на ${b} см нужно заполнить одинаковыми квадратами максимального размера. Чему равна сторона квадрата?`,
      },
    ]);
    return {
      ...baseQuestion("divisibilidad", template, difficulty, params),
      prompt,
      answer: String(g),
      explanation: {
        es: `MCD(${a}, ${b}) = ${g}. Usando el algoritmo de Euclides o descomposición en primos.`,
        ru: `НОД(${a}, ${b}) = ${g}. По алгоритму Евклида или разложению на простые.`,
      },
      hint: { es: "Dividí el número mayor por el menor; tomá el resto y repetí.", ru: "Дели большее на меньшее, бери остаток и повторяй (алгоритм Евклида)." },
      commonMistake: { es: "Confundir el MCD con el MCM.", ru: "Перепутать НОД с НОК." },
      skillTags: ["divisibility-gcd", "divisibility-prime-factor"],
    };
  }

  // ── divisibility-lcm ─────────────────────────────────────────────────────
  if (template === "divisibility-lcm") {
    const [a, b] = params;
    const l = lcm(a, b);
    const prompt = phraseVariant("divisibilidad", template, difficulty, params, [
      { es: `¿Cuál es el Mínimo Común Múltiplo de ${a} y ${b}?`, ru: `Каков НОК чисел ${a} и ${b}?` },
      { es: `Calculá el MCM de ${a} y ${b}.`, ru: `Вычисли НОК(${a}, ${b}).` },
      {
        es: `¿Cuál es el menor número que es múltiplo de ${a} y también de ${b}?`,
        ru: `Какое наименьшее число является кратным и ${a}, и ${b}?`,
      },
      {
        es: `Dos buses salen cada ${a} minutos y cada ${b} minutos. ¿Cada cuántos minutos coinciden?`,
        ru: `Два автобуса ходят каждые ${a} и ${b} минут. Через сколько минут они снова совпадут?`,
      },
    ]);
    return {
      ...baseQuestion("divisibilidad", template, difficulty, params),
      prompt,
      answer: String(l),
      explanation: {
        es: `MCM(${a}, ${b}) = ${l}. Se puede calcular como (${a} × ${b}) / MCD(${a}, ${b}) = ${a * b} / ${gcd(a, b)} = ${l}.`,
        ru: `НОК(${a}, ${b}) = ${l}. Вычисляется как (${a} × ${b}) / НОД(${a}, ${b}) = ${a * b} / ${gcd(a, b)} = ${l}.`,
      },
      hint: { es: "MCM = (a × b) / MCD(a, b).", ru: "НОК = (a × b) / НОД(a, b)." },
      commonMistake: { es: "Confundir el MCM con el MCD.", ru: "Перепутать НОК с НОД." },
      skillTags: ["divisibility-lcm", "divisibility-gcd"],
    };
  }

  // ── divisibility-lcm-word ────────────────────────────────────────────────
  if (template === "divisibility-lcm-word") {
    const [a, b] = params;
    const l = lcm(a, b);
    const prompt = phraseVariant("divisibilidad", template, difficulty, params, [
      {
        es: `Un semáforo cambia de color cada ${a} minutos y otro cada ${b} minutos. Acaban de cambiar al mismo tiempo. ¿Cuántos minutos pasan hasta que vuelven a coincidir?`,
        ru: `Один светофор меняет цвет каждые ${a} минут, другой — каждые ${b} минут. Только что оба переключились одновременно. Через сколько минут они снова совпадут?`,
      },
      {
        es: `Dos colectivos pasan por la misma parada. El primero cada ${a} minutos y el segundo cada ${b} minutos. Si los dos pasaron juntos a las 8:00, ¿cuántos minutos después vuelven a pasar juntos?`,
        ru: `Два автобуса проходят одну остановку: первый каждые ${a} минут, второй каждые ${b} минут. Вместе они проехали в 8:00. Через сколько минут они снова окажутся рядом?`,
      },
      {
        es: `Mia practica matemática cada ${a} días y su amigo cada ${b} días. Si hoy los dos practicaron, ¿en cuántos días volverán a practicar el mismo día?`,
        ru: `Миа занимается математикой каждые ${a} дней, её друг — каждые ${b} дней. Сегодня оба позанимались. Через сколько дней они снова позанимаются в один день?`,
      },
      {
        es: `Una máquina hace un ciclo cada ${a} segundos y otra cada ${b} segundos. Arrancaron juntas. ¿Cada cuántos segundos coinciden en el inicio de un ciclo?`,
        ru: `Машина делает цикл каждые ${a} секунд, другая — каждые ${b} секунд. Запустились одновременно. Каждые сколько секунд они совпадают в начале цикла?`,
      },
    ]);
    return {
      ...baseQuestion("divisibilidad", template, difficulty, params),
      prompt,
      answer: String(l),
      explanation: {
        es: `Necesitamos el tiempo en que ambos coinciden: eso es el MCM(${a}, ${b}) = ${l}.`,
        ru: `Нам нужно время, когда оба совпадают: это НОК(${a}, ${b}) = ${l}.`,
      },
      hint: { es: "La coincidencia ocurre en el mínimo común múltiplo de los dos períodos.", ru: "Совпадение происходит через наименьшее общее кратное двух периодов." },
      commonMistake: { es: "Sumar o multiplicar los períodos directamente.", ru: "Просто сложить или умножить периоды." },
      skillTags: ["divisibility-lcm"],
    };
  }

  // ── divisibility-trap ────────────────────────────────────────────────────
  if (template === "divisibility-trap") {
    const [n, divisor] = params;
    const ok = n % divisor === 0;
    const prompt = phraseVariant("divisibilidad", template, difficulty, params, [
      { es: `¿${n} es divisible por ${divisor}?`, ru: `Делится ли ${n} на ${divisor}?` },
      { es: `Verdadero o falso: ${n} se divide exactamente por ${divisor}.`, ru: `Верно или нет: ${n} делится на ${divisor} без остатка.` },
      { es: `¿Es ${n} un múltiplo de ${divisor}?`, ru: `Является ли ${n} кратным ${divisor}?` },
    ]);
    // Trap-specific explanation based on divisor
    const trapExplanationEs =
      divisor === 4 ? `Para divisibilidad por 4: analizá las últimas DOS cifras (${n % 100}). ${n % 100} / 4 = ${n % 100 / 4}. La respuesta es ${ok ? "SÍ" : "NO"}.` :
      divisor === 8 ? `Para divisibilidad por 8: analizá las últimas TRES cifras (${n % 1000}). ${n % 1000} / 8 = ${n % 1000 / 8}. La respuesta es ${ok ? "SÍ" : "NO"}.` :
      divisor === 9 ? `Criterio del 9: la suma de los dígitos de ${n} es ${String(n).split("").reduce((s,c)=>s+Number(c),0)}. ¿Es divisible por 9? La respuesta es ${ok ? "SÍ" : "NO"}.` :
      divisor === 6 ? `Para divisibilidad por 6: el número tiene que ser divisible por 2 Y por 3. ${n % 2 === 0 ? `${n} es par ✓` : `${n} no es par ✗`}. Suma de dígitos: ${String(n).split("").reduce((s,c)=>s+Number(c),0)} → ${String(n).split("").reduce((s,c)=>s+Number(c),0) % 3 === 0 ? "divisible por 3 ✓" : "no divisible por 3 ✗"}. La respuesta es ${ok ? "SÍ" : "NO"}.` :
      `${n} / ${divisor} = ${n / divisor}. ${ok ? `Es exacto, por lo tanto divisible.` : `No es exacto (resto ${n % divisor}), por lo tanto no divisible.`}`;
    const trapExplanationRu =
      divisor === 4 ? `Признак делимости на 4: смотрим на ПОСЛЕДНИЕ ДВЕ цифры (${n % 100}). ${n % 100} / 4 = ${n % 100 / 4}. Ответ: ${ok ? "ДА" : "НЕТ"}.` :
      divisor === 8 ? `Признак делимости на 8: смотрим на ПОСЛЕДНИЕ ТРИ цифры (${n % 1000}). ${n % 1000} / 8 = ${n % 1000 / 8}. Ответ: ${ok ? "ДА" : "НЕТ"}.` :
      divisor === 9 ? `Признак 9: сумма цифр ${n} равна ${String(n).split("").reduce((s,c)=>s+Number(c),0)}. Делится ли на 9? Ответ: ${ok ? "ДА" : "НЕТ"}.` :
      divisor === 6 ? `Признак делимости на 6: число делится на 2 И на 3. ${n % 2 === 0 ? `${n} чётное ✓` : `${n} нечётное ✗`}. Сумма цифр: ${String(n).split("").reduce((s,c)=>s+Number(c),0)} → ${String(n).split("").reduce((s,c)=>s+Number(c),0) % 3 === 0 ? "делится на 3 ✓" : "не делится на 3 ✗"}. Ответ: ${ok ? "ДА" : "НЕТ"}.` :
      `${n} / ${divisor} = ${n / divisor}. ${ok ? `Целое — делится без остатка.` : `Не целое (остаток ${n % divisor}) — не делится.`}`;
    return {
      ...baseQuestion("divisibilidad", template, difficulty, params, "true_false"),
      prompt,
      answer: String(ok),
      explanation: { es: trapExplanationEs, ru: trapExplanationRu },
      hint: {
        es: divisor === 4 ? "Para el 4: mirá solo las últimas dos cifras." :
            divisor === 8 ? "Para el 8: mirá solo las últimas tres cifras." :
            divisor === 9 ? "Para el 9: sumá todos los dígitos." :
            divisor === 6 ? "Para el 6: tiene que ser divisible por 2 Y por 3." :
            "Aplicá el criterio específico para este divisor.",
        ru: divisor === 4 ? "Для 4: смотри только на последние две цифры." :
            divisor === 8 ? "Для 8: смотри только на последние три цифры." :
            divisor === 9 ? "Для 9: сложи все цифры числа." :
            divisor === 6 ? "Для 6: должно делиться и на 2, и на 3." :
            "Применяй признак делимости для этого делителя.",
      },
      commonMistake: {
        es: divisor === 4 ? "Mirar solo la última cifra (que sirve para el 2, no para el 4)." :
            divisor === 9 ? "Usar la regla del 3 en vez del 9." :
            divisor === 6 ? "Revisar solo divisibilidad por 2 o solo por 3, no las dos." :
            "Aplicar un criterio equivocado.",
        ru: divisor === 4 ? "Смотреть только на последнюю цифру (это для 2, не для 4)." :
            divisor === 9 ? "Применять признак тройки вместо признака девятки." :
            divisor === 6 ? "Проверять только делимость на 2 или только на 3, не оба условия." :
            "Применять неверный признак.",
      },
      skillTags: [divisor <= 6 || divisor === 9 || divisor === 10 ? `divisibility-${divisor}` : "divisibility-conditions", "divisibility-conditions"],
    };
  }

  if (template === "division-find-n") {
    const [d, q, r, k, subtype] = params;
    const dividend = d * q + r;
    const n = subtype === 1 ? dividend / k : dividend;
    const variantsSubtype0 = [
      {
        es: `Al dividir n por ${d} el cociente es ${q} y el resto es ${r}. Cuanto vale n?`,
        ru: `При делении n на ${d} получается частное ${q} и остаток ${r}. Чему равно n?`,
      },
      {
        es: `n dividido ${d} da ${q} con resto ${r}. Cual es n?`,
        ru: `n разделить на ${d} даёт ${q} и остаток ${r}. Найди n.`,
      },
      {
        es: `Busca n: n / ${d} = ${q} (resto ${r}).`,
        ru: `Найди n: n / ${d} = ${q} (остаток ${r}).`,
      },
    ];
    const variantsSubtype1 = [
      {
        es: `Al dividir ${k}*n por ${d} el cociente es ${q} y el resto es ${r}. Cuanto vale n?`,
        ru: `При делении ${k}*n на ${d} частное равно ${q} и остаток ${r}. Чему равно n?`,
      },
      {
        es: `${k}*n dividido ${d} da cociente ${q} y resto ${r}. Cual es n?`,
        ru: `${k}*n делим на ${d}: частное ${q}, остаток ${r}. Найди n.`,
      },
      {
        es: `Si ${k} veces un numero n, dividido por ${d}, da ${q} con resto ${r}, cual es n?`,
        ru: `Если ${k} умножить на n и разделить на ${d}, получим частное ${q} и остаток ${r}. Найди n.`,
      },
    ];
    const prompt = phraseVariant(
      "divisibilidad", template, difficulty, params,
      subtype === 1 ? variantsSubtype1 : variantsSubtype0
    );
    return {
      ...baseQuestion("divisibilidad", template, difficulty, params),
      prompt,
      answer: String(n),
      explanation: subtype === 1
        ? {
            es: `Primero: ${k}*n = ${d} x ${q} + ${r} = ${dividend}. Luego: n = ${dividend} / ${k} = ${n}.`,
            ru: `Сначала: ${k}*n = ${d} x ${q} + ${r} = ${dividend}. Затем: n = ${dividend} / ${k} = ${n}.`,
          }
        : {
            es: `n = divisor x cociente + resto = ${d} x ${q} + ${r} = ${n}.`,
            ru: `n = делитель x частное + остаток = ${d} x ${q} + ${r} = ${n}.`,
          },
      hint: subtype === 1
        ? {
            es: `Primero despeja ${k}*n = ${d} x ${q} + ${r}, luego divide por ${k}.`,
            ru: `Сначала найди ${k}*n = ${d} x ${q} + ${r}, потом раздели на ${k}.`,
          }
        : {
            es: `Usa: n = ${d} x ${q} + ${r}.`,
            ru: `Используй: n = ${d} x ${q} + ${r}.`,
          },
      commonMistake: subtype === 1
        ? {
            es: `Olvidar dividir por ${k} al final.`,
            ru: `Забыть разделить на ${k} в конце.`,
          }
        : {
            es: "Olvidar sumar el resto: poner solo d x q.",
            ru: "Забыть прибавить остаток: написать только d x q.",
          },
      skillTags: ["division-with-remainder"],
      xp: difficulty >= 4 ? 20 : 15,
    };
  }

  // ── fallthrough: count-multiples ─────────────────────────────────────────
  const [base, limit] = params;
  const answer = Math.floor(limit / base);
  const prompt = phraseVariant("divisibilidad", template, difficulty, params, [
    { es: `Cuantos multiplos de ${base} hay entre 1 y ${limit}?`, ru: `Сколько кратных ${base} есть от 1 до ${limit}?` },
    { es: `Conta los numeros divisibles por ${base} desde 1 hasta ${limit}.`, ru: `Посчитай числа, делящиеся на ${base}, от 1 до ${limit}.` },
    { es: `Hasta ${limit}, cuantos resultados aparecen en la tabla del ${base}?`, ru: `До ${limit} сколько чисел есть в таблице умножения на ${base}?` },
  ]);
  return {
    ...baseQuestion("divisibilidad", template, difficulty, params),
    prompt,
    answer: String(answer),
    explanation: {
      es: `Hay ${answer}: cada multiplo aparece cada ${base} numeros.`,
      ru: `Их ${answer}: кратное появляется каждые ${base} чисел.`,
    },
    hint: { es: `Calcula ${limit} dividido ${base} y toma la parte entera.`, ru: `Раздели ${limit} на ${base} и возьми целую часть.` },
    commonMistake: { es: "Olvidar si el limite esta incluido.", ru: "Забыть, что верхняя граница включена." },
    skillTags: ["multiples"],
  };
}

function buildFracciones(template: TemplateId, difficulty: number, params: number[]): Question {
  if (template === "fraction-simplify") {
    const [n, d] = params;
    const g = gcd(n, d);
    const sn = n / g;
    const sd = d / g;
    const prompt = phraseVariant("fracciones", template, difficulty, params, [
      { es: `Simplifica la fraccion ${fraction(n, d)}.`, ru: `Сократи дробь ${fraction(n, d)}.` },
      { es: `Escribi ${fraction(n, d)} en su forma mas simple.`, ru: `Запиши ${fraction(n, d)} в простейшем виде.` },
      { es: `Reduce ${fraction(n, d)} dividiendo numerador y denominador.`, ru: `Упрости ${fraction(n, d)}, разделив числитель и знаменатель.` },
    ]);
    return {
      ...baseQuestion("fracciones", template, difficulty, params),
      prompt,
      answer: fraction(sn, sd),
      explanation: {
        es: `El divisor comun mayor es ${g}. ${fraction(n, d)} = ${fraction(sn, sd)}.`,
        ru: `Наибольший общий делитель ${g}. ${fraction(n, d)} = ${fraction(sn, sd)}.`,
      },
      hint: { es: "Busca un numero que divida al numerador y al denominador.", ru: "Найди число, которое делит числитель и знаменатель." },
      commonMistake: { es: "Dividir solo el numerador.", ru: "Разделить только числитель." },
      skillTags: ["fraction-simplify"],
    };
  }

  if (template === "fraction-compare") {
    const [a, b, c, d] = params;
    const left = a * d;
    const right = c * b;
    const answer = left === right ? "=" : left > right ? ">" : "<";
    const prompt = phraseVariant("fracciones", template, difficulty, params, [
      { es: `Compara: ${fraction(a, b)} __ ${fraction(c, d)}`, ru: `Сравни: ${fraction(a, b)} __ ${fraction(c, d)}` },
      { es: `Que signo va entre ${fraction(a, b)} y ${fraction(c, d)}?`, ru: `Какой знак поставить между ${fraction(a, b)} и ${fraction(c, d)}?` },
      { es: `Elegi si ${fraction(a, b)} es mayor, menor o igual que ${fraction(c, d)}.`, ru: `Выбери: ${fraction(a, b)} больше, меньше или равно ${fraction(c, d)}.` },
    ]);
    return {
      ...baseQuestion("fracciones", template, difficulty, params, "multiple_choice"),
      prompt,
      options: [{ es: ">", ru: ">" }, { es: "<", ru: "<" }, { es: "=", ru: "=" }],
      answer,
      explanation: {
        es: `Comparamos productos cruzados: ${a} x ${d} = ${left}, ${c} x ${b} = ${right}.`,
        ru: `Сравниваем крест-накрест: ${a} x ${d} = ${left}, ${c} x ${b} = ${right}.`,
      },
      hint: { es: "Multiplica cruzado para comparar.", ru: "Умножь крест-накрест для сравнения." },
      commonMistake: { es: "Comparar solo los numeradores.", ru: "Сравнивать только числители." },
      skillTags: ["fraction-compare"],
    };
  }

  if (template === "fraction-compare-to-unit") {
    const [a, b] = params;
    const answer = a === b ? "=" : a > b ? ">" : "<";
    const prompt = phraseVariant("fracciones", template, difficulty, params, [
      { es: `Compara con 1: ${fraction(a, b)} __ 1`, ru: `Сравни с 1: ${fraction(a, b)} __ 1` },
      { es: `La fraccion ${fraction(a, b)} es menor, mayor o igual a 1?`, ru: `Дробь ${fraction(a, b)} меньше, больше или равна 1?` },
    ]);
    return {
      ...baseQuestion("fracciones", template, difficulty, params, "multiple_choice"),
      prompt,
      options: [{ es: ">", ru: ">" }, { es: "<", ru: "<" }, { es: "=", ru: "=" }],
      answer,
      explanation: {
        es: `Si numerador ${a} ${a === b ? "=" : a > b ? ">" : "<"} denominador ${b}, entonces ${fraction(a, b)} ${answer} 1.`,
        ru: `Если числитель ${a} ${a === b ? "=" : a > b ? ">" : "<"} знаменателя ${b}, то ${fraction(a, b)} ${answer} 1.`,
      },
      hint: { es: "Compara numerador y denominador.", ru: "Сравни числитель и знаменатель." },
      commonMistake: { es: "Mirar solo el denominador.", ru: "Смотреть только на знаменатель." },
      skillTags: ["fraction-compare"],
    };
  }

  if (template === "fraction-compare-same-den") {
    const [a, c, d] = params;
    const answer = a === c ? "=" : a > c ? ">" : "<";
    const prompt = phraseVariant("fracciones", template, difficulty, params, [
      { es: `Compara: ${fraction(a, d)} __ ${fraction(c, d)}`, ru: `Сравни: ${fraction(a, d)} __ ${fraction(c, d)}` },
      { es: `Mismo denominador ${d}. Que signo corresponde?`, ru: `Одинаковый знаменатель ${d}. Какой знак нужен?` },
    ]);
    return {
      ...baseQuestion("fracciones", template, difficulty, params, "multiple_choice"),
      prompt,
      options: [{ es: ">", ru: ">" }, { es: "<", ru: "<" }, { es: "=", ru: "=" }],
      answer,
      explanation: {
        es: `Con igual denominador, se comparan numeradores: ${a} ${answer} ${c}.`,
        ru: `При одинаковом знаменателе сравниваем числители: ${a} ${answer} ${c}.`,
      },
      hint: { es: "No hace falta producto cruzado cuando el denominador es igual.", ru: "При равных знаменателях не нужен перекрестный метод." },
      commonMistake: { es: "Intentar cambiar denominadores innecesariamente.", ru: "Лишний раз приводить к другим знаменателям." },
      skillTags: ["fraction-compare"],
    };
  }

  if (template === "fraction-equivalent-missing") {
    const [numerator, denominator, factor] = params;
    const targetDenominator = denominator * factor;
    const answer = numerator * factor;
    const prompt = phraseVariant("fracciones", template, difficulty, params, [
      { es: `Completa la fraccion equivalente: ${fraction(numerator, denominator)} = ?/${targetDenominator}`, ru: `Заполни равную дробь: ${fraction(numerator, denominator)} = ?/${targetDenominator}` },
      { es: `Si ${denominator} se convierte en ${targetDenominator}, que numerador mantiene la fraccion equivalente?`, ru: `Если ${denominator} превращается в ${targetDenominator}, какой числитель сохранит равную дробь?` },
      { es: `Busca el numero que falta: ${fraction(numerator, denominator)} = ?/${targetDenominator}.`, ru: `Найди пропущенное число: ${fraction(numerator, denominator)} = ?/${targetDenominator}.` },
    ]);
    return {
      ...baseQuestion("fracciones", template, difficulty, params),
      prompt,
      answer: String(answer),
      explanation: {
        es: `El denominador se multiplico por ${factor}, entonces el numerador tambien: ${numerator} x ${factor} = ${answer}.`,
        ru: `Знаменатель умножили на ${factor}, значит числитель тоже: ${numerator} x ${factor} = ${answer}.`,
      },
      hint: { es: "Usa el mismo factor en numerador y denominador.", ru: "Используй один и тот же множитель для числителя и знаменателя." },
      commonMistake: { es: "Multiplicar solo el denominador.", ru: "Умножить только знаменатель." },
      skillTags: ["fraction-equivalent", "multiplication"],
    };
  }

  if (template === "fraction-equivalent-true-false") {
    const [a, b, c, d] = params;
    const ok = a * d === c * b;
    const prompt = phraseVariant("fracciones", template, difficulty, params, [
      { es: `Verdadero o falso: ${fraction(a, b)} y ${fraction(c, d)} son equivalentes.`, ru: `Верно или нет: ${fraction(a, b)} и ${fraction(c, d)} эквивалентны.` },
      { es: `Estas dos fracciones representan lo mismo? ${fraction(a, b)} y ${fraction(c, d)}`, ru: `Эти дроби равны по значению? ${fraction(a, b)} и ${fraction(c, d)}` },
    ]);
    return {
      ...baseQuestion("fracciones", template, difficulty, params, "true_false"),
      prompt,
      answer: String(ok),
      explanation: {
        es: ok ? "Son equivalentes porque los productos cruzados coinciden." : "No son equivalentes: los productos cruzados no coinciden.",
        ru: ok ? "Они эквивалентны: перекрестные произведения равны." : "Неэквивалентны: перекрестные произведения разные.",
      },
      hint: { es: "Compara productos cruzados.", ru: "Сравни перекрестные произведения." },
      commonMistake: { es: "Mirar solo un numerador o un denominador.", ru: "Смотреть только на один числитель или знаменатель." },
      skillTags: ["fraction-equivalent", "fraction-compare"],
    };
  }

  if (template === "mixed-to-improper") {
    const [whole, num, den] = params;
    const answer = fraction(whole * den + num, den);
    const prompt = phraseVariant("fracciones", template, difficulty, params, [
      { es: `Convierte ${whole} ${fraction(num, den)} a fraccion impropia.`, ru: `Преобразуй ${whole} ${fraction(num, den)} в неправильную дробь.` },
      { es: `Escribi como una sola fraccion: ${whole} enteros y ${fraction(num, den)}.`, ru: `Запиши одной дробью: ${whole} целых и ${fraction(num, den)}.` },
    ]);
    return {
      ...baseQuestion("fracciones", template, difficulty, params),
      prompt,
      answer,
      explanation: {
        es: `${whole} x ${den} + ${num} = ${whole * den + num}. Resultado: ${answer}.`,
        ru: `${whole} x ${den} + ${num} = ${whole * den + num}. Ответ: ${answer}.`,
      },
      hint: { es: "Multiplica el entero por el denominador y suma el numerador.", ru: "Умножь целую часть на знаменатель и прибавь числитель." },
      commonMistake: { es: "Sumar el entero directo al numerador.", ru: "Прибавить целую часть прямо к числителю." },
      skillTags: ["mixed-number", "fraction-equivalent"],
    };
  }

  if (template === "fraction-of-number") {
    const [num, den, total] = params;
    const answer = (total / den) * num;
    const prompt = phraseVariant("fracciones", template, difficulty, params, [
      { es: `Cuanto es ${fraction(num, den)} de ${total}?`, ru: `Сколько составляет ${fraction(num, den)} от ${total}?` },
      { es: `En un grupo de ${total}, ${fraction(num, den)} participa. Cuantos son?`, ru: `В группе ${total}, участвует ${fraction(num, den)}. Сколько это?` },
      { es: `Calcula la parte: ${fraction(num, den)} x ${total}.`, ru: `Вычисли часть: ${fraction(num, den)} x ${total}.` },
    ]);
    return {
      ...baseQuestion("fracciones", template, difficulty, params),
      prompt,
      answer: String(answer),
      explanation: {
        es: `Primero ${total} dividido ${den} = ${total / den}. Luego multiplicas por ${num}: ${answer}.`,
        ru: `Сначала ${total} делим на ${den} = ${total / den}. Потом умножаем на ${num}: ${answer}.`,
      },
      hint: { es: "Divide por el denominador y multiplica por el numerador.", ru: "Раздели на знаменатель и умножь на числитель." },
      commonMistake: { es: "Multiplicar por el numerador sin dividir por el denominador.", ru: "Умножить на числитель и забыть деление на знаменатель." },
      skillTags: ["fraction-of-number"],
    };
  }

  if (template === "fraction-of-number-remainder") {
    const [num, den, total] = params;
    const part = (total / den) * num;
    const answer = total - part;
    const prompt = phraseVariant("fracciones", template, difficulty, params, [
      { es: `Se usa ${fraction(num, den)} de ${total}. Cuanto queda?`, ru: `Использовали ${fraction(num, den)} от ${total}. Сколько осталось?` },
      { es: `De ${total} alumnos, ${fraction(num, den)} fue a taller. Cuantos no fueron?`, ru: `Из ${total} учеников ${fraction(num, den)} пошли на кружок. Сколько не пошли?` },
    ]);
    return {
      ...baseQuestion("fracciones", template, difficulty, params),
      prompt,
      answer: String(answer),
      explanation: {
        es: `${fraction(num, den)} de ${total} = ${part}. Resto: ${total} - ${part} = ${answer}.`,
        ru: `${fraction(num, den)} от ${total} = ${part}. Остаток: ${total} - ${part} = ${answer}.`,
      },
      hint: { es: "Primero calcula la parte, despues el resto.", ru: "Сначала найди часть, затем остаток." },
      commonMistake: { es: "Responder solo la parte usada.", ru: "Ответить только использованную часть." },
      skillTags: ["fraction-of-number", "subtraction"],
    };
  }

  if (template === "fraction-part-of-set") {
    const [part, total] = params;
    const g = gcd(part, total);
    const answer = fraction(part / g, total / g);
    const setContext = phraseVariant("fracciones", `${template}-ctx` as TemplateId, difficulty, params, [
      "tarjetas",
      "figuritas",
      "alumnos",
      "bloques",
      "entradas",
      "misiones",
    ]);
    const highlighted = phraseVariant("fracciones", `${template}-hl` as TemplateId, difficulty, params, [
      "raras",
      "completadas",
      "seleccionadas",
      "argentinas",
      "correctas",
      "premium",
    ]);
    const prompt = phraseVariant("fracciones", template, difficulty, params, [
      { es: `En una coleccion hay ${total} ${setContext} y ${part} son ${highlighted}. Que fraccion representan?`, ru: `В наборе ${total} ${setContext}, из них ${part} — ${highlighted}. Какую дробь это составляет?` },
      { es: `De ${total} ${setContext}, ${part} quedaron ${highlighted}. Expresa esa parte como fraccion simplificada.`, ru: `Из ${total} ${setContext} ${part} оказались ${highlighted}. Запиши эту часть сокращенной дробью.` },
      { es: `Hay ${part} ${highlighted} sobre un total de ${total} ${setContext}. Escribe la fraccion en forma mas simple.`, ru: `Есть ${part} ${highlighted} из ${total} ${setContext}. Запиши дробь в простейшем виде.` },
      { es: `En el grupo, ${part} de ${total} ${setContext} cumplen la condicion. Cual es la fraccion simplificada?`, ru: `В группе ${part} из ${total} ${setContext} подходят под условие. Какая сокращенная дробь?` },
      { es: `Se marcaron ${part} ${setContext} de un total de ${total}. Representa la parte marcada como fraccion irreducible.`, ru: `Отмечено ${part} ${setContext} из ${total}. Представь отмеченную часть несократимой дробью.` },
      { es: `Si ${part} de ${total} ${setContext} son ${highlighted}, que fraccion del total es esa?`, ru: `Если ${part} из ${total} ${setContext} — ${highlighted}, какая это доля от целого?` },
    ]);
    return {
      ...baseQuestion("fracciones", template, difficulty, params),
      prompt,
      answer,
      explanation: {
        es: `La fraccion es ${fraction(part, total)}. Simplificando por ${g} queda ${answer}.`,
        ru: `Доля равна ${fraction(part, total)}. Сокращаем на ${g} и получаем ${answer}.`,
      },
      hint: { es: "Primero arma parte/total y despues simplifica.", ru: "Сначала составь часть/целое, затем сократи дробь." },
      commonMistake: { es: "Poner total/parte al reves.", ru: "Поменять местами часть и целое." },
      skillTags: ["fraction-of-number", "fraction-simplify"],
    };
  }

  if (template === "fraction-complement-to-whole") {
    const [num, den] = params;
    const remaining = den - num;
    const g = gcd(remaining, den);
    const answer = fraction(remaining / g, den / g);
    const progressContext = phraseVariant("fracciones", `${template}-ctx` as TemplateId, difficulty, params, [
      "la tarea",
      "el album",
      "la mision",
      "el nivel",
      "la pagina",
      "la coleccion",
    ]);
    const prompt = phraseVariant("fracciones", template, difficulty, params, [
      { es: `Si ya completaste ${fraction(num, den)} de ${progressContext}, que fraccion falta para llegar al total?`, ru: `Если уже сделано ${fraction(num, den)} от ${progressContext}, какая дробь осталась до целого?` },
      { es: `Una botella esta llena en ${fraction(num, den)}. Que parte falta para llenarla completa?`, ru: `Бутылка заполнена на ${fraction(num, den)}. Какая часть нужна до полного объема?` },
      { es: `Queda por completar la parte faltante de 1 si ya hay ${fraction(num, den)}.`, ru: `Найди дополнение до 1, если уже есть ${fraction(num, den)}.` },
      { es: `En el album esta lleno ${fraction(num, den)}. Que fraccion queda vacia?`, ru: `В альбоме заполнено ${fraction(num, den)}. Какая доля осталась пустой?` },
      { es: `En una barra de progreso avanzaste ${fraction(num, den)}. Que parte falta para 1 entero?`, ru: `По полосе прогресса пройдено ${fraction(num, den)}. Какая часть нужна до целого 1?` },
      { es: `Ya se resolvio ${fraction(num, den)} del desafio. Expresa la fraccion que falta.`, ru: `Уже решено ${fraction(num, den)} задания. Запиши дробь, которая осталась.` },
    ]);
    return {
      ...baseQuestion("fracciones", template, difficulty, params),
      prompt,
      answer,
      explanation: {
        es: `Lo que falta es 1 - ${fraction(num, den)} = ${fraction(remaining, den)} = ${answer}.`,
        ru: `Остаток: 1 - ${fraction(num, den)} = ${fraction(remaining, den)} = ${answer}.`,
      },
      hint: { es: "Resta numeradores sobre el mismo denominador.", ru: "Вычти числители при том же знаменателе." },
      commonMistake: { es: "Restar denominadores tambien.", ru: "Вычитать еще и знаменатели." },
      skillTags: ["fraction-subtract", "fraction-compare"],
    };
  }

  if (template === "fraction-add-whole-and-fraction") {
    const [whole, num, den] = params;
    const top = whole * den + num;
    const g = gcd(top, den);
    const answer = fraction(top / g, den / g);
    const prompt = phraseVariant("fracciones", template, difficulty, params, [
      { es: `Calcula: ${whole} + ${fraction(num, den)}. Responde como fraccion simplificada.`, ru: `Вычисли: ${whole} + ${fraction(num, den)}. Ответь сокращенной дробью.` },
      { es: `Suma un entero y una fraccion: ${whole} + ${fraction(num, den)}.`, ru: `Сложи целое и дробь: ${whole} + ${fraction(num, den)}.` },
    ]);
    return {
      ...baseQuestion("fracciones", template, difficulty, params),
      prompt,
      answer,
      explanation: {
        es: `${whole} = ${fraction(whole * den, den)}. Entonces ${fraction(whole * den, den)} + ${fraction(num, den)} = ${fraction(top, den)} = ${answer}.`,
        ru: `${whole} = ${fraction(whole * den, den)}. Тогда ${fraction(whole * den, den)} + ${fraction(num, den)} = ${fraction(top, den)} = ${answer}.`,
      },
      hint: { es: "Pasa el entero a fraccion con denominador comun.", ru: "Преврати целое в дробь с тем же знаменателем." },
      commonMistake: { es: "Sumar entero directo al numerador sin convertir.", ru: "Сразу прибавить целое к числителю без преобразования." },
      skillTags: ["mixed-number", "fraction-add"],
    };
  }

  if (template === "fraction-sub-same-den") {
    const [a, b, d] = params;
    const diff = a - b;
    const g = gcd(diff, d);
    const answer = fraction(diff / g, d / g);
    const prompt = phraseVariant("fracciones", template, difficulty, params, [
      { es: `Calcula y simplifica: ${fraction(a, d)} - ${fraction(b, d)}`, ru: `Вычисли и сократи: ${fraction(a, d)} - ${fraction(b, d)}` },
      { es: `Resta las fracciones ${fraction(a, d)} y ${fraction(b, d)}.`, ru: `Вычти дроби ${fraction(a, d)} и ${fraction(b, d)}.` },
    ]);
    return {
      ...baseQuestion("fracciones", template, difficulty, params),
      prompt,
      answer,
      explanation: {
        es: `El denominador queda ${d}: ${a} - ${b} = ${diff}. Simplificado: ${answer}.`,
        ru: `Знаменатель остаётся ${d}: ${a} - ${b} = ${diff}. После сокращения: ${answer}.`,
      },
      hint: { es: "Con igual denominador se restan los numeradores.", ru: "При одинаковом знаменателе вычитаются числители." },
      commonMistake: { es: "Restar tambien los denominadores.", ru: "Вычесть ещё и знаменатели." },
      skillTags: ["fraction-subtract"],
    };
  }

  // ── fraction-add-diff-den ────────────────────────────────────────────────
  if (template === "fraction-add-diff-den") {
    const [n1, d1, n2, d2] = params;
    const l = lcm(d1, d2);
    const sumN = n1 * (l / d1) + n2 * (l / d2);
    const g2 = gcd(sumN, l);
    const sn = sumN / g2;
    const sd = l / g2;
    const answer = sd === 1 ? String(sn) : fraction(sn, sd);
    const prompt = phraseVariant("fracciones", template, difficulty, params, [
      { es: `Suma y simplifica: ${fraction(n1, d1)} + ${fraction(n2, d2)}`, ru: `Сложи и сократи: ${fraction(n1, d1)} + ${fraction(n2, d2)}` },
      { es: `¿Cuánto es ${fraction(n1, d1)} + ${fraction(n2, d2)}? Simplificá el resultado.`, ru: `Сколько будет ${fraction(n1, d1)} + ${fraction(n2, d2)}? Упрости результат.` },
      { es: `Hallá la suma con distinto denominador: ${fraction(n1, d1)} + ${fraction(n2, d2)}`, ru: `Найди сумму с разными знаменателями: ${fraction(n1, d1)} + ${fraction(n2, d2)}` },
      { es: `Primero buscá el denominador común. ¿Cuánto es ${fraction(n1, d1)} + ${fraction(n2, d2)}?`, ru: `Сначала найди общий знаменатель. Сколько будет ${fraction(n1, d1)} + ${fraction(n2, d2)}?` },
    ]);
    return {
      ...baseQuestion("fracciones", template, difficulty, params),
      prompt,
      answer,
      explanation: {
        es: `MCM(${d1}, ${d2}) = ${l}. Convertimos: ${fraction(n1 * (l / d1), l)} + ${fraction(n2 * (l / d2), l)} = ${fraction(sumN, l)} = ${answer}.`,
        ru: `НОК(${d1}, ${d2}) = ${l}. Приводим: ${fraction(n1 * (l / d1), l)} + ${fraction(n2 * (l / d2), l)} = ${fraction(sumN, l)} = ${answer}.`,
      },
      hint: { es: `Buscá el MCM de ${d1} y ${d2}, luego convertí cada fracción.`, ru: `Найди НОК чисел ${d1} и ${d2}, затем преобразуй каждую дробь.` },
      commonMistake: { es: "Sumar numeradores y denominadores por separado sin igualar denominadores.", ru: "Складывать числители и знаменатели отдельно, не приводя к общему знаменателю." },
      skillTags: ["fraction-add-diff-den", "fraction-add"],
    };
  }

  // ── fraction-sub-diff-den ────────────────────────────────────────────────
  if (template === "fraction-sub-diff-den") {
    const [n1, d1, n2, d2] = params;
    const l = lcm(d1, d2);
    const diffN = n1 * (l / d1) - n2 * (l / d2);
    const g2 = gcd(Math.abs(diffN), l);
    const sn = diffN / g2;
    const sd = l / g2;
    const answer = sd === 1 ? String(sn) : fraction(sn, sd);
    const prompt = phraseVariant("fracciones", template, difficulty, params, [
      { es: `Restá y simplificá: ${fraction(n1, d1)} - ${fraction(n2, d2)}`, ru: `Вычти и сократи: ${fraction(n1, d1)} - ${fraction(n2, d2)}` },
      { es: `¿Cuánto es ${fraction(n1, d1)} - ${fraction(n2, d2)}? Simplificá.`, ru: `Сколько будет ${fraction(n1, d1)} - ${fraction(n2, d2)}? Упрости.` },
      { es: `Calculá la diferencia con distinto denominador: ${fraction(n1, d1)} − ${fraction(n2, d2)}`, ru: `Вычисли разность с разными знаменателями: ${fraction(n1, d1)} − ${fraction(n2, d2)}` },
      { es: `Los denominadores son distintos. ¿Cuánto es ${fraction(n1, d1)} − ${fraction(n2, d2)}?`, ru: `Знаменатели разные. Сколько будет ${fraction(n1, d1)} − ${fraction(n2, d2)}?` },
    ]);
    return {
      ...baseQuestion("fracciones", template, difficulty, params),
      prompt,
      answer,
      explanation: {
        es: `MCM(${d1}, ${d2}) = ${l}. Restamos: ${fraction(n1 * (l / d1), l)} − ${fraction(n2 * (l / d2), l)} = ${fraction(diffN, l)} = ${answer}.`,
        ru: `НОК(${d1}, ${d2}) = ${l}. Вычитаем: ${fraction(n1 * (l / d1), l)} − ${fraction(n2 * (l / d2), l)} = ${fraction(diffN, l)} = ${answer}.`,
      },
      hint: { es: `El denominador común es el MCM de ${d1} y ${d2}.`, ru: `Общий знаменатель — НОК чисел ${d1} и ${d2}.` },
      commonMistake: { es: "Restar denominadores o no llevar al mismo denominador antes de restar.", ru: "Вычитать знаменатели или не привести к общему знаменателю перед вычитанием." },
      skillTags: ["fraction-sub-diff-den", "fraction-subtract"],
    };
  }

  // ── fraction-mul ─────────────────────────────────────────────────────────
  if (template === "fraction-mul") {
    const [n1, d1, n2, d2] = params;
    const rawN = n1 * n2;
    const rawD = d1 * d2;
    const g2 = gcd(rawN, rawD);
    const sn = rawN / g2;
    const sd = rawD / g2;
    const answer = sd === 1 ? String(sn) : fraction(sn, sd);
    const prompt = phraseVariant("fracciones", template, difficulty, params, [
      { es: `Multiplicá y simplificá: ${fraction(n1, d1)} × ${fraction(n2, d2)}`, ru: `Умножь и сократи: ${fraction(n1, d1)} × ${fraction(n2, d2)}` },
      { es: `¿Cuánto es ${fraction(n1, d1)} × ${fraction(n2, d2)}?`, ru: `Сколько будет ${fraction(n1, d1)} × ${fraction(n2, d2)}?` },
      { es: `Calculá el producto: ${fraction(n1, d1)} por ${fraction(n2, d2)}.`, ru: `Вычисли произведение: ${fraction(n1, d1)} на ${fraction(n2, d2)}.` },
      { es: `Una cinta mide ${fraction(n1, d1)} m. Usás ${fraction(n2, d2)} de ella. ¿Cuántos metros usás?`, ru: `Лента длиной ${fraction(n1, d1)} м. Ты используешь ${fraction(n2, d2)} её длины. Сколько метров?` },
    ]);
    return {
      ...baseQuestion("fracciones", template, difficulty, params),
      prompt,
      answer,
      explanation: {
        es: `Se multiplican numeradores y denominadores: ${n1}×${n2} = ${rawN} y ${d1}×${d2} = ${rawD}. Simplificado: ${answer}.`,
        ru: `Умножаем числители и знаменатели: ${n1}×${n2} = ${rawN} и ${d1}×${d2} = ${rawD}. После сокращения: ${answer}.`,
      },
      hint: { es: "Multiplicá numerador por numerador y denominador por denominador, después simplificá.", ru: "Умножай числитель на числитель, знаменатель на знаменатель, затем сокращай." },
      commonMistake: { es: "Sumar los denominadores en vez de multiplicarlos.", ru: "Складывать знаменатели вместо умножения." },
      skillTags: ["fraction-mul"],
    };
  }

  // ── fraction-div ─────────────────────────────────────────────────────────
  if (template === "fraction-div") {
    const [n1, d1, n2, d2] = params;
    // (n1/d1) ÷ (n2/d2) = (n1 * d2) / (d1 * n2)
    const rawN = n1 * d2;
    const rawD = d1 * n2;
    const g2 = gcd(rawN, rawD);
    const sn = rawN / g2;
    const sd = rawD / g2;
    const answer = sd === 1 ? String(sn) : fraction(sn, sd);
    const prompt = phraseVariant("fracciones", template, difficulty, params, [
      { es: `Dividí y simplificá: ${fraction(n1, d1)} ÷ ${fraction(n2, d2)}`, ru: `Раздели и сократи: ${fraction(n1, d1)} ÷ ${fraction(n2, d2)}` },
      { es: `¿Cuánto es ${fraction(n1, d1)} dividido ${fraction(n2, d2)}?`, ru: `Сколько будет ${fraction(n1, d1)} разделить на ${fraction(n2, d2)}?` },
      { es: `Calculá el cociente: ${fraction(n1, d1)} : ${fraction(n2, d2)}`, ru: `Вычисли частное: ${fraction(n1, d1)} : ${fraction(n2, d2)}` },
      { es: `Tenés ${fraction(n1, d1)} de tarta y cada porción es ${fraction(n2, d2)}. ¿Cuántas porciones hay?`, ru: `У тебя ${fraction(n1, d1)} торта, каждая порция — ${fraction(n2, d2)}. Сколько порций?` },
    ]);
    return {
      ...baseQuestion("fracciones", template, difficulty, params),
      prompt,
      answer,
      explanation: {
        es: `Dividir por ${fraction(n2, d2)} es igual a multiplicar por su inverso ${fraction(d2, n2)}: ${fraction(n1, d1)} × ${fraction(d2, n2)} = ${fraction(rawN, rawD)} = ${answer}.`,
        ru: `Делить на ${fraction(n2, d2)} — то же что умножать на обратную ${fraction(d2, n2)}: ${fraction(n1, d1)} × ${fraction(d2, n2)} = ${fraction(rawN, rawD)} = ${answer}.`,
      },
      hint: { es: "Para dividir fracciones: multiplicá la primera por el inverso de la segunda.", ru: "Чтобы разделить дроби: умножь первую на обратную вторую." },
      commonMistake: { es: "Invertir la primera fracción en vez de la segunda.", ru: "Перевернуть первую дробь вместо второй." },
      skillTags: ["fraction-div"],
    };
  }

  // ── fraction-word-add ────────────────────────────────────────────────────
  if (template === "fraction-word-add") {
    const [n1, d1, n2, d2] = params;
    const l = lcm(d1, d2);
    const sumN = n1 * (l / d1) + n2 * (l / d2);
    const g2 = gcd(sumN, l);
    const sn = sumN / g2;
    const sd = l / g2;
    const answer = sd === 1 ? String(sn) : fraction(sn, sd);
    const f1 = fraction(n1, d1);
    const f2 = fraction(n2, d2);
    const prompt = phraseVariant("fracciones", template, difficulty, params, [
      {
        es: `Juan comió ${f1} de una pizza y su hermana comió ${f2}. ¿Qué fracción de la pizza comieron en total?`,
        ru: `Хуан съел ${f1} пиццы, а его сестра — ${f2}. Какую часть пиццы они съели вместе?`,
      },
      {
        es: `Ana caminó ${f1} del camino por la mañana y ${f2} por la tarde. ¿Qué fracción del camino recorrió?`,
        ru: `Ана прошла ${f1} пути утром и ${f2} днём. Какую часть пути она прошла?`,
      },
      {
        es: `En una botella se usó ${f1} para cocinar y ${f2} para tomar. ¿Qué parte del agua se usó en total?`,
        ru: `Из бутылки потратили ${f1} на готовку и ${f2} на питьё. Какую часть воды использовали?`,
      },
      {
        es: `Un depósito se llenó ${f1} por la mañana y ${f2} por la tarde. ¿Qué fracción está llena en total?`,
        ru: `Резервуар заполнили ${f1} утром и ${f2} днём. Какая часть заполнена в итоге?`,
      },
    ]);
    return {
      ...baseQuestion("fracciones", template, difficulty, params),
      prompt,
      answer,
      explanation: {
        es: `MCM(${d1}, ${d2}) = ${l}. Sumamos: ${fraction(n1 * (l / d1), l)} + ${fraction(n2 * (l / d2), l)} = ${fraction(sumN, l)} = ${answer}.`,
        ru: `НОК(${d1}, ${d2}) = ${l}. Складываем: ${fraction(n1 * (l / d1), l)} + ${fraction(n2 * (l / d2), l)} = ${fraction(sumN, l)} = ${answer}.`,
      },
      hint: { es: "Primero igualá los denominadores usando el MCM.", ru: "Сначала приведи знаменатели к общему с помощью НОК." },
      commonMistake: { es: "Sumar numeradores y denominadores por separado.", ru: "Складывать числители и знаменатели раздельно." },
      skillTags: ["fraction-add-diff-den", "fraction-add"],
    };
  }

  if (template === "multi-step-word-problem") {
    const [totalUnits, step1Den, step2Den, step3Num, step3Den] = params;
    const after1 = totalUnits / step1Den;
    const after2 = after1 / step2Den;
    const answer = Math.round((after2 * step3Num) / step3Den);
    const step1Es = ({ 2: "la mitad", 3: "un tercio", 4: "un cuarto" } as Record<number, string>)[step1Den] ?? `1/${step1Den}`;
    const step1Ru = ({ 2: "половину", 3: "треть", 4: "четверть" } as Record<number, string>)[step1Den] ?? `1/${step1Den}`;
    const step2Es = ({ 2: "la mitad de eso", 3: "el tercio de ese resultado", 4: "la cuarta parte de ese resultado" } as Record<number, string>)[step2Den] ?? `1/${step2Den} de eso`;
    const step2Ru = ({ 2: "из этого половину", 3: "треть этого результата", 4: "четверть этого результата" } as Record<number, string>)[step2Den] ?? `1/${step2Den} от этого`;
    const prompt = phraseVariant("fracciones", template, difficulty, params, [
      {
        es: `En una panaderia hay ${totalUnits} facturas. Se uso ${step1Es} para la masa, luego ${step2Es} para la grasa, y de lo que quedo se hicieron ${fraction(step3Num, step3Den)}. Cuantas facturas salieron?`,
        ru: `В пекарне ${totalUnits} булочек. Взяли ${step1Ru} для теста, потом ${step2Ru} для глазури, а из остатка сделали ${fraction(step3Num, step3Den)} порций. Сколько получилось?`,
      },
      {
        es: `Un vivero tiene ${totalUnits} plantas. Se usa ${step1Es} para el sector A, luego ${step2Es} va al sector B, y de lo que sobra se planta ${fraction(step3Num, step3Den)}. Cuantas plantas se plantan?`,
        ru: `В питомнике ${totalUnits} растений. ${step1Ru} уходит в зону A, потом ${step2Ru} — в зону B, а из остатка высаживают ${fraction(step3Num, step3Den)}. Сколько высадили?`,
      },
      {
        es: `En un torneo hay ${totalUnits} puntos. El equipo A toma ${step1Es}, el equipo B toma ${step2Es} de los restantes, y del saldo se reparte ${fraction(step3Num, step3Den)}. Cuantos puntos son?`,
        ru: `На турнире ${totalUnits} очков. Команда A берёт ${step1Ru}, команда B — ${step2Ru} от оставшегося, а из остатка делят ${fraction(step3Num, step3Den)}. Сколько это очков?`,
      },
    ]);
    return {
      ...baseQuestion("fracciones", template, difficulty, params),
      prompt,
      answer: String(answer),
      explanation: {
        es: `Paso 1: ${totalUnits} / ${step1Den} = ${after1}. Paso 2: ${after1} / ${step2Den} = ${after2}. Paso 3: ${fraction(step3Num, step3Den)} de ${after2} = ${answer}.`,
        ru: `Шаг 1: ${totalUnits} / ${step1Den} = ${after1}. Шаг 2: ${after1} / ${step2Den} = ${after2}. Шаг 3: ${fraction(step3Num, step3Den)} от ${after2} = ${answer}.`,
      },
      hint: {
        es: `Hacelo en tres pasos: divide por ${step1Den}, luego por ${step2Den}, luego aplica la fraccion.`,
        ru: `Делай в три шага: раздели на ${step1Den}, потом на ${step2Den}, потом примени дробь.`,
      },
      commonMistake: {
        es: "Aplicar las tres operaciones al total original en vez del resultado anterior.",
        ru: "Применять все три операции к исходному числу вместо результата предыдущего шага.",
      },
      skillTags: ["fraction-of-number", "multi-step-reasoning"],
      xp: difficulty >= 4 ? 20 : 15,
    };
  }

  // ── fallthrough: fraction-add-same-den ───────────────────────────────────
  const [a, b, d] = params;
  const sum = a + b;
  const g = gcd(sum, d);
  const answer = fraction(sum / g, d / g);
  const prompt = phraseVariant("fracciones", template, difficulty, params, [
    { es: `Calcula y simplifica: ${fraction(a, d)} + ${fraction(b, d)}`, ru: `Вычисли и сократи: ${fraction(a, d)} + ${fraction(b, d)}` },
    { es: `Suma las fracciones ${fraction(a, d)} y ${fraction(b, d)}.`, ru: `Сложи дроби ${fraction(a, d)} и ${fraction(b, d)}.` },
    { es: `Mismo denominador: cuanto da ${fraction(a, d)} + ${fraction(b, d)}?`, ru: `Одинаковый знаменатель: сколько будет ${fraction(a, d)} + ${fraction(b, d)}?` },
  ]);
  return {
    ...baseQuestion("fracciones", template, difficulty, params),
    prompt,
    answer,
    explanation: {
      es: `El denominador queda ${d}: ${a} + ${b} = ${sum}. Simplificado: ${answer}.`,
      ru: `Знаменатель остаётся ${d}: ${a} + ${b} = ${sum}. После сокращения: ${answer}.`,
    },
    hint: { es: "Con igual denominador se suman los numeradores.", ru: "При одинаковом знаменателе складываются числители." },
    commonMistake: { es: "Sumar tambien los denominadores.", ru: "Сложить ещё и знаменатели." },
    skillTags: ["fraction-add"],
  };
}

function buildDecimales(template: TemplateId, difficulty: number, params: number[]): Question {
  if (template === "decimal-round") {
    const [raw] = params;
    const value = raw / 100;
    const answer = Math.round(value * 10) / 10;
    const prompt = phraseVariant("decimales", template, difficulty, params, [
      { es: `Redondea ${decimalComma(value)} a los decimos.`, ru: `Округли ${decimalComma(value)} до десятых.` },
      { es: `Aproxima ${decimalComma(value)} a una cifra decimal.`, ru: `Округли ${decimalComma(value)} до одного знака после запятой.` },
    ]);
    return {
      ...baseQuestion("decimales", template, difficulty, params),
      prompt,
      answer: cleanDecimal(answer),
      explanation: {
        es: `Miramos los centesimos. ${decimalComma(value)} redondeado a decimos es ${decimalComma(answer)}.`,
        ru: `Смотрим на сотые. ${decimalComma(value)} до десятых = ${decimalComma(answer)}.`,
      },
      hint: { es: "Si los centesimos son 5 o mas, sube el decimo.", ru: "Если сотые 5 или больше, десятые увеличиваются." },
      commonMistake: { es: "Cortar el numero sin redondear.", ru: "Просто отбросить цифру без округления." },
      skillTags: ["decimal-round"],
    };
  }

  if (template === "decimal-measure-convert") {
    const [centimeters] = params;
    const answer = centimeters / 100;
    const prompt = phraseVariant("decimales", template, difficulty, params, [
      { es: `Convierte ${centimeters} cm a metros.`, ru: `Переведи ${centimeters} см в метры.` },
      { es: `${centimeters} centimetros equivalen a cuantos metros?`, ru: `${centimeters} сантиметров — это сколько метров?` },
    ]);
    return {
      ...baseQuestion("decimales", template, difficulty, params),
      prompt,
      answer: cleanDecimal(answer),
      explanation: {
        es: `100 cm = 1 m, entonces ${centimeters} / 100 = ${decimalComma(answer)} m.`,
        ru: `100 см = 1 м, значит ${centimeters} / 100 = ${decimalComma(answer)} м.`,
      },
      hint: { es: "Para pasar de cm a m, divide por 100.", ru: "Чтобы перевести см в м, раздели на 100." },
      commonMistake: { es: "Multiplicar por 100 en vez de dividir.", ru: "Умножить на 100 вместо деления." },
      skillTags: ["decimal-measure", "decimal-times-10"],
    };
  }

  if (template === "decimal-money-change") {
    const [priceA, countA, priceB, paid] = params;
    const totalCents = priceA * countA + priceB;
    const answer = (paid - totalCents) / 100;
    const prompt = phraseVariant("decimales", template, difficulty, params, [
      {
        es: `Compras ${countA} productos de $${decimalComma(priceA / 100)} y otro de $${decimalComma(priceB / 100)}. Pagas $${decimalComma(paid / 100)}. Cuanto vuelto recibis?`,
        ru: `Покупаешь ${countA} товара по $${decimalComma(priceA / 100)} и ещё один за $${decimalComma(priceB / 100)}. Платишь $${decimalComma(paid / 100)}. Сколько сдачи?`,
      },
      {
        es: `Ticket: ${countA} x $${decimalComma(priceA / 100)} + $${decimalComma(priceB / 100)}. Pago: $${decimalComma(paid / 100)}. Vuelto?`,
        ru: `Чек: ${countA} x $${decimalComma(priceA / 100)} + $${decimalComma(priceB / 100)}. Оплата: $${decimalComma(paid / 100)}. Сдача?`,
      },
    ]);
    return {
      ...baseQuestion("decimales", template, difficulty, params),
      prompt,
      answer: cleanDecimal(answer),
      explanation: {
        es: `Total = ${decimalComma(totalCents / 100)}. Vuelto = ${decimalComma(paid / 100)} - ${decimalComma(totalCents / 100)} = ${decimalComma(answer)}.`,
        ru: `Итого = ${decimalComma(totalCents / 100)}. Сдача = ${decimalComma(paid / 100)} - ${decimalComma(totalCents / 100)} = ${decimalComma(answer)}.`,
      },
      hint: { es: "Primero calcula el total del ticket; despues resta al pago.", ru: "Сначала посчитай сумму чека, потом вычти из оплаты." },
      commonMistake: { es: "No multiplicar el precio por la cantidad.", ru: "Не умножить цену на количество." },
      skillTags: ["decimal-money", "decimal-subtraction"],
    };
  }

  if (template === "decimal-compare") {
    const [rawA, rawB] = params;
    const a = rawA / 100;
    const b = rawB / 100;
    const answer = rawA === rawB ? "=" : rawA > rawB ? ">" : "<";
    const prompt = phraseVariant("decimales", template, difficulty, params, [
      { es: `Compara: ${decimalComma(a)} __ ${decimalComma(b)}`, ru: `Сравни: ${decimalComma(a)} __ ${decimalComma(b)}` },
      { es: `Que signo va entre ${decimalComma(a)} y ${decimalComma(b)}?`, ru: `Какой знак поставить между ${decimalComma(a)} и ${decimalComma(b)}?` },
      { es: `Elegi si ${decimalComma(a)} es mayor, menor o igual que ${decimalComma(b)}.`, ru: `Выбери: ${decimalComma(a)} больше, меньше или равно ${decimalComma(b)}.` },
    ]);
    return {
      ...baseQuestion("decimales", template, difficulty, params, "multiple_choice"),
      prompt,
      options: [{ es: ">", ru: ">" }, { es: "<", ru: "<" }, { es: "=", ru: "=" }],
      answer,
      explanation: {
        es: `Compara primero la parte entera y despues decimos/centesimos: ${decimalComma(a)} ${answer} ${decimalComma(b)}.`,
        ru: `Сначала сравни целую часть, потом десятые и сотые: ${decimalComma(a)} ${answer} ${decimalComma(b)}.`,
      },
      hint: { es: "Si hace falta, agrega ceros: 3,5 = 3,50.", ru: "Если нужно, добавь нули: 3,5 = 3,50." },
      commonMistake: { es: "Creer que mas cifras siempre significa un numero mayor.", ru: "Думать, что больше цифр всегда значит большее число." },
      skillTags: ["decimal-compare"],
    };
  }

  if (template === "decimal-times-10") {
    const [raw, factor] = params;
    const value = raw / 10;
    const answer = value * factor;
    const prompt = phraseVariant("decimales", template, difficulty, params, [
      { es: `Cuanto es ${decimalComma(value)} x ${factor}?`, ru: `Сколько будет ${decimalComma(value)} x ${factor}?` },
      { es: `Multiplica ${decimalComma(value)} por ${factor}.`, ru: `Умножь ${decimalComma(value)} на ${factor}.` },
      { es: `Corre la coma: ${decimalComma(value)} x ${factor}.`, ru: `Сдвинь запятую: ${decimalComma(value)} x ${factor}.` },
    ]);
    return {
      ...baseQuestion("decimales", template, difficulty, params),
      prompt,
      answer: cleanDecimal(answer),
      explanation: {
        es: `Al multiplicar por ${factor}, la coma se mueve. Resultado: ${decimalComma(answer)}.`,
        ru: `При умножении на ${factor} запятая сдвигается. Ответ: ${decimalComma(answer)}.`,
      },
      hint: { es: "Mover la coma suele ser mas rapido que multiplicar largo.", ru: "Сдвигать запятую быстрее, чем умножать столбиком." },
      commonMistake: { es: "Mover la coma para el lado contrario.", ru: "Сдвинуть запятую не в ту сторону." },
      skillTags: ["decimal-times-10"],
    };
  }

  const [rawA, rawB] = params;
  const a = rawA / 10;
  const b = rawB / 10;
  const answer = template === "decimal-sub" ? a - b : a + b;
  const sign = template === "decimal-sub" ? "-" : "+";
  const prompt = phraseVariant("decimales", template, difficulty, params, [
    { es: `Cuanto es ${decimalComma(a)} ${sign} ${decimalComma(b)}?`, ru: `Сколько будет ${decimalComma(a)} ${sign} ${decimalComma(b)}?` },
    { es: `Resolve: ${decimalComma(a)} ${sign} ${decimalComma(b)}.`, ru: `Реши: ${decimalComma(a)} ${sign} ${decimalComma(b)}.` },
    { es: `Alinea las comas y calcula ${decimalComma(a)} ${sign} ${decimalComma(b)}.`, ru: `Выровняй запятые и вычисли ${decimalComma(a)} ${sign} ${decimalComma(b)}.` },
  ]);
  return {
    ...baseQuestion("decimales", template, difficulty, params),
    prompt,
    answer: cleanDecimal(answer),
    explanation: {
      es: `Alinea las comas: ${decimalComma(a)} ${sign} ${decimalComma(b)} = ${decimalComma(answer)}.`,
      ru: `Выровняй запятые: ${decimalComma(a)} ${sign} ${decimalComma(b)} = ${decimalComma(answer)}.`,
    },
    hint: { es: "Escribi los decimales uno debajo del otro con la coma alineada.", ru: "Запиши десятичные числа друг под другом по запятой." },
    commonMistake: { es: "No alinear las comas.", ru: "Не выровнять запятые." },
    skillTags: [template === "decimal-sub" ? "decimal-subtraction" : "decimal-addition"],
  };
}

function buildPorcentajes(template: TemplateId, difficulty: number, params: number[]): Question {
  const [amount, pct] = params;
  const percentValue = (amount * pct) / 100;

  if (template === "percent-of") {
    const prompt = phraseVariant("porcentajes", template, difficulty, params, [
      { es: `Cuanto es el ${pct}% de ${amount}?`, ru: `Сколько составляет ${pct}% от ${amount}?` },
      { es: `Calcula ${pct}% de ${amount}.`, ru: `Вычисли ${pct}% от ${amount}.` },
      { es: `De ${amount}, cuanto representa el ${pct}%?`, ru: `Сколько от ${amount} составляет ${pct}%?` },
    ]);
    return {
      ...baseQuestion("porcentajes", template, difficulty, params),
      prompt,
      answer: cleanDecimal(percentValue),
      explanation: {
        es: `${pct}% de ${amount} = ${cleanDecimal(percentValue)}.`,
        ru: `${pct}% от ${amount} = ${cleanDecimal(percentValue)}.`,
      },
      hint: { es: "10% es dividir por 10; 25% es dividir por 4; 50% es la mitad.", ru: "10% — делить на 10; 25% — на 4; 50% — половина." },
      commonMistake: { es: "Confundir el porcentaje con el resultado final.", ru: "Перепутать процент и итоговое значение." },
      skillTags: ["percent-of"],
    };
  }

  if (template === "percent-find-rate") {
    const [part, total] = params;
    const answer = (part * 100) / total;
    const prompt = phraseVariant("porcentajes", template, difficulty, params, [
      { es: `${part} es que porcentaje de ${total}?`, ru: `${part} это какой процент от ${total}?` },
      { es: `Completa: ${part} de ${total} = ___%`, ru: `Заполни: ${part} из ${total} = ___%` },
    ]);
    return {
      ...baseQuestion("porcentajes", template, difficulty, params),
      prompt,
      answer: cleanDecimal(answer),
      explanation: {
        es: `Porcentaje = (${part} / ${total}) x 100 = ${cleanDecimal(answer)}%.`,
        ru: `Процент = (${part} / ${total}) x 100 = ${cleanDecimal(answer)}%.`,
      },
      hint: { es: "Divide la parte por el total y multiplica por 100.", ru: "Раздели часть на целое и умножь на 100." },
      commonMistake: { es: "Dividir al reves: total/parte.", ru: "Делить наоборот: целое/часть." },
      skillTags: ["percent-of"],
    };
  }

  if (template === "discount-amount") {
    const [price, pct] = params;
    const answer = (price * pct) / 100;
    const prompt = phraseVariant("porcentajes", template, difficulty, params, [
      { es: `Un producto cuesta $${price} y tiene ${pct}% de descuento. Cuanto se descuenta?`, ru: `Товар стоит $${price}, скидка ${pct}%. Сколько скидка в деньгах?` },
      { es: `Calcula el monto del descuento: ${pct}% de $${price}.`, ru: `Вычисли сумму скидки: ${pct}% от $${price}.` },
    ]);
    return {
      ...baseQuestion("porcentajes", template, difficulty, params),
      prompt,
      answer: cleanDecimal(answer),
      explanation: {
        es: `Descuento = ${price} x ${pct}/100 = ${cleanDecimal(answer)}.`,
        ru: `Скидка = ${price} x ${pct}/100 = ${cleanDecimal(answer)}.`,
      },
      hint: { es: "Primero calcula el porcentaje, despues piensa en el precio final.", ru: "Сначала найди сумму процента, потом конечную цену." },
      commonMistake: { es: "Responder el precio final en vez del descuento.", ru: "Ответить конечной ценой вместо суммы скидки." },
      skillTags: ["discount", "percent-of"],
    };
  }

  if (template === "compare-discounts") {
    const [priceA, pctA, priceB, pctB] = params;
    const finalA = priceA - (priceA * pctA) / 100;
    const finalB = priceB - (priceB * pctB) / 100;
    const answer = finalA === finalB ? "=" : finalA < finalB ? "A" : "B";
    const prompt = phraseVariant("porcentajes", template, difficulty, params, [
      {
        es: `Que oferta conviene? A: $${priceA} con ${pctA}% de descuento. B: $${priceB} con ${pctB}% de descuento.`,
        ru: `Какое предложение выгоднее? A: $${priceA} со скидкой ${pctA}%. B: $${priceB} со скидкой ${pctB}%.`,
      },
      {
        es: `Compara precios finales: A cuesta $${priceA} con ${pctA}% menos; B cuesta $${priceB} con ${pctB}% menos.`,
        ru: `Сравни итоговые цены: A стоит $${priceA} минус ${pctA}%; B стоит $${priceB} минус ${pctB}%.`,
      },
    ]);
    return {
      ...baseQuestion("porcentajes", template, difficulty, params, "multiple_choice"),
      prompt,
      options: [{ es: "A", ru: "A" }, { es: "B", ru: "B" }, { es: "=", ru: "=" }],
      answer,
      explanation: {
        es: `A queda en ${cleanDecimal(finalA)}. B queda en ${cleanDecimal(finalB)}. Conviene ${answer}.`,
        ru: `A получается ${cleanDecimal(finalA)}. B получается ${cleanDecimal(finalB)}. Выгоднее ${answer}.`,
      },
      hint: { es: "No compares solo el porcentaje: calcula cada precio final.", ru: "Сравнивай не только процент: посчитай обе итоговые цены." },
      commonMistake: { es: "Elegir el descuento mas grande sin mirar el precio inicial.", ru: "Выбрать большую скидку, не учитывая начальную цену." },
      skillTags: ["compare-discounts", "discount"],
    };
  }

  if (template === "discount-budget") {
    const [budget, price, pct] = params;
    const discount = (price * pct) / 100;
    const finalPrice = price - discount;
    const answer = budget - finalPrice;
    const prompt = phraseVariant("porcentajes", template, difficulty, params, [
      {
        es: `Tenes $${budget}. Un producto cuesta $${price} y tiene ${pct}% de descuento. Cuanto dinero te queda?`,
        ru: `У тебя $${budget}. Товар стоит $${price}, скидка ${pct}%. Сколько денег останется?`,
      },
      {
        es: `Con $${budget}, compras algo de $${price} con rebaja de ${pct}%. Calcula el sobrante.`,
        ru: `Есть $${budget}, покупаешь товар за $${price} со скидкой ${pct}%. Найди остаток.`,
      },
    ]);
    return {
      ...baseQuestion("porcentajes", template, difficulty, params),
      prompt,
      answer: cleanDecimal(answer),
      explanation: {
        es: `Descuento = ${cleanDecimal(discount)}. Precio final = ${cleanDecimal(finalPrice)}. Sobra ${cleanDecimal(answer)}.`,
        ru: `Скидка = ${cleanDecimal(discount)}. Итоговая цена = ${cleanDecimal(finalPrice)}. Остаётся ${cleanDecimal(answer)}.`,
      },
      hint: { es: "Calcula el descuento, resta al precio y despues resta al presupuesto.", ru: "Найди скидку, вычти из цены, потом вычти из бюджета." },
      commonMistake: { es: "Restar el descuento al presupuesto directamente.", ru: "Вычесть скидку сразу из бюджета." },
      skillTags: ["discount", "budget"],
    };
  }

  if (template === "discount-quantity-total") {
    const [price, quantity, pct] = params;
    const discountedUnit = price - (price * pct) / 100;
    const answer = cleanDecimal(discountedUnit * quantity);
    const item = phraseVariant("porcentajes", `${template}-item` as TemplateId, difficulty, params, [
      "pack",
      "entrada infantil",
      "album",
      "pelota",
      "kit",
      "camiseta",
    ]);
    const prompt = phraseVariant("porcentajes", template, difficulty, params, [
      { es: `Cada ${item} cuesta $${price} y hay ${pct}% de descuento. Si compras ${quantity}, cuanto pagas en total?`, ru: `Каждый ${item} стоит $${price}, скидка ${pct}%. Если купить ${quantity}, сколько заплатишь всего?` },
      { es: `Un ${item} vale $${price}. Con promo de ${pct}%, cual es el total por ${quantity} unidades?`, ru: `${item} стоит $${price}. По акции ${pct}% сколько будет за ${quantity} штук?` },
      { es: `${item} de $${price} con ${pct}% off, cantidad ${quantity}. Calcula el pago final total.`, ru: `${item} за $${price} со скидкой ${pct}%, количество ${quantity}. Найди итоговую оплату.` },
      { es: `Compras ${quantity} ${item}s. El precio base es $${price} y hoy hay ${pct}% de rebaja. Cuanto cuesta la compra?`, ru: `Покупаешь ${quantity} ${item}. Базовая цена $${price}, сегодня скидка ${pct}%. Сколько стоит покупка?` },
      { es: `Promo del dia: ${pct}% para ${item}. Si cada uno cuesta $${price} y llevas ${quantity}, cual es el total?`, ru: `Акция дня: ${pct}% на ${item}. Если один стоит $${price}, а берешь ${quantity}, какой итог?` },
      { es: `Precio unitario de ${item}: $${price}. Descuento: ${pct}%. Cantidad: ${quantity}. Cuanto pagas?`, ru: `Цена за ${item}: $${price}. Скидка: ${pct}%. Количество: ${quantity}. Сколько к оплате?` },
    ]);
    return {
      ...baseQuestion("porcentajes", template, difficulty, params),
      prompt,
      answer,
      explanation: {
        es: `Precio por unidad con descuento: ${cleanDecimal(discountedUnit)}. Multiplicando por ${quantity}: ${answer}.`,
        ru: `Цена за единицу со скидкой: ${cleanDecimal(discountedUnit)}. Умножаем на ${quantity}: ${answer}.`,
      },
      hint: { es: "Primero baja el precio unitario, despues multiplica por la cantidad.", ru: "Сначала уменьши цену за штуку, потом умножь на количество." },
      commonMistake: { es: "Aplicar descuento al total mal calculado.", ru: "Неправильно применить скидку к общей сумме." },
      skillTags: ["discount", "budget", "multiplication"],
    };
  }

  if (template === "discount-quantity-savings") {
    const [price, quantity, pct] = params;
    const savings = ((price * pct) / 100) * quantity;
    const answer = cleanDecimal(savings);
    const item = phraseVariant("porcentajes", `${template}-item` as TemplateId, difficulty, params, [
      "pack",
      "entrada",
      "album",
      "pelota",
      "kit",
      "combo",
    ]);
    const prompt = phraseVariant("porcentajes", template, difficulty, params, [
      { es: `Un ${item} cuesta $${price} y tiene ${pct}% de descuento. Si compras ${quantity}, cuanto ahorras en total?`, ru: `${item} стоит $${price} и имеет скидку ${pct}%. Если купить ${quantity}, сколько сэкономишь всего?` },
      { es: `Promo ${pct}% sobre $${price} por unidad. Calcula el ahorro total en ${quantity} ${item}s.`, ru: `Скидка ${pct}% от $${price} за единицу. Найди общую экономию для ${quantity} ${item}.` },
      { es: `Por cada ${item} de $${price} ahorras ${pct}%. Cuanto se ahorra comprando ${quantity}?`, ru: `За каждый ${item} по $${price} экономишь ${pct}%. Сколько экономии при покупке ${quantity}?` },
      { es: `Descuento del ${pct}% en ${item}. Si llevas ${quantity} y cada uno vale $${price}, cual es el ahorro total?`, ru: `Скидка ${pct}% на ${item}. Если берешь ${quantity}, а каждый стоит $${price}, какая общая экономия?` },
      { es: `Oferta especial: ${pct}% menos por ${item}. Con precio $${price} y ${quantity} unidades, cuanto te ahorras?`, ru: `Спецпредложение: минус ${pct}% на ${item}. Цена $${price}, количество ${quantity} — сколько сбережешь?` },
      { es: `Si el descuento por ${item} es ${pct}% sobre $${price}, calcula el ahorro total para ${quantity} unidades.`, ru: `Если скидка на ${item} составляет ${pct}% от $${price}, посчитай экономию для ${quantity} штук.` },
    ]);
    return {
      ...baseQuestion("porcentajes", template, difficulty, params),
      prompt,
      answer,
      explanation: {
        es: `Ahorro por unidad: ${cleanDecimal((price * pct) / 100)}. Por ${quantity} unidades: ${answer}.`,
        ru: `Экономия на единицу: ${cleanDecimal((price * pct) / 100)}. Для ${quantity} штук: ${answer}.`,
      },
      hint: { es: "Calcula el descuento de una unidad y multiplica por cantidad.", ru: "Найди скидку на одну единицу и умножь на количество." },
      commonMistake: { es: "Dar el precio final en vez del ahorro.", ru: "Выдать итоговую цену вместо экономии." },
      skillTags: ["discount", "percent-of", "multiplication"],
    };
  }

  if (template === "discount-leftover-money") {
    const [budget, price, pct] = params;
    const finalPrice = price - (price * pct) / 100;
    const answer = budget - finalPrice;
    const prompt = phraseVariant("porcentajes", template, difficulty, params, [
      { es: `Un producto cuesta $${price} y tiene ${pct}% de descuento. Si llevas $${budget}, cuanto dinero te sobra?`, ru: `Товар стоит $${price} и скидка ${pct}%. Если у тебя $${budget}, сколько останется?` },
      { es: `Precio $${price}, descuento ${pct}%, dinero disponible $${budget}. Calcula el resto despues de comprar.`, ru: `Цена $${price}, скидка ${pct}%, в наличии $${budget}. Найди остаток после покупки.` },
    ]);
    return {
      ...baseQuestion("porcentajes", template, difficulty, params),
      prompt,
      answer: cleanDecimal(answer),
      explanation: {
        es: `Precio final = ${cleanDecimal(finalPrice)}. Dinero restante = ${budget} - ${cleanDecimal(finalPrice)} = ${cleanDecimal(answer)}.`,
        ru: `Цена со скидкой = ${cleanDecimal(finalPrice)}. Остаток = ${budget} - ${cleanDecimal(finalPrice)} = ${cleanDecimal(answer)}.`,
      },
      hint: { es: "Primero calcula el precio con descuento; luego resta al dinero disponible.", ru: "Сначала найди цену со скидкой, потом вычти из бюджета." },
      commonMistake: { es: "Restar el porcentaje al dinero y no al precio.", ru: "Вычесть процент из денег, а не из цены." },
      skillTags: ["discount", "budget", "subtraction"],
    };
  }

  if (template === "double-discount") {
    const [price, pctA, pctB] = params;
    const afterFirst = price - (price * pctA) / 100;
    const afterSecond = afterFirst - (afterFirst * pctB) / 100;
    const prompt = phraseVariant("porcentajes", template, difficulty, params, [
      { es: `Precio $${price}. Primero ${pctA}% de descuento y luego ${pctB}% extra. Precio final?`, ru: `Цена $${price}. Сначала скидка ${pctA}%, потом еще ${pctB}%. Итоговая цена?` },
      { es: `Aplica dos descuentos seguidos (${pctA}% y ${pctB}%) sobre $${price}.`, ru: `Примени две скидки подряд (${pctA}% и ${pctB}%) к $${price}.` },
    ]);
    return {
      ...baseQuestion("porcentajes", template, difficulty, params),
      prompt,
      answer: cleanDecimal(afterSecond),
      explanation: {
        es: `Tras el primer descuento queda ${cleanDecimal(afterFirst)}. Segundo descuento sobre ese valor: ${cleanDecimal(afterSecond)}.`,
        ru: `После первой скидки остается ${cleanDecimal(afterFirst)}. Вторая скидка идет уже с этой суммы: ${cleanDecimal(afterSecond)}.`,
      },
      hint: { es: "El segundo porcentaje se aplica al precio ya rebajado.", ru: "Второй процент применяется к уже сниженной цене." },
      commonMistake: { es: "Sumar porcentajes y aplicar una sola vez.", ru: "Сложить проценты и применить один раз." },
      skillTags: ["discount", "reverse-percent"],
    };
  }

  if (template === "increase-budget-gap") {
    const [budget, price, pct] = params;
    const finalPrice = price + (price * pct) / 100;
    const gap = finalPrice - budget;
    const prompt = phraseVariant("porcentajes", template, difficulty, params, [
      { es: `Un producto de $${price} aumenta ${pct}%. Si tienes $${budget}, cuanto te falta para comprarlo?`, ru: `Товар $${price} подорожал на ${pct}%. Если у тебя $${budget}, сколько не хватает?` },
      { es: `Precio inicial $${price}, aumento ${pct}%, dinero disponible $${budget}. Calcula faltante.`, ru: `Цена $${price}, рост ${pct}%, доступно $${budget}. Найди нехватку.` },
    ]);
    return {
      ...baseQuestion("porcentajes", template, difficulty, params),
      prompt,
      answer: cleanDecimal(gap),
      explanation: {
        es: `Precio con aumento: ${cleanDecimal(finalPrice)}. Faltante: ${cleanDecimal(finalPrice)} - ${budget} = ${cleanDecimal(gap)}.`,
        ru: `Цена после роста: ${cleanDecimal(finalPrice)}. Нехватка: ${cleanDecimal(finalPrice)} - ${budget} = ${cleanDecimal(gap)}.`,
      },
      hint: { es: "Primero calcula el nuevo precio, luego compáralo con tu dinero.", ru: "Сначала найди новую цену, затем сравни с бюджетом." },
      commonMistake: { es: "Restar presupuesto al precio original.", ru: "Вычесть бюджет из старой цены." },
      skillTags: ["increase", "budget"],
    };
  }

  if (template === "reverse-discount") {
    const [finalPrice, pct] = params;
    const original = finalPrice / (1 - pct / 100);
    const prompt = phraseVariant("porcentajes", template, difficulty, params, [
      { es: `Despues de un ${pct}% de descuento se pago $${finalPrice}. Cual era el precio original?`, ru: `После скидки ${pct}% заплатили $${finalPrice}. Какой была исходная цена?` },
      { es: `$${finalPrice} representa el precio con ${pct}% menos. Calcula el precio antes del descuento.`, ru: `$${finalPrice} — это цена после скидки ${pct}%. Найди цену до скидки.` },
    ]);
    return {
      ...baseQuestion("porcentajes", template, difficulty, params),
      prompt,
      answer: cleanDecimal(original),
      explanation: {
        es: `Si hay ${pct}% de descuento, se paga ${100 - pct}% del precio. ${finalPrice} / ${cleanDecimal((100 - pct) / 100)} = ${cleanDecimal(original)}.`,
        ru: `Если скидка ${pct}%, платят ${100 - pct}% цены. ${finalPrice} / ${cleanDecimal((100 - pct) / 100)} = ${cleanDecimal(original)}.`,
      },
      hint: { es: "El precio final no es el 100%, es el porcentaje que queda.", ru: "Итоговая цена — не 100%, а оставшийся процент." },
      commonMistake: { es: "Sumar el mismo porcentaje al precio final.", ru: "Просто прибавить тот же процент к итоговой цене." },
      skillTags: ["reverse-percent", "discount"],
    };
  }

  const answer = template === "discount-price" ? amount - percentValue : amount + percentValue;
  const directionEs = template === "discount-price" ? "descuento" : "aumento";
  const directionRu = template === "discount-price" ? "скидка" : "наценка";
  const prompt = phraseVariant("porcentajes", template, difficulty, params, [
    {
      es: `Un precio de ${amount} tiene ${pct}% de ${directionEs}. Cual es el precio final?`,
      ru: `Цена ${amount}, ${directionRu} ${pct}%. Какая итоговая цена?`,
    },
    {
      es: template === "discount-price"
        ? `Algo cuesta ${amount} y tiene ${pct}% de rebaja. Cuanto se paga?`
        : `Algo cuesta ${amount} y sube ${pct}%. Cuanto cuesta ahora?`,
      ru: template === "discount-price"
        ? `Товар стоит ${amount}, скидка ${pct}%. Сколько платить?`
        : `Товар стоит ${amount}, цена выросла на ${pct}%. Сколько стоит теперь?`,
    },
    {
      es: template === "discount-price"
        ? `Aplica un descuento de ${pct}% sobre ${amount}.`
        : `Aplica un aumento de ${pct}% sobre ${amount}.`,
      ru: template === "discount-price"
        ? `Примени скидку ${pct}% к ${amount}.`
        : `Примени наценку ${pct}% к ${amount}.`,
    },
  ]);
  return {
    ...baseQuestion("porcentajes", template, difficulty, params),
    prompt,
    answer: cleanDecimal(answer),
    explanation: {
      es: `${pct}% de ${amount} = ${cleanDecimal(percentValue)}. Precio final: ${cleanDecimal(answer)}.`,
      ru: `${pct}% от ${amount} = ${cleanDecimal(percentValue)}. Итог: ${cleanDecimal(answer)}.`,
    },
    hint: { es: "Primero calcula el porcentaje, despues suma o resta.", ru: "Сначала найди процент, потом прибавь или вычти." },
    commonMistake: { es: "Calcular el porcentaje pero olvidar sumarlo o restarlo.", ru: "Найти процент, но забыть прибавить или вычесть." },
    skillTags: [template === "discount-price" ? "discount" : "increase"],
  };
}

function buildGeometria(template: TemplateId, difficulty: number, params: number[]): Question {
  if (template === "area-compare") {
    const [aLen, aWid, bLen, bWid] = params;
    const areaA = aLen * aWid;
    const areaB = bLen * bWid;
    const answer = areaA === areaB ? "=" : areaA > areaB ? "A" : "B";
    const prompt = phraseVariant("geometria", template, difficulty, params, [
      { es: `Que rectangulo tiene mayor area? A: ${aLen} x ${aWid}. B: ${bLen} x ${bWid}.`, ru: `У какого прямоугольника площадь больше? A: ${aLen} x ${aWid}. B: ${bLen} x ${bWid}.` },
      { es: `Compara superficies: A mide ${aLen} cm por ${aWid} cm; B mide ${bLen} cm por ${bWid} cm.`, ru: `Сравни площади: A ${aLen} см на ${aWid} см; B ${bLen} см на ${bWid} см.` },
    ]);
    return {
      ...baseQuestion("geometria", template, difficulty, params, "multiple_choice"),
      prompt,
      options: [{ es: "A", ru: "A" }, { es: "B", ru: "B" }, { es: "=", ru: "=" }],
      answer,
      explanation: {
        es: `Area A = ${areaA}. Area B = ${areaB}. Respuesta: ${answer}.`,
        ru: `Площадь A = ${areaA}. Площадь B = ${areaB}. Ответ: ${answer}.`,
      },
      hint: { es: "Calcula largo x ancho en cada rectangulo.", ru: "Вычисли длина x ширина для каждого прямоугольника." },
      commonMistake: { es: "Comparar solo un lado.", ru: "Сравнить только одну сторону." },
      skillTags: ["area-compare", "rectangle-area"],
    };
  }

  if (template === "perimeter-fence-cost") {
    const [length, width, pricePerMeter] = params;
    const perimeter = 2 * (length + width);
    const answer = perimeter * pricePerMeter;
    const prompt = phraseVariant("geometria", template, difficulty, params, [
      { es: `Un patio rectangular mide ${length} m por ${width} m. Cercarlo cuesta $${pricePerMeter} por metro. Cuanto cuesta?`, ru: `Прямоугольный двор ${length} м на ${width} м. Ограждение стоит $${pricePerMeter} за метр. Сколько стоит?` },
      { es: `Para rodear un rectangulo de ${length} m x ${width} m se paga $${pricePerMeter} por metro. Calcula el total.`, ru: `Чтобы оградить прямоугольник ${length} м x ${width} м, платят $${pricePerMeter} за метр. Найди сумму.` },
    ]);
    return {
      ...baseQuestion("geometria", template, difficulty, params),
      prompt,
      answer: String(answer),
      explanation: {
        es: `Perimetro = 2 x (${length} + ${width}) = ${perimeter}. Costo = ${perimeter} x ${pricePerMeter} = ${answer}.`,
        ru: `Периметр = 2 x (${length} + ${width}) = ${perimeter}. Стоимость = ${perimeter} x ${pricePerMeter} = ${answer}.`,
      },
      hint: { es: "Primero calcula el perimetro, despues multiplica por el precio.", ru: "Сначала найди периметр, потом умножь на цену." },
      commonMistake: { es: "Calcular area en vez de perimetro.", ru: "Посчитать площадь вместо периметра." },
      skillTags: ["perimeter-cost", "rectangle-perimeter"],
    };
  }

  if (template === "compound-area") {
    const [length, width, extraLength, extraWidth] = params;
    const baseArea = length * width;
    const extraArea = extraLength * extraWidth;
    const answer = baseArea + extraArea;
    const prompt = phraseVariant("geometria", template, difficulty, params, [
      {
        es: `Una figura se arma con un rectangulo de ${length} cm por ${width} cm y otro de ${extraLength} cm por ${extraWidth} cm. Cual es el area total?`,
        ru: `Фигура состоит из прямоугольника ${length} см на ${width} см и ещё одного ${extraLength} см на ${extraWidth} см. Какая общая площадь?`,
      },
      {
        es: `Suma las areas de dos rectangulos: ${length}x${width} cm y ${extraLength}x${extraWidth} cm.`,
        ru: `Сложи площади двух прямоугольников: ${length}x${width} см и ${extraLength}x${extraWidth} см.`,
      },
      {
        es: `Un terreno tiene dos partes rectangulares: ${length} por ${width} y ${extraLength} por ${extraWidth}. Area total?`,
        ru: `У участка две прямоугольные части: ${length} на ${width} и ${extraLength} на ${extraWidth}. Общая площадь?`,
      },
    ]);
    return {
      ...baseQuestion("geometria", template, difficulty, params),
      prompt,
      answer: String(answer),
      explanation: {
        es: `Area total = ${length} x ${width} + ${extraLength} x ${extraWidth} = ${baseArea} + ${extraArea} = ${answer} cm2.`,
        ru: `Общая площадь = ${length} x ${width} + ${extraLength} x ${extraWidth} = ${baseArea} + ${extraArea} = ${answer} см2.`,
      },
      hint: { es: "Divide la figura en rectangulos y suma sus areas.", ru: "Разбей фигуру на прямоугольники и сложи площади." },
      commonMistake: { es: "Sumar lados en vez de sumar areas.", ru: "Сложить стороны вместо площадей." },
      skillTags: ["compound-area"],
    };
  }

  if (template === "rect-missing-side-area" || template === "rect-missing-side-perimeter") {
    const [known, target] = params;
    const isArea = template === "rect-missing-side-area";
    const answer = isArea ? target / known : target / 2 - known;
    const prompt = phraseVariant("geometria", template, difficulty, params, isArea ? [
      {
        es: `Un rectangulo tiene area ${target} cm2 y un lado de ${known} cm. Cuanto mide el otro lado?`,
        ru: `Площадь прямоугольника ${target} см2, одна сторона ${known} см. Чему равна другая сторона?`,
      },
      {
        es: `Area ${target} cm2, ancho ${known} cm. Calcula el largo del rectangulo.`,
        ru: `Площадь ${target} см2, ширина ${known} см. Найди длину прямоугольника.`,
      },
      {
        es: `Una pared de Minecraft tiene un area de ${target} bloques y ${known} bloques de alto. Cuantos bloques de ancho mide?`,
        ru: `Стена в Minecraft имеет площадь ${target} блоков, высота ${known} блоков. Какова ширина?`,
      },
      {
        es: `Un banner del estadio tiene area ${target} m2 y altura ${known} m. Cuanto mide de ancho?`,
        ru: `Баннер стадиона площадью ${target} м2, высота ${known} м. Найди ширину.`,
      },
      {
        es: `Una seccion de la cancha mide ${target} m2 de area y ${known} m de largo. Cuanto mide de ancho?`,
        ru: `Секция поля площадью ${target} м2, длина ${known} м. Найди ширину.`,
      },
      {
        es: `Una pagina de album de figuritas tiene ${target} cm2 de area y ${known} cm de alto. Cuanto mide de ancho?`,
        ru: `Страница альбома для наклеек площадью ${target} см2, высота ${known} см. Найди ширину.`,
      },
      {
        es: `Una seccion de pared de edificio tiene area ${target} m2 y mide ${known} m de alto. Cuanto mide de ancho?`,
        ru: `Секция стены здания площадью ${target} м2, высота ${known} м. Какова ширина?`,
      },
    ] : [
      {
        es: `Un rectangulo tiene perimetro ${target} cm y un lado de ${known} cm. Cuanto mide el otro lado?`,
        ru: `Периметр прямоугольника ${target} см, одна сторона ${known} см. Чему равна другая сторона?`,
      },
      {
        es: `Perimetro ${target} cm, ancho ${known} cm. Calcula el largo del rectangulo.`,
        ru: `Периметр ${target} см, ширина ${known} см. Найди длину прямоугольника.`,
      },
      {
        es: `Una pared de Minecraft tiene perimetro ${target} bloques y ${known} bloques de ancho. Cuanto mide de largo?`,
        ru: `Стена в Minecraft с периметром ${target} блоков, ширина ${known} блоков. Найди длину.`,
      },
      {
        es: `Un banner del estadio tiene perimetro ${target} m y ancho ${known} m. Cuanto mide de largo?`,
        ru: `Баннер стадиона с периметром ${target} м, ширина ${known} м. Найди длину.`,
      },
      {
        es: `Una zona de la cancha de futbol tiene perimetro ${target} m y un lado de ${known} m. Cuanto mide el otro lado?`,
        ru: `Зона футбольного поля с периметром ${target} м, одна сторона ${known} м. Найди другую.`,
      },
      {
        es: `Una pagina de album de figuritas tiene perimetro ${target} cm y ancho ${known} cm. Cuanto mide de alto?`,
        ru: `Страница альбома с периметром ${target} см, ширина ${known} см. Найди высоту.`,
      },
      {
        es: `Una seccion de fachada de edificio tiene perimetro ${target} m y un lado de ${known} m. Cuanto mide el lado faltante?`,
        ru: `Секция фасада здания с периметром ${target} м, одна сторона ${known} м. Найди другую.`,
      },
    ]);
    return {
      ...baseQuestion("geometria", template, difficulty, params),
      prompt,
      answer: String(answer),
      explanation: {
        es: isArea
          ? `Otro lado = area dividido lado conocido: ${target} / ${known} = ${answer}.`
          : `La mitad del perimetro es ${target / 2}. Otro lado = ${target / 2} - ${known} = ${answer}.`,
        ru: isArea
          ? `Другая сторона = площадь / известная сторона: ${target} / ${known} = ${answer}.`
          : `Половина периметра ${target / 2}. Другая сторона = ${target / 2} - ${known} = ${answer}.`,
      },
      hint: { es: isArea ? "Area = lado x lado. Usa division." : "Perimetro = 2 x (largo + ancho). Primero divide por 2.", ru: isArea ? "Площадь = сторона x сторона. Используй деление." : "Периметр = 2 x (длина + ширина). Сначала раздели на 2." },
      commonMistake: { es: "Usar la formula directa sin despejar el lado faltante.", ru: "Использовать прямую формулу и не выразить неизвестную сторону." },
      skillTags: [isArea ? "missing-side-area" : "missing-side-perimeter"],
    };
  }

  if (template === "rect-missing-side-perimeter-with-half") {
    const [halfPerimeter, known] = params;
    const answer = halfPerimeter - known;
    const prompt = phraseVariant("geometria", template, difficulty, params, [
      { es: `En un rectangulo, largo + ancho = ${halfPerimeter}. Si un lado mide ${known}, cuanto mide el otro?`, ru: `У прямоугольника длина + ширина = ${halfPerimeter}. Если одна сторона ${known}, какая другая?` },
      { es: `Sabemos que la semisuma de lados es ${halfPerimeter}. Con un lado ${known}, halla el faltante.`, ru: `Полусумма сторон равна ${halfPerimeter}. При стороне ${known} найди вторую.` },
    ]);
    return {
      ...baseQuestion("geometria", template, difficulty, params),
      prompt,
      answer: String(answer),
      explanation: {
        es: `Si largo + ancho = ${halfPerimeter}, entonces el lado faltante es ${halfPerimeter} - ${known} = ${answer}.`,
        ru: `Если длина + ширина = ${halfPerimeter}, недостающая сторона ${halfPerimeter} - ${known} = ${answer}.`,
      },
      hint: { es: "Resta el lado conocido a la suma de lados.", ru: "Вычти известную сторону из суммы сторон." },
      commonMistake: { es: "Dividir por 2 otra vez cuando ya te dieron la semisuma.", ru: "Снова делить на 2, хотя уже дана полусумма." },
      skillTags: ["missing-side-perimeter", "rectangle-perimeter"],
    };
  }

  if (template === "square-area" || template === "square-perimeter") {
    const [side] = params;
    const isArea = template === "square-area";
    const answer = isArea ? side * side : 4 * side;
    const prompt = phraseVariant("geometria", template, difficulty, params, isArea ? [
      { es: `Un cuadrado tiene lado ${side} cm. Cual es su area?`, ru: `Сторона квадрата ${side} см. Какая площадь?` },
      { es: `Calcula el area de un cuadrado de lado ${side} cm.`, ru: `Вычисли площадь квадрата со стороной ${side} см.` },
      { es: `Un piso cuadrado mide ${side} cm de lado. Que superficie ocupa?`, ru: `Квадратная площадка имеет сторону ${side} см. Какую площадь она занимает?` },
    ] : [
      { es: `Un cuadrado tiene lado ${side} cm. Cual es su perimetro?`, ru: `Сторона квадрата ${side} см. Какой периметр?` },
      { es: `Calcula el perimetro de un cuadrado de lado ${side} cm.`, ru: `Вычисли периметр квадрата со стороной ${side} см.` },
      { es: `Se rodea un cuadrado de lado ${side} cm. Cuantos cm se recorren?`, ru: `Обходим квадрат со стороной ${side} см. Сколько см получится?` },
    ]);
    return {
      ...baseQuestion("geometria", template, difficulty, params),
      prompt,
      answer: String(answer),
      explanation: {
        es: isArea ? `Area = ${side} x ${side} = ${answer} cm2.` : `Perimetro = 4 x ${side} = ${answer} cm.`,
        ru: isArea ? `Площадь = ${side} x ${side} = ${answer} см2.` : `Периметр = 4 x ${side} = ${answer} см.`,
      },
      hint: { es: isArea ? "Area del cuadrado: lado x lado." : "Perimetro del cuadrado: 4 x lado.", ru: isArea ? "Площадь квадрата: сторона x сторона." : "Периметр квадрата: 4 x сторона." },
      commonMistake: { es: "Confundir area con perimetro.", ru: "Перепутать площадь и периметр." },
      skillTags: [isArea ? "square-area" : "square-perimeter"],
    };
  }

  const [length, width] = params;
  if (template === "geometry-formula-choice") {
    const [subtype] = params;
    type FV = {
      correct: string;
      distractors: [string, string, string];
      promptEs: string; promptRu: string;
      promptEs2: string; promptRu2: string;
      explanationEs: string; explanationRu: string;
      mistakeEs: string; mistakeRu: string;
      hintEs: string; hintRu: string;
      skillTag: string;
    };
    const VARIANTS: FV[] = [
      {
        correct: "b x h",
        distractors: ["b + h", "2 x (b + h)", "b x b + h x h"],
        promptEs:  "Un rectangulo tiene base b y altura h. Cual expresion representa su area?",
        promptRu:  "Прямоугольник имеет основание b и высоту h. Какое выражение — его площадь?",
        promptEs2: "Un terreno rectangular tiene base b y altura h. Cual formula da su superficie?",
        promptRu2: "Прямоугольный участок с основанием b и высотой h. Какая формула — его площадь?",
        explanationEs: "Area = base x altura = b x h. Sumar los lados da el perimetro, no el area.",
        explanationRu: "Площадь = основание x высота = b x h. Сумма сторон — это периметр, не площадь.",
        mistakeEs: "Confundir area (multiplicar) con perimetro (sumar lados).",
        mistakeRu: "Перепутать площадь (умножить) с периметром (сложить стороны).",
        hintEs: "El area siempre es una multiplicacion de dos dimensiones.",
        hintRu: "Площадь — всегда произведение двух измерений.",
        skillTag: "rectangle-area-formula",
      },
      {
        correct: "2 x (b + h)",
        distractors: ["b x h", "b + h", "4 x b"],
        promptEs:  "Un rectangulo tiene base b y altura h. Cual formula calcula su perimetro?",
        promptRu:  "Прямоугольник с основанием b и высотой h. Какая формула — его периметр?",
        promptEs2: "Para rodear un campo rectangular de base b y altura h, cual expresion usas?",
        promptRu2: "Чтобы обнести прямоугольное поле с основанием b и высотой h, какое выражение?",
        explanationEs: "Perimetro = 2 lados largos + 2 lados cortos = 2 x (b + h).",
        explanationRu: "Периметр = 2 длинных стороны + 2 короткие = 2 x (b + h).",
        mistakeEs: "Sumar solo b + h, olvidando que el rectangulo tiene 4 lados.",
        mistakeRu: "Написать b + h, забыв, что у прямоугольника 4 стороны.",
        hintEs: "Dibuja el rectangulo y conta los 4 lados.",
        hintRu: "Нарисуй прямоугольник и посчитай все 4 стороны.",
        skillTag: "rectangle-perimeter-formula",
      },
      {
        correct: "l x l",
        distractors: ["4 x l", "l + l", "l + 4"],
        promptEs:  "Un cuadrado tiene lado l. Que expresion representa su area?",
        promptRu:  "Квадрат со стороной l. Какое выражение — его площадь?",
        promptEs2: "Un piso cuadrado tiene lado l. Que expresion representa su superficie?",
        promptRu2: "Квадратный пол со стороной l. Какое выражение — его площадь?",
        explanationEs: "El cuadrado tiene b = h = l. Area = l x l.",
        explanationRu: "У квадрата b = h = l. Площадь = l x l.",
        mistakeEs: "Confundir area (l x l) con perimetro del cuadrado (4 x l).",
        mistakeRu: "Перепутать площадь (l x l) с периметром квадрата (4 x l).",
        hintEs: "Area = lado x lado. Para el perimetro seria 4 x lado.",
        hintRu: "Площадь = сторона x сторона. Периметр был бы 4 x сторона.",
        skillTag: "square-area-formula",
      },
    ];
    const v = VARIANTS[subtype % VARIANTS.length];
    const allOpts: string[] = [v.correct, v.distractors[0], v.distractors[1], v.distractors[2]];
    const idHash = hashText(makeId("geometria", template, difficulty, params));
    const shuffled = allOpts
      .map((opt, i) => ({ opt, sort: ((idHash >>> 0) + i * 2654435761) >>> 0 }))
      .sort((a, b) => a.sort - b.sort)
      .map(x => x.opt);
    const prompt = phraseVariant("geometria", template, difficulty, params, [
      { es: v.promptEs,  ru: v.promptRu  },
      { es: v.promptEs2, ru: v.promptRu2 },
    ]);
    return {
      ...baseQuestion("geometria", template, difficulty, params, "multiple_choice"),
      prompt,
      options: shuffled.map(opt => ({ es: opt, ru: opt })),
      answer: v.correct,
      explanation: { es: v.explanationEs, ru: v.explanationRu },
      hint:         { es: v.hintEs,       ru: v.hintRu       },
      commonMistake:{ es: v.mistakeEs,    ru: v.mistakeRu    },
      skillTags: ["geometry-formulas"],
      xp: difficulty >= 3 ? 15 : 10,
    };
  }

  const isArea = template === "rect-area";
  const answer = isArea ? length * width : 2 * (length + width);
  const prompt = phraseVariant("geometria", template, difficulty, params, isArea ? [
    { es: `Un rectangulo mide ${length} cm por ${width} cm. Cual es su area?`, ru: `Прямоугольник ${length} см на ${width} см. Какая площадь?` },
    { es: `Calcula el area de un rectangulo de ${length} cm x ${width} cm.`, ru: `Вычисли площадь прямоугольника ${length} см x ${width} см.` },
    { es: `Una mesa mide ${length} cm de largo y ${width} cm de ancho. Que superficie ocupa?`, ru: `Стол длиной ${length} см и шириной ${width} см. Какую площадь он занимает?` },
  ] : [
    { es: `Un rectangulo mide ${length} cm por ${width} cm. Cual es su perimetro?`, ru: `Прямоугольник ${length} см на ${width} см. Какой периметр?` },
    { es: `Calcula el perimetro de un rectangulo de ${length} cm x ${width} cm.`, ru: `Вычисли периметр прямоугольника ${length} см x ${width} см.` },
    { es: `Se rodea un rectangulo de ${length} cm por ${width} cm. Cuantos cm son en total?`, ru: `Обходим прямоугольник ${length} см на ${width} см. Сколько см всего?` },
  ]);
  return {
    ...baseQuestion("geometria", template, difficulty, params),
    prompt,
    answer: String(answer),
    explanation: {
      es: isArea
        ? `Area = ${length} x ${width} = ${answer} cm2.`
        : `Perimetro = 2 x (${length} + ${width}) = ${answer} cm.`,
      ru: isArea
        ? `Площадь = ${length} x ${width} = ${answer} см2.`
        : `Периметр = 2 x (${length} + ${width}) = ${answer} см.`,
    },
    hint: { es: isArea ? "Area del rectangulo: largo x ancho." : "Perimetro: suma todos los lados.", ru: isArea ? "Площадь прямоугольника: длина x ширина." : "Периметр: сложи все стороны." },
    commonMistake: { es: "Usar la formula correcta pero con la unidad equivocada.", ru: "Использовать верную формулу, но неверную единицу." },
    skillTags: [isArea ? "rectangle-area" : "rectangle-perimeter"],
  };
}

function buildQuestion(topicId: string, template: TemplateId, difficulty: number, params: number[]): Question {
  if (topicId === "operaciones") return buildOperaciones(template, difficulty, params);
  if (topicId === "divisibilidad") return buildDivisibilidad(template, difficulty, params);
  if (topicId === "fracciones") return buildFracciones(template, difficulty, params);
  if (topicId === "decimales") return buildDecimales(template, difficulty, params);
  if (topicId === "porcentajes") return buildPorcentajes(template, difficulty, params);
  if (topicId === "geometria") return buildGeometria(template, difficulty, params);
  throw new Error(`No generator for topic ${topicId}`);
}

function operandRange(difficulty: number): [number, number] {
  switch (clampDifficulty(difficulty)) {
    case 1: return [6, 20];
    case 2: return [15, 60];
    case 3: return [40, 180];
    case 4: return [120, 650];
    case 5: return [250, 1200];
  }
}

function factorRange(difficulty: number): [number, number] {
  switch (clampDifficulty(difficulty)) {
    case 1: return [2, 9];
    case 2: return [3, 12];
    case 3: return [6, 18];
    case 4: return [9, 25];
    case 5: return [12, 35];
  }
}

function instantiate(topicId: string, template: TemplateId, difficulty: number, seed: number): Question {
  const rng = mulberry32(seed);

  if (template === "add") {
    const [lo, hi] = operandRange(difficulty);
    return buildQuestion(topicId, template, difficulty, [randInt(rng, lo, hi), randInt(rng, lo, hi)]);
  }

  if (template === "sub") {
    const [lo, hi] = operandRange(difficulty);
    const a = randInt(rng, lo + 2, hi);
    const bMax = Math.max(lo, a - 2);
    return buildQuestion(topicId, template, difficulty, [a, randInt(rng, lo, bMax)]);
  }

  if (template === "shopping-change") {
    // Argentina-first practical prices: avoid toy amounts.
    const priceA = randInt(rng, 35, difficulty >= 4 ? 55 : 45) * 100;
    const countA = randInt(rng, 1, difficulty >= 4 ? 3 : 2);
    const priceB = randInt(rng, 20, difficulty >= 4 ? 45 : 35) * 100;
    const countB = randInt(rng, 1, difficulty >= 4 ? 3 : 2);
    const total = priceA * countA + priceB * countB;
    const paid = Math.ceil((total + randInt(rng, 500, 4500)) / 500) * 500;
    return buildQuestion(topicId, template, difficulty, [priceA, countA, priceB, countB, paid]);
  }

  if (template === "exact-division") {
    const [lo, hi] = factorRange(difficulty);
    const divisor = randInt(rng, lo, hi);
    const quotient = randInt(rng, lo, hi);
    return buildQuestion(topicId, template, difficulty, [divisor * quotient, divisor]);
  }

  if (template === "order-of-operations") {
    const [lo, hi] = operandRange(difficulty);
    const [flo, fhi] = factorRange(difficulty);
    const start = randInt(rng, lo, hi);
    const factorA = randInt(rng, flo, fhi);
    const factorB = randInt(rng, flo, fhi);
    const subtotal = start + factorA * factorB;
    const subtract = randInt(rng, Math.max(1, Math.floor(start / 2)), Math.max(1, subtotal - 1));
    return buildQuestion(topicId, template, difficulty, [start, factorA, factorB, subtract]);
  }

  if (template === "mul") {
    const [lo, hi] = factorRange(difficulty);
    return buildQuestion(topicId, template, difficulty, [randInt(rng, lo, hi), randInt(rng, lo, hi)]);
  }

  if (template === "division-find-n") {
    const subtype = difficulty >= 3 ? pick(rng, [0, 1]) : 0;
    const d = pick(rng, difficulty >= 4 ? [3, 4, 5, 6, 7, 8, 9] : [3, 4, 5, 6]);
    const q = randInt(rng, 2, difficulty >= 4 ? 20 : 12);
    const r = randInt(rng, 1, d - 1);
    if (subtype === 0) {
      return buildQuestion(topicId, template, difficulty, [d, q, r, 1, 0]);
    }
    const dividend = d * q + r;
    const kOptions = ([2, 3, 4, 5] as const).filter((x) => x < dividend && dividend % x === 0);
    if (kOptions.length === 0) {
      return buildQuestion(topicId, template, difficulty, [d, q, r, 1, 0]);
    }
    const k = pick(rng, kOptions);
    return buildQuestion(topicId, template, difficulty, [d, q, r, k, 1]);
  }

  if (template === "divisibility-rule") {
    const divisor = pick(rng, difficulty >= 3 ? [3, 4, 6, 9, 10] : [2, 3, 5, 10]);
    const base = randInt(rng, 20, difficulty >= 4 ? 999 : 240);
    const n = rng() > 0.45 ? base - (base % divisor) : base;
    return buildQuestion(topicId, template, difficulty, [Math.max(n, divisor), divisor]);
  }

  if (template === "next-multiple") {
    const base = randInt(rng, 3, difficulty >= 4 ? 18 : 12);
    return buildQuestion(topicId, template, difficulty, [base, randInt(rng, 20, difficulty >= 4 ? 240 : 90)]);
  }

  if (template === "count-multiples") {
    const base = randInt(rng, 2, difficulty >= 4 ? 15 : 10);
    return buildQuestion(topicId, template, difficulty, [base, randInt(rng, 30, difficulty >= 4 ? 220 : 100)]);
  }

  if (template === "conditional-number") {
    const divA = pick(rng, [2, 3, 4, 5, 6]);
    const divB = pick(rng, difficulty >= 4 ? [3, 4, 6, 8, 9] : [3, 4, 5, 6]);
    const step = lcm(divA, divB);
    const answer = step * randInt(rng, 3, difficulty >= 4 ? 18 : 10);
    // Keep the interval narrow enough so only one valid multiple can exist.
    const min = Math.max(1, answer - randInt(rng, 1, Math.max(1, step - 1)));
    const max = answer + randInt(rng, 0, Math.max(0, step - 1));
    const maybeExclude = pick(rng, [0, 0, 5, 10]);
    const exclude = maybeExclude !== 0 && answer % maybeExclude !== 0 ? maybeExclude : 0;
    return buildQuestion(topicId, template, difficulty, [divA, divB, min, max, exclude]);
  }

  if (template === "missing-digit-divisibility") {
    // Generate only cases with a unique valid last digit (0..9).
    for (let attempts = 0; attempts < 40; attempts += 1) {
      const divisor = pick(rng, difficulty >= 4 ? [3, 4, 6, 9] : [2, 3, 5]);
      const hundreds = randInt(rng, 1, 9);
      const tens = randInt(rng, 0, 9);
      let validCount = 0;
      for (let digit = 0; digit <= 9; digit += 1) {
        if ((hundreds * 100 + tens * 10 + digit) % divisor === 0) validCount += 1;
      }
      if (validCount === 1) {
        return buildQuestion(topicId, template, difficulty, [hundreds, tens, divisor]);
      }
    }
    // Deterministic safe fallback with unique digit (only 114 works for divisor 6).
    return buildQuestion(topicId, template, difficulty, [1, 1, 6]);
  }

  if (template === "divisibility-select-all") {
    const divisor = pick(rng, difficulty >= 4 ? [3, 4, 6, 9, 10] : [2, 3, 5, 10]);
    const stepCandidates = [2, 3, 4, 5, 6, 7, 8].filter((value) => value % divisor !== 0);
    const step = pick(rng, stepCandidates.length > 0 ? stepCandidates : [2, 3, 4, 5, 6, 7, 8]);
    let start = randInt(rng, 18, difficulty >= 4 ? 220 : 120);
    let answerIndex = -1;
    for (let i = 0; i < 20; i += 1) {
      const values = [start, start + step, start + 2 * step, start + 3 * step];
      const divisibleIndexes = values
        .map((value, index) => ({ value, index }))
        .filter((entry) => entry.value % divisor === 0)
        .map((entry) => entry.index);
      if (divisibleIndexes.length === 1) {
        answerIndex = divisibleIndexes[0];
        break;
      }
      start += 1;
    }
    if (answerIndex < 0) {
      const forcedStart = divisor * randInt(rng, 3, difficulty >= 4 ? 25 : 14);
      return buildQuestion(topicId, template, difficulty, [divisor, forcedStart, step + 1, 0]);
    }
    return buildQuestion(topicId, template, difficulty, [divisor, start, step, answerIndex]);
  }

  if (template === "multi-step-word-problem") {
    const step1Den = pick(rng, [2, 3, 4]);
    const step2Opts = [2, 3, 4].filter(d => d !== step1Den);
    const step2Den = pick(rng, step2Opts);
    const step3Den = pick(rng, [3, 4, 5, 6, 9]);
    const step3Num = randInt(rng, 1, step3Den - 1);
    const lcm12 = lcm(step1Den, step2Den);
    const lcm123 = lcm(lcm12, step3Den);
    const baseMultiplier = randInt(rng, 3, difficulty >= 4 ? 10 : 6);
    const totalUnits = lcm123 * baseMultiplier;
    return buildQuestion(topicId, template, difficulty, [totalUnits, step1Den, step2Den, step3Num, step3Den]);
  }

  if (template === "fraction-simplify") {
    const factor = randInt(rng, 2, difficulty >= 4 ? 12 : 8);
    const n = randInt(rng, 2, difficulty >= 4 ? 12 : 8);
    const d = randInt(rng, n + 1, difficulty >= 4 ? 18 : 12);
    return buildQuestion(topicId, template, difficulty, [n * factor, d * factor]);
  }

  if (template === "fraction-compare") {
    const b = randInt(rng, 3, difficulty >= 4 ? 15 : 10);
    const d = randInt(rng, 3, difficulty >= 4 ? 15 : 10);
    return buildQuestion(topicId, template, difficulty, [randInt(rng, 1, b - 1), b, randInt(rng, 1, d - 1), d]);
  }

  if (template === "fraction-compare-to-unit") {
    const denominator = randInt(rng, 3, difficulty >= 4 ? 16 : 11);
    const relation = pick(rng, ["lt", "eq", "gt"]);
    let numerator = denominator;
    if (relation === "lt") numerator = randInt(rng, 1, denominator - 1);
    if (relation === "gt") numerator = randInt(rng, denominator + 1, denominator + (difficulty >= 4 ? 9 : 5));
    return buildQuestion(topicId, template, difficulty, [numerator, denominator]);
  }

  if (template === "fraction-compare-same-den") {
    const den = randInt(rng, 3, difficulty >= 4 ? 16 : 11);
    const a = randInt(rng, 1, den - 1);
    let c = randInt(rng, 1, den - 1);
    if (rng() > 0.7) c = a;
    return buildQuestion(topicId, template, difficulty, [a, c, den]);
  }

  if (template === "fraction-equivalent-missing") {
    const denominator = randInt(rng, 3, difficulty >= 4 ? 14 : 9);
    const numerator = randInt(rng, 1, denominator - 1);
    const factor = randInt(rng, 2, difficulty >= 4 ? 8 : 5);
    return buildQuestion(topicId, template, difficulty, [numerator, denominator, factor]);
  }

  if (template === "fraction-equivalent-true-false") {
    const b = randInt(rng, 3, difficulty >= 4 ? 14 : 10);
    const a = randInt(rng, 1, b - 1);
    const makeEquivalent = rng() > 0.45;
    if (makeEquivalent) {
      const factor = randInt(rng, 2, difficulty >= 4 ? 8 : 5);
      return buildQuestion(topicId, template, difficulty, [a, b, a * factor, b * factor]);
    }
    const d = randInt(rng, 3, difficulty >= 4 ? 14 : 10);
    let c = randInt(rng, 1, d - 1);
    while (a * d === c * b) c = randInt(rng, 1, d - 1);
    return buildQuestion(topicId, template, difficulty, [a, b, c, d]);
  }

  if (template === "mixed-to-improper") {
    const whole = randInt(rng, 1, difficulty >= 4 ? 8 : 4);
    const den = randInt(rng, 3, difficulty >= 4 ? 14 : 9);
    const num = randInt(rng, 1, den - 1);
    return buildQuestion(topicId, template, difficulty, [whole, num, den]);
  }

  if (template === "fraction-add-same-den") {
    const den = randInt(rng, 4, difficulty >= 4 ? 18 : 12);
    const a = randInt(rng, 1, den - 2);
    const b = randInt(rng, 1, den - a - 1);
    return buildQuestion(topicId, template, difficulty, [a, b, den]);
  }

  if (template === "fraction-sub-same-den") {
    const den = randInt(rng, 4, difficulty >= 4 ? 18 : 12);
    const b = randInt(rng, 1, den - 2);
    const a = randInt(rng, b + 1, den - 1);
    return buildQuestion(topicId, template, difficulty, [a, b, den]);
  }

  if (template === "fraction-of-number") {
    const den = randInt(rng, 3, difficulty >= 4 ? 12 : 8);
    const num = randInt(rng, 1, den - 1);
    const useRealCapacity = difficulty >= 3 && rng() > 0.45;
    let total = den * randInt(rng, 4, difficulty >= 4 ? 24 : 14);
    if (useRealCapacity) {
      const capacityScenario = rng() > 0.5 ? "stadium.capacity.bombonera" : "stadium.capacity.monumental";
      const capacity = getContextNumber({
        theme: "stadium",
        scenario: capacityScenario,
        variationPercent: REAL_WORLD_CONSTANTS.variationRules.stadiumCapacityPercent / 100,
        rng,
      });
      total = Math.max(den, Math.round(capacity / den) * den);
    }
    return buildQuestion(topicId, template, difficulty, [num, den, total]);
  }

  if (template === "fraction-of-number-remainder") {
    const den = randInt(rng, 3, difficulty >= 4 ? 12 : 8);
    const num = randInt(rng, 1, den - 1);
    const useRealCapacity = difficulty >= 3 && rng() > 0.4;
    let total = den * randInt(rng, 5, difficulty >= 4 ? 24 : 14);
    if (useRealCapacity) {
      const capacityScenario = rng() > 0.5 ? "stadium.capacity.bombonera" : "stadium.capacity.monumental";
      const capacity = getContextNumber({
        theme: "stadium",
        scenario: capacityScenario,
        variationPercent: REAL_WORLD_CONSTANTS.variationRules.stadiumCapacityPercent / 100,
        rng,
      });
      total = Math.max(den, Math.round(capacity / den) * den);
    }
    return buildQuestion(topicId, template, difficulty, [num, den, total]);
  }

  if (template === "fraction-part-of-set") {
    const total = randInt(rng, difficulty >= 4 ? 16 : 10, difficulty >= 4 ? 96 : 40);
    const part = randInt(rng, 2, total - 1);
    return buildQuestion(topicId, template, difficulty, [part, total]);
  }

  if (template === "fraction-complement-to-whole") {
    const den = randInt(rng, 3, difficulty >= 4 ? 16 : 10);
    const num = randInt(rng, 1, den - 1);
    return buildQuestion(topicId, template, difficulty, [num, den]);
  }

  if (template === "fraction-add-whole-and-fraction") {
    const whole = randInt(rng, 1, difficulty >= 4 ? 9 : 5);
    const den = randInt(rng, 3, difficulty >= 4 ? 14 : 10);
    const num = randInt(rng, 1, den - 1);
    return buildQuestion(topicId, template, difficulty, [whole, num, den]);
  }

  // ── Fracciones profundas ──────────────────────────────────────────────────
  if (template === "fraction-add-diff-den" || template === "fraction-sub-diff-den" || template === "fraction-word-add") {
    // Denominator pairs by difficulty: (basic) small pairs, (medium) medium, (ingreso) larger
    const basicPairs: Array<[number,number]> = [[2,3],[2,5],[3,4],[3,5],[2,7]];
    const medPairs: Array<[number,number]> = [[3,4],[4,6],[3,8],[4,9],[5,6],[3,7]];
    const hardPairs: Array<[number,number]> = [[4,6],[5,6],[6,8],[4,9],[6,9],[5,8],[7,8]];
    const pairPool = difficulty >= 4 ? hardPairs : difficulty === 3 ? medPairs : basicPairs;
    const [d1, d2] = pick(rng, pairPool);
    const n1 = randInt(rng, 1, d1 - 1);
    // For subtraction, ensure n1/d1 > n2/d2
    const l = lcm(d1, d2);
    const e1 = n1 * (l / d1);
    const minN2 = template === "fraction-sub-diff-den" ? 1 : 1;
    const maxN2 = template === "fraction-sub-diff-den" ? Math.max(1, e1 * (d2 / l) - 1) : d2 - 1;
    const n2 = randInt(rng, minN2, Math.max(minN2, maxN2 > d2 - 1 ? d2 - 1 : maxN2));
    // Validate: for sub, result must be positive
    const finalN2 = n2 < 1 ? 1 : n2;
    return buildQuestion(topicId, template, difficulty, [n1, d1, finalN2, d2]);
  }

  if (template === "fraction-mul") {
    const d1 = randInt(rng, 2, difficulty >= 4 ? 9 : 6);
    const n1 = randInt(rng, 1, d1 - 1);
    const d2 = randInt(rng, 2, difficulty >= 4 ? 9 : 6);
    const n2 = randInt(rng, 1, d2 - 1);
    return buildQuestion(topicId, template, difficulty, [n1, d1, n2, d2]);
  }

  if (template === "fraction-div") {
    const d1 = randInt(rng, 2, difficulty >= 4 ? 8 : 5);
    const n1 = randInt(rng, 1, d1 - 1);
    const d2 = randInt(rng, 2, difficulty >= 4 ? 8 : 5);
    const n2 = randInt(rng, 1, d2 - 1);
    return buildQuestion(topicId, template, difficulty, [n1, d1, n2, d2]);
  }

  // ── Divisibilidad profunda ────────────────────────────────────────────────
  if (template === "divisibility-prime-factor") {
    // Numbers with interesting prime factors
    const basicNums = [6,10,15,21,22,26,14,35,33,34,38,46,51,57,58,62];
    const medNums = [30,42,60,66,70,78,84,90,102,110,114,130,140,154,165,180];
    const hardNums = [210,231,252,270,286,330,360,420,462,504,546,630,660,720];
    const pool = difficulty >= 4 ? hardNums : difficulty === 3 ? medNums : basicNums;
    return buildQuestion(topicId, template, difficulty, [pick(rng, pool)]);
  }

  if (template === "divisibility-gcd") {
    // Generate two numbers with a non-trivial GCD
    const gcdVal = pick(rng, difficulty >= 4 ? [4,6,8,9,12,15] : difficulty === 3 ? [3,4,5,6] : [2,3,4,5]);
    const k1 = randInt(rng, 2, difficulty >= 4 ? 18 : 10);
    let k2 = randInt(rng, 2, difficulty >= 4 ? 18 : 10);
    while (k2 === k1) k2 = randInt(rng, 2, difficulty >= 4 ? 18 : 10);
    return buildQuestion(topicId, template, difficulty, [gcdVal * k1, gcdVal * k2]);
  }

  if (template === "divisibility-lcm") {
    // Pairs with interesting LCM (not too large)
    const basicPairs: Array<[number,number]> = [[2,3],[2,5],[3,4],[4,5],[2,7],[3,5]];
    const medPairs: Array<[number,number]> = [[4,6],[6,9],[4,8],[3,9],[6,10],[4,10],[5,6]];
    const hardPairs: Array<[number,number]> = [[6,8],[8,12],[6,10],[9,12],[10,15],[8,9],[12,15]];
    const [a, b] = pick(rng, difficulty >= 4 ? hardPairs : difficulty === 3 ? medPairs : basicPairs);
    return buildQuestion(topicId, template, difficulty, [a, b]);
  }

  if (template === "divisibility-lcm-word") {
    const basicPairs: Array<[number,number]> = [[2,3],[3,4],[2,5],[4,5],[3,5]];
    const medPairs: Array<[number,number]> = [[4,6],[6,9],[4,8],[5,6],[3,8]];
    const hardPairs: Array<[number,number]> = [[6,8],[8,12],[6,10],[9,15],[10,12]];
    const [a, b] = pick(rng, difficulty >= 4 ? hardPairs : difficulty === 3 ? medPairs : basicPairs);
    return buildQuestion(topicId, template, difficulty, [a, b]);
  }

  if (template === "divisibility-trap") {
    // Carefully chosen trap cases by divisor
    type TrapCase = [number, number]; // [n, divisor]
    const basicTraps: TrapCase[] = [
      [14, 4],  // even but not div by 4
      [21, 9],  // div by 3 but not 9 (2+1=3)
      [25, 4],  // ends in 5, obviously no
      [18, 9],  // TRUE: 1+8=9
      [24, 8],  // TRUE: 24/8=3
      [15, 6],  // odd, so NO
      [28, 4],  // TRUE: 28/4=7
      [22, 4],  // even but 22/4=5.5
    ];
    const medTraps: TrapCase[] = [
      [132, 4],   // TRUE: last 2 digits 32, 32/4=8
      [134, 4],   // FALSE: 34/4=8.5
      [216, 9],   // TRUE: 2+1+6=9
      [219, 9],   // FALSE: 2+1+9=12, not div 9
      [126, 6],   // TRUE: even + 1+2+6=9 div by 3
      [124, 6],   // FALSE: even but 1+2+4=7
      [120, 8],   // TRUE: 120/8=15
      [124, 8],   // FALSE: 124/8=15.5
    ];
    const hardTraps: TrapCase[] = [
      [1236, 4],  // TRUE: 36/4=9
      [1238, 4],  // FALSE: 38/4=9.5
      [1008, 9],  // TRUE: 1+0+0+8=9
      [1017, 9],  // FALSE: 1+0+1+7=9 wait TRUE... use 1013: 1+0+1+3=5
      [1013, 9],  // FALSE
      [1260, 8],  // FALSE: 260/8=32.5
      [1256, 8],  // TRUE: 256/8=32
      [3510, 6],  // TRUE: even, 3+5+1+0=9
      [3514, 6],  // FALSE: even, 3+5+1+4=13 not div3
    ];
    const pool = difficulty >= 4 ? hardTraps : difficulty === 3 ? medTraps : basicTraps;
    const [trapN, trapDiv] = pick(rng, pool);
    return buildQuestion(topicId, template, difficulty, [trapN, trapDiv]);
  }

  if (template === "decimal-compare") {
    const a = randInt(rng, 105, difficulty >= 4 ? 999 : 620);
    let b = randInt(rng, 105, difficulty >= 4 ? 999 : 620);
    if (b === a) b += 10;
    return buildQuestion(topicId, template, difficulty, [a, b]);
  }

  if (template === "decimal-add" || template === "decimal-sub") {
    const a = randInt(rng, 12, difficulty >= 4 ? 999 : 160);
    const b = randInt(rng, 5, template === "decimal-sub" ? a : difficulty >= 4 ? 500 : 90);
    return buildQuestion(topicId, template, difficulty, [a, b]);
  }

  if (template === "decimal-times-10") {
    return buildQuestion(topicId, template, difficulty, [randInt(rng, 12, difficulty >= 4 ? 999 : 160), pick(rng, [10, 100])]);
  }

  if (template === "decimal-money-change") {
    const priceA = randInt(rng, 6, difficulty >= 4 ? 40 : 18) * 25;
    const countA = randInt(rng, 2, difficulty >= 4 ? 5 : 3);
    const priceB = randInt(rng, 4, difficulty >= 4 ? 32 : 16) * 25;
    const total = priceA * countA + priceB;
    const paid = Math.ceil((total + randInt(rng, 100, 700)) / 500) * 500;
    return buildQuestion(topicId, template, difficulty, [priceA, countA, priceB, paid]);
  }

  if (template === "decimal-round") {
    return buildQuestion(topicId, template, difficulty, [randInt(rng, 105, difficulty >= 4 ? 9999 : 999)]);
  }

  if (template === "decimal-measure-convert") {
    const centimeters = randInt(rng, 12, difficulty >= 4 ? 950 : 320);
    return buildQuestion(topicId, template, difficulty, [centimeters]);
  }

  if (template === "percent-of" || template === "increase-price") {
    const pct = pick(rng, difficulty >= 4 ? [5, 10, 15, 20, 25, 30, 50, 75] : [10, 25, 50, 75]);
    const unit = pct === 25 || pct === 75 ? 4 : pct === 10 || pct === 20 || pct === 30 ? 10 : 2;
    const amount = randInt(rng, 8, difficulty >= 4 ? 80 : 40) * unit;
    return buildQuestion(topicId, template, difficulty, [amount, pct]);
  }

  if (template === "discount-price" || template === "discount-amount") {
    const pct = pick(rng, difficulty >= 4 ? [5, 10, 15, 20, 25, 30, 50, 75] : [10, 15, 20, 25, 30, 50]);
    const amount = pickRealWorldPrice(rng);
    return buildQuestion(topicId, template, difficulty, [amount, pct]);
  }

  if (template === "discount-quantity-total" || template === "discount-quantity-savings") {
    const pct = pick(rng, difficulty >= 4 ? [10, 15, 20, 25, 30, 50] : [10, 15, 20, 25, 30]);
    const price = pickRealWorldPrice(rng);
    const quantity = randInt(rng, 2, difficulty >= 4 ? 6 : 4);
    return buildQuestion(topicId, template, difficulty, [price, quantity, pct]);
  }

  if (template === "percent-find-rate") {
    const total = randInt(rng, 10, difficulty >= 4 ? 120 : 60) * 10;
    const pct = pick(rng, difficulty >= 4 ? [5, 10, 12.5, 15, 20, 25, 30, 40, 50, 75] : [10, 20, 25, 50, 75]);
    const part = Math.round((total * pct) / 100);
    return buildQuestion(topicId, template, difficulty, [part, total]);
  }

  if (template === "compare-discounts") {
    const discounts = difficulty >= 4 ? [10, 15, 20, 25, 30, 50] : [10, 25, 50];
    const pctA = pick(rng, discounts);
    const pctB = pick(rng, discounts);
    const priceA = pickRealWorldPrice(rng);
    const priceB = pickRealWorldPrice(rng);
    return buildQuestion(topicId, template, difficulty, [priceA, pctA, priceB, pctB]);
  }

  if (template === "discount-budget") {
    const pct = pick(rng, difficulty >= 4 ? [10, 15, 20, 25, 30, 50] : [10, 25, 50]);
    const price = pickRealWorldPrice(rng);
    const finalPrice = price - (price * pct) / 100;
    const budget = Math.ceil((finalPrice + randInt(rng, 100, 900)) / 100) * 100;
    return buildQuestion(topicId, template, difficulty, [budget, price, pct]);
  }

  if (template === "discount-leftover-money") {
    const pct = pick(rng, difficulty >= 4 ? [10, 15, 20, 25, 30, 40, 50] : [10, 20, 25, 50]);
    const price = pickRealWorldPrice(rng);
    const finalPrice = price - (price * pct) / 100;
    const budget = Math.ceil((finalPrice + randInt(rng, 200, 1600)) / 100) * 100;
    return buildQuestion(topicId, template, difficulty, [budget, price, pct]);
  }

  if (template === "double-discount") {
    const pctA = pick(rng, difficulty >= 4 ? [10, 15, 20, 25, 30, 40] : [10, 20, 25, 30]);
    const pctB = pick(rng, difficulty >= 4 ? [5, 10, 15, 20, 25] : [10, 15, 20]);
    const price = pickRealWorldPrice(rng);
    return buildQuestion(topicId, template, difficulty, [price, pctA, pctB]);
  }

  if (template === "increase-budget-gap") {
    const pct = pick(rng, difficulty >= 4 ? [10, 12.5, 15, 20, 25, 30] : [10, 15, 20, 25]);
    const unit = pct === 12.5 ? 8 : pct === 15 ? 20 : pct === 25 ? 4 : 10;
    const price = randInt(rng, 12, difficulty >= 4 ? 90 : 42) * unit;
    const finalPrice = price + (price * pct) / 100;
    const budget = Math.floor((finalPrice - randInt(rng, 100, 1200)) / 100) * 100;
    return buildQuestion(topicId, template, difficulty, [Math.max(100, budget), price, pct]);
  }

  if (template === "reverse-discount") {
    const pct = pick(rng, difficulty >= 4 ? [10, 15, 20, 25, 30, 50] : [10, 25, 50]);
    const original = pickRealWorldPrice(rng);
    const finalPrice = original - (original * pct) / 100;
    return buildQuestion(topicId, template, difficulty, [finalPrice, pct]);
  }

  if (template === "compound-area") {
    const length = randInt(rng, 5, difficulty >= 4 ? 24 : 14);
    const width = randInt(rng, 3, difficulty >= 4 ? 16 : 9);
    const extraLength = randInt(rng, 2, Math.max(3, length - 1));
    const extraWidth = randInt(rng, 2, Math.max(3, width - 1));
    return buildQuestion(topicId, template, difficulty, [length, width, extraLength, extraWidth]);
  }

  if (template === "area-compare") {
    const aLen = randInt(rng, 4, difficulty >= 4 ? 28 : 14);
    const aWid = randInt(rng, 3, difficulty >= 4 ? 18 : 10);
    const bLen = randInt(rng, 4, difficulty >= 4 ? 28 : 14);
    const bWid = randInt(rng, 3, difficulty >= 4 ? 18 : 10);
    return buildQuestion(topicId, template, difficulty, [aLen, aWid, bLen, bWid]);
  }

  if (template === "perimeter-fence-cost") {
    const length = randInt(rng, 5, difficulty >= 4 ? 35 : 16);
    const width = randInt(rng, 3, difficulty >= 4 ? 20 : 10);
    const price = randInt(rng, 4, difficulty >= 4 ? 30 : 12) * 100;
    return buildQuestion(topicId, template, difficulty, [length, width, price]);
  }

  if (template === "rect-missing-side-area") {
    const known = randInt(rng, 3, difficulty >= 4 ? 18 : 12);
    const missing = randInt(rng, 4, difficulty >= 4 ? 24 : 14);
    return buildQuestion(topicId, template, difficulty, [known, known * missing]);
  }

  if (template === "rect-missing-side-perimeter") {
    const known = randInt(rng, 3, difficulty >= 4 ? 18 : 12);
    const missing = randInt(rng, 4, difficulty >= 4 ? 24 : 14);
    return buildQuestion(topicId, template, difficulty, [known, 2 * (known + missing)]);
  }

  if (template === "rect-missing-side-perimeter-with-half") {
    const known = randInt(rng, 3, difficulty >= 4 ? 18 : 12);
    const missing = randInt(rng, 4, difficulty >= 4 ? 24 : 14);
    return buildQuestion(topicId, template, difficulty, [known + missing, known]);
  }

  if (template === "square-area" || template === "square-perimeter") {
    return buildQuestion(topicId, template, difficulty, [randInt(rng, 3, difficulty >= 4 ? 28 : 14)]);
  }

  if (template === "inequality-range") {
    const boundaryType = randInt(rng, 0, 3);
    const contextType  = randInt(rng, 0, 3);
    const gapOptions = difficulty >= 4 ? [5, 8, 12, 15] : difficulty >= 3 ? [8, 10, 15, 20] : [10, 15, 20];
    const gap = pick(rng, gapOptions);
    const A = randInt(rng, difficulty >= 3 ? 13 : 10, difficulty >= 4 ? 85 : 70);
    const B = A + gap;
    return buildQuestion(topicId, template, difficulty, [A, B, boundaryType, contextType]);
  }

  if (template === "geometry-formula-choice") {
    return buildQuestion(topicId, template, difficulty, [randInt(rng, 0, 2)]);
  }

  const length = randInt(rng, 4, difficulty >= 4 ? 35 : 16);
  const width = randInt(rng, 2, Math.max(3, length - 1));
  return buildQuestion(topicId, template, difficulty, [length, width]);
}

export function createSessionSeed(topicId: string, sessionCount: number, dayKey = new Date().toISOString().slice(0, 10)): number {
  let hash = 2166136261;
  const raw = `${topicId}:${sessionCount}:${dayKey}`;
  for (let i = 0; i < raw.length; i++) {
    hash ^= raw.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function generateForTopic(topicId: string, count: number, seed: number): Question[] {
  const templates = TOPIC_TEMPLATES[topicId];
  if (!templates || count <= 0) return [];

  return generateForTopicWithOptions(topicId, count, seed);
}

export function generateForTopicWithOptions(
  topicId: string,
  count: number,
  seed: number,
  options: GeneratorOptions = {}
): Question[] {
  const templates = TOPIC_TEMPLATES[topicId];
  if (!templates || count <= 0) return [];
  const allowedTemplates =
    options.templateAllowlist && options.templateAllowlist.length > 0
      ? options.templateAllowlist.filter((template) => templates.includes(template))
      : templates;
  if (allowedTemplates.length === 0) return [];

  const focusedTemplates = (options.focusSkillTags ?? [])
    .flatMap((tag) => getTemplatesForSkillTags([tag]))
    .filter((template): template is TemplateId => allowedTemplates.includes(template));
  const uniqueFocused = Array.from(new Set(focusedTemplates));
  const templatePool = uniqueFocused.length > 0
    ? [...uniqueFocused, ...uniqueFocused, ...allowedTemplates.filter((template) => !uniqueFocused.includes(template))]
    : allowedTemplates;

  const difficulties = [1, 2, 2, 3, 3, 4];
  const difficultyShift = options.difficultyShift ?? 0;
  const minDifficulty = options.minDifficulty ?? 1;
  const out: Question[] = [];
  const seen = new Set<string>();
  const templateUsage = new Map<TemplateId, number>();
  const promptPatternUsage = new Map<string, number>();
  const recentContextHistory: string[] = [];
  const maxTemplatePerSession = Math.max(2, Math.ceil(count / 4));
  const maxPromptPatternPerSession = 2;

  let attempt = 0;
  while (out.length < count && attempt < count * 64) {
    const index = out.length;
    const template = templatePool[index % templatePool.length];
    if ((templateUsage.get(template) ?? 0) >= maxTemplatePerSession) {
      attempt += 1;
      continue;
    }
    const baseDifficulty = difficulties[index % difficulties.length] ?? 3;
    const difficulty = clampDifficulty(Math.max(minDifficulty, baseDifficulty + difficultyShift));
    const baseQuestion = instantiate(topicId, template, difficulty, seed + attempt * 7919 + index * 104729);
    const parsedBase = parseGeneratedId(baseQuestion.id);
    if (!parsedBase) continue;
    const q = withLanguagePolish(
      withHintMicroSteps(withPromptVariation(applyStoryEngine(baseQuestion, parsedBase, recentContextHistory)))
    );
    attempt += 1;
    if (seen.has(q.id)) continue;
    const patternKey = promptPatternKey(q.prompt.es);
    if ((promptPatternUsage.get(patternKey) ?? 0) >= maxPromptPatternPerSession) continue;
    seen.add(q.id);
    templateUsage.set(template, (templateUsage.get(template) ?? 0) + 1);
    promptPatternUsage.set(patternKey, (promptPatternUsage.get(patternKey) ?? 0) + 1);
    out.push(q);
  }

  return out;
}

export function tryReconstructGenerated(id: string): Question | null {
  if (!id.startsWith("gen-")) return null;

  const parsed = parseGeneratedId(id);
  if (!parsed) return null;
  const templates = TOPIC_TEMPLATES[parsed.topicId];
  if (!templates || !templates.includes(parsed.template)) return null;
  const params = parsed.params;
  if (params.some((value) => !Number.isFinite(value))) return null;
  const reconstructed = buildQuestion(parsed.topicId, parsed.template, parsed.difficulty, params);
  const storyReady = applyStoryEngine({ ...reconstructed, id }, parsed, []);
  return withLanguagePolish(withHintMicroSteps(withPromptVariation(storyReady)));
}
