import React, { useEffect, useState, useRef, useMemo } from "react";
import Web3 from "web3";
import SalesTable from "../SalesTable/SalesTable";
import DepositTable from "../DepositTable/DepositTable";
import {
  deepEqualArray,
  fetchUserInfo,
  filterEvents,
  fetchUser,
  filterDeposits,
  fetchTrades,
} from "./StreamDataProcessor";
import TableFilters from "../TableFilters/TableFilters";

interface TradeEvent {
  trader: string;
  subject: string;
  transactionType: string;
  shareAmount: string;
  ethAmount: string;
  timestamp: string;
  transactionHash: string;
  colorGradient: string;
}

interface User {
  twitterUsername: string;
  twitterName: string;
  twitterPfpUrl: string;
  id: string;
  address: string;
  twitterUserId: string;
  lastOnline: string;
  lastMessageTime: string;
  holderCount: string;
  holdingCount: string;
  watchlistCount: string;
  shareSupply: string;
  displayPrice: string;
  lifetimeFeesCollectedInWei: string;
  portfolio: Portfolio;
  ethBalance?: string;
  holders?: Holders;
  followerCount?: string;
  followingCount?: string;
  tweetCount?: string;
}

interface PortfolioUser {
  address: string;
  balance: string;
}

interface Holders {
  reciprocity: string;
  holdings: PortfolioUser;
}
// Define a new interface for Portfolio containing holdings and portfolioValueEth
interface Portfolio {
  holdings: PortfolioUser[];
  portfolioValueETH: string;
}

interface DepositEvent {
  address: string;
  depositAmount: string;
  timestamp: string;
  transactionHash: string;
  l1Address: string;
  l1Balance: string;
}

