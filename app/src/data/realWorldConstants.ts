export const REAL_WORLD_CONSTANTS = {
  version: "2026-05-24-v1",
  price_snapshot_date: "2026-05-24",
  source_note:
    "Argentina-first semi-real constants. Prices are local editable estimates; stadium capacities use rounded real-world values. Update once per quarter.",

  variationRules: {
    stadiumCapacityPercent: 5,
    productPricePercent: 15,
    roundingARS: 100,
    bigPriceRoundingARS: 500,
  },

  stadiums: {
    laBombonera: {
      name: "La Bombonera",
      officialName: "Estadio Alberto J. Armando",
      capacity_total: 50000,
      capacity_seated: 37538,
      child_ticket_price_ars: 8000,
      fan_zone_length_m: 80,
      fan_zone_width_m: 45,
      training_zone_length_m: 40,
      training_zone_width_m: 25,
    },

    estadioMonumental: {
      name: "Estadio Monumental",
      officialName: "Más Monumental",
      capacity_total: 84567,
      capacity_seated: 84567,
      child_ticket_price_ars: 9000,
      fan_zone_length_m: 100,
      fan_zone_width_m: 60,
      training_zone_length_m: 50,
      training_zone_width_m: 30,
    },

    joseAmalfitani: {
      name: "José Amalfitani",
      officialName: "Estadio José Amalfitani",
      capacity_total: 49500,
      capacity_seated: 49500,
      child_ticket_price_ars: 7000,
      fan_zone_length_m: 70,
      fan_zone_width_m: 40,
      training_zone_length_m: 38,
      training_zone_width_m: 24,
    },

    elCilindro: {
      name: "El Cilindro",
      officialName: "Estadio Presidente Perón",
      capacity_total: 51000,
      capacity_seated: 51000,
      child_ticket_price_ars: 7500,
      fan_zone_length_m: 75,
      fan_zone_width_m: 45,
      training_zone_length_m: 40,
      training_zone_width_m: 25,
    },

    nuevoGasometro: {
      name: "Nuevo Gasómetro",
      officialName: "Estadio Pedro Bidegain",
      capacity_total: 43500,
      capacity_seated: 43500,
      child_ticket_price_ars: 7000,
      fan_zone_length_m: 70,
      fan_zone_width_m: 42,
      training_zone_length_m: 38,
      training_zone_width_m: 24,
    },
  },

  panini: {
    pack_price_ars: 2500,
    stickers_per_pack: 10,
    album_price_ars: 9000,
    rare_per_pack_avg: {
      numerator: 1,
      denominator: 10,
      label: "1 rare sticker per 10 stickers on average",
    },
    promo_discounts: [10, 15, 20, 25, 30, 50],
  },

  shop: {
    football_ball_price_ars: 25000,
    jersey_price_ars: 30000,
    boots_price_ars: 80000,
    minecraft_set_price_coins: 400,

    combo_examples: [
      {
        id: "panini_starter",
        label: "Panini starter combo",
        items: ["album", "2 sticker packs"],
        price_ars: 14000,
      },
      {
        id: "match_day",
        label: "Match day combo",
        items: ["child ticket", "cola 500ml", "snack"],
        price_ars: 11500,
      },
      {
        id: "football_training",
        label: "Football training combo",
        items: ["ball", "jersey"],
        price_ars: 45000,
      },
    ],
  },

  worldcupFootball: {
    shots_per_match_min: 6,
    shots_per_match_max: 20,
    shots_on_target_min: 2,
    shots_on_target_max: 10,
    goals_min: 0,
    goals_max: 5,
    fans_min: 30000,
    fans_max: 85000,
    group_points_values: [0, 1, 3, 4, 6, 7, 9],
  },

  kiosk: {
    cola_500ml_price_ars: 2000,
    agua_500ml_price_ars: 1500,
    snack_price_ars: 3000,
    alfajor_price_ars: 1500,
  },
} as const;

export const REAL_WORLD_CONSTANTS_VERSION = REAL_WORLD_CONSTANTS.version;

