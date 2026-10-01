import type { ReactNode } from "react";

export type InfoItem = { label: string; value: ReactNode; sub?: ReactNode };

/** Black band with the facts (Kdy / Dveře / Kde / Vstupné) and the action buttons. */
export function InfoBand({ label, items, actions }: { label: string; items: InfoItem[]; actions: ReactNode }) {
  return (
    <section
      aria-label={label}
      className="mx-3 mt-2.5 flex flex-col gap-5 rounded-[14px] bg-black p-6 text-white lg:mx-6 lg:mt-4 lg:grid lg:grid-cols-12 lg:items-center lg:gap-8 lg:rounded-[20px] lg:px-12 lg:py-10"
    >
      <dl className="m-0 grid grid-cols-2 gap-4 lg:col-span-8 lg:grid-cols-4 lg:gap-6">
        {items.map((item) => (
          <div key={item.label}>
            <dt className="text-[13px] leading-4 opacity-70 lg:text-base lg:leading-5">{item.label}</dt>
            <dd className="m-0 mt-1 font-display text-[28px] leading-[30px] lg:mt-1.5 lg:text-4xl lg:leading-[38px]">
              {item.value}
              {item.sub && (
                <>
                  <br />
                  <span className="font-sans text-[15px] font-normal tracking-normal opacity-80 lg:text-xl">{item.sub}</span>
                </>
              )}
            </dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-col items-stretch gap-2.5 lg:col-span-4">{actions}</div>
    </section>
  );
}

/** Lime commit button ("Vstupenky · 390 Kč", "Přihlásit se na kurz"). */
export const bandCommitClass =
  "inline-flex min-h-14 items-center justify-center rounded-full border-2 border-transparent bg-lime px-6 text-lg leading-6 font-medium text-black no-underline hover:border-white lg:min-h-[72px] lg:px-9 lg:text-2xl lg:leading-7";

/** White outline button on the black band. */
export const bandOutlineClass =
  "inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-transparent px-6 text-base font-medium text-white no-underline hover:bg-white hover:text-black lg:min-h-14 lg:text-lg";

/** Small line with a lime dot ("Zbývají 4 místa z 14"). */
export function BandNote({ children }: { children: ReactNode }) {
  return (
    <span className="flex items-center gap-2 text-sm leading-[18px] opacity-80 lg:justify-center lg:text-base lg:leading-5">
      <span className="size-2 shrink-0 rounded-full bg-lime lg:size-2.5" />
      {children}
    </span>
  );
}
