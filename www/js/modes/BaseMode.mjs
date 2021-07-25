import { Mode } from "./Mode.mjs";


class BaseMode extends Mode{

    constructor(_dmd, _resources, _fonts, _variables, _audioManager) {
        super(_dmd, _resources, _fonts, _variables, _audioManager);

        this.name = 'base';
    }

    start(priority) {
        super.start(priority);
    }

    stop() {
        super.stop();
    }
}

export { BaseMode };