import {defineConfig} from "vite";
import {tscWatch} from "vite-plugin-tsc-watch";
import fs from 'fs';

export default defineConfig({
    base: './',
    host: "h5dmd-demo.dev",
    watch: {
        includes: [
            'node_modules/h5dmd/dist/**',
            'src/**'
        ],
    },
    server: {
        https: {
            key: fs.readFileSync('.certs/h5dmd-demo.dev+3-key.pem'),
            cert: fs.readFileSync('.certs/h5dmd-demo.dev+3.pem'),
        },
        host: true,
    },
    plugins: [
        tscWatch(),
        {
            name: 'force-full-rebuild',
            handleHotUpdate({ server }) {
                server.ws.send({
                    type: 'full-reload',
                });
            },
        }
    ]
});