import "./globals.css";
import { WalletProvider } from "./components/WalletProvider";

export const metadata = {
  title: "IMD Optimizer — The Agentic V4 Meta-Hook Protocol",
  description: "Autonomous MEV capture, elastic supply contraction, and retail-first value redistribution on Uniswap V4.",
  keywords: ["IMD Optimizer", "Uniswap V4", "MEV", "DeFi", "Web3", "hooks", "liquidity", "yield"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen flex flex-col bg-[#0B0E14] antialiased">
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}