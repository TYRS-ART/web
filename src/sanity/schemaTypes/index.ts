import type { SchemaTypeDefinition } from "sanity";

import { course } from "./documents/course";
import { event } from "./documents/event";
import { person } from "./documents/person";
import { playlist } from "./documents/playlist";
import { rentalPage } from "./documents/rentalPage";
import { settings } from "./documents/settings";
import { space } from "./documents/space";
import { venuePage } from "./documents/venuePage";
import {
  localeBlockContent,
  localeHeroSentence,
  localeSlug,
  localeString,
  localeText,
} from "./objects/locale";

export const singletonTypes = new Set(["settings", "venuePage", "rentalPage"]);

export const schemaTypes: SchemaTypeDefinition[] = [
  localeString,
  localeText,
  localeBlockContent,
  localeHeroSentence,
  localeSlug,
  event,
  course,
  person,
  space,
  playlist,
  settings,
  venuePage,
  rentalPage,
];
