import { BookIcon } from "@sanity/icons/Book";
import { CalendarIcon } from "@sanity/icons/Calendar";
import { BulbOutlineIcon } from "@sanity/icons/BulbOutline";
import { CogIcon } from "@sanity/icons/Cog";
import { EnvelopeIcon } from "@sanity/icons/Envelope";
import { HomeIcon } from "@sanity/icons/Home";
import { InfoOutlineIcon } from "@sanity/icons/InfoOutline";
import { MicrophoneIcon } from "@sanity/icons/Microphone";
import { PlayIcon } from "@sanity/icons/Play";
import { ThListIcon } from "@sanity/icons/ThList";
import { UserIcon } from "@sanity/icons/User";
import type { StructureResolver } from "sanity/structure";

import { CourseTablePane, EventTablePane } from "./studio/DocumentTable";

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Obsah")
    .items([
      S.listItem()
        .title("Akce")
        .icon(CalendarIcon)
        .child(
          S.list()
            .title("Akce")
            .items([
              S.listItem()
                .title("Tabulka – hromadné úpravy")
                .icon(ThListIcon)
                .child(S.component(EventTablePane).id("event-table").title("Akce – tabulka")),
              S.divider(),
              S.listItem()
                .title("Nadcházející")
                .icon(CalendarIcon)
                .child(
                  S.documentList()
                    .title("Nadcházející akce")
                    .schemaType("event")
                    .apiVersion("2026-10-01")
                    .filter('_type == "event" && (!defined(startsAt) || startsAt >= now())')
                    .defaultOrdering([{ field: "startsAt", direction: "asc" }]),
                ),
              S.listItem()
                .title("Proběhlé")
                .icon(CalendarIcon)
                .child(
                  S.documentList()
                    .title("Proběhlé akce")
                    .schemaType("event")
                    .apiVersion("2026-10-01")
                    .filter('_type == "event" && startsAt < now()')
                    .defaultOrdering([{ field: "startsAt", direction: "desc" }]),
                ),
              S.documentTypeListItem("event").title("Všechny akce"),
            ]),
        ),
      S.listItem()
        .title("Kurzy")
        .icon(BookIcon)
        .child(
          S.list()
            .title("Kurzy")
            .items([
              S.listItem()
                .title("Tabulka – hromadné úpravy")
                .icon(ThListIcon)
                .child(S.component(CourseTablePane).id("course-table").title("Kurzy – tabulka")),
              S.divider(),
              S.documentTypeListItem("course").title("Všechny kurzy"),
            ]),
        ),
      S.documentTypeListItem("person").title("Lidé").icon(UserIcon),
      S.documentTypeListItem("space").title("Prostory").icon(HomeIcon),
      S.documentTypeListItem("playlist").title("Playlisty").icon(PlayIcon),
      S.divider(),
      S.listItem().title("Stránka Venue").icon(InfoOutlineIcon).child(S.document().schemaType("venuePage").documentId("venuePage")),
      S.listItem().title("Stránka Pronájem").icon(EnvelopeIcon).child(S.document().schemaType("rentalPage").documentId("rentalPage")),
      S.listItem().title("Stránka Studio").icon(MicrophoneIcon).child(S.document().schemaType("studioPage").documentId("studioPage")),
      S.listItem().title("Stránka Manifest").icon(BulbOutlineIcon).child(S.document().schemaType("manifestoPage").documentId("manifestoPage")),
      S.listItem().title("Nastavení webu").icon(CogIcon).child(S.document().schemaType("settings").documentId("settings")),
    ]);
