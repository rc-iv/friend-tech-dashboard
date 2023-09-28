import React from "react";
import logoEther from "../../assets/images/ether-logo.png";

interface DepositEvent {
  address: string;
  depositAmount: string;
  timestamp: string;
  transactionHash: string;
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

interface DepositTableProps {
  depositEvents: DepositEvent[];
  depositorInfo: Record<string, User>;
  // Other props if necessary
}

const DepositTable: React.FC<DepositTableProps> = ({
  depositEvents,
  depositorInfo,
}) => {
  console.log(`depositEvents: ${JSON.stringify(depositEvents)}`);
  //console.log(`depositorInfo: ${JSON.stringify(depositorInfo)}`);

  // Convert 12-hour formatted times to 24-hour format and sort them
  const sortedDepositEvents = [...depositEvents].sort((a, b) => {
    const convertTo24Hour = (time:any) => {
      const [mainTime, period] = time.split(' ');
      let [hours, minutes, seconds] = mainTime.split(':');
      if (period === "PM" && parseInt(hours) < 12) {
        hours = (parseInt(hours) + 12).toString();
      }
      if (period === "AM" && parseInt(hours) === 12) {
        hours = "00";
      }
      return `${hours}:${minutes}:${seconds}`;
    };
    
    const timeA = convertTo24Hour(a.timestamp);
    const timeB = convertTo24Hour(b.timestamp);
    
    return timeB.localeCompare(timeA);
  });

  return (
    <div>
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        {/* Table Header */}
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
              Depositor
            </th>
            <th
              scope="col"
              className="py-3.5 px-4 text-sm font-normal text-left rtl:text-right text-gray-500 dark:text-gray-400"
            >
              Deposit Amount
            </th>
            <th
              scope="col"
              className="py-3.5 px-4 text-sm font-normal text-left rtl:text-right text-gray-500 dark:text-gray-400"
            >
              ETH Balance
            </th>
            <th
              scope="col"
              className="py-3.5 px-4 text-sm font-normal text-left rtl:text-right text-gray-500 dark:text-gray-400"
            >
              Depositor Price
            </th>
            <th
              scope="col"
              className="py-3.5 px-4 text-sm font-normal text-left rtl:text-right text-gray-500 dark:text-gray-400"
            >
              Portfolio Value
            </th>
            <th
              scope="col"
              className="py-3.5 px-4 text-sm font-normal text-left rtl:text-right text-gray-500 dark:text-gray-400"
            >
              3,3%
            </th>
          </tr>
        </thead>
        {/* Table Body */}
        <tbody className="bg-white divide-y divide-gray-200 dark:divide-gray-700 dark:bg-gray-900">
          {sortedDepositEvents.map((event, index) => (
            <tr key={index}>
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
                <a
                  href={`https://basescan.org/address/${event.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {/* Display Twitter Username if available */}
                  {depositorInfo[event.address]?.twitterUsername && (
                    <div className="flex">
                      <a
                        href={`https://x.com/${
                          depositorInfo[event.address]?.twitterUsername
                        }`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <img
                          className="rounded-full mr-1"
                          src={depositorInfo[event.address]?.twitterPfpUrl}
                          alt="X Avatar"
                          width="24"
                          height="24"
                        />
                      </a>
                      <a
                        href={`https://www.friend.tech/rooms/${event.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {depositorInfo[event.address]?.twitterName?.slice(
                          0,
                          15
                        )}
                      </a>
                    </div>
                  )}
                </a>
              </td>
              <td className="px-4 py-4 text-sm font-medium whitespace-nowrap">
                {parseFloat(event.depositAmount).toFixed(2)}
              </td>
              <td className="px-4 py-4 text-sm font-medium whitespace-nowrap">
                {depositorInfo[event.address]?.ethBalance + " ETH"}
              </td>
              <td className="px-4 py-4 text-sm font-medium whitespace-nowrap">
                {parseFloat(
                  depositorInfo[event.address]?.displayPrice as string
                ) /
                  1e18 +
                  " ETH"}
              </td>
              <td className="px-4 py-4 text-sm font-medium whitespace-nowrap">
                {parseFloat(
                  depositorInfo[event.address]?.portfolio?.portfolioValueETH).toString() + " ETH"}
              </td>
              <td className="px-4 py-4 text-sm font-medium whitespace-nowrap">
                {(
                  (parseFloat(
                    depositorInfo[event.address]?.holders?.reciprocity as string
                  ) ?? 0) * 100
                ).toFixed(1) + "%"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DepositTable;
