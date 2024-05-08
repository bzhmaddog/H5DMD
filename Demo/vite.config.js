import {defineConfig} from "vite";
import {tscWatch} from "vite-plugin-tsc-watch";

export default defineConfig({
    base: './',
    plugins: [
        tscWatch(),
    ]
});