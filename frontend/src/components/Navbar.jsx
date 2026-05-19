import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

function Navbar({ user }) {
  const navigate = useNavigate();

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  return (
    <nav className="navbar">
      <Link to="/" className="nav-logo">
        🛒 Smart Grocery Savings
      </Link>
      <div className="nav-links">
        {user ? (
          <>
            <span className="nav-email">{user.email}</span>
            <Link to="/lists">My Lists</Link>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/search">Price Search</Link>
            <button onClick={handleLogout} className="btn-logout">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/signup" className="btn-signup">
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
