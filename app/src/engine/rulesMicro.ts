import type { Language, LocalizedText } from "../i18n/types";

export type RuleMicro = {
  title: LocalizedText;
  steps: LocalizedText[];
};

const DEFAULT_RULE: RuleMicro = {
  title: {
    es: "Primero ordena los datos y luego calcula.",
    ru: "Сначала разложи данные по шагам, потом считай.",
  },
  steps: [
    {
      es: "1) Marca que te piden.",
      ru: "1) Отметь, что нужно найти.",
    },
    {
      es: "2) Haz una sola operacion por vez.",
      ru: "2) Делай по одной операции за шаг.",
    },
    {
      es: "3) Revisa el resultado final.",
      ru: "3) Проверь итоговый ответ.",
    },
  ],
};

const RULES_BY_SKILL: Record<string, RuleMicro> = {
  "fraction-compare": {
    title: {
      es: "Compara fracciones sin adivinar.",
      ru: "Сравнивай дроби не наугад.",
    },
    steps: [
      { es: "1) Multiplica en cruz: a*d y c*b.", ru: "1) Умножь крест-накрест: a*d и c*b." },
      { es: "2) Compara esos dos resultados.", ru: "2) Сравни полученные числа." },
      { es: "3) El mayor producto marca la fraccion mayor.", ru: "3) Где больше произведение — та дробь больше." },
    ],
  },
  "fraction-simplify": {
    title: {
      es: "Simplificar = dividir arriba y abajo por lo mismo.",
      ru: "Сократить = делить верх и низ на одно число.",
    },
    steps: [
      { es: "1) Busca un divisor comun grande (MCD).", ru: "1) Найди общий большой делитель (НОД)." },
      { es: "2) Divide numerador y denominador por ese numero.", ru: "2) Раздели числитель и знаменатель на него." },
      { es: "3) Repite si todavia se puede simplificar.", ru: "3) Повтори, если можно сократить ещё." },
    ],
  },
  "fraction-of-number": {
    title: {
      es: "Para una fraccion de cantidad: divide y luego multiplica.",
      ru: "Чтобы найти дробь от числа: дели, потом умножай.",
    },
    steps: [
      { es: "1) Divide el total por el denominador.", ru: "1) Раздели целое на знаменатель." },
      { es: "2) Multiplica ese resultado por el numerador.", ru: "2) Умножь результат на числитель." },
      { es: "3) Revisa si tiene sentido con el total.", ru: "3) Проверь, что ответ логичен относительно целого." },
    ],
  },
  "fraction-add-diff-den": {
    title: {
      es: "Con distinto denominador: primero igualar.",
      ru: "Разные знаменатели: сначала приведи к общему.",
    },
    steps: [
      { es: "1) Busca el mcm de los denominadores.", ru: "1) Найди НОК знаменателей." },
      { es: "2) Convierte ambas fracciones a ese denominador.", ru: "2) Приведи обе дроби к этому знаменателю." },
      { es: "3) Suma numeradores y simplifica.", ru: "3) Сложи числители и сократи результат." },
    ],
  },
  "fraction-sub-diff-den": {
    title: {
      es: "Para restar, iguala denominadores primero.",
      ru: "Для вычитания сначала сделай общий знаменатель.",
    },
    steps: [
      { es: "1) Halla el mcm de los denominadores.", ru: "1) Найди НОК знаменателей." },
      { es: "2) Convierte las fracciones al mismo denominador.", ru: "2) Приведи дроби к одному знаменателю." },
      { es: "3) Resta numeradores y simplifica.", ru: "3) Вычти числители и сократи." },
    ],
  },
  "mixed-number": {
    title: {
      es: "Mixto a impropia: entero por abajo, luego suma.",
      ru: "Смешанное в неправильную: целая часть × знаменатель, потом плюс.",
    },
    steps: [
      { es: "1) Multiplica el entero por el denominador.", ru: "1) Умножь целую часть на знаменатель." },
      { es: "2) Suma el numerador.", ru: "2) Прибавь числитель." },
      { es: "3) Denominador queda igual.", ru: "3) Знаменатель остаётся тем же." },
    ],
  },
  "fraction-equivalent": {
    title: {
      es: "Fracciones equivalentes: mismo factor arriba y abajo.",
      ru: "Равные дроби: один и тот же множитель сверху и снизу.",
    },
    steps: [
      { es: "1) Elige un numero para multiplicar o dividir.", ru: "1) Выбери число для умножения или деления." },
      { es: "2) Aplica ese mismo numero a numerador y denominador.", ru: "2) Примени его и к числителю, и к знаменателю." },
      { es: "3) Si no es el mismo en ambos, no es equivalente.", ru: "3) Если числа разные — дроби уже не равны." },
    ],
  },
  "fraction-mul": {
    title: {
      es: "Multiplicar fracciones es directo.",
      ru: "Умножение дробей делается напрямую.",
    },
    steps: [
      { es: "1) Multiplica numerador por numerador.", ru: "1) Умножь числитель на числитель." },
      { es: "2) Multiplica denominador por denominador.", ru: "2) Умножь знаменатель на знаменатель." },
      { es: "3) Simplifica la fraccion final.", ru: "3) Сократи итоговую дробь." },
    ],
  },
  "fraction-div": {
    title: {
      es: "Dividir fracciones = multiplicar por el inverso.",
      ru: "Деление дробей = умножение на обратную.",
    },
    steps: [
      { es: "1) Da vuelta solo la segunda fraccion.", ru: "1) Переверни только вторую дробь." },
      { es: "2) Cambia division por multiplicacion.", ru: "2) Замени деление на умножение." },
      { es: "3) Multiplica y simplifica.", ru: "3) Перемножь и сократи." },
    ],
  },
  discount: {
    title: {
      es: "Descuento en dos pasos.",
      ru: "Скидка считается в два шага.",
    },
    steps: [
      { es: "1) Calcula cuanto vale el porcentaje de descuento.", ru: "1) Найди сумму скидки в деньгах." },
      { es: "2) Resta ese descuento al precio inicial.", ru: "2) Вычти скидку из начальной цены." },
      { es: "3) Si piden ahorro, responde solo el descuento.", ru: "3) Если спрашивают экономию — это сама скидка." },
    ],
  },
  "decimal-compare": {
    title: {
      es: "Compara decimales alineando posiciones.",
      ru: "Сравнивай десятичные по разрядам.",
    },
    steps: [
      { es: "1) Iguala cantidad de decimales con ceros si hace falta.", ru: "1) Приравняй число знаков после запятой нулями." },
      { es: "2) Compara de izquierda a derecha.", ru: "2) Сравнивай слева направо по разрядам." },
      { es: "3) El primer digito distinto decide.", ru: "3) Первый отличающийся разряд решает." },
    ],
  },
  "divisibility-2": {
    title: {
      es: "Regla del 2: mira solo la ultima cifra.",
      ru: "Правило 2: смотри только последнюю цифру.",
    },
    steps: [
      { es: "1) Si termina en 0,2,4,6,8 -> divide por 2.", ru: "1) Если конец 0,2,4,6,8 -> делится на 2." },
      { es: "2) Si termina en impar -> no divide por 2.", ru: "2) Если последняя цифра нечётная -> не делится на 2." },
      { es: "3) Marca solo una opcion correcta.", ru: "3) Выбери только один верный вариант." },
    ],
  },
  "divisibility-3": {
    title: {
      es: "Regla del 3: suma las cifras.",
      ru: "Правило 3: сложи цифры числа.",
    },
    steps: [
      { es: "1) Suma todos los digitos del numero.", ru: "1) Сложи все цифры числа." },
      { es: "2) Si esa suma divide por 3, el numero tambien.", ru: "2) Если сумма делится на 3, число тоже делится." },
      { es: "3) Si no divide, descarta esa opcion.", ru: "3) Если не делится — вариант неверный." },
    ],
  },
  "divisibility-5": {
    title: {
      es: "Regla del 5: mira la ultima cifra.",
      ru: "Правило 5: смотри на последнюю цифру.",
    },
    steps: [
      { es: "1) Si termina en 0 o 5, divide por 5.", ru: "1) Если заканчивается на 0 или 5 — делится на 5." },
      { es: "2) Si termina en otra cifra, no divide.", ru: "2) Если другая цифра — не делится." },
      { es: "3) Elige solo la opcion que cumple.", ru: "3) Выбери только подходящий вариант." },
    ],
  },
  "divisibility-9": {
    title: {
      es: "Regla del 9: tambien con suma de cifras.",
      ru: "Правило 9: тоже по сумме цифр.",
    },
    steps: [
      { es: "1) Suma las cifras del numero.", ru: "1) Сложи цифры числа." },
      { es: "2) Si la suma divide por 9, el numero divide por 9.", ru: "2) Если сумма делится на 9, число тоже делится на 9." },
      { es: "3) Si no, descarta la opcion.", ru: "3) Если нет — отбрасывай вариант." },
    ],
  },
  "divisibility-10": {
    title: {
      es: "Regla del 10: termina en cero.",
      ru: "Правило 10: число должно заканчиваться на 0.",
    },
    steps: [
      { es: "1) Mira solo la ultima cifra.", ru: "1) Смотри только на последнюю цифру." },
      { es: "2) Si es 0, divide por 10.", ru: "2) Если это 0 — делится на 10." },
      { es: "3) Si no es 0, no divide por 10.", ru: "3) Если не 0 — не делится на 10." },
    ],
  },
  "reverse-percent": {
    title: {
      es: "Precio original: el final no es 100%.",
      ru: "Исходная цена: финальная — это не 100%.",
    },
    steps: [
      { es: "1) Define cuanto porcentaje quedo (ej: 80%).", ru: "1) Определи, сколько процентов осталось (например, 80%)." },
      { es: "2) Divide el precio final por ese porcentaje en decimal.", ru: "2) Раздели конечную цену на этот процент в десятичном виде." },
      { es: "3) Ese resultado es el precio original.", ru: "3) Получишь исходную цену." },
    ],
  },
  "compare-discounts": {
    title: {
      es: "No compares solo porcentaje: compara precio final.",
      ru: "Сравнивай не процент, а итоговую цену.",
    },
    steps: [
      { es: "1) Calcula el precio final de la oferta A.", ru: "1) Посчитай итоговую цену варианта A." },
      { es: "2) Calcula el precio final de la oferta B.", ru: "2) Посчитай итоговую цену варианта B." },
      { es: "3) El menor precio final es la mejor oferta.", ru: "3) Где итоговая цена меньше — там выгоднее." },
    ],
  },
  "percent-of": {
    title: {
      es: "Porcentaje de cantidad: pasa % a decimal y multiplica.",
      ru: "Процент от числа: переведи % в десятичную и умножь.",
    },
    steps: [
      { es: "1) Convierte porcentaje a decimal (25% = 0.25).", ru: "1) Переведи процент в десятичную дробь (25% = 0.25)." },
      { es: "2) Multiplica por la cantidad total.", ru: "2) Умножь на исходное число." },
      { es: "3) Revisa si el resultado tiene sentido.", ru: "3) Проверь, логичен ли результат." },
    ],
  },
  "rectangle-area": {
    title: {
      es: "Area de rectangulo: largo por ancho.",
      ru: "Площадь прямоугольника: длина × ширина.",
    },
    steps: [
      { es: "1) Identifica largo y ancho.", ru: "1) Определи длину и ширину." },
      { es: "2) Multiplica: largo x ancho.", ru: "2) Перемножь: длина × ширина." },
      { es: "3) Escribe la unidad cuadrada (m², cm²).", ru: "3) Добавь квадратные единицы (м², см²)." },
    ],
  },
  "square-area": {
    title: {
      es: "Area de cuadrado: lado por lado.",
      ru: "Площадь квадрата: сторона × сторона.",
    },
    steps: [
      { es: "1) Toma la medida del lado.", ru: "1) Возьми длину стороны." },
      { es: "2) Multiplica lado x lado.", ru: "2) Умножь сторону на сторону." },
      { es: "3) Agrega unidad cuadrada.", ru: "3) Добавь квадратные единицы." },
    ],
  },
  "rectangle-perimeter": {
    title: {
      es: "Perimetro de rectangulo: suma de todos los lados.",
      ru: "Периметр прямоугольника: сумма всех сторон.",
    },
    steps: [
      { es: "1) Usa formula: 2 x (largo + ancho).", ru: "1) Используй формулу: 2 × (длина + ширина)." },
      { es: "2) Primero suma largo y ancho.", ru: "2) Сначала сложи длину и ширину." },
      { es: "3) Multiplica por 2 y escribe unidad lineal.", ru: "3) Умножь на 2 и добавь обычные единицы (м, см)." },
    ],
  },
  "square-perimeter": {
    title: {
      es: "Perimetro de cuadrado: 4 lados iguales.",
      ru: "Периметр квадрата: 4 одинаковые стороны.",
    },
    steps: [
      { es: "1) Toma la medida del lado.", ru: "1) Возьми длину стороны." },
      { es: "2) Multiplica por 4.", ru: "2) Умножь на 4." },
      { es: "3) Escribe unidad lineal (m, cm).", ru: "3) Добавь обычные единицы (м, см)." },
    ],
  },
};

