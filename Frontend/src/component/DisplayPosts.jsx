import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaRegHeart, FaRegComment, FaRegShareSquare, FaRegBookmark, FaBookmark } from "react-icons/fa";

// Helper to get bookmarks from localStorage
export function getBookmarkedPostIds() {
  return JSON.parse(localStorage.getItem('bookmarks') || '[]');
}

function setBookmarkedPostIds(ids) {
  localStorage.setItem('bookmarks', JSON.stringify(ids));
}

const DisplayPosts = ({ search = "" }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentTexts, setCommentTexts] = useState({});
  const [openMenuId, setOpenMenuId] = useState(null);
  const [openShareMenuId, setOpenShareMenuId] = useState(null);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('trending');

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.REACT_APP_API_URL}/upload/posts`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) throw new Error("Failed to fetch posts");
        const data = await response.json();
        setPosts(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching posts:", error);
        setError("Failed to load posts");
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const handleLike = async (postId) => {
    const savedUser = JSON.parse(localStorage.getItem('user'));
    const userId = savedUser?.user?.email;
    const response = await fetch(`${process.env.REACT_APP_API_URL}/upload/${postId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (response.ok) {
      const updatedPost = await response.json();
      setPosts((prev) => prev.map((p) => (p._id === postId ? updatedPost : p)));
    }
  };

  const handleReport = (postId) => {
    setOpenMenuId(null);
    alert(`Report Tweet: ${postId}`);
    // TODO: Connect to backend report logic
  };

  // Function to count only direct comments (not nested replies)
  const countDirectComments = (comments) => {
    if (!comments) return 0;
    return comments.length;
  };

  // Filtering logic for tabs
  let filteredPosts = [...posts];
  if (search && search.trim() !== "") {
    const s = search.trim().toLowerCase();
    filteredPosts = filteredPosts.filter(post =>
      (post.title && post.title.toLowerCase().includes(s)) ||
      (post.author && post.author.toLowerCase().includes(s)) ||
      (post.tags && post.tags.join(",").toLowerCase().includes(s))
    );
  }
  if (activeTab === 'recent') {
    filteredPosts = filteredPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (activeTab === 'mostLiked') {
    filteredPosts = filteredPosts.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
  } // trending is default order

  const isBookmarked = (postId) => getBookmarkedPostIds().includes(postId);
  const handleBookmark = (postId) => {
    let bookmarks = getBookmarkedPostIds();
    if (bookmarks.includes(postId)) {
      bookmarks = bookmarks.filter(id => id !== postId);
    } else {
      bookmarks.push(postId);
    }
    setBookmarkedPostIds(bookmarks);
    // Optionally, trigger a re-render
    setPosts([...posts]);
  };

  if (loading) return <p>Loading posts...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="flex flex-col gap-8 w-full max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto">
      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setActiveTab('trending')} className={`flex-1 px-4 py-2 rounded-lg font-bold text-base transition ${activeTab === 'trending' ? 'bg-blue-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>Trending</button>
        <button onClick={() => setActiveTab('recent')} className={`flex-1 px-4 py-2 rounded-lg font-bold text-base transition ${activeTab === 'recent' ? 'bg-blue-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>Recent</button>
        <button onClick={() => setActiveTab('mostLiked')} className={`flex-1 px-4 py-2 rounded-lg font-bold text-base transition ${activeTab === 'mostLiked' ? 'bg-blue-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>Most Liked</button>
      </div>
      {filteredPosts.map((post) => {
        const savedUser = JSON.parse(localStorage.getItem('user'));
        const userId = savedUser?.user?.email;
        const liked = post.likes && post.likes.includes(userId);
        const directComments = countDirectComments(post.comments);
        const username = post.author || "Anonymous";
        const timeString = post.createdAt ? timeAgo(new Date(post.createdAt)) : '';
        return (
          <div
            key={post._id}
            onClick={() => navigate(`/post/${post._id}`)}
            className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 shadow-lg flex flex-col gap-2 text-white cursor-pointer hover:shadow-2xl transition-shadow duration-200 w-full"
          >
            {/* Top Row: Avatar, Username, Category, Time, Menu */}
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-xl font-bold text-white">
                {username[0]}
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-white text-base">{username}</span>
                <span className="text-xs text-white/60">{timeString}</span>
              </div>
              {post.tags && post.tags.length > 0 && (
                <span className="ml-3 px-3 py-1 rounded-full bg-blue-700 text-white text-xs font-bold">{post.tags[0]}</span>
              )}
              <div className="ml-auto flex items-center gap-2 relative">
                <button
                  className="text-2xl text-white/60 hover:text-blue-400 px-2 py-1 rounded-full focus:outline-none border border-white/20 shadow"
                  onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === post._id ? null : post._id); setOpenShareMenuId(null); }}
                >
                  ...
                </button>
                {/* Dropdown menu */}
                {openMenuId === post._id && (
                  <div className="absolute right-0 top-8 mt-2 w-44 bg-white/20 backdrop-blur rounded-xl shadow-2xl z-50 border border-white/30 animate-fade-in">
                    <button
                      className="block w-full text-left px-4 py-2 text-sm text-blue-400 hover:bg-white/30 hover:text-blue-600 shadow"
                      onClick={e => { e.stopPropagation(); handleReport(post._id); }}
                    >
                      Report
                    </button>
                  </div>
                )}
              </div>
            </div>
            {/* Post Text */}
            <div className="text-white text-base mb-2 break-words">{post.title}</div>
            {/* Post Image (if any) */}
            {post.photo && (
              <img
                src={`${process.env.REACT_APP_API_URL}/${post.photo}`}
                alt={post.title}
                className="w-full max-w-full h-auto object-contain rounded-xl mb-2 border border-white/10 bg-white/5"
                style={{ maxHeight: '40vh' }}
                onClick={e => e.stopPropagation()}
              />
            )}
            {/* Icons Row */}
            <div className="flex items-center gap-8 text-white/70 mt-2">
              <button
                onClick={e => { e.stopPropagation(); handleLike(post._id); }}
                className={`flex items-center gap-2 text-lg ${liked ? 'text-blue-400' : 'hover:text-blue-400'}`}
              >
                <FaRegHeart />
                <span className="text-base">{post.likes ? post.likes.length : 0}</span>
              </button>
              <div className="flex items-center gap-2 text-lg">
                <FaRegComment />
                <span className="text-base">{directComments}</span>
              </div>
              <button
                onClick={e => { e.stopPropagation(); handleBookmark(post._id); }}
                className={`flex items-center gap-2 text-lg ${isBookmarked(post._id) ? 'text-blue-400' : 'hover:text-blue-400'}`}
              >
                {isBookmarked(post._id) ? <FaBookmark /> : <FaRegBookmark />}
              </button>
              <button
                onClick={e => { e.stopPropagation(); setOpenShareMenuId(openShareMenuId === post._id ? null : post._id); setOpenMenuId(null); }}
                className="flex items-center gap-2 text-lg hover:text-blue-400 relative"
              >
                <FaRegShareSquare />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Helper for time ago
function timeAgo(date) {
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default DisplayPosts;