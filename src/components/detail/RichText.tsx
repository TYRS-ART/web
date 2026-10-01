import { PortableText, type PortableTextBlock, type PortableTextComponents } from "@portabletext/react";

import { nbspBlocks } from "@/lib/typography";

const components: PortableTextComponents = {
  block: {
    normal: ({ children }) => (
      <p className="m-0 max-w-[760px] text-[17px] leading-[27px] lg:text-[21px] lg:leading-[33px]">{children}</p>
    ),
    h3: ({ children }) => (
      <h2 className="m-0 mt-2 font-display text-2xl leading-7 lg:mt-4 lg:text-[30px] lg:leading-[34px]">{children}</h2>
    ),
  },
  marks: {
    link: ({ children, value }) => {
      const href = (value?.href as string) ?? "#";
      const external = /^https?:/.test(href);
      return (
        <a href={href} {...(external ? { target: "_blank", rel: "noopener" } : {})} className="underline underline-offset-4 hover:text-green">
          {children}
        </a>
      );
    },
  },
};

/** Body text of detail pages: paragraphs, subheadings, bold, italic and links. */
export function RichText({ value }: { value: PortableTextBlock[] }) {
  return <PortableText value={nbspBlocks(value as never[]) as PortableTextBlock[]} components={components} />;
}

/** Large display-font lead paragraph. */
export function Lead({ children }: { children: string }) {
  return (
    <p className="m-0 font-display text-[30px] leading-[34px] tracking-[-0.02em] lg:text-[44px] lg:leading-[50px]">{children}</p>
  );
}
