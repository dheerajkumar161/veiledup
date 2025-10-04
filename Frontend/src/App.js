import React, { useState, useEffect } from "react";
import { Route, Routes, Outlet, useLocation, Navigate } from "react-router-dom";
import Register from "./component/Register";
import Login from "./component/Login";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./component/ProtectedRoute";
import Main from "./component/Main";
import Profile from "./component/Profile";
import CreatePost from "./component/CreatePost";
import PostsByTag from "./component/PostByTag";
import SinglePost from "./component/SinglePost";
import Bookmarks from "./component/Bookmarks";
import Likes from "./component/Likes";
import Archived from "./component/Archived";
import MainNavbar from "./component/MainNavbar";
import Sidebar from "./component/Sidebar";
import Landing from "./component/Landing";
import ChatList from "./component/ChatList";
import { FaBars, FaTimes, FaPlus, FaTimes as FaClose } from "react-icons/fa";

function Layout() {
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleCategoryFilter = (categories) => {
    setSelectedCategories(categories);
    // Navigate to a category page or update the current view
    if (categories.length === 1) {
      const category = categories[0].toLowerCase().replace(/\s+/g, '');
      window.location.href = `/${category}`;
    } else if (categories.length > 1) {
      // For multiple categories, we could create a custom route or use query parameters
      const categoryParams = categories.map(cat => encodeURIComponent(cat)).join(',');
      window.location.href = `/categories?cats=${categoryParams}`;
    }
  };

  const handlePostCreated = () => {
    setShowCreatePost(false);
    // Optionally refresh the current page or trigger a re-render
    window.location.reload();
  };

  // Keyboard shortcut to toggle sidebar (Ctrl+B or Cmd+B) and create post (Ctrl+N or Cmd+N)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        setShowCreatePost(true);
      }
      if (e.key === 'Escape' && showCreatePost) {
        setShowCreatePost(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen, showCreatePost]);

  // Close modal when clicking outside
  const handleModalClick = (e) => {
    if (e.target === e.currentTarget) {
      setShowCreatePost(false);
    }
  };

  return (
    <>
      <MainNavbar onSearchChange={setSearch} />
      <div className="flex h-screen">
        {/* Mobile Backdrop */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={toggleSidebar}
          />
        )}
        
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'w-64' : 'w-0'} fixed md:relative z-50 bg-gray-50 overflow-y-auto border-r transition-all duration-300 ease-in-out h-full`}>
          {sidebarOpen && <Sidebar toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} onCategoryFilter={handleCategoryFilter} />}
        </div>
        
        {/* Toggle Button - Shows when sidebar is closed */}
        {!sidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="fixed top-20 left-4 z-50 bg-mainblack text-mainwhite p-2 rounded-lg shadow-lg hover:bg-gray-800 transition-all duration-200 border border-mainwhite"
            title="Open sidebar (Ctrl+B)"
          >
            <FaBars size={16} />
          </button>
        )}
        
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto bg-black">
          <Outlet context={{ search: search, selectedCategories: selectedCategories }} />
        </div>

        {/* Floating Create Post Button */}
        <button
          onClick={() => setShowCreatePost(true)}
          className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
          title="Create new post (Ctrl+N)"
        >
          <FaPlus size={20} />
        </button>

        {/* Create Post Modal */}
        {showCreatePost && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={handleModalClick}
          >
            <div className="bg-gray-900/95 border border-gray-700 rounded-3xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <h2 className="text-2xl font-bold text-white">Create New Post</h2>
                <button
                  onClick={() => setShowCreatePost(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                  title="Close (Esc)"
                >
                  <FaClose size={24} />
                </button>
              </div>
              <div className="p-6">
                <CreatePost onPostCreated={handlePostCreated} />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function App() {
  return (
    <>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/home" element={<Navigate to="/main" replace />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/main" element={<Main />} />
              <Route path="/chat" element={<ChatList />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/create-post" element={<CreatePost />} />
              <Route path="/categories" element={<PostsByTag />} />
              <Route path="/hackathon" element={<PostsByTag tag="hackathon" />} />
              <Route path="/academic" element={<PostsByTag tag="academic" />} />
              <Route path="/cultural" element={<PostsByTag tag="cultural" />} />
              <Route path="/sports" element={<PostsByTag tag="sports" />} />
              <Route path="/fest" element={<PostsByTag tag="fest" />} />
              <Route path="/tech" element={<PostsByTag tag="tech" />} />
              <Route path="/general" element={<PostsByTag tag="general" />} />
              <Route path="/internships" element={<PostsByTag tag="internships" />} />
              <Route path="/jobs" element={<PostsByTag tag="jobs" />} />
              <Route path="/lostandfound" element={<PostsByTag tag="lostandfound" />} />
              <Route path="/post/:id" element={<SinglePost />} />
              <Route path="/bookmarks" element={<Bookmarks />} />
              <Route path="/likes" element={<Likes />} />
              <Route path="/archived" element={<Archived />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </>
  );
}

export default App;
