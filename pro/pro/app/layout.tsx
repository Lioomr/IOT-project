// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar/Navbar"; // Import the Navbar component

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GrowVision", // Updated title
  description: "IoT Greenhouse Monitoring System", // Updated description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`} // Added font-sans here
      >
        {/* Render Navbar above all page content */}
        <Navbar />
        {/* Page content will be rendered here */}
        <main>{children}</main>
        {/* You could add a shared Footer component here as well */}
      </body>
    </html>
  );
}
