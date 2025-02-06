class AnimationController {
    constructor() {
        this.animations = new Set();
        this.isRunning = false;
        this.currentTimeouts = [];
    }

    add(animation) {
        this.animations.add(animation);
    }

    remove(animation) {
        this.animations.delete(animation);
    }

    start() {
        this.isRunning = true;
        this.currentTimeouts = [];
    }

    addTimeout(timeout) {
        if (this.isRunning) {
            this.currentTimeouts.push(timeout);
        }
    }

    isActive() {
        return this.isRunning;
    }

    stop() {
        this.isRunning = false;
        this.currentTimeouts.forEach(timeout => {
            clearTimeout(timeout);
        });
        this.currentTimeouts = [];
        this.animations.forEach(animation => {
            if (animation && typeof animation.stop === 'function') {
                animation.stop();
            }
        });
        this.animations.clear();
    }

    // Add new doodle helper methods
    createDoodlePath(startX, startY, endX, endY) {
        const points = [];
        const segments = 5;
        const variance = 3;

        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const x = startX + (endX - startX) * t;
            const y = startY + (endY - startY) * t + (Math.random() - 0.5) * variance;
            points.push([x, y]);
        }

        return points;
    }

    createDoodleStyle() {
        return {
            color: 'white',
            width: Math.random() * 0.5 + 0.5,
            linecap: 'round',
            linejoin: 'round'
        };
    }
}

export default AnimationController;