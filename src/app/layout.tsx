import "~/styles/globals.css";

import { type Metadata } from "next";
import { Hanken_Grotesk } from "next/font/google";
import Navigation from "../components/Navigation";
import { AuthProvider } from "~/auth/client";

export const metadata: Metadata = {};

const sans = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable}`}>
      <body className="flex min-h-screen flex-col">
        <AuthProvider>
          <Navigation />
          <main className="flex-1 bg-gray-100">

            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
