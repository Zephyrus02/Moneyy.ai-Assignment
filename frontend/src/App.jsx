import React from "react";
import Footer from './components/Footer';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Portfolio from './pages/Portfolio';
import Strategy from './pages/Strategy';
import History from './pages/History';
import Sidebar from './components/Sidebar';
import { WalletProvider } from './context/WalletContext';

const App = () => {
  return (
    <Router>
      <WalletProvider>
        <div className="flex flex-col min-h-screen bg-gray-50">
          <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="/strategy" element={<Strategy />} />
                <Route path="/history" element={<History />} />
              </Routes>
            </div>
          </div>
          <Footer />
        </div>
      </WalletProvider>
    </Router>
  );
};

export default App;