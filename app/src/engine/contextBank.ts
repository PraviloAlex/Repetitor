import type { LocalizedText } from "../i18n/types";

export type ProblemTheme =
  | "panini"
  | "football"
  | "stadium"
  | "minecraft"
  | "building"
  | "shop"
  | "worldcup";

export type StoryTemplateId =
  | "fraction-of-number"
  | "fraction-of-number-remainder"
  | "fraction-add-diff-den"
  | "fraction-sub-diff-den"
  | "fraction-word-add"
  | "discount-price"
  | "discount-amount"
  | "discount-budget"
  | "discount-leftover-money"
  | "compare-discounts"
  | "double-discount"
  | "reverse-discount";

export type ContextScenario = {
  id: string;
  antiRepeatKey: string;
  label: LocalizedText;
  templates: StoryTemplateId[];
  patterns: Partial<Record<StoryTemplateId, LocalizedText[]>>;
};

export type ContextEntry = {
  weight: number;
  locale: "es-AR";
  nouns: string[];
  verbs: string[];
  scenarios: ContextScenario[];
  templates: StoryTemplateId[];
  fractionTemplates: StoryTemplateId[];
  discountTemplates: StoryTemplateId[];
  areaTemplates: string[];
  perimeterTemplates: string[];
  percentageTemplates: string[];
  numericConstraints: Record<string, { min?: number; max?: number; values?: number[] }>;
  difficultyModifiers: {
    easy: string;
    medium: string;
    hard: string;
  };
  antiRepeatKeys: string[];
};

const P = (es: string, ru: string): LocalizedText => ({ es, ru });

function mergeTemplates(entry: Omit<ContextEntry, "templates">): ContextEntry {
  const templates = Array.from(
    new Set([...entry.fractionTemplates, ...entry.discountTemplates])
  );
  return { ...entry, templates };
}

