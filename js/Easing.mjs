class Easing {

    static easeLinear (t, b, c, d) {
        return c * t / d + b;
    }

	static easeOutQuad (t, b, c, d) {
		return -c * (t /= d) * (t - 2) + b;
	}

    static easeOutSine (t, b, c, d) {
        return c * Math.sin(t / d * (Math.PI / 2)) + b;
    }

    static easeInSine (t, b, c, d) {
        return -c * Math.cos(t / d * (Math.PI / 2)) + c + b;
    }
}

export { Easing };