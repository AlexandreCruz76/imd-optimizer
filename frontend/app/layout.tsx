import "./globals.css";
import { WalletProvider } from "./components/WalletProvider";
import { AppShell } from "./components/AppShell";
import { JetBrains_Mono, Inter } from "next/font/google";

const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-terminal-mono",
  weight: ["400", "500", "600", "700"],
});

const sansFont = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600"],
});

export const metadata = {
  title: "IMD Optimizer — The Agentic V4 Meta-Hook Protocol",
  description: "Autonomous MEV capture, elastic supply contraction, and retail-first value redistribution on Uniswap V4.",
  keywords: ["IMD Optimizer", "Uniswap V4", "MEV", "DeFi", "Web3", "hooks", "liquidity", "yield"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body
        className={`${monoFont.variable} ${sansFont.variable} min-h-screen flex flex-col bg-[#070A0F] antialiased`}
        suppressHydrationWarning
      >
        <WalletProvider>
          <AppShell>{children}</AppShell>
        </WalletProvider>
      </body>
    </html>
  );
}