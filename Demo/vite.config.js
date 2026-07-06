import {defineConfig} from "vite";
import {tscWatch} from "vite-plugin-tsc-watch";
import mkcert from "vite-plugin-mkcert";

export default defineConfig({
    base: '/H5DMD/',
    plugins: [
        tscWatch(),
        mkcert()
    ],
    server: {
        host: '0.0.0.0'
    }
});