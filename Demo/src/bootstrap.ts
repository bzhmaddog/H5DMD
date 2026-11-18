import { Dmd, DotShape } from 'h5dmd'

/**
 * Shared page bootstrap for every demo: once the DOM is ready, show the library version,
 * check for WebGPU, create and init the Dmd, start rendering, then hand the running Dmd
 * to the page's own `setup` (which adds its layers and builds its controls).
 *
 * @param setup Page-specific setup. May be async; failures are logged.
 */
export function startDemo(setup: (dmd: Dmd, imagesPath: string) => void | Promise<void>) {
    document.addEventListener('DOMContentLoaded', () => {
        const imagesPath = `${import.meta.env.BASE_URL}images`

        // Display the H5DMD library version
        const versionElement = document.getElementById('version_value')
        if (versionElement) {
            versionElement.textContent = Dmd.version
        }

        if (!('gpu' in navigator)) {
            alert('Sorry your browser does not support WEBGPU (or the feature is not enabled)')
            return
        }

        const output = document.getElementById('output') as HTMLCanvasElement
        const dmd = new Dmd(output, {
            dotSize: 2,
            dotSpace: 1,
            dotShape: DotShape.Square,
            backgroundBrightness: 14,
            brightness: 1,
            showFPS: true,
        })

        dmd.init()
            .then(() => {
                dmd.run()
                return setup(dmd, imagesPath)
            })
            .catch(err => console.error('Demo init failed', err))
    })
}
