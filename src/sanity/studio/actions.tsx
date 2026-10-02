import { CalendarIcon } from "@sanity/icons/Calendar";
import { CopyIcon } from "@sanity/icons/Copy";
import { Box, Button, Card, Checkbox, Flex, Stack, Text, TextInput } from "@sanity/ui";
import { useToast } from "@sanity/ui/toast";
import { useState } from "react";
import {
  type DocumentActionComponent,
  type DocumentActionProps,
  type SanityDocument,
  useClient,
  useDocumentOperation,
} from "sanity";
import { useRouter } from "sanity/router";

import { addDays, pragueDay } from "@/lib/dates";

import { buildSlugs, formatPragueDateTime, missingFields, needsSlug, shiftedEvent, shiftDays, studioApiVersion } from "./helpers";

/**
 * Wraps the built-in Publish action: fills in the URL slug from the title (and date)
 * when it is empty, so editors never have to press "Generate".
 */
export function withAutoSlug(original: DocumentActionComponent): DocumentActionComponent {
  const AutoSlugPublish: DocumentActionComponent = (props: DocumentActionProps) => {
    const result = original(props);
    const client = useClient({ apiVersion: studioApiVersion });
    const { patch } = useDocumentOperation(props.id, props.type);
    if (!result) return result;
    return {
      ...result,
      onHandle: async () => {
        const doc = props.draft ?? props.published;
        if (doc && needsSlug(doc)) {
          patch.execute([{ set: { slug: await buildSlugs(client, doc) } }]);
        }
        result.onHandle?.();
      },
    };
  };
  AutoSlugPublish.action = original.action;
  AutoSlugPublish.displayName = "AutoSlugPublish";
  return AutoSlugPublish;
}

/** "Duplikovat na příští týden": a draft copy of the event, same time, seven days later. */
export const DuplicateNextWeekAction: DocumentActionComponent = (props) => {
  const client = useClient({ apiVersion: studioApiVersion });
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const source = props.draft ?? props.published;

  return {
    label: "Duplikovat na příští týden",
    icon: CopyIcon,
    disabled: !source?.startsAt || busy,
    title: source?.startsAt ? undefined : "Nejdřív vyplň začátek akce.",
    onHandle: async () => {
      if (!source) return;
      setBusy(true);
      try {
        const id = crypto.randomUUID();
        await client.create({ ...shiftedEvent(source, 1), _id: `drafts.${id}`, _type: "event" });
        toast.push({ status: "success", title: `Koncept na ${formatPragueDateTime(shiftDays(source.startsAt as string, 7))} je hotový` });
        router.navigateIntent("edit", { id, type: "event" });
      } catch (error) {
        toast.push({ status: "error", title: "Kopii se nepodařilo vytvořit", description: (error as Error).message });
      } finally {
        setBusy(false);
      }
    },
  };
};
DuplicateNextWeekAction.displayName = "DuplicateNextWeekAction";

/** "Opakovat každý týden…": weekly copies until a chosen date, as drafts or published. */
export const RepeatWeeklyAction: DocumentActionComponent = (props) => {
  const [open, setOpen] = useState(false);
  const source = props.draft ?? props.published;
  return {
    label: "Opakovat každý týden…",
    icon: CalendarIcon,
    disabled: !source?.startsAt,
    title: source?.startsAt ? undefined : "Nejdřív vyplň začátek akce.",
    onHandle: () => setOpen(true),
    dialog: open &&
      source && {
        type: "dialog",
        header: "Opakovat každý týden",
        onClose: () => setOpen(false),
        content: <RepeatForm source={source} onDone={() => setOpen(false)} />,
      },
  };
};
RepeatWeeklyAction.displayName = "RepeatWeeklyAction";

const MAX_COPIES = 60;

function RepeatForm({ source, onDone }: { source: SanityDocument; onDone: () => void }) {
  const client = useClient({ apiVersion: studioApiVersion });
  const toast = useToast();
  const start = source.startsAt as string;
  const [until, setUntil] = useState(addDays(pragueDay(start), 7 * 8));
  const problems = missingFields(source);
  const [publish, setPublish] = useState(false);
  const [busy, setBusy] = useState(false);

  const dates: string[] = [];
  for (let week = 1; week <= MAX_COPIES; week++) {
    const next = shiftDays(start, week * 7);
    if (pragueDay(next) > until) break;
    dates.push(next);
  }

  async function create() {
    setBusy(true);
    try {
      const tx = client.transaction();
      for (const [index, startsAt] of dates.entries()) {
        const copy = { ...shiftedEvent(source, index + 1), _type: "event" } as SanityDocument;
        const id = crypto.randomUUID();
        if (publish) {
          const slug = await buildSlugs(client, { ...copy, _id: id, startsAt } as SanityDocument);
          tx.create({ ...copy, _id: id, slug });
        } else {
          tx.create({ ...copy, _id: `drafts.${id}` });
        }
      }
      await tx.commit();
      toast.push({
        status: "success",
        title: `Vytvořeno ${dates.length} ${publish ? "zveřejněných akcí" : "konceptů"}`,
        description: publish ? undefined : "Zkontroluj a zveřejni je v Akce – tabulka.",
      });
      onDone();
    } catch (error) {
      toast.push({ status: "error", title: "Opakování se nepodařilo", description: (error as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box padding={4}>
      <Stack gap={4}>
        <Text size={1} muted>
          Vytvoří kopii této akce každý týden ve stejný den a čas ({formatPragueDateTime(start)}).
        </Text>
        <Stack gap={2}>
          <Text size={1} weight="semibold">
            Opakovat do (včetně)
          </Text>
          <TextInput
            type="date"
            value={until}
            min={addDays(pragueDay(start), 7)}
            onChange={(event) => setUntil(event.currentTarget.value)}
          />
        </Stack>
        <Card padding={3} radius={2} tone={dates.length ? "primary" : "caution"}>
          <Text size={1}>
            {dates.length
              ? `${dates.length} ${dates.length === 1 ? "kopie" : dates.length < 5 ? "kopie" : "kopií"}: ${formatPragueDateTime(dates[0])}${
                  dates.length > 1 ? ` … ${formatPragueDateTime(dates[dates.length - 1])}` : ""
                }`
              : "Vyber datum aspoň o týden později."}
            {dates.length === MAX_COPIES ? ` (nejvýš ${MAX_COPIES} najednou)` : ""}
          </Text>
        </Card>
        <Flex gap={3} align="center">
          <Checkbox
            id="repeat-publish"
            checked={publish}
            disabled={problems.length > 0}
            onChange={(event) => setPublish(event.currentTarget.checked)}
          />
          <Box flex={1}>
            <Text size={1}>
              <label htmlFor="repeat-publish">Rovnou zveřejnit</label>
              {problems.length > 0 && <> — nejde, chybí: {problems.join(", ")}</>}
            </Text>
          </Box>
        </Flex>
        <Flex justify="flex-end" gap={2}>
          <Button text="Zrušit" mode="ghost" onClick={onDone} />
          <Button
            text={busy ? "Vytvářím…" : `Vytvořit ${dates.length || ""}`.trim()}
            tone="primary"
            disabled={!dates.length || busy}
            onClick={create}
          />
        </Flex>
      </Stack>
    </Box>
  );
}
