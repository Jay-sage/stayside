import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { OnboardingModal } from "@/components/OnboardingModal";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Stayside — Hotels, On Your Terms.",
    template: "%s | Stayside",
  },
  description:
    "Hotels, On Your Terms. Book curated day-stay hotels (10am–4pm) across Ikoyi, Victoria Island, Ikeja, and Lekki in Lagos, Nigeria.",
  openGraph: {
    title: "Stayside — Hotels, On Your Terms.",
    description:
      "Book verified Lagos day-stay hotels (10am–4pm) starting as low as ₦5,000. Pay with Paystack or confirm on WhatsApp.",
    siteName: "Stayside",
    locale: "en_NG",
    type: "website",
    images: [{ url: "/images/hero-lagos.png", width: 1360, height: 768, alt: "Stayside Lagos Day-Stay Hotels" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Stayside — Hotels, On Your Terms.",
    description:
      "Book verified Lagos day-stay hotels (10am–4pm) starting as low as ₦5,000.",
    images: ["/images/hero-lagos.png"],
  },
};

const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('stayside-theme');var d=t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${plusJakarta.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-screen flex-col bg-white text-brand-ink antialiased">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <MobileBottomNav />
        <OnboardingModal />
      </body>
    </html>
  );
}
