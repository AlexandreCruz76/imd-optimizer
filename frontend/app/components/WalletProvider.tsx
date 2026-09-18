"use client";

import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { ethers } from "ethers";
import { SEPOLIA_CONFIG } from "@/lib/contract-config";

interface WalletContextType {
  address: string | null;
  chainId: number | null;
  balance: string;
  connected: boolean;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchChain: (chainId: number) => Promise<void>;
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
}

const WalletContext = createContext<WalletContextType>({
  address: null,
  chainId: null,
  balance: "0",
  connected: false,
  connecting: false,
  connect: async () => {},
  disconnect: () => {},
  switchChain: async () => {},
  provider: null,
  signer: null,
});

export function useWallet() {
  return useContext(WalletContext);
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [balance, setBalance] = useState("0");
  const [connecting, setConnecting] = useState(false);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);

  const connected = !!address;

  const connect = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      alert("Instale MetaMask ou outro wallet");
      return;
    }

    setConnecting(true);
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const chain = await window.ethereum.request({
        method: "eth_chainId",
      });
      const bal = await window.ethereum.request({
        method: "eth_getBalance",
        params: [accounts[0], "latest"],
      });

      // Criar provider e signer ethers
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const web3Signer = await web3Provider.getSigner();

      setAddress(accounts[0]);
      setChainId(parseInt(chain as string, 16));
      setBalance((parseInt(bal as string, 16) / 1e18).toFixed(4));
      setProvider(web3Provider);
      setSigner(web3Signer);
    } catch (err) {
      console.error("Connection failed:", err);
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setChainId(null);
    setBalance("0");
    setProvider(null);
    setSigner(null);
  }, []);

  const switchChain = useCallback(async (targetChainId: number) => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
      setChainId(targetChainId);
    } catch (err) {
      console.error("Chain switch failed:", err);
    }
  }, []);

  // Escutar mudanças de conta/chain
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAddress(accounts[0]);
      }
    };

    const handleChainChanged = (chain: string) => {
      setChainId(parseInt(chain, 16));
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
    };
  }, [disconnect]);

  return (
    <WalletContext.Provider
      value={{ address, chainId, balance, connected, connecting, connect, disconnect, switchChain, provider, signer }}
    >
      {children}
    </WalletContext.Provider>
  );
}

// Estender Window para ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}
