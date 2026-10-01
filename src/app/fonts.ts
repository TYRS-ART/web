import localFont from "next/font/local";

export const clash = localFont({
  src: "../../public/fonts/ClashGrotesk-Variable.woff2",
  weight: "200 700",
  variable: "--font-clash",
  display: "swap",
});

export const generalSans = localFont({
  src: [
    { path: "../../public/fonts/GeneralSans-Variable.woff2", weight: "200 700", style: "normal" },
    { path: "../../public/fonts/GeneralSans-VariableItalic.woff2", weight: "200 700", style: "italic" },
  ],
  variable: "--font-general",
  display: "swap",
});

export const hedvig = localFont({
  src: "../../public/fonts/HedvigLettersSerif-Variable.woff2",
  weight: "400",
  variable: "--font-hedvig",
  display: "swap",
});
