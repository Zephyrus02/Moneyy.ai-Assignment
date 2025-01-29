import React from 'react';
import { Wallet as WalletIcon } from 'lucide-react';
import { useWallet } from '../context/WalletContext';

const Wallet = () => {
  const { balance } = useWallet();
  
  return (
    <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-sm">
      <WalletIcon className="text-purple-500" size={20} />
      <span className="font-medium">
        ${balance.toLocaleString()}
      </span>
    </div>
  );
};

export default Wallet;