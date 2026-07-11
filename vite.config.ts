import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

/** Preload só da subseção latina (pt-BR); evita baixar cirílico/latin-ext no critical path. */
function fontPreloadPlugin(): Plugin {
  return {
    name: "font-preload",
    transformIndexHtml: {
      order: "post",
      handler(html, ctx) {
        if (!ctx.bundle) return html;
        const fontFile = Object.keys(ctx.bundle).find(
          (k) => k.includes("geist-latin-wght-normal") && k.endsWith(".woff2"),
        );
        if (!fontFile) return html;
        const tag = `    <link rel="preload" href="/${fontFile}" as="font" type="font/woff2" crossorigin>\n`;
        return html.replace("</head>", `${tag}  </head>`);
      },
    },
  };
}

export default defineConfig({
  plugins: [react(), fontPreloadPlugin()],
  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  build: {
    modulePreload: {
      resolveDependencies(_filename, deps) {
        return deps.filter((dep) => !/\/(Flashcards|HistoricoEstudos|RichTextEditor|editor|charts)-/.test(dep));
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("@tanstack/react-query")) return "query";
          if (id.includes("react-router") || id.includes("react-dom") || id.match(/[/\\]react[/\\]/)) {
            return "vendor";
          }
          // TipTap/Recharts ficam nos chunks das rotas lazy (não forçar chunks globais).
        },
      },
    },
  },
});
