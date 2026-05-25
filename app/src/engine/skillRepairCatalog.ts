import type { Language } from "../i18n/types";

export type SkillRepairExplanation = {
  skillId: string;
  whyWrong: { es: string; ru: string };
  howToFix: { es: string; ru: string };
  miniHint: { es: string; ru: string };
};

const DEFAULT_REPAIR: SkillRepairExplanation = {
  skillId: "default",
  whyWrong: {
    es: "Se salto un paso del procedimiento.",
    ru: "Был пропущен один из шагов решения.",
  },
  howToFix: {
    es: "Volve al metodo base paso a paso y revisa cada operacion.",
    ru: "Вернись к базовому алгоритму и проверь каждый шаг по порядку.",
  },
  miniHint: {
    es: "Primero estructura el dato, despues calcula.",
    ru: "Сначала разложи данные, потом считай.",
  },
};

const CATALOG: Record<string, SkillRepairExplanation> = {
  "fraction-compare": {
    skillId: "fraction-compare",
    whyWrong: {
      es: "Se comparo solo numerador o solo denominador.",
      ru: "Сравнение шло только по числителям или только по знаменателям.",
    },
    howToFix: {
      es: "Usa producto cruzado o lleva ambas fracciones al mismo denominador.",
      ru: "Используй перекрестное умножение или приведи дроби к общему знаменателю.",
    },
    miniHint: {
      es: "a/b ? c/d -> compara a*d con c*b.",
      ru: "a/b ? c/d -> сравни a*d и c*b.",
    },
  },
  "fraction-simplify": {
    skillId: "fraction-simplify",
    whyWrong: {
      es: "Se dividio solo una parte de la fraccion.",
      ru: "Была разделена только одна часть дроби.",
    },
    howToFix: {
      es: "Busca el MCD y divide numerador y denominador por el mismo numero.",
      ru: "Найди НОД и раздели и числитель, и знаменатель на одно и то же число.",
    },
    miniHint: {
      es: "Si 18/24 -> divide ambos por 6.",
      ru: "Если 18/24 -> дели обе части на 6.",
    },
  },
  "fraction-of-number": {
    skillId: "fraction-of-number",
    whyWrong: {
      es: "Se multiplico directo sin dividir por el denominador.",
      ru: "Умножение сделано без деления на знаменатель.",
    },
    howToFix: {
      es: "Primero divide el total por el denominador, luego multiplica por el numerador.",
      ru: "Сначала раздели целое на знаменатель, потом умножь на числитель.",
    },
    miniHint: {
      es: "3/5 de 40: 40/5=8, 8*3=24.",
      ru: "3/5 от 40: 40/5=8, 8*3=24.",
    },
  },
  discount: {
    skillId: "discount",
    whyWrong: {
      es: "Se respondio el descuento en vez del precio final (o al reves).",
      ru: "Перепутана сумма скидки и итоговая цена.",
    },
    howToFix: {
      es: "Paso 1: calcula el descuento. Paso 2: resta al precio inicial.",
      ru: "Шаг 1: найди сумму скидки. Шаг 2: вычти ее из исходной цены.",
    },
    miniHint: {
      es: "20% de 10000 = 2000, precio final = 8000.",
      ru: "20% от 10000 = 2000, итоговая цена = 8000.",
    },
  },
  "compare-discounts": {
    skillId: "compare-discounts",
    whyWrong: {
      es: "Se comparo solo el porcentaje, no el precio final.",
      ru: "Сравнивался только процент, а не финальная цена.",
    },
    howToFix: {
      es: "Calcula ambos precios finales y compara los resultados.",
      ru: "Сначала посчитай обе итоговые цены, затем сравни их.",
    },
    miniHint: {
      es: "Oferta A y B: comparar finales, no etiquetas.",
      ru: "Сравнивай итоговые суммы A и B, не ярлык акции.",
    },
  },
  "reverse-percent": {
    skillId: "reverse-percent",
    whyWrong: {
      es: "Se tomo el precio final como si fuera el 100%.",
      ru: "Итоговая цена была принята за 100%.",
    },
    howToFix: {
      es: "Identifica el porcentaje restante y divide por ese valor.",
      ru: "Определи оставшийся процент и дели на него.",
    },
    miniHint: {
      es: "Si queda 80%, original = final / 0.8.",
      ru: "Если осталось 80%, исходная = финальная / 0.8.",
    },
  },
};

export function getSkillRepairPack(skillId: string): SkillRepairExplanation {
  return CATALOG[skillId] ?? DEFAULT_REPAIR;
}

export function getSkillRepairText(
  skillId: string,
  lang: Language
): { whyWrong: string; howToFix: string; miniHint: string } {
  const pack = getSkillRepairPack(skillId);
  return {
    whyWrong: pack.whyWrong[lang],
    howToFix: pack.howToFix[lang],
    miniHint: pack.miniHint[lang],
  };
}

