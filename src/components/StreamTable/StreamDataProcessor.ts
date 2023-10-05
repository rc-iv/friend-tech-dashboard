// StreamDataProcessor.ts
import Web3 from "web3";
import { contractAbi } from "./contractAbi";

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

interface Portfolio {
  holdings: PortfolioUser[];
  portfolioValueETH: string;
}

interface PortfolioUser {
  address: string;
  balance: string;
}

interface Holders {
  reciprocity: string;
  holdings: PortfolioUser;
}

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

interface DepositEvent {
  address: string;
  depositAmount: string;
  timestamp: string;
  transactionHash: string;
  l1Address: string;
  l1Balance: string;
}

export const deepEqualArray = (arr1: any[], arr2: any[]) => {
  if (arr1.length !== arr2.length) return false;

  for (let i = 0; i < arr1.length; i++) {
    if (JSON.stringify(arr1[i]) !== JSON.stringify(arr2[i])) {
      return false;
    }
  }

  return true;
};

export const fetchUserInfo = async (
  web3: Web3,
  address: string,
  setUserInfo: React.Dispatch<React.SetStateAction<Record<string, any>>>,
  fetchedAddresses: Set<any>,
  setFetchedAddresses: React.Dispatch<React.SetStateAction<Set<any>>>,
  userInfo: Record<string, User>
) => {
  if (fetchedAddresses.has(address)) return;
  fetchedAddresses.add(address);
  setFetchedAddresses(fetchedAddresses);

  try {
    // Check if the user info for this address has already been fetched
    if (userInfo[address]) {
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
    if (user && user.userData) {
      user.userData.ethBalance = ethBalance;
    } else {
      console.warn("userData is undefined in fetchUserInfo");
      return;
    }
    setUserInfo((prevInfo) => ({
      [address]: user.userData,
      ...prevInfo,
    }));
  } catch (error) {
    console.error("Error fetching user info:", error);
  }
};

export const filterDeposits = (
  events: DepositEvent[],
  depositorInfo: Record<string, User>,
  depositFilterMin: number | null,
  depositFilterMax: number | null,
  depositPortfolioFilter: number | null,
  depositEthFilter: number | null,
  depositReciprocityFilter: number | null
) => {
  let conditions: Array<(event: DepositEvent) => boolean> = [];

  if (depositFilterMin !== null) {
    conditions.push(
      (event) => parseFloat(event.depositAmount) >= depositFilterMin
    );
  }
  if (depositFilterMax !== null) {
    conditions.push(
      (event) => parseFloat(event.depositAmount) <= depositFilterMax
    );
  }

  if (depositPortfolioFilter) {
    conditions.push((event) => {
      const portfolioValue = parseFloat(
        depositorInfo[event.address]?.portfolio?.portfolioValueETH || "0"
      );
      return portfolioValue >= depositPortfolioFilter;
    });
  }

  if (depositReciprocityFilter) {
    conditions.push((event) => {
      const reciprocity = parseFloat(
        depositorInfo[event.address]?.holders?.reciprocity || "0"
      );
      return reciprocity >= depositReciprocityFilter;
    });
  }

  if (depositEthFilter) {
    conditions.push((event) => {
      const ethBalance = parseFloat(
        depositorInfo[event.address]?.ethBalance || "0"
      );
      return ethBalance >= depositEthFilter;
    });
  }

  // Apply all conditions
  return events.filter((event) =>
    conditions.every((condition) => condition(event))
  );
};

export const filterEvents = (
  events: TradeEvent[],
  userInfo: Record<string, User>,
  selectedTab: string,
  ethFilterMin: number | null,
  ethFilterMax: number | null,
  traderETHFilter: number | null,
  traderPortfolioFilter: number | null,
  traderReciprocityFilter: number | null,
  traderPriceMaxFilter: number | null,
  subjectETHFilter: number | null,
  subjectPortfolioFilter: number | null,
  subjectReciprocityFilter: number | null,
  selfTxnFilter: boolean,
  supplyOneFilter: boolean
): TradeEvent[] => {
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
       userInfo[event.trader]?.portfolio?.portfolioValueETH || "0"
      );
      return portfolioValue >= traderPortfolioFilter;
    });
  }

  if (traderETHFilter) {
    conditions.push((event) => {
      const ethBalance = parseFloat(
        userInfo[event.trader]?.ethBalance || "0"
      );
      return ethBalance >= traderETHFilter;
    });
  }

  if (traderReciprocityFilter) {
    conditions.push((event) => {
      const reciprocity = parseFloat(
        userInfo[event.trader]?.holders?.reciprocity || "0"
      );
      return reciprocity >= traderReciprocityFilter;
    });
  }

  if (traderPriceMaxFilter) {
    conditions.push((event) => {
      const price = parseFloat(userInfo[event.trader]?.displayPrice || "0");
      return price <= traderPriceMaxFilter;
    });
  }

  if (subjectPortfolioFilter) {
    conditions.push((event) => {
      const portfolioValue = parseFloat(
        userInfo[event.subject]?.portfolio?.portfolioValueETH || "0"
      );
      return portfolioValue >= subjectPortfolioFilter;
    });
  }

  if (subjectETHFilter) {
    conditions.push((event) => {
      const ethBalance = parseFloat(
        userInfo[event.subject]?.ethBalance || "0"
      );
      return ethBalance >= subjectETHFilter;
    });
  }

  if (subjectReciprocityFilter) {
    conditions.push((event) => {
      const reciprocity = parseFloat(
        userInfo[event.subject]?.holders?.reciprocity || "0"
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
        userInfo[event.subject]?.shareSupply || "0"
      );
      return subjectShareSupply === 1;
    });
  }

  // Apply all conditions
  return events.filter((event) =>
    conditions.every((condition) => condition(event))
  );
};

export const fetchUser = async (address: string, web3: Web3) => {
  try {
    const url = `https://3lnsypz0we.execute-api.us-east-1.amazonaws.com/Prod/user/${address}`;
    const response = await fetch(url);
    const user = await response.json();

    // user web3 to fetch eth balance of address
    const weiBalance = await web3.eth.getBalance(address);
    if (weiBalance === undefined) {
      console.warn("weiBalance is undefined in fetchUserInfo");
      return;
    }
    // convert to eth
    const ethBalanceString = web3.utils.fromWei(weiBalance, "ether");
    // truncate to 2 decimal places
    const ethBalance = parseFloat(ethBalanceString).toFixed(2);

    if (user && user.userData) {
      user.userData.ethBalance = ethBalance;
    } else {
      console.warn("userData is undefined in fetchUserInfo");
      user.userData = {
        twitterUsername: "bot",
        twitterName: "bot",
        twitterPfpUrl: "https://static.vecteezy.com/system/resources/previews/011/125/407/non_2x/3d-isolated-customer-service-robot-icon-free-png.png",
        id: "bot",
        address: address,
        twitterUserId: "bot",
        lastOnline: "bot",
        lastMessageTime: "bot",
        holderCount: "bot",
        holdingCount: 0,
        watchlistCount: "bot",
        shareSupply: "bot",
        displayPrice: 0,
        lifetimeFeesCollectedInWei: "bot",
        portfolio: {
          holdings: [],
          portfolioValueETH: 0,
        },
        ethBalance: ethBalance,
        holders: {
          reciprocity: 0,
          holdings: {
          },
        },
      }
    }

    return user.userData;
  } catch (error) {
    console.error("Error fetching user info:", error);
  }
};

export const fetchTrades = async (
  contractAddress: string,
  web3: Web3
): Promise<TradeEvent[]> => {
  const contract = new web3.eth.Contract(contractAbi, contractAddress);

  const latestBlock = await web3.eth.getBlockNumber();
  const fromBlock = latestBlock - BigInt(5);
  const fromBlockHex = web3.utils.toHex(fromBlock);
  let rawEvents: any[] = [];
  try {
    rawEvents = await (contract as any).getPastEvents("Trade", {
      fromBlock: fromBlockHex,
      toBlock: "latest",
    });
  } catch (error) {
    console.error("Error fetching raw events:", error);
  }

  const newEvents = await Promise.all(
    rawEvents.map(async (event: any) => {
      const { returnValues, blockNumber, transactionHash } = event;

      const blockDetails = await web3.eth.getBlock(blockNumber);

      if (blockDetails === undefined) {
        console.warn("blockDetails is undefined in fetchTrades");
        return;
      }
      const timestamp = new Date(
        Number(blockDetails.timestamp) * 1000
      ).toLocaleTimeString();

      let ethAmountString = returnValues.ethAmount.toString(); // Convert BigInt to string
      let ethAmountNumber = parseFloat(ethAmountString); // Convert to Number for further calculations
      let ethAbs = Math.abs(parseFloat((ethAmountNumber / 1e18).toFixed(7)));

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
  const newTradeEvents: TradeEvent[] = newEvents.filter(
    (event): event is TradeEvent => event !== null
  );
  return newTradeEvents;
};
