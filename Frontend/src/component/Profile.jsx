import React, { useEffect, useState } from "react";
import { FaRegHeart, FaRegComment, FaRegShareSquare, FaBookmark } from "react-icons/fa";
import { FiEdit, FiSettings, FiX } from "react-icons/fi";

export default function Profile() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("posts");
  const [userStats, setUserStats] = useState({ posts: 0, likes: 0, bookmarks: 0 });
  const [memberSince, setMemberSince] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBranch, setEditBranch] = useState("");
  const [editPic, setEditPic] = useState(null);
  const [allPosts, setAllPosts] = useState([]);

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
        setAllPosts(data);
        const savedUser = JSON.parse(localStorage.getItem('user'));
        const userName = savedUser?.user?.name;
        const userEmail = savedUser?.user?.email;
        // Show posts where author matches logged-in user's name or email
        const userPosts = data.filter(post => post.author === userName || post.author === userEmail);
        setPosts(userPosts);
        setUserStats({
          posts: userPosts.length,
          likes: userPosts.reduce((acc, p) => acc + (p.likes ? p.likes.length : 0), 0),
          bookmarks: userPosts.reduce((acc, p) => acc + (p.bookmarked ? 1 : 0), 0),
        });
        // Set member since (use earliest post date or fallback to this year/month)
        let minDate = userPosts.reduce((min, p) => p.createdAt && (!min || new Date(p.createdAt) < new Date(min)) ? p.createdAt : min, null);
        setMemberSince(minDate ? new Date(minDate).toLocaleString('default', { month: 'long', year: 'numeric' }) : 'March 2024');
        setLoading(false);
      } catch (error) {
        setError("Failed to load posts");
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  // Tab filtering logic
  const savedUser = JSON.parse(localStorage.getItem('user'));
  const userId = savedUser?.user?.email;
  const bookmarkedIds = JSON.parse(localStorage.getItem('bookmarks') || '[]');
  let displayPosts = posts;
  if (activeTab === 'liked') {
    displayPosts = allPosts.filter(post => post.likes && post.likes.includes(userId));
  } else if (activeTab === 'bookmarked') {
    displayPosts = allPosts.filter(post => bookmarkedIds.includes(post._id));
  }

  const username = savedUser?.user?.name || "Anonymous User";

  return (
    <main className="min-h-screen w-full flex flex-col items-center bg-gradient-to-br from-[#10111a] to-[#23244a] py-8 px-2">
      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-3xl shadow-2xl p-8 w-full max-w-md relative">
            <button className="absolute top-4 right-4 text-2xl text-white hover:text-blue-400" onClick={() => setShowEditModal(false)}><FiX /></button>
            <h2 className="text-xl font-bold text-white mb-6">Edit Profile</h2>
            <div className="flex flex-col gap-4">
              <label className="text-white font-semibold">Name
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full mt-1 p-2 rounded-lg bg-white/20 text-white border border-white/20 focus:outline-none" />
              </label>
              <label className="text-white font-semibold">Branch
                <input type="text" value={editBranch} onChange={e => setEditBranch(e.target.value)} className="w-full mt-1 p-2 rounded-lg bg-white/20 text-white border border-white/20 focus:outline-none" />
              </label>
              <label className="text-white font-semibold">Profile Picture
                <input type="file" accept="image/*" onChange={e => setEditPic(e.target.files[0])} className="w-full mt-1" />
              </label>
              {editPic && <img src={URL.createObjectURL(editPic)} alt="Preview" className="w-20 h-20 rounded-full object-cover border-2 border-blue-500 mx-auto mt-2" />}
              <button className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition">Save Changes</button>
            </div>
          </div>
        </div>
      )}
      {/* Profile Card */}
      <div className="w-full max-w-3xl bg-white/10 backdrop-blur border border-white/20 rounded-3xl shadow-2xl p-8 flex flex-col md:flex-row items-center md:items-start gap-8 mb-8">
        {/* Avatar and Info */}
        <div className="flex flex-col items-center md:items-start gap-4 flex-1">
          <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-5xl font-bold text-white shadow-xl mb-2">
            {username[0]}
          </div>
          <div className="flex flex-col items-center md:items-start">
            <span className="text-2xl font-bold text-white mb-1">{username}</span>
            <span className="text-white/70 text-sm">Member since {memberSince}</span>
          </div>
        </div>
        {/* Stats */}
        <div className="flex flex-row md:flex-col gap-8 md:gap-4 items-center md:items-start flex-1 justify-center">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-white">{userStats.posts}</span>
            <span className="text-white/70 text-sm">Posts</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-white">{userStats.likes}</span>
            <span className="text-white/70 text-sm">Likes Received</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-white">{userStats.bookmarks}</span>
            <span className="text-white/70 text-sm">Bookmarks</span>
          </div>
        </div>
        {/* Edit/Profile Buttons */}
        <div className="flex flex-col gap-3 items-center md:items-end flex-1">
          <button className="flex items-center gap-2 px-5 py-2 rounded-lg border border-white/30 text-white hover:bg-white/10 font-bold transition" onClick={() => setShowEditModal(true)}><FiEdit /> Edit Profile</button>
          <button className="flex items-center gap-2 px-5 py-2 rounded-lg border border-white/30 text-white hover:bg-white/10 font-bold transition"><FiSettings /> Settings</button>
        </div>
      </div>
      {/* Tabs */}
      <div className="w-full max-w-3xl flex gap-2 mb-6">
        <button onClick={() => setActiveTab('posts')} className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold text-base transition ${activeTab === 'posts' ? 'bg-blue-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}><span>📝</span> My Posts</button>
        <button onClick={() => setActiveTab('liked')} className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold text-base transition ${activeTab === 'liked' ? 'bg-blue-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}><FaRegHeart /> Liked</button>
        <button onClick={() => setActiveTab('bookmarked')} className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold text-base transition ${activeTab === 'bookmarked' ? 'bg-blue-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}><FaBookmark /> Bookmarked</button>
      </div>
      {/* Posts List */}
      <div className="w-full max-w-3xl flex flex-col gap-6">
        {loading ? (
          <div className="text-white/80">Loading...</div>
        ) : error ? (
          <div className="text-red-400">{error}</div>
        ) : displayPosts.length === 0 ? (
          <div className="text-white/80">No posts to display.</div>
        ) : (
          displayPosts.map((post) => {
            const username = post.author || "Anonymous";
            const timeString = post.createdAt ? new Date(post.createdAt).toLocaleDateString('default', { month: 'short', day: 'numeric' }) : '';
            return (
              <div key={post._id} className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 shadow-lg flex flex-col gap-2">
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
                </div>
                <div className="text-white text-base mb-2 break-words">{post.title}</div>
                {post.photo && (
                  <img src={`${process.env.REACT_APP_API_URL}/${post.photo}`} alt={post.title} className="w-full max-w-full h-auto object-contain rounded-xl mb-2 border border-white/10 bg-white/5" style={{ maxHeight: '40vh' }} />
                )}
                <div className="flex items-center gap-8 text-white/70 mt-2">
                  <div className="flex items-center gap-2 text-lg"><FaRegHeart /><span className="text-base">{post.likes ? post.likes.length : 0}</span></div>
                  <div className="flex items-center gap-2 text-lg"><FaRegComment /><span className="text-base">{post.comments ? post.comments.length : 0}</span></div>
                  <div className="flex items-center gap-2 text-lg"><FaRegShareSquare /></div>
                  <div className="flex items-center gap-2 text-lg ml-auto"><FaBookmark /></div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
