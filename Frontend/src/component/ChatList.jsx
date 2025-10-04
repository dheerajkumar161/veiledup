import React, { useState, useEffect, useRef } from "react";
import ChatWindow from "./ChatWindow";
import { FaCircle } from "react-icons/fa";

const SOCKET_URL = process.env.REACT_APP_API_URL;

export default function ChatList() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const searchInputRef = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const currentUserId = currentUser?.user?._id;

  // Filter users based on search term
  const filteredUsers = users.filter(user => {
    if (!searchTerm) return user._id !== currentUserId;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      user._id !== currentUserId && (
        user._id.toLowerCase().includes(searchLower) ||
        (user.name && user.name.toLowerCase().includes(searchLower))
      )
    );
  });

  // Keyboard shortcut to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch users
        const usersResponse = await fetch(`${SOCKET_URL}/api/auth/users`);
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          setUsers(usersData);
        } else {
          console.error('Failed to fetch users');
          setUsers([]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load chat data');
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    if (currentUserId) {
      fetchData();
    }
  }, [currentUserId]);

  return (
    <div className="flex flex-col md:flex-row h-full min-h-screen bg-black">
      {/* Sidebar: responsive width and collapses on small screens */}
      <div className="w-full md:w-1/3 lg:w-1/4 xl:w-1/5 bg-[#18191c] p-4 border-b-2 md:border-b-0 md:border-r-2 border-mainwhite rounded-3xl md:rounded-3xl shadow-2xl min-h-[60px] md:min-h-screen flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-mainwhite text-xl">Chats</h2>
          <button className="bg-red-500 hover:bg-red-600 text-white rounded-full p-2 text-2xl shadow-lg transition">+</button>
        </div>
        {/* Search Input */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search chats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 pl-8 pr-8 border border-mainwhite rounded-lg focus:outline-none focus:ring-2 focus:ring-mainwhite bg-[#232428] text-mainwhite font-bold placeholder-mainwhite text-base"
              ref={searchInputRef}
            />
            <span className="absolute left-2 top-2.5 text-mainwhite">🔍</span>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-2.5 text-mainwhite hover:text-mainblack hover:bg-mainwhite rounded-full px-1"
              >
                ×
              </button>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mainwhite mx-auto"></div>
              <p className="text-mainwhite mt-2">Loading...</p>
            </div>
          )}
          {error && (
            <div className="text-mainwhite p-2 mb-4 bg-mainblack border-2 border-mainwhite rounded">
              {error}
            </div>
          )}
          {!loading && !error && (
            <div>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user, idx) => (
                  <div
                    key={user._id}
                    className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer border border-transparent mb-2 transition shadow-md ${selectedUser && selectedUser._id === user._id ? 'bg-[#232428] border-blue-500' : 'hover:bg-[#232428] bg-[#18191c]'}`}
                    onClick={() => setSelectedUser(user)}
                  >
                    {/* Avatar with initial */}
                    <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-2xl font-bold text-white relative">
                      {user.name ? user.name[0] : 'A'}
                      <span className="absolute bottom-1 right-1"><FaCircle className="text-green-400 text-xs" /></span>
                    </div>
                    {/* Name and last message */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-mainwhite truncate">{user.name || 'Anonymous User'}</div>
                      <div className="text-mainwhite/70 text-sm truncate">{user.lastMessage || 'No messages yet...'}</div>
                    </div>
                    {/* Time and unread badge */}
                    <div className="flex flex-col items-end gap-1 min-w-[40px]">
                      <span className="text-xs text-mainwhite/60">{user.lastMessageTime || ''}</span>
                      {user.unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold">{user.unreadCount}</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-mainwhite text-center py-4">
                  {searchTerm ? 'No users found matching your search.' : 'No users available.'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Chat window: responsive grow and padding */}
      <div className="flex-1 bg-black min-h-[300px] p-2 md:p-0 flex items-stretch">
        {selectedUser && <ChatWindow selectedUser={selectedUser} />}
        {!selectedUser && <div className="flex items-center justify-center w-full text-mainwhite text-center text-lg font-bold">Select a user to chat.</div>}
      </div>
    </div>
  );
} 