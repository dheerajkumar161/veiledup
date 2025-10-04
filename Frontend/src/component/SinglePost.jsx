import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaRegHeart, FaRegComment, FaRegShareSquare, FaRegStar, FaStar, FaTrashAlt, FaEllipsisH, FaBookmark, FaRegBookmark } from "react-icons/fa";
import { FiUser } from "react-icons/fi";

// Move this to the top of the file, before any components:
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

// Recursive Comment Component for unlimited nesting
const CommentComponent = ({ comment, postId, onCommentUpdate, depth = 0 }) => {
  const [replyText, setReplyText] = useState("");
  const [showReplyInput, setShowReplyInput] = useState(false);
  const savedUser = JSON.parse(localStorage.getItem('user'));
  const userId = savedUser?.user?.email;
  const isLiked = comment.likes && comment.likes.includes(userId);
  const avatarColor = depth === 0 ? "bg-gradient-to-tr from-blue-400 to-purple-500" : "bg-gray-700";
  const [localLiked, setLocalLiked] = useState(isLiked);
  const [localLikes, setLocalLikes] = useState(comment.likes ? comment.likes.length : 0);
  const [bookmarked, setBookmarked] = useState(getBookmarkedCommentIds().includes(comment._id));
  const [likedComment, setLikedComment] = useState(getLikedCommentIds().includes(comment._id));

  useEffect(() => {
    setLocalLiked(isLiked);
    setLocalLikes(comment.likes ? comment.likes.length : 0);
    setLikedComment(getLikedCommentIds().includes(comment._id));
  }, [isLiked, comment.likes, comment._id]);

  const handleLike = async () => {
    setLocalLiked((prev) => !prev);
    setLocalLikes((prev) => localLiked ? prev - 1 : prev + 1);
    let likedArr = getLikedCommentIds();
    if (!likedArr.includes(comment._id)) {
      likedArr.push(comment._id);
      setLikedComment(true);
    } else {
      likedArr = likedArr.filter(id => id !== comment._id);
      setLikedComment(false);
    }
    setLikedCommentIds(likedArr);
    const response = await fetch(`${process.env.REACT_APP_API_URL}/upload/${postId}/comment/${comment._id}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (response.ok) {
      const updatedPost = await response.json();
      onCommentUpdate(updatedPost);
    }
  };

  const handleAddReply = async () => {
    if (!replyText.trim()) return;
    const author = savedUser?.user?.name;
    const response = await fetch(`${process.env.REACT_APP_API_URL}/upload/${postId}/comment/${comment._id}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author, text: replyText }),
    });
    if (response.ok) {
      const updatedPost = await response.json();
      onCommentUpdate(updatedPost);
      setReplyText("");
      setShowReplyInput(false);
    }
  };

  const handleBookmark = () => {
    let bookmarks = getBookmarkedCommentIds();
    if (bookmarks.includes(comment._id)) {
      bookmarks = bookmarks.filter(id => id !== comment._id);
      setBookmarked(false);
    } else {
      bookmarks.push(comment._id);
      setBookmarked(true);
    }
    setBookmarkedCommentIds(bookmarks);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    const userName = savedUser?.user?.name;
    const response = await fetch(`${process.env.REACT_APP_API_URL}/upload/${postId}/comment/${comment._id}/delete?userName=${encodeURIComponent(userName)}`, {
      method: 'DELETE'
    });
    if (response.ok) {
      const updatedPost = await response.json();
      onCommentUpdate(updatedPost);
    }
  };

  return (
    <div className={`mb-4 ${depth > 0 ? 'ml-8' : ''}`}> {/* Indent replies */}
      <div className={`flex items-start rounded-xl p-4 border-l border-mainwhite bg-mainblack shadow-lg`}> {/* Unified background */}
        {/* Avatar */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold bg-mainblack text-blue-400 border border-mainwhite mr-3 shadow`}> {/* Avatar icon blue */}
          {comment.author ? comment.author[0] : <FiUser className="text-gray-400" />}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-mainwhite text-sm">{comment.author}</span>
            <span className="text-xs text-mainwhite">{timeAgo(new Date(comment.createdAt))}</span>
          </div>
          <div className="text-mainwhite text-base mb-2">{comment.text}</div>
          <div className="flex items-center gap-3 mt-1">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border border-mainwhite text-blue-400 bg-mainblack hover:bg-mainwhite hover:text-blue-600 shadow transition ${localLiked ? 'bg-mainwhite text-blue-600' : ''}`}
            >
              <FaRegHeart className="mr-1" /> {localLikes}
            </button>
            <button
              onClick={() => setShowReplyInput(!showReplyInput)}
              className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border border-mainwhite text-blue-400 bg-mainblack hover:bg-mainwhite hover:text-blue-600 shadow transition"
            >
              <FaRegComment className="mr-1" /> Reply
            </button>
            <button
              onClick={handleBookmark}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border border-mainwhite text-blue-400 bg-mainblack hover:bg-mainwhite hover:text-blue-600 shadow transition ${bookmarked ? 'bg-mainwhite text-blue-600' : ''}`}
            >
              {bookmarked ? <FaStar className="mr-1 text-blue-400" /> : <FaRegStar className="mr-1 text-gray-400" />} Bookmark
            </button>
            {comment.author === savedUser?.user?.name && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border border-mainwhite text-red-500 bg-mainblack hover:bg-red-700 hover:text-mainwhite shadow transition"
              >
                <FaTrashAlt className="mr-1 text-red-500" /> Delete
              </button>
            )}
          </div>
          {showReplyInput && (
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                className="flex-1 border border-mainwhite rounded px-2 py-1 text-sm bg-mainblack text-mainwhite focus:ring-2 focus:ring-blue-400 shadow"
                onKeyPress={(e) => e.key === 'Enter' && handleAddReply()}
              />
              <button
                onClick={handleAddReply}
                className="bg-mainblack text-blue-400 border border-mainwhite px-3 py-1 rounded text-sm font-bold hover:bg-mainwhite hover:text-blue-600 shadow transition"
              >
                Reply
              </button>
              <button
                onClick={() => setShowReplyInput(false)}
                className="bg-mainblack text-gray-400 border border-mainwhite px-3 py-1 rounded text-sm font-bold hover:bg-mainwhite hover:text-mainblack shadow transition"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Render nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2">
          {comment.replies.map((reply, index) => (
            <CommentComponent
              key={reply._id || index}
              comment={reply}
              postId={postId}
              onCommentUpdate={onCommentUpdate}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const SinglePost = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [openDotsMenu, setOpenDotsMenu] = useState(false);
  const [openShareMenu, setOpenShareMenu] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/upload/posts`);
        if (!response.ok) throw new Error("Failed to fetch post");
        const data = await response.json();
        const found = data.find((p) => p._id === id);
        setPost(found);
        setLoading(false);
      } catch (error) {
        setError("Failed to load post");
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  const handleLike = async () => {
    if (liked) return;
    const savedUser = JSON.parse(localStorage.getItem('user'));
    const userId = savedUser?.user?.email;
    const response = await fetch(`${process.env.REACT_APP_API_URL}/upload/${id}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (response.ok) {
      const updatedPost = await response.json();
      setPost(updatedPost);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    const savedUser = JSON.parse(localStorage.getItem('user'));
    const author = savedUser?.user?.name;
    const response = await fetch(`${process.env.REACT_APP_API_URL}/upload/${id}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author, text: commentText }),
    });
    if (response.ok) {
      const updatedPost = await response.json();
      setPost(updatedPost);
      setCommentText("");
    }
  };

  const handleCommentUpdate = (updatedPost) => {
    setPost(updatedPost);
  };

  if (loading) return <p>Loading post...</p>;
  if (error || !post) return <p>{error || "Post not found"}</p>;

  const savedUser = JSON.parse(localStorage.getItem('user'));
  const userId = savedUser?.user?.email;
  const liked = post.likes && post.likes.includes(userId);
  const username = post.author || "Anonymous";

  const isBookmarked = () => getBookmarkedPostIds().includes(post._id);
  const handleBookmark = () => {
    let bookmarks = getBookmarkedPostIds();
    if (!bookmarks.includes(post._id)) {
      bookmarks.push(post._id);
      setBookmarkedPostIds(bookmarks);
    } else {
      bookmarks = bookmarks.filter(id => id !== post._id);
      setBookmarkedPostIds(bookmarks);
    }
    setOpenDotsMenu(false);
  };
  const handleReport = () => {
    setOpenDotsMenu(false);
    alert('Reported!');
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-gradient-to-br from-[#181f2a] via-[#232b3e] to-[#1a2233] py-8 px-2">
      <div className="w-full max-w-3xl mx-auto">
        {loading ? (
          <div className="text-white/80">Loading...</div>
        ) : error ? (
          <div className="text-red-400">{error}</div>
        ) : !post ? (
          <div className="text-white/80">Post not found.</div>
        ) : (
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 shadow-lg flex flex-col gap-2 text-white">
            {/* Top Row: Avatar, Username, Category, Time, Menu */}
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-xl font-bold text-white">
                {post.author ? post.author[0] : 'A'}
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-white text-base">{post.author || 'Anonymous'}</span>
                <span className="text-xs text-white/60">{post.createdAt ? timeAgo(new Date(post.createdAt)) : ''}</span>
              </div>
              {post.tags && post.tags.length > 0 && (
                <span className="ml-3 px-3 py-1 rounded-full bg-blue-700 text-white text-xs font-bold">{post.tags[0]}</span>
              )}
              <div className="ml-auto flex items-center gap-2 relative">
                <button
                  className="text-2xl text-white/60 hover:text-blue-400 px-2 py-1 rounded-full focus:outline-none border border-white/20 shadow"
                  onClick={e => { e.stopPropagation(); setOpenDotsMenu(!openDotsMenu); setOpenShareMenu(false); }}
                >
                  <FaEllipsisH />
                </button>
                {/* Dropdown menu */}
                {openDotsMenu && (
                  <div className="absolute right-0 top-8 mt-2 w-44 bg-white/20 backdrop-blur rounded-xl shadow-2xl z-50 border border-white/30 animate-fade-in">
                    <button
                      className="block w-full text-left px-4 py-2 text-sm text-blue-400 hover:bg-white/30 hover:text-blue-600 shadow"
                      onClick={e => { e.stopPropagation(); handleReport(); }}
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
              <img src={`${process.env.REACT_APP_API_URL}/${post.photo}`} alt={post.title} className="w-full max-w-full h-auto object-contain rounded-xl mb-2 border border-white/10 bg-white/5" style={{ maxHeight: '40vh' }} />
            )}
            {/* Icons Row */}
            <div className="flex items-center gap-8 text-white/70 mt-2">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 text-lg ${post.likes && post.likes.includes(userId) ? 'text-blue-400' : 'hover:text-blue-400'}`}
              >
                <FaRegHeart />
                <span className="text-base">{post.likes ? post.likes.length : 0}</span>
              </button>
              <div className="flex items-center gap-2 text-lg">
                <FaRegComment />
                <span className="text-base">{post.comments ? post.comments.length : 0}</span>
              </div>
              <button
                onClick={handleBookmark}
                className={`flex items-center gap-2 text-lg ${isBookmarked() ? 'text-blue-400' : 'hover:text-blue-400'}`}
              >
                {isBookmarked() ? <FaBookmark /> : <FaRegBookmark />}
              </button>
              <button
                onClick={e => { e.stopPropagation(); setOpenShareMenu(!openShareMenu); setOpenDotsMenu(false); }}
                className="flex items-center gap-2 text-lg hover:text-blue-400 relative"
              >
                <FaRegShareSquare />
              </button>
            </div>
          </div>
        )}
        {/* Comments Section visually separated below the post card */}
        {post && (
          <div className="mt-8">
            {/* Add new comment */}
            <div className="mb-6 p-4 bg-mainblack rounded-lg border border-mainwhite shadow">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="w-full border border-mainwhite rounded px-3 py-2 mb-2 resize-none bg-mainblack text-mainwhite focus:ring-2 focus:ring-blue-400 font-bold shadow"
                rows="3"
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleAddComment())}
              />
              <button
                onClick={handleAddComment}
                className="bg-mainblack text-blue-400 border border-mainwhite px-4 py-2 rounded font-bold hover:bg-mainwhite hover:text-blue-600 shadow transition"
              >
                Comment
              </button>
            </div>
            {/* Display comments */}
            <div className="space-y-2">
              {post.comments && post.comments.length > 0 ? (
                post.comments.map((comment, index) => (
                  <CommentComponent
                    key={comment._id || index}
                    comment={comment}
                    postId={id}
                    onCommentUpdate={handleCommentUpdate}
                  />
                ))
              ) : (
                <p className="text-mainwhite text-center py-4">No comments yet. Be the first to comment!</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const getBookmarkedCommentIds = () => JSON.parse(localStorage.getItem('bookmarkedComments') || '[]');
const setBookmarkedCommentIds = (ids) => localStorage.setItem('bookmarkedComments', JSON.stringify(ids));

const getLikedCommentIds = () => JSON.parse(localStorage.getItem('likedComments') || '[]');
const setLikedCommentIds = (ids) => localStorage.setItem('likedComments', JSON.stringify(ids));

const getBookmarkedPostIds = () => JSON.parse(localStorage.getItem('bookmarkedPosts') || '[]');
const setBookmarkedPostIds = (ids) => localStorage.setItem('bookmarkedPosts', JSON.stringify(ids));

export default SinglePost; 