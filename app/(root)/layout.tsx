import Footer from "@/components/footer";
import Header from "@/components/shared/header";
import React from "react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="wrapper flex-1">{children}</div>
      <Footer />
    </div>
  );
}