interface StreamTableProps {
  isSubscriber: boolean;
}
const StreamTable: React.FC<StreamTableProps> = ({ isSubscriber }) => {
  /* State Variables */
  const [events, setEvents] = useState<TradeEvent[]>([]);
  const [pendingEvents, setPendingEvents] = useState<TradeEvent[]>([]);

  const [fetchedAddresses, setFetchedAddresses] = useState<Set<string>>(
    new Set()
  );

  const [depositEvents, setDepositEvents] = useState<DepositEvent[]>([]);
  const [pendingDepositEvents, setPendingDepositEvents] = useState<
    DepositEvent[]
  >([]);

  const [userInfo, setUserInfo] = useState<Record<string, User>>({});

  /* End State Variables */

  /* Refs */
  const processedDepositTxHashes = useRef(new Set());

  /* Filters */
  const [ethFilterMin, setEthFilterMin] = useState<number | null>(null);
  const [ethFilterMax, setEthFilterMax] = useState<number | null>(null);

  const [depositEthFilterMin, setDepositEthFilterMin] = useState<number | null>(
    null
  );
  const [depositEthFilterMax, setDepositEthFilterMax] = useState<number | null>(
    null
  );

  const [traderETHFilter, setTraderETHFilter] = useState<number | null>(null);
  const [traderPortfolioFilter, setTraderPortfolioFilter] = useState<
    number | null
  >(null);
  const [traderReciprocityFilter, setTraderReciprocityFilter] = useState<
    number | null
  >(null);
  const [traderPriceMaxFilter, setTraderPriceMaxFilter] = useState<
    number | null
  >(null);

  const [subjectETHFilter, setSubjectETHFilter] = useState<number | null>(null);
  const [subjectPortfolioFilter, setSubjectPortfolioFilter] = useState<
    number | null
  >(null);
  const [subjectReciprocityFilter, setSubjectReciprocityFilter] = useState<
    number | null
  >(null);

  const [depositorETHFilter, setDepositorETHFilter] = useState<number | null>(
    null
  );
  const [depositorPortfolioFilter, setDepositorPortfolioFilter] = useState<
    number | null
  >(null);
  const [depositorReciprocityFilter, setDepositorReciprocityFilter] = useState<
    number | null
  >(null);
  // const [depositorPriceMaxFilter, setDepositorPriceMaxFilter] = useState<
  //   number | null
  // >(null);

  const [selfTxnFilter, setSelfTxnFilter] = useState<boolean>(false);
  const [supplyOneFilter, setSupplyOneFilter] = useState<boolean>(false);

  const [portfolioNotifications, setPortfolioNotifications] =
    useState<boolean>(false);
  const [depositNotifications, setDepositNotifications] =
    useState<boolean>(false);

  const [selectedTab, setSelectedTab] = useState<string>("All");
  /* End Filters */
  const handleTabClick = (tab: "Buy" | "Sell" | "Deposits" | "All") => {
    setSelectedTab(tab);
  };

  const providerUrl =
    "https://base.blockpi.network/v1/rpc/8bfe5dae92f901117832b75d348793bda33fe2a5";
  const web3 = new Web3(providerUrl);

  const mainNetProvider =
    "https://ethereum.blockpi.network/v1/rpc/c9061567b7574919c0022473a431e4d243daf4d5";
  const web3Main = new Web3(mainNetProvider);


  /* Use effect to fetch trades */
  useEffect(() => {
    const contractAddress = "0xcf205808ed36593aa40a44f10c7f7c2f67d4a4d4";

    let pollInterval = 30000;
    if (isSubscriber) {
      pollInterval = 30000;
      console.log("Thanks for subscribing!");
    }

    const fetchNewTrades = async () => {
      console.log("Fetching new trades...");
      try {
        const newTrades: TradeEvent[] = await fetchTrades(
          contractAddress,
          web3
        );

        for (const trade of newTrades) {
          const traderUserInfo = await fetchUser(trade.trader, web3);
          const subjectUserInfo = await fetchUser(trade.subject, web3);
          setUserInfo((prevUserInfo) => ({
            [trade.trader]: traderUserInfo,
            [trade.subject]: subjectUserInfo,
            ...prevUserInfo,
          }));
        }

        const existingTransactionHashes = new Set(
          events.map((e) => e.transactionHash)
        );
        const filteredEvents = newTrades.filter(
          (event) => !existingTransactionHashes.has(event.transactionHash)
        );
        // Update pendingEvents instead of events directly
        setPendingEvents((prevPendingEvents) => [
          ...prevPendingEvents,
          ...filteredEvents,
        ]);
      } catch (error) {
        console.error("Error fetching trades:", error);
      }
    };

    fetchNewTrades().catch((err) =>
      console.error(`Error fetching events: ${err}`)
    );

    const poll = setInterval(fetchNewTrades, pollInterval);
    return () => {
      clearInterval(poll);
    };
  }, [isSubscriber]);
  /* End use effect to fetch trades */


  /* Use effect to fetch deposit events */
  useEffect(() => {
    let pollInterval = 12000;
    if (isSubscriber) {
      pollInterval = 1000;
      console.log("Thanks for subscribing!");
    }
    const fetchDepositEvents = async () => {
      try {
        const latestBlock = await web3Main.eth.getBlockNumber();
        const fromBlock = latestBlock - BigInt(100);
        const fromBlockHex = web3.utils.toHex(fromBlock);

        const eventFilterParams = {
          fromBlock: fromBlockHex,
          toBlock: "latest",
          address: "0x3154Cf16ccdb4C6d922629664174b904d80F2C35",
        };

        const events = await web3Main.eth.getPastLogs(eventFilterParams as any);

        const newDepositEvents = await Promise.all(
          events.map(async (event) => {
            const txnHash = (event as any).transactionHash;

            // Skip processing if this event has already been processed
            if (processedDepositTxHashes.current.has(txnHash)) {
              return null;
            }

            // Mark this event as processed
            processedDepositTxHashes.current.add(txnHash);

            const depositBlock = (event as any).blockNumber;

            const targetAddress = "0x" + (event as any).topics[2].slice(26);
            const depositBlockDetails = await web3Main.eth.getBlock(
              depositBlock
            );
            const depositTimestamp = new Date(
              Number(depositBlockDetails.timestamp) * 1000
            ).toLocaleTimeString();

            // get eth value deposited
            const txn = await web3Main.eth.getTransaction(txnHash);
            let depositAmountString = txn.value.toString(); // Convert BigInt to string
            let depositAmountNumber = parseFloat(depositAmountString); // Convert to Number for further calculations
            let depositAbs = Math.abs(
              parseFloat((depositAmountNumber / 1e18).toFixed(7))
            ).toString();

            const l1Address = "0x" + (event as any).topics[1].slice(26);
            let l1Balance = "0";
            try {
              // user web3 to fetch eth balance of address
              const l1WeiBalance = await web3Main.eth.getBalance(l1Address);
              // convert to eth
              l1Balance = web3.utils.fromWei(l1WeiBalance, "ether");
              // truncate to 2 decimals
              l1Balance = parseFloat(l1Balance).toFixed(2).toString();
            } catch (error) {
              console.error(`Error fetching L1 balance: ${error}`);
            }
            if (!userInfo[targetAddress]) {
              // Fetch additional depositor information
              let depositorUser = await fetchUser(targetAddress, web3);

              if (depositorUser.twitterUsername !== "bot") {
                setUserInfo((prevUserInfo) => ({
                  [targetAddress]: depositorUser,
                  ...prevUserInfo,
                }));
              }
            } else {
              console.log(
                `Depositor info already fetched for ${targetAddress}`
              );
            }

            // Create a new deposit event
            return {
              address: targetAddress,
              depositAmount: depositAbs,
              timestamp: depositTimestamp,
              transactionHash: txnHash,
              l1Address,
              l1Balance,
            };
          })
        );

        // Remove null values and update your state
        const filteredNewDepositEvents = newDepositEvents.filter(
          (e) => e !== null
        ) as DepositEvent[];
        setPendingDepositEvents((prevPendingDepositEvents) => [
          ...prevPendingDepositEvents,
          ...filteredNewDepositEvents,
        ]);
      } catch (error) {
        console.error("Error fetching deposit events:", error);
      }
    };

    fetchDepositEvents().catch((err) =>
      console.error(`Error fetching deposit events: ${err}`)
    ); // Fetch deposit events on page load
    const pollDeposit = setInterval(fetchDepositEvents, pollInterval);

    return () => {
      clearInterval(pollDeposit);
    };
  }, [isSubscriber]);
  /* End use effect to fetch deposit events */

  // useEffect for moving fully loaded events from pendingEvents to events also filters out duplicate events
  useEffect(() => {
    // Create a Set containing all the transactionHashes of existing events
    const existingTransactionHashes = new Set(
      events.map((event) => event.transactionHash)
    );

    // Filter out any new events that already exist based on their transactionHash
    const uniqueNewEvents = pendingEvents.filter(
      (event) => !existingTransactionHashes.has(event.transactionHash)
    );

    // Filter out events where either trader or subject information is missing
    const validNewEvents = uniqueNewEvents.filter((event) => {
      return userInfo[event.trader] && userInfo[event.subject];
    });

    if (validNewEvents.length > 0) {
      // set events to add new events and slice it to 500

      setEvents((prevEvents) => {
        const combinedEvents = [...validNewEvents, ...prevEvents];
        return combinedEvents.slice(0, 500);
      });

      setPendingEvents((prevPendingEvents) =>
        prevPendingEvents.filter((event) => !validNewEvents.includes(event))
      );
    }
  }, [pendingEvents, userInfo]);

  // use effect for moving fully loaded deposit events from pendingDepositEvents to depositEvents
  useEffect(() => {
    const fullyLoadedDepositEvents = pendingDepositEvents.filter((event) => {
      return userInfo[event.address];
    });

    if (fullyLoadedDepositEvents.length > 0) {
      setDepositEvents((prevDepositEvents) => {
        // Create a Set containing all the transactionHashes of existing deposit events
        const existingTransactionHashes = new Set(
          prevDepositEvents.map((event) => event.transactionHash)
        );

        // Filter out any new events that already exist based on their transactionHash
        const uniqueNewEvents = fullyLoadedDepositEvents.filter(
          (event) => !existingTransactionHashes.has(event.transactionHash)
        );

        const combinedDepositEvents = [
          ...uniqueNewEvents,
          ...prevDepositEvents,
        ];
        return combinedDepositEvents.slice(0, 500);
      });

      setPendingDepositEvents((prevPendingDepositEvents) =>
        prevPendingDepositEvents.filter(
          (event) => !fullyLoadedDepositEvents.includes(event)
        )
      );
    }
  }, [pendingDepositEvents, userInfo]);

  //notifications for new events based on filters
  useEffect(() => {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        console.log("Notification permission granted.");
      } else {
        console.log("Unable to get permission to notify.");
      }
    });
  }, []);

  // Filter events based on selected filters
  const filteredEvents = filterEvents(
    events,
    userInfo,
    selectedTab,
    ethFilterMin,
    ethFilterMax,
    traderETHFilter,
    traderPortfolioFilter,
    traderReciprocityFilter,
    traderPriceMaxFilter,
    subjectETHFilter,
    subjectPortfolioFilter,
    subjectReciprocityFilter,
    selfTxnFilter,
    supplyOneFilter
  );
  const prevFilteredEventsRef = useRef<TradeEvent[]>([]);

  useEffect(() => {
    // Check if filteredEvents has new items compared to the previous snapshot
    const hasNewItems = !deepEqualArray(
      filteredEvents,
      prevFilteredEventsRef.current
    );

    // Update the snapshot
    prevFilteredEventsRef.current = filteredEvents;

    // If there are new items, show a notification
    if (
      hasNewItems &&
      Notification.permission === "granted" &&
      portfolioNotifications
    ) {
      new Notification("New item added!", {
        body: "A new trade has been found.",
      });
    }
  }, [filteredEvents, portfolioNotifications]);

  // filter deposit events based on selected filters
  const filteredDepositEvents = useMemo(() => {
    return filterDeposits(
      depositEvents,
      userInfo,
      depositEthFilterMin,
      depositEthFilterMax,
      depositorPortfolioFilter,
      depositorETHFilter,
      depositorReciprocityFilter
    );
  }, [
    depositEvents,
    userInfo,
    depositEthFilterMin,
    depositEthFilterMax,
    depositorPortfolioFilter,
    depositorETHFilter,
    depositorReciprocityFilter,
  ]);

  const prevFilteredDepositEventsRef = useRef<DepositEvent[]>([]);
  useEffect(() => {
    // Check if filteredDepositEvents has new items compared to the previous snapshot
    const hasNewItems = !deepEqualArray(
      filteredDepositEvents,
      prevFilteredDepositEventsRef.current
    );

    // Update the snapshot
    prevFilteredDepositEventsRef.current = filteredDepositEvents;

    // If there are new items, show a notification
    if (
      hasNewItems &&
      Notification.permission === "granted" &&
      depositNotifications
    ) {
      new Notification("New item added!", {
        body: "A new deposit has been added.",
      });
    }
  }, [filteredDepositEvents, depositNotifications]);

  return (
    <div className="flex-col text-white bg-black overflow-x-hidden overflow-y-hidden">
      <TableFilters
        ethFilterMin={ethFilterMin}
        setEthFilterMin={setEthFilterMin}
        ethFilterMax={ethFilterMax}
        setEthFilterMax={setEthFilterMax}
        selfTxnFilter={selfTxnFilter}
        setSelfTxnFilter={setSelfTxnFilter}
        supplyOneFilter={supplyOneFilter}
        setSupplyOneFilter={setSupplyOneFilter}
        portfolioNotifications={portfolioNotifications}
        setPortfolioNotifications={setPortfolioNotifications}
        depositNotifications={depositNotifications}
        setDepositNotifications={setDepositNotifications}
        traderETHFilter={traderETHFilter}
        setTraderETHFilter={setTraderETHFilter}
        traderPortfolioFilter={traderPortfolioFilter}
        setTraderPortfolioFilter={setTraderPortfolioFilter}
        traderReciprocityFilter={traderReciprocityFilter}
        setTraderReciprocityFilter={setTraderReciprocityFilter}
        traderPriceMaxFilter={traderPriceMaxFilter}
        setTraderPriceMaxFilter={setTraderPriceMaxFilter}
        subjectETHFilter={subjectETHFilter}
        setSubjectETHFilter={setSubjectETHFilter}
        subjectPortfolioFilter={subjectPortfolioFilter}
        setSubjectPortfolioFilter={setSubjectPortfolioFilter}
        subjectReciprocityFilter={subjectReciprocityFilter}
        setSubjectReciprocityFilter={setSubjectReciprocityFilter}
        handleTabClick={handleTabClick}
        selectedTab={selectedTab}
        depositEthFilterMin={depositEthFilterMin}
        setDepositEthFilterMin={setDepositEthFilterMin}
        depositEthFilterMax={depositEthFilterMax}
        setDepositEthFilterMax={setDepositEthFilterMax}
        depositorETHFilter={depositorETHFilter}
        setDepositorETHFilter={setDepositorETHFilter}
        depositorPortfolioFilter={depositorPortfolioFilter}
        setDepositorPortfolioFilter={setDepositorPortfolioFilter}
        depositorReciprocityFilter={depositorReciprocityFilter}
        setDepositorReciprocityFilter={setDepositorReciprocityFilter}
      />
      <div className="flex justify-center">
        <button
          className={
            selectedTab === "All"
              ? "bg-gray-800 rounded-t-md w-20"
              : "bg-gray-500 rounded-t-md w-20"
          }
          onClick={() => handleTabClick("All")}
        >
          All
        </button>
        <button
          className={
            selectedTab === "Buy"
              ? "bg-gray-800 rounded-t-md w-20"
              : "bg-gray-500 rounded-t-md w-20"
          }
          onClick={() => handleTabClick("Buy")}
        >
          Buy
        </button>
        <button
          className={
            selectedTab === "Sell"
              ? "bg-gray-800 rounded-t-md w-20"
              : "bg-gray-500 rounded-t-md w-20"
          }
          onClick={() => handleTabClick("Sell")}
        >
          Sell
        </button>
        <button
          className={
            selectedTab === "Deposits"
              ? "bg-gray-800 rounded-t-md w-20"
              : "bg-gray-500 rounded-t-md w-20"
          }
          onClick={() => handleTabClick("Deposits")}
        >
          Deposits
        </button>
      </div>
      <div className="overflow-x-auto overflow-y-auto h-1/2">
        {selectedTab === "Deposits" ? (
          <DepositTable
            depositEvents={filteredDepositEvents}
            depositorInfo={userInfo}
          />
        ) : (
          <SalesTable filteredEvents={filteredEvents} userInfo={userInfo} />
        )}
      </div>
    </div>
  );
};

export default StreamTable;
