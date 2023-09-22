import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WalletProvider, useWallet } from './WalletContext';

test('uses wallet context', () => {
  const TestComponent: React.FC = () => {
    const { walletAddress } = useWallet();
    return <div>{walletAddress}</div>;
  };

  render(
    <WalletProvider>
      <TestComponent />
    </WalletProvider>
  );

  expect(screen.getByText('')).toBeInTheDocument();
});
