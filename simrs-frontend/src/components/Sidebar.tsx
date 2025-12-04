import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Database, UserCircle } from "lucide-react";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const menu = [
    {
      key: "/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard size={18} />,
    },
    { key: "/master/snomed", label: "SNOMED", icon: <Database size={18} /> },
    { key: "/pasien", label: "Pasien", icon: <UserCircle size={18} /> }, // 🧩 baru
    { key: "/user", label: "User", icon: <UserCircle size={18} /> }, // 🧩 baru
  ];

  return (
    <div
      className={`${
        collapsed ? "w-16" : "w-56"
      } bg-gray-800 text-white h-screen flex flex-col transition-all duration-300`}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <span className={`${collapsed ? "hidden" : "block"} font-bold text-lg`}>
          🧠 MedDashboard
        </span>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-300 hover:text-white"
        >
          ☰
        </button>
      </div>

      <nav className="flex-1 p-2 space-y-2">
        {menu.map((item) => (
          <Link
            to={item.key}
            key={item.key}
            className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg transition
              ${
                location.pathname === item.key
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-700"
              }`}
          >
            {item.icon}
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>
    </div>
  );
}
