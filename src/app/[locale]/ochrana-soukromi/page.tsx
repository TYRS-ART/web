import type { Metadata } from "next";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";

import type { Locale } from "@/i18n/locales";
import { alternates } from "@/lib/metadata";
import { nbsp } from "@/lib/typography";
import type { Messages } from "@/messages";

export async function generateMetadata({ params }: PageProps<"/[locale]/ochrana-soukromi">): Promise<Metadata> {
  const tr = await getTranslations({ locale: (await params).locale, namespace: "privacy" });
  return { title: tr("title"), alternates: alternates("/ochrana-soukromi", (await params).locale as Locale) };
}

export default async function PrivacyPage({ params }: PageProps<"/[locale]/ochrana-soukromi">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const tr = await getTranslations("privacy");
  const { privacy } = (await getMessages()) as unknown as Messages;
  const email = "hello@tyrs.art";

  return (
    <article className="flex flex-col gap-8 px-5 pt-8 lg:gap-12 lg:px-16 lg:pt-12">
      <header className="flex flex-col gap-3">
        <h1 className="m-0 font-display text-[52px] leading-[50px] lg:text-[120px] lg:leading-[108px]">{tr("title")}</h1>
        <p className="m-0 text-[15px] text-muted lg:text-lg">{tr("updated")}</p>
      </header>
      <div className="flex max-w-[760px] flex-col gap-8 lg:gap-10">
        {privacy.sections.map((section) => (
          <section key={section.h} className="flex flex-col gap-3">
            <h2 className="m-0 font-display text-2xl leading-7 lg:text-[32px] lg:leading-[34px]">{section.h}</h2>
            {section.p.map((paragraph) => {
              const [before, after] = nbsp(paragraph).split("{email}");
              return (
                <p key={paragraph} className="m-0 text-[17px] leading-[27px] lg:text-[21px] lg:leading-[33px]">
                  {before}
                  {after !== undefined && (
                    <>
                      <a href={`mailto:${email}`} className="underline underline-offset-4 hover:text-green">
                        {email}
                      </a>
                      {after}
                    </>
                  )}
                </p>
              );
            })}
          </section>
        ))}
      </div>
    </article>
  );
}
