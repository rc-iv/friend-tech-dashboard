import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import SalesTable from './SalesTable';  // Adjust the import based on your file structure

// Mock data for the test
const mockFilteredEvents = [
  {
    trader: '0xTrader1',
    subject: '0xSubject1',
    transactionType: 'Buy',
    shareAmount: '1',
    ethAmount: '0.1',
    timestamp: '1632796160000',
    transactionHash: '0x1234',
    colorGradient: '900'
  }
];

const mockTraderInfo = {
  '0xTrader1': {
    twitterUsername: 'Trader1',
    twitterName: 'Trader One',
    ethBalance: '2'
  }
};

const mockSubjectInfo = {
  '0xSubject1': {
    twitterUsername: 'Subject1',
    twitterName: 'Subject One',
    ethBalance: '5'
  }
};

describe('<SalesTable />', () => {
  it('renders the SalesTable component', () => {
    render(
      <SalesTable
        filteredEvents={mockFilteredEvents}
        traderInfo={mockTraderInfo}
        subjectInfo={mockSubjectInfo}
      />
    );

    // Basic test to ensure the table renders
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('renders trader and subject information', () => {
    render(
      <SalesTable
        filteredEvents={mockFilteredEvents}
        traderInfo={mockTraderInfo}
        subjectInfo={mockSubjectInfo}
      />
    );

    // Check if trader and subject information is displayed correctly
    expect(screen.getByText('Trader One')).toBeInTheDocument();
    expect(screen.getByText('Subject One')).toBeInTheDocument();
  });

  // Add more tests as needed
});
