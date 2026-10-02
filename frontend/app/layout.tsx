import "./globals.css";
import { WalletProvider } from "./components/WalletProvider";
import { JetBrains_Mono } from "next/font/google";

const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-terminal-mono",
  weight: ["400", "500", "600"],
});

export const metadata = {
  title: "IMD Optimizer — The Agentic V4 Meta-Hook Protocol",
  description: "Autonomous MEV capture, elastic supply contraction, and retail-first value redistribution on Uniswap V4.",
  keywords: ["IMD Optimizer", "Uniswap V4", "MEV", "DeFi", "Web3", "hooks", "liquidity", "yield"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className={`${monoFont.variable} min-h-screen flex flex-col bg-[#0B0E14] antialiased`}>
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}