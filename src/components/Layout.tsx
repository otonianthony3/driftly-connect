import { Outlet } from "react-router-dom";
import { AppNavigation } from "./AppNavigation"; // Adjust this based on your sidebar component

export function Layout() {
  return (
    <div className="flex">
      <AppNavigation /> {/* Sidebar */}
      <div className="flex-1 p-4">
        <Outlet /> {/* This is where pages will be loaded */}
      </div>
    </div>
  );
}
export default Layout;