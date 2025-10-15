import React from "react";
import { useNavigate } from "react-router-dom";

export default function DirectMessages() {
  const [users, setUsers] = React.useState([]);
  const [selectedUser, setSelectedUser] = React.useState(null);
  const [messages, setMessages] = React.useState([]);
  const [newMessage, setNewMessage] = React.useState("");
  const [loadingUsers, setLoadingUsers] = React.useState(false);
  const [loadingMessages, setLoadingMessages] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState("");
  const [unreadMap, setUnreadMap] = React.useState({});
  const navigate = useNavigate();

  let myId = null;
  let myUsername = "";
  try {
    const token = localStorage.getItem("token");
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      myId = payload.id;
      myUsername = payload.username || payload.email;
    }
  } catch {}

  React.useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please log in to use direct messages.");
      setTimeout(() => navigate("/login"), 1200);
      return;
    }
    (async function loadUsers() {
      setLoadingUsers(true);
      setError("");
      try {
        const res = await fetch("http://localhost:4000/api/users", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
          // After loading users, fetch unread counts
          await loadUnreadCounts();
        } else {
          setError("Failed to load users.");
        }
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setLoadingUsers(false);
      }
    })();
  }, [navigate]);

  async function loadUnreadCounts() {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:4000/api/dm/unread-counts", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const map = {};
        for (const row of data) {
          map[row.other_user_id] = row.unread_count || 0;
        }
        setUnreadMap(map);
      }
    } catch {}
  }

  async function loadConversation(user) {
    if (!user) return;
    const token = localStorage.getItem("token");
    setLoadingMessages(true);
    setError("");
    try {
      const res = await fetch(`http://localhost:4000/api/dm/${user.id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
        // Mark conversation as read
        try {
          const markRes = await fetch(`http://localhost:4000/api/dm/read/${user.id}`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (markRes.ok) {
            setUnreadMap(prev => ({ ...prev, [user.id]: 0 }));
          }
        } catch {}
      } else {
        setError("Failed to load conversation.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoadingMessages(false);
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!selectedUser) {
      setError("Please select a user to message.");
      return;
    }
    if (newMessage.length === 0) {
      setError("Message cannot be empty.");
      return;
    }
    if (newMessage.length > 500) {
      setError("Message cannot exceed 500 characters.");
      return;
    }
    const token = localStorage.getItem("token");
    setSending(true);
    setError("");
    try {
      const res = await fetch("http://localhost:4000/api/dm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ toId: selectedUser.id, content: newMessage })
      });
      const data = await res.json();
      if (res.ok) {
        setNewMessage("");
        await loadConversation(selectedUser);
      } else {
        setError(data.error || "Failed to send message.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-28">
      <div className="w-full p-4">
        {error && <div className="mb-4 text-center text-red-600">{error}</div>}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-0">
          <div className="md:col-span-1 border-r pr-2">
            <div className="font-semibold mb-2 px-2">Users</div>
            {loadingUsers ? (
              <div className="text-gray-400">Loading users...</div>
            ) : (
              <ul className="space-y-2 overflow-y-auto">
                {users.length === 0 && <li className="text-gray-400">No other users.</li>}
                {users.map(u => (
                  <li key={u.id}>
                    <button
                      className={`w-full text-left px-3 py-2 rounded-lg border ${selectedUser?.id === u.id ? 'bg-blue-50 border-blue-300' : 'border-gray-200 hover:bg-gray-50'} flex items-center justify-between`}
                      onClick={() => { setSelectedUser(u); loadConversation(u); }}
                    >
                      <span className="inline-flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium uppercase">
                          {(u.username || 'U').charAt(0).toUpperCase()}
                        </span>
                        <span>{u.username || '(no username)'}</span>
                      </span>
                      {unreadMap[u.id] > 0 && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-red-500 text-white">
                          {unreadMap[u.id]}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="md:col-span-3 flex flex-col">
            <div className="flex items-center gap-3 mb-2 px-2">
              <span className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium uppercase">
                {selectedUser ? (selectedUser.username || 'U').charAt(0).toUpperCase() : ''}
              </span>
              <span className="font-semibold text-lg">{selectedUser ? (selectedUser.username || '(no username)') : ''}</span>
            </div>
            <div className="flex-1 min-h-[60vh] overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50">
              {loadingMessages ? (
                <div className="text-gray-400">Loading conversation...</div>
              ) : messages.length === 0 ? (
                <div className="text-gray-400">No messages yet. Start the conversation!</div>
              ) : (
                messages.map(m => (
                  <div key={m.id} className={`flex ${m.sender_id === myId ? 'justify-end' : 'justify-start'} mb-2`}>
                    <div className={`max-w-[75%] px-3 py-2 rounded-lg ${m.sender_id === myId ? 'bg-blue-500 text-white' : 'bg-white border'}`}>
                      <div className="text-sm">{m.content}</div>
                      <div className="text-[10px] opacity-70 mt-1">{m.created_at ? new Date(m.created_at).toLocaleString() : ''}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* message input moved to fixed bottom bar for consistent styling */}
          </div>
        </div>
      </div>
      {/* Fixed bottom compose bar (styled like PublicFeed) */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-50 border-t border-gray-200 p-4 z-10">
        <div className="max-w-4xl mx-auto px-2">
          <form onSubmit={handleSend} className="flex items-center gap-3 bg-white rounded-full shadow-lg border border-gray-200 p-2">
            <input
              type="text"
              className="flex-1 px-4 py-3 border-none outline-none bg-transparent text-gray-800 placeholder-gray-500"
              maxLength={500}
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder={selectedUser ? `Message ${selectedUser.username || '(no username)'}` : "Select a user to start chatting"}
              disabled={!selectedUser}
            />
            <div className="flex items-center gap-2">
              {selectedUser && (
                <span className="text-xs text-gray-400 hidden sm:block">{newMessage.length}/500</span>
              )}
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white w-10 h-10 rounded-full transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
                disabled={!selectedUser || sending || newMessage.length === 0}
                title="Send message"
              >
                {sending ? (
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