import {Colors, Dmd, LayerGroup, TextLayer} from "h5dmd";

// Small DOM helpers (duplicated from Demo/src/controls.ts on purpose - this page is a
// self-contained showcase and not worth wiring into that file's larger tab machinery).
const row = (panel: HTMLElement, ...nodes: (Node | string)[]) => {
    const r = document.createElement('div');
    r.className = 'ctl-row';
    nodes.forEach(n => r.append(n));
    panel.appendChild(r);
    return r;
};
const btn = (text: string, onClick: () => void) => {
    const b = document.createElement('button');
    b.textContent = text;
    b.addEventListener('click', onClick);
    return b;
};

/** Activate the layer's 'shake' renderer (registered inactive) for 200ms, then deactivate it. */
const shakeFor200ms = (layer: TextLayer) => {
    layer.activateRenderer('shake');
    setTimeout(() => layer.deactivateRenderer('shake'), 200);
};

/**
 * Build the focused control panel for the pinball scoreboard demo page. Each section
 * controls one compound LayerGroup (score / player / ball) - each made of several
 * TextLayers that move/show/hide together as a single unit.
 */
export function buildScoreboardControlPanel(dmd: Dmd): void {

    const root = document.getElementById('scoreboard-controls') as HTMLDivElement;

    const section = (title: string, accentColor: string, group: LayerGroup, note?: string): HTMLElement => {
        const el = document.createElement('section');
        el.className = 'adv-section';
        el.style.borderLeftColor = accentColor;
        // Hovering a panel highlights the DMD region it controls.
        el.addEventListener('mouseenter', () => {
            group.setBorderColor(accentColor);
            group.setBorderWidth(1);
        });
        el.addEventListener('mouseleave', () => {
            group.setBorderWidth(0);
        });
        const h = document.createElement('h3');
        h.textContent = title;
        el.appendChild(h);
        if (note) {
            const n = document.createElement('div');
            n.className = 'ctl-note';
            n.textContent = note;
            el.appendChild(n);
        }
        root.appendChild(el);
        return el;
    };

    // -----------------------------------------------------------------
    // Score
    // -----------------------------------------------------------------
    const score = dmd.getLayer('score') as LayerGroup;
    const scoreValue = score.getLayer('value') as TextLayer;

    const scoreSection = section('Score group', Colors.Blue, score, 'One compound element (outlined score digits) shown/hidden/faded as a single unit.');

    // Start from whatever the layer is actually displaying, rather than a second hardcoded
    // number that can drift out of sync with scoreboard-layers.ts's initial text. Strip any
    // thousand separators first, in case the initial text is ever formatted too.
    let points = parseInt(scoreValue.text.replace(/[,.]/g, ''), 10) || 0;
    // en-US grouping (thousands), but with '.' instead of ',' - commas render oddly in the
    // Dusty font.
    const syncScore = () => scoreValue.setText(points.toLocaleString('en-US').replace(/,/g, '.'));

    const scoreIncrements = [5, 10, 50, 100, 250, 500, 1000, 1_000_000];
    const formatIncrement = (n: number) => n >= 1_000_000 ? `+${n / 1_000_000}M` : `+${n}`;

    row(scoreSection,
        ...scoreIncrements.map(inc => btn(formatIncrement(inc), () => { points += inc; syncScore(); })),
        btn('Reset', () => { points = 0; syncScore(); }),
    );

    // Random step in [500, 1000000], restricted to multiples of 5 so the score's last digit
    // (which starts at 0, a multiple of 5) always stays 0 or 5.
    const randomStep = () => {
        const steps = Math.floor((1000000 - 500) / 5) + 1;
        return 500 + 5 * Math.floor(Math.random() * steps);
    };

    // Random delay in [300, 1500]ms - re-picked after every tick via setTimeout, since
    // setInterval would only ever support a single fixed delay.
    const randomDelay = () => 300 + Math.floor(Math.random() * (1500 - 300 + 1));

    let autoIncreaseTimer: ReturnType<typeof setTimeout> | undefined;
    const scheduleNextIncrease = () => {
        autoIncreaseTimer = setTimeout(() => {
            points += randomStep();
            syncScore();
            scheduleNextIncrease();
        }, randomDelay());
    };

    const autoBtn = btn('Start auto-increase', () => {
        if (autoIncreaseTimer) {
            clearTimeout(autoIncreaseTimer);
            autoIncreaseTimer = undefined;
            autoBtn.textContent = 'Start auto-increase';
        } else {
            scheduleNextIncrease();
            autoBtn.textContent = 'Stop auto-increase';
        }
    });
    row(scoreSection, autoBtn);

    const scoreVis = document.createElement('input');
    scoreVis.type = 'checkbox';
    scoreVis.checked = score.isVisible();
    scoreVis.addEventListener('change', () => score.setVisibility(scoreVis.checked));
    const scoreVisLabel = document.createElement('label');
    scoreVisLabel.append(scoreVis, ' Visible');
    row(scoreSection, scoreVisLabel);

    row(scoreSection,
        btn('Fade out', () => score.fadeOut(400)),
        btn('Fade in', () => score.fadeIn(400)),
    );

    // -----------------------------------------------------------------
    // Player
    // -----------------------------------------------------------------
    const player = dmd.getLayer('player') as LayerGroup;
    const playerNumber = player.getLayer('number') as TextLayer;

    const playerSection = section('Player group', Colors.Green, player, '"P" label + player number - two TextLayers moved/shown/hidden together.');

    let playerIndex = 1;
    row(playerSection, btn('Next player', () => {
        playerIndex = playerIndex >= 4 ? 1 : playerIndex + 1;
        playerNumber.setText(String(playerIndex));
        shakeFor200ms(playerNumber);
    }));

    const playerVis = document.createElement('input');
    playerVis.type = 'checkbox';
    playerVis.checked = player.isVisible();
    playerVis.addEventListener('change', () => player.setVisibility(playerVis.checked));
    const playerVisLabel = document.createElement('label');
    playerVisLabel.append(playerVis, ' Visible');
    row(playerSection, playerVisLabel);

    // -----------------------------------------------------------------
    // Ball
    // -----------------------------------------------------------------
    const ball = dmd.getLayer('ball') as LayerGroup;
    const ballNumber = ball.getLayer('number') as TextLayer;

    const ballSection = section('Ball group', Colors.Yellow, ball, '"BALL" label + ball number - two TextLayers moved/shown/hidden together.');

    let ballIndex = 1;
    row(ballSection, btn('Next ball', () => {
        ballIndex = ballIndex >= 3 ? 1 : ballIndex + 1;
        ballNumber.setText(String(ballIndex));
        shakeFor200ms(ballNumber);
    }));

    const ballVis = document.createElement('input');
    ballVis.type = 'checkbox';
    ballVis.checked = ball.isVisible();
    ballVis.addEventListener('change', () => ball.setVisibility(ballVis.checked));
    const ballVisLabel = document.createElement('label');
    ballVisLabel.append(ballVis, ' Visible');
    row(ballSection, ballVisLabel);
}
