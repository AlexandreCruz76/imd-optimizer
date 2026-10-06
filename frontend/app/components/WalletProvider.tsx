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
  walletName: string;
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
  walletName: "MetaMask",
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
  const [walletName, setWalletName] = useState<string>("MetaMask");
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [injected, setInjected] = useState<Eip1193 | null>(null);

  const connected = !!address;

  // Detecção: MetaMask real (EIP-6963 rdns io.metamask) tem prioridade;
  // outros providers anunciados (Phantom, Coinbase…) viram fallback antes de
  // window.ethereum (a Phantom se finge de MetaMask lá)
  useEffect(() => {
    let done = false;
    let fallback: Eip1193 | null = null;
    let fallbackName = "Carteira";
    const w = window.ethereum as
      | (Eip1193 & { isPhantom?: boolean })
      | undefined;
    const pick = (p: Eip1193 | null | undefined, name: string) => {
      if (done || !p) return;
      done = true;
      setInjected(p);
      setWalletName(name);
    };
    const onAnnounce = (evt: Event) => {
      const d = (evt as CustomEvent).detail as
        | { info?: { rdns?: string; name?: string }; provider?: Eip1193 }
        | undefined;
      if (!d?.provider) return;
      const rdns = d.info?.rdns ?? "";
      const isRealMM =
        rdns === "io.metamask" || rdns.endsWith(".io.metamask") || rdns === "io.metamask.flask";
      if (isRealMM) {
        pick(d.provider, d.info?.name || "MetaMask");
      } else if (!fallback) {
        fallback = d.provider;
        fallbackName = rdns.startsWith("app.phantom")
          ? "Phantom"
          : rdns.includes("coinbase")
          ? "Coinbase Wallet"
          : rdns.includes("rainbow")
          ? "Rainbow"
          : d.info?.name || "Carteira";
      }
    };
    window.addEventListener("eip6963:announceProvider", onAnnounce);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    // fallback após esperar os anúncios EIP-6963
    const t = setTimeout(() => {
      if (!done) {
        if (fallback) {
          pick(fallback, fallbackName);
        } else {
          const name =
            w?.isPhantom || (window as { phantom?: unknown }).phantom
              ? "Phantom"
              : w?.isMetaMask
              ? "MetaMask"
              : "Carteira";
          pick(w ?? null, name);
        }
      }
      window.removeEventListener("eip6963:announceProvider", onAnnounce);
    }, 250);
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
        "Nenhuma carteira detectada — instale a MetaMask em metamask.io/download e recarregue a página."
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
      const rawMsg = (err as Error)?.message ?? "";
      if (code === 4001) {
        setWalletError(
          `Conexão rejeitada no ${walletName} — clique de novo e aprove no popup da extensão.`
        );
      } else if (code === -32002) {
        setWalletError(
          `${walletName} já tem um pedido pendente — abra a extensão e aprove a solicitação.`
        );
      } else if (/unexpected|context invalidated|could not establish connection/i.test(rawMsg)) {
        setWalletError(
          `Erro da extensão ${walletName}: "${rawMsg.slice(0, 80)}" — desbloqueie a carteira, atualize/recarregue a extensão e tente de novo.`
        );
      } else {
        setWalletError(
          `Falha ao conectar no ${walletName}: ${
            rawMsg.slice(0, 120) || "erro desconhecido"
          }`
        );
      }
      console.error("Connection failed:", err);
    } finally {
      setConnecting(false);
    }
  }, [injected, applySession, walletName]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setChainId(null);
    setBalance("0");
    setProvider(null);
    setSigner(null);
    setWalletError(null);
  }, []);

  const switchChain = useCallback(
    async (targetChainId: number) => {
      // Usa o provider ESCOLHIDO (ex.: MetaMask via EIP-6963), não
      // window.ethereum — que pode ser outra extensão (Phantom) e falhar.
      const p = injected ?? (window.ethereum as Eip1193 | undefined) ?? null;
      if (!p) {
        setWalletError("Nenhuma carteira detectada para trocar de rede.");
        return;
      }
      const hexId = `0x${targetChainId.toString(16)}`;
      try {
        await p.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: hexId }],
        });
        setChainId(targetChainId);
        setWalletError(null);
      } catch (err) {
        const e = err as { code?: number; message?: string };
        const rawMsg = e.message ?? "";
        // Rede desconhecida na carteira (4902/4900) — adiciona a Sepolia
        if ((e.code === 4902 || e.code === 4900) && targetChainId === 11155111) {
          try {
            await p.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: hexId,
                  chainName: "Sepolia",
                  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
                  rpcUrls: ["https://ethereum-sepolia-rpc.publicnode.com"],
                  blockExplorerUrls: ["https://sepolia.etherscan.io"],
                },
              ],
            });
            setChainId(targetChainId);
            setWalletError(null);
            return;
          } catch (err2) {
            const raw2 = (err2 as Error)?.message ?? "";
            setWalletError(
              `Falha ao adicionar a Sepolia no ${walletName}: ${raw2.slice(0, 120) || "erro desconhecido"}`
            );
            console.error("Chain add failed:", err2);
            return;
          }
        }
        if (e.code === 4001) {
          setWalletError(`Troca de rede rejeitada no ${walletName}.`);
        } else if (e.code === -32002) {
          setWalletError(`${walletName} já tem um pedido pendente — abra a extensão.`);
        } else if (/unexpected|context invalidated/i.test(rawMsg)) {
          setWalletError(
            `Erro da extensão ${walletName} — desbloqueie a carteira, recarregue a página e tente de novo.`
          );
        } else {
          setWalletError(
            `Falha ao trocar de rede no ${walletName}: ${rawMsg.slice(0, 120) || "erro desconhecido"}`
          );
        }
        console.error("Chain switch failed:", err);
      }
    },
    [injected, walletName]
  );

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
        walletName,
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
