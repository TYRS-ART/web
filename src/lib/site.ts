/** Absolute origin of the public site, without a trailing slash. */
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://tyrs.art").replace(/\/$/, "");

type Address = { street?: string; district?: string; postalCode?: string; city?: string } | null | undefined;

/** "Nosticova 634/2, 118 00 Praha 1" */
export function addressLine(address: Address): string | undefined {
  if (!address?.street) return undefined;
  const city = [address.postalCode, address.city].filter(Boolean).join(" ");
  return [address.street, city].filter(Boolean).join(", ");
}
