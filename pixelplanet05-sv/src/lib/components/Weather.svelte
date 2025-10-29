<script>
    let {
        camera = $bindable(),
        canvasSize = $bindable(),
        blockSize = 16,
        enabled = $bindable(true),
    } = $props();

    // Weather type selection
    let weatherType = $state("rain"); // 'rain' or 'snow'

    // Rain configuration
    let rainConfig = $state({
        enabled: true,
        dropCount: 100,
        dropLength: 20,
        dropWidth: 2,
        fallSpeed: 5,
        fallAngle: 10, // degrees from vertical
        opacity: 0.3,
        color: "#a0c4ff",
        spawnRate: 0.3, // probability of spawning new drops per frame
        windVariation: 2, // random horizontal movement
    });

    // Snow configuration
    let snowConfig = $state({
        enabled: true,
        flakeCount: 150,
        flakeSize: { min: 2, max: 6 },
        fallSpeed: 1.5,
        windSpeed: 0.5,
        opacity: 0.8,
        color: "#ffffff",
        spawnRate: 0.2,
        swayAmount: 2, // horizontal sway/drift
        swaySpeed: 0.02, // how fast the sway oscillates
    });

    // Cherry Blossoms configuration
    let cherryBlossomsConfig = $state({
        enabled: true,
        petalCount: 80,
        petalSize: { min: 4, max: 8 },
        fallSpeed: 0.8,
        windSpeed: 1.2,
        opacity: 0.9,
        colors: ["#ffb7c5", "#ffc0cb", "#ff69b4", "#fff0f5"], // Various pink shades
        spawnRate: 0.15,
        swayAmount: 3,
        swaySpeed: 0.03,
        rotationSpeed: 0.05, // How fast petals rotate
        spiralAmount: 1.5, // Creates spiral falling pattern
        floatiness: 0.3, // Random upward movement (like wind catching petal)
    });

    let rainDrops = $state([]);
    let snowFlakes = $state([]);
    let cherryPetals = $state([]);

    class RainDrop {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * (canvasSize.width + 200) - 100;
            this.y = -Math.random() * 100 - rainConfig.dropLength;
            this.speed = rainConfig.fallSpeed * (0.8 + Math.random() * 0.4);
            this.length = rainConfig.dropLength * (0.7 + Math.random() * 0.6);
            this.opacity = rainConfig.opacity * (0.6 + Math.random() * 0.4);
        }

        update() {
            const angleRad = (rainConfig.fallAngle * Math.PI) / 180;
            const wind = (Math.random() - 0.5) * rainConfig.windVariation;

            this.y += this.speed;
            this.x += Math.tan(angleRad) * this.speed + wind;

            if (this.y > canvasSize.height + 100) {
                this.reset();
            }

            if (this.x < -100 || this.x > canvasSize.width + 100) {
                this.reset();
            }
        }
    }

    class SnowFlake {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * (canvasSize.width + 200) - 100;
            this.y = -Math.random() * 100 - 20;
            this.size =
                snowConfig.flakeSize.min +
                Math.random() *
                    (snowConfig.flakeSize.max - snowConfig.flakeSize.min);
            this.speed =
                snowConfig.fallSpeed *
                (0.5 + Math.random() * 0.5) *
                (this.size / snowConfig.flakeSize.max);
            this.opacity = snowConfig.opacity * (0.6 + Math.random() * 0.4);
            this.swayOffset = Math.random() * Math.PI * 2; // Random starting phase for sway
            this.swaySpeed = snowConfig.swaySpeed * (0.8 + Math.random() * 0.4);
        }

        update() {
            this.y += this.speed;

            // Add horizontal wind drift
            this.x += snowConfig.windSpeed * (Math.random() - 0.5);

            // Add sinusoidal sway
            this.swayOffset += this.swaySpeed;
            const sway = Math.sin(this.swayOffset) * snowConfig.swayAmount;
            this.x += sway * 0.1;

            if (this.y > canvasSize.height + 100) {
                this.reset();
            }

            if (this.x < -100 || this.x > canvasSize.width + 100) {
                this.reset();
            }
        }
    }

    class CherryPetal {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * (canvasSize.width + 200) - 100;
            this.y = -Math.random() * 100 - 20;
            this.size =
                cherryBlossomsConfig.petalSize.min +
                Math.random() *
                    (cherryBlossomsConfig.petalSize.max -
                        cherryBlossomsConfig.petalSize.min);
            this.speed =
                cherryBlossomsConfig.fallSpeed * (0.5 + Math.random() * 0.5);
            this.opacity =
                cherryBlossomsConfig.opacity * (0.7 + Math.random() * 0.3);
            this.color =
                cherryBlossomsConfig.colors[
                    Math.floor(
                        Math.random() * cherryBlossomsConfig.colors.length,
                    )
                ];

            // Movement properties
            this.swayOffset = Math.random() * Math.PI * 2;
            this.swaySpeed =
                cherryBlossomsConfig.swaySpeed * (0.8 + Math.random() * 0.4);
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationSpeed =
                cherryBlossomsConfig.rotationSpeed * (Math.random() - 0.5);
            this.spiralPhase = Math.random() * Math.PI * 2;
            this.floatChance = Math.random();
        }

        update() {
            // Vertical movement with occasional upward float
            if (Math.random() < cherryBlossomsConfig.floatiness * 0.01) {
                this.y -= this.speed * 0.5; // Occasional upward movement
            } else {
                this.y += this.speed;
            }

            // Horizontal wind drift
            this.x += cherryBlossomsConfig.windSpeed * (Math.random() - 0.3);

            // Sinusoidal sway
            this.swayOffset += this.swaySpeed;
            const sway =
                Math.sin(this.swayOffset) * cherryBlossomsConfig.swayAmount;
            this.x += sway * 0.1;

            // Spiral motion
            this.spiralPhase += 0.02;
            this.x +=
                Math.cos(this.spiralPhase) *
                cherryBlossomsConfig.spiralAmount *
                0.1;
            this.y += Math.sin(this.spiralPhase) * 0.3;

            // Rotation
            this.rotation += this.rotationSpeed;

            if (this.y > canvasSize.height + 100) {
                this.reset();
            }

            if (this.x < -100 || this.x > canvasSize.width + 100) {
                this.reset();
            }
        }
    }

    function initRainDrops() {
        rainDrops = Array.from(
            { length: rainConfig.dropCount },
            () => new RainDrop(),
        );
    }

    function initSnowFlakes() {
        snowFlakes = Array.from(
            { length: snowConfig.flakeCount },
            () => new SnowFlake(),
        );
    }

    function initCherryPetals() {
        cherryPetals = Array.from(
            { length: cherryBlossomsConfig.petalCount },
            () => new CherryPetal(),
        );
    }

    function updateRain() {
        if (weatherType !== "rain" || !rainConfig.enabled) return;

        rainDrops.forEach((drop) => drop.update());

        if (
            Math.random() < rainConfig.spawnRate &&
            rainDrops.length < rainConfig.dropCount * 1.5
        ) {
            rainDrops.push(new RainDrop());
        }
    }

    function updateSnow() {
        if (weatherType !== "snow" || !snowConfig.enabled) return;

        snowFlakes.forEach((flake) => flake.update());

        if (
            Math.random() < snowConfig.spawnRate &&
            snowFlakes.length < snowConfig.flakeCount * 1.5
        ) {
            snowFlakes.push(new SnowFlake());
        }
    }

    function updateCherryBlossoms() {
        if (weatherType !== "cherryblossoms" || !cherryBlossomsConfig.enabled)
            return;

        cherryPetals.forEach((petal) => petal.update());

        if (
            Math.random() < cherryBlossomsConfig.spawnRate &&
            cherryPetals.length < cherryBlossomsConfig.petalCount * 1.5
        ) {
            cherryPetals.push(new CherryPetal());
        }
    }

    function renderRain(ctx) {
        if (weatherType !== "rain" || !rainConfig.enabled) return;

        const angleRad = (rainConfig.fallAngle * Math.PI) / 180;

        rainDrops.forEach((drop) => {
            ctx.globalAlpha = drop.opacity;
            ctx.strokeStyle = rainConfig.color;
            ctx.lineWidth = rainConfig.dropWidth;

            const endX = drop.x + Math.tan(angleRad) * drop.length;
            const endY = drop.y + drop.length;

            ctx.beginPath();
            ctx.moveTo(drop.x, drop.y);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        });
    }

    export function reinitialize() {
        // Clear existing particles and recreate based on current config
        if (weatherType === 'rain') {
            rainDrops = [];
            initRainDrops();
        } else if (weatherType === 'snow') {
            snowFlakes = [];
            initSnowFlakes();
        } else if (weatherType === 'cherryblossoms') {
            cherryPetals = [];
            initCherryPetals();
        }
    }

    function renderSnow(ctx) {
        if (weatherType !== "snow" || !snowConfig.enabled) return;

        snowFlakes.forEach((flake) => {
            ctx.globalAlpha = flake.opacity;
            ctx.fillStyle = snowConfig.color;

            // Draw snowflake as a circle
            ctx.beginPath();
            ctx.arc(flake.x, flake.y, flake.size / 2, 0, Math.PI * 2);
            ctx.fill();

            // Optional: Add a subtle sparkle effect
            if (flake.size > 4) {
                ctx.globalAlpha = flake.opacity * 0.3;
                ctx.beginPath();
                ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }

    function renderCherryBlossoms(ctx) {
        if (weatherType !== "cherryblossoms" || !cherryBlossomsConfig.enabled)
            return;

        cherryPetals.forEach((petal) => {
            ctx.save();
            ctx.translate(petal.x, petal.y);
            ctx.rotate(petal.rotation);
            ctx.globalAlpha = petal.opacity;

            // Draw petal shape (5-petal flower shape)
            ctx.fillStyle = petal.color;
            ctx.beginPath();

            for (let i = 0; i < 5; i++) {
                const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
                const x = Math.cos(angle) * petal.size;
                const y = Math.sin(angle) * petal.size * 0.6; // Slightly oval

                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }

            ctx.closePath();
            ctx.fill();

            // Add darker center
            ctx.globalAlpha = petal.opacity * 0.5;
            ctx.fillStyle = "#ff1493";
            ctx.beginPath();
            ctx.arc(0, 0, petal.size * 0.2, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        });
    }

    export function render(ctx) {
        if (!enabled) return;

        
        ctx.save();

        if (weatherType === "rain") {
            renderRain(ctx);
        } else if (weatherType === "snow") {
            renderSnow(ctx);
        } else if (weatherType === "cherryblossoms") {
            renderCherryBlossoms(ctx);
        }

        ctx.globalAlpha = 1;
        ctx.restore();
    }

    export function update() {
        if (weatherType === "rain") {
            updateRain();
        } else if (weatherType === "snow") {
            updateSnow();
        } else if (weatherType === "cherryblossoms") {
            updateCherryBlossoms();
        }
    }

    export function getConfig() {
        if (weatherType === "rain") {
            return { ...rainConfig, weatherType };
        } else if (weatherType === "snow") {
            return { ...snowConfig, weatherType };
        } else if (weatherType === "cherryblossoms") {
            return { ...cherryBlossomsConfig, weatherType };
        }
    }

    export function setConfig(newConfig) {
        if (
            newConfig.weatherType !== undefined &&
            newConfig.weatherType !== weatherType
        ) {
            weatherType = newConfig.weatherType;
            if (weatherType === "rain") {
                initRainDrops();
            } else if (weatherType === "snow") {
                initSnowFlakes();
            } else if (weatherType === "cherryblossoms") {
                initCherryPetals();
            }
        }

        if (weatherType === "rain") {
            rainConfig = { ...rainConfig, ...newConfig };
            if (newConfig.dropCount !== undefined) {
                initRainDrops();
            }
        } else if (weatherType === "snow") {
            snowConfig = { ...snowConfig, ...newConfig };
            if (newConfig.flakeCount !== undefined) {
                initSnowFlakes();
            }
        } else if (weatherType === "cherryblossoms") {
            cherryBlossomsConfig = { ...cherryBlossomsConfig, ...newConfig };
            if (newConfig.petalCount !== undefined) {
                initCherryPetals();
            }
        }
    }

    export function getWeatherType() {
        return weatherType;
    }

    $effect(() => {
        if (weatherType === "rain") {
            initRainDrops();
        } else if (weatherType === "snow") {
            initSnowFlakes();
        } else if (weatherType === "cherryblossoms") {
            initCherryPetals();
        }
    });
</script>
