import { createImageUrlBuilder } from "@sanity/image-url";
import { Badge, Box, Button, Card, Checkbox, Flex, Select, Spinner, Stack, Text, TextInput, type TextInputType } from "@sanity/ui";
import { useToast } from "@sanity/ui/toast";
import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { type SanityDocument, useClient } from "sanity";
import { useRouter } from "sanity/router";

import { pragueDay, pragueMidnight } from "@/lib/dates";
import { courseFocuses, eventCategories } from "@/lib/taxonomy";

import { buildSlugs, draftId, missingFields, needsSlug, publishedId, studioApiVersion } from "./helpers";

type DocType = "event" | "course";
type Row = { id: string; draft: SanityDocument | null; published: SanityDocument | null; doc: SanityDocument };
type Range = "upcoming" | "past" | "all";

const cell: CSSProperties = { padding: "6px 8px", borderBottom: "1px solid var(--card-border-color)", verticalAlign: "middle" };
const head: CSSProperties = { ...cell, position: "sticky", top: 0, zIndex: 1, background: "var(--card-bg-color)", textAlign: "left" };

/** "2026-10-16T20:00" in Prague time for <input type="datetime-local">. */
function toLocalInput(iso: unknown) {
  if (typeof iso !== "string") return "";
  const day = pragueDay(iso);
  const minutes = Math.round((Date.parse(iso) - pragueMidnight(day).getTime()) / 60_000);
  return `${day}T${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function fromLocalInput(value: string) {
  const [day, time] = value.split("T");
  const [h, m] = (time ?? "00:00").split(":").map(Number);
  return new Date(pragueMidnight(day).getTime() + (h * 60 + m) * 60_000).toISOString();
}

/**
 * Spreadsheet-like list of events or courses: edit the key fields inline, select rows,
 * publish / unpublish / delete them in bulk. Edits go to drafts, like the normal form.
 */
export function DocumentTable({ type }: { type: DocType }) {
  const client = useClient({ apiVersion: studioApiVersion });
  const router = useRouter();
  const toast = useToast();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [range, setRange] = useState<Range>("upcoming");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);

  const imageUrl = useMemo(() => createImageUrlBuilder(client), [client]);

  const load = useCallback(async () => {
    const docs = await client.fetch<SanityDocument[]>(`*[_type == $type]`, { type }, { perspective: "raw" });
    const byId = new Map<string, Row>();
    for (const doc of docs) {
      // Release versions ("versions.*") are managed in Releases, not here.
      if (doc._id.startsWith("versions.")) continue;
      const id = publishedId(doc._id);
      const row = byId.get(id) ?? { id, draft: null, published: null, doc };
      if (doc._id.startsWith("drafts.")) row.draft = doc;
      else row.published = doc;
      row.doc = row.draft ?? row.published ?? doc;
      byId.set(id, row);
    }
    setRows([...byId.values()]);
  }, [client, type]);

  useEffect(() => {
    let timer = setTimeout(load, 0);
    const subscription = client
      .listen(`*[_type == $type]`, { type }, { includeResult: false, visibility: "query" })
      .subscribe(() => {
        clearTimeout(timer);
        timer = setTimeout(load, 400);
      });
    return () => {
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, [client, load, type]);

  const visible = useMemo(() => {
    if (!rows) return [];
    const today = pragueDay(new Date());
    const query = search.trim().toLowerCase();
    return rows
      .filter((row) => {
        const date =
          type === "event"
            ? (row.doc.startsAt as string | undefined)
            : ((row.doc.runEnd as string | undefined) ?? (row.doc.runStart as string | undefined));
        const day = date ? pragueDay(date) : undefined;
        if (range === "upcoming" && day && day < today) return false;
        if (range === "past" && (!day || day >= today)) return false;
        if (!query) return true;
        const title = row.doc.title as { cs?: string; en?: string } | undefined;
        return `${title?.cs ?? ""} ${title?.en ?? ""}`.toLowerCase().includes(query);
      })
      .sort((a, b) => {
        const key = type === "event" ? "startsAt" : "runStart";
        return String(a.doc[key] ?? "9999").localeCompare(String(b.doc[key] ?? "9999"));
      });
  }, [rows, range, search, type]);

  /** Writes fields to the draft, creating it from the published version first if needed. */
  const edit = useCallback(
    async (row: Row, set: Record<string, unknown>) => {
      try {
        const tx = client.transaction();
        if (!row.draft && row.published) tx.createIfNotExists({ ...row.published, _id: draftId(row.id) });
        if (!row.draft && !row.published) return;
        tx.patch(draftId(row.id), (patch) => patch.set(set));
        await tx.commit();
      } catch (error) {
        toast.push({ status: "error", title: "Uložení se nepovedlo", description: (error as Error).message });
      }
    },
    [client, toast],
  );

  const selectedRows = visible.filter((row) => selected.has(row.id));

  async function publishSelected() {
    const ready = selectedRows.filter((row) => row.draft && missingFields(row.draft).length === 0);
    const skipped = selectedRows.length - ready.length;
    if (!ready.length) {
      toast.push({ status: "warning", title: "Nic ke zveřejnění", description: "Vybrané řádky nemají změny, nebo jim chybí povinná pole." });
      return;
    }
    setBusy(true);
    let done = 0;
    for (const row of ready) {
      try {
        if (needsSlug(row.draft)) {
          await client.patch(draftId(row.id)).set({ slug: await buildSlugs(client, row.draft!) }).commit();
        }
        await client.action({ actionType: "sanity.action.document.publish", draftId: draftId(row.id), publishedId: row.id });
        done++;
      } catch (error) {
        toast.push({ status: "error", title: `Nepodařilo se zveřejnit: ${(row.doc.title as { cs?: string })?.cs ?? row.id}`, description: (error as Error).message });
      }
    }
    setBusy(false);
    setSelected(new Set());
    toast.push({
      status: "success",
      title: `Zveřejněno ${done}`,
      description: skipped ? `${skipped} přeskočeno (bez změn nebo s chybějícími poli).` : undefined,
    });
  }

  async function unpublishSelected() {
    const targets = selectedRows.filter((row) => row.published);
    if (!targets.length || !window.confirm(`Stáhnout z webu ${targets.length} položek? Zůstanou jako koncepty.`)) return;
    setBusy(true);
    for (const row of targets) {
      await client
        .action({ actionType: "sanity.action.document.unpublish", draftId: draftId(row.id), publishedId: row.id })
        .catch((error: Error) => toast.push({ status: "error", title: "Stažení se nepovedlo", description: error.message }));
    }
    setBusy(false);
    setSelected(new Set());
  }

  async function deleteSelected() {
    if (!selectedRows.length || !window.confirm(`Smazat ${selectedRows.length} položek? Tohle nejde vrátit.`)) return;
    setBusy(true);
    for (const row of selectedRows) {
      await client
        .action({ actionType: "sanity.action.document.delete", includeDrafts: [draftId(row.id)], publishedId: row.id })
        .catch((error: Error) => toast.push({ status: "error", title: "Smazání se nepovedlo", description: error.message }));
    }
    setBusy(false);
    setSelected(new Set());
  }

  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const allSelected = visible.length > 0 && visible.every((row) => selected.has(row.id));

  if (!rows) {
    return (
      <Flex padding={5} justify="center">
        <Spinner muted />
      </Flex>
    );
  }

  return (
    <Stack gap={3} padding={3}>
      <Flex gap={2} align="center" wrap="wrap">
        <Box style={{ minWidth: 220 }}>
          <TextInput placeholder="Hledat název…" value={search} onChange={(e) => setSearch(e.currentTarget.value)} />
        </Box>
        <Select value={range} onChange={(e) => setRange(e.currentTarget.value as Range)} style={{ width: 170 }}>
          <option value="upcoming">Nadcházející</option>
          <option value="past">Proběhlé</option>
          <option value="all">Vše</option>
        </Select>
        <Box flex={1} />
        <Text size={1} muted>
          {selectedRows.length ? `Vybráno ${selectedRows.length}` : `${visible.length} položek`}
        </Text>
        <Button text="Zveřejnit vybrané" tone="positive" disabled={!selectedRows.length || busy} onClick={publishSelected} />
        <Button text="Stáhnout z webu" mode="ghost" disabled={!selectedRows.length || busy} onClick={unpublishSelected} />
        <Button text="Smazat" mode="ghost" tone="critical" disabled={!selectedRows.length || busy} onClick={deleteSelected} />
      </Flex>

      <Card radius={2} border style={{ overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              <th style={head}>
                <Checkbox
                  checked={allSelected}
                  indeterminate={!allSelected && selectedRows.length > 0}
                  onChange={() => setSelected(allSelected ? new Set() : new Set(visible.map((row) => row.id)))}
                  aria-label="Vybrat vše"
                />
              </th>
              <th style={head} />
              <th style={head}>Název (CZ)</th>
              <th style={head}>Název (EN)</th>
              {type === "event" ? (
                <>
                  <th style={head}>Začátek</th>
                  <th style={head}>Kategorie</th>
                </>
              ) : (
                <>
                  <th style={head}>Zaměření</th>
                  <th style={head}>Běh od</th>
                  <th style={head}>Běh do</th>
                </>
              )}
              <th style={head}>Stav</th>
              <th style={head} />
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <TableRow
                key={row.id}
                row={row}
                type={type}
                selected={selected.has(row.id)}
                onToggle={() => toggle(row.id)}
                onEdit={(set) => edit(row, set)}
                onOpen={() => router.navigateIntent("edit", { id: row.id, type })}
                thumbnail={
                  (row.doc.heroImage as { asset?: { _ref: string } } | undefined)?.asset
                    ? imageUrl.image(row.doc.heroImage as never).width(80).height(56).fit("crop").url()
                    : undefined
                }
              />
            ))}
          </tbody>
        </table>
        {visible.length === 0 && (
          <Box padding={5}>
            <Text align="center" muted>
              Nic tu není.
            </Text>
          </Box>
        )}
      </Card>
    </Stack>
  );
}

function TableRow({
  row,
  type,
  selected,
  onToggle,
  onEdit,
  onOpen,
  thumbnail,
}: {
  row: Row;
  type: DocType;
  selected: boolean;
  onToggle: () => void;
  onEdit: (set: Record<string, unknown>) => void;
  onOpen: () => void;
  thumbnail?: string;
}) {
  const doc = row.doc;
  const title = (doc.title as { cs?: string; en?: string } | undefined) ?? {};
  const problems = missingFields(doc);

  const status: ReactNode = row.draft ? (
    row.published ? (
      <Badge tone="caution">Neuložené změny</Badge>
    ) : (
      <Badge tone="default">Koncept</Badge>
    )
  ) : (
    <Badge tone="positive">Na webu</Badge>
  );

  return (
    <tr style={{ background: selected ? "var(--card-muted-bg-color, rgba(0,0,0,0.04))" : undefined }}>
      <td style={cell}>
        <Checkbox checked={selected} onChange={onToggle} aria-label="Vybrat řádek" />
      </td>
      <td style={{ ...cell, width: 48 }}>
        {thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbnail} alt="" width={40} height={28} style={{ display: "block", borderRadius: 3, objectFit: "cover" }} />
        ) : (
          <div style={{ width: 40, height: 28, borderRadius: 3, background: "var(--card-border-color)" }} />
        )}
      </td>
      <td style={{ ...cell, minWidth: 200 }}>
        <BlurInput value={title.cs ?? ""} onCommit={(value) => onEdit({ "title.cs": value, "title._type": "localeString" })} />
      </td>
      <td style={{ ...cell, minWidth: 180 }}>
        <BlurInput value={title.en ?? ""} onCommit={(value) => onEdit({ "title.en": value, "title._type": "localeString" })} />
      </td>
      {type === "event" ? (
        <>
          <td style={{ ...cell, minWidth: 190 }}>
            <BlurInput
              type="datetime-local"
              value={toLocalInput(doc.startsAt)}
              onCommit={(value) => value && onEdit({ startsAt: fromLocalInput(value) })}
            />
          </td>
          <td style={cell}>
            <Flex gap={1} wrap="wrap">
              {eventCategories.map((category) => {
                const current = (doc.categories as string[] | undefined) ?? [];
                const on = current.includes(category.id);
                return (
                  <Button
                    key={category.id}
                    text={category.cs}
                    fontSize={1}
                    padding={2}
                    mode={on ? "default" : "ghost"}
                    tone={on ? "primary" : "default"}
                    onClick={() =>
                      onEdit({ categories: on ? current.filter((c) => c !== category.id) : [...current, category.id] })
                    }
                  />
                );
              })}
            </Flex>
          </td>
        </>
      ) : (
        <>
          <td style={cell}>
            <Select
              fontSize={1}
              value={(doc.focus as string | undefined) ?? ""}
              onChange={(e) => onEdit({ focus: e.currentTarget.value })}
            >
              <option value="">—</option>
              {courseFocuses.map((focus) => (
                <option key={focus.id} value={focus.id}>
                  {focus.cs}
                </option>
              ))}
            </Select>
          </td>
          <td style={cell}>
            <BlurInput type="date" value={(doc.runStart as string) ?? ""} onCommit={(value) => onEdit({ runStart: value || null })} />
          </td>
          <td style={cell}>
            <BlurInput type="date" value={(doc.runEnd as string) ?? ""} onCommit={(value) => onEdit({ runEnd: value || null })} />
          </td>
        </>
      )}
      <td style={{ ...cell, whiteSpace: "nowrap" }}>
        <Stack gap={1}>
          <Box>{status}</Box>
          {problems.length > 0 && (
            <Text size={0} style={{ color: "var(--card-badge-critical-fg-color, #c0392b)" }}>
              Chybí: {problems.join(", ")}
            </Text>
          )}
        </Stack>
      </td>
      <td style={cell}>
        <Button text="Otevřít" mode="bleed" fontSize={1} onClick={onOpen} />
      </td>
    </tr>
  );
}

/** Text input that saves on blur or Enter, so typing doesn't create a revision per key. */
function BlurInput({ value, onCommit, type = "text" }: { value: string; onCommit: (value: string) => void; type?: TextInputType }) {
  const [draft, setDraft] = useState(value);
  const [focused, setFocused] = useState(false);
  const shown = focused ? draft : value;
  const commit = () => {
    setFocused(false);
    if (draft !== value) onCommit(draft);
  };
  return (
    <TextInput
      type={type}
      fontSize={1}
      padding={2}
      value={shown}
      onFocus={() => {
        setDraft(value);
        setFocused(true);
      }}
      onChange={(e) => setDraft(e.currentTarget.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur();
        if (e.key === "Escape") {
          setDraft(value);
          setFocused(false);
          (e.currentTarget as HTMLInputElement).blur();
        }
      }}
    />
  );
}

export function EventTablePane() {
  return <DocumentTable type="event" />;
}

export function CourseTablePane() {
  return <DocumentTable type="course" />;
}
