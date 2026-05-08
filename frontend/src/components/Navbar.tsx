import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  return (
    <nav className="bg-white border-b">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="font-bold text-xl">📝 CMS Blog</Link>
        <div className="flex items-center gap-4 text-sm">
          <NavLink to="/" className="hover:text-blue-600">Home</NavLink>
          {user && (user.role === "ADMIN" || user.role === "AUTHOR") && (
            <NavLink to="/admin" className="hover:text-blue-600">Dashboard</NavLink>
          )}
          {user ? (
            <>
              <span className="text-gray-500">{user.name} ({user.role})</span>
              <button onClick={logout} className="text-red-600">Logout</button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="hover:text-blue-600">Login</NavLink>
              <NavLink to="/register" className="hover:text-blue-600">Register</NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
