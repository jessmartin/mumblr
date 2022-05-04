import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill"
import { defineConfig } from "vite"


export default defineConfig({
  define: {
    global: "globalThis",
  },
  plugins: [
  ],
  optimizeDeps: {
    esbuildOptions: {
      plugins: [
        NodeGlobalsPolyfillPlugin({
          buffer: true,
        }),
      ],
    },
  }
})
