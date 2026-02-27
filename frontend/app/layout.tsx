import type { Metadata } from "next";
import "./globals.css";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";

export const metadata: Metadata = {
  title: "LivKit Enterprise Dashboard",
  description: "LiveKit infrastructure monitoring and management",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ConvexAuthNextjsServerProvider>{children}</ConvexAuthNextjsServerProvider>
      </body>
    </html>
  );
}
