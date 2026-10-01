export { metadata, viewport } from "next-sanity/studio";

export default function StudioLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="cs">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
