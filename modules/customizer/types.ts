export const CUSTOMIZER_MAX_GARMENTS_PER_SESSION = 4;
export const CUSTOMIZER_MAX_IMAGES_PER_SIDE = 2;
export const CUSTOMIZER_MAX_IMAGES_PER_GARMENT = 4;
export const CUSTOMIZER_MAX_NOTE_LENGTH = 300;

export type CustomizerViewSide = "front" | "back";
export type CustomizerVisualMode = "single" | "duo";

export type CustomizerElementBase = {
  id: string;
  assetId: string;
  xPct: number;
  yPct: number;
  scale: number;
  rotationDeg: number;
  createdAt: string;
};

export type CustomizerImageElement = CustomizerElementBase & {
  type: "image";
  src: string;
  fileName: string;
};

export type CustomizerTextElement = CustomizerElementBase & {
  type: "text";
  text: string;
  fontFamily: string;
  colorHex: string;
  fontSizePx: number;
  fontWeight: number;
};

export type CustomizerElement = CustomizerImageElement | CustomizerTextElement;

export type CustomizerSideState = {
  elements: CustomizerElement[];
};

export type CustomizerGarmentState = {
  id: string;
  label: string;
  garmentType: "tshirt";
  garmentModel: string;
  color: string;
  size: string;
  grammageG: number;
  fit: string;
  quantity: number;
  visualMode: CustomizerVisualMode;
  improveQuality: boolean;
  note: string;
  sides: {
    front: CustomizerSideState;
    back: CustomizerSideState;
  };
  createdAt: string;
  updatedAt: string;
};

export type CustomizerDesignSnapshot = {
  version: number;
  designId: string;
  title: string;
  garments: CustomizerGarmentState[];
  createdAt: string;
  updatedAt: string;
};

export type SavedCustomizerDesign = CustomizerDesignSnapshot & {
  ownerAccountId: string | null;
};

const DEFAULT_MODEL = "oversize";
const DEFAULT_COLOR = "Negra";
const DEFAULT_SIZE = "M";
const DEFAULT_GRAMMAGE = 240;
const DEFAULT_FIT = "oversize";

function uid(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createCustomizerElementAssetId(prefix: "img" | "txt"): string {
  return uid(prefix);
}

export function createNewGarment(index = 0): CustomizerGarmentState {
  const now = new Date().toISOString();
  const n = index + 1;
  return {
    id: uid("garment"),
    label: `Dise\u00f1o ${n}`,
    garmentType: "tshirt",
    garmentModel: DEFAULT_MODEL,
    color: DEFAULT_COLOR,
    size: DEFAULT_SIZE,
    grammageG: DEFAULT_GRAMMAGE,
    fit: DEFAULT_FIT,
    quantity: 1,
    visualMode: "single",
    improveQuality: false,
    note: "",
    sides: {
      front: { elements: [] },
      back: { elements: [] },
    },
    createdAt: now,
    updatedAt: now,
  };
}

export function createNewCustomizerDesign(
  title = "Mi dise\u00f1o personalizado"
): SavedCustomizerDesign {
  const now = new Date().toISOString();
  return {
    version: 1,
    designId: uid("design"),
    title,
    garments: [createNewGarment(0)],
    createdAt: now,
    updatedAt: now,
    ownerAccountId: null,
  };
}

export function countGarmentImages(garment: CustomizerGarmentState): {
  front: number;
  back: number;
  total: number;
} {
  const front = garment.sides.front.elements.filter(
    (element) => element.type === "image"
  ).length;
  const back = garment.sides.back.elements.filter(
    (element) => element.type === "image"
  ).length;
  return {
    front,
    back,
    total: front + back,
  };
}

