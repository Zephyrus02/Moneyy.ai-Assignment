import React from 'react';
import { Github, Linkedin } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <img 
              src="https://moneyy.ai/images/logo.svg" 
              alt="Moneyy.ai" 
              className="h-8"
            />
            <p className="text-gray-600 text-sm">
              Advanced portfolio analytics and management platform
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-800 mb-4">Product</h3>
            <ul className="space-y-2 text-gray-600 text-sm">
              <li><a href="#features" className="hover:text-purple-600">Features</a></li>
              <li><a href="#pricing" className="hover:text-purple-600">Pricing</a></li>
              <li><a href="#docs" className="hover:text-purple-600">Documentation</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-800 mb-4">Company</h3>
            <ul className="space-y-2 text-gray-600 text-sm">
              <li><a href="#about" className="hover:text-purple-600">About</a></li>
              <li><a href="#blog" className="hover:text-purple-600">Blog</a></li>
              <li><a href="#careers" className="hover:text-purple-600">Careers</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-800 mb-4">Connect</h3>
            <div className="flex space-x-4">
              <a 
                href="https://github.com/Zephyrus02" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-purple-600"
              >
                <Github size={20} />
              </a>
              <a 
                href="https://www.linkedin.com/in/aneesh-raskar/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-purple-600"
              >
                <Linkedin size={20} />
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t mt-8 pt-8 text-center text-sm text-gray-600">
          <p>&copy; {currentYear} Aneesh Raskar. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;