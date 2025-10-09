import React from "react";
import { useNavigate } from "react-router-dom";

export default function MyMessages() {
  const [message, setMessage] = React.useState("");
  const [messages, setMessages] = React.useState([]);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [submitLoading, setSubmitLoading] = React.useState(false);
  const [serverMsg, setServerMsg] = React.useState("");
  const [deletingId, setDeletingId] = React.useState(null);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setServerMsg("");
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
      const token = localStorage.getItem("token");
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
        setServerMsg("Message submitted!");

        fetchMyMessages();
      } else {
        setServerMsg(data.error || "Failed to submit message.");
      }
    } catch {
      setServerMsg("Network error. Please try again.");
    } finally {
      setSubmitLoading(false);
    }
  }

  async function handleDelete(id) {
    setDeletingId(id);
    setServerMsg("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:4000/api/messages/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setServerMsg("Message deleted.");
        fetchMyMessages();
      } else {
        setServerMsg(data.error || "Failed to delete message.");
      }
    } catch {
      setServerMsg("Network error. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }


  const fetchMyMessages = React.useCallback(async () => {
    const token = localStorage.getItem("token");
    setLoading(true);
    setServerMsg("");
    try {
      const res = await fetch("http://localhost:4000/api/my-messages", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      } else {
        setServerMsg("Failed to fetch your messages. Please log in again.");
      }
    } catch {
      setServerMsg("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setServerMsg("Please log in first.");
      setTimeout(() => navigate("/login"), 1200);
      return;
    }
    fetchMyMessages();
  }, [navigate, fetchMyMessages]);

  return (
    <div className="flex flex-col items-center min-h-[80vh] bg-gray-50 py-8">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl p-10 border border-gray-100 mb-8">
        <h2 className="text-3xl font-extrabold mb-2 text-center flex items-center justify-center gap-2">
          <span role="img" aria-label="messages">💬</span> My Messages
        </h2>
        {serverMsg && <div className="mb-4 text-center text-purple-600">{serverMsg}</div>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-6">
          <textarea
            className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 bg-gray-50 resize-none"
            rows={3}
            maxLength={250}
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Write your message (max 250 chars)"
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">{message.length}/250</span>
            {error && <span className="text-xs text-red-500">{error}</span>}
          </div>
          <button type="submit" className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 rounded-full transition disabled:opacity-60" disabled={submitLoading}>{submitLoading ? "Submitting..." : "Submit Message"}</button>
        </form>
      </div>
      <div className="w-full max-w-xl">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">Your Messages</h3>
        {loading ? (
          <div className="text-gray-400">Loading...</div>
        ) : (
          <ul className="space-y-3">
            {messages.length === 0 && <li className="text-gray-400">No messages yet.</li>}
            {messages.map((msg, idx) => (
              <li key={msg.id || idx} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex justify-between items-center">
                <div>
                  <div className="text-gray-800">{msg.content}</div>
                  <div className="text-xs text-gray-400 mt-1">{msg.created_at ? new Date(msg.created_at).toLocaleString() : ""}</div>
                </div>
                <button
                  className="ml-4 p-2 rounded hover:bg-gray-200 transition disabled:opacity-60 flex items-center justify-center bg-transparent shadow-none border-none"
                  onClick={() => handleDelete(msg.id)}
                  disabled={deletingId === msg.id}
                  title="Delete message"
                  aria-label="Delete message"
                  style={{ background: 'none', border: 'none' }}
                >
                  {deletingId === msg.id ? (
                    <span>Deleting...</span>
                  ) : (
                    <span role="img" aria-label="delete">🗑️</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
} 