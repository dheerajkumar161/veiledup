import React, { useState } from "react";
import DisplayPosts from "./DisplayPosts";
import { FaClock, FaFire, FaHeart, FaFilter } from "react-icons/fa";
import { Link } from "react-router-dom";

export default function Home() {
  const [selectedTab, setSelectedTab] = useState("recent");

  const tabs = [
    { key: "recent", label: "Recent", icon: <FaClock /> },
    { key: "trending", label: "Trending", icon: <FaFire /> },
    { key: "liked", label: "Most Liked", icon: <FaHeart /> },
    { key: "mood", label: "Mood", icon: <FaFilter /> },
  ];

  return (
    <div className="min-h-screen bg-mainblack flex flex-col items-center text-mainyellow">
      {/* Top nav bar is handled elsewhere (MainNavbar) */}
      <div className="w-full max-w-3xl mt-12 mb-8">
        <div className="bg-mainblack border-2 border-mainyellow rounded-2xl p-8 flex flex-col items-center shadow-lg">
          <h1 className="text-3xl md:text-4xl font-bold text-mainyellow mb-2 text-center">Welcome to VeiledUP <span role="img" aria-label="mask">🎭</span></h1>
          <p className="text-mainyellow text-center text-lg mb-2">Share your thoughts, connect anonymously, and be your authentic self.</p>
        </div>
        {/* Tab bar */}
        <div className="flex justify-center gap-4 mt-8 mb-4">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-base font-bold border-2 border-mainyellow transition-colors duration-150 ${selectedTab === tab.key ? 'bg-mainyellow text-mainblack' : 'bg-mainblack text-mainyellow hover:bg-mainyellow hover:text-mainblack'}`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
        {/* Login/Register buttons */}
        <div className="flex justify-center gap-4 mt-4">
          <Link to="/login" className="bg-mainblack text-mainyellow border-2 border-mainyellow font-bold py-2 px-6 rounded-full transition hover:bg-mainyellow hover:text-mainblack">Login</Link>
          <Link to="/register" className="bg-mainblack text-mainyellow border-2 border-mainyellow font-bold py-2 px-6 rounded-full transition hover:bg-mainyellow hover:text-mainblack">Register</Link>
        </div>
      </div>
      {/* Posts list */}
      <div className="w-full max-w-2xl">
        <DisplayPosts selectedTab={selectedTab} />
      </div>
      {/* Floating + button is handled elsewhere */}
    </div>
  );
}
