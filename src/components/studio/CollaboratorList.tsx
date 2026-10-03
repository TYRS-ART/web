import type { CSSProperties } from "react";

import { SanityImage } from "@/components/ui/SanityImage";
import { nbsp } from "@/lib/typography";
import type { STUDIO_QUERY_RESULT } from "@/sanity/types";

export type Collaborator = NonNullable<NonNullable<STUDIO_QUERY_RESULT["page"]>["collaborators"]>[number];

/** "Ken Lewis" → "KL", for the plain tile of someone without a photo. */
const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");

/**
 * Engineers and producers, one row each like the programme list: a small photo
 * (feathered, never cut into a shape), the name in the display face, who they've
 * worked with and a link to their site. Without photos the column is left out.
 */
export function CollaboratorList({
  people,
  creditsLabel,
  websiteLabel,
}: {
  people: Collaborator[];
  /** "Pracoval s" / "Pracovala s" by the person's Czech form, else a neutral "Kredity:". */
  creditsLabel: (form: string | null) => string;
  websiteLabel: string;
}) {
  const withPhotos = people.some((person) => person.photo?.asset);
  return (
    <ul className="m-0 flex list-none flex-col p-0">
      {people.map((person, i) => (
        <li
          key={person._key}
          className={`flex flex-col gap-2 border-t-2 border-black py-5 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)_auto] lg:items-center lg:gap-8 lg:py-6 ${
            i === people.length - 1 ? "border-b-2" : ""
          }`}
        >
          <span className="flex items-center gap-4 lg:gap-6">
            {withPhotos && (
              <span className="relative block h-[68px] w-14 shrink-0 overflow-hidden rounded-[10px] bg-sunken lg:h-[100px] lg:w-20 lg:rounded-[12px]">
                {person.photo?.asset ? (
                  <SanityImage
                    image={person.photo}
                    alt=""
                    fill
                    sizes="80px"
                    className="soft object-cover object-top"
                    style={{ "--feather": "10px" } as CSSProperties}
                  />
                ) : (
                  <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center font-display text-xl text-muted lg:text-2xl">
                    {initials(person.name ?? "")}
                  </span>
                )}
              </span>
            )}
            <span className="font-display text-[36px] leading-9 lg:text-[56px] lg:leading-[56px]">{nbsp(person.name ?? "")}</span>
          </span>
          {person.credits ? (
            <span className="text-[15px] leading-[22px] lg:text-xl lg:leading-7">
              <span className="text-muted">{creditsLabel(person.form)} </span>
              {person.credits}
            </span>
          ) : (
            <span className="max-lg:hidden" />
          )}
          {person.url ? (
            <a
              href={person.url}
              target="_blank"
              rel="noopener"
              aria-label={`${websiteLabel}: ${person.name}`}
              className="self-start text-[15px] leading-[22px] font-medium whitespace-nowrap underline underline-offset-4 hover:text-green lg:self-center lg:text-lg lg:leading-7"
            >
              {websiteLabel} <span aria-hidden="true">↗</span>
            </a>
          ) : (
            // Keeps the columns aligned with the rows that have a link.
            <span aria-hidden="true" className="max-lg:hidden">
              <span className="invisible text-lg">{websiteLabel} ↗</span>
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
