import type { TemplateId } from "./generator";
import { getSkillRepairText } from "./skillRepairCatalog";

export type TopicId =
  | "operaciones"
  | "divisibilidad"
  | "fracciones"
  | "decimales"
  | "porcentajes"
  | "geometria";

export type SkillDefinition = {
  id: string;
  topicId: TopicId;
  titleEs: string;
  level: 1 | 2 | 3 | 4 | 5;
  prerequisiteSkillIds: string[];
  templateIds: TemplateId[];
  typicalMistakes: string[];
  repairExplanationEs?: string;
  parentSignalEs?: string;
};

export const SKILLS: SkillDefinition[] = [
  { id: "addition", topicId: "operaciones", titleEs: "Suma con numeros naturales", level: 1, prerequisiteSkillIds: [], templateIds: ["add", "sub", "mul", "shopping-change"], typicalMistakes: ["Alinear mal cifras", "Perder una llevada"] },
  { id: "subtraction", topicId: "operaciones", titleEs: "Resta con numeros naturales", level: 1, prerequisiteSkillIds: ["addition"], templateIds: ["sub", "shopping-change"], typicalMistakes: ["Restar en orden inverso", "Olvidar el prestamo"] },
  { id: "multiplication", topicId: "operaciones", titleEs: "Multiplicacion", level: 2, prerequisiteSkillIds: ["addition"], templateIds: ["mul", "shopping-change"], typicalMistakes: ["Confundir factores", "Error de tabla"] },
  { id: "order-of-operations", topicId: "operaciones", titleEs: "Orden de operaciones", level: 3, prerequisiteSkillIds: ["addition", "subtraction", "multiplication"], templateIds: ["order-of-operations", "add", "sub", "mul", "exact-division"], typicalMistakes: ["Resolver de izquierda a derecha sin priorizar multiplicacion"] },
  { id: "division", topicId: "operaciones", titleEs: "Division exacta", level: 2, prerequisiteSkillIds: ["multiplication"], templateIds: ["exact-division", "mul", "shopping-change", "order-of-operations"], typicalMistakes: ["Confundir divisor y cociente", "No comprobar con multiplicacion"] },
  { id: "shopping-change", topicId: "operaciones", titleEs: "Compras y vuelto", level: 3, prerequisiteSkillIds: ["multiplication", "subtraction"], templateIds: ["shopping-change", "sub", "mul", "exact-division"], typicalMistakes: ["Calcular solo un producto", "Olvidar restar al pago"] },
  { id: "multiples", topicId: "divisibilidad", titleEs: "Multiplos", level: 2, prerequisiteSkillIds: ["multiplication"], templateIds: ["next-multiple", "count-multiples"], typicalMistakes: ["Incluir el numero inicial cuando pide el siguiente", "Contar hasta el limite con uno de mas"] },
  { id: "divisibility-2", topicId: "divisibilidad", titleEs: "Divisibilidad por 2", level: 1, prerequisiteSkillIds: [], templateIds: ["divisibility-rule", "divisibility-select-all"], typicalMistakes: ["Mirar todo el numero en vez de la ultima cifra"] },
  { id: "divisibility-3", topicId: "divisibilidad", titleEs: "Divisibilidad por 3", level: 2, prerequisiteSkillIds: ["addition"], templateIds: ["divisibility-rule", "divisibility-select-all"], typicalMistakes: ["Dividir el numero completo sin sumar cifras"], repairExplanationEs: "Sumar los digitos del numero; si la suma es divisible por 3, el numero tambien lo es." },
  { id: "divisibility-4", topicId: "divisibilidad", titleEs: "Divisibilidad por 4", level: 3, prerequisiteSkillIds: ["multiples"], templateIds: ["divisibility-rule", "divisibility-select-all", "next-multiple", "count-multiples"], typicalMistakes: ["Mirar solo la ultima cifra"] },
  { id: "divisibility-5", topicId: "divisibilidad", titleEs: "Divisibilidad por 5", level: 1, prerequisiteSkillIds: [], templateIds: ["divisibility-rule", "divisibility-select-all", "next-multiple"], typicalMistakes: ["Aceptar numeros que terminan en cifra par"] },
  { id: "divisibility-6", topicId: "divisibilidad", titleEs: "Divisibilidad por 6", level: 3, prerequisiteSkillIds: ["divisibility-2", "divisibility-3"], templateIds: ["divisibility-rule", "divisibility-select-all", "divisibility-trap"], typicalMistakes: ["Revisar solo divisibilidad por 2 o solo por 3"] },
  { id: "divisibility-9", topicId: "divisibilidad", titleEs: "Divisibilidad por 9", level: 3, prerequisiteSkillIds: ["divisibility-3"], templateIds: ["divisibility-rule", "divisibility-select-all", "divisibility-trap"], typicalMistakes: ["Usar la regla de 3 sin ajustar a 9"] },
  { id: "divisibility-10", topicId: "divisibilidad", titleEs: "Divisibilidad por 10", level: 1, prerequisiteSkillIds: [], templateIds: ["divisibility-rule", "divisibility-select-all", "next-multiple"], typicalMistakes: ["Aceptar numeros que terminan en 5"] },
  { id: "divisibility-conditions", topicId: "divisibilidad", titleEs: "Numero que cumple condiciones", level: 4, prerequisiteSkillIds: ["divisibility-2", "divisibility-3", "multiples"], templateIds: ["conditional-number", "missing-digit-divisibility"], typicalMistakes: ["Cumplir una sola condicion", "Ignorar la condicion de descarte"], repairExplanationEs: "Separar las condiciones y comprobarlas una por una antes de responder.", parentSignalEs: "Necesita practicar problemas donde un numero debe cumplir mas de una regla." },
  {
    id: "divisibility-prime-factor",
    topicId: "divisibilidad",
    titleEs: "Descomposicion en factores primos",
    level: 3,
    prerequisiteSkillIds: ["divisibility-2", "divisibility-3", "divisibility-5"],
    templateIds: ["divisibility-prime-factor", "divisibility-gcd", "divisibility-lcm"],
    typicalMistakes: [
      "Confundir divisores con factores primos",
      "Detenerse antes de terminar la descomposicion",
    ],
    repairExplanationEs: "Dividí sucesivamente por 2, 3, 5, 7… hasta que el cociente sea 1. Cada divisor es un factor primo.",
    parentSignalEs: "La descomposicion en primos es la base del MCD y MCM que aparecen en ingreso.",
  },
  {
    id: "divisibility-gcd",
    topicId: "divisibilidad",
    titleEs: "Maximo Comun Divisor (MCD)",
    level: 4,
    prerequisiteSkillIds: ["divisibility-prime-factor"],
    templateIds: ["divisibility-gcd", "divisibility-prime-factor", "divisibility-lcm", "divisibility-trap"],
    typicalMistakes: [
      "Confundir MCD con MCM",
      "Usar el producto en vez del divisor comun",
    ],
    repairExplanationEs: "MCD: toma los factores primos COMUNES con el MENOR exponente. O usa el algoritmo de Euclides: divide el mayor entre el menor, toma el resto y repetí.",
    parentSignalEs: "El MCD aparece en problemas de reparto y simplificacion de fracciones.",
  },
  {
    id: "divisibility-lcm",
    topicId: "divisibilidad",
    titleEs: "Minimo Comun Multiplo (MCM)",
    level: 4,
    prerequisiteSkillIds: ["divisibility-prime-factor", "divisibility-gcd"],
    templateIds: ["divisibility-lcm", "divisibility-lcm-word", "divisibility-gcd", "divisibility-prime-factor"],
    typicalMistakes: [
      "Confundir MCM con MCD",
      "Multiplicar los dos numeros directamente sin reducir",
    ],
    repairExplanationEs: "MCM = (a × b) / MCD(a, b). O descompone en primos y tomá todos los factores con el MAYOR exponente.",
    parentSignalEs: "El MCM aparece en problemas de coincidencia (semaforos, colectivos, ciclos) — clasico de ingreso.",
  },
  { id: "fraction-simplify", topicId: "fracciones", titleEs: "Simplificar fracciones", level: 2, prerequisiteSkillIds: ["divisibility-conditions"], templateIds: ["fraction-simplify", "fraction-equivalent-missing", "fraction-equivalent-true-false", "fraction-add-same-den", "fraction-sub-same-den"], typicalMistakes: ["Dividir solo numerador", "No usar divisor comun maximo"] },
  { id: "fraction-compare", topicId: "fracciones", titleEs: "Comparar fracciones", level: 3, prerequisiteSkillIds: ["multiplication"], templateIds: ["fraction-compare", "fraction-compare-to-unit", "fraction-compare-same-den", "fraction-equivalent-true-false", "fraction-equivalent-missing"], typicalMistakes: ["Comparar solo numeradores", "Comparar solo denominadores"], repairExplanationEs: "Comparar con productos cruzados o llevar ambas fracciones a un mismo denominador.", parentSignalEs: "Le conviene reforzar comparacion de fracciones antes de avanzar a problemas combinados." },
  { id: "fraction-equivalent", topicId: "fracciones", titleEs: "Fracciones equivalentes", level: 3, prerequisiteSkillIds: ["multiplication", "fraction-simplify"], templateIds: ["fraction-equivalent-missing", "fraction-equivalent-true-false", "fraction-simplify", "fraction-compare", "mixed-to-improper"], typicalMistakes: ["Cambiar solo el denominador", "No usar el mismo factor arriba y abajo"], repairExplanationEs: "Para mantener una fraccion equivalente, aplicar el mismo factor arriba y abajo.", parentSignalEs: "Esta practicando equivalencia, una base para simplificar y comparar fracciones." },
  { id: "fraction-add", topicId: "fracciones", titleEs: "Sumar fracciones con igual denominador", level: 2, prerequisiteSkillIds: ["addition"], templateIds: ["fraction-add-same-den", "fraction-add-whole-and-fraction", "fraction-sub-same-den", "fraction-of-number", "fraction-equivalent-missing"], typicalMistakes: ["Sumar denominadores", "No simplificar el resultado"], repairExplanationEs: "Con igual denominador, operar solo los numeradores y simplificar al final.", parentSignalEs: "Conviene seguir con fracciones de igual denominador hasta que no cambie el denominador por error." },
  { id: "fraction-subtract", topicId: "fracciones", titleEs: "Restar fracciones con igual denominador", level: 3, prerequisiteSkillIds: ["fraction-add"], templateIds: ["fraction-sub-same-den", "fraction-add-same-den", "fraction-of-number-remainder", "fraction-complement-to-whole", "fraction-compare-same-den"], typicalMistakes: ["Restar denominadores", "No simplificar el resultado"], repairExplanationEs: "El denominador se mantiene; solo se restan los numeradores y luego se simplifica.", parentSignalEs: "Necesita consolidar la idea de denominador comun." },
  { id: "mixed-number", topicId: "fracciones", titleEs: "Numeros mixtos a fraccion impropia", level: 4, prerequisiteSkillIds: ["fraction-equivalent", "multiplication"], templateIds: ["mixed-to-improper", "fraction-add-whole-and-fraction", "fraction-equivalent-missing", "fraction-equivalent-true-false", "fraction-add-same-den"], typicalMistakes: ["Sumar el entero al numerador", "Olvidar multiplicar por el denominador"], repairExplanationEs: "Multiplicar el entero por el denominador y sumar el numerador.", parentSignalEs: "Esta entrando en fracciones de nivel ingreso con numeros mixtos." },
  { id: "fraction-of-number", topicId: "fracciones", titleEs: "Fraccion de una cantidad", level: 3, prerequisiteSkillIds: ["division", "multiplication"], templateIds: ["fraction-of-number", "fraction-of-number-remainder", "fraction-part-of-set", "fraction-complement-to-whole", "fraction-compare-to-unit"], typicalMistakes: ["Multiplicar sin dividir por el denominador"] },
  {
    id: "fraction-add-diff-den",
    topicId: "fracciones",
    titleEs: "Sumar fracciones con distinto denominador",
    level: 4,
    prerequisiteSkillIds: ["fraction-add", "multiples"],
    templateIds: ["fraction-add-diff-den", "fraction-word-add", "fraction-sub-diff-den", "fraction-equivalent-missing", "fraction-compare", "fraction-simplify"],
    typicalMistakes: [
      "Sumar numeradores y denominadores por separado sin igualar",
      "No simplificar el resultado",
      "Calcular el MCM incorrecto",
    ],
    repairExplanationEs: "Primero hallá el MCM de los denominadores. Convertí cada fracción a ese denominador. Recién ahí sumá los numeradores y simplificá.",
    parentSignalEs: "Este es el paso clave antes de ingreso: fracciones con distinto denominador. Conviene practicarlo hasta que salga automático.",
  },
  {
    id: "fraction-sub-diff-den",
    topicId: "fracciones",
    titleEs: "Restar fracciones con distinto denominador",
    level: 4,
    prerequisiteSkillIds: ["fraction-add-diff-den", "fraction-subtract"],
    templateIds: ["fraction-sub-diff-den", "fraction-add-diff-den", "fraction-word-add", "fraction-equivalent-missing", "fraction-compare", "fraction-simplify"],
    typicalMistakes: [
      "Restar denominadores en vez de igualarlos",
      "No convertir ambas fracciones al mismo denominador",
    ],
    repairExplanationEs: "El denominador no se resta. Llevá ambas fracciones al MCM y luego restá solo los numeradores.",
    parentSignalEs: "Necesita consolidar la resta con distinto denominador antes de avanzar a fracciones combinadas.",
  },
  {
    id: "fraction-mul",
    topicId: "fracciones",
    titleEs: "Multiplicar fracciones",
    level: 4,
    prerequisiteSkillIds: ["fraction-equivalent", "multiplication"],
    templateIds: ["fraction-mul", "fraction-div", "fraction-of-number", "fraction-add-diff-den", "fraction-simplify"],
    typicalMistakes: [
      "Sumar denominadores en vez de multiplicarlos",
      "No simplificar antes de multiplicar (más fácil simplificar cruzado)",
    ],
    repairExplanationEs: "Para multiplicar fracciones: numerador × numerador, denominador × denominador. Simplificá el resultado.",
    parentSignalEs: "La multiplicación de fracciones aparece mucho en los exámenes de ingreso.",
  },
  {
    id: "fraction-div",
    topicId: "fracciones",
    titleEs: "Dividir fracciones",
    level: 5,
    prerequisiteSkillIds: ["fraction-mul"],
    templateIds: ["fraction-div", "fraction-mul", "fraction-add-diff-den", "fraction-of-number", "fraction-simplify"],
    typicalMistakes: [
      "Invertir la primera fracción en vez de la segunda",
      "Olvidar multiplicar por el inverso",
    ],
    repairExplanationEs: "Para dividir: multiplicá la primera fracción por el inverso (volteado) de la segunda. Solo la segunda se invierte.",
    parentSignalEs: "División de fracciones es tema de ingreso. Fijarse si invierte la fracción correcta.",
  },
  { id: "decimal-addition", topicId: "decimales", titleEs: "Suma de decimales", level: 2, prerequisiteSkillIds: ["addition"], templateIds: ["decimal-add", "decimal-sub", "decimal-compare", "decimal-money-change"], typicalMistakes: ["No alinear la coma"] },
  { id: "decimal-subtraction", topicId: "decimales", titleEs: "Resta de decimales", level: 2, prerequisiteSkillIds: ["subtraction"], templateIds: ["decimal-sub", "decimal-money-change"], typicalMistakes: ["No alinear la coma", "Restar centavos como enteros"] },
  { id: "decimal-compare", topicId: "decimales", titleEs: "Comparar decimales", level: 2, prerequisiteSkillIds: [], templateIds: ["decimal-compare", "decimal-add", "decimal-sub", "decimal-times-10"], typicalMistakes: ["Creer que mas cifras decimales siempre es mayor"] },
  { id: "decimal-times-10", topicId: "decimales", titleEs: "Multiplicar decimales por 10 o 100", level: 2, prerequisiteSkillIds: ["decimal-compare"], templateIds: ["decimal-times-10", "decimal-compare", "decimal-round", "decimal-measure-convert"], typicalMistakes: ["Mover la coma en direccion incorrecta"], repairExplanationEs: "Multiplicar por 10 o 100 mueve la coma a la derecha; dividir la mueve a la izquierda.", parentSignalEs: "Debe automatizar movimiento de coma para porcentajes, medidas y dinero." },
  { id: "decimal-round", topicId: "decimales", titleEs: "Redondear decimales", level: 3, prerequisiteSkillIds: ["decimal-compare"], templateIds: ["decimal-round", "decimal-compare", "decimal-times-10", "decimal-money-change"], typicalMistakes: ["Cortar el decimal sin redondear", "Mirar la cifra equivocada"], repairExplanationEs: "Mirar la cifra siguiente: si es 5 o mas, se sube la cifra que queda.", parentSignalEs: "Redondeo ayuda en estimacion, medidas y problemas con dinero." },
  { id: "decimal-measure", topicId: "decimales", titleEs: "Decimales en medidas", level: 3, prerequisiteSkillIds: ["decimal-times-10"], templateIds: ["decimal-measure-convert", "decimal-times-10", "decimal-round", "decimal-compare"], typicalMistakes: ["Multiplicar cuando hay que dividir", "Confundir centimetros y metros"], repairExplanationEs: "Para pasar de centimetros a metros se divide por 100.", parentSignalEs: "Debe reforzar conversion de unidades con decimales." },
  { id: "decimal-money", topicId: "decimales", titleEs: "Decimales en dinero", level: 3, prerequisiteSkillIds: ["decimal-addition", "decimal-subtraction"], templateIds: ["decimal-money-change", "decimal-add", "decimal-sub", "decimal-compare"], typicalMistakes: ["Mezclar pesos y centavos", "Olvidar el vuelto"] },
  { id: "percent-of", topicId: "porcentajes", titleEs: "Porcentaje de una cantidad", level: 2, prerequisiteSkillIds: ["division", "multiplication"], templateIds: ["percent-of", "percent-find-rate", "discount-amount", "discount-price", "increase-price"], typicalMistakes: ["Calcular el porcentaje como suma fija"] },
  { id: "discount", topicId: "porcentajes", titleEs: "Descuentos", level: 3, prerequisiteSkillIds: ["percent-of", "subtraction"], templateIds: ["discount-price", "discount-amount", "discount-quantity-total", "discount-quantity-savings", "discount-budget", "discount-leftover-money", "double-discount", "compare-discounts"], typicalMistakes: ["Responder el descuento en vez del precio final"], repairExplanationEs: "Primero calcular el descuento; despues restarlo al precio inicial.", parentSignalEs: "Practica descuentos reales, no solo calculo aislado de porcentaje." },
  { id: "compare-discounts", topicId: "porcentajes", titleEs: "Comparar ofertas con descuento", level: 4, prerequisiteSkillIds: ["discount"], templateIds: ["compare-discounts", "discount-price", "discount-amount", "double-discount", "discount-budget"], typicalMistakes: ["Comparar solo el porcentaje y no el precio final"], repairExplanationEs: "Calcular el precio final de cada opcion y comparar esos resultados.", parentSignalEs: "Ya trabaja decisiones de compra de dos pasos." },
  { id: "reverse-percent", topicId: "porcentajes", titleEs: "Precio original antes de descuento", level: 5, prerequisiteSkillIds: ["discount", "division"], templateIds: ["reverse-discount", "discount-price", "discount-amount", "double-discount", "percent-find-rate"], typicalMistakes: ["Sumar el porcentaje al precio final", "Tratar el precio final como 100%"], repairExplanationEs: "Despues del descuento, el precio final representa el porcentaje que queda, no el 100%.", parentSignalEs: "Este es un tipo de problema de ingreso: reconstruir el dato inicial." },
  { id: "increase", topicId: "porcentajes", titleEs: "Aumentos porcentuales", level: 3, prerequisiteSkillIds: ["percent-of", "addition"], templateIds: ["increase-price", "increase-budget-gap", "percent-of", "percent-find-rate", "discount-price"], typicalMistakes: ["Restar cuando corresponde sumar"] },
  { id: "budget", topicId: "porcentajes", titleEs: "Presupuesto despues de descuento", level: 4, prerequisiteSkillIds: ["discount"], templateIds: ["discount-budget", "discount-leftover-money", "discount-quantity-total", "discount-quantity-savings", "increase-budget-gap", "double-discount"], typicalMistakes: ["No hacer el segundo paso de comparar con el dinero disponible"] },
  { id: "rectangle-area", topicId: "geometria", titleEs: "Area de rectangulo", level: 2, prerequisiteSkillIds: ["multiplication"], templateIds: ["rect-area", "rect-perimeter", "square-area", "area-compare"], typicalMistakes: ["Sumar lados en vez de multiplicar"] },
  { id: "rectangle-perimeter", topicId: "geometria", titleEs: "Perimetro de rectangulo", level: 2, prerequisiteSkillIds: ["addition", "multiplication"], templateIds: ["rect-perimeter", "rect-area", "square-perimeter", "perimeter-fence-cost"], typicalMistakes: ["Sumar solo largo y ancho una vez"] },
  { id: "compound-area", topicId: "geometria", titleEs: "Area compuesta", level: 4, prerequisiteSkillIds: ["rectangle-area"], templateIds: ["compound-area", "rect-area", "area-compare", "square-area"], typicalMistakes: ["Calcular solo una parte de la figura"], repairExplanationEs: "Dividir la figura en rectangulos simples y sumar sus areas.", parentSignalEs: "Debe practicar figuras compuestas, un paso por encima de formula directa." },
  { id: "area-compare", topicId: "geometria", titleEs: "Comparar areas", level: 3, prerequisiteSkillIds: ["rectangle-area"], templateIds: ["area-compare", "rect-area", "rect-perimeter", "compound-area"], typicalMistakes: ["Comparar solo largo o solo ancho", "No calcular ambas areas"], repairExplanationEs: "Calcular el area de cada figura antes de decidir cual es mayor.", parentSignalEs: "Aprende a justificar comparaciones, no solo aplicar una formula." },
  { id: "perimeter-cost", topicId: "geometria", titleEs: "Perimetro con costo", level: 4, prerequisiteSkillIds: ["rectangle-perimeter", "multiplication"], templateIds: ["perimeter-fence-cost", "rect-perimeter", "rect-area", "rect-missing-side-perimeter"], typicalMistakes: ["Usar area en vez de perimetro", "Olvidar multiplicar por el precio"], repairExplanationEs: "Primero se calcula el perimetro; despues se multiplica por el costo por metro.", parentSignalEs: "Conecta geometria con problemas cotidianos de dos pasos." },
  { id: "square-area", topicId: "geometria", titleEs: "Area de cuadrado", level: 2, prerequisiteSkillIds: ["multiplication"], templateIds: ["square-area", "rect-area", "area-compare", "rect-perimeter"], typicalMistakes: ["Multiplicar por 4 en vez de lado por lado"] },
  { id: "square-perimeter", topicId: "geometria", titleEs: "Perimetro de cuadrado", level: 1, prerequisiteSkillIds: ["multiplication"], templateIds: ["square-perimeter", "rect-perimeter", "rect-area", "perimeter-fence-cost"], typicalMistakes: ["Elevar al cuadrado en vez de multiplicar por 4"] },
  { id: "missing-side-area", topicId: "geometria", titleEs: "Lado desconocido por area", level: 4, prerequisiteSkillIds: ["rectangle-area", "division"], templateIds: ["rect-missing-side-area", "rect-area", "rect-missing-side-perimeter", "area-compare"], typicalMistakes: ["Multiplicar otra vez en vez de dividir"] },
  { id: "missing-side-perimeter", topicId: "geometria", titleEs: "Lado desconocido por perimetro", level: 4, prerequisiteSkillIds: ["rectangle-perimeter"], templateIds: ["rect-missing-side-perimeter", "rect-missing-side-perimeter-with-half"], typicalMistakes: ["Olvidar dividir el perimetro por 2"] },
];

export const SKILLS_BY_ID = new Map(SKILLS.map((skill) => [skill.id, skill]));

export function getSkillsForTopic(topicId: string): SkillDefinition[] {
  return SKILLS.filter((skill) => skill.topicId === topicId);
}

export function getTemplatesForSkillTags(skillTags: string[]): TemplateId[] {
  const templates = skillTags.flatMap((tag) => SKILLS_BY_ID.get(tag)?.templateIds ?? []);
  return Array.from(new Set(templates));
}

export function isKnownSkillTag(skillTag: string): boolean {
  return SKILLS_BY_ID.has(skillTag);
}

export function getSkillRepairExplanation(skillTag: string): string {
  const skill = SKILLS_BY_ID.get(skillTag);
  if (!skill) return "Revisar el procedimiento paso a paso antes de responder.";
  const pack = getSkillRepairText(skillTag, "es");
  return skill.repairExplanationEs ?? `${pack.whyWrong} ${pack.howToFix}`;
}

export function getSkillParentSignal(skillTag: string): string {
  const skill = SKILLS_BY_ID.get(skillTag);
  if (!skill) return "Conviene reforzar este contenido con practica corta.";
  return skill.parentSignalEs ?? `Atencion: ${skill.titleEs}.`;
}
