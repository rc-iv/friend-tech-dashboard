import React from "react";

interface TableFiltersProps {
  ethFilterMin: number | null;
  setEthFilterMin: React.Dispatch<React.SetStateAction<number | null>>;
  ethFilterMax: number | null;
  setEthFilterMax: React.Dispatch<React.SetStateAction<number | null>>;
  selfTxnFilter: boolean;
  setSelfTxnFilter: React.Dispatch<React.SetStateAction<boolean>>;
  supplyOneFilter: boolean;
  setSupplyOneFilter: React.Dispatch<React.SetStateAction<boolean>>;
  notifications: boolean;
  setNotifications: React.Dispatch<React.SetStateAction<boolean>>;
  traderETHFilter: number | null;
  setTraderETHFilter: React.Dispatch<React.SetStateAction<number | null>>;
  traderPortfolioFilter: number | null;
  setTraderPortfolioFilter: React.Dispatch<React.SetStateAction<number | null>>;
  traderReciprocityFilter: number | null;
  setTraderReciprocityFilter: React.Dispatch<
    React.SetStateAction<number | null>
  >;
  traderPriceMaxFilter: number | null;
  setTraderPriceMaxFilter: React.Dispatch<React.SetStateAction<number | null>>;
  subjectETHFilter: number | null;
  setSubjectETHFilter: React.Dispatch<React.SetStateAction<number | null>>;
  subjectPortfolioFilter: number | null;
  setSubjectPortfolioFilter: React.Dispatch<
    React.SetStateAction<number | null>
  >;
  subjectReciprocityFilter: number | null;
  setSubjectReciprocityFilter: React.Dispatch<
    React.SetStateAction<number | null>
  >;

  handleTabClick: (tab: "Buy" | "Sell" | "All") => void;
  selectedTab: string;
}

const TableFilters: React.FC<TableFiltersProps> = ({
  ethFilterMin,
  setEthFilterMin,
  ethFilterMax,
  setEthFilterMax,
  selfTxnFilter,
  setSelfTxnFilter,
  supplyOneFilter,
  setSupplyOneFilter,
  notifications,
  setNotifications,
  traderETHFilter,
  setTraderETHFilter,
  traderPortfolioFilter,
  setTraderPortfolioFilter,
  traderReciprocityFilter,
  setTraderReciprocityFilter,
  traderPriceMaxFilter,
  setTraderPriceMaxFilter,
  subjectETHFilter,
  setSubjectETHFilter,
  subjectPortfolioFilter,
  setSubjectPortfolioFilter,
  subjectReciprocityFilter,
  setSubjectReciprocityFilter,
  handleTabClick,
  selectedTab,
}) => {
  return (
    <div>
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
    </div>
  );
};

export default TableFilters;
