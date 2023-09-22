import React from "react";
import Header from "./components/Header/Header"; // adjust the import path accordingly
import { WalletProvider } from "./components/WalletContext/WalletContext"; // adjust the import path accordingly
import StreamTable from "./components/StreamTable/StreamTable";

const App: React.FC = () => {
  return (
    <div className="bg-black">
      <WalletProvider>
        <div>
          <Header />
          <StreamTable />
        </div>
      </WalletProvider>
    </div>
  );
};

export default App;
