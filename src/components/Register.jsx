import React from "react";

export default function Register() {
  const [email, setEmail] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [errors, setErrors] = React.useState({});
  const [submitted, setSubmitted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [serverMsg, setServerMsg] = React.useState("");

  function validate() {
    const errs = {};
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      errs.email = "Invalid email format.";
    }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      errs.username = "Username must be 3-20 chars (letters, numbers, underscore).";
    }
    if (password.length < 6) {
      errs.password = "Password must be at least 6 characters.";
    }
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerMsg("");
    const errs = validate();
    setErrors(errs);
    setSubmitted(true);
    if (Object.keys(errs).length === 0) {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:4000/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, username, password })
        });
        const data = await res.json();
        if (res.ok) {
          setServerMsg("Registration successful! You can now log in.");
          setEmail("");
          setUsername("");
          setPassword("");
          setSubmitted(false);
        } else {
          setServerMsg(data.error || "Registration failed");
        }
      } catch (err) {
        setServerMsg("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <div className="flex flex-col min-h-[80vh] bg-gradient-to-br from-gray-100 to-gray-200">
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-10 border border-gray-100">
          <div className="flex flex-col items-center mb-6">
            <h2 className="text-3xl font-bold mb-1 text-gray-900">Sign Up</h2>
            <p className="text-gray-500 text-center">Create your account to get started</p>
          </div>
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-gray-50 text-gray-900 placeholder-gray-400 transition"
                placeholder="you@email.com"
              />
              {submitted && errors.email && (
                <div className="text-red-500 text-xs mt-1">{errors.email}</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-gray-50 text-gray-900 placeholder-gray-400 transition"
                placeholder="your_username"
              />
              {submitted && errors.username && (
                <div className="text-red-500 text-xs mt-1">{errors.username}</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-gray-50 text-gray-900 placeholder-gray-400 transition"
                placeholder="At least 6 characters"
              />
              {submitted && errors.password && (
                <div className="text-red-500 text-xs mt-1">{errors.password}</div>
              )}
            </div>
            <button type="submit" className="w-full bg-black text-white font-semibold py-3 rounded-lg hover:bg-gray-900 transition disabled:opacity-60" disabled={loading}>{loading ? "Registering..." : "Sign Up"}</button>
          </form>
          {serverMsg && <div className="mt-4 text-center text-sm text-black">{serverMsg}</div>}
        </div>
      </div>
    </div>
  );
}