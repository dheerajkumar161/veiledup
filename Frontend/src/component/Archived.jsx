import React, { useEffect, useState } from 'react';
import { getArchivedPostIds } from './ProfilePosts';
import { useNavigate } from 'react-router-dom';

const Archived = () => {
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
      const archivedIds = getArchivedPostIds(data);
      setPosts(data.filter(post => archivedIds.includes(post._id)));
      setLoading(false);
    };
    fetchPosts();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (posts.length === 0) return <div>No archived posts yet.</div>;

  return (
    <div className="flex flex-col gap-6 p-4 bg-mainblack min-h-screen">
      <h2 className="text-2xl font-bold mb-4 text-mainyellow">Archived Posts</h2>
      {posts.map((post) => {
        const username = post.author || "Anonymous";
        const emoji = post.emoji || "😅";
        const avatarColor = "bg-mainblack border-2 border-mainyellow";
        const timeAgo = "2 hours ago";
        return (
          <div
            key={post._id}
            onClick={() => navigate(`/post/${post._id}`)}
            className="bg-mainblack border-2 border-mainyellow rounded-2xl p-6 shadow-lg cursor-pointer hover:shadow-2xl transition-shadow duration-200 relative text-mainyellow"
          >
            {/* Top Row: Avatar, Username, Emoji, Time */}
            <div className="flex items-center mb-2 relative">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold ${avatarColor} relative`}>
                <span className="text-mainyellow">{username[0]}</span>
                <span className="absolute -right-2 -bottom-2 text-2xl">{emoji}</span>
              </div>
              <div className="ml-4 flex flex-col flex-1">
                <span className="font-semibold text-mainyellow text-base">{username}</span>
                <span className="text-xs text-mainyellow">{timeAgo}</span>
              </div>
            </div>
            {/* Post Text */}
            <div className="text-mainyellow text-base mb-4 break-words">{post.title}</div>
            {/* Post Image (if any) */}
            {post.photo && (
              <img
                src={`${process.env.REACT_APP_API_URL}/${post.photo}`}
                alt={post.title}
                className="w-full max-w-full h-auto object-contain rounded-xl mb-4 border-2 border-mainyellow bg-mainblack"
                style={{ maxHeight: '60vh' }}
                onClick={e => e.stopPropagation()}
              />
            )}
            {/* Icons Row (static for now) */}
            <div className="flex items-center gap-8 text-gray-400 mt-2">
              <div className="flex items-center gap-2 text-lg">
                <span role="img" aria-label="likes">❤️</span>
                <span className="text-base">{post.likes ? post.likes.length : 0}</span>
              </div>
              <div className="flex items-center gap-2 text-lg">
                <span role="img" aria-label="comments">💬</span>
                <span className="text-base">{post.comments ? post.comments.length : 0}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Archived; 