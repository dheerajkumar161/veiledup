import React, { useState, useRef } from "react";
import { FaRegImage } from "react-icons/fa";

const emojiOptions = [
  "😊", "😴", "🥱", "🤔", "🎉", "😲", "💭", "🔥"
];

const categoryOptions = [
  "Hackathon", "Academic", "Cultural", "Sports", "Fest", 
  "Tech", "General", "Internships", "Jobs", "Lost & Found"
];

const autoDeleteOptions = [
  { label: "24 Hours", value: 24 },
  { label: "7 Days", value: 168 },
  { label: "Never", value: 0 },
];

const CreatePost = ({ onPostCreated }) => {
  const [postData, setPostData] = useState({
    title: "",
    tags: "",
    photo: null,
    chosenEmoji: emojiOptions[0],
    autoDelete: 24,
  });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showVoiceNote, setShowVoiceNote] = useState(false);
  const [voiceNote, setVoiceNote] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [image, setImage] = useState(null);
  const imageInputRef = useRef();
  const [selectedCategories, setSelectedCategories] = useState([]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setPostData({ ...postData, [name]: value });
  };

  const handleFileChange = (event) => {
    setPostData({ ...postData, photo: event.target.files[0] });
  };

  const handleEmojiSelect = (emoji) => {
    setPostData({ ...postData, chosenEmoji: emoji });
  };

  const handleAutoDeleteChange = (event) => {
    setPostData({ ...postData, autoDelete: event.target.value });
  };

  // Placeholder for voice note
  const handleVoiceNote = () => {
    setShowVoiceNote(!showVoiceNote);
    // Implement actual voice note logic if needed
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleCategoryToggle = (category) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(cat => cat !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (selectedCategories.length === 0) {
      alert("Please select at least one category");
      return;
    }
    
    setSubmitting(true);
    const { title, tags, photo, chosenEmoji, autoDelete } = postData;
    const formData = new FormData();
    formData.append("title", title);
    formData.append("tags", JSON.stringify(tags.split(",")));
    if (photo) {
      formData.append("photo", photo);
    }
    if (image) {
      formData.append("photo", image);
    }
    formData.append("emoji", chosenEmoji);
    formData.append("autoDelete", autoDelete);
    formData.append("categories", JSON.stringify(selectedCategories));
    // Get author from logged-in user
    const savedUser = JSON.parse(localStorage.getItem('user'));
    const author = savedUser?.user?.name || "Anonymous";
    formData.append("author", author);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/upload/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(postData),
      });
      if (response.ok) {
        setPostData({ title: "", tags: "", photo: null, chosenEmoji: emojiOptions[0], autoDelete: 24 });
        setImage(null);
        setSelectedCategories([]);
        if (onPostCreated) onPostCreated();
      }
    } catch (error) {
      alert("Error creating post");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 bg-gray-900/50 border border-gray-800 rounded-3xl p-8 shadow-2xl w-full max-w-xl mx-auto text-white">
      <textarea
        name="title"
        placeholder="Share your thoughts anonymously..."
        value={postData.title}
        onChange={handleInputChange}
        maxLength={500}
        className="w-full bg-gray-800/50 border-gray-700 text-white p-4 rounded-lg outline-none resize-none text-lg min-h-[100px] placeholder-gray-400 shadow"
      />
      {/* Image upload */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => imageInputRef.current.click()}
          className="flex items-center gap-2 text-blue-400 border border-gray-700 rounded px-3 py-1 font-bold shadow hover:bg-gray-800/50 hover:text-white transition"
        >
          <FaRegImage className="text-blue-400" size={18} /> Add Image
        </button>
        <input
          type="file"
          accept="image/*"
          ref={imageInputRef}
          onChange={handleImageChange}
          className="hidden"
        />
        {image && (
          <div className="flex items-center gap-2">
            <img src={URL.createObjectURL(image)} alt="preview" className="w-16 h-16 object-cover rounded border border-gray-700 shadow" />
            <button type="button" onClick={() => setImage(null)} className="text-red-500 hover:text-red-700 font-bold">✕</button>
          </div>
        )}
      </div>

      {/* Multiple Category Selection */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
        <h3 className="text-white font-bold mb-3">Select Categories (Multiple)</h3>
        <div className="grid grid-cols-2 gap-2">
          {categoryOptions.map((category) => (
            <label key={category} className="flex items-center gap-2 cursor-pointer hover:bg-gray-700/50 p-2 rounded">
              <input
                type="checkbox"
                checked={selectedCategories.includes(category)}
                onChange={() => handleCategoryToggle(category)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <span className="text-white text-sm">{category}</span>
            </label>
          ))}
        </div>
        {selectedCategories.length > 0 && (
          <div className="mt-3 p-2 bg-blue-600/20 border border-blue-500 rounded">
            <span className="text-blue-300 text-sm">Selected: {selectedCategories.join(", ")}</span>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center text-white/80">
        <span>{postData.title.length}/500</span>
      </div>
      
      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-700 text-white border-none px-4 py-2 rounded font-bold shadow transition disabled:opacity-50"
        disabled={submitting || selectedCategories.length === 0}
      >
        {submitting ? "Posting..." : "Post"}
      </button>
    </form>
  );
};

export default CreatePost;
