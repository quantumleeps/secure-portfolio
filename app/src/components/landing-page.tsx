import { ContactSection } from "./contact-section";

interface LandingPageProps {
  email?: string;
  phone?: string;
}

export function LandingPage({ email, phone }: LandingPageProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 pb-[40vh] md:pb-[20vh]" style={{ fontFamily: "var(--font-roboto-mono), monospace" }}>
      <div className="w-full max-w-2xl space-y-4">
        <h1 className="text-foreground text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight select-none pl-4">
          Dan Leeper
        </h1>

        <ContactSection email={email} phone={phone} />
      </div>
    </div>
  );
}
