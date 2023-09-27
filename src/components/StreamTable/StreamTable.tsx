import React, { useEffect, useState, useRef } from "react";
import Web3 from "web3";
import contractAbi from "./contractAbi";
import { useWallet } from "../WalletContext/WalletContext"; // adjust the import path accordingly
import logoEther from "../../assets/images/ether-logo.png";
import logoFtech from "../../assets/images/ftech-logo.png";
import logoX from "../../assets/images/X-Logo.png";

const colorMap = {
  green: {
    900: "bg-green-900",
    700: "bg-green-700",
    500: "bg-green-500",
    300: "bg-green-300",
  },
  red: {
    900: "bg-red-900",
    700: "bg-red-700",
    500: "bg-red-500",
    300: "bg-red-300",
  },
};

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

const deepEqualArray = (arr1: any[], arr2: any[]) => {
  if (arr1.length !== arr2.length) return false;

  for (let i = 0; i < arr1.length; i++) {
    if (JSON.stringify(arr1[i]) !== JSON.stringify(arr2[i])) {
      return false;
    }
  }

  return true;
};

const StreamTable: React.FC = () => {
  const [events, setEvents] = useState<TradeEvent[]>([]);
  const [pendingEvents, setPendingEvents] = useState<TradeEvent[]>([]);

  const [subjectInfo, setSubjectInfo] = useState<Record<string, User>>({});
  const [traderInfo, setTraderInfo] = useState<Record<string, User>>({});
  const { walletAddress } = useWallet();

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
  const handleTabClick = (tab: "Buy" | "Sell" | "All") => {
    setSelectedTab(tab);
  };

  const providerUrl =
    "https://base.blockpi.network/v1/rpc/8bfe5dae92f901117832b75d348793bda33fe2a5";
  const web3 = new Web3(providerUrl);

  const fetchUserInfo = async (
    address: string,
    target: "subject" | "trader"
  ) => {
    try {
      // Check if the user info for this address has already been fetched
      const alreadyFetched =
        (target === "trader" && traderInfo[address]) ||
        (target === "subject" && subjectInfo[address]);

      if (alreadyFetched) {
        return; // Skip fetching if already fetched
      }

      // user web3 to fetch eth balance of address
      const weiBalance = await web3.eth.getBalance(address);
      // convert to eth
      const ethBalanceString = web3.utils.fromWei(weiBalance, "ether");
      // truncate to 2 decimal places
      const ethBalance = parseFloat(ethBalanceString).toFixed(2);

      const url = `https://3lnsypz0we.execute-api.us-east-1.amazonaws.com/Prod/user/${address}`;
      const response = await fetch(url);
      const user = await response.json();
      const userData = user.userData;
      userData.ethBalance = ethBalance;
      if (target === "trader")
        setTraderInfo((prevInfo) => ({
          ...prevInfo,
          [address]: userData,
        }));
      else {
        setSubjectInfo((prevInfo) => ({
          ...prevInfo,
          [address]: userData,
        }));
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
    }
  };

  useEffect(() => {
    // if (!walletAddress) return;
    const contractAddress = "0xcf205808ed36593aa40a44f10c7f7c2f67d4a4d4";
    const contract = new web3.eth.Contract(contractAbi, contractAddress);
    //set poll interval to 3 seconds

    const pollInterval = 8000;

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
            fetchUserInfo(returnValues.subject, "subject"); // Fetch additional info for each subject
            fetchUserInfo(returnValues.trader, "trader");

            let ethAmountString = returnValues.ethAmount.toString(); // Convert BigInt to string
            let ethAmountNumber = parseFloat(ethAmountString); // Convert to Number for further calculations
            let ethAbs = Math.abs(
              parseFloat((ethAmountNumber / 1e18).toFixed(7))
            );

            if (ethAbs == 0) {
              return null;
            }
            let colorGradient = "500"; // Default value

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

    fetchEvents();
    const poll = setInterval(fetchEvents, pollInterval);

    return () => clearInterval(poll);
  }, [walletAddress]);

  // useeffect hook to move pending events to events
  // New useEffect for moving fully loaded events from pendingEvents to events
  useEffect(() => {
    const fullyLoadedEvents = pendingEvents.filter((event) => {
      return subjectInfo[event.subject] && traderInfo[event.trader];
    });

    if (fullyLoadedEvents.length > 0) {
      setEvents((prevEvents) => {
        const combinedEvents = [...fullyLoadedEvents, ...prevEvents];
        return combinedEvents.slice(0, 100);
      });

      setPendingEvents((prevPendingEvents) =>
        prevPendingEvents.filter((event) => !fullyLoadedEvents.includes(event))
      );
    }
  }, [pendingEvents, subjectInfo, traderInfo]);

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
  let filteredEvents = events;
  const prevFilteredEventsRef = useRef<TradeEvent[]>([]);

  let conditions: Array<(event: TradeEvent) => boolean> = [];

  if (selectedTab !== "All") {
    conditions.push((event) => event.transactionType === selectedTab);
  }

  if (ethFilterMin !== null) {
    conditions.push((event) => parseFloat(event.ethAmount) >= ethFilterMin);
  }
  if (ethFilterMax !== null) {
    conditions.push((event) => parseFloat(event.ethAmount) <= ethFilterMax);
  }

  if (traderPortfolioFilter) {
    conditions.push((event) => {
      const portfolioValue = parseFloat(
        traderInfo[event.trader]?.portfolio?.portfolioValueETH || "0"
      );
      return portfolioValue >= traderPortfolioFilter;
    });
  }

  if (traderETHFilter) {
    conditions.push((event) => {
      const ethBalance = parseFloat(
        traderInfo[event.trader]?.ethBalance || "0"
      );
      return ethBalance >= traderETHFilter;
    });
  }

  if (traderReciprocityFilter) {
    conditions.push((event) => {
      const reciprocity = parseFloat(
        traderInfo[event.trader]?.holders?.reciprocity || "0"
      );
      return reciprocity >= traderReciprocityFilter;
    });
  }

  if (traderPriceMaxFilter) {
    conditions.push((event) => {
      const price = parseFloat(traderInfo[event.trader]?.displayPrice || "0");
      return price <= traderPriceMaxFilter;
    });
  }

  if (subjectPortfolioFilter) {
    conditions.push((event) => {
      const portfolioValue = parseFloat(
        subjectInfo[event.subject]?.portfolio?.portfolioValueETH || "0"
      );
      return portfolioValue >= subjectPortfolioFilter;
    });
  }

  if (subjectETHFilter) {
    conditions.push((event) => {
      const ethBalance = parseFloat(
        subjectInfo[event.subject]?.ethBalance || "0"
      );
      return ethBalance >= subjectETHFilter;
    });
  }

  if (subjectReciprocityFilter) {
    conditions.push((event) => {
      const reciprocity = parseFloat(
        subjectInfo[event.subject]?.holders?.reciprocity || "0"
      );
      return reciprocity >= subjectReciprocityFilter;
    });
  }

  if (selfTxnFilter) {
    conditions.push((event) => event.trader === event.subject);
  }

  if (supplyOneFilter) {
    conditions.push((event) => {
      const subjectShareSupply = parseFloat(
        subjectInfo[event.subject]?.shareSupply || "0"
      );
      return subjectShareSupply === 1;
    });
  }

  filteredEvents = filteredEvents.filter((event) =>
    conditions.every((condition) => condition(event))
  );

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
      {/*filters*/}
      <div className="invisible md:visible flex justify-between">
        {/* trader filter*/}
        <div className="flex flex-col items-start">
          <div className="flex items-center">
            <span className="mx-2">Trader Portfolio:</span>
            <input
              className="w-5/8 my-1 h-10 px-3 text-black placeholder-gray-600 border rounded-lg focus:shadow-outline"
              type="number"
              placeholder="Filter by Portfolio Value"
              onChange={(e) =>
                setTraderPortfolioFilter(parseFloat(e.target.value))
              }
            />
          </div>
          <div className="flex items-center">
            <span className="mx-2">Trader ETH:</span>
            <input
              className="ml-8 my-1 w-5/8 h-10 px-3 text-black placeholder-gray-600 border rounded-lg focus:shadow-outline"
              type="number"
              placeholder="Filter by ETH balance"
              onChange={(e) => setTraderETHFilter(parseFloat(e.target.value))}
            />
          </div>
          <div className="flex items-center">
            <span className="mx-2">Trader 3,3:</span>
            <input
              className="ml-9 my-1 w-5/8 h-10 px-3 text-black placeholder-gray-600 border rounded-lg focus:shadow-outline"
              type="number"
              placeholder="Filter by 3,3%"
              onChange={(e) =>
                setTraderReciprocityFilter(parseFloat(e.target.value) / 100)
              }
            />
          </div>
          {/* <div className="flex items-center">
            <span className="mx-2">Trader Price:</span>
            <input
              className="ml-9 my-1 w-5/8 h-10 px-3 text-black placeholder-gray-600 border rounded-lg focus:shadow-outline"
              type="number"
              placeholder="Filter by 3,3%"
              onChange={(e) =>
                setTraderPriceMaxFilter(parseFloat(e.target.value) * 1e18)
              }
            />
          </div> */}
        </div>
        {/* general filters */}
        <div className="flex flex-col items-center">
          Purchase Amount
          <div className="flex justify-left items-center">
            <div className="flex items-center">
              <span className="mx-4">Min:</span>
              <input
                className="w-1/2 h-10 px-3 text-black placeholder-gray-600 border rounded-lg focus:shadow-outline"
                type="number"
                placeholder="Min ETH"
                onChange={(e) => setEthFilterMin(parseFloat(e.target.value))}
              />
            </div>
            <div className="flex items-center">
              <span className="mx-4">Max:</span>
              <input
                className="w-1/2 h-10 px-3 text-black placeholder-gray-600 border rounded-lg focus:shadow-outline"
                type="number"
                placeholder="Max ETH"
                onChange={(e) => setEthFilterMax(parseFloat(e.target.value))}
              />
            </div>
          </div>
          {/* checkbox filters */}
          <div className="flex justify-between">
            <div className="flex">
              <label className="m-4 flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selfTxnFilter}
                  onChange={() => setSelfTxnFilter(!selfTxnFilter)}
                />
                <span>Self Txn</span>
              </label>
              <label className="m-4 flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={supplyOneFilter}
                  onChange={() => setSupplyOneFilter(!supplyOneFilter)}
                />
                <span>Supply = 1</span>
              </label>
              <label className="m-4 flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={() => setNotifications(!notifications)}
                />
                <span>Notifications</span>
              </label>
            </div>
          </div>
        </div>
        {/* subject filter */}
        <div className="flex flex-col items-end">
          <div className="flex items-center">
            <span className="mx-4">Subject Portfolio:</span>
            <input
              className="mx-2 my-1 w-5/8 h-10 px-3 text-black placeholder-gray-600 border rounded-lg focus:shadow-outline"
              type="number"
              placeholder="Filter by Portfolio Value"
              onChange={(e) =>
                setSubjectPortfolioFilter(parseFloat(e.target.value))
              }
            />
          </div>
          <div className="flex items-center">
            <span className="mx-4">Subject ETH:</span>
            <input
              className="mx-2 my-1 w-5/8 h-10 px-3 text-black placeholder-gray-600 border rounded-lg focus:shadow-outline"
              type="number"
              placeholder="Filter by ETH Balance"
              onChange={(e) => setSubjectETHFilter(parseFloat(e.target.value))}
            />
          </div>
          <div className="flex items-center">
            <span className="mx-2">Subject 3,3:</span>
            <input
              className="mx-2 my-1 w-5/8 h-10 px-3 text-black placeholder-gray-600 border rounded-lg focus:shadow-outline"
              type="number"
              placeholder="Filter by 3,3%"
              onChange={(e) =>
                setSubjectReciprocityFilter(parseFloat(e.target.value) / 100)
              }
            />
          </div>
        </div>
      </div>
      <div className="flex justify-center">
        <button
          className={
            selectedTab === "All"
              ? "bg-gray-800 rounded-t-md w-12"
              : "bg-gray-500 rounded-t-md w-12"
          }
          onClick={() => handleTabClick("All")}
        >
          All
        </button>
        <button
          className={
            selectedTab === "Buy"
              ? "bg-gray-800 rounded-t-md w-12"
              : "bg-gray-500 rounded-t-md w-12"
          }
          onClick={() => handleTabClick("Buy")}
        >
          Buy
        </button>
        <button
          className={
            selectedTab === "Sell"
              ? "bg-gray-800 rounded-t-md w-12"
              : "bg-gray-500 rounded-t-md w-12"
          }
          onClick={() => handleTabClick("Sell")}
        >
          Sell
        </button>
      </div>
      <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
          <div className="overflow-hidden border border-gray-200 dark:border-gray-700 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th
                    scope="col"
                    className="hidden md:table-cell py-3.5 px-4 text-sm font-normal text-left rtl:text-right text-gray-500 dark:text-gray-400"
                  >
                    Timestamp
                  </th>
                  <th
                    scope="col"
                    className="py-3.5 px-4 text-sm font-normal text-left rtl:text-right text-gray-500 dark:text-gray-400"
                  >
                    Trader ETH Bal
                  </th>
                  <th
                    scope="col"
                    className="py-3.5 px-4 text-sm font-normal text-left rtl:text-right text-gray-500 dark:text-gray-400"
                  >
                    Trader Portfolio
                  </th>
                  <th
                    scope="col"
                    className="py-3.5 px-4 text-sm font-normal text-left rtl:text-right text-gray-500 dark:text-gray-400"
                  >
                    Trader 3,3%
                  </th>
                  <th
                    scope="col"
                    className="py-3.5 px-4 text-sm font-normal text-left rtl:text-right text-gray-500 dark:text-gray-400"
                  >
                    Trader Price
                  </th>
                  <th
                    scope="col"
                    className="py-3.5 px-4 text-sm font-normal text-left rtl:text-right text-gray-500 dark:text-gray-400"
                  >
                    Trader
                  </th>
                  <th
                    scope="col"
                    className="py-3.5 px-4 text-sm font-normal text-left rtl:text-right text-gray-500 dark:text-gray-400"
                  >
                    TXN Amount
                  </th>
                  <th
                    scope="col"
                    className="py-3.5 px-4 text-sm font-normal text-left rtl:text-right text-gray-500 dark:text-gray-400"
                  >
                    Subject
                  </th>
                  <th
                    scope="col"
                    className="py-3.5 px-4 text-sm font-normal text-left rtl:text-right text-gray-500 dark:text-gray-400"
                  >
                    Subject 3,3%
                  </th>
                  <th
                    scope="col"
                    className="py-3.5 px-4 text-sm font-normal text-left rtl:text-right text-gray-500 dark:text-gray-400"
                  >
                    Subject Portfolio
                  </th>
                  <th
                    scope="col"
                    className="py-3.5 px-4 text-sm font-normal text-left rtl:text-right text-gray-500 dark:text-gray-400"
                  >
                    Subject ETH Bal
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:divide-gray-700 dark:bg-gray-900">
                {filteredEvents.map((event, index) => {
                  // Determine base color based on transaction type
                  const baseColor =
                    event.transactionType === "Buy" ? "green" : "red";
                  console.log(JSON.stringify(traderInfo[event.trader].holders));
                  return (
                    <tr
                      key={index}
                      className={
                        (colorMap[baseColor] as any)[event.colorGradient]
                      }
                    >
                      <td className="hidden md:table-cell px-4 py-4 text-sm font-medium whitespace-nowrap">
                        <div className="flex">
                          <a
                            href={`https://basescan.org/tx/${event.transactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <img
                              className="rounded-full"
                              src={logoEther}
                              alt="Transaction Hash"
                              width="24"
                              height="24"
                            />
                          </a>
                          {event.timestamp}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm font-medium whitespace-nowrap">
                        {traderInfo[event.trader]?.ethBalance + " ETH"}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium whitespace-nowrap">
                        {traderInfo[event.trader]?.portfolio
                          ?.portfolioValueETH + " ETH"}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium whitespace-nowrap">
                        {(
                          (parseFloat(
                            traderInfo[event.trader]?.holders
                              ?.reciprocity as string
                          ) ?? 0) * 100
                        ).toFixed(1) + "%"}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium whitespace-nowrap">
                        {parseFloat(traderInfo[event.trader]?.displayPrice) /
                          1e18 +
                          " ETH"}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium whitespace-nowrap">
                        <a
                          href={`https://basescan.org/address/${event.trader}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {/* Display Twitter Username if available */}
                          {traderInfo[event.trader]?.twitterUsername && (
                            <div className="flex">
                              <a
                                href={`https://x.com/${
                                  traderInfo[event.trader]?.twitterUsername
                                }`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <img
                                  className="rounded-full mr-1"
                                  src={traderInfo[event.trader]?.twitterPfpUrl}
                                  alt="X Avatar"
                                  width="24"
                                  height="24"
                                />
                              </a>
                              <a
                                href={`https://www.friend.tech/rooms/${event.trader}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {traderInfo[event.trader]?.twitterName.slice(
                                  0,
                                  15
                                )}
                              </a>
                            </div>
                          )}
                        </a>
                      </td>
                      <td className="px-4 py-4 text-xl text-sm font-medium whitespace-nowrap">
                        {event.ethAmount.slice(0, 7)}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium whitespace-nowrap">
                        {/* Display Twitter Username if available */}
                        {subjectInfo[event.subject]?.twitterUsername && (
                          <div className="flex">
                            <a
                              href={`https://x.com/${
                                subjectInfo[event.subject].twitterUsername
                              }`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <img
                                className="rounded-full mr-1"
                                src={subjectInfo[event.subject]?.twitterPfpUrl}
                                alt="X Avatar"
                                width="24"
                                height="24"
                              />
                            </a>
                            <a
                              href={`https://www.friend.tech/rooms/${event.subject}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {subjectInfo[event.subject]?.twitterName.slice(
                                0,
                                15
                              )}
                            </a>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium whitespace-nowrap">
                        {(
                          (parseFloat(
                            subjectInfo[event.subject]?.holders
                              ?.reciprocity as string
                          ) ?? 0) * 100
                        ).toFixed(1) + "%"}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium whitespace-nowrap">
                        {subjectInfo[event.subject]?.portfolio
                          ?.portfolioValueETH + " ETH"}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium whitespace-nowrap">
                        {subjectInfo[event.subject]?.ethBalance + " ETH"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {events.length === 0 && <p>No events to display</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreamTable;
