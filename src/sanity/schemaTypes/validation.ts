import type { CustomValidator } from "sanity";

import { findPlaceholder } from "@/lib/placeholders";

type Localized = Partial<Record<"cs" | "en", unknown>> | undefined;

// Works for both field rules and object-type rules, whose typings differ.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CustomRule<R> = { custom: (fn: CustomValidator<any>) => R };

const isEmpty = (value: unknown) =>
  value == null || value === "" || (Array.isArray(value) && value.length === 0);

/** Czech is mandatory, English missing is a warning only. */
export function requiredLocale<R extends CustomRule<R> & { warning: () => R }>(rule: R) {
  return [
    rule.custom((value: Localized) => (isEmpty(value?.cs) ? "Vyplň aspoň český text." : true)),
    rule
      .custom((value: Localized) =>
        !isEmpty(value?.cs) && isEmpty(value?.en) ? "Chybí anglická verze." : true,
      )
      .warning(),
  ];
}

/** Blocks publishing of design placeholders such as "[Název akce]" or "doplnit". */
export function noPlaceholder<R extends CustomRule<R>>(rule: R) {
  return rule.custom((value: unknown) => {
    const hit = findPlaceholder(value);
    return hit ? `Zástupný text „${hit}“ nesmí jít na web. Nahraď ho skutečným obsahem.` : true;
  });
}
