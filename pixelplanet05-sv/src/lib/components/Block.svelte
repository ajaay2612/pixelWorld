<script>
    import { onMount } from "svelte";
    import { Assets } from '$lib/stores/Assets.svelte.js';

    export let asset;
    const { width, height, colors, pixels } = asset;

    let canvas;
    let ctx;

    function drawCanvas(canvasSize) {
        if (!ctx) return;

        const maxDimension = Math.max(width, height);
        let blockSize = canvasSize / maxDimension;
        
        // For very large assets, use a different rendering approach
        if (blockSize < 1) {
            // Create an offscreen canvas at actual asset size
            const offscreen = document.createElement('canvas');
            offscreen.width = width;
            offscreen.height = height;
            const offCtx = offscreen.getContext('2d');
            
            // Draw each pixel as 1x1 on offscreen canvas
            pixels.forEach(pixel => {
                const [cx, cy, colorIndex, opacityInt] = pixel;
                const color = colors[colorIndex];
                const opacity = opacityInt / 255;
                
                if (color) {
                    offCtx.globalAlpha = opacity;
                    offCtx.fillStyle = color;
                    offCtx.fillRect(parseInt(cx), parseInt(cy), 1, 1);
                }
            });
            
            // Scale and center the offscreen canvas
            const scale = Math.min(canvasSize / width, canvasSize / height);
            const scaledWidth = width * scale;
            const scaledHeight = height * scale;
            const offsetX = (canvasSize - scaledWidth) / 2;
            const offsetY = (canvasSize - scaledHeight) / 2;
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.imageSmoothingEnabled = false; // Keep pixels sharp
            ctx.drawImage(offscreen, offsetX, offsetY, scaledWidth, scaledHeight);
        } else {
            // Original approach for smaller assets
            blockSize = Math.floor(blockSize);
            const offsetX = Math.floor((canvasSize - width * blockSize) / 2);
            const offsetY = Math.floor((canvasSize - height * blockSize) / 2);

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            pixels.forEach(pixel => {
                const [cx, cy, colorIndex, opacityInt] = pixel;
                const x = parseInt(cx) * blockSize + offsetX;
                const y = parseInt(cy) * blockSize + offsetY;
                const color = colors[colorIndex];
                const opacity = opacityInt / 255;

                if (color) {
                    ctx.globalAlpha = opacity;
                    ctx.fillStyle = color;
                    ctx.fillRect(x, y, blockSize, blockSize);
                }
            });
        }

        ctx.globalAlpha = 1;
    }

    function resizeCanvas() {
        const rect = canvas.parentElement.getBoundingClientRect();
        const size = Math.min(rect.width, rect.height);
        canvas.width = size * devicePixelRatio;
        canvas.height = size * devicePixelRatio;
        canvas.style.width = `${size}px`;
        canvas.style.height = `${size}px`;
        
        // Reset transform before scaling
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(devicePixelRatio, devicePixelRatio);
        
        drawCanvas(size);
    }
    onMount(() => {
        ctx = canvas.getContext("2d");
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);
        return () => window.removeEventListener("resize", resizeCanvas);
    });
</script>

<canvas bind:this={canvas} class="" />
