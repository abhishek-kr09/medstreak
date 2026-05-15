import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t border-white/70 bg-white/70 backdrop-blur">
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 text-sm text-slate-600 md:flex-row md:items-center md:justify-between md:px-12">
      <div className="space-y-2">
        <p className="text-base font-semibold text-slate-900">MedStreak</p>
        <p className="max-w-md">
          A streak-first NEET prep platform for students, parents, and admins.
        </p>
      </div>
      <div className="flex flex-wrap gap-6 text-sm font-semibold">
        <Link to="/" className="hover:text-slate-900">Home</Link>
        <Link to="/about" className="hover:text-slate-900">About</Link>
        <Link to="/contact" className="hover:text-slate-900">Contact</Link>
        <a href="mailto:info@medstreak.com" className="hover:text-slate-900">Email us</a>
        
      </div>
    </div>
  </footer>
);

export default Footer;
