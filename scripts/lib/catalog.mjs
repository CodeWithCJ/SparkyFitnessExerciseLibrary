// Catalog ID rules for the Node scripts (validate, build, the media optimizer, the inspector).
// The rules are pure functions in catalog-rules.mjs, which the browser-based exercise generator
// imports as well; this file only loads taxonomy/catalog-codes.json and binds them to it.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCatalogRules } from './catalog-rules.mjs';

export {
  SLUG_MAX_LENGTH,
  MODEL_LETTERS,
  SLUG_PATTERN,
  capSlug,
  slugFromName,
  modelLetterOf,
  mediaNamePattern,
  mediaFileNames,
} from './catalog-rules.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export const codes = JSON.parse(fs.readFileSync(path.join(rootDir, 'taxonomy/catalog-codes.json'), 'utf8'));

export const {
  BODY_CODES,
  EQUIPMENT_CODES,
  ID_PATTERN,
  FOLDER_PATTERN,
  bodyCodeFor,
  equipmentCodeFor,
  idPrefixFor,
  nextCatalogId,
} = createCatalogRules(codes);
