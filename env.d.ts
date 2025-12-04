// env.d.ts
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  // tambahkan variabel lain kalau perlu
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
