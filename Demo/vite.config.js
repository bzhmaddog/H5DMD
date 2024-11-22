import {defineConfig} from "vite";
import {tscWatch} from "vite-plugin-tsc-watch";
import fs from 'fs';
import path from 'path';

export default defineConfig({
    base: './',
    host: "h5dmd-demo.dev",
    server: {
        https: {
            key: fs.readFileSync('.certs/h5dmd-demo.dev+3-key.pem'),
            cert: fs.readFileSync('.certs/h5dmd-demo.dev+3.pem'),
        },
        host: true,
        watch: {
            depth: 3,
            usePolling: true,
            interval: 100,

        },
    },
    plugins: [
        tscWatch(),
    ]
});