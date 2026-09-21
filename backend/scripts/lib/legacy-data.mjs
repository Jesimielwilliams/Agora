/**
 * Reads the bundled js/data.js and hands back the AGORA_DATA object.
 *
 * data.js is a plain assignment to window, so it can be evaluated in a stub
 * context rather than parsed. That keeps one source of truth during the
 * migration: the seed and the snapshot both work from the same file the site
 * already ships.
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

export function loadLegacyData(path = resolve(here, '../../../js/data.js')) {
  const source = readFileSync(path, 'utf8');
  const sandbox = {};

  // eslint-disable-next-line no-new-func
  const evaluate = new Function('window', `${source}\nreturn window.AGORA_DATA;`);
  const data = evaluate(sandbox);

  if (!data || !Array.isArray(data.incidents)) {
    throw new Error(`Could not read AGORA_DATA from ${path}`);
  }

  return data;
}

/**
 * "25 Feb 2023 · 13:10 WAT" -> ISO timestamp.
 *
 * The bundled records are written for people, not machines. WAT is UTC+1 and
 * carries no daylight saving, so the offset is a constant.
 */
export function parseRecordTimestamp(value) {
  if (!value) return null;

  const text = String(value);
  const date = text.match(/(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})/);
  if (!date) return null;

  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const month = months.indexOf(date[2].slice(0, 3).toLowerCase());
  if (month < 0) return null;

  const time = text.match(/(\d{1,2}):(\d{2})/);
  const hours = time ? Number(time[1]) : 12;
  const minutes = time ? Number(time[2]) : 0;

  const isUtc = /UTC/i.test(text);
  const offset = isUtc ? 0 : 1; // WAT

  return new Date(Date.UTC(
    Number(date[3]), month, Number(date[1]),
    hours - offset, minutes
  )).toISOString();
}

/** '93.4M' / '1,303' -> number. Returns null for anything unparseable. */
export function parseCount(value) {
  if (value == null) return null;
  const text = String(value).trim();

  const scaled = text.match(/^([\d.]+)\s*([MK])$/i);
  if (scaled) {
    const factor = scaled[2].toUpperCase() === 'M' ? 1e6 : 1e3;
    return Math.round(Number(scaled[1]) * factor);
  }

  const plain = Number(text.replace(/[,\s]/g, ''));
  return Number.isFinite(plain) ? plain : null;
}

export function parsePercent(value) {
  if (value == null) return null;
  const n = Number(String(value).replace('%', '').trim());
  return Number.isFinite(n) ? n : null;
}
