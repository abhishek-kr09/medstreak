import { useEffect, useState } from "react";
import { MoonStar, Sun } from "lucide-react";

const STORAGE_KEY = "medstreak_theme";

const getInitialTheme = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }

  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }

  return "light";
};

const ThemeToggler = () => {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <button
      className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-100"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      type="button"
    >
      {theme === "light" ? <MoonStar size={18} /> : <Sun size={18} />}
    </button>
  );
};

export default ThemeToggler;
