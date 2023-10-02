import React from "react";
import ftfeedLogo from "../../assets/images/ftech-dashboard-logo.png";
import { ConnectButton } from "@rainbow-me/rainbowkit";

interface HeaderProps {
  isSubscriber: boolean;
}
const Header: React.FC<HeaderProps> = ({ isSubscriber }) => {
  return (
    <div className="bg-black p-4 text-white flex flex-col sm:flex-row justify-between items-center">
      <div className="text-2xl font-bold flex flex-col sm:flex-row w-full sm:w-1/3 items-center">
        {/* Logo and Brand Name */}
        <div className="flex items-center mb-4 sm:mb-0">
          <img src={ftfeedLogo} alt="FT Feed Logo" className="w-10 h-10 mr-2" />
          Friend Tech Feed
        </div>
        {/* By Rciv section */}
        <a
          href="https://www.friend.tech/rooms/0x85f8c70a0ab0c948a3ed0236e2cc245719ae084c"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center mb-8 sm:mb-0 sm:ml-20"
        >
          <img
            src="https://pbs.twimg.com/profile_images/1658158682541109254/Mv2DnQ_1_400x400.jpg"
            alt="RCIV"
            className="w-10 h-10 mr-2 rounded-full"
          />
          By Rciv
        </a>
      </div>
      {isSubscriber ? (
        <div className="text-sm text-gray-400 ">
          <span className="text-[#c4ff0e] bg-gray-700 rounded-lg sm:p-4 font-bold">
            Thank you for owning an RCIV family key
          </span>
        </div>
      ) : (
        <div className="text-sm text-gray-400">
          <span className="text-[#c4ff0e] bg-gray-700 rounded-lg sm:p-4 font-bold">
            <a
              href="https://www.friend.tech/trades/0x85f8c70a0ab0c948a3ed0236e2cc245719ae084c"
              target="_blank"
              rel="noopener noreferrer"
            >
              Purchase my key or one of my holder's keys to access real time
              data.
            </a>
          </span>
        </div>
      )}

      <div className="mt-8 sm:mt-0">
        <ConnectButton />
      </div>
    </div>
  );
};

export default Header;
