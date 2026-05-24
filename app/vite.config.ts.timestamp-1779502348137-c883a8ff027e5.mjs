// vite.config.ts
import { defineConfig } from "file:///sessions/keen-vibrant-noether/mnt/Repetitor/app/node_modules/vite/dist/node/index.js";
import react from "file:///sessions/keen-vibrant-noether/mnt/Repetitor/app/node_modules/@vitejs/plugin-react/dist/index.js";
import { VitePWA } from "file:///sessions/keen-vibrant-noether/mnt/Repetitor/app/node_modules/vite-plugin-pwa/dist/index.js";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg", "apple-touch-icon.png"],
      manifest: false,
      // уже есть свой manifest.webmanifest в public/
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\./,
            handler: "CacheFirst",
            options: { cacheName: "fonts", expiration: { maxEntries: 10 } }
          }
        ]
      }
    })
  ],
  base: "./",
  server: {
    host: true,
    port: 5173
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvc2Vzc2lvbnMva2Vlbi12aWJyYW50LW5vZXRoZXIvbW50L1JlcGV0aXRvci9hcHBcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9zZXNzaW9ucy9rZWVuLXZpYnJhbnQtbm9ldGhlci9tbnQvUmVwZXRpdG9yL2FwcC92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vc2Vzc2lvbnMva2Vlbi12aWJyYW50LW5vZXRoZXIvbW50L1JlcGV0aXRvci9hcHAvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xuaW1wb3J0IHsgVml0ZVBXQSB9IGZyb20gXCJ2aXRlLXBsdWdpbi1wd2FcIjtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW1xuICAgIHJlYWN0KCksXG4gICAgVml0ZVBXQSh7XG4gICAgICByZWdpc3RlclR5cGU6IFwiYXV0b1VwZGF0ZVwiLFxuICAgICAgaW5jbHVkZUFzc2V0czogW1wiaWNvbi5zdmdcIiwgXCJhcHBsZS10b3VjaC1pY29uLnBuZ1wiXSxcbiAgICAgIG1hbmlmZXN0OiBmYWxzZSwgLy8gXHUwNDQzXHUwNDM2XHUwNDM1IFx1MDQzNVx1MDQ0MVx1MDQ0Mlx1MDQ0QyBcdTA0NDFcdTA0MzJcdTA0M0VcdTA0MzkgbWFuaWZlc3Qud2VibWFuaWZlc3QgXHUwNDMyIHB1YmxpYy9cbiAgICAgIHdvcmtib3g6IHtcbiAgICAgICAgZ2xvYlBhdHRlcm5zOiBbXCIqKi8qLntqcyxjc3MsaHRtbCxzdmcscG5nLGljbyx3b2ZmMn1cIl0sXG4gICAgICAgIHJ1bnRpbWVDYWNoaW5nOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgdXJsUGF0dGVybjogL15odHRwczpcXC9cXC9mb250c1xcLi8sXG4gICAgICAgICAgICBoYW5kbGVyOiBcIkNhY2hlRmlyc3RcIixcbiAgICAgICAgICAgIG9wdGlvbnM6IHsgY2FjaGVOYW1lOiBcImZvbnRzXCIsIGV4cGlyYXRpb246IHsgbWF4RW50cmllczogMTAgfSB9XG4gICAgICAgICAgfVxuICAgICAgICBdXG4gICAgICB9XG4gICAgfSlcbiAgXSxcbiAgYmFzZTogXCIuL1wiLFxuICBzZXJ2ZXI6IHtcbiAgICBob3N0OiB0cnVlLFxuICAgIHBvcnQ6IDUxNzNcbiAgfVxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQWtVLFNBQVMsb0JBQW9CO0FBQy9WLE9BQU8sV0FBVztBQUNsQixTQUFTLGVBQWU7QUFFeEIsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ04sUUFBUTtBQUFBLE1BQ04sY0FBYztBQUFBLE1BQ2QsZUFBZSxDQUFDLFlBQVksc0JBQXNCO0FBQUEsTUFDbEQsVUFBVTtBQUFBO0FBQUEsTUFDVixTQUFTO0FBQUEsUUFDUCxjQUFjLENBQUMsc0NBQXNDO0FBQUEsUUFDckQsZ0JBQWdCO0FBQUEsVUFDZDtBQUFBLFlBQ0UsWUFBWTtBQUFBLFlBQ1osU0FBUztBQUFBLFlBQ1QsU0FBUyxFQUFFLFdBQVcsU0FBUyxZQUFZLEVBQUUsWUFBWSxHQUFHLEVBQUU7QUFBQSxVQUNoRTtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFDRixDQUFDO0FBQUEsRUFDSDtBQUFBLEVBQ0EsTUFBTTtBQUFBLEVBQ04sUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLEVBQ1I7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
