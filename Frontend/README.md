# VeiledUP Frontend

A modern, fully responsive social platform for anonymous posting, real-time chat, and image sharing.

## Features

### 📝 Anonymous Posting
- Share your thoughts, questions, or confessions without revealing your identity.
- Posts support text and image uploads (JPG, PNG, GIF, etc.).
- Profanity and sensitive content are automatically filtered.

### 🖼️ Image Upload
- Add an image to your post with a simple upload button.
- Preview and remove the image before posting.
- Images are securely uploaded and displayed in posts.

### 💬 Real-Time Private Chat
- Chat instantly with any user in the system.
- Typing indicators and instant message delivery using Socket.IO.
- Multi-select and delete messages (for yourself or for everyone).
- Image sharing in chat.
- Per-user message deletion and persistent chat history.

### 🔖 Bookmarks & ❤️ Likes
- Bookmark posts and comments for quick access later.
- Like posts and comments; see like counts in real time.

### 🗂️ Archive & Report
- Archive posts for later reference.
- Report inappropriate content with a single click.

### 👤 Profile
- View your profile and all your posts.
- Edit your profile details (name, bio, etc.).
- See your bookmarks, likes, and archived posts.

### 🏠 Home & Communities
- Explore trending, recent, and most liked posts.
- Join communities (Hackathon, Academic, Cultural, Fest, etc.).
- Sidebar navigation for all main sections.

### 🌙 Modern UI/UX
- Bold, minimal, and professional design.
- Black and white theme with blue highlights for actions.
- All pages are fully responsive (mobile, tablet, desktop, ultra-wide).
- Shadows and subtle animations for depth.

### 🛡️ Content Filtering
- All posts, comments, and chat messages are filtered for profanity and sensitive content using `leo-profanity`.
- Customizable filter list.

## Technical Overview

- **React** (functional components, hooks)
- **Tailwind CSS** for utility-first styling and custom themes
- **Socket.IO** for real-time chat
- **REST API** for posts, comments, and user management
- **File uploads** via FormData and backend API
- **LocalStorage** for bookmarks, likes, and session persistence
- **Responsive design** using Tailwind's breakpoints
- **Custom context** for authentication and global state

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Start the development server:**
   ```bash
   npm start
   ```
3. **Connect to the backend:**
   - The frontend expects the backend to run at `http://localhost:5000`.
   - See the backend README for setup instructions.

## Usage Notes
- You must be logged in to post, chat, like, or bookmark.
- All features are accessible from the sidebar or navbar.
- The UI adapts to all screen sizes and devices.

## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](LICENSE)
