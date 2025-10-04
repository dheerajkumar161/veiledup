import React, { useEffect, useState } from 'react';
import { getLikedPostIds } from './ProfilePosts';
import { useNavigate } from 'react-router-dom';

const getLikedCommentIds = () => JSON.parse(localStorage.getItem('likedComments') || '[]');

const Likes = () => {
  const [posts, setPosts] = useState([]);
  const [likedComments, setLikedComments] = useState([]);
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
      const savedUser = JSON.parse(localStorage.getItem('user'));
      const userId = savedUser?.user?.email;
      const likedIds = getLikedPostIds(data, userId);
      setPosts(data.filter(post => likedIds.includes(post._id)));

      // Gather liked comments
      const likedCommentIds = getLikedCommentIds();
      const foundComments = [];
      data.forEach(post => {
        const findComments = (comments) => {
          comments.forEach(comment => {
            if (likedCommentIds.includes(comment._id)) {
              foundComments.push({ ...comment, post });
            }
            if (comment.replies && comment.replies.length > 0) {
              findComments(comment.replies);
            }
          });
        };
        if (post.comments) findComments(post.comments);
      });
      setLikedComments(foundComments);
      setLoading(false);
    };
    fetchPosts();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (posts.length === 0 && likedComments.length === 0) return <div>No liked posts or comments yet.</div>;

  return (
    <div className="flex flex-col gap-6 p-4 bg-mainblack min-h-screen">
      <h2 className="text-2xl font-bold mb-4 text-mainyellow">Liked Posts</h2>
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
      {likedComments.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Liked Comments</h2>
          {likedComments.map(comment => (
            <div key={comment._id} className="bg-[#23244a] rounded-xl p-4 mb-4 border border-[#23244a]">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-white text-sm">{comment.author}</span>
                <span className="text-xs text-gray-400">on post:</span>
                <button className="text-blue-400 underline text-xs" onClick={() => navigate(`/post/${comment.postId}`)}>
                  {comment.postTitle}
                </button>
              </div>
              <div className="text-gray-200 text-base mb-2">{comment.text}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Likes; 