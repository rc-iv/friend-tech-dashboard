import React, { useEffect, useState } from "react";
import Web3 from "web3";
import contractAbi from "./contractAbi";
import { Web3Subscription } from "web3-core";

interface TradeEvent {
  trader: string;
  subject: string;
  isBuy: boolean;
  shareAmount: string;
  ethAmount: string;
}

const StreamTable: React.FC = () => {
  const [events, setEvents] = useState<TradeEvent[]>([]);
  useEffect(() => {
    const initiateSubscription = async () => {
      try {
        const providerUrl =
          "wss://base.blockpi.network/v1/ws/8bfe5dae92f901117832b75d348793bda33fe2a5";
        const web3 = new Web3(providerUrl);
        const contractAddress = "0xcf205808ed36593aa40a44f10c7f7c2f67d4a4d4";
        const contract = new web3.eth.Contract(contractAbi, contractAddress);

        const subscription: any = web3.eth.subscribe("logs", {
          address: contractAddress,
          topics: [
            web3.utils.sha3("Trade(address,address,bool,uint256,uint256)")!,
          ],
        }) as unknown as any;

        subscription.on("data", (log: any) => {
          const decodedLog = web3.eth.abi.decodeLog(
            [
              { type: "address", name: "trader" },
              { type: "address", name: "subject" },
              { type: "bool", name: "isBuy" },
              { type: "uint256", name: "shareAmount" },
              { type: "uint256", name: "ethAmount" },
            ],
            log.data,
            log.topics.slice(1)
          ) as any;

          const { trader, subject, isBuy, shareAmount, ethAmount } = decodedLog;
          setEvents((prevEvents) => [
            ...prevEvents,
            { trader, subject, isBuy, shareAmount, ethAmount },
          ]);
        });

        subscription.on("error", (error: Error) => {
          console.error("Error in Trade event subscription:", error);
        });

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Error initializing web3 or contract:", error);
      }
    };
    initiateSubscription();
  }, []);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full leading-normal">
        <thead>
          <tr>
            <th>Trader</th>
            <th>Subject</th>
            <th>Is Buy</th>
            <th>Share Amount</th>
            <th>Eth Amount</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event, index) => (
            <tr key={index}>
              <td>{event.trader}</td>
              <td>{event.subject}</td>
              <td>{event.isBuy.toString()}</td>
              <td>{event.shareAmount}</td>
              <td>{event.ethAmount}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {events.length === 0 && <p>No events to display</p>}
    </div>
  );
};

export default StreamTable;
