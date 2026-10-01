import Image from "next/image";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Image src="/logos/logo-primary.svg" alt="TYRŠ" width={240} height={80} priority />
    </main>
  );
}
