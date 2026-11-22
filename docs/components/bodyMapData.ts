/**
 * Shared data for the body map: which SVG region class is which catalog muscle, and the regions the
 * original figures do not draw.
 *
 * The figures (muscle-male.svg, muscle-female.svg) draw 13 of the 17 muscles in taxonomy/muscles.json.
 * Neck, middle back, abductors and adductors are added on top at load time as the shapes below, so
 * the original SVG files stay untouched. The shapes are approximate markers, not anatomy drawings.
 */
export const SVG_CLASS_TO_MUSCLE: Record<string, string> = {
  abdominal: 'abdominals',
  obliques: 'abdominals',
  lowerback: 'lower back',
  quads: 'quadriceps',
  biceps: 'biceps',
  calves: 'calves',
  chest: 'chest',
  forearms: 'forearms',
  glutes: 'glutes',
  hamstrings: 'hamstrings',
  lats: 'lats',
  shoulders: 'shoulders',
  traps: 'traps',
  triceps: 'triceps',
  // regions added by this file
  neck: 'neck',
  middleback: 'middle back',
  adductors: 'adductors',
  abductors: 'abductors',
};

let uidCounter = 0;
/** A number that is different for every body map drawn on the page, to keep SVG element ids unique. */
export const nextUid = () => String(++uidCounter);

/** Every muscle a person can click on the map. */
export const MAP_MUSCLES = new Set(Object.values(SVG_CLASS_TO_MUSCLE));

type Point = [number, number];
export interface ExtraRegion {
  cls: string;
  d: string;
}

/** A smooth closed path through the points (Catmull-Rom converted to cubic curves). */
function smooth(points: Point[]): string {
  const n = points.length;
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${p2[0]} ${p2[1]}`;
  }
  return `${d} Z`;
}

const mirror = (points: Point[], axis: number): Point[] =>
  points.map(([x, y]) => [2 * axis - x, y] as Point).reverse();

/** One region drawn on the left, and its mirror image across the figure's vertical axis. */
const pair = (cls: string, points: Point[], axis: number): ExtraRegion[] => [
  { cls, d: smooth(points) },
  { cls, d: smooth(mirror(points, axis)) },
];
const single = (cls: string, points: Point[]): ExtraRegion[] => [{ cls, d: smooth(points) }];

// Male figure: 535 wide. Front view is centered on x = 114, back view on x = 411.5.
const MALE_FRONT = 114;
const MALE_BACK = 411.5;
// Female figure: 475 wide. Front view is centered on x = 111, back view on x = 358.5.
const FEMALE_FRONT = 111;
const FEMALE_BACK = 358.5;

export const EXTRA_REGIONS: Record<'male' | 'female', ExtraRegion[]> = {
  male: [
    // front
    ...single('neck', [[102, 62], [126, 62], [130, 73], [124, 85], [104, 85], [98, 73]]),
    ...pair('adductors', [[100, 224], [110, 220], [110, 262], [104, 284], [98, 258]], MALE_FRONT),
    ...pair('abductors', [[66, 196], [78, 198], [80, 222], [76, 246], [68, 240], [64, 214]], MALE_FRONT),
    // back
    ...single('neck', [[401, 52], [422, 52], [426, 64], [420, 78], [403, 78], [397, 64]]),
    ...single('middleback', [[394, 98], [429, 98], [432, 120], [428, 142], [395, 142], [391, 120]]),
    ...pair('abductors', [[368, 190], [380, 188], [384, 208], [378, 230], [368, 224], [364, 206]], MALE_BACK),
  ],
  female: [
    // front
    ...single('neck', [[103, 88], [119, 88], [122, 98], [100, 98]]),
    ...pair('adductors', [[90, 218], [97, 214], [101, 240], [104, 282], [98, 284], [92, 250]], FEMALE_FRONT),
    ...pair('abductors', [[72, 196], [82, 198], [82, 222], [78, 244], [72, 238], [69, 216]], FEMALE_FRONT),
    // back
    ...single('neck', [[351, 96], [366, 96], [369, 108], [348, 108]]),
    ...single('middleback', [[341, 122], [376, 122], [378, 142], [374, 164], [343, 164], [339, 142]]),
    ...pair('abductors', [[320, 194], [330, 192], [334, 212], [328, 232], [320, 226], [317, 210]], FEMALE_BACK),
  ],
};
