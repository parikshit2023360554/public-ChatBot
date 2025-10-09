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
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <h2 className="text-2xl font-bold mb-4 text-center">Settings</h2>
        <div className="mb-6">
          <div className="font-semibold mb-1">Account Email:</div>
          <div className="text-gray-700 mb-2">{email || <span className="italic text-gray-400">Not logged in</span>}</div>
        </div>
        <form onSubmit={handleChangePassword} className="mb-6">
          <div className="font-semibold mb-2">Change Password</div>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="New password"
            className="w-full mb-2 px-3 py-2 border rounded-lg"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            className="w-full mb-2 px-3 py-2 border rounded-lg"
          />
          <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition">Change Password</button>
        </form>
        <div className="mb-2">
          <button
            onClick={() => setShowDelete(true)}
            className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition"
          >
            Delete Account
          </button>
        </div>
        {showDelete && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg mt-2 text-center">
            <div className="mb-2 font-semibold text-red-700">Are you sure you want to delete your account?</div>
            <button
              onClick={handleDeleteAccount}
              className="bg-red-600 text-white px-4 py-1 rounded mr-2 hover:bg-red-700"
            >
              Yes, Delete
            </button>
            <button
              onClick={() => setShowDelete(false)}
              className="bg-gray-200 px-4 py-1 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        )}
        {msg && <div className="mt-4 text-center text-blue-600">{msg}</div>}
      </div>
    </div>
  );
} 