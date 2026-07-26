import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "@/assets/styles/global.css";
import { cn } from "@/lib/utils";
import { APP_NAME, DESCRIPTION } from "@/lib/constants";
const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });
import { ThemeProvider } from "next-themes";
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: `%s | ${APP_NAME}`,
    default: APP_NAME,
  },
  description: DESCRIPTION,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("font-sans", geist.variable)}
      suppressHydrationWarning
    >
      <body className={`${inter.variable} antialiased font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
