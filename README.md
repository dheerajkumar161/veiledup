# VeiledUP - Social Media & Chat Platform

A full-stack social media and real-time chat application built with React (frontend), Node.js/Express (backend), and MongoDB (Atlas). Features include anonymous posting, real-time chat, category-based filtering, image uploads, likes, bookmarks, and more.

---

## Features

- **User Authentication**: Register, login, and protected routes
- **Anonymous Posting**: Share thoughts without revealing your identity
- **Category-based Posts**: Filter and create posts by multiple categories (e.g., Hackathon, Academic, Sports, etc.)
- **Real-time Chat**: One-to-one and group chat with Socket.io
- **Image Uploads**: Attach images to posts
- **Likes, Bookmarks, and Comments**: Interact with posts
- **Responsive UI**: Mobile-friendly, modern design
- **Sidebar & Navbar**: Easy navigation with category filters
- **Floating Create Post Button**: Quick access to post creation
- **Keyboard Shortcuts**: Ctrl+N to create post, Ctrl+B to toggle sidebar
- **Dark Mode**: Consistent black background for chat and main UI

---

## Project Structure

```
Project/
  Backend/           # Node.js/Express backend
    src/
      models/        # Mongoose schemas
      router/        # Express routers
      middleware/    # File upload, etc.
    uploads/         # Uploaded images
    index.js         # Main server entry
    package.json
  Frontend/          # React frontend
    src/
      component/     # React components
      context/       # Auth context
      Assets/        # Images and icons
      styles/        # CSS
    public/
    package.json
```

---

## Getting Started

### Prerequisites
- Node.js (v16+ recommended)
- npm
- MongoDB Atlas account (or local MongoDB)

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd Project
```

### 2. Backend Setup
```bash
cd Backend
npm install
# Create a .env file with your MongoDB URI if needed
# Example: MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/
npm start
```

### 3. Frontend Setup
```bash
cd ../Frontend
npm install
npm start
```

- Frontend runs on [http://localhost:3000](http://localhost:3000)
- Backend runs on [http://localhost:5000](http://localhost:5000)

---

## Usage
- Register or login with your email
- Create posts by clicking the floating + button or using Ctrl+N
- Filter posts by categories using the sidebar
- Chat with other users in real-time
- Like, bookmark, and comment on posts
- Upload images with your posts

---

## Environment Variables
Create a `.env` file in the `Backend/` directory:
```
MONGODB_URI=your_mongodb_atlas_connection_string
```

---

## Customization
- **Categories**: Edit `categoryOptions` in `Frontend/src/component/Sidebar.jsx` and `CreatePost.jsx`
- **Styling**: Modify Tailwind CSS classes or add custom CSS in `Frontend/src/styles/`

---

## Troubleshooting
- If posts are not showing for categories, ensure category names match exactly (case-insensitive matching is now supported).
- If stuck on loading, check browser console and backend logs for errors.
- For CORS issues, ensure backend allows requests from frontend origin.

---
