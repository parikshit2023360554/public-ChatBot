import React from "react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Register from "./components/Register";
import Login from "./components/Login";
import MyMessages from "./components/MyMessages";
import PublicFeed from "./components/PublicFeed";
import Settings from "./components/Settings";
import DirectMessages from "./components/DirectMessages";

function NavBar() {
  const [loggedIn, setLoggedIn] = React.useState(!!localStorage.getItem("token"));
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const navRef = React.useRef();
  const navigate = useNavigate();

  React.useEffect(() => {
    const handler = () => setLoggedIn(!!localStorage.getItem("token"));
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);


  React.useEffect(() => {
    function handleClick(e) {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  function handleLogout() {
    localStorage.removeItem("token");
    setDropdownOpen(false);
    setLoggedIn(false);
    navigate("/login");
  }

  return (
    <nav ref={navRef} className="flex items-center justify-between px-6 py-4 bg-white shadow mb-6">
      <div className="flex gap-4 items-center">

        <Link to="/my-messages" className="text-purple-600 hover:underline">My Messages</Link>
        <Link to="/feed" className="text-blue-800 hover:underline">Public Feed</Link>
        <Link to="/dm" className="text-green-700 hover:underline">Direct Messages</Link>
      </div>
      <div className="relative">
        {loggedIn ? (
          <>
            <button
              className="text-2xl focus:outline-none"
              title="User"
              onClick={() => setDropdownOpen((v) => !v)}
            >
              <span role="img" aria-label="user">👤</span>
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-lg z-10">
                <Link
                  to="/settings"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                  onClick={() => setDropdownOpen(false)}
                >
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                >
                  Logout
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex gap-2">
            <Link to="/login" className="bg-white text-black border border-black px-4 py-2 rounded-full hover:bg-black hover:text-white transition">Sign In</Link>
            <Link to="/register" className="bg-white text-black border border-black px-4 py-2 rounded-full hover:bg-black hover:text-white transition">Sign Up</Link>
          </div>
        )}
      </div>
    </nav>
  );
}

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/my-messages" element={<MyMessages />} />
        <Route path="/feed" element={<PublicFeed />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/dm" element={<DirectMessages />} />
        <Route path="/" element={<PublicFeed />} />
      </Routes>
    </div>
  )
}

export default App;
