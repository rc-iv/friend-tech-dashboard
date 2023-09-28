import React, { useEffect, useState, useRef } from "react";
import Web3 from "web3";
import { contractAbi, bridgeAbi } from "./contractAbi";
// import { useWallet } from "../WalletContext/WalletContext"; // uncomment to enable gating
import SalesTable from "../SalesTable/SalesTable";
import DepositTable from "../DepositTable/DepositTable";
import {
  deepEqualArray,
  fetchUserInfo,
  filterEvents,
  fetchDepositor,
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
}

interface DepositTableProps {
  depositEvents: DepositEvent[];
  // Other props if necessary
}

const StreamTable: React.FC = () => {
  const [events, setEvents] = useState<TradeEvent[]>([]);
  const [pendingEvents, setPendingEvents] = useState<TradeEvent[]>([]);

  const [depositEvents, setDepositEvents] = useState<DepositEvent[]>([]);
  const [pendingDepositEvents, setPendingDepositEvents] = useState<
    DepositEvent[]
  >([]);

  const [subjectInfo, setSubjectInfo] = useState<Record<string, User>>({});
  const [traderInfo, setTraderInfo] = useState<Record<string, User>>({});
  const [depositorInfo, setDepositorInfo] = useState<Record<string, User>>({});

  // Uncomment to enable gating
  // const { walletAddress } = useWallet();

  /* Filters */
  const [ethFilterMin, setEthFilterMin] = useState<number | null>(null);
  const [ethFilterMax, setEthFilterMax] = useState<number | null>(null);

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

  const [selfTxnFilter, setSelfTxnFilter] = useState<boolean>(false);
  const [supplyOneFilter, setSupplyOneFilter] = useState<boolean>(false);

  const [notifications, setNotifications] = useState<boolean>(false);

  const [selectedTab, setSelectedTab] = useState<string>("All");
  /* End Filters */
  const handleTabClick = (tab: "Buy" | "Sell" | "Deposits" | "All") => {
    setSelectedTab(tab);
  };

  const providerUrl =
    "https://base.blockpi.network/v1/rpc/8bfe5dae92f901117832b75d348793bda33fe2a5";
  const web3 = new Web3(providerUrl);

  const fetchedAddresses = new Set(); // Add this line

  useEffect(() => {
    // if (!walletAddress) return; // uncomment to enable gating
    const contractAddress = "0xcf205808ed36593aa40a44f10c7f7c2f67d4a4d4";
    const contract = new web3.eth.Contract(contractAbi, contractAddress);

    const depositContractAddress = "0x4200000000000000000000000000000000000007";
    const depositContract = new web3.eth.Contract(
      bridgeAbi,
      depositContractAddress
    );

    //set poll interval to 3 seconds
    const pollInterval = 3000;

    const fetchEvents = async () => {
      try {
        const pastEvents = await (contract as any).getPastEvents("Trade", {
          fromBlock: "latest",
        });

        const newEvents = await Promise.all(
          pastEvents.map(async (event: any) => {
            const { returnValues, blockNumber, transactionHash } = event;
            const block = await web3.eth.getBlock(blockNumber);
            const timestamp = new Date(
              Number(block.timestamp) * 1000
            ).toLocaleTimeString();
            fetchUserInfo(
              web3,
              returnValues.subject,
              "subject",
              setSubjectInfo,
              setTraderInfo,
              fetchedAddresses,
              subjectInfo,
              traderInfo
            ); // Fetch additional info for each subject
            fetchUserInfo(
              web3,
              returnValues.trader,
              "trader",
              setSubjectInfo,
              setTraderInfo,
              fetchedAddresses,
              subjectInfo,
              traderInfo
            ); // Fetch additional info for each trader

            let ethAmountString = returnValues.ethAmount.toString(); // Convert BigInt to string
            let ethAmountNumber = parseFloat(ethAmountString); // Convert to Number for further calculations
            let ethAbs = Math.abs(
              parseFloat((ethAmountNumber / 1e18).toFixed(7))
            );

            // Color gradient coding based on size of trade
            if (ethAbs === 0) {
              return null;
            }
            let colorGradient = "500";
            if (ethAbs < 0.1) {
              colorGradient = "500";
            } else if (ethAbs < 0.3) {
              colorGradient = "700";
            } else {
              colorGradient = "900";
            }

            return {
              trader: returnValues.trader,
              subject: returnValues.subject,
              transactionType: returnValues.isBuy ? "Buy" : "Sell",
              shareAmount: returnValues.shareAmount.toString(),
              ethAmount: ethAbs.toString(),
              timestamp,
              transactionHash,
              colorGradient,
            };
          })
        );

        const filteredEvents = newEvents.filter((event) => event !== null);
        // Update pendingEvents instead of events directly
        setPendingEvents((prevPendingEvents) => [
          ...prevPendingEvents,
          ...filteredEvents,
        ]);
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };

    const fetchDepositEvents = async () => {
      try {
        const latestBlock = await web3.eth.getBlockNumber();
        const fromBlock = latestBlock - BigInt(200);
        const fromBlockHex = web3.utils.toHex(fromBlock);

        // Define the event signature for 'RelayedMessage'
        const eventSignature = web3.utils.sha3("RelayedMessage(bytes32)");

        // Create a filter for the event
        const eventFilterParams = {
          fromBlock: fromBlockHex,
          toBlock: "latest",
          address: "0x4200000000000000000000000000000000000007", // Your contract address
          topics: [eventSignature],
        };

        const events = await web3.eth.getPastLogs(eventFilterParams as any);

        const relayMessageABI = [
          { internalType: "uint256", name: "_nonce", type: "uint256" },
          { internalType: "address", name: "_sender", type: "address" },
          { internalType: "address", name: "_target", type: "address" },
          { internalType: "uint256", name: "_value", type: "uint256" },
          { internalType: "uint256", name: "_minGasLimit", type: "uint256" },
          { internalType: "bytes", name: "_message", type: "bytes" },
        ];

        const newDepositEvents = await Promise.all(
          events.map(async (event) => {
            const txnHash = (event as any).transactionHash;
            const txn = await web3.eth.getTransaction(txnHash);

            console.log(txn);
            // get eth value deposited
            let depositAmountString = txn.value.toString(); // Convert BigInt to string
            let depositAmountNumber = parseFloat(depositAmountString); // Convert to Number for further calculations
            let depositAbs = Math.abs(
              parseFloat((depositAmountNumber / 1e18).toFixed(7))
            ).toString();

            // Decode the message data
            const decodedData = web3.eth.abi.decodeParameters(
              relayMessageABI,
              txn.input.slice(10)
            );
            const messageData = decodedData._message;
            const targetAddress = "0x" + (messageData as any).slice(98, 138);
             
            if (!depositorInfo[targetAddress]) {
            // Fetch additional depositor information
            const depositorUser = await fetchDepositor(targetAddress, web3);

            setDepositorInfo((prevDepositorInfo) => ({
              ...prevDepositorInfo,
              [targetAddress]: depositorUser,
            }));
            }
            

            // Assuming you have a way to get a timestamp for the deposit
            const timestamp = new Date().toLocaleTimeString();

            // Create a new deposit event
            return {
              address: targetAddress,
              depositAmount: depositAbs, // Replace with actual deposit amount
              timestamp,
              transactionHash: txnHash,
            };
          })
        );

        // Update pendingDepositEvents instead of depositEvents directly
        setPendingDepositEvents((prevPendingDepositEvents) => [
          ...prevPendingDepositEvents,
          ...newDepositEvents,
        ]);
      } catch (error) {
        console.error("Error fetching deposit events:", error);
      }
    };

    fetchEvents();
    const poll = setInterval(fetchEvents, pollInterval);

    fetchDepositEvents();
    const pollDeposit = setInterval(fetchDepositEvents, pollInterval);

    return () => {
      clearInterval(poll);
      clearInterval(pollDeposit);
    };
  }, []); // add walletAddress as a dependency to enable gating

  // useEffect for moving fully loaded events from pendingEvents to events
  useEffect(() => {
    const fullyLoadedEvents = pendingEvents.filter((event) => {
      return subjectInfo[event.subject] && traderInfo[event.trader];
    });

    if (fullyLoadedEvents.length > 0) {
      setEvents((prevEvents) => {
        const combinedEvents = [...fullyLoadedEvents, ...prevEvents];
        return combinedEvents.slice(0, 1000);
      });

      setPendingEvents((prevPendingEvents) =>
        prevPendingEvents.filter((event) => !fullyLoadedEvents.includes(event))
      );
    }
  }, [pendingEvents, subjectInfo, traderInfo]);

  useEffect(() => {
    const fullyLoadedDepositEvents = pendingDepositEvents.filter((event) => {
      return depositorInfo[event.address];
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
        return combinedDepositEvents.slice(0, 1000);
      });

      setPendingDepositEvents((prevPendingDepositEvents) =>
        prevPendingDepositEvents.filter(
          (event) => !fullyLoadedDepositEvents.includes(event)
        )
      );
    }
  }, [pendingDepositEvents, depositorInfo]);

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
    subjectInfo,
    traderInfo,
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
    if (hasNewItems && Notification.permission === "granted" && notifications) {
      new Notification("New item added!", {
        body: "A new item has been added to your filtered table.",
      });
    }
  }, [filteredEvents]);

  return (
    <div className="flex-col text-white bg-black">
      <TableFilters
        ethFilterMin={ethFilterMin}
        setEthFilterMin={setEthFilterMin}
        ethFilterMax={ethFilterMax}
        setEthFilterMax={setEthFilterMax}
        selfTxnFilter={selfTxnFilter}
        setSelfTxnFilter={setSelfTxnFilter}
        supplyOneFilter={supplyOneFilter}
        setSupplyOneFilter={setSupplyOneFilter}
        notifications={notifications}
        setNotifications={setNotifications}
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
      {selectedTab === "Deposits" ? (
        <DepositTable
          depositEvents={depositEvents}
          depositorInfo={depositorInfo}
        />
      ) : (
        <SalesTable
          filteredEvents={filteredEvents}
          subjectInfo={subjectInfo}
          traderInfo={traderInfo}
        />
      )}
    </div>
  );
};

export default StreamTable;
