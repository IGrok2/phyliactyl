import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { I18nProvider } from "@/components/i18n-provider";
import { BrandProvider } from "@/components/brand-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_NAME = process.env.APP_NAME?.trim() || "Phyliactyl";

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — game server management`,
    template: `%s · ${APP_NAME}`,
  },
  description:
    "Modern game server control panel: console, file manager, databases, backups and administration.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="bg-background text-foreground min-h-full">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <I18nProvider>
            <BrandProvider>
              <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
              <Toaster position="bottom-right" />
            </BrandProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
