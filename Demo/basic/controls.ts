import { CanvasLayer, Colors, Dmd, LayerGroup, LayerPosition, TextLayer, VideoLayer } from 'h5dmd'
import { addConstraintMarker, CONSTRAINT_MARKER_ID } from './layers'

// Small DOM helpers (duplicated from Demo/src/controls.ts on purpose - this page is a
// self-contained showcase and not worth wiring into that file's larger tab machinery).
const row = (panel: HTMLElement, ...nodes: (Node | string)[]) => {
    const r = document.createElement('div')
    r.className = 'ctl-row'
    nodes.forEach(n => r.append(n))
    panel.appendChild(r)
    return r
}
const btn = (text: string, onClick: () => void) => {
    const b = document.createElement('button')
    b.textContent = text
    b.addEventListener('click', onClick)
    return b
}
const labelEl = (text: string) => {
    const l = document.createElement('label')
    l.textContent = text
    return l
}
const selectEl = (options: readonly string[], onChange: () => void) => {
    const s = document.createElement('select')
    options.forEach(o => {
        const opt = document.createElement('option')
        opt.value = o
        opt.textContent = o
        s.appendChild(opt)
    })
    s.addEventListener('change', onChange)
    return s
}

/**
 * Build the focused (non-tabbed) control panel for the basic/LayerGroup demo page.
 * Layer groups must already be added to the Dmd (via setupBasicLayers) before calling this.
 *
 * Sections are built in the same order as the quadrants they control appear on the DMD
 * (top-left, top-right, bottom-left, bottom-right) and #basic-controls lays them out as
 * a matching 2x2 CSS grid (see style.scss), each accented with its quadrant's color.
 */