export const CONTEXT_BANK: Record<ProblemTheme, ContextEntry> = {
  football: mergeTemplates({
    weight: 20,
    locale: "es-AR",
    nouns: ["partido", "tribuna", "hinchas", "entrada", "arco"],
    verbs: ["ocupar", "alentar", "convertir", "comprar"],
    fractionTemplates: ["fraction-of-number", "fraction-of-number-remainder", "fraction-sub-diff-den"],
    discountTemplates: ["discount-price", "discount-budget", "discount-leftover-money", "compare-discounts", "reverse-discount"],
    areaTemplates: ["banner_area"],
    perimeterTemplates: ["fan_zone_perimeter"],
    percentageTemplates: ["shot_accuracy", "seat_occupancy"],
    numericConstraints: {
      seats: { min: 1000, max: 84000 },
      ticketPrices: { min: 4000, max: 15000 },
      percentages: { values: [25, 50, 75, 80] },
    },
    difficultyModifiers: {
      easy: "Respuesta corta.",
      medium: "Piensa en parte y total.",
      hard: "Valida el resultado con contexto de partido.",
    },
    antiRepeatKeys: ["football.ticket", "football.stands", "football.fans"],
    scenarios: [
      {
        id: "football-child-ticket",
        antiRepeatKey: "football.ticket",
        label: P("Entradas infantiles", "Детские билеты"),
        templates: ["discount-price", "discount-budget", "discount-leftover-money", "reverse-discount"],
        patterns: {
          "discount-price": [P("La entrada infantil costaba ${amount}. Con ${pct}% de descuento, cuanto se paga ahora?", "Детский билет стоил ${amount}. Со скидкой ${pct}% сколько платят сейчас?")],
        },
      },
      {
        id: "football-stands",
        antiRepeatKey: "football.stands",
        label: P("Ocupacion de tribuna", "Заполняемость трибуны"),
        templates: ["fraction-of-number", "fraction-of-number-remainder", "fraction-sub-diff-den"],
        patterns: {
          "fraction-of-number": [P("En una tribuna hay ${total} lugares y se ocupa ${fraction}. Cuantos lugares son?", "На трибуне ${total} мест, занято ${fraction}. Сколько это мест?")],
        },
      },
      {
        id: "football-fan-zone",
        antiRepeatKey: "football.fans",
        label: P("Fan zone", "Фан-зона"),
        templates: ["fraction-of-number", "fraction-of-number-remainder"],
        patterns: {},
      },
    ],
  }),
  panini: mergeTemplates({
    weight: 20,
    locale: "es-AR",
    nouns: ["pack", "figuritas", "album", "repetidas", "raras"],
    verbs: ["abrir", "cambiar", "completar", "coleccionar"],
    fractionTemplates: [
      "fraction-of-number",
      "fraction-of-number-remainder",
      "fraction-add-diff-den",
      "fraction-word-add",
    ],
    discountTemplates: [
      "discount-price",
      "discount-amount",
      "discount-budget",
      "discount-leftover-money",
      "compare-discounts",
      "double-discount",
      "reverse-discount",
    ],
    areaTemplates: ["album_page_area"],
    perimeterTemplates: ["sticker_border_perimeter"],
    percentageTemplates: ["rare_sticker_percentage"],
    numericConstraints: {
      stickerPackPrice: { min: 2000, max: 2500 },
      packSize: { values: [10] },
      albumPrice: { min: 6000, max: 12000 },
      discounts: { values: [10, 15, 20, 25, 30, 50] },
    },
    difficultyModifiers: {
      easy: "Cuenta de figuritas directa.",
      medium: "Relaciona avance y total.",
      hard: "Compara ofertas por precio final.",
    },
    antiRepeatKeys: ["panini.pack", "panini.album", "panini.promo"],
    scenarios: [
      {
        id: "panini-pack",
        antiRepeatKey: "panini.pack",
        label: P("Packs y figuritas", "Паки и наклейки"),
        templates: ["fraction-of-number", "fraction-of-number-remainder", "discount-price", "discount-amount"],
        patterns: {
          "fraction-of-number": [P("En un pack hay ${total} figuritas y ${fraction} son de seleccionados. Cuantas figuritas son?", "В паке ${total} наклеек, и ${fraction} — это игроки сборных. Сколько это наклеек?")],
        },
      },
      {
        id: "panini-album",
        antiRepeatKey: "panini.album",
        label: P("Completar album", "Заполнение альбома"),
        templates: ["fraction-add-diff-den", "fraction-word-add", "compare-discounts", "double-discount", "reverse-discount"],
        patterns: {},
      },
    ],
  }),
  minecraft: mergeTemplates({
    weight: 18,
    locale: "es-AR",
    nouns: ["bloques", "pared", "cofre", "diamantes", "granja"],
    verbs: ["construir", "apilar", "minar", "mejorar"],
    fractionTemplates: ["fraction-of-number", "fraction-add-diff-den", "fraction-word-add"],
    discountTemplates: ["discount-price", "discount-amount"],
    areaTemplates: ["floor_area"],
    perimeterTemplates: ["farm_perimeter"],
    percentageTemplates: ["completed_build_percentage"],
    numericConstraints: {
      blocks: { min: 20, max: 120 },
      minecraftCoins: { min: 100, max: 1000 },
      discounts: { values: [10, 15, 20, 25, 30, 50] },
    },
    difficultyModifiers: {
      easy: "Cuenta de bloques directa.",
      medium: "Conecta parte y total.",
      hard: "Relaciona construccion y costo.",
    },
    antiRepeatKeys: ["minecraft.wall", "minecraft.shop"],
    scenarios: [
      {
        id: "minecraft-wall",
        antiRepeatKey: "minecraft.wall",
        label: P("Construccion de muro", "Строительство стены"),
        templates: ["fraction-of-number", "fraction-add-diff-den", "fraction-word-add"],
        patterns: {},
      },
      {
        id: "minecraft-shop",
        antiRepeatKey: "minecraft.shop",
        label: P("Tienda del servidor", "Магазин сервера"),
        templates: ["discount-price", "discount-amount"],
        patterns: {},
      },
    ],
  }),
  stadium: mergeTemplates({
    weight: 14,
    locale: "es-AR",
    nouns: ["Estadio Monumental", "La Bombonera", "Estadio Jose Amalfitani", "El Cilindro", "Nuevo Gasometro"],
    verbs: ["ocupar", "llenar", "liberar", "descontar", "medir"],
    fractionTemplates: [
      "fraction-of-number",
      "fraction-of-number-remainder",
      "fraction-add-diff-den",
      "fraction-sub-diff-den",
      "fraction-word-add",
    ],
    discountTemplates: [
      "discount-price",
      "discount-amount",
      "discount-budget",
      "discount-leftover-money",
      "compare-discounts",
      "reverse-discount",
    ],
    areaTemplates: ["banner_area", "field_area", "sector_area"],
    perimeterTemplates: ["training_zone_perimeter", "fan_zone_perimeter", "banner_perimeter"],
    percentageTemplates: ["seat_occupancy", "seat_free_percentage", "ticket_discount_percentage"],
    numericConstraints: {
      seats: { min: 1000, max: 84000 },
      sections: { values: [4, 5, 8, 10] },
      percentages: { values: [25, 50, 75, 80] },
      ticketPrices: { min: 4000, max: 15000 },
      dimensions: { min: 5, max: 120 },
    },
    difficultyModifiers: {
      easy: "Sector y cuenta corta.",
      medium: "Incluye ocupados y libres.",
      hard: "Combina porcentaje con decision de compra.",
    },
    antiRepeatKeys: [
      "stadium.capacity",
      "stadium.child_ticket_discount",
      "stadium.section_ticket_discount",
      "stadium.family_tickets_discount",
      "stadium.fan_zone",
      "stadium.rows",
      "stadium.gates",
      "stadium.sector_mix",
      "stadium.child_ticket",
      "stadium.free_seats",
    ],
    scenarios: [
      {
        id: "stadium-capacity-sector",
        antiRepeatKey: "stadium.capacity",
        label: P("Sector ocupado", "Заполненный сектор"),
        templates: ["fraction-of-number", "fraction-of-number-remainder"],
        patterns: {
          "fraction-of-number": [
            P("En La Bombonera hay un sector de ${total} lugares y se ocupa ${fraction}. Cuantos lugares estan ocupados?", "На La Bombonera есть сектор на ${total} мест, занято ${fraction}. Сколько мест занято?"),
          ],
          "fraction-of-number-remainder": [
            P("En el sector visitante hay ${total} lugares y se ocupa ${fraction}. Cuantos quedan libres?", "В гостевом секторе ${total} мест, занято ${fraction}. Сколько осталось свободно?"),
          ],
        },
      },
      {
        id: "stadium-monumental-ticket",
        antiRepeatKey: "stadium.child_ticket_discount",
        label: P("Entrada Monumental", "Билет на Monumental"),
        templates: ["discount-price", "discount-amount", "reverse-discount"],
        patterns: {
          "discount-price": [
            P("Entrada infantil en ${stadiumName}: ${amount} ARS. Hoy hay ${pct}% de descuento. Cuanto pagas?", "Р”РµС‚СЃРєРёР№ Р±РёР»РµС‚ РЅР° ${stadiumName}: ${amount} ARS. РЎРµРіРѕРґРЅСЏ СЃРєРёРґРєР° ${pct}%. РЎРєРѕР»СЊРєРѕ РїР»Р°С‚РёС€СЊ?"),
          ],
          "discount-amount": [
            P("En ${stadiumName}, entrada infantil ${amount} ARS con ${pct}% off. Cuanto ahorras?", "Р’ ${stadiumName} РґРµС‚СЃРєРёР№ Р±РёР»РµС‚ ${amount} ARS СЃРѕ СЃРєРёРґРєРѕР№ ${pct}%. РЎРєРѕР»СЊРєРѕ СЌРєРѕРЅРѕРјРёС€СЊ?"),
          ],
          "reverse-discount": [
            P("En ${stadiumName}, pagaste ${finalPrice} ARS por entrada infantil despues de ${pct}% de descuento. Precio original?", "Р’ ${stadiumName} Р·Р° РґРµС‚СЃРєРёР№ Р±РёР»РµС‚ Р·Р°РїР»Р°С‚РёР»Рё ${finalPrice} ARS РїРѕСЃР»Рµ СЃРєРёРґРєРё ${pct}%. РСЃС…РѕРґРЅР°СЏ С†РµРЅР°?"),
          ],
        },
      },
      {
        id: "stadium-fan-zone",
        antiRepeatKey: "stadium.fan_zone",
        label: P("Fan zone", "Фан-зона"),
        templates: ["fraction-word-add", "fraction-of-number"],
        patterns: {},
      },
      {
        id: "stadium-training-perimeter",
        antiRepeatKey: "stadium.family_tickets_discount",
        label: P("Perimetro de entrenamiento", "Периметр трензоны"),
        templates: ["fraction-sub-diff-den", "discount-budget"],
        patterns: {
          "discount-budget": [
            P("Familia: 3 entradas infantiles para ${stadiumName}. Cada una vale ${price} ARS, descuento ${pct}%. Con ${budget} ARS alcanza?", "РЎРµРјСЊСЏ: 3 РґРµС‚СЃРєРёС… Р±РёР»РµС‚Р° РЅР° ${stadiumName}. РљР°Р¶РґС‹Р№ ${price} ARS, СЃРєРёРґРєР° ${pct}%. РҐРІР°С‚РёС‚ Р»Рё ${budget} ARS?"),
          ],
        },
      },
      {
        id: "stadium-banner-area",
        antiRepeatKey: "stadium.section_ticket_discount",
        label: P("Banner de hinchada", "Баннер болельщиков"),
        templates: ["fraction-add-diff-den", "discount-leftover-money"],
        patterns: {
          "discount-leftover-money": [
            P("Fan sector en ${stadiumName}: entrada infantil ${price} ARS. Con ${pct}% de descuento y ${budget} ARS, cuanto te sobra?", "Р¤Р°РЅ-СЃРµРєС‚РѕСЂ РЅР° ${stadiumName}: РґРµС‚СЃРєРёР№ Р±РёР»РµС‚ ${price} ARS. РЎРѕ СЃРєРёРґРєРѕР№ ${pct}% Рё ${budget} ARS СЃРєРѕР»СЊРєРѕ РѕСЃС‚Р°РЅРµС‚СЃСЏ?"),
          ],
        },
      },
      {
        id: "stadium-rows-seats",
        antiRepeatKey: "stadium.rows",
        label: P("Filas y butacas", "Ряды и места"),
        templates: ["fraction-of-number", "compare-discounts"],
        patterns: {},
      },
      {
        id: "stadium-gate-flow",
        antiRepeatKey: "stadium.gates",
        label: P("Ingreso por puertas", "Вход через ворота"),
        templates: ["fraction-of-number-remainder", "discount-budget"],
        patterns: {},
      },
      {
        id: "stadium-sector-mix",
        antiRepeatKey: "stadium.sector_mix",
        label: P("Mezcla de sectores", "Смешанные секторы"),
        templates: ["fraction-add-diff-den", "fraction-word-add", "compare-discounts"],
        patterns: {},
      },
      {
        id: "stadium-child-ticket",
        antiRepeatKey: "stadium.child_ticket_discount",
        label: P("Entrada infantil", "Детский билет"),
        templates: ["discount-price", "discount-leftover-money", "discount-amount"],
        patterns: {},
      },
      {
        id: "stadium-free-seats",
        antiRepeatKey: "stadium.free_seats",
        label: P("Asientos libres", "Свободные места"),
        templates: ["fraction-of-number-remainder", "fraction-sub-diff-den"],
        patterns: {},
      },
    ],
  }),
  worldcup: mergeTemplates({
    weight: 14,
    locale: "es-AR",
    nouns: ["seleccion argentina", "grupo", "final", "arco", "hinchada"],
    verbs: ["patear", "convertir", "sumar", "clasificar", "ahorrar"],
    fractionTemplates: [
      "fraction-of-number",
      "fraction-of-number-remainder",
      "fraction-add-diff-den",
      "fraction-sub-diff-den",
      "fraction-word-add",
    ],
    discountTemplates: [
      "discount-price",
      "discount-amount",
      "discount-leftover-money",
      "discount-budget",
      "compare-discounts",
      "reverse-discount",
    ],
    areaTemplates: ["training_banner_area", "fan_sector_area"],
    perimeterTemplates: ["training_zone_perimeter", "warmup_field_perimeter"],
    percentageTemplates: ["shot_accuracy", "group_points_percentage", "fans_shirt_percentage"],
    numericConstraints: {
      shots: { values: [6, 8, 10, 12, 15, 20] },
      goals: { min: 1, max: 8 },
      groupPoints: { values: [3, 4, 6, 7, 9] },
      fans: { min: 10000, max: 80000 },
      percentages: { values: [10, 20, 25, 50, 75] },
      ticketPrices: { min: 5000, max: 20000 },
    },
    difficultyModifiers: {
      easy: "Situacion corta de partido.",
      medium: "Una accion y una conclusion.",
      hard: "Micro-escenario de torneo con decision final.",
    },
    antiRepeatKeys: [
      "worldcup.shots_fraction",
      "worldcup.group_points",
      "worldcup.fans_percentage",
      "worldcup.final_ticket",
      "worldcup.training",
      "worldcup.goals_share",
      "worldcup.saves",
      "worldcup.playoff",
      "worldcup.match_collection",
      "worldcup.kids_discount",
    ],
    scenarios: [
      {
        id: "worldcup-shots",
        antiRepeatKey: "worldcup.shots_fraction",
        label: P("Tiros al arco", "Удары по воротам"),
        templates: ["fraction-of-number", "fraction-of-number-remainder"],
        patterns: {
          "fraction-of-number": [P("Argentina hizo ${total} tiros y ${fraction} fueron al arco. Cuantos tiros al arco fueron?", "Аргентина нанесла ${total} ударов, и ${fraction} были в створ. Сколько ударов в створ?")],
        },
      },
      {
        id: "worldcup-group-points",
        antiRepeatKey: "worldcup.group_points",
        label: P("Puntos de grupo", "Очки в группе"),
        templates: ["fraction-of-number", "fraction-word-add", "fraction-add-diff-den"],
        patterns: {},
      },
      {
        id: "worldcup-fans-shirts",
        antiRepeatKey: "worldcup.fans_percentage",
        label: P("Hinchas con camiseta", "Болельщики в футболках"),
        templates: ["fraction-of-number", "fraction-of-number-remainder"],
        patterns: {},
      },
      {
        id: "worldcup-final-ticket",
        antiRepeatKey: "worldcup.final_ticket",
        label: P("Ticket de final", "Билет на финал"),
        templates: ["discount-price", "discount-amount", "reverse-discount"],
        patterns: {},
      },
      {
        id: "worldcup-training",
        antiRepeatKey: "worldcup.training",
        label: P("Entrenamiento previo", "Тренировка перед матчем"),
        templates: ["fraction-of-number", "fraction-of-number-remainder", "discount-budget"],
        patterns: {},
      },
      {
        id: "worldcup-goals-share",
        antiRepeatKey: "worldcup.goals_share",
        label: P("Participacion en goles", "Доля голов"),
        templates: ["fraction-sub-diff-den", "fraction-word-add"],
        patterns: {},
      },
      {
        id: "worldcup-saves",
        antiRepeatKey: "worldcup.saves",
        label: P("Atajadas", "Сейвы"),
        templates: ["fraction-of-number", "fraction-of-number-remainder"],
        patterns: {},
      },
      {
        id: "worldcup-playoff",
        antiRepeatKey: "worldcup.playoff",
        label: P("Llave de playoff", "Сетка плей-офф"),
        templates: ["compare-discounts", "discount-leftover-money"],
        patterns: {},
      },
      {
        id: "worldcup-match-collection",
        antiRepeatKey: "worldcup.match_collection",
        label: P("Coleccion de partidos", "Коллекция матчей"),
        templates: ["fraction-add-diff-den", "fraction-word-add"],
        patterns: {},
      },
      {
        id: "worldcup-kids-discount",
        antiRepeatKey: "worldcup.kids_discount",
        label: P("Descuento para chicos", "Скидка для детей"),
        templates: ["discount-price", "discount-budget", "discount-leftover-money"],
        patterns: {},
      },
    ],
  }),
  shop: mergeTemplates({
    weight: 14,
    locale: "es-AR",
    nouns: ["kiosco de figuritas", "tienda de futbol", "tienda gamer", "promo", "combo"],
    verbs: ["comprar", "ahorrar", "comparar", "canjear", "pagar"],
    fractionTemplates: [
      "fraction-of-number",
      "fraction-of-number-remainder",
      "fraction-add-diff-den",
      "fraction-word-add",
    ],
    discountTemplates: [
      "discount-price",
      "discount-amount",
      "discount-budget",
      "discount-leftover-money",
      "compare-discounts",
      "double-discount",
      "reverse-discount",
    ],
    areaTemplates: ["vidriera_area", "poster_area"],
    perimeterTemplates: ["vidriera_perimeter", "stand_perimeter"],
    percentageTemplates: ["rare_cards_percentage", "promo_percentage"],
    numericConstraints: {
      stickerPackPrice: { min: 2000, max: 2500 },
      albumPrice: { min: 6000, max: 12000 },
      ballPrice: { min: 10000, max: 25000 },
      minecraftCoins: { min: 100, max: 1000 },
      discounts: { values: [10, 15, 20, 25, 30, 50] },
      packSize: { values: [10] },
    },
    difficultyModifiers: {
      easy: "Compra simple.",
      medium: "Incluye comparacion o ahorro.",
      hard: "Promos combinadas con chequeo final.",
    },
    antiRepeatKeys: [
      "shop.panini_discount",
      "shop.album_promo",
      "shop.ball_sale",
      "shop.minecraft_coins",
      "shop.combo_purchase",
      "shop.compare_offers",
      "shop.kids_ticket_style",
      "shop.rare_pack",
      "shop.reverse_promo",
      "shop.double_promo",
    ],
    scenarios: [
      {
        id: "shop-panini-discount",
        antiRepeatKey: "shop.panini_discount",
        label: P("Pack Panini", "Пак Panini"),
        templates: ["discount-price", "discount-amount", "discount-leftover-money"],
        patterns: {
          "discount-price": [P("Un pack de figuritas costaba ${amount} y hoy tiene ${pct}% de descuento. Cuanto cuesta ahora?", "Пак наклеек стоил ${amount}, сегодня скидка ${pct}%. Сколько стоит сейчас?")],
        },
      },
      {
        id: "shop-album-promo",
        antiRepeatKey: "shop.album_promo",
        label: P("Album con promo", "Альбом по промокоду"),
        templates: ["discount-price", "reverse-discount", "discount-amount"],
        patterns: {},
      },
      {
        id: "shop-ball-sale",
        antiRepeatKey: "shop.ball_sale",
        label: P("Pelota en oferta", "Мяч по акции"),
        templates: ["discount-price", "discount-budget", "discount-leftover-money"],
        patterns: {},
      },
      {
        id: "shop-minecraft-coins",
        antiRepeatKey: "shop.minecraft_coins",
        label: P("Set Minecraft", "Minecraft-набор"),
        templates: ["discount-price", "discount-amount", "double-discount"],
        patterns: {},
      },
      {
        id: "shop-combo-purchase",
        antiRepeatKey: "shop.combo_purchase",
        label: P("Compra combo", "Покупка комбо"),
        templates: ["discount-budget", "discount-leftover-money", "compare-discounts"],
        patterns: {},
      },
      {
        id: "shop-compare-offers",
        antiRepeatKey: "shop.compare_offers",
        label: P("Comparar promociones", "Сравнение акций"),
        templates: ["compare-discounts", "discount-price"],
        patterns: {},
      },
      {
        id: "shop-kids-style",
        antiRepeatKey: "shop.kids_ticket_style",
        label: P("Promo para chicos", "Детская акция"),
        templates: ["discount-price", "discount-amount"],
        patterns: {},
      },
      {
        id: "shop-rare-pack",
        antiRepeatKey: "shop.rare_pack",
        label: P("Packs raros", "Редкие паки"),
        templates: ["fraction-of-number", "fraction-of-number-remainder"],
        patterns: {},
      },
      {
        id: "shop-reverse-promo",
        antiRepeatKey: "shop.reverse_promo",
        label: P("Precio antes de promo", "Цена до акции"),
        templates: ["reverse-discount", "discount-price"],
        patterns: {},
      },
      {
        id: "shop-double-promo",
        antiRepeatKey: "shop.double_promo",
        label: P("Doble promo", "Двойная скидка"),
        templates: ["double-discount", "discount-budget"],
        patterns: {},
      },
    ],
  }),
  building: mergeTemplates({
    weight: 8,
    locale: "es-AR",
    nouns: ["ladrillos", "pared", "ventanas", "pisos"],
    verbs: ["colocar", "armar", "medir"],
    fractionTemplates: ["fraction-of-number", "fraction-add-diff-den"],
    discountTemplates: ["discount-price"],
    areaTemplates: ["wall_area"],
    perimeterTemplates: ["wall_perimeter"],
    percentageTemplates: ["completion_percentage"],
    numericConstraints: { bricks: { min: 20, max: 200 } },
    difficultyModifiers: {
      easy: "Historia corta de obra.",
      medium: "Dos acciones seguidas.",
      hard: "Combina avance y compra.",
    },
    antiRepeatKeys: ["building.wall"],
    scenarios: [
      {
        id: "building-wall",
        antiRepeatKey: "building.wall",
        label: P("Muro por etapas", "Этапы стены"),
        templates: ["fraction-of-number", "fraction-add-diff-den"],
        patterns: {},
      },
    ],
  }),
};

export const CONTEXT_THEMES = Object.keys(CONTEXT_BANK) as ProblemTheme[];
