import React from 'react';
import MetamaskConnect from '../MetamaskConnect/MetamaskConnect';
import ftfeedLogo from '../../assets/images/ftech-dashboard-logo.png';
const Header: React.FC = () => {
  return (
    <div className="bg-gray-800 p-4 text-white flex justify-between items-center">
      <div className="text-2xl font-bold flex">
        <img src={ftfeedLogo} alt="FT Feed Logo" className="w-10 h-10 mr-2" />
        Friend Tech Feed
      </div>
      <MetamaskConnect />
    </div>
  );
}

export default Header;
