import {fileURLToPath} from "node:url";
import {defineConfig} from "vite";
import {tscWatch} from "vite-plugin-tsc-watch";
import mkcert from "vite-plugin-mkcert";

const resolveEntry = (path) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
    base: '/H5DMD/',
    plugins: [
        tscWatch(),
        mkcert()
    ],
    server: {
        host: '0.0.0.0'
    },
    build: {
        rollupOptions: {
            input: {
                index: resolveEntry('./index.html'),
                simple: resolveEntry('./simple.html'),
                advanced: resolveEntry('./advanced.html'),
                scoreboard: resolveEntry('./scoreboard.html'),
            }
        }
    }
});