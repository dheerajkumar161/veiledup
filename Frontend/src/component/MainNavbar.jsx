import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // Import useAuth from where it is defined
import logo from "../Assets/LOGO.png";
import { FaHome, FaLayerGroup, FaComments, FaBookmark, FaUser, FaSearch } from "react-icons/fa";
import { FiLogOut, FiMenu, FiX } from "react-icons/fi";

export default function MainNavbar({ onSearchChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { logout } = useAuth(); // Get the logout function from the context

  const handleLogout = () => {
    logout(); // Call the logout function from auth context
    setIsOpen(false); // Optionally close the dropdown
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    if (onSearchChange) onSearchChange(value);
  };

  return (
    <nav className="shadow-lg bg-mainblack border-b border-mainwhite p-4 sticky top-0 z-50 w-full flex items-center justify-between text-mainwhite relative">
      <div className="flex items-center gap-3">
        <img className="h-14 w-32 border border-mainwhite rounded-full PX-1" src={logo} alt="Logo" />
      </div>
      
      {/* Search Bar */}
      <div className="flex-1 flex justify-center max-w-md mx-4">
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Search posts..."
            value={search}
            onChange={handleSearchChange}
            className="w-full px-4 py-2 pl-10 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          />
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60" />
        </div>
      </div>

      <div className="flex-1 flex justify-center">
        <div className="hidden md:flex gap-8 items-center">
          <Link to="/main" className={`flex items-center gap-2 px-3 py-2 rounded font-bold transition ${window.location.pathname === '/main' ? 'bg-blue-600 text-white' : 'hover:bg-mainwhite hover:text-mainblack'}`}>
            <FaHome className="text-lg" />
            <span>Home</span>
          </Link>
          <Link to="/categories" className={`flex items-center gap-2 px-3 py-2 rounded font-bold transition ${window.location.pathname.startsWith('/categories') ? 'bg-blue-600 text-white' : 'hover:bg-mainwhite hover:text-mainblack'}`}>
            <FaLayerGroup className="text-lg" />
            <span>Communities</span>
          </Link>
          <Link to="/chat" className={`flex items-center gap-2 px-3 py-2 rounded font-bold transition ${window.location.pathname === '/chat' ? 'bg-blue-600 text-white' : 'hover:bg-mainwhite hover:text-mainblack'}`}>
            <FaComments className="text-lg" />
            <span>Chat</span>
          </Link>
          <Link to="/bookmarks" className={`flex items-center gap-2 px-3 py-2 rounded font-bold transition ${window.location.pathname === '/bookmarks' ? 'bg-blue-600 text-white' : 'hover:bg-mainwhite hover:text-mainblack'}`}>
            <FaBookmark className="text-lg" />
            <span>Bookmarks</span>
          </Link>
          <Link to="/profile" className={`flex items-center gap-2 px-3 py-2 rounded font-bold transition ${window.location.pathname === '/profile' ? 'bg-blue-600 text-white' : 'hover:bg-mainwhite hover:text-mainblack'}`}>
            <FaUser className="text-lg" />
            <span>Profile</span>
          </Link>
        </div>
      </div>
      <button
        onClick={handleLogout}
        className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500 text-red-400 hover:bg-red-500 hover:text-white font-bold transition ml-4"
      >
        <FiLogOut className="text-xl" />
        <span>Logout</span>
      </button>
      <button
        className="md:hidden flex items-center ml-2 text-3xl p-2 rounded hover:bg-white/10 focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <FiX /> : <FiMenu />}
      </button>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="w-72 max-w-full h-full bg-mainblack/90 backdrop-blur-lg border-l border-mainwhite flex flex-col p-6 gap-4 shadow-2xl animate-slide-in-right relative">
            <button className="absolute top-4 right-4 text-3xl text-mainwhite hover:text-blue-400" onClick={() => setIsOpen(false)}><FiX /></button>
            
            {/* Mobile Search Bar */}
            <div className="relative mt-8 mb-4">
              <input
                type="text"
                placeholder="Search posts..."
                value={search}
                onChange={handleSearchChange}
                className="w-full px-4 py-3 pl-10 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60" />
            </div>
            
            <div className="flex flex-col gap-4">
              <Link to="/main" onClick={() => setIsOpen(false)} className={`flex items-center gap-3 px-3 py-3 rounded-lg font-bold text-lg transition ${window.location.pathname === '/main' ? 'bg-blue-600 text-white' : 'hover:bg-mainwhite hover:text-mainblack'}`}><FaHome className="text-xl" /><span>Home</span></Link>
              <Link to="/categories" onClick={() => setIsOpen(false)} className={`flex items-center gap-3 px-3 py-3 rounded-lg font-bold text-lg transition ${window.location.pathname.startsWith('/categories') ? 'bg-blue-600 text-white' : 'hover:bg-mainwhite hover:text-mainblack'}`}><FaLayerGroup className="text-xl" /><span>Communities</span></Link>
              <Link to="/chat" onClick={() => setIsOpen(false)} className={`flex items-center gap-3 px-3 py-3 rounded-lg font-bold text-lg transition ${window.location.pathname === '/chat' ? 'bg-blue-600 text-white' : 'hover:bg-mainwhite hover:text-mainblack'}`}><FaComments className="text-xl" /><span>Chat</span></Link>
              <Link to="/bookmarks" onClick={() => setIsOpen(false)} className={`flex items-center gap-3 px-3 py-3 rounded-lg font-bold text-lg transition ${window.location.pathname === '/bookmarks' ? 'bg-blue-600 text-white' : 'hover:bg-mainwhite hover:text-mainblack'}`}><FaBookmark className="text-xl" /><span>Bookmarks</span></Link>
              <Link to="/profile" onClick={() => setIsOpen(false)} className={`flex items-center gap-3 px-3 py-3 rounded-lg font-bold text-lg transition ${window.location.pathname === '/profile' ? 'bg-blue-600 text-white' : 'hover:bg-mainwhite hover:text-mainblack'}`}><FaUser className="text-xl" /><span>Profile</span></Link>
            </div>
            <button
              onClick={() => { handleLogout(); setIsOpen(false); }}
              className="flex items-center gap-3 px-3 py-3 rounded-lg border border-red-500 text-red-400 hover:bg-red-500 hover:text-white font-bold transition mt-auto"
            >
              <FiLogOut className="text-xl" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