const RULES_BY_TEMPLATE: Record<string, RuleMicro> = {
  "shopping-change": {
    title: {
      es: "Vuelto: total de compra y despues resta.",
      ru: "Сдача: сначала сумма покупки, потом вычитание.",
    },
    steps: [
      { es: "1) Suma o calcula el total de productos.", ru: "1) Сложи или посчитай общую стоимость." },
      { es: "2) Resta ese total al dinero pagado.", ru: "2) Вычти эту сумму из оплаченной." },
      { es: "3) Si da negativo, no alcanza el dinero.", ru: "3) Если получилось меньше нуля — денег не хватает." },
    ],
  },
  "divisibility-select-all": {
    title: {
      es: "Si pide uno, busca una sola respuesta correcta.",
      ru: "Если задача с одним ответом — ищи ровно один.",
    },
    steps: [
      { es: "1) Revisa cada opcion con la regla de divisibilidad.", ru: "1) Проверь каждый вариант по правилу делимости." },
      { es: "2) Descarta las que no cumplen.", ru: "2) Сразу отбрасывай неверные." },
      { es: "3) Elige solo la que cumple exacto.", ru: "3) Выбери только ту, что точно подходит." },
    ],
  },
  "rect-area": {
    title: {
      es: "Area: cubrir una superficie.",
      ru: "Площадь: сколько места занимает фигура.",
    },
    steps: [
      { es: "1) Multiplica las dos medidas.", ru: "1) Перемножь две стороны." },
      { es: "2) Revisa el calculo.", ru: "2) Проверь вычисление." },
      { es: "3) Escribe unidad cuadrada.", ru: "3) Напиши квадратные единицы." },
    ],
  },
  "rect-perimeter": {
    title: {
      es: "Perimetro: borde total.",
      ru: "Периметр: длина границы фигуры.",
    },
    steps: [
      { es: "1) Suma lados que se repiten.", ru: "1) Сложи повторяющиеся стороны." },
      { es: "2) Usa 2 x (largo + ancho).", ru: "2) Применяй 2 × (длина + ширина)." },
      { es: "3) Escribe unidad lineal.", ru: "3) Пиши обычные единицы длины." },
    ],
  },
  "square-area": {
    title: {
      es: "En cuadrado: lado x lado.",
      ru: "У квадрата: сторона × сторона.",
    },
    steps: [
      { es: "1) Toma el lado.", ru: "1) Возьми сторону." },
      { es: "2) Multiplica por si mismo.", ru: "2) Умножь на саму себя." },
      { es: "3) Unidad cuadrada.", ru: "3) Квадратные единицы." },
    ],
  },
  "square-perimeter": {
    title: {
      es: "En cuadrado: 4 x lado.",
      ru: "У квадрата: 4 × сторона.",
    },
    steps: [
      { es: "1) Toma el lado.", ru: "1) Возьми сторону." },
      { es: "2) Multiplica por 4.", ru: "2) Умножь на 4." },
      { es: "3) Unidad lineal.", ru: "3) Обычные единицы длины." },
    ],
  },
  "reverse-discount": {
    title: {
      es: "Para volver al precio original, divide por lo que quedo.",
      ru: "Чтобы вернуть исходную цену, дели на оставшийся процент.",
    },
    steps: [
      { es: "1) Si descuento es 20%, queda 80%.", ru: "1) Если скидка 20%, осталось 80%." },
      { es: "2) Pasa 80% a 0.8.", ru: "2) Преврати 80% в 0.8." },
      { es: "3) Original = final / 0.8.", ru: "3) Исходная цена = финальная / 0.8." },
    ],
  },
  "percent-find-rate": {
    title: {
      es: "Para hallar el porcentaje: parte dividido total.",
      ru: "Чтобы найти процент: часть разделить на целое.",
    },
    steps: [
      { es: "1) Divide la parte por el total.", ru: "1) Раздели часть на целое." },
      { es: "2) Multiplica por 100.", ru: "2) Умножь на 100." },
      { es: "3) Escribe el resultado con %.", ru: "3) Запиши ответ со знаком %." },
    ],
  },
  "compare-discounts": {
    title: {
      es: "Oferta mejor = precio final mas bajo.",
      ru: "Лучшая скидка = самая низкая итоговая цена.",
    },
    steps: [
      { es: "1) Saca el precio final de cada oferta.", ru: "1) Посчитай итоговую цену каждой акции." },
      { es: "2) No decidas por el % sin calcular.", ru: "2) Не выбирай по % без вычислений." },
      { es: "3) Compara los dos finales.", ru: "3) Сравни оба итога." },
    ],
  },
};

function pickLocalized(text: LocalizedText, lang: Language): string {
  return text[lang] ?? text.es;
}

export function getRuleMicro(params: {
  skillTag?: string;
  templateId?: string;
  lang: Language;
}): { title: string; steps: string[] } {
  const bySkill = params.skillTag ? RULES_BY_SKILL[params.skillTag] : undefined;
  const byTemplate = params.templateId ? RULES_BY_TEMPLATE[params.templateId] : undefined;
  const pack = bySkill ?? byTemplate ?? DEFAULT_RULE;
  return {
    title: pickLocalized(pack.title, params.lang),
    steps: pack.steps.map((step) => pickLocalized(step, params.lang)),
  };
}
