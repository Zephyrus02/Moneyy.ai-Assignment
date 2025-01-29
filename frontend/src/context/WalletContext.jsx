import React, { createContext, useContext, useState } from 'react';

const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [balance, setBalance] = useState(100000); // Starting balance $100,000

  const updateBalance = (amount) => {
    setBalance(prevBalance => prevBalance + amount);
  };

  return (
    <WalletContext.Provider value={{ balance, updateBalance }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);