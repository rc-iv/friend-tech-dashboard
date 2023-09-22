import React from 'react';
import MetamaskConnect from '../MetamaskConnect/MetamaskConnect';

const Header: React.FC = () => {
  return (
    <div className="bg-gray-800 p-4 text-white flex justify-between items-center">
      <div className="text-2xl font-bold">
        Friend Tech Dashboard
      </div>
      <MetamaskConnect />
    </div>
  );
}

export default Header;
