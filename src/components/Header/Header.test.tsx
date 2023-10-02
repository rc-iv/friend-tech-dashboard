import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Header from './Header';

test('renders header component', () => {
  render(
      <Header isSubscriber={true}/>
  );

  expect(screen.getByText('Friend Tech Dashboard')).toBeInTheDocument();
});
