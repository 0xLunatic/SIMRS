import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

type LoginForm = {
  username: string;
  password: string;
  remember: boolean;
};

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState<LoginForm>({
    username: "",
    password: "",
    remember: false,
  });
  const [errors, setErrors] = useState<Partial<LoginForm>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [message, setMessage] = useState<{
    type: "ok" | "error";
    text: string;
  } | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // ✅ Ambil username tersimpan jika "remember me"
  useEffect(() => {
    const savedUsername = localStorage.getItem("auth_username");
    if (savedUsername) {
      setForm((prev) => ({
        ...prev,
        username: savedUsername,
        remember: true,
      }));
    }
  }, []);

  const validate = (values: LoginForm) => {
    const e: Partial<LoginForm> = {};
    if (!values.username) e.username = "Username wajib diisi";
    if (!values.password) e.password = "Password wajib diisi";
    return e;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, value, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const v = validate(form);
    setErrors(v);
    if (Object.keys(v).length) return;

    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE_URL}auth/login`, {
        username: form.username,
        password: form.password,
      });

      if (res.data.success) {
        const user = res.data.user;
        const token = res.data.token;

        // ✅ Simpan token & data user
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));

        // ✅ Simpan role user (penting!)
        if (user?.role) {
          localStorage.setItem("auth_role", user.role);
        } else {
          localStorage.removeItem("auth_role");
        }

        // 🚀 Simpan FN_tenaga_kesehatan_id di localStorage jika ada
        if (user.FN_tenaga_kesehatan_id) {
          localStorage.setItem(
            "auth_nakes_id",
            String(user.FN_tenaga_kesehatan_id)
          );
        } else {
          localStorage.removeItem("auth_nakes_id");
        }

        // ✅ Simpan username jika "remember me" dicentang
        if (form.remember) localStorage.setItem("auth_username", form.username);
        else localStorage.removeItem("auth_username");

        // ✅ (Opsional) Simpan juga di sessionStorage
        sessionStorage.setItem("auth_role", user.role ?? "");
        if (user.FN_tenaga_kesehatan_id) {
          sessionStorage.setItem(
            "auth_nakes_id",
            String(user.FN_tenaga_kesehatan_id)
          );
        }

        // 🔥 Animasi transisi ke dashboard
        setTransitioning(true);
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      } else {
        setMessage({ type: "error", text: res.data.message || "Gagal login." });
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        "Gagal login — periksa koneksi atau kredensial.";
      setMessage({ type: "error", text: msg });
      // 📝 Console Log Error
      console.error("❌ Login Gagal. Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 relative overflow-hidden">
      {/* 🧊 ANIMASI TRANSISI DASHBOARD */}
      <AnimatePresence>
        {transitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="absolute inset-0 bg-white flex flex-col items-center justify-center text-gray-800 z-50"
          >
            <motion.img
              src="https://rspkujogja.com/wp-content/uploads/2024/01/Logo-PKU-Jogja.png"
              alt="Logo PKU Jogja"
              className="h-20 mb-6"
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
            />
            <motion.div
              className="text-lg font-semibold"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.6 }}
            >
              Memuat Dashboard...
            </motion.div>
            <motion.div
              className="mt-4 h-1 w-48 bg-gray-200 rounded-full overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.6 }}
            >
              <motion.div
                className="h-full bg-indigo-500"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.3, delay: 1.6 }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 💡 LOGIN CARD */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: transitioning ? 0 : 1, y: transitioning ? -10 : 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-white shadow-xl rounded-2xl p-8 box-border border border-slate-100 relative z-10"
      >
        <header className="mb-6 text-center">
          <img
            src="https://rspkujogja.com/wp-content/uploads/2024/01/Logo-PKU-Jogja.png"
            alt="Logo PKU Jogja"
            className="mx-auto mb-4 h-16 w-auto"
          />
          <h1 className="text-2xl font-semibold text-slate-800">
            Selamat Datang
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Masuk untuk melanjutkan ke SIMRS
          </p>
        </header>

        {message && (
          <div
            className={`mb-4 rounded-md px-4 py-2 text-sm font-medium ${
              message.type === "ok"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-4">
            <label className="block text-left">
              <span className="text-sm font-medium text-slate-700">
                Username
              </span>
              <input
                name="username"
                value={form.username}
                onChange={handleChange}
                type="text"
                placeholder="Masukkan username"
                className={`mt-1 block w-full rounded-xl border px-3 py-2 shadow-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all ${
                  errors.username ? "border-red-300" : "border-slate-200"
                }`}
              />
              {errors.username && (
                <p className="mt-1 text-xs text-red-600">{errors.username}</p>
              )}
            </label>

            <label className="block text-left">
              <span className="text-sm font-medium text-slate-700">
                Password
              </span>
              <div className="mt-1 relative">
                <input
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password"
                  className={`block w-full rounded-xl border px-3 py-2 shadow-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 pr-10 transition-all ${
                    errors.password ? "border-red-300" : "border-slate-200"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-indigo-500 transition-colors focus:outline-none focus:ring-0 active:outline-none border-none"
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4 opacity-80 hover:opacity-100 transition-opacity"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 15.638 7.02 18.75 12 18.75 c1.778 0 3.45-.366 4.96-1.027M3.98 8.223l3.9 3.9m6.22 6.22 l3.92 3.92m-3.92-3.92A10.478 10.478 0 0022.066 12 10.478 10.478 0 0012 5.25c-1.778 0-3.45.366-4.96 1.027 m0 0L3.98 8.223"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4 opacity-80 hover:opacity-100 transition-opacity"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 010-.644C3.423 7.51 7.272 4.5 12 4.5c4.728 0 8.577 3.01 9.964 7.178a1.012 1.012 0 010 .644C20.577 16.49 16.728 19.5 12 19.5 c-4.728 0-8.577-3.01-9.964-7.178z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password}</p>
              )}
            </label>

            <label className="flex items-center space-x-2 text-sm text-slate-600">
              <input
                type="checkbox"
                name="remember"
                checked={form.remember}
                onChange={handleChange}
                className="rounded border-gray-300 accent-indigo-500"
              />
              <span>Ingat saya</span>
            </label>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-white font-semibold shadow hover:bg-indigo-700 disabled:opacity-60 transition-all"
              disabled={loading}
            >
              {loading ? "Memeriksa..." : "Masuk"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
