import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [balance, setBalance] = useState(0); 
  const userId = "679a3497cf47a1fb86c7f84f"; // MongoDB ObjectId for testuser

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const response = await api.get(`/user/balance/${userId}`);
        console.log('Balance response:', response.data);
        
        if (response.data && typeof response.data.balance === 'number') {
          setBalance(response.data.balance);
        }
      } catch (error) {
        console.error('Error fetching balance:', error);
      }
    };

    fetchBalance();
  }, [userId]);

  const updateBalance = async (amount) => {
    try {
      const response = await api.put('/user/balance', {
        userId,
        amount
      });
      
      if (response.data && typeof response.data.balance === 'number') {
        setBalance(response.data.balance);
      }
    } catch (error) {
      console.error('Error updating balance:', error);
    }
  };

  return (
    <WalletContext.Provider value={{ balance, updateBalance }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);