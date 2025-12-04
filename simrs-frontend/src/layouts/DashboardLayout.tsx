import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Database,
  LogOut,
  UserCircle,
  Menu,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Users,
  Briefcase,
  Users2,
  Stethoscope,
  BookOpenText,
  Eye,
  History,
  FileText,
} from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";

// --- Type Definitions ---
interface User {
  FS_nama_lengkap?: string;
  username?: string;
  role?: string;
}

interface MenuItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  children?: MenuItem[];
  roles?: string[];
}

// --- Komponen Utama ---

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  // Menggunakan Array untuk logic menu (agar tidak error/tertutup sendiri)
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

  const menuRef = useRef<HTMLDivElement>(null);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // --- Utility & Handlers ---
  const clearAllLocalStorage = () => {
    localStorage.clear();
    sessionStorage.clear();
  };

  let userRole = "";
  try {
    const rawUser =
      localStorage.getItem("user") || sessionStorage.getItem("user");
    const parsed = rawUser ? JSON.parse(rawUser) : null;
    userRole = (
      parsed?.FS_role?.trim() ||
      parsed?.role?.trim() ||
      ""
    ).toUpperCase();
  } catch (err) {
    console.error("❌ Gagal parse data user:", err);
  }

  const ROLES = {
    ADMIN: "ADMIN",
    DOKTER: "DOKTER",
    PERAWAT: "PERAWAT",
    PENDAFTARAN: "PENDAFTARAN",
    KEUANGAN: "KEUANGAN",
    FARMASI: "FARMASI",
  };

  const isAdmin = userRole === ROLES.ADMIN;

  const handleLogout = () => {
    const rememberedUsername = localStorage.getItem("auth_username");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("auth_role");
    sessionStorage.clear();
    if (rememberedUsername) {
      localStorage.setItem("auth_username", rememberedUsername);
    }
    navigate("/");
  };

  // --- Konfigurasi Menu ---
  const menu: MenuItem[] = [
    {
      key: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard size={18} />,
      path: "/dashboard",
      roles: [
        ROLES.ADMIN,
        ROLES.DOKTER,
        ROLES.PERAWAT,
        ROLES.PENDAFTARAN,
        ROLES.KEUANGAN,
        ROLES.FARMASI,
      ],
    },
    {
      key: "master-data",
      label: "Master Data",
      icon: <Database size={18} />,
      roles: [ROLES.ADMIN],
      children: [
        {
          key: "snomed",
          label: "SNOMED",
          icon: <BookOpenText size={16} />,
          path: "/master/snomed",
        },
        // {
        //   key: "icd10",
        //   label: "ICD-10",
        //   icon: <BookOpenText size={16} />,
        //   path: "/master/icd10",
        // },
        // Menu Ruangan/Unit DIHAPUS disini
        {
          key: "cara-datang",
          label: "Cara Datang",
          icon: <UserCircle size={16} />,
          path: "/cara-datang",
        },
      ],
    },
    {
      key: "manajemen-user",
      label: "Manajemen User",
      icon: <Users size={18} />,
      roles: [ROLES.ADMIN],
      children: [
        {
          key: "user",
          label: "Admin/Staff",
          icon: <Users2 size={16} />,
          path: "/user",
        },
        {
          key: "nakes",
          label: "Tenaga Kesehatan",
          icon: <Stethoscope size={16} />,
          path: "/nakes",
        },
        {
          key: "pasien",
          label: "Data Pasien",
          icon: <UserCircle size={16} />,
          path: "/pasien",
        },
      ],
    },
    {
      key: "layanan-medis",
      label: "Layanan",
      icon: <ClipboardList size={18} />,
      roles: [
        ROLES.ADMIN,
        ROLES.DOKTER,
        ROLES.PERAWAT,
        ROLES.PENDAFTARAN,
        ROLES.KEUANGAN,
      ],
      children: [
        {
          key: "check-in",
          label: "Check-in Pasien",
          icon: <Users size={16} />,
          path: "/layanan/check-in",
          roles: [ROLES.ADMIN, ROLES.PENDAFTARAN, ROLES.PERAWAT],
        },
        // Menu Pendaftaran DIHAPUS disini

        // --- GROUP 1: ANAMNESIS ---
        {
          key: "group-anamnesis",
          label: "Anamnesis",
          icon: <FileText size={16} />,
          roles: [ROLES.ADMIN, ROLES.DOKTER, ROLES.PERAWAT],
          children: [
            {
              key: "anamnesis",
              label: "Input Anamnesis",
              icon: <Stethoscope size={16} />,
              path: "/layanan/anamnesis",
              roles: [ROLES.ADMIN, ROLES.DOKTER, ROLES.PERAWAT],
            },
            {
              key: "anamnesisHistory",
              label: "History Anamnesis",
              icon: <History size={16} />,
              path: "/layanan/anamnesis-history",
              roles: [ROLES.ADMIN, ROLES.DOKTER, ROLES.PERAWAT],
            },
          ],
        },

        // --- GROUP 2: PEMERIKSAAN MATA ---
        {
          key: "group-mata",
          label: "Pemeriksaan Mata",
          icon: <Eye size={16} />,
          roles: [ROLES.ADMIN, ROLES.DOKTER, ROLES.PERAWAT],
          children: [
            {
              key: "pemeriksaanMata",
              label: "Input Pemeriksaan",
              icon: <Stethoscope size={16} />,
              path: "/layanan/pemeriksaan-mata",
              roles: [ROLES.ADMIN, ROLES.DOKTER, ROLES.PERAWAT],
            },
            {
              key: "pemeriksaanMataHistory",
              label: "History Mata",
              icon: <History size={16} />,
              path: "/layanan/pemeriksaan-mata-history",
              roles: [ROLES.ADMIN, ROLES.DOKTER, ROLES.PERAWAT],
            },
          ],
        },

        {
          key: "pemeriksaanPenunjang",
          label: "Pemeriksaan Penunjang",
          icon: <Stethoscope size={16} />,
          path: "/layanan/pemeriksaan-penunjang",
          roles: [ROLES.ADMIN, ROLES.DOKTER, ROLES.PERAWAT],
        },
        {
          key: "diagnosisProsedur",
          label: "Diagnosis Prosedur",
          icon: <Stethoscope size={16} />,
          path: "/layanan/diagnosis-prosedur",
          roles: [ROLES.ADMIN, ROLES.DOKTER],
        },
        {
          key: "rencanaTatalaksana",
          label: "Rencana Tatalaksana",
          icon: <Stethoscope size={16} />,
          path: "/layanan/tatalaksana",
          roles: [ROLES.ADMIN, ROLES.DOKTER],
        },
        {
          key: "edukasiDanInstruksi",
          label: "Edukasi dan Instruksi",
          icon: <Stethoscope size={16} />,
          path: "/layanan/edukasi",
          roles: [ROLES.ADMIN, ROLES.DOKTER, ROLES.PERAWAT],
        },
        {
          key: "SOAP",
          label: "SOAP",
          icon: <Stethoscope size={16} />,
          path: "/layanan/soap",
          roles: [ROLES.ADMIN, ROLES.DOKTER, ROLES.PERAWAT],
        },
        {
          key: "BPJS",
          label: "BPJS",
          icon: <Stethoscope size={16} />,
          path: "/layanan/BPJS",
          roles: [ROLES.ADMIN, ROLES.PENDAFTARAN, ROLES.KEUANGAN],
        },
      ],
    },
  ];

  // --- Logic Filter Menu ---
  const filteredMenu = useMemo(() => {
    const filterItems = (items: MenuItem[]): MenuItem[] => {
      return items
        .map((item) => {
          const isAllowed =
            userRole === ROLES.ADMIN ||
            !item.roles ||
            item.roles.includes(userRole);
          let allowedChildren: MenuItem[] | undefined;
          if (item.children) {
            allowedChildren = filterItems(item.children);
          }
          if (isAllowed) {
            if (
              item.children &&
              (!allowedChildren || allowedChildren.length === 0)
            )
              return null;
            return { ...item, children: allowedChildren };
          }
          return null;
        })
        .filter((item) => item !== null) as MenuItem[];
    };
    return filterItems(menu);
  }, [userRole]);

  // --- Logic Toggle Menu ---
  const toggleMenuKey = (key: string) => {
    setExpandedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // --- Auto Expand ---
  useEffect(() => {
    if (sidebarCollapsed) return;
    const findParentKeys = (
      items: MenuItem[],
      path: string,
      parents: string[] = []
    ): string[] => {
      for (const item of items) {
        if (item.path === path) return parents;
        if (item.children) {
          const found = findParentKeys(item.children, path, [
            ...parents,
            item.key,
          ]);
          if (found.length > 0) return found;
        }
      }
      return [];
    };

    const keysToOpen = findParentKeys(filteredMenu, location.pathname);
    if (keysToOpen.length > 0) {
      setExpandedKeys((prev) => {
        const newKeys = new Set([...prev, ...keysToOpen]);
        return Array.from(newKeys);
      });
    }
  }, [location.pathname, filteredMenu, sidebarCollapsed]);

  // --- Logic Title ---
  const getPageTitle = (items: MenuItem[], path: string): string => {
    for (const item of items) {
      if (item.path === path) return item.label;
      if (item.children) {
        const childLabel = getPageTitle(item.children, path);
        if (childLabel) return childLabel;
      }
    }
    return "";
  };
  const pageTitle =
    getPageTitle(filteredMenu, location.pathname) || "Dashboard";

  // --- Data User Logic ---
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      clearAllLocalStorage();
      navigate("/");
      return;
    }
    const cachedUser = localStorage.getItem("user");
    if (cachedUser) {
      try {
        setUser(JSON.parse(cachedUser));
      } catch {
        clearAllLocalStorage();
      }
    }
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const mappedUser: User = {
          FS_nama_lengkap: res.data.nama_lengkap,
          username: res.data.username,
          role: res.data.role,
        };
        setUser(mappedUser);
        localStorage.setItem("user", JSON.stringify(mappedUser));
      } catch {
        clearAllLocalStorage();
        navigate("/");
      }
    };
    fetchProfile();
  }, [navigate, API_BASE_URL]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- RENDER MENU (Style Lama / Bold) ---
  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const isBar = item.children && item.children.length > 0;
    const isActive = location.pathname === item.path;
    const isExpanded = expandedKeys.includes(item.key);

    const paddingX = level === 0 ? "px-4" : "px-3";

    // --- LEAF NODE (Item Tanpa Anak) ---
    if (!isBar) {
      const isDashboard = item.key === "dashboard";

      const dashboardClasses = `w-full flex items-center gap-3 ${paddingX} py-3 rounded-lg font-semibold tracking-wide transition-all duration-300 shadow-md ${
        isActive
          ? "bg-cyan-500 text-white scale-[1.03]"
          : "bg-transparent text-gray-200 hover:bg-gray-800"
      }`;

      const submenuClasses = `w-full flex items-center gap-2 ${paddingX} py-2 rounded-md transition-all duration-300 text-sm ${
        isActive
          ? "bg-cyan-600 text-white font-semibold"
          : "bg-transparent text-gray-200 hover:bg-gray-700/50"
      }`;

      const classes = isDashboard ? dashboardClasses : submenuClasses;

      return (
        <button
          key={item.key}
          onClick={() => navigate(item.path!)}
          className={`group ${classes} mb-1`}
          title={sidebarCollapsed ? item.label : undefined}
        >
          <div className="p-1.5 rounded-md bg-transparent">{item.icon}</div>
          {!sidebarCollapsed && <span>{item.label}</span>}
          {sidebarCollapsed && (
            <span className="absolute left-full ml-4 z-50 p-2 text-xs bg-gray-800 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
              {item.label}
            </span>
          )}
        </button>
      );
    }

    // --- PARENT NODE (Folder) ---
    const isAnyChildActive = item.children!.some(
      (child) =>
        location.pathname.startsWith(child.path || "xyz") ||
        (child.children &&
          child.children.some((c) =>
            location.pathname.startsWith(c.path || "xyz")
          ))
    );

    const isBarOpen = isExpanded || (isAnyChildActive && !sidebarCollapsed);

    const barClasses = `w-full flex items-center gap-3 ${paddingX} py-3 rounded-lg font-semibold tracking-wide cursor-pointer transition-all duration-300 mb-1 ${
      isBarOpen || isAnyChildActive
        ? "bg-gray-800 text-white"
        : "bg-transparent text-gray-200 hover:bg-gray-800/50"
    }`;

    return (
      <div key={item.key} className="relative group w-full">
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleMenuKey(item.key);
          }}
          className={barClasses}
          title={sidebarCollapsed ? item.label : undefined}
        >
          <div className="p-1.5 rounded-md bg-transparent">{item.icon}</div>
          {!sidebarCollapsed && (
            <>
              <span className="flex-1 text-left">{item.label}</span>
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </>
          )}
          {sidebarCollapsed && (
            <span className="absolute left-full ml-4 z-50 p-2 text-xs bg-gray-800 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
              {item.label}
            </span>
          )}
        </button>

        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isExpanded && !sidebarCollapsed
              ? "max-h-[1000px] opacity-100"
              : "max-h-0 opacity-0"
          }`}
        >
          <div className="mt-1 space-y-1 ml-4 border-l-2 border-cyan-500 pl-2">
            {item.children!.map((child) => renderMenuItem(child, level + 1))}
          </div>
        </div>
      </div>
    );
  };

  // --- JSX Layout ---

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside
        className={`bg-gray-900 text-gray-200 h-screen flex flex-col overflow-y-auto fixed left-0 top-0 z-20 shadow-2xl transition-all duration-300 ${
          sidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        <div className="flex items-center justify-between h-16 border-b border-gray-700 px-4">
          {!sidebarCollapsed && (
            <span className="font-extrabold text-xl tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]">
              SIMRS
            </span>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-gray-400 hover:text-white transition-all"
          >
            {sidebarCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-2">
          {filteredMenu.map((item) => renderMenuItem(item, 0))}
        </nav>
      </aside>

      <div
        style={{ marginLeft: sidebarCollapsed ? "5rem" : "16rem" }}
        className="flex-1 flex flex-col transition-all duration-300"
      >
        <header className="flex items-center justify-between bg-white/90 backdrop-blur-md shadow px-6 py-3 sticky top-0 z-10 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-700 tracking-wide">
            {pageTitle}
          </h1>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-all"
            >
              <div className="w-9 h-9 rounded-full overflow-hidden bg-white border border-gray-200 shadow-sm">
                <img
                  src="https://rspkujogja.com/wp-content/uploads/2024/01/Logo-PKU-Jogja.png"
                  alt="Logo PKU Jogja"
                  className="w-full h-full object-contain p-1"
                />
              </div>
              {!sidebarCollapsed && (
                <span className="font-medium text-gray-700 hidden sm:block">
                  {user?.FS_nama_lengkap || "User"}
                </span>
              )}
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-100 z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-700">
                    {user?.FS_nama_lengkap || "User"}
                  </p>
                  <p className="text-xs text-gray-500">{user?.role || "-"}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
