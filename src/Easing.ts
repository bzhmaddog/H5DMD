class Easing {

    static easeLinear (t: number, b: number, c: number, d: number) {
        return c * t / d + b;
    }

	static easeOutQuad (t: number, b: number, c: number, d: number) {
		return -c * (t /= d) * (t - 2) + b;
	}

    static easeOutSine (t: number, b: number, c: number, d: number) {
        return c * Math.sin(t / d * (Math.PI / 2)) + b;
    }

    static easeInSine (t: number, b: number, c: number, d: number) {
        return -c * Math.cos(t / d * (Math.PI / 2)) + c + b;
    }
}

export { Easing };