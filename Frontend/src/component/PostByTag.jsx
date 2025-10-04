import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FaRegHeart, FaRegComment, FaRegShareSquare, FaRegBookmark, FaBookmark } from "react-icons/fa";

const PostsByTag = ({ tag, categories = [] }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [renderError, setRenderError] = useState(null);
  const [searchParams] = useSearchParams();
  const loadingTimeout = useRef(null);

  useEffect(() => {
    console.log('useEffect running for tag:', tag, 'categories:', categories, 'searchParams:', searchParams.toString());
    setLoading(true);
    setError(null);
    setRenderError(null);
    let cancelled = false;
    // Timeout failsafe
    loadingTimeout.current = setTimeout(() => {
      if (!cancelled) {
        setLoading(false);
        setError('Loading timed out. Please try again.');
      }
    }, 7000);
    const fetchPosts = async () => {
      try {
        let url;
        let urlCategories = categories;
        // Check for categories in URL parameters
        const urlCats = searchParams.get('cats');
        if (urlCats) {
          urlCategories = urlCats.split(',').map(cat => decodeURIComponent(cat));
        }
        if (urlCategories && urlCategories.length > 0) {
          // Multiple categories filter
          const categoryParams = urlCategories.map(cat => `categories=${encodeURIComponent(cat)}`).join('&');
          url = `${process.env.REACT_APP_API_URL}/posts/categories?${categoryParams}`;
        } else if (tag) {
          // Single category filter - use tag as is (case and spaces preserved)
          url = `${process.env.REACT_APP_API_URL}/posts/category/${encodeURIComponent(tag)}`;
        } else {
          // All posts
          url = `${process.env.REACT_APP_API_URL}/posts`;
        }
        console.log('🔍 Frontend: Fetching posts from:', url);
        console.log('🔍 Frontend: Tag:', tag, 'Categories:', categories, 'URL Categories:', urlCategories);
        const response = await fetch(url);
        console.log('🔍 Frontend: Response status:', response.status);
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Frontend: Response error:', errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        const data = await response.json();
        console.log('✅ Frontend: Fetched posts:', data);
        console.log('📊 Frontend: Number of posts:', Array.isArray(data) ? data.length : 'not array');
        if (!cancelled) {
          setPosts(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('❌ Frontend: Failed to fetch posts:', error);
          setError(error.message);
          setLoading(false);
        }
      } finally {
        if (!cancelled && loadingTimeout.current) {
          clearTimeout(loadingTimeout.current);
        }
      }
    };
    fetchPosts();
    return () => {
      cancelled = true;
      if (loadingTimeout.current) clearTimeout(loadingTimeout.current);
    };
  }, [tag, JSON.stringify(categories), searchParams.toString()]);

  // Debug: log every render
  console.log('Rendering PostByTag', { posts, loading, error, renderError });

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

  const isBookmarked = (postId) => {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    return bookmarks.includes(postId);
  };

  const handleBookmark = (postId) => {
    let bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    if (bookmarks.includes(postId)) {
      bookmarks = bookmarks.filter(id => id !== postId);
    } else {
      bookmarks.push(postId);
    }
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
    setPosts([...posts]); // Trigger re-render
  };

  const timeAgo = (date) => {
    if (!date) return '';
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
  };

  // Determine display title
  let displayTitle = "All Posts";
  const urlCats = searchParams.get('cats');
  if (urlCats) {
    const urlCategories = urlCats.split(',').map(cat => decodeURIComponent(cat));
    displayTitle = `Posts in: ${urlCategories.join(", ")}`;
  } else if (categories && categories.length > 0) {
    displayTitle = `Posts in: ${categories.join(", ")}`;
  } else if (tag) {
    displayTitle = `Posts Related to ${tag}`;
  }

  // Defensive render with try/catch
  try {
    if (loading) return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading posts...</p>
        </div>
      </div>
    );

    if (error) return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-red-400 text-center">
          <p>Error: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );

    if (renderError) return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-red-400 text-center">
          <p>Render Error: {renderError}</p>
        </div>
      </div>
    );

    return (
      <div className="min-h-screen bg-black py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className='text-center mb-8 text-3xl font-semibold text-white underline'>{displayTitle}</h1>
          {Array.isArray(posts) && posts.length === 0 ? (
            <div className="text-center text-white text-lg">
              No posts found for this category.
            </div>
          ) : (
            <div className="space-y-6">
              {Array.isArray(posts) && posts.map((post) => {
                if (!post) return null;
                const savedUser = JSON.parse(localStorage.getItem('user'));
                const userId = savedUser?.user?.email;
                const liked = post.likes && Array.isArray(post.likes) && userId ? post.likes.includes(userId) : false;
                const username = post.author ? String(post.author) : "Anonymous";
                const timeString = post.createdAt ? timeAgo(new Date(post.createdAt)) : '';
                const postCategories = (Array.isArray(post.categories) && post.categories.length > 0) ? post.categories : (post.category ? [post.category] : []);
                return (
                  <div key={post._id || Math.random()} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 shadow-lg text-white hover:shadow-2xl transition-shadow duration-200">
                    {/* Top Row: Avatar, Username, Categories, Time */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-xl font-bold text-white">
                        {username[0]}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-white text-base">{username}</span>
                        <span className="text-xs text-white/60">{timeString}</span>
                      </div>
                      <div className="ml-auto flex flex-wrap gap-1">
                        {postCategories.map((cat, index) => (
                          <span key={index} className="px-2 py-1 rounded-full bg-blue-700 text-white text-xs font-bold">
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                    {/* Post Content */}
                    <div className="text-white text-base mb-4 break-words">{post.title || ''}</div>
                    {/* Post Image */}
                    {post.photo && (
                      <img
                        src={`${process.env.REACT_APP_API_URL}/${post.photo}`}
                        alt={post.title || ''}
                        className="w-full max-w-full h-auto object-contain rounded-xl mb-4 border border-white/10 bg-white/5"
                        style={{ maxHeight: '40vh' }}
                      />
                    )}
                    {/* Icons Row */}
                    <div className="flex items-center gap-8 text-white/70 mt-2">
                      <button
                        onClick={e => { e.stopPropagation(); handleLike(post._id); }}
                        className={`flex items-center gap-2 text-lg ${liked ? 'text-blue-400' : 'hover:text-blue-400'}`}
                      >
                        <FaRegHeart />
                        <span className="text-base">{post.likes && Array.isArray(post.likes) ? post.likes.length : 0}</span>
                      </button>
                      <div className="flex items-center gap-2 text-lg">
                        <FaRegComment />
                        <span className="text-base">{post.comments && Array.isArray(post.comments) ? post.comments.length : 0}</span>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); handleBookmark(post._id); }}
                        className={`flex items-center gap-2 text-lg ${isBookmarked(post._id) ? 'text-blue-400' : 'hover:text-blue-400'}`}
                      >
                        {isBookmarked(post._id) ? <FaBookmark /> : <FaRegBookmark />}
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); }}
                        className="flex items-center gap-2 text-lg hover:text-blue-400 relative"
                      >
                        <FaRegShareSquare />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  } catch (err) {
    setRenderError(err.message);
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-red-400 text-center">
          <p>Render Error: {err.message}</p>
        </div>
      </div>
    );
  }
};

export default PostsByTag;
