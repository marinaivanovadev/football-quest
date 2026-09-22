import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],

  

    server: {
      proxy: {
        "/api": {
          target: "https://api.football-data.org",
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api/, "/v4"),
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              const token = env.FOOTBALL_DATA_TOKEN;

              if (token) {
                proxyReq.setHeader("X-Auth-Token", token);
              }

              proxyReq.setHeader("Accept", "application/json");
            });
          }
        }
      }
    }
  };
});