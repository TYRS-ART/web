import { getTranslations } from "next-intl/server";

const sizes = {
  md: "px-2.5 py-1.5 text-[13px] leading-4 lg:px-4 lg:py-2 lg:text-base lg:leading-5",
} as const;

/**
 * Course focus chip (Tanec / Hudba / Pohyb). Tanec and Hudba share the drifting
 * category colour; Pohyb is butter and stays still.
 */
export async function FocusChip({ focus, className = "" }: { focus: string; className?: string }) {
  const tr = await getTranslations("focus");
  const colour = focus === "pohyb" ? "bg-pohyb text-black" : `cl cl-${focus}`;
  return (
    <span className={`chip inline-flex items-center rounded-full font-medium whitespace-nowrap ${colour} ${sizes.md} ${className}`}>
      {tr(focus)}
    </span>
  );
}

/** Solid focus colours (mobile slot tags, legend, filter chips). */
export const focusFill: Record<string, string> = {
  tanec: "bg-tanec",
  hudba: "bg-hudba",
  pohyb: "bg-pohyb",
};
