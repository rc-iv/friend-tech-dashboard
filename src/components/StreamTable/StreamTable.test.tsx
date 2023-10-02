import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Web3 from 'web3';
import StreamTable from './StreamTable';

// Mocking the Contract and subscribe method
const mockSubscribe = jest.fn();

jest.mock('web3', () => {
  return jest.fn().mockImplementation(() => {
    return {
      eth: {
        Contract: jest.fn().mockImplementation(() => {
          return {
            events: {
              Trade: mockSubscribe,
            },
          };
        }),
      },
    };
  });
});

describe('StreamTable Component', () => {
  beforeEach(() => {
    (Web3 as unknown as jest.MockInstance<any, any>).mockClear();

    mockSubscribe.mockClear();
  });

  it('renders StreamTable component', () => {
    render(<StreamTable isSubscriber={false} />);
    expect(screen.getByText(/No events to display/i)).toBeInTheDocument();
  });

  it('should create a Web3 instance and subscribe to Trade events', () => {
    render(<StreamTable isSubscriber={true}/>);
    expect(Web3).toHaveBeenCalled();
    expect(mockSubscribe).toHaveBeenCalled();
  });
});
