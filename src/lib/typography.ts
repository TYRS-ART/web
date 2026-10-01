/**
 * Czech typesetting: one-letter prepositions and conjunctions (a, i, k, o, s, u, v, z)
 * never end a line. Joins them to the next word with a no-break space.
 */
export function nbsp(text: string): string {
  return text.replace(/(?<=^|[\s(„"])([aikosuvzAIKOSUVZ]) /g, "$1\u00a0");
}

type Span = { _type: string; text?: string };
type Block = { _type: string; children?: Span[] };

/** Same, applied to every span of portable text. */
export function nbspBlocks<B extends Block>(blocks: B[]): B[] {
  return blocks.map((block) =>
    block.children
      ? { ...block, children: block.children.map((span) => (span.text ? { ...span, text: nbsp(span.text) } : span)) }
      : block,
  );
}
