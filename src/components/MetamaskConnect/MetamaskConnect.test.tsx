import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MetamaskConnect from './MetamaskConnect';
import { WalletProvider } from '../WalletContext/WalletContext';

test('renders connect metamask button initially', () => {
  render(
    <WalletProvider>
      <MetamaskConnect />
    </WalletProvider>
  );

  expect(screen.getByText('Connect Metamask')).toBeInTheDocument();
});

// You might need to mock the actual connection and disconnection functions and events
test('renders disconnect metamask button when connected', () => {
  // Mock the implementation here
  
  render(
    <WalletProvider>
      <MetamaskConnect />
    </WalletProvider>
  );

  // Simulate a click event or directly change the context value

  // expect(screen.getByText('Disconnect Metamask')).toBeInTheDocument();
});
