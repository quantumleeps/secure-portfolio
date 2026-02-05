import { Roboto_Mono } from "next/font/google";
import { LandingPage } from "@/components/landing-page";

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
});

export default function Home() {
  const email = process.env.CONTACT_EMAIL;
  const phone = process.env.CONTACT_PHONE;

  return (
    <div className={robotoMono.variable}>
      <LandingPage email={email} phone={phone} />
    </div>
  );
}
