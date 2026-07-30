import Footer from "@/components/footer";
import Header from "@/components/shared/header";
import React from "react";
import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="wrapper flex-1">{children}</div>
      <Footer />
      <Toaster />
    </div>
  );
}
