import React from "react";
import { useNavigate } from "react-router-dom";

function timeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} minute${Math.floor(diff / 60) === 1 ? '' : 's'} ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hour${Math.floor(diff / 3600) === 1 ? '' : 's'} ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString();
}

export default function PublicFeed() {
  const [messages, setMessages] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [submitLoading, setSubmitLoading] = React.useState(false);
  const navigate = useNavigate();

  const fetchMessages = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:4000/api/messages");
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      } else {
        setError("Failed to fetch messages.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please log in to post messages.");
      setTimeout(() => navigate("/login"), 1500);
      return;
    }
    if (message.length === 0) {
      setError("Message cannot be empty.");
      return;
    }
    if (message.length > 250) {
      setError("Message cannot exceed 250 characters.");
      return;
    }
    setSubmitLoading(true);
    try {
      const res = await fetch("http://localhost:4000/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ content: message })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("");
        fetchMessages();
      } else {
        setError(data.error || "Failed to post message.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center min-h-[80vh] bg-gray-50 py-8 pb-28">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-10 border border-gray-100 mb-8">
        <h2 className="text-3xl font-extrabold mb-2 text-center flex items-center justify-center gap-2">
          <span role="img" aria-label="feed">🌐</span> Public Feed
        </h2>
        {loading ? (
          <div className="text-gray-400">Loading...</div>
        ) : error ? (
          <div className="text-red-500 text-center">{error}</div>
        ) : (
          <ul className="space-y-4 mt-6">
            {messages.length === 0 && <li className="text-gray-400">No messages yet.</li>}
            {messages.map((msg, idx) => (
              <li key={idx} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <div className="flex justify-between text-xs text-gray-500 mb-2">
                  <span>By: {msg.author}</span>
                  <span>{msg.created_at ? timeAgo(msg.created_at) : ""}</span>
                </div>
                <div className="text-gray-800">{msg.content}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-gray-50 border-t border-gray-200 p-4 z-10">
        <div className="max-w-2xl mx-auto px-2">
          <form onSubmit={handleSubmit} className="flex items-center gap-3 bg-white rounded-full shadow-lg border border-gray-200 p-2">
            <input
              type="text"
              className="flex-1 px-4 py-3 border-none outline-none bg-transparent text-gray-800 placeholder-gray-500"
              maxLength={250}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={localStorage.getItem("token") ? "Write your message..." : "Log in to post messages..."}
              disabled={!localStorage.getItem("token")}
            />
            <div className="flex items-center gap-2">
              {localStorage.getItem("token") && (
                <span className="text-xs text-gray-400 hidden sm:block">{message.length}/250</span>
              )}
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white w-10 h-10 rounded-full transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
                disabled={submitLoading || !localStorage.getItem("token") || message.length === 0}
                title="Post message"
              >
                {submitLoading ? (
                  <span className="text-sm">...</span>
                ) : (
                  <span className="text-lg">→</span>
                )}
              </button>
            </div>
          </form>
          {error && (
            <div className="mt-2 text-center text-sm text-red-500 bg-red-50 p-2 rounded-lg">{error}</div>
          )}
        </div>
      </div>
    </div>
  );
} 