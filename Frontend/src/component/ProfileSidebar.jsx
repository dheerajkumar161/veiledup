import React, { useState, useEffect } from "react";
import "../styles/profile.css";
import dogs from "../Assets/Dogs.jpg";
// import { assets } from '../../Assets/assets'
import { Link, useNavigate } from "react-router-dom";
import { MdEdit } from "react-icons/md";

const ProfileSidebar = () => {
  // Move hooks to the top
  const [userInfo, setUserInfo] = useState({
    username: "",
    email: "",
    batch: "2022",
    bio: "Computer Science Student",
  });
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

  // Get user from localStorage
  const storedUserRaw = localStorage.getItem("user");
  let storedUser = null;
  try {
    storedUser = storedUserRaw ? JSON.parse(storedUserRaw) : null;
  } catch (e) {
    storedUser = null;
  }

  // Set userInfo if user is logged in
  useEffect(() => {
    if (storedUser && storedUser.user) {
      setUserInfo({
        username: storedUser.user.name,
        email: storedUser.user.email,
        batch: "2022",
        bio: "Computer Science Student",
      });
    }
  }, []);

  if (!storedUser || !storedUser.user) {
    return (
      <div className="bg-mainblack border-2 border-mainyellow rounded-2xl p-8 shadow-xl w-full max-w-md mx-auto mt-8">
        <div className="text-mainyellow text-center">Not logged in</div>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserInfo({ ...userInfo, [name]: value });
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    // Logic to save updated userInfo (e.g., make API request to update user data)
    console.log("Saving user data:", userInfo);
    setIsEditing(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
    window.location.reload();
  };

  return (
    <div className="bg-mainblack border-2 border-mainyellow rounded-2xl p-8 shadow-xl w-full max-w-md mx-auto mt-8 flex flex-col items-center">
      <img src={dogs} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-mainyellow shadow-lg mb-4" />
      <div className="w-full flex flex-col items-center">
        {isEditing ? (
          <div className="w-full flex flex-col gap-2">
            <input type="text" name="username" value={userInfo.username} onChange={handleInputChange} className="bg-mainblack text-mainyellow rounded-lg px-4 py-2 w-full outline-none border-2 border-mainyellow" />
            <input type="text" name="email" value={userInfo.email} onChange={handleInputChange} className="bg-mainblack text-mainyellow rounded-lg px-4 py-2 w-full outline-none border-2 border-mainyellow" />
            <input type="text" name="batch" value={userInfo.batch} onChange={handleInputChange} className="bg-mainblack text-mainyellow rounded-lg px-4 py-2 w-full outline-none border-2 border-mainyellow" />
            <input type="text" name="bio" value={userInfo.bio} onChange={handleInputChange} className="bg-mainblack text-mainyellow rounded-lg px-4 py-2 w-full outline-none border-2 border-mainyellow" />
            <button onClick={handleSave} className="bg-mainblack text-mainyellow border-2 border-mainyellow rounded-lg px-6 py-2 mt-2 font-bold hover:bg-mainyellow hover:text-mainblack transition">Save</button>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center gap-1">
            <h3 className="text-2xl font-bold text-mainyellow mb-1">{userInfo.username}</h3>
            <div className="text-mainyellow text-sm font-semibold">{userInfo.email}</div>
            <div className="text-mainyellow text-sm">Batch: <span className="font-semibold">{userInfo.batch}</span></div>
            <div className="text-mainyellow text-center italic mb-2">{userInfo.bio}</div>
            <button onClick={handleEdit} className="flex items-center gap-1 bg-mainblack text-mainyellow border-2 border-mainyellow rounded-lg px-4 py-1 mt-2 hover:bg-mainyellow hover:text-mainblack transition font-semibold"><MdEdit className="text-lg" />Edit</button>
          </div>
        )}
      </div>
      <div className="flex gap-4 mt-6 w-full justify-center">
        <button className="bg-mainblack text-mainyellow border-2 border-mainyellow px-6 py-2 rounded-lg font-bold hover:bg-mainyellow hover:text-mainblack transition w-1/2">
          <Link to="/main" className="w-full block">Home Page</Link>
        </button>
        <button className="bg-mainblack text-mainyellow border-2 border-mainyellow px-6 py-2 rounded-lg font-bold hover:bg-mainyellow hover:text-mainblack transition w-1/2" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default ProfileSidebar;
