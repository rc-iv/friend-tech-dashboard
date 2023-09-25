import React from "react";
import MetamaskConnect from "../MetamaskConnect/MetamaskConnect";
import ftfeedLogo from "../../assets/images/ftech-dashboard-logo.png";
const Header: React.FC = () => {
  return (
    <div className="bg-black p-4 text-white flex justify-between items-center">
      <div className="text-2xl font-bold flex">
        <img src={ftfeedLogo} alt="FT Feed Logo" className="w-10 h-10 mr-2" />
        Friend Tech Feed
        <a
          href="https://www.friend.tech/rooms/0x85f8c70a0ab0c948a3ed0236e2cc245719ae084c"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div className="flex">
            <img
              src="https://pbs.twimg.com/profile_images/1658158682541109254/Mv2DnQ_1_400x400.jpg"
              alt="RCIV"
              className="w-10 h-10 mr-2 rounded-full ml-20"
            />
            By Rciv
          </div>
        </a>
      </div>
      <MetamaskConnect />
    </div>
  );
};

export default Header;
