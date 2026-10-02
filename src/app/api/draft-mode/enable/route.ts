import { defineEnableDraftMode } from "next-sanity/draft-mode";

import { client } from "@/sanity/lib/client";
import { readToken } from "@/sanity/lib/token";

/** Called by the Presentation tool to switch the preview to drafts. */
export const { GET } = defineEnableDraftMode({ client: client.withConfig({ token: readToken }) });