export function buildBasicControlPanel(dmd: Dmd): void {
    const root = document.getElementById('basic-controls') as HTMLDivElement

    const section = (title: string, accentColor: string, note?: string): HTMLElement => {
        const el = document.createElement('section')
        el.className = 'adv-section'
        el.style.borderLeftColor = accentColor
        const h = document.createElement('h3')
        h.textContent = title
        el.appendChild(h)
        if (note) {
            const n = document.createElement('div')
            n.className = 'ctl-note'
            n.textContent = note
            el.appendChild(n)
        }
        root.appendChild(el)
        return el
    }

    // -----------------------------------------------------------------
    // Video panel (top-left, red)
    // -----------------------------------------------------------------
    const videoPanel = dmd.getLayer('video-panel') as LayerGroup
    const clip = videoPanel.getLayer('clip') as VideoLayer

    const videoSection = section(
        'Video panel group',
        Colors.Red,
        'Hiding this group pauses the video (cascaded visibility), not just visually hides it.',
    )

    const videoVis = document.createElement('input')
    videoVis.type = 'checkbox'
    videoVis.checked = videoPanel.isVisible()
    videoVis.addEventListener('change', () => videoPanel.setVisibility(videoVis.checked))
    const videoVisLabel = document.createElement('label')
    videoVisLabel.append(videoVis, ' Panel visible')
    row(videoSection, videoVisLabel)

    row(
        videoSection,
        btn('Play', () => clip.play()),
        btn('Pause', () => clip.pause()),
        labelEl('(direct control of the child, for contrast with the group toggle above)'),
    )

    // -----------------------------------------------------------------
    // HUD (top-right, green)
    // -----------------------------------------------------------------
    const hud = dmd.getLayer('hud') as LayerGroup
    const badge = hud.getLayer('badge') as LayerGroup
    const counter = badge.getLayer('count') as TextLayer

    const hudPanel = section(
        'HUD group',
        Colors.Green,
        'Background/opacity, a group-level renderer, and a nested "badge" subgroup.',
    )

    const hudVis = document.createElement('input')
    hudVis.type = 'checkbox'
    hudVis.checked = hud.isVisible()
    hudVis.addEventListener('change', () => hud.setVisibility(hudVis.checked))
    const hudVisLabel = document.createElement('label')
    hudVisLabel.append(hudVis, ' HUD visible (hiding cascades to label + badge, each restoring its own prior state)')
    row(hudPanel, hudVisLabel)

    const hudOpacityValue = document.createElement('span')
    hudOpacityValue.textContent = hud.opacity.toFixed(2)
    const hudOpacity = document.createElement('input')
    hudOpacity.type = 'range'
    hudOpacity.min = '0'
    hudOpacity.max = '1'
    hudOpacity.step = '0.01'
    hudOpacity.value = String(hud.opacity)
    hudOpacity.addEventListener('input', () => {
        hud.setOpacity(parseFloat(hudOpacity.value))
        hudOpacityValue.textContent = hud.opacity.toFixed(2)
    })
    row(hudPanel, labelEl('Opacity'), hudOpacity, hudOpacityValue)
    row(
        hudPanel,
        btn('Fade out', () =>
            hud.fadeOut(500).then(() => {
                hudOpacityValue.textContent = hud.opacity.toFixed(2)
                hudOpacity.value = String(hud.opacity)
            }),
        ),
        btn('Fade in', () =>
            hud.fadeIn(500).then(() => {
                hudOpacityValue.textContent = hud.opacity.toFixed(2)
                hudOpacity.value = String(hud.opacity)
            }),
        ),
    )

    const bgPicker = document.createElement('input')
    bgPicker.type = 'color'
    bgPicker.value = hud.backgroundColor?.slice(0, 7) ?? '#000000'
    bgPicker.addEventListener('input', () => hud.setBackgroundColor(bgPicker.value))
    const bgOpacity = document.createElement('input')
    bgOpacity.type = 'range'
    bgOpacity.min = '0'
    bgOpacity.max = '1'
    bgOpacity.step = '0.01'
    bgOpacity.value = String(hud.backgroundOpacity)
    bgOpacity.addEventListener('input', () => hud.setBackgroundOpacity(parseFloat(bgOpacity.value)))
    row(hudPanel, labelEl('Background'), bgPicker, labelEl('Opacity'), bgOpacity)

    let shaking = false
    const shakeBtn = btn('Shake!', () => {
        shaking = !shaking
        if (shaking) {
            hud.activateRenderer('shake')
        } else {
            hud.deactivateRenderer('shake')
        }
        shakeBtn.textContent = shaking ? 'Stop shaking' : 'Shake!'
    })
    row(hudPanel, shakeBtn)

    const badgeVis = document.createElement('input')
    badgeVis.type = 'checkbox'
    badgeVis.checked = badge.isVisible()
    badgeVis.addEventListener('change', () => badge.setVisibility(badgeVis.checked))
    const badgeVisLabel = document.createElement('label')
    badgeVisLabel.append(badgeVis, ' Badge subgroup visible')
    row(hudPanel, badgeVisLabel)

    let count = 0
    row(
        hudPanel,
        btn('Badge +1', () => {
            count++
            counter.setText(String(count))
        }),
    )

    // -----------------------------------------------------------------
    // Sandbox (bottom-left, yellow)
    // -----------------------------------------------------------------
    const sandbox = dmd.getLayer('sandbox') as LayerGroup
    const sandboxSection = section('Sandbox group', Colors.Yellow, 'addLayer / removeLayer driven live.')

    const ids: string[] = ['box-1', 'box-2', 'box-3', 'box-4', 'box-5', 'box-6']
    let nextBoxIndex = ids.length + 1
    const countLabel = document.createElement('span')
    const syncCount = () => {
        countLabel.textContent = `${ids.length} box(es): ${ids.join(', ')}`
    }
    syncCount()

    const colors = [Colors.Red, Colors.Blue, Colors.Green, Colors.Yellow, Colors.Orange]

    row(
        sandboxSection,
        btn('Add box', () => {
            const id = `box-${nextBoxIndex++}`
            const color = colors[Math.floor(Math.random() * colors.length)]
            const top = Math.floor(Math.random() * (sandbox.height - 24))
            const left = Math.floor(Math.random() * (sandbox.width - 24))
            sandbox.addLayer(
                CanvasLayer,
                id,
                { width: 24, height: 24, position: { top, left } },
                { loaded: layer => layer.fillColor(color) },
            )
            ids.push(id)
            syncCount()
        }),
        btn('Remove last', () => {
            const id = ids.pop()
            if (id) sandbox.removeLayer(id)
            syncCount()
        }),
    )
    row(sandboxSection, countLabel)

    // -----------------------------------------------------------------
    // Info (bottom-right, blue)
    // -----------------------------------------------------------------
    const info = dmd.getLayer('info') as LayerGroup

    const infoSection = section(
        'Info group',
        Colors.Blue,
        'A minimal group: just dimensioned/positioned with a background and one child.',
    )

    const infoVis = document.createElement('input')
    infoVis.type = 'checkbox'
    infoVis.checked = info.isVisible()
    infoVis.addEventListener('change', () => info.setVisibility(infoVis.checked))
    const infoVisLabel = document.createElement('label')
    infoVisLabel.append(infoVis, ' Visible')
    row(infoSection, infoVisLabel)

    const infoBgOpacity = document.createElement('input')
    infoBgOpacity.type = 'range'
    infoBgOpacity.min = '0'
    infoBgOpacity.max = '1'
    infoBgOpacity.step = '0.01'
    infoBgOpacity.value = String(info.backgroundOpacity)
    infoBgOpacity.addEventListener('input', () => info.setBackgroundOpacity(parseFloat(infoBgOpacity.value)))
    row(infoSection, labelEl('Background opacity'), infoBgOpacity)

    // -----------------------------------------------------------------
    // Constraints playground (the white "marker" layer)
    // -----------------------------------------------------------------
    const constraintSection = section(
        'Constraints',
        Colors.White,
        'Repositions the "marker" layer against the container or any of the four groups. Constraints resolve at addLayer() time, so each change removes and re-adds the layer.',
    )
    constraintSection.style.gridColumn = '1 / -1'

    const H_CONSTRAINTS = [
        'none',
        'leftToLeftOf',
        'leftToRightOf',
        'leftToCenterOf',
        'rightToLeftOf',
        'rightToRightOf',
        'rightToCenterOf',
        'hCenterToLeftOf',
        'hCenterToCenterOf',
        'hCenterToRightOf',
    ] as const
    const V_CONSTRAINTS = [
        'none',
        'topToTopOf',
        'topToBottomOf',
        'topToCenterOf',
        'bottomToTopOf',
        'bottomToBottomOf',
        'bottomToCenterOf',
        'vCenterToTopOf',
        'vCenterToCenterOf',
        'vCenterToBottomOf',
    ] as const
    const TARGETS = ['parent', 'video-panel', 'hud', 'sandbox', 'info'] as const

    // 'none' centers that axis instead - must match the initial marker position in
    // setupBasicLayers (the selects default to 'none'/'none': centered, no constraint).
    const applyConstraints = () => {
        const position: LayerPosition = { hAlign: 'center', vAlign: 'center' }
        if (hConstraint.value !== 'none') {
            position.hAlign = 'constraint'
            position[hConstraint.value as Exclude<(typeof H_CONSTRAINTS)[number], 'none'>] = hTarget.value
        }
        if (vConstraint.value !== 'none') {
            position.vAlign = 'constraint'
            position[vConstraint.value as Exclude<(typeof V_CONSTRAINTS)[number], 'none'>] = vTarget.value
        }
        hTarget.disabled = hConstraint.value === 'none'
        vTarget.disabled = vConstraint.value === 'none'
        dmd.removeLayer(CONSTRAINT_MARKER_ID)
        addConstraintMarker(dmd, position)
    }

    const hConstraint = selectEl(H_CONSTRAINTS, applyConstraints)
    const hTarget = selectEl(TARGETS, applyConstraints)
    const vConstraint = selectEl(V_CONSTRAINTS, applyConstraints)
    const vTarget = selectEl(TARGETS, applyConstraints)
    hTarget.disabled = true
    vTarget.disabled = true

    row(constraintSection, labelEl('Horizontal'), hConstraint, labelEl('of'), hTarget)
    row(constraintSection, labelEl('Vertical'), vConstraint, labelEl('of'), vTarget)
}
