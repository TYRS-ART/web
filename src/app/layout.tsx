import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TYRŠ",
  description: "Nosticova 634/2, Malá Strana, Praha 1",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="cs" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
