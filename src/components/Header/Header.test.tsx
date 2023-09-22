import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Header from './Header';
import { WalletProvider } from '../WalletContext/WalletContext';

test('renders header component', () => {
  render(
    <WalletProvider>
      <Header />
    </WalletProvider>
  );

  expect(screen.getByText('Friend Tech Dashboard')).toBeInTheDocument();
});
