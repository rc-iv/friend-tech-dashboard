import React from "react";
import logoEther from "../../assets/images/ether-logo.png";

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
  twitterUsername?: string;
  twitterName?: string;
  twitterPfpUrl?: string;
  ethBalance?: string;
  portfolio?: Portfolio;
  holders?: Holders;
  displayPrice?: string;
}

interface Portfolio {
  portfolioValueETH: string;
}

interface Holders {
  reciprocity: string;
}

interface SalesTableProps {
  filteredEvents: TradeEvent[];
  userInfo: Record<string, User>;
}

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

const SalesTable: React.FC<SalesTableProps> = ({
  filteredEvents,
  userInfo,
}) => {
  return (
    <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
      <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
        <div className="overflow-hidden border border-gray-200 dark:border-gray-700 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            {/* Table Header */}
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th
                  scope="col"
                  className="py-3.5 px-4 text-sm font-normal text-left rtl:text-right text-gray-500 dark:text-gray-400"
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
            {/* Table Body */}
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
                    <td className="px-4 py-4 text-sm font-medium whitespace-nowrap">
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
                      {userInfo[event.trader]?.ethBalance + " ETH"}
                    </td>
                    <td className="px-4 py-4 text-sm font-medium whitespace-nowrap">
                      {userInfo[event.trader]?.portfolio?.portfolioValueETH +
                        " ETH"}
                    </td>
                    <td className="px-4 py-4 text-sm font-medium whitespace-nowrap">
                      {(
                        (parseFloat(
                          userInfo[event.trader]?.holders
                            ?.reciprocity as string
                        ) ?? 0) * 100
                      ).toFixed(1) + "%"}
                    </td>
                    <td className="px-4 py-4 text-sm font-medium whitespace-nowrap">
                      {parseFloat(userInfo[event.trader]?.displayPrice as string) /
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
                        {userInfo[event.trader]?.twitterUsername && (
                          <div className="flex">
                            <a
                              href={`https://x.com/${
                                userInfo[event.trader]?.twitterUsername
                              }`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <img
                                className="rounded-full mr-1"
                                src={userInfo[event.trader]?.twitterPfpUrl}
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
                              {userInfo[event.trader]?.twitterName?.slice(
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
                      {userInfo[event.subject]?.twitterUsername && (
                        <div className="flex">
                          <a
                            href={`https://x.com/${
                              userInfo[event.subject].twitterUsername
                            }`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <img
                              className="rounded-full mr-1"
                              src={userInfo[event.subject]?.twitterPfpUrl}
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
                            {userInfo[event.subject]?.twitterName?.slice(
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
                          userInfo[event.subject]?.holders
                            ?.reciprocity as string
                        ) ?? 0) * 100
                      ).toFixed(1) + "%"}
                    </td>
                    <td className="px-4 py-4 text-sm font-medium whitespace-nowrap">
                      {userInfo[event.subject]?.portfolio
                        ?.portfolioValueETH + " ETH"}
                    </td>
                    <td className="px-4 py-4 text-sm font-medium whitespace-nowrap">
                      {userInfo[event.subject]?.ethBalance + " ETH"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredEvents.length === 0 && <p>No events to display</p>}
        </div>
      </div>
    </div>
  );
};

export default SalesTable;
