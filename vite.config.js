import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@thatopen/components-front": path.resolve(__dirname, "node_modules/@thatopen/components-front"),
      three: "three",
    },
  },
});