export type RealWorldTheme =
  | "stadium"
  | "worldcup"
  | "football"
  | "panini"
  | "shop"
  | "minecraft"
  | "building";

export type RealWorldScenario =
  | "stadium_child_ticket_discount"
  | "stadium_family_tickets_discount"
  | "stadium_section_ticket_discount"
  | "stadium.capacity.bombonera"
  | "stadium.capacity.monumental"
  | "stadium.child_ticket.bombonera"
  | "stadium.child_ticket.monumental"
  | "stadium.child_ticket.amalfitani"
  | "stadium.child_ticket.cilindro"
  | "stadium.child_ticket.gasometro"
  | "panini.pack_price"
  | "shop.album_price"
  | "shop.football_ball_price"
  | "food.cola_500ml";

type ContextNumberInput = {
  theme: RealWorldTheme;
  scenario: RealWorldScenario;
  variationPercent?: number;
  rng?: () => number;
};

export type StadiumKey = keyof typeof REAL_WORLD_CONSTANTS.stadiums;
export const STADIUM_KEYS = Object.keys(REAL_WORLD_CONSTANTS.stadiums) as StadiumKey[];

function getBaseValue(scenario: RealWorldScenario): number {
  switch (scenario) {
    case "stadium.capacity.bombonera":
      return REAL_WORLD_CONSTANTS.stadiums.laBombonera.capacity_total;
    case "stadium.capacity.monumental":
      return REAL_WORLD_CONSTANTS.stadiums.estadioMonumental.capacity_total;
    case "stadium.child_ticket.bombonera":
      return REAL_WORLD_CONSTANTS.stadiums.laBombonera.child_ticket_price_ars;
    case "stadium.child_ticket.monumental":
      return REAL_WORLD_CONSTANTS.stadiums.estadioMonumental.child_ticket_price_ars;
    case "stadium.child_ticket.amalfitani":
      return REAL_WORLD_CONSTANTS.stadiums.joseAmalfitani.child_ticket_price_ars;
    case "stadium.child_ticket.cilindro":
      return REAL_WORLD_CONSTANTS.stadiums.elCilindro.child_ticket_price_ars;
    case "stadium.child_ticket.gasometro":
      return REAL_WORLD_CONSTANTS.stadiums.nuevoGasometro.child_ticket_price_ars;
    case "panini.pack_price":
      return REAL_WORLD_CONSTANTS.panini.pack_price_ars;
    case "shop.album_price":
      return REAL_WORLD_CONSTANTS.panini.album_price_ars;
    case "shop.football_ball_price":
      return REAL_WORLD_CONSTANTS.shop.football_ball_price_ars;
    case "food.cola_500ml":
      return REAL_WORLD_CONSTANTS.kiosk.cola_500ml_price_ars;
    default:
      return 1000;
  }
}

function roundByScenario(scenario: RealWorldScenario, value: number): number {
  if (scenario.startsWith("stadium.capacity")) {
    const step = REAL_WORLD_CONSTANTS.variationRules.bigPriceRoundingARS;
    return Math.round(value / step) * step;
  }
  const step = value >= 10000
    ? REAL_WORLD_CONSTANTS.variationRules.bigPriceRoundingARS
    : REAL_WORLD_CONSTANTS.variationRules.roundingARS;
  return Math.round(value / step) * step;
}

export function getContextNumber(input: ContextNumberInput): number {
  const base = getBaseValue(input.scenario);
  const rng = input.rng ?? Math.random;
  const defaultVariation = input.scenario.startsWith("stadium.capacity")
    ? REAL_WORLD_CONSTANTS.variationRules.stadiumCapacityPercent / 100
    : REAL_WORLD_CONSTANTS.variationRules.productPricePercent / 100;
  const variationPercent = Math.max(0.05, Math.min(0.15, input.variationPercent ?? defaultVariation));
  const delta = (rng() * 2 - 1) * variationPercent;
  const varied = base * (1 + delta);
  return Math.max(1, roundByScenario(input.scenario, varied));
}
