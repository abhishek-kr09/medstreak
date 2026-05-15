import { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { CircleUser, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "../context/AuthContext";
import { toInputDate } from "../utils/dates";
import ThemeToggler from "./ThemeToggler";

const navLinkClass = ({ isActive }) =>
  `text-sm font-semibold transition ${
    isActive ? "text-teal-600" : "text-slate-500 hover:text-teal-600"
  }`;

const Navbar = () => {
  const { user, logout } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    if (!showProfile) return;

    const handleOutsideClick = (event) => {
      if (!profileRef.current) return;
      if (!profileRef.current.contains(event.target)) {
        setShowProfile(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [showProfile]);

  return (
    <header className="sticky top-0 z-20 border-b border-white/60 bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 md:px-12">
        <Link to="/" className="flex items-center gap-2 text-lg font-semibold text-teal-600">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-600 text-white">
            <Sparkles size={16} />
          </span>
          MedStreak
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          <NavLink to="/" className={navLinkClass}>
            Home
          </NavLink>
          {user && (
            <NavLink to={`/${user.role}`} className={navLinkClass}>
              Dashboard
            </NavLink>
          )}
          {user?.role === "student" && (
            <NavLink to="/student/notes" className={navLinkClass}>
              Parent notes
            </NavLink>
          )}
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggler />
          {!user ? (
            <>
              <Link to="/login">
                <Button size="sm" variant="outline">Login</Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Register</Button>
              </Link>
            </>
          ) : (
            <div ref={profileRef} className="relative flex items-center gap-2">
              <button
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm"
                onClick={() => setShowProfile((prev) => !prev)}
              >
                <CircleUser size={20} />
              </button>
              {showProfile && (
                <div className="absolute right-0 top-12 w-64 rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-600 shadow-lg">
                  <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                  <p>{user.email}</p>
                  {user.role === "student" && (
                    <p className="mt-2">Target: {toInputDate(user.targetExamDate) || "Not set"}</p>
                  )}
                  {user.role === "student" && (
                    <p className="mt-1">Code: {user.uniqueConnectCode || "Pending"}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {user.role === "student" && (
                      <Link to="/student/profile" className="text-slate-900">Profile</Link>
                    )}
                    <button className="text-slate-900" onClick={logout}>Logout</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
