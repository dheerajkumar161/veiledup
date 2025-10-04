import React from "react";
import DisplayPosts from "./DisplayPosts";
import { useOutletContext } from "react-router-dom";

const Main = () => {
  const { search } = useOutletContext();
  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-gradient-to-br from-[#181f2a] via-[#232b3e] to-[#1a2233]">
      <div className="w-full max-w-3xl lg:max-w-4xl xl:max-w-5xl mt-8 mb-6">
        <div className="p-8 flex flex-col items-center w-full">
          <h1 className="text-3xl font-bold text-white mb-2 text-center drop-shadow">Welcome to VeiledUP</h1>
          <p className="text-white/70 text-center">Use the + button to create a new post</p>
        </div>
      </div>
      <div className="w-full max-w-3xl lg:max-w-4xl xl:max-w-5xl flex flex-col gap-8">
        <DisplayPosts search={search} />
      </div>
    </div>
  );
};

export default Main;
