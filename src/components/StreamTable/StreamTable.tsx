import React, { useEffect, useState } from "react";
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
}

// Define a new interface for Portfolio containing holdings and portfolioValueEth
interface Portfolio {
  holdings: User[];
  portfolioValueETH: string;
}

const StreamTable: React.FC = () => {
  const [events, setEvents] = useState<TradeEvent[]>([]);
  const [pendingEvents, setPendingEvents] = useState<TradeEvent[]>([]);

  const [subjectInfo, setSubjectInfo] = useState<Record<string, User>>({});
  const [traderInfo, setTraderInfo] = useState<Record<string, User>>({});
  const [portfolioInfo, setPortfolioInfo] = useState<Record<string, Portfolio>>(
    {}
  );
  const { walletAddress } = useWallet();

  // filters
  const [ethFilter, setEthFilter] = useState<number | null>(null);
  const [traderPortfolioFilter, setTraderPortfolioFilter] = useState<
    number | null
  >(null);
  const [selfBuyFilter, setSelfBuyFilter] = useState<boolean>(false);
  const [firstBuyFilter, setFirstBuyFilter] = useState<boolean>(false);
  const [selfSellFilter, setSelfSellFilter] = useState<boolean>(false);

  const fetchKosettoUserInfo = async (
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

      const res = await fetch(`https://prod-api.kosetto.com/users/${address}`);
      const data = await res.json();
      if (target === "trader")
        setTraderInfo((prevInfo) => ({
          ...prevInfo,
          [address]: data,
        }));
      else {
        setSubjectInfo((prevInfo) => ({
          ...prevInfo,
          [address]: data,
        }));
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
    }
  };

  // Function to fetch user token holdings and display prices
  const fetchKosettoPortfolioInfo: any = async (
    address: string,
    target: "subject" | "trader",
    pageStart: number = 0, // New parameter to control pagination
    accumulatedHoldings: any[] = [] // New parameter to accumulate results
  ) => {
    try {
      // Use pageStart in the API call if it's greater than 0
      const url = `https://prod-api.kosetto.com/users/${address}/token-holdings${
        pageStart > 0 ? `?pageStart=${pageStart}` : ""
      }`;
      const res = await fetch(url);
      const data = await res.json();
      let { users, nextPageStart } = data;

      // Accumulate results
      const allHoldings = [...accumulatedHoldings, ...users];

      // Recursively fetch more data if nextPageStart is divisible by 50
      if (nextPageStart % 50 === 0 && nextPageStart < 300) {
        return await fetchKosettoPortfolioInfo(
          address,
          target,
          nextPageStart,
          allHoldings
        );
      }

      let portfolioValueETH = 0; // Initialize portfolio value

      const holdingsWithPrice = await Promise.all(
        allHoldings.map(async (holding: any) => {
          const resPrice = await fetch(
            `https://prod-api.kosetto.com/users/${holding.address}`
          );
          const dataPrice = await resPrice.json();
          const displayPrice = parseFloat(dataPrice.displayPrice); // Convert to Number
          const balance = parseFloat(holding.balance); // Convert to Number

          // Calculate the total value for this holding and add it to the portfolio value
          const totalValueForHolding = (displayPrice * balance) / 1e18; // Assuming Wei to ETH conversion
          portfolioValueETH += totalValueForHolding;

          return {
            ...holding,
            displayPrice: dataPrice.displayPrice, // Store as string
          };
        })
      );

      setPortfolioInfo((prevInfo) => ({
        ...prevInfo,
        [address]: {
          holdings: holdingsWithPrice,
          portfolioValueETH: portfolioValueETH.toFixed(2), // Store as string, up to 7 decimal places
        },
      }));
    } catch (error) {
      console.error("Error fetching token holdings:", error);
    }
  };

  useEffect(() => {
    if (!walletAddress) return;

    const providerUrl =
      "https://base.blockpi.network/v1/rpc/8bfe5dae92f901117832b75d348793bda33fe2a5";
    const web3 = new Web3(providerUrl);
    const contractAddress = "0xcf205808ed36593aa40a44f10c7f7c2f67d4a4d4";
    const contract = new web3.eth.Contract(contractAbi, contractAddress);
    const pollInterval = 15000;

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
            fetchKosettoUserInfo(returnValues.subject, "subject"); // Fetch additional info for each subject
            fetchKosettoUserInfo(returnValues.trader, "trader");
            fetchKosettoPortfolioInfo(returnValues.subject, "subject");
            fetchKosettoPortfolioInfo(returnValues.trader, "trader");

            let ethAmountString = returnValues.ethAmount.toString(); // Convert BigInt to string
            let ethAmountNumber = parseFloat(ethAmountString); // Convert to Number for further calculations
            let ethAbs = Math.abs(
              parseFloat((ethAmountNumber / 1e18).toFixed(7))
            );

            if (ethAbs == 0) {
              return null;
            }
            let colorGradient = "500"; // Default value

            if (ethAbs < 0.01) {
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

  let filteredEvents = events;

  let conditions: Array<(event: TradeEvent) => boolean> = [];

  if (ethFilter) {
    conditions.push((event) => parseFloat(event.ethAmount) >= ethFilter);
  }

  if (traderPortfolioFilter) {
    conditions.push((event) => {
      const portfolioValue = parseFloat(
        portfolioInfo[event.trader]?.portfolioValueETH || "0"
      );
      return portfolioValue >= traderPortfolioFilter;
    });
  }

  if (selfBuyFilter && selfSellFilter) {
    conditions.push((event) => event.trader === event.subject);
  } else {
    if (selfBuyFilter) {
      conditions.push(
        (event) =>
          event.trader === event.subject && event.transactionType === "Buy"
      );
    }

    if (selfSellFilter) {
      conditions.push(
        (event) =>
          event.trader === event.subject && event.transactionType === "Sell"
      );
    }
  }

  if (firstBuyFilter) {
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

  return (
    <div className="flex flex-col text-white bg-black">
      <span className="mx-4">Portfolio Value Filter:</span>
      <input
        className="mx-4 w-1/4 h-10 px-3 text-black placeholder-gray-600 border rounded-lg focus:shadow-outline"
        type="number"
        placeholder="Filter by Portfolio Value"
        onChange={(e) => setTraderPortfolioFilter(parseFloat(e.target.value))}
      />
      <span className="mx-4">Transaction Value Filter:</span>
      <input
        className="mx-4 w-1/4 h-10 px-3 text-black placeholder-gray-600 border rounded-lg focus:shadow-outline"
        type="number"
        placeholder="Filter by ETH"
        onChange={(e) => setEthFilter(parseFloat(e.target.value))}
      />
      <div className="flex">
        <label className="m-4 flex items-center space-x-2">
          <input
            type="checkbox"
            checked={selfBuyFilter}
            onChange={() => setSelfBuyFilter(!selfBuyFilter)}
          />
          <span>Self Buy</span>
        </label>
        <label className="m-4 flex items-center space-x-2">
          <input
            type="checkbox"
            checked={selfSellFilter}
            onChange={() => setSelfSellFilter(!selfSellFilter)}
          />
          <span>Self Sell</span>
        </label>
        <label className="m-4 flex items-center space-x-2">
          <input
            type="checkbox"
            checked={firstBuyFilter}
            onChange={() => setFirstBuyFilter(!firstBuyFilter)}
          />
          <span>First Buy (Supply = 1)</span>
        </label>
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
                    TXN
                  </th>
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
                    Trader
                  </th>
                  <th
                    scope="col"
                    className="py-3.5 px-4 text-sm font-normal text-left rtl:text-right text-gray-500 dark:text-gray-400"
                  >
                    Trader Portfolio Value
                  </th>
                  <th
                    scope="col"
                    className="py-3.5 px-4 text-sm font-normal text-left rtl:text-right text-gray-500 dark:text-gray-400"
                  >
                    Subject
                  </th>
                  <th
                    scope="col"
                    className="hidden md:table-cell py-3.5 px-4 text-sm font-normal text-left rtl:text-right text-gray-500 dark:text-gray-400"
                  >
                    Transaction Type
                  </th>
                  <th
                    scope="col"
                    className="hidden md:table-cell py-3.5 px-4 text-sm font-normal text-left rtl:text-right text-gray-500 dark:text-gray-400"
                  >
                    Share Amount
                  </th>
                  <th
                    scope="col"
                    className="py-3.5 px-4 text-sm font-normal text-left rtl:text-right text-gray-500 dark:text-gray-400"
                  >
                    ETH
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:divide-gray-700 dark:bg-gray-900">
                {filteredEvents.map((event, index) => {
                  // Determine base color based on transaction type
                  const baseColor =
                    event.transactionType === "Buy" ? "green" : "red";

                  return (
                    <tr
                      key={index}
                      className={
                        (colorMap[baseColor] as any)[event.colorGradient]
                      }
                    >
                      <td className="hidden md:table-cell px-4 py-4 text-sm font-medium whitespace-nowrap">
                        <a
                          href={`https://basescan.org/tx/${event.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <img
                            className="rounded-full"
                            src={logoEther}
                            alt="Transaction Hash"
                            width="48"
                            height="48"
                          />
                        </a>
                      </td>
                      <td className="hidden md:table-cell px-4 py-4 text-sm font-medium whitespace-nowrap">
                        {event.timestamp}
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
                                  className="rounded-full"
                                  src={traderInfo[event.trader]?.twitterPfpUrl}
                                  alt="X Avatar"
                                  width="48"
                                  height="48"
                                />
                              </a>
                              <a
                                href={`https://www.friend.tech/rooms/${event.trader}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <img
                                  className="rounded-full"
                                  src={logoFtech}
                                  alt="Friend Tech Account"
                                  width="48"
                                  height="48"
                                />
                              </a>
                              {traderInfo[event.trader]?.twitterName}
                            </div>
                          )}
                        </a>
                      </td>
                      <td className="px-4 py-4 text-sm font-medium whitespace-nowrap">
                        {portfolioInfo[event.trader]?.portfolioValueETH + "ETH"}
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
                                className="rounded-full"
                                src={subjectInfo[event.subject]?.twitterPfpUrl}
                                alt="X Avatar"
                                width="48"
                                height="48"
                              />
                            </a>
                            <a
                              href={`https://www.friend.tech/rooms/${event.subject}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <img
                                className="rounded-full"
                                src={logoFtech}
                                alt="Friend Tech Account"
                                width="48"
                                height="48"
                              />
                            </a>
                            {subjectInfo[event.subject]?.twitterName}
                          </div>
                        )}
                      </td>
                      <td className="hidden md:table-cell px-4 py-4 text-sm font-medium whitespace-nowrap">
                        {event.transactionType}
                      </td>
                      <td className="hidden md:table-cell px-4 py-4 text-sm font-medium whitespace-nowrap">
                        {event.shareAmount}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium whitespace-nowrap">
                        {event.ethAmount}
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
