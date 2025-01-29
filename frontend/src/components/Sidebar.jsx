import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PieChart as PieChartIcon, 
  LineChart as LineChartIcon,
  History as HistoryIcon
} from 'lucide-react';

const MenuItem = ({ icon: Icon, text, path, isActive, navigate }) => (
  <div 
    className={`flex items-center space-x-2 p-3 rounded-lg cursor-pointer
      ${isActive ? 'bg-purple-100 text-purple-600' : 'hover:bg-purple-100'}`}
    onClick={() => navigate(path)}
  >
    <Icon className={isActive ? 'text-purple-600' : 'text-purple-500'} size={20} />
    <span className={isActive ? 'text-purple-600' : 'text-gray-600'}>{text}</span>
  </div>
);

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="w-64 bg-white p-4 border-r">
      <div className="flex items-center space-x-2 mb-8">
        <a href="https://moneyy.ai/" target="_blank" rel="noopener noreferrer">
          <img src="https://moneyy.ai/images/logo.svg" alt="logo" />
        </a>
      </div>

      <div className="space-y-2">
        <MenuItem 
          icon={LayoutDashboard} 
          text="Dashboard" 
          path="/"
          isActive={location.pathname === '/'}
          navigate={navigate}
        />
        <MenuItem 
          icon={PieChartIcon} 
          text="Portfolio" 
          path="/portfolio"
          isActive={location.pathname === '/portfolio'}
          navigate={navigate}
        />
        <MenuItem 
          icon={LineChartIcon} 
          text="Strategy Performance" 
          path="/strategy"
          isActive={location.pathname === '/strategy'}
          navigate={navigate}
        />
        <MenuItem 
          icon={HistoryIcon} 
          text="Trade History" 
          path="/history"
          isActive={location.pathname === '/history'}
          navigate={navigate}
        />
      </div>
    </div>
  );
};

export default Sidebar;