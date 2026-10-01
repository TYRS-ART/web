import { BookIcon } from "@sanity/icons/Book";
import { CalendarIcon } from "@sanity/icons/Calendar";
import { CogIcon } from "@sanity/icons/Cog";
import { EnvelopeIcon } from "@sanity/icons/Envelope";
import { HomeIcon } from "@sanity/icons/Home";
import { InfoOutlineIcon } from "@sanity/icons/InfoOutline";
import { PlayIcon } from "@sanity/icons/Play";
import { UserIcon } from "@sanity/icons/User";
import type { StructureResolver } from "sanity/structure";

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Obsah")
    .items([
      S.documentTypeListItem("event").title("Akce").icon(CalendarIcon),
      S.documentTypeListItem("course").title("Kurzy").icon(BookIcon),
      S.documentTypeListItem("person").title("Lidé").icon(UserIcon),
      S.documentTypeListItem("space").title("Prostory").icon(HomeIcon),
      S.documentTypeListItem("playlist").title("Playlisty").icon(PlayIcon),
      S.divider(),
      S.listItem().title("Stránka Venue").icon(InfoOutlineIcon).child(S.document().schemaType("venuePage").documentId("venuePage")),
      S.listItem().title("Stránka Pronájem").icon(EnvelopeIcon).child(S.document().schemaType("rentalPage").documentId("rentalPage")),
      S.listItem().title("Nastavení webu").icon(CogIcon).child(S.document().schemaType("settings").documentId("settings")),
    ]);
