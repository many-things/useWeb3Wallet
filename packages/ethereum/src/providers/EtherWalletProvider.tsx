import WalletConnectProvider from "@walletconnect/web3-provider";
import { ReactNode, useEffect } from "react";
import { connectTo } from "../connectors";
import { EthereumWallet } from "../constants";
import { useProviderStore, useWalletConnectStore } from "../stores";

export type EtherWalletOptions = {
  walletConnectProvider?: WalletConnectProvider;
};

type EtherWalletProviderProps = {
  walletOptions?: EtherWalletOptions;
  children: ReactNode;
};

export const EtherWalletProvider = ({
  walletOptions,
  children,
}: EtherWalletProviderProps) => {
  const walletConnectProvider = walletOptions?.walletConnectProvider;

  const provider = useProviderStore((state) => state.provider);
  const currentWallet = useProviderStore((state) => state.currentWallet);
  const isLoading = useProviderStore((state) => state.isLoading);
  const setWalletState = useProviderStore((state) => state.setWalletState);
  const setLoading = useProviderStore((state) => state.setLoading);
  const setWalletConnectProvider = useWalletConnectStore(
    (state) => state.setWalletConnectProvider
  );

  useEffect(() => {
    setWalletConnectProvider(walletConnectProvider);
  }, [walletConnectProvider]);

  useEffect(() => {
    const isDisconnected = currentWallet === undefined;
    if (isDisconnected) {
      setLoading(false);
      return;
    }
  }, [currentWallet]);

  useEffect(() => {
    (async function isVisitAgain() {
      if (currentWallet !== undefined && isLoading) {
        switch (currentWallet) {
          case EthereumWallet.MetaMask:
            setWalletState({ provider: window.ethereum });
            break;
          case EthereumWallet.WalletConnect:
            setWalletState({ provider: walletConnectProvider });
            break;
          default:
            setLoading(false);
            return;
        }
        await connectTo(currentWallet);
        setLoading(false);
      }
    })();
  }, [currentWallet, isLoading]);

  useEffect(() => {
    if (provider !== undefined) {
      const handleAccountsChanged = (accounts: unknown) => {
        const account = (accounts as string[])[0];
        setWalletState({ account });
      };
      const handleDisconnect = () => {
        useProviderStore.persist.clearStorage();
      };

      provider.on("accountsChanged", handleAccountsChanged);
      provider.on("disconnect", handleDisconnect);

      return () => {
        provider.removeListener("accountsChanged", handleAccountsChanged);
        provider.removeListener("disconnect", handleDisconnect);
      };
    }
  }, [provider]);

  return <>{children}</>;
};
