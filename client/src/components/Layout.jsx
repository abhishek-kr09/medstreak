import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

const Layout = () => (
  <div className="flex min-h-screen flex-col">
    <Navbar />
    <div className="flex-1 px-6 py-10 md:px-12">
      <Outlet />
    </div>
    <Footer />
  </div>
);

export default Layout;
