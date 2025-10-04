import React from "react";
import CreatePost from "./CreatePost";
import DisplayPosts from "./DisplayPosts";

export default function MainContent() {
  return (
    <div className="flex flex-col items-center justify-center p-8 gap-8">
      <CreatePost />
      <DisplayPosts />
    </div>
  );
}
