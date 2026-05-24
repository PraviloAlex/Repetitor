import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = process.cwd();
const generatorPath = path.join(root, "src", "engine", "generator.ts");
const skillsPath = path.join(root, "src", "engine", "skills.ts");
const contextEnginePath = path.join(root, "src", "engine", "contextEngine.ts");
const contextBankPath = path.join(root, "src", "engine", "contextBank.ts");
const realWorldConstantsPath = path.join(root, "src", "data", "realWorldConstants.ts");

function loadTsModule(filePath, cache = new Map()) {
  const normalized = path.normalize(filePath);
  if (cache.has(normalized)) return cache.get(normalized).exports;

  const source = fs.readFileSync(normalized, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText;

  const module = { exports: {} };
  cache.set(normalized, module);

  function localRequire(specifier) {
    if (specifier === "./skills") return loadTsModule(skillsPath, cache);
    if (specifier === "./generator") return loadTsModule(generatorPath, cache);
    if (specifier === "./contextEngine") return loadTsModule(contextEnginePath, cache);
    if (specifier === "./contextBank") return loadTsModule(contextBankPath, cache);
    if (specifier === "../data/realWorldConstants") return loadTsModule(realWorldConstantsPath, cache);
    if (specifier === "./types") return {};
    if (specifier === "../i18n/types") return {};
    throw new Error(`Unsupported test require: ${specifier} from ${normalized}`);
  }

  new Function("module", "exports", "require", output)(module, module.exports, localRequire);
  return module.exports;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function gcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

function cleanDecimal(value) {
  return Number(value.toFixed(2)).toString();
}

function clampDifficulty(d) {
  return Math.min(Math.max(Math.round(d), 1), 5);
}

function phraseVariant(topicId, template, difficulty, params, variants) {
  let hash = 2166136261;
  const raw = `${topicId}:${template}:${clampDifficulty(difficulty)}:${params.join(":")}`;
  for (let i = 0; i < raw.length; i++) {
    hash ^= raw.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return variants[(hash >>> 0) % variants.length];
}

function fraction(n, d) {
  return `${n}/${d}`;
}

function parseGeneratedId(id) {
  const legacy = id.split("-");
  if (legacy.length === 5 && ["add", "sub", "mul"].includes(legacy[1])) {
    return {
      topicId: "operaciones",
      template: legacy[1],
      difficulty: Number(legacy[2]),
      params: [Number(legacy[3]), Number(legacy[4])],
    };
  }

  const match = /^gen-([a-z]+)-(.+)-([1-5])-([0-9._]+)$/.exec(id);
  assert(match, `Invalid generated id: ${id}`);
  return {
    topicId: match[1],
    template: match[2],
    difficulty: Number(match[3]),
    params: match[4].split("_").map(Number),
  };
}

function coreTemplateParams(template, params) {
  const baseArity = {
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
  const arity = baseArity[template];
  if (!arity) return params;
  return params.slice(0, arity);
}

function expectedAnswer(question) {
  const { template, difficulty, params: rawParams } = parseGeneratedId(question.id);
  const params = coreTemplateParams(template, rawParams);

  if (template === "add") return String(params[0] + params[1]);
  if (template === "sub") return String(params[0] - params[1]);
  if (template === "mul") return String(params[0] * params[1]);
  if (template === "exact-division") return String(params[0] / params[1]);
  if (template === "order-of-operations") return String(params[0] + params[1] * params[2] - params[3]);
  if (template === "shopping-change") return String(params[4] - (params[0] * params[1] + params[2] * params[3]));

  if (template === "divisibility-rule") return String(params[0] % params[1] === 0);
  if (template === "next-multiple") return String(Math.ceil((params[1] + 1) / params[0]) * params[0]);
  if (template === "count-multiples") return String(Math.floor(params[1] / params[0]));
  if (template === "conditional-number") {
    const [divA, divB, min, max, exclude] = params;
    for (let n = min; n <= max; n += 1) {
      if (n % divA === 0 && n % divB === 0 && (exclude === 0 || n % exclude !== 0)) return String(n);
    }
    throw new Error(`No conditional-number answer found for ${params.join("_")}`);
  }
  if (template === "missing-digit-divisibility") {
    const [hundreds, tens, divisor] = params;
    for (let digit = 0; digit <= 9; digit += 1) {
      if ((hundreds * 100 + tens * 10 + digit) % divisor === 0) return String(digit);
    }
    throw new Error(`No missing digit found for ${params.join("_")}`);
  }
  if (template === "divisibility-select-all") {
    const [divisor, start, step, answerIndex] = params;
    return String(start + step * answerIndex);
  }

  if (template === "fraction-simplify") {
    const g = gcd(params[0], params[1]);
    return fraction(params[0] / g, params[1] / g);
  }
  if (template === "fraction-compare") {
    const [a, b, c, d] = params;
    const left = a * d;
    const right = c * b;
    return left === right ? "=" : left > right ? ">" : "<";
  }
  if (template === "fraction-compare-same-den") {
    const [a, c] = params;
    return a === c ? "=" : a > c ? ">" : "<";
  }
  if (template === "fraction-compare-to-unit") {
    const [a, b] = params;
    return a === b ? "=" : a > b ? ">" : "<";
  }
  if (template === "fraction-equivalent-missing") return String(params[0] * params[2]);
  if (template === "fraction-equivalent-true-false") return String(params[0] * params[3] === params[2] * params[1]);
  if (template === "mixed-to-improper") return fraction(params[0] * params[2] + params[1], params[2]);
  if (template === "fraction-add-same-den") {
    const [a, b, d] = params;
    const sum = a + b;
    const g = gcd(sum, d);
    return fraction(sum / g, d / g);
  }
  if (template === "fraction-sub-same-den") {
    const [a, b, d] = params;
    const diff = a - b;
    const g = gcd(diff, d);
    return fraction(diff / g, d / g);
  }
  if (template === "fraction-of-number") return String((params[2] / params[1]) * params[0]);
  if (template === "fraction-of-number-remainder") {
    const part = (params[2] / params[1]) * params[0];
    return String(params[2] - part);
  }
  if (template === "fraction-add-whole-and-fraction") {
    const top = params[0] * params[2] + params[1];
    const g = gcd(top, params[2]);
    return fraction(top / g, params[2] / g);
  }

  if (template === "decimal-add") return cleanDecimal(params[0] / 10 + params[1] / 10);
  if (template === "decimal-sub") return cleanDecimal(params[0] / 10 - params[1] / 10);
  if (template === "decimal-compare") return params[0] === params[1] ? "=" : params[0] > params[1] ? ">" : "<";
  if (template === "decimal-times-10") return cleanDecimal((params[0] / 10) * params[1]);
  if (template === "decimal-money-change") return cleanDecimal((params[3] - (params[0] * params[1] + params[2])) / 100);
  if (template === "decimal-round") return cleanDecimal(Math.round((params[0] / 100) * 10) / 10);
  if (template === "decimal-measure-convert") return cleanDecimal(params[0] / 100);

  if (template === "percent-of") return cleanDecimal((params[0] * params[1]) / 100);
  if (template === "percent-find-rate") return cleanDecimal((params[0] * 100) / params[1]);
  if (template === "discount-price") return cleanDecimal(params[0] - (params[0] * params[1]) / 100);
  if (template === "discount-amount") return cleanDecimal((params[0] * params[1]) / 100);
  if (template === "increase-price") return cleanDecimal(params[0] + (params[0] * params[1]) / 100);
  if (template === "compare-discounts") {
    const finalA = params[0] - (params[0] * params[1]) / 100;
    const finalB = params[2] - (params[2] * params[3]) / 100;
    return finalA === finalB ? "=" : finalA < finalB ? "A" : "B";
  }
  if (template === "discount-budget") return cleanDecimal(params[0] - (params[1] - (params[1] * params[2]) / 100));
  if (template === "discount-leftover-money") {
    const finalPrice = params[1] - (params[1] * params[2]) / 100;
    return cleanDecimal(params[0] - finalPrice);
  }
  if (template === "double-discount") {
    const afterFirst = params[0] - (params[0] * params[1]) / 100;
    return cleanDecimal(afterFirst - (afterFirst * params[2]) / 100);
  }
  if (template === "increase-budget-gap") {
    const finalPrice = params[1] + (params[1] * params[2]) / 100;
    return cleanDecimal(finalPrice - params[0]);
  }
  if (template === "reverse-discount") return cleanDecimal(params[0] / (1 - params[1] / 100));

  if (template === "rect-area") return String(params[0] * params[1]);
  if (template === "rect-perimeter") return String(2 * (params[0] + params[1]));
  if (template === "compound-area") return String(params[0] * params[1] + params[2] * params[3]);
  if (template === "area-compare") {
    const areaA = params[0] * params[1];
    const areaB = params[2] * params[3];
    return areaA === areaB ? "=" : areaA > areaB ? "A" : "B";
  }
  if (template === "perimeter-fence-cost") return String(2 * (params[0] + params[1]) * params[2]);
  if (template === "rect-missing-side-area") return String(params[1] / params[0]);
  if (template === "rect-missing-side-perimeter") return String(params[1] / 2 - params[0]);
  if (template === "rect-missing-side-perimeter-with-half") return String(params[0] - params[1]);
  if (template === "square-area") return String(params[0] * params[0]);
  if (template === "square-perimeter") return String(4 * params[0]);

  // ── New ingreso templates ──────────────────────────────────────────────────

  if (template === "divisibility-prime-factor") {
    const [n] = params;
    function largestPrimeFactor(x) {
      let largest = 2;
      let y = x;
      while (y % 2 === 0) { largest = 2; y /= 2; }
      for (let f = 3; f * f <= y; f += 2) {
        while (y % f === 0) { largest = f; y /= f; }
      }
      if (y > 1) largest = y;
      return largest;
    }
    function countPrimeFactors(x) {
      let count = 0;
      let y = x;
      for (let f = 2; f * f <= y; f++) {
        while (y % f === 0) { count++; y /= f; }
      }
      if (y > 1) count++;
      return count;
    }
    const isCountVariant = phraseVariant("divisibilidad", template, difficulty, params, [false, false, true]);
    return String(isCountVariant ? countPrimeFactors(n) : largestPrimeFactor(n));
  }

  if (template === "divisibility-gcd") {
    const [a, b] = params;
    return String(gcd(a, b));
  }

  if (template === "divisibility-lcm" || template === "divisibility-lcm-word") {
    const [a, b] = params;
    return String(Math.abs(a * b) / gcd(a, b));
  }

  if (template === "divisibility-trap") {
    const [n, divisor] = params;
    return String(n % divisor === 0);
  }

  if (template === "fraction-add-diff-den" || template === "fraction-word-add") {
    const [n1, d1, n2, d2] = params;
    const l = Math.abs(d1 * d2) / gcd(d1, d2);
    const sumN = n1 * (l / d1) + n2 * (l / d2);
    const g2 = gcd(sumN, l);
    const sn = sumN / g2;
    const sd = l / g2;
    return sd === 1 ? String(sn) : fraction(sn, sd);
  }

  if (template === "fraction-sub-diff-den") {
    const [n1, d1, n2, d2] = params;
    const l = Math.abs(d1 * d2) / gcd(d1, d2);
    const diffN = n1 * (l / d1) - n2 * (l / d2);
    const g2 = gcd(Math.abs(diffN), l);
    const sn = diffN / g2;
    const sd = l / g2;
    return sd === 1 ? String(sn) : fraction(sn, sd);
  }

  if (template === "fraction-mul") {
    const [n1, d1, n2, d2] = params;
    const rawN = n1 * n2;
    const rawD = d1 * d2;
    const g2 = gcd(rawN, rawD);
    const sn = rawN / g2;
    const sd = rawD / g2;
    return sd === 1 ? String(sn) : fraction(sn, sd);
  }

  if (template === "fraction-div") {
    const [n1, d1, n2, d2] = params;
    const rawN = n1 * d2;
    const rawD = d1 * n2;
    const g2 = gcd(rawN, rawD);
    const sn = rawN / g2;
    const sd = rawD / g2;
    return sd === 1 ? String(sn) : fraction(sn, sd);
  }

  throw new Error(`No expected-answer validator for template: ${template}`);
}

function assertFractionIsSimplified(question) {
  const { template } = parseGeneratedId(question.id);
  if (!["fraction-simplify", "fraction-add-same-den", "fraction-sub-same-den"].includes(template)) return;
  const [n, d] = question.answer.split("/").map(Number);
  assert(Number.isFinite(n) && Number.isFinite(d), `Fraction answer must be n/d: ${question.id}`);
  assert(gcd(n, d) === 1, `Fraction answer must be simplified: ${question.id} => ${question.answer}`);
}

function assertQuestionShape(question) {
  assert(question.id.startsWith("gen-"), `Generated question id must start with gen-: ${question.id}`);
  assert(question.verified === true, `Generated question must be verified: ${question.id}`);
  assert(question.generator?.template, `Generated question must include generator template: ${question.id}`);
  assert(question.prompt?.es && question.prompt?.ru, `Generated question must include ES/RU prompt: ${question.id}`);
  assert(question.explanation?.es && question.explanation?.ru, `Generated question must include ES/RU explanation: ${question.id}`);

  if (question.type === "multiple_choice") {
    const options = question.options?.map((opt) => opt.es) ?? [];
    assert(options.includes(question.answer), `Multiple-choice answer must be present in options: ${question.id}`);
  }

  if (question.type === "true_false") {
    assert(question.answer === "true" || question.answer === "false", `True/false answer must be boolean string: ${question.id}`);
  }
}

const generator = loadTsModule(generatorPath);
const skills = loadTsModule(skillsPath);
const topics = ["operaciones", "divisibilidad", "fracciones", "decimales", "porcentajes", "geometria"];
const seeds = [1, 7, 42, 12345, 20270523, 987654321];
const questionsPerTopic = 12;

const skillIds = new Set(skills.SKILLS.map((skill) => skill.id));
assert(skillIds.size === skills.SKILLS.length, "Skill ids must be unique");
for (const skill of skills.SKILLS) {
  assert(topics.includes(skill.topicId), `${skill.id}: unknown topic ${skill.topicId}`);
  for (const prerequisite of skill.prerequisiteSkillIds) {
    assert(skillIds.has(prerequisite), `${skill.id}: unknown prerequisite ${prerequisite}`);
  }
}

const ingresoPrioritySkills = skills.SKILLS.filter(
  (skill) => skill.topicId === "fracciones" || skill.topicId === "porcentajes"
);

for (const skill of ingresoPrioritySkills) {
  const uniqueTemplates = Array.from(new Set(skill.templateIds));
  assert(
    uniqueTemplates.length === skill.templateIds.length,
    `${skill.id}: templateIds should not contain duplicates`
  );
  assert(
    uniqueTemplates.length >= 5 && uniqueTemplates.length <= 10,
    `${skill.id}: expected 5-10 templates, got ${uniqueTemplates.length}`
  );

  const focusedQuestions = generator.generateForTopicWithOptions(
    skill.topicId,
    uniqueTemplates.length,
    20260524,
    { focusSkillTags: [skill.id] }
  );
  const seenTemplates = new Set(focusedQuestions.map((q) => parseGeneratedId(q.id).template));
  for (const templateId of uniqueTemplates) {
    assert(
      seenTemplates.has(templateId),
      `${skill.id}: focused generation did not instantiate template "${templateId}"`
    );
  }
}

for (const topic of topics) {
  for (const seed of seeds) {
    const questions = generator.generateForTopic(topic, questionsPerTopic, seed);
    assert(questions.length === questionsPerTopic, `${topic}/${seed}: expected ${questionsPerTopic} generated questions`);
    assert(new Set(questions.map((q) => q.id)).size === questions.length, `${topic}/${seed}: duplicate generated ids`);

    for (const question of questions) {
      assertQuestionShape(question);
      assert(question.topicId === topic, `${question.id}: topic mismatch`);
      for (const skillTag of question.skillTags) {
        assert(skills.isKnownSkillTag(skillTag), `${question.id}: unknown skill tag ${skillTag}`);
      }
      assert(question.answer === expectedAnswer(question), `${question.id}: expected ${expectedAnswer(question)}, got ${question.answer}`);
      assertFractionIsSimplified(question);

      const reconstructed = generator.tryReconstructGenerated(question.id);
      assert(reconstructed, `${question.id}: failed to reconstruct`);
      assert(reconstructed.id === question.id, `${question.id}: reconstructed id mismatch`);
      assert(reconstructed.answer === question.answer, `${question.id}: reconstructed answer mismatch`);
      const parsed = parseGeneratedId(question.id);
      const storyTemplates = new Set([
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
      if (!storyTemplates.has(parsed.template)) {
        assert(reconstructed.prompt.es === question.prompt.es, `${question.id}: reconstructed prompt mismatch`);
      }
    }
  }
}

const adaptive = generator.generateForTopicWithOptions("fracciones", 6, 12345, {
  difficultyShift: -1,
  focusSkillTags: ["fraction-compare"],
});
assert(
  adaptive.filter((question) => question.id.includes("fraction-compare")).length >= 2,
  "Adaptive focus should repeat the weak template"
);
assert(
  adaptive.every((question) => question.difficulty <= 3),
  "Adaptive repair mode should lower the generated difficulty"
);

const legacy = generator.tryReconstructGenerated("gen-add-2-8-3");
assert(legacy?.id === "gen-add-2-8-3", "Legacy generated id must preserve original id");
assert(legacy?.answer === "11", "Legacy generated id must reconstruct the correct answer");

const promptVariantsFrac = generator.generateForTopic("fracciones", 24, 424242).map((q) => q.prompt.es);
const promptVariantsPct = generator.generateForTopic("porcentajes", 24, 525252).map((q) => q.prompt.es);
assert(
  promptVariantsFrac.some((text) => text.startsWith("Resuelve:")) ||
    promptVariantsFrac.some((text) => text.startsWith("Mision rapida:")),
  "Fracciones prompts should include deterministic wording variations"
);
assert(
  promptVariantsPct.some((text) => text.startsWith("Resuelve:")) ||
    promptVariantsPct.some((text) => text.startsWith("Mision rapida:")),
  "Porcentajes prompts should include deterministic wording variations"
);

console.log(`generator tests passed: ${topics.length} topics, ${seeds.length} seeds`);
