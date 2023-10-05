import React, { useState, useEffect, useMemo } from "react";
import Header from "./components/Header/Header";
import StreamTable from "./components/StreamTable/StreamTable";
import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { configureChains, createConfig, WagmiConfig, useAccount } from "wagmi";
import { base } from "wagmi/chains";
import { publicProvider } from "wagmi/providers/public";
import axios from "axios";

const { chains, publicClient } = configureChains([base], [publicProvider()]);

const { connectors } = getDefaultWallets({
  appName: "FT Feed",
  projectId: "63e6961d6dad67a1e8a869080aff547c",
  chains,
});

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

const fetchHolders: any = async (
  address: string,
  nextPageStart: number = 0,
  accumulatedHolders: any[] = []
) => {
  let url = `https://prod-api.kosetto.com/users/${address}/token/holders?pageStart=${nextPageStart}`;
  if (nextPageStart === 0) {
    url = `https://prod-api.kosetto.com/users/${address}/token/holders`;
  }
  const holdersResponse = await axios.get(url);
  const newHolders = holdersResponse.data.users;
  const nextStart = holdersResponse.data.nextPageStart;

  console.log(
    `Fetched ${newHolders.length} holdings for ${address} starting at ${nextPageStart}`
  );

  accumulatedHolders.push(...newHolders);

  // Base case: stop when we receive fewer than 50 holdings or an empty list
  if (newHolders.length < 50 || newHolders.length === 0) {
    return accumulatedHolders;
  }

  // Recursive case: fetch the next page
  return await fetchHolders(address, nextStart, accumulatedHolders);
};


interface AccountInfoProps {
  setIsSubscriber: React.Dispatch<React.SetStateAction<boolean>>;
  isSubscriber: boolean;
}

const AccountInfo: React.FC<AccountInfoProps> = ({
  isSubscriber,
  setIsSubscriber,
}) => {
  const addressObj = useAccount(); // I assume useAccount returns an object, hence naming it addressObj
  const address = addressObj?.address?.toLowerCase() || ""; // Safely extracting the address

  useEffect(() => {
    // This will run when the component first mounts
    (async () => {
      if (!address) {
        setIsSubscriber(false);
        return; // If there's no address, return early
      }
      const subscriberCheck = await axios.get(`https://3lnsypz0we.execute-api.us-east-1.amazonaws.com/Prod/subscriber/${address}`)
      console.log(`subscriberCheck: ${JSON.stringify(subscriberCheck)}`);
      console.log(`subscriberCheck.data.isSubscriber: ${subscriberCheck.data.isSubscriber}`);
      setIsSubscriber(subscriberCheck.data.isSubscriber);
    })();
  }, [address, setIsSubscriber]); // Re-run the effect if either address or subscribers change

  return null;
};

const App: React.FC = () => {
  const [isSubscriber, setIsSubscriber] = useState(false);
  return (
    <React.StrictMode>
      <div className="bg-black">
        <div>
          <WagmiConfig config={wagmiConfig}>
            <RainbowKitProvider chains={chains}>
              <AccountInfo
                isSubscriber={isSubscriber}
                setIsSubscriber={setIsSubscriber}
              />
              <Header isSubscriber={isSubscriber}/>
              <StreamTable isSubscriber={isSubscriber} />
            </RainbowKitProvider>
          </WagmiConfig>
        </div>
      </div>
    </React.StrictMode>
  );
};

export default App;
