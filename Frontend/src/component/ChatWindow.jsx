import React, { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import { useNavigate } from "react-router-dom";
import { FaPaperPlane, FaCircle } from "react-icons/fa";

const SOCKET_URL = process.env.REACT_APP_API_URL;
let socket = null;

const ChatWindow = ({ selectedUser }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [image, setImage] = useState(null);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [socketConnected, setSocketConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const [selectedMessageIds, setSelectedMessageIds] = useState([]);
  const [multiSelectMode, setMultiSelectMode] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem("user"));
  const currentUserId = currentUser?.user?._id;

  // Initialize socket connection
  useEffect(() => {
    if (!currentUserId) {
      setError("User not authenticated");
      return;
    }

    // Create socket connection if it doesn't exist
    if (!socket) {
      socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
      });

      socket.on('connect', () => {
        console.log('Connected to socket server');
        setSocketConnected(true);
        setError(null);
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setError('Failed to connect to chat server');
        setSocketConnected(false);
      });

      socket.on('disconnect', () => {
        console.log('Disconnected from socket server');
        setSocketConnected(false);
      });
    }

    // Join user room
    socket.emit("join", currentUserId);

    return () => {
      // Don't disconnect socket here, just leave the room
      if (socket && socketConnected) {
        socket.emit('leave', currentUserId);
      }
    };
  }, [currentUserId]);

  // Typing indicator logic
  useEffect(() => {
    if (!socket || !socketConnected) return;
    
    const handleTyping = ({ from }) => {
      if (from !== currentUserId) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 2000);
      }
    };

    socket.on('typing', handleTyping);
    return () => {
      socket.off('typing', handleTyping);
    };
  }, [socketConnected, currentUserId, socket]);

  // Notification logic
  useEffect(() => {
    if (!socket || !socketConnected) return;
    
    const handleNotify = (data) => {
      setNotifications((prev) => [...prev, data]);
      // Auto-remove notifications after 5 seconds
      setTimeout(() => {
        setNotifications((prev) => prev.filter(n => n !== data));
      }, 5000);
    };

    socket.on('notify', handleNotify);
    return () => {
      socket.off('notify', handleNotify);
    };
  }, [socketConnected]);

  // Send typing event
  const handleTyping = () => {
    if (selectedUser && socket && socketConnected) {
      socket.emit('typing', { to: selectedUser._id });
    }
  };

  // Fetch chat history
  useEffect(() => {
    if (!selectedUser || !currentUserId) return;
    
    const fetchMessages = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(
          `${SOCKET_URL}/api/chat/between/${currentUserId}/${selectedUser._id}`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setMessages(data);
      } catch (error) {
        console.error('Error fetching messages:', error);
        setError("Failed to load messages: " + error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMessages();
  }, [selectedUser, currentUserId]);

  // Listen for real-time messages
  useEffect(() => {
    if (!socket || !socketConnected || !selectedUser) return;
    
    const handleReceive = (msg) => {
      // Only add if it's for this chat
      if (
        (msg.sender === currentUserId && msg.receiver === selectedUser._id) ||
        (msg.sender === selectedUser._id && msg.receiver === currentUserId)
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    socket.on("receive_message", handleReceive);
    return () => {
      socket.off("receive_message", handleReceive);
    };
  }, [socketConnected, selectedUser, currentUserId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send text or image message
  const handleSend = async () => {
    if ((!newMessage.trim() && !image) || !selectedUser || !currentUserId) return;
    
    setSending(true);
    try {
      let msg = null;
      
      if (image) {
        // Send image message
        const formData = new FormData();
        formData.append("sender", currentUserId);
        formData.append("receiver", selectedUser._id);
        formData.append("image", image);
        
        const response = await fetch(`${SOCKET_URL}/api/chat/send-image`, {
          method: "POST",
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        msg = await response.json();
      } else {
        // Send text message
        const response = await fetch(`${SOCKET_URL}/api/chat/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sender: currentUserId,
            receiver: selectedUser._id,
            content: newMessage,
          }),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        msg = await response.json();
      }
      
      if (msg) {
        setMessages((prev) => [...prev, msg]);
        // Emit real-time event
        if (socket && socketConnected) {
          socket.emit("send_message", {
            sender: msg.sender._id || msg.sender,
            receiver: msg.receiver._id || msg.receiver,
            content: msg.content,
            image: msg.image,
            _id: msg._id,
          });
        }
        setNewMessage("");
        setImage(null);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert("Failed to send message: " + error.message);
    } finally {
      setSending(false);
    }
  };

  // Handle Enter key press
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    handleTyping();
  };

  const handleToggleSelectMessage = (msgId) => {
    if (!multiSelectMode) return;
    setSelectedMessageIds((prev) =>
      prev.includes(msgId) ? prev.filter(id => id !== msgId) : [...prev, msgId]
    );
  };

  const handleRightClickMessage = (e, msgId) => {
    e.preventDefault();
    if (!multiSelectMode) {
      setMultiSelectMode(true);
      setSelectedMessageIds([msgId]);
    } else {
      handleToggleSelectMessage(msgId);
    }
  };

  const handleCancelMultiSelect = () => {
    setMultiSelectMode(false);
    setSelectedMessageIds([]);
  };

  const handleDeleteForMe = async (messageIds) => {
    try {
      await Promise.all(messageIds.map(messageId =>
        fetch(`${SOCKET_URL}/api/chat/delete-for-me/${messageId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUserId })
        })
      ));
      setMessages((prev) => prev.filter((msg) => !messageIds.includes(msg._id)));
      setSelectedMessageIds([]);
      setMultiSelectMode(false);
    } catch (err) {
      alert('Failed to delete message(s) for yourself.');
    }
  };

  const handleDeleteForEveryone = async (messageIds) => {
    try {
      await Promise.all(messageIds.map(messageId =>
        fetch(`${SOCKET_URL}/api/chat/${messageId}?userId=${currentUserId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        })
      ));
      setMessages((prev) => prev.filter((msg) => !messageIds.includes(msg._id)));
      setSelectedMessageIds([]);
      setMultiSelectMode(false);
    } catch (err) {
      alert('Failed to delete message(s) for everyone.');
    }
  };

  if (!currentUserId) {
    return <div className="flex-1 flex items-center justify-center bg-black text-mainwhite">Please log in to chat.</div>;
  }
  
  if (!selectedUser) {
    return <div className="flex-1 flex items-center justify-center bg-black text-mainwhite">Select a user to start chatting.</div>;
  }
  
  if (loading) {
    return <div className="flex-1 flex items-center justify-center bg-black text-mainwhite">Loading chat...</div>;
  }
  
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="text-red-500 mb-2">{error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full flex-1 bg-[#18191c] rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
      {/* Top Bar: Avatar, Username, Online Status */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-white/10 bg-[#232428] rounded-t-3xl">
        <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-2xl font-bold text-white relative">
          {selectedUser.name ? selectedUser.name[0] : 'A'}
          <span className="absolute bottom-1 right-1"><FaCircle className="text-green-400 text-xs" /></span>
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-mainwhite text-lg">{selectedUser.name || 'Anonymous User'}</span>
          <span className="flex items-center gap-1 text-green-400 text-xs font-bold"><FaCircle className="text-green-400 text-xs" /> Online</span>
        </div>
      </div>
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 bg-transparent">
        {isTyping && (
          <div className="text-xs text-mainwhite mb-2 italic">
            {selectedUser.name} is typing...
          </div>
        )}
        {messages.length === 0 ? (
          <div className="text-center text-mainwhite mt-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg) => {
            const isSelected = selectedMessageIds.includes(msg._id);
            const isMine = (msg.sender._id || msg.sender) === currentUserId;
            return (
              <div
                key={msg._id}
                className={`mb-4 flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`relative max-w-[70%] px-5 py-3 rounded-2xl shadow-lg break-words font-medium text-base transition-all border border-white/10 ${isMine ? "bg-red-500 text-white rounded-br-md" : "bg-[#232428] text-mainwhite rounded-bl-md"} ${isSelected ? 'ring-2 ring-mainwhite' : ''}`}
                  onClick={() => handleToggleSelectMessage(msg._id)}
                  onContextMenu={e => handleRightClickMessage(e, msg._id)}
                >
                  {msg.content && <div>{msg.content}</div>}
                  {msg.image && (
                    <img
                      src={`${SOCKET_URL}${msg.image}`}
                      alt="chat-img"
                      className="mt-2 max-w-[200px] rounded-xl shadow border border-white/20"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                  <div className={`text-xs opacity-70 mt-2 flex items-center gap-2 ${isMine ? 'justify-end text-white/80' : 'justify-start text-mainwhite/60'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
        {multiSelectMode && selectedMessageIds.length > 0 && (
          <div className="fixed bottom-24 left-0 w-full flex justify-center z-50">
            <div className="flex items-center gap-4 bg-[#232428] border-2 border-mainwhite shadow-lg rounded-full px-6 py-3">
              <span className="font-bold text-mainwhite">{selectedMessageIds.length} message{selectedMessageIds.length > 1 ? 's' : ''} selected</span>
              <button
                className="bg-[#232428] hover:bg-mainwhite text-mainwhite hover:text-mainblack border-2 border-mainwhite px-4 py-2 rounded-full font-bold transition"
                onClick={() => handleDeleteForMe(selectedMessageIds)}
              >
                Delete for me
              </button>
              <button
                className="bg-[#232428] hover:bg-mainwhite text-mainwhite hover:text-mainblack border-2 border-mainwhite px-4 py-2 rounded-full font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handleDeleteForEveryone(selectedMessageIds)}
                disabled={
                  !selectedMessageIds.every(id => {
                    const msg = messages.find(m => m._id === id);
                    return msg && (msg.sender._id || msg.sender) === currentUserId;
                  })
                }
                title={selectedMessageIds.every(id => {
                  const msg = messages.find(m => m._id === id);
                  return msg && (msg.sender._id || msg.sender) === currentUserId;
                }) ? '' : 'You can only delete your own messages for everyone.'}
              >
                Delete for everyone
              </button>
              <button
                className="ml-2 bg-[#232428] hover:bg-mainwhite text-mainwhite hover:text-mainblack border-2 border-mainwhite px-4 py-2 rounded-full font-bold transition"
                onClick={handleCancelMultiSelect}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Notification badge/popup */}
      {notifications.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-[#232428] border-2 border-mainwhite px-4 py-2 rounded shadow-lg z-50 max-w-xs">
          {notifications.map((n, i) => (
            <div key={i} className="text-sm text-mainwhite font-bold">
              {n.type === 'private' && `New message from ${n.from}`}
            </div>
          ))}
        </div>
      )}
      {/* Input Area */}
      <div className="p-4 bg-[#232428] border-t border-white/10 rounded-b-3xl">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 border-none rounded-full p-3 bg-[#18191c] text-mainwhite font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-mainwhite shadow"
            placeholder="Type a message..."
            onKeyDown={handleKeyDown}
            disabled={sending || !socketConnected}
          />
          <input
            type="file"
            accept="image/*"
            onChange={e => setImage(e.target.files[0])}
            className="hidden"
            id="chat-image-upload"
            disabled={sending}
          />
          <label 
            htmlFor="chat-image-upload" 
            className={`cursor-pointer bg-[#18191c] border-none p-3 rounded-full hover:bg-mainwhite hover:text-mainblack text-mainwhite font-bold transition ${sending ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            📷
          </label>
          {image && (
            <div className="flex items-center gap-1">
              <img 
                src={URL.createObjectURL(image)} 
                alt="preview" 
                className="w-8 h-8 object-cover rounded border-2 border-mainwhite" 
              />
              <button 
                onClick={() => setImage(null)} 
                className="text-mainwhite hover:text-mainblack hover:bg-mainwhite rounded-full px-1 border-2 border-mainwhite"
              >
                ✕
              </button>
            </div>
          )}
          <button
            onClick={handleSend}
            className={`flex items-center justify-center w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 text-white text-2xl shadow-lg transition border-none ${sending || !socketConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={sending || !socketConnected}
          >
            <FaPaperPlane />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow; 