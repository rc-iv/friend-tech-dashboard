import React from 'react';
import { useWallet } from '../WalletContext/WalletContext'; // adjust the import path accordingly
import Web3 from 'web3';
import detectEthereumProvider from '@metamask/detect-provider';

const MetamaskConnect: React.FC = () => {
  const { walletAddress, setWalletAddress } = useWallet();

  async function connectWallet() {
    const provider = await detectEthereumProvider();

    if (provider) {
      try {
        await (provider as any).request({ method: 'eth_requestAccounts' });
        const web3 = new Web3(provider as any);

        const accounts = await web3.eth.getAccounts();
        const address = accounts[0];

        setWalletAddress(address);
      } catch (error) {
        console.error(error);
      }
    } else {
      console.error('Metamask not detected');
    }
  }

  function disconnectWallet() {
    setWalletAddress('');
  }

  return (
    <div>
      {walletAddress ? (
        <>
          <button onClick={disconnectWallet}>Disconnect Metamask</button>
        </>
      ) : (
        <button onClick={connectWallet}>Connect Metamask</button>
      )}
    </div>
  );
}

export default MetamaskConnect;
