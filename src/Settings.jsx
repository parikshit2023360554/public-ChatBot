import React from "react";

export default function Settings() {
  const [showDelete, setShowDelete] = React.useState(false);
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [msg, setMsg] = React.useState("");

  let email = "";
  try {
    const token = localStorage.getItem("token");
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      email = payload.email;
    }
  } catch {}

  function handleChangePassword(e) {
    e.preventDefault();
    setMsg("");
    if (password.length < 6) {
      setMsg("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setMsg("Passwords do not match.");
      return;
    }
    setMsg("(Demo) Password change would be sent to backend.");
    setPassword("");
    setConfirmPassword("");
  }

  function handleDeleteAccount() {
    setMsg("(Demo) Account deletion would be sent to backend.");
    setShowDelete(false);
  }

  return (
    <div className="flex flex-col items-center min-h-[80vh] bg-gray-50 py-8">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl p-10 border border-gray-100 mb-8">
        <h2 className="text-3xl font-extrabold mb-2 text-center flex items-center justify-center gap-2">
          <span role="img" aria-label="settings">⚙️</span> Settings
        </h2>
        <div className="mb-4 text-center text-purple-600">{email}</div>
        <form onSubmit={handleChangePassword} className="flex flex-col gap-4 mt-6">
          <input
            type="password"
            className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 bg-gray-50"
            placeholder="New password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <input
            type="password"
            className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 bg-gray-50"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
          />
          <button type="submit" className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 rounded-full transition">Change Password</button>
        </form>
        {msg && <div className="mt-4 text-center text-sm text-purple-600">{msg}</div>}
        <button
          className="mt-8 w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-full transition"
          onClick={() => setShowDelete(true)}
        >
          Delete Account
        </button>
        {showDelete && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full">
              <h3 className="text-lg font-semibold mb-4">Confirm Account Deletion</h3>
              <p className="mb-6">Are you sure you want to delete your account? This action cannot be undone.</p>
              <div className="flex gap-4">
                <button className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-full" onClick={() => setShowDelete(false)}>Cancel</button>
                <button className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-full" onClick={handleDeleteAccount}>Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 