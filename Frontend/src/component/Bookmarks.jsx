import React, { useEffect, useState } from 'react';
import { getBookmarkedPostIds } from './DisplayPosts';
import { useNavigate } from 'react-router-dom';
import { FaRegHeart, FaRegComment, FaRegShareSquare, FaBookmark } from 'react-icons/fa';

const Bookmarks = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPosts = async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/upload/posts`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      const bookmarkedIds = getBookmarkedPostIds();
      setPosts(data.filter(post => bookmarkedIds.includes(post._id)));
      setLoading(false);
    };
    fetchPosts();
  }, []);

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

  if (loading) return <div className="text-white/80">Loading...</div>;
  if (posts.length === 0) return <div className="text-white/80 text-center mt-16">No bookmarks yet.</div>;

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-gradient-to-br from-[#181f2a] via-[#232b3e] to-[#1a2233] py-8 px-2">
      <div className="w-full max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-1">
          <FaBookmark className="text-3xl text-red-500" />
          <h1 className="text-3xl font-bold text-white">Bookmarks</h1>
        </div>
        <p className="text-white/70 text-lg mb-8">Your saved posts for later reading</p>
        <div className="flex flex-col gap-8">
          {posts.map((post) => {
            const username = post.author || "Anonymous User";
            const timeString = post.createdAt ? timeAgo(new Date(post.createdAt)) : '';
            return (
              <div
                key={post._id}
                onClick={() => navigate(`/post/${post._id}`)}
                className="bg-[#181c24] border border-white/10 rounded-2xl p-6 shadow-lg flex flex-col gap-2 text-white cursor-pointer hover:shadow-2xl transition-shadow duration-200 w-full"
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
                      onClick={e => e.stopPropagation()}
                    >
                      ...
                    </button>
                  </div>
                </div>
                {/* Post Text */}
                <div className="text-white text-base mb-2 break-words">{post.title}</div>
                {/* Post Image (if any) */}
                {post.photo && (
                  <img src={`${process.env.REACT_APP_API_URL}/${post.photo}`} alt={post.title} className="w-full max-w-full h-auto object-contain rounded-xl mb-2 border border-white/10 bg-white/5" style={{ maxHeight: '40vh' }} />
                )}
                {/* Icons Row */}
                <div className="flex items-center gap-8 text-white/70 mt-2">
                  <div className="flex items-center gap-2 text-lg"><FaRegHeart /><span className="text-base">{post.likes ? post.likes.length : 0}</span></div>
                  <div className="flex items-center gap-2 text-lg"><FaRegComment /><span className="text-base">{post.comments ? post.comments.length : 0}</span></div>
                  <div className="flex items-center gap-2 text-lg"><FaRegShareSquare /></div>
                  <div className="flex items-center gap-2 text-lg ml-auto"><FaBookmark className="text-blue-400" /></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Bookmarks; 