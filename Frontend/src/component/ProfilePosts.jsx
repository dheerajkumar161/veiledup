import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaRegHeart, FaRegComment, FaRegShareSquare } from "react-icons/fa";

const ProfilePosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [openShareMenuId, setOpenShareMenuId] = useState(null);
  const navigate = useNavigate();

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
        // Filter posts by logged-in user
        const savedUser = JSON.parse(localStorage.getItem('user'));
        const userEmail = savedUser?.user?.email;
        const userPosts = data.filter(post => post.author === userEmail || post.author === savedUser?.user?.name);
        setPosts(userPosts);
        setLoading(false);
      } catch (error) {
        setError("Failed to load posts");
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  // Delete post
  const handleDelete = async (postId) => {
    setOpenMenuId(null);
    setOpenShareMenuId(null);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/upload/${postId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setPosts((prev) => prev.filter((p) => p._id !== postId));
      } else {
        // If 404, treat as already deleted and remove from UI
        if (response.status === 404) {
          setPosts((prev) => prev.filter((p) => p._id !== postId));
        } else {
          alert('Failed to delete post');
        }
      }
    } catch (error) {
      alert('Failed to delete post');
    }
  };

  // Archive post
  const handleArchive = async (postId) => {
    setOpenMenuId(null);
    setOpenShareMenuId(null);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/upload/${postId}/archive`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: true }),
      });
      if (response.ok) {
        setPosts((prev) => prev.map((p) => p._id === postId ? { ...p, archived: true } : p));
      } else {
        alert('Failed to archive post');
      }
    } catch (error) {
      alert('Failed to archive post');
    }
  };

  // Unarchive post
  const handleUnarchive = async (postId) => {
    setOpenMenuId(null);
    setOpenShareMenuId(null);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/upload/${postId}/archive`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: false }),
      });
      if (response.ok) {
        setPosts((prev) => prev.map((p) => p._id === postId ? { ...p, archived: false } : p));
      } else {
        alert('Failed to unarchive post');
      }
    } catch (error) {
      alert('Failed to unarchive post');
    }
  };

  // Function to count only direct comments (not nested replies)
  const countDirectComments = (comments) => {
    if (!comments) return 0;
    return comments.length;
  };

  if (loading) return <p>Loading posts...</p>;
  if (error) return <p>{error}</p>;

  const activePosts = posts.filter(p => !p.archived);
  const archivedPosts = posts.filter(p => p.archived);

  const renderPostCard = (post, isArchived = false) => {
    const savedUser = JSON.parse(localStorage.getItem('user'));
    const userId = savedUser?.user?.email;
    const liked = post.likes && post.likes.includes(userId);
    const directComments = countDirectComments(post.comments);
    const username = post.author || "Anonymous";
    const emoji = post.emoji || "😅";
    const avatarColor = "bg-gradient-to-tr from-blue-400 to-purple-500";
    const timeAgo = "2 hours ago";
    return (
      <div
        key={post._id}
        onClick={() => navigate(`/post/${post._id}`)}
        className="bg-[#18192b] rounded-2xl p-6 shadow-lg cursor-pointer hover:shadow-2xl transition-shadow duration-200 border border-[#23244a] relative"
      >
        {/* Top Row: Avatar, Username, Emoji, Time, Menu */}
        <div className="flex items-center mb-2 relative">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold ${avatarColor} relative`}>
            <span className="text-white">{username[0]}</span>
            <span className="absolute -right-2 -bottom-2 text-2xl">{emoji}</span>
          </div>
          <div className="ml-4 flex flex-col flex-1">
            <span className="font-semibold text-white text-base">{username}</span>
            <span className="text-xs text-gray-400">{timeAgo}</span>
          </div>
          {/* Three Dots Menu */}
          <div className="ml-auto flex items-center gap-2 relative">
            <button
              className="text-2xl text-gray-400 hover:text-gray-200 px-2 py-1 rounded-full focus:outline-none"
              onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === post._id ? null : post._id); setOpenShareMenuId(null); }}
            >
              ...
            </button>
            {/* Dropdown menu */}
            {openMenuId === post._id && (
              <div className="absolute right-0 top-8 mt-2 w-44 bg-[#23244a] rounded-lg shadow-lg z-50 border border-[#23244a] animate-fade-in">
                {!isArchived && (
                  <>
                    <button
                      className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-[#23244a]/80 hover:text-red-500"
                      onClick={e => { e.stopPropagation(); handleDelete(post._id); }}
                    >
                      Delete
                    </button>
                    <button
                      className="block w-full text-left px-4 py-2 text-sm text-yellow-400 hover:bg-[#23244a]/80 hover:text-yellow-500"
                      onClick={e => { e.stopPropagation(); handleArchive(post._id); }}
                    >
                      Archive
                    </button>
                  </>
                )}
                {isArchived && (
                  <button
                    className="block w-full text-left px-4 py-2 text-sm text-green-400 hover:bg-[#23244a]/80 hover:text-green-500"
                    onClick={e => { e.stopPropagation(); handleUnarchive(post._id); }}
                  >
                    Unarchive
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        {/* Post Text */}
        <div className="text-white text-base mb-4">
          {post.title}
        </div>
        {/* Post Image (if any) */}
        {post.photo && (
          <img
            src={`${process.env.REACT_APP_API_URL}/${post.photo}`}
            alt={post.title}
            className="w-full max-w-full h-auto object-contain rounded-xl mb-4 border border-[#23244a] bg-black"
            style={{ maxHeight: '60vh' }}
            onClick={e => e.stopPropagation()}
          />
        )}
        {/* Icons Row */}
        <div className="flex items-center gap-8 text-gray-400 mt-2">
          <button
            onClick={e => e.stopPropagation()}
            className={`flex items-center gap-2 text-lg ${liked ? 'text-pink-400' : 'hover:text-pink-400'}`}
          >
            <FaRegHeart />
            <span className="text-base">{post.likes ? post.likes.length : 0}</span>
          </button>
          <div className="flex items-center gap-2 text-lg">
            <FaRegComment />
            <span className="text-base">{directComments}</span>
          </div>
          <button
            onClick={e => { e.stopPropagation(); setOpenShareMenuId(openShareMenuId === post._id ? null : post._id); setOpenMenuId(null); }}
            className="flex items-center gap-2 text-lg hover:text-blue-400 relative"
          >
            <FaRegShareSquare />
            {/* Share menu */}
            {openShareMenuId === post._id && (
              <div className="absolute right-0 top-8 mt-2 w-44 bg-[#23244a] rounded-lg shadow-lg z-50 border border-[#23244a] animate-fade-in">
                <button
                  className="block w-full text-left px-4 py-2 text-sm text-green-400 hover:bg-[#23244a]/80 hover:text-green-500"
                  onClick={e => {
                    e.stopPropagation();
                    window.open(`https://wa.me/?text=${encodeURIComponent(post.title + ' ' + window.location.origin + '/post/' + post._id)}`);
                    setOpenShareMenuId(null);
                  }}
                >
                  Share via WhatsApp
                </button>
                <button
                  className="block w-full text-left px-4 py-2 text-sm text-blue-400 hover:bg-[#23244a]/80 hover:text-blue-500"
                  onClick={e => {
                    e.stopPropagation();
                    window.open(`mailto:?subject=${encodeURIComponent('Check out this post!')}&body=${encodeURIComponent(post.title + '\n' + window.location.origin + '/post/' + post._id)}`);
                    setOpenShareMenuId(null);
                  }}
                >
                  Share via Email
                </button>
              </div>
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 p-4 bg-mainblack min-h-screen">
      <h2 className="text-2xl font-bold mb-4 text-mainyellow">Your Posts</h2>
      {activePosts.length === 0 && <div className="text-mainyellow text-center">No posts yet.</div>}
      {activePosts.map(post => renderPostCard(post, false))}
      {archivedPosts.length > 0 && (
        <div className="flex flex-col gap-6 p-4 bg-mainblack min-h-[200px] mt-8 rounded-xl border-2 border-mainyellow">
          <h2 className="text-lg text-mainyellow font-semibold mb-2">Archived Posts</h2>
          {archivedPosts.map(post => renderPostCard(post, true))}
        </div>
      )}
    </div>
  );
};

export function getLikedPostIds(posts, userId) {
  return posts.filter(post => post.likes && post.likes.includes(userId)).map(post => post._id);
}

export function getArchivedPostIds(posts) {
  return posts.filter(post => post.archived).map(post => post._id);
}

export default ProfilePosts; 