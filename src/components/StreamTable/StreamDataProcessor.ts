// StreamDataProcessor.ts
import Web3 from "web3";

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
  target: "subject" | "trader",
  setSubjectInfo: React.Dispatch<React.SetStateAction<Record<string, any>>>,
  setTraderInfo: React.Dispatch<React.SetStateAction<Record<string, any>>>,
  fetchedAddresses: Set<any>,
  traderInfo: Record<string, User>,
  subjectInfo: Record<string, User>
) => {
  if (fetchedAddresses.has(address)) return;
  fetchedAddresses.add(address);
  setTimeout(() => fetchedAddresses.delete(address), 60000);

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

export const filterEvents = (
  events: TradeEvent[],
  subjectInfo: Record<string, User>,
  traderInfo: Record<string, User>,
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

  // Apply all conditions
  return events.filter((event) =>
    conditions.every((condition) => condition(event))
  );
};

export const fetchDepositor = async (address: string, web3: Web3) => {
  try {
    const url = `https://3lnsypz0we.execute-api.us-east-1.amazonaws.com/Prod/user/${address}`;
    const response = await fetch(url);
    const user = await response.json();

    // user web3 to fetch eth balance of address
    const weiBalance = await web3.eth.getBalance(address);
    // convert to eth
    const ethBalanceString = web3.utils.fromWei(weiBalance, "ether");
    // truncate to 2 decimal places
    const ethBalance = parseFloat(ethBalanceString).toFixed(2);

    user.userData.ethBalance = ethBalance;

    return user.userData;
  } catch (error) {
    console.error("Error fetching user info:", error);
  }
};
