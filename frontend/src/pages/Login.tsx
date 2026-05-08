import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    try { await login(email, password); nav("/"); }
    catch (e: any) { setErr(e.response?.data?.error || "Error"); }
  };

  return (
    <form onSubmit={submit} className="max-w-sm mx-auto bg-white p-6 rounded shadow space-y-3">
      <h1 className="text-2xl font-bold">Login</h1>
      <input className="w-full p-2 border rounded" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input className="w-full p-2 border rounded" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      {err && <p className="text-red-600 text-sm">{err}</p>}
      <button className="w-full bg-blue-600 text-white py-2 rounded">Sign in</button>
      <p className="text-sm text-center">No account? <Link to="/register" className="text-blue-600">Register</Link></p>
    </form>
  );
}
