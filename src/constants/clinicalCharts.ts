/**
 * Official chart ranges — match Growth Card PDF (R7) printed graphs.
 * VA LogMAR table; SE +1.00 … −5.00 (0.25); AL 20 … 30 (0.50); Age 2 … 18.
 */

/** Visual Acuity (m) → LogMAR (exact clinical table) */
export const VA_LOGMAR_TABLE: { snellen: string; denom: number; logmar: number }[] = [
  { snellen: '6/60', denom: 60, logmar: 1.0 },
  { snellen: '6/48', denom: 48, logmar: 0.9 },
  { snellen: '6/38', denom: 38, logmar: 0.8 },
  { snellen: '6/30', denom: 30, logmar: 0.7 },
  { snellen: '6/24', denom: 24, logmar: 0.6 },
  { snellen: '6/19', denom: 19, logmar: 0.5 },
  { snellen: '6/15', denom: 15, logmar: 0.4 },
  { snellen: '6/12', denom: 12, logmar: 0.3 },
  { snellen: '6/9.5', denom: 9.5, logmar: 0.2 },
  { snellen: '6/7.5', denom: 7.5, logmar: 0.1 },
  { snellen: '6/6', denom: 6, logmar: 0.0 },
  { snellen: '6/4.8', denom: 4.8, logmar: -0.1 },
  { snellen: '6/3.8', denom: 3.8, logmar: -0.2 },
  { snellen: '6/3', denom: 3, logmar: -0.3 },
];

export const USUAL_VA_DENOMS = VA_LOGMAR_TABLE.map(r => r.denom);

/** Fixed axes — same as PDF template */
export const AGE_MIN = 2;
export const AGE_MAX = 18;
export const SE_MIN = -5;
export const SE_MAX = 1;
export const SE_TICK_STEP = 0.25;
export const AL_MIN = 20;
export const AL_MAX = 30;
export const AL_TICK_STEP = 0.5;
export const VA_LOGMAR_MIN = -0.3;
export const VA_LOGMAR_MAX = 1.0;
/** Allowed Snellen denominator range for typed VA (6/3 … 6/60). */
export const VA_DENOM_MIN = 3;
export const VA_DENOM_MAX = 60;

/** Common clinic shorthand → official table denom (e.g. 6/9 → 6/9.5) for plotting only */
const VA_DENOM_ALIASES: Record<string, number> = {
  '9': 9.5,
};

export function parseSnellen(raw: unknown): { snellen: string; denom: number } | null {
  const m = String(raw ?? '')
    .trim()
    .match(/^6\/(\d+(?:\.\d+)?)$/);
  if (!m) return null;
  const denom = Number(m[1]);
  if (!Number.isFinite(denom) || denom <= 0) return null;
  return { snellen: `6/${m[1]}`, denom };
}

/**
 * Any Snellen 6/x with denominator from 6/3 (best) through 6/60 (worst).
 * Accepts table values and free typing (e.g. 6/9, 6/18, 6/36).
 */
export function isValidVa(value: string): boolean {
  const parsed = parseSnellen(value);
  if (!parsed) return false;
  return parsed.denom >= VA_DENOM_MIN - 1e-9 && parsed.denom <= VA_DENOM_MAX + 1e-9;
}

/** Keep typed denom; only trims / normalizes `6/…` form. */
export function formatVa(raw: unknown): string | null {
  const parsed = parseSnellen(raw);
  if (!parsed) return null;
  if (parsed.denom < VA_DENOM_MIN - 1e-9 || parsed.denom > VA_DENOM_MAX + 1e-9) {
    return null;
  }
  return parsed.snellen;
}

/** Map typed VA onto the official table row when possible (aliases + exact). */
export function resolveUsualVa(
  raw: unknown,
): { snellen: string; denom: number; logmar: number } | null {
  const parsed = parseSnellen(raw);
  if (!parsed) return null;
  const aliasKey = String(parsed.denom);
  const denom = VA_DENOM_ALIASES[aliasKey] ?? parsed.denom;
  const hit = VA_LOGMAR_TABLE.find(r => Math.abs(r.denom - denom) < 0.001);
  if (!hit) return null;
  return { snellen: hit.snellen, denom: hit.denom, logmar: hit.logmar };
}

/** Canonical usual VA string, or null if not in the official list / aliases. */
export function normalizeUsualVa(raw: unknown): string | null {
  const row = resolveUsualVa(raw);
  return row ? row.snellen : null;
}

export function snellenToLogmar(raw: unknown): number | null {
  const resolved = resolveUsualVa(raw);
  if (resolved) return resolved.logmar;
  const parsed = parseSnellen(raw);
  if (!parsed) return null;
  return Math.log10(parsed.denom / 6);
}

export function nearestVaRow(logmar: number) {
  let best = VA_LOGMAR_TABLE[0];
  let bestDiff = Infinity;
  for (const row of VA_LOGMAR_TABLE) {
    const diff = Math.abs(row.logmar - logmar);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = row;
    }
  }
  return best;
}

/** Axis / point label: "6/6 (0.00)" */
export function formatVaLogmarLabel(logmar: number) {
  const row = nearestVaRow(logmar);
  const lm = row.logmar.toFixed(2);
  return `${row.snellen} (${lm})`;
}

/** Official chart-table VA only (kept for reference / plotting helpers). */
export function isValidUsualVa(value: string) {
  return resolveUsualVa(value) != null;
}

export function parseClinicalNumber(raw: unknown): number | null {
  const n = Number(String(raw ?? '').trim().replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : null;
}

export function isValidAge(value: unknown): boolean {
  const n = Number(String(value ?? '').trim());
  return Number.isInteger(n) && n >= AGE_MIN && n <= AGE_MAX;
}

export function isValidSe(value: string): boolean {
  const n = parseClinicalNumber(value);
  if (n == null) return false;
  // Allow any value in graph range (0.25 steps preferred but not required for decimals like -2.60)
  return n >= SE_MIN - 1e-9 && n <= SE_MAX + 1e-9;
}

export function isValidAl(value: string): boolean {
  const n = parseClinicalNumber(value);
  if (n == null) return false;
  return n >= AL_MIN - 1e-9 && n <= AL_MAX + 1e-9;
}

/** Build ticks on a fixed step between inclusive bounds. */
export function rangeTicks(min: number, max: number, step: number) {
  const ticks: number[] = [];
  for (let v = min; v <= max + step * 0.001; v = Number((v + step).toFixed(6))) {
    ticks.push(Number(v.toFixed(6)));
  }
  return ticks;
}

/** Thin a tick list evenly to at most maxTicks (keeps ends). */
export function thinTicks(ticks: number[], maxTicks: number) {
  if (ticks.length <= maxTicks) return ticks;
  const out: number[] = [];
  const last = ticks.length - 1;
  for (let i = 0; i < maxTicks; i++) {
    out.push(ticks[Math.round((i * last) / (maxTicks - 1))]);
  }
  return [...new Set(out)];
}

/** Build ticks on a fixed step, covering data with one step of padding. */
export function steppedTicks(min: number, max: number, step: number, maxTicks = 8) {
  const lo = Math.floor((min - step) / step) * step;
  const hi = Math.ceil((max + step) / step) * step;
  const ticks = rangeTicks(lo, hi, step);
  return thinTicks(ticks, maxTicks);
}
