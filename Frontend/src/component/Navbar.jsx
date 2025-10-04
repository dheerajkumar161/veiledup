import React from "react";
import logo from "../Assets/LOGO.png"
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="flex justify-between items-center p-4 bg-mainblack border-b-2 border-mainwhite shadow-lg text-mainwhite w-full sticky top-0 z-50">
      <div className="flex items-center space-x-4">
        <img src={logo} alt="logo" className="object-cover h-12 w-30 border-2 " />
      </div>
      <div className="flex items-center gap-2">
        <Link to="./login" className="text-mainwhite px-3 py-2 rounded-md text-lg border-2 border-mainwhite hover:bg-mainwhite hover:text-mainblack transition">Login</Link>
        <span className="hidden sm:inline"> / </span>
        <Link to="./register" className="px-3 py-2 rounded-md text-lg border-2 border-mainwhite text-mainwhite hover:bg-mainwhite hover:text-mainblack transition">Register</Link>
      </div>
    </nav>
  );
}
