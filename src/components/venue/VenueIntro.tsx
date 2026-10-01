import { PortableText, type PortableTextBlock, type PortableTextComponents } from "@portabletext/react";

import { nbspBlocks } from "@/lib/typography";

const components: PortableTextComponents = {
  block: {
    normal: ({ children }) => <p className="m-0">{children}</p>,
    h3: ({ children }) => (
      <h3 className="m-0 mt-2 font-display text-2xl leading-7 text-black lg:text-[30px] lg:leading-[34px]">{children}</h3>
    ),
  },
  marks: {
    link: ({ children, value }) => {
      const href = (value?.href as string) ?? "#";
      const external = /^https?:/.test(href);
      return (
        <a
          href={href}
          {...(external ? { target: "_blank", rel: "noopener" } : {})}
          className="text-black underline underline-offset-4 hover:text-green"
        >
          {children}
        </a>
      );
    },
  },
};

/** "Kdo" intro: muted paragraphs, larger than body text. */
export function VenueIntro({ value }: { value: PortableTextBlock[] }) {
  return (
    <div className="flex max-w-[900px] flex-col gap-4 text-[17px] leading-[26px] text-muted lg:gap-6 lg:text-2xl lg:leading-9">
      <PortableText value={nbspBlocks(value as never[]) as PortableTextBlock[]} components={components} />
    </div>
  );
}
