import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0B0F19" },
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "Al Rae Hospital Management System | Pakistan",
    template: "%s | Al Rae Hospital",
  },
  description:
    "Enterprise Pharmacy & Dispensary Management Suite tailored for Pakistan. DRAP compliance, FEFO batch allocation, POS 80mm thermal receipt printing, accounts ledger, and clinical verification.",
  applicationName: "Al Rae Hospital ERP",
  keywords: [
    "Al Rae Hospital",
    "Pharmacy Management System",
    "Pakistan Hospital Software",
    "DRAP Compliance",
    "FEFO Inventory",
    "POS Dispensary",
    "PKR Currency Accounting",
  ],
  authors: [{ name: "Al Rae Hospital" }],
  creator: "Al Rae Hospital Architect",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "Sufi Pharmacy Management System",
    description: "Enterprise Pharmacy & Dispensary Management Suite for Pakistan",
    siteName: "Sufi Pharmacy ERP",
    locale: "en_PK",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased text-foreground">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
