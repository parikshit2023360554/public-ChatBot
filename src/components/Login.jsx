import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [errors, setErrors] = React.useState({});
  const [submitted, setSubmitted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [serverMsg, setServerMsg] = React.useState("");
  const navigate = useNavigate();

  function validate() {
    const errs = {};
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      errs.email = "Invalid email format.";
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
        const res = await fetch("http://localhost:4000/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (res.ok && data.token) {
          localStorage.setItem("token", data.token);
          window.dispatchEvent(new Event("storage"));
          setServerMsg("Login successful! Token saved.");
          setEmail("");
          setPassword("");
          setSubmitted(false);
          navigate("/my-messages");
        } else {
          setServerMsg(data.error || "Login failed");
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
            <h2 className="text-3xl font-bold mb-1 text-gray-900">Sign In</h2>
            <p className="text-gray-500 text-center">Access your account</p>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-gray-50 text-gray-900 placeholder-gray-400 transition"
                placeholder="Your password"
              />
              {submitted && errors.password && (
                <div className="text-red-500 text-xs mt-1">{errors.password}</div>
              )}
            </div>
            <button type="submit" className="w-full bg-black text-white font-semibold py-3 rounded-lg hover:bg-gray-900 transition disabled:opacity-60" disabled={loading}>{loading ? "Signing in..." : "Sign In"}</button>
          </form>
          {serverMsg && <div className="mt-4 text-center text-sm text-black">{serverMsg}</div>}
          <div className="mt-6 text-center">
            <span className="text-gray-500">Don't have an account? </span>
            <Link to="/register" className="text-black font-semibold hover:underline">Sign Up</Link>
          </div>
        </div>
      </div>
    </div>
  );
} 