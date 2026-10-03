import { nbsp } from "@/lib/typography";

export type Collaborator = { _key: string; name: string | null; credits: string | null; url: string | null };

/**
 * Engineers and producers, one row each like the programme list: name in the
 * display face, who they've worked with, and a link to their site.
 */
export function CollaboratorList({
  people,
  creditsLabel,
  websiteLabel,
}: {
  people: Collaborator[];
  creditsLabel: string;
  websiteLabel: string;
}) {
  return (
    <ul className="m-0 flex list-none flex-col p-0">
      {people.map((person, i) => (
        <li
          key={person._key}
          className={`flex flex-col gap-2 border-t-2 border-black py-5 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)_auto] lg:items-baseline lg:gap-8 lg:py-7 ${
            i === people.length - 1 ? "border-b-2" : ""
          }`}
        >
          <span className="font-display text-[36px] leading-9 lg:text-[56px] lg:leading-[56px]">{nbsp(person.name ?? "")}</span>
          {person.credits ? (
            <span className="text-[15px] leading-[22px] lg:text-xl lg:leading-7">
              <span className="text-muted">{creditsLabel} </span>
              {person.credits}
            </span>
          ) : (
            <span className="max-lg:hidden" />
          )}
          {person.url && (
            <a
              href={person.url}
              target="_blank"
              rel="noopener"
              aria-label={`${websiteLabel}: ${person.name}`}
              className="self-start text-[15px] leading-[22px] font-medium whitespace-nowrap underline underline-offset-4 hover:text-green lg:text-lg lg:leading-7"
            >
              {websiteLabel} <span aria-hidden="true">↗</span>
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}
