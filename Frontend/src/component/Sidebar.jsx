import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStar,
  faRunning,
  faGraduationCap,
  faUsers,
  faFutbol,
  faMicrochip,
  faQuestionCircle,
  faBriefcase,
  faSuitcase,
  faBoxOpen,
} from "@fortawesome/free-solid-svg-icons";
import { FaBars, FaTimes, FaFilter } from "react-icons/fa";

const categoryOptions = [
  { name: "Hackathon", icon: faRunning },
  { name: "Academic", icon: faGraduationCap },
  { name: "Cultural", icon: faUsers },
  { name: "Sports", icon: faFutbol },
  { name: "Fest", icon: faStar },
  { name: "Tech", icon: faMicrochip },
  { name: "General", icon: faQuestionCircle },
  { name: "Internships", icon: faBriefcase },
  { name: "Jobs", icon: faSuitcase },
  { name: "Lost & Found", icon: faBoxOpen },
];

const Sidebar = ({ toggleSidebar, sidebarOpen, onCategoryFilter }) => {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [showFilter, setShowFilter] = useState(false);

  const handleCategoryToggle = (category) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(cat => cat !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  const handleFilter = () => {
    if (onCategoryFilter) {
      onCategoryFilter(selectedCategories);
    }
  };

  const handleCategoryClick = (category) => {
    if (onCategoryFilter) {
      onCategoryFilter([category]);
    }
  };

  return (
    <div className="w-64 h-full p-5 bg-mainblack border-r-2 border-mainwhite text-mainwhite flex flex-col gap-4 min-h-screen">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-mainwhite">Categories</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilter(!showFilter)}
              className="bg-mainwhite text-mainblack p-2 rounded-lg hover:bg-gray-200 transition-all duration-200"
              title="Filter by multiple categories"
            >
              <FaFilter size={12} />
            </button>
            <button
              onClick={toggleSidebar}
              className="bg-mainwhite text-mainblack p-2 rounded-lg hover:bg-gray-200 transition-all duration-200"
              title={`${sidebarOpen ? 'Close' : 'Open'} sidebar (Ctrl+B)`}
            >
              {sidebarOpen ? <FaTimes size={14} /> : <FaBars size={14} />}
            </button>
          </div>
        </div>

        {/* Multiple Category Filter */}
        {showFilter && (
          <div className="mb-4 p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
            <h3 className="text-white font-bold mb-2 text-sm">Filter by Categories</h3>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {categoryOptions.map((category) => (
                <label key={category.name} className="flex items-center gap-2 cursor-pointer hover:bg-gray-700/50 p-1 rounded">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category.name)}
                    onChange={() => handleCategoryToggle(category.name)}
                    className="w-3 h-3 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <FontAwesomeIcon icon={category.icon} className="text-blue-400 text-xs" />
                  <span className="text-white text-xs">{category.name}</span>
                </label>
              ))}
            </div>
            {selectedCategories.length > 0 && (
              <div className="mt-2 flex gap-2">
                <button
                  onClick={handleFilter}
                  className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                >
                  Apply Filter
                </button>
                <button
                  onClick={() => setSelectedCategories([])}
                  className="bg-gray-600 text-white px-2 py-1 rounded text-xs hover:bg-gray-700"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        )}

        {/* Single Category Links */}
        <ul className="space-y-2">
          {categoryOptions.map((category) => (
            <li key={category.name}>
              <a 
                href={`/${category.name}`} 
                className="flex items-center gap-3 px-4 py-2 rounded hover:bg-mainwhite hover:text-mainblack transition font-semibold"
                onClick={(e) => {
                  e.preventDefault();
                  handleCategoryClick(category.name);
                }}
              >
                <FontAwesomeIcon icon={category.icon} className="text-blue-400" /> 
                {category.name}
              </a>
            </li>
          ))}
        </ul>
      </div>
      {/* User Section */}
      
    </div>
  );
};

export default Sidebar;
