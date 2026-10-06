"use client";

import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { ethers } from "ethers";

type Eip1193 = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (payload: unknown) => void) => void;
  removeListener?: (event: string, handler: (payload: unknown) => void) => void;
  isMetaMask?: boolean;
};

interface WalletContextType {
  address: string | null;
  chainId: number | null;
  balance: string;
  connected: boolean;
  connecting: boolean;
  walletError: string | null;
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
  walletError: null,
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
  const [walletError, setWalletError] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [injected, setInjected] = useState<Eip1193 | null>(null);

  const connected = !!address;

  // Detecção: prefere MetaMask (EIP-6963), senão window.ethereum
  useEffect(() => {
    let done = false;
    const w = window.ethereum as Eip1193 | undefined;
    const pick = (p: Eip1193 | null | undefined) => {
      if (done || !p) return;
      done = true;
      setInjected(p);
    };
    if (w?.isMetaMask) pick(w);
    const onAnnounce = (evt: Event) => {
      const d = (evt as CustomEvent).detail as
        | { info?: { rdns?: string; name?: string }; provider?: Eip1193 }
        | undefined;
      if (!d?.provider) return;
      const isMM =
        /metamask/i.test(d.info?.rdns ?? "") ||
        /metamask/i.test(d.info?.name ?? "") ||
        d.provider.isMetaMask === true;
      if (isMM) pick(d.provider);
    };
    window.addEventListener("eip6963:announceProvider", onAnnounce);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    const t = setTimeout(() => {
      if (!done) pick(w ?? null);
      window.removeEventListener("eip6963:announceProvider", onAnnounce);
    }, 150);
    return () => {
      clearTimeout(t);
      window.removeEventListener("eip6963:announceProvider", onAnnounce);
    };
  }, []);

  const applySession = useCallback(async (addr: string, p: Eip1193) => {
    try {
      const chain = String(await p.request({ method: "eth_chainId" }));
      const bal = String(
        await p.request({ method: "eth_getBalance", params: [addr, "latest"] })
      );
      const web3Provider = new ethers.BrowserProvider(
        p as unknown as ethers.Eip1193Provider
      );
      const web3Signer = await web3Provider.getSigner();
      setAddress(addr);
      setChainId(parseInt(chain, 16));
      setBalance((parseInt(bal, 16) / 1e18).toFixed(4));
      setProvider(web3Provider);
      setSigner(web3Signer);
      setWalletError(null);
    } catch (err) {
      console.error("applySession failed:", err);
    }
  }, []);

  const connect = useCallback(async () => {
    const p = injected ?? (window.ethereum as Eip1193 | undefined) ?? null;
    if (!p) {
      setWalletError(
        "MetaMask não detectado — instale a extensão em metamask.io/download e recarregue a página."
      );
      return;
    }

    setConnecting(true);
    setWalletError(null);
    try {
      const accounts = (await p.request({
        method: "eth_requestAccounts",
      })) as string[];
      if (!accounts?.length) {
        throw Object.assign(new Error("Nenhuma conta autorizada."), {
          code: 0,
        });
      }
      setInjected(p);
      await applySession(accounts[0], p);
    } catch (err) {
      const code = (err as { code?: number }).code;
      if (code === 4001) {
        setWalletError(
          "Conexão rejeitada no MetaMask — clique de novo e aprove no popup da extensão."
        );
      } else if (code === -32002) {
        setWalletError(
          "MetaMask já tem um pedido pendente — abra a extensão e aprove a solicitação."
        );
      } else {
        setWalletError(
          `Falha ao conectar no MetaMask: ${
            (err as Error)?.message?.slice(0, 120) ?? "erro desconhecido"
          }`
        );
      }
      console.error("Connection failed:", err);
    } finally {
      setConnecting(false);
    }
  }, [injected, applySession]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setChainId(null);
    setBalance("0");
    setProvider(null);
    setSigner(null);
    setWalletError(null);
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

  // Reconexão silenciosa (sem popup) se a carteira já autorizou antes
  useEffect(() => {
    if (!injected) return;
    let alive = true;
    (async () => {
      try {
        const accounts = (await injected.request({
          method: "eth_accounts",
        })) as string[];
        if (
          alive &&
          Array.isArray(accounts) &&
          accounts.length > 0 &&
          !address
        ) {
          await applySession(accounts[0], injected);
        }
      } catch {}
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [injected, applySession]);

  // Listeners de conta/chain no provedor escolhido
  useEffect(() => {
    if (!injected?.on || !injected.removeListener) return;
    const onAcc = (payload: unknown) => {
      const accs = payload as string[];
      if (!Array.isArray(accs) || accs.length === 0) {
        disconnect();
      } else {
        void applySession(accs[0], injected);
      }
    };
    const onChain = (payload: unknown) => {
      setChainId(parseInt(String(payload), 16));
    };
    injected.on("accountsChanged", onAcc);
    injected.on("chainChanged", onChain);
    return () => {
      injected.removeListener?.("accountsChanged", onAcc);
      injected.removeListener?.("chainChanged", onChain);
    };
  }, [injected, disconnect, applySession]);

  return (
    <WalletContext.Provider
      value={{
        address,
        chainId,
        balance,
        connected,
        connecting,
        walletError,
        connect,
        disconnect,
        switchChain,
        provider,
        signer,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

// Extend Window for ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}
