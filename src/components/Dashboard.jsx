import React from "react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between px-8 py-6 bg-white border-b">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💬</span>
          <span className="font-bold text-xl">Community Messaging</span>
        </div>
        <div className="flex gap-2">
          <Link to="/login" className="bg-white text-black border border-black px-4 py-2 rounded hover:bg-black hover:text-white transition">Sign In</Link>
          <Link to="/register" className="bg-black text-white px-4 py-2 rounded hover:bg-white hover:text-black border border-black transition">Sign Up</Link>
        </div>
      </header>
      <main className="flex flex-col items-center justify-center py-16">
        <h1 className="text-6xl font-extrabold text-center mb-6 text-gray-900">Share Your Thoughts</h1>
        <p className="text-lg text-center text-gray-600 max-w-2xl mb-8">
          A minimal messaging platform with blockchain integration. Connect with others and see your messages secured on the blockchain.
        </p>
        <div className="flex gap-4 mb-12">
          <Link to="/register" className="bg-black text-white px-6 py-3 rounded font-semibold text-lg hover:bg-gray-800 transition">Get Started</Link>
          <Link to="/feed" className="bg-white text-black border border-black px-6 py-3 rounded font-semibold text-lg hover:bg-black hover:text-white transition">View Public Feed</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-5xl">
          <div className="bg-white rounded-xl shadow p-6 border flex flex-col items-start">
            <span className="text-2xl mb-2 text-blue-600">🗨️</span>
            <span className="font-bold text-xl mb-1">Simple Messaging</span>
            <span className="text-gray-500 text-sm">Share messages up to 250 characters with the community</span>
          </div>
          <div className="bg-white rounded-xl shadow p-6 border flex flex-col items-start">
            <span className="text-2xl mb-2 text-green-600">🧑‍🤝‍🧑</span>
            <span className="font-bold text-xl mb-1">Public Feed</span>
            <span className="text-gray-500 text-sm">View all messages from users in real-time</span>
          </div>
          <div className="bg-white rounded-xl shadow p-6 border flex flex-col items-start">
            <span className="text-2xl mb-2 text-purple-600">🛡️</span>
            <span className="font-bold text-xl mb-1">Secure Auth</span>
            <span className="text-gray-500 text-sm">Powered by Supabase authentication and security</span>
          </div>
          <div className="bg-white rounded-xl shadow p-6 border flex flex-col items-start">
            <span className="text-2xl mb-2 text-orange-600">🔗</span>
            <span className="font-bold text-xl mb-1">Blockchain</span>
            <span className="text-gray-500 text-sm">Messages are hashed and stored in a simple blockchain</span>
          </div>
        </div>
      </main>
    </div>
  );
} 