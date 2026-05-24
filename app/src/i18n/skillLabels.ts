// Russian labels for skills — stored separately to avoid TypeScript transpiler
// size limits in test-generator.mjs which processes skills.ts directly.
// Keys match skill ids from skills.ts.

export type SkillLabel = {
  titleRu: string;
  repairExplanationRu?: string;
};

export const SKILL_LABELS_RU: Record<string, SkillLabel> = {
  // operaciones
  addition: { titleRu: "Сложение натуральных чисел" },
  subtraction: { titleRu: "Вычитание натуральных чисел" },
  multiplication: { titleRu: "Умножение" },
  "order-of-operations": { titleRu: "Порядок действий" },
  division: { titleRu: "Деление без остатка" },
  "shopping-change": { titleRu: "Покупки и сдача" },

  // divisibilidad
  multiples: {
    titleRu: "Кратные числа",
    repairExplanationRu: "Кратное — число, которое делится на данное без остатка.",
  },
  "divisibility-2": {
    titleRu: "Признак делимости на 2",
    repairExplanationRu: "Смотри только на последнюю цифру. Если она чётная — число делится на 2.",
  },
  "divisibility-3": {
    titleRu: "Признак делимости на 3",
    repairExplanationRu: "Сложи цифры числа. Если сумма делится на 3 — число тоже делится на 3.",
  },
  "divisibility-4": {
    titleRu: "Признак делимости на 4",
    repairExplanationRu: "Смотри на последние две цифры: если они делятся на 4, делится и всё число.",
  },
  "divisibility-5": {
    titleRu: "Признак делимости на 5",
    repairExplanationRu: "Число делится на 5, если оканчивается на 0 или 5.",
  },
  "divisibility-6": {
    titleRu: "Признак делимости на 6",
    repairExplanationRu: "Число делится на 6, если делится и на 2, и на 3 одновременно.",
  },
  "divisibility-9": {
    titleRu: "Признак делимости на 9",
    repairExplanationRu: "Сложи цифры числа. Если сумма делится на 9 — число тоже делится на 9.",
  },
  "divisibility-10": {
    titleRu: "Признак делимости на 10",
    repairExplanationRu: "Число делится на 10, если оканчивается на 0.",
  },
  "divisibility-conditions": {
    titleRu: "Число, удовлетворяющее условиям",
    repairExplanationRu: "Разбей условия на части и проверяй каждое по отдельности.",
  },

  // fracciones
  "fraction-simplify": {
    titleRu: "Сокращение дробей",
    repairExplanationRu: "Найди наибольший общий делитель числителя и знаменателя, потом раздели оба на него.",
  },
  "fraction-compare": {
    titleRu: "Сравнение дробей",
    repairExplanationRu: "Приведи дроби к общему знаменателю или используй перекрёстное умножение.",
  },
  "fraction-equivalent": {
    titleRu: "Равнозначные дроби",
    repairExplanationRu: "Умножь (или раздели) числитель и знаменатель на одно и то же число.",
  },
  "fraction-add": {
    titleRu: "Сложение дробей с одинаковым знаменателем",
    repairExplanationRu: "При одинаковом знаменателе складывай только числители. В конце сократи дробь.",
  },
  "fraction-subtract": {
    titleRu: "Вычитание дробей с одинаковым знаменателем",
    repairExplanationRu: "Знаменатель остаётся тем же. Вычитай только числители, потом сократи.",
  },
  "mixed-number": {
    titleRu: "Смешанное число в неправильную дробь",
    repairExplanationRu: "Умножь целую часть на знаменатель и прибавь числитель. Знаменатель не меняется.",
  },
  "fraction-of-number": {
    titleRu: "Дробь от числа",
    repairExplanationRu: "Раздели число на знаменатель, потом умножь на числитель.",
  },

  // decimales
  "decimal-addition": {
    titleRu: "Сложение десятичных дробей",
    repairExplanationRu: "Выравнивай запятые друг под другом перед сложением.",
  },
  "decimal-subtraction": {
    titleRu: "Вычитание десятичных дробей",
    repairExplanationRu: "Запятые должны быть строго друг под другом. Не забудь про заимствование.",
  },
  "decimal-compare": {
    titleRu: "Сравнение десятичных дробей",
    repairExplanationRu: "Больше цифр после запятой не значит больше число. Сравнивай поразрядно.",
  },
  "decimal-times-10": {
    titleRu: "Умножение десятичных на 10 или 100",
    repairExplanationRu: "Умножение на 10 сдвигает запятую вправо. Деление — влево.",
  },
  "decimal-round": {
    titleRu: "Округление десятичных дробей",
    repairExplanationRu: "Смотри на следующую цифру: если 5 или больше — увеличь разряд на 1.",
  },
  "decimal-measure": {
    titleRu: "Десятичные в единицах измерения",
    repairExplanationRu: "Чтобы перевести сантиметры в метры — раздели на 100.",
  },
  "decimal-money": {
    titleRu: "Десятичные в задачах с деньгами",
    repairExplanationRu: "Не смешивай целые и сотые. Запятую ставь строго под запятой.",
  },

  // porcentajes
  "percent-of": {
    titleRu: "Процент от числа",
    repairExplanationRu: "Раздели число на 100 и умножь на процент.",
  },
  discount: {
    titleRu: "Скидки",
    repairExplanationRu: "Сначала посчитай размер скидки, потом вычти из исходной цены.",
  },
  "compare-discounts": {
    titleRu: "Сравнение скидок",
    repairExplanationRu: "Посчитай итоговую цену каждого варианта, потом сравни результаты.",
  },
  "reverse-percent": {
    titleRu: "Цена до скидки",
    repairExplanationRu: "После скидки цена — это не 100%. Раздели на остаток и умножь на 100.",
  },
  increase: {
    titleRu: "Процентное увеличение",
    repairExplanationRu: "Посчитай процент от числа, потом прибавь к исходному.",
  },
  budget: {
    titleRu: "Бюджет после скидки",
    repairExplanationRu: "Сначала посчитай итоговую цену, потом сравни с суммой денег.",
  },

  // geometria
  "rectangle-area": {
    titleRu: "Площадь прямоугольника",
    repairExplanationRu: "Площадь = длина x ширина. Не складывай стороны.",
  },
  "rectangle-perimeter": {
    titleRu: "Периметр прямоугольника",
    repairExplanationRu: "Периметр = 2 x (длина + ширина). Не забудь умножить на 2.",
  },
  "compound-area": {
    titleRu: "Площадь составной фигуры",
    repairExplanationRu: "Раздели фигуру на простые прямоугольники и сложи их площади.",
  },
  "area-compare": {
    titleRu: "Сравнение площадей",
    repairExplanationRu: "Посчитай площадь каждой фигуры, потом сравни числа.",
  },
  "perimeter-cost": {
    titleRu: "Периметр и стоимость",
    repairExplanationRu: "Сначала найди периметр, потом умножь на цену за единицу длины.",
  },
  "square-area": {
    titleRu: "Площадь квадрата",
    repairExplanationRu: "Площадь квадрата = сторона x сторона. Не умножай на 4 (это периметр).",
  },
  "square-perimeter": {
    titleRu: "Периметр квадрата",
    repairExplanationRu: "Периметр квадрата = сторона x 4.",
  },
  "missing-side-area": {
    titleRu: "Неизвестная сторона по площади",
    repairExplanationRu: "Если знаешь площадь и одну сторону — раздели площадь на эту сторону.",
  },
  "missing-side-perimeter": {
    titleRu: "Неизвестная сторона по периметру",
    repairExplanationRu: "Периметр = 2 x (длина + ширина). Найди сумму сторон, потом вычти известную.",
  },
};

export function getSkillTitleRu(skillId: string, fallbackEs: string): string {
  return SKILL_LABELS_RU[skillId]?.titleRu ?? fallbackEs;
}

export function getSkillRepairRu(skillId: string, fallbackEs?: string): string {
  return SKILL_LABELS_RU[skillId]?.repairExplanationRu
    ?? fallbackEs
    ?? "Разбери похожие примеры с другими числами.";
}
