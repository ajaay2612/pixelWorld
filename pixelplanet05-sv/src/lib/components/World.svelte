<script>
    import { onMount } from "svelte";
    import { Pointer } from './../stores/Pointer.svelte';
    import { getContext } from 'svelte';
    import { Assets } from '../stores/Assets.svelte'
    import { deserialize } from '$app/forms';


    // world 
    let canvas;
    let ctx;
    let showIsoGrid = $state(true);
    let showGridLines = $state(true);  
    let camera = $state({ x: 0, y: 0, zoom: 1 });
    let worldBlockSize = 16; // pixels per block in world space
    let container; // add this variable
    let canvasSize = $state({ width: 800, height: 600 }); // change to object

    // Add this in onMount or as $effect
    function handleResize() {
        if (container) {
            canvasSize = {
                width: container.clientWidth,
                height: container.clientHeight
            };
        }
    }

    // mouse pos
    let isDragging = false;
    let hoveringBlock = $state(null);

    // grid maker
    const gridSize = 512 * 1000;
    const blockSize = worldBlockSize;
    let blockMap = $state(new Map());
    const isoGapX = 16;
    const isoGapY = 16;

    // pan state
    let isPanning = $state(false);
    let panStart = $state({ x: 0, y: 0, cameraStart: { x: 0, y: 0 } });
    let isSpacePressed = $state(false);


    // Render canvas
    function drawCanvas() {
        if (!ctx) return;
        // isogrid
      

        ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

        ctx.save();
        ctx.translate(-camera.x, -camera.y);
        ctx.scale(camera.zoom, camera.zoom);

        // Calculate visible grid range
        const visibleStartX = Math.floor(camera.x / camera.zoom / blockSize);
        const visibleStartY = Math.floor(camera.y / camera.zoom / blockSize);
        const visibleEndX = Math.ceil((camera.x + canvasSize.width) / camera.zoom / blockSize);
        const visibleEndY = Math.ceil((camera.y + canvasSize.height) / camera.zoom / blockSize);

        // Only draw blocks that exist in blockMap and are visible
        for (const block of blockMap.values()) {
            if (
                block.color !== 'transparent' &&
                block.x >= visibleStartX && block.x < visibleEndX &&
                block.y >= visibleStartY && block.y < visibleEndY
            ) {
                ctx.globalAlpha = block.opacity;
                ctx.fillStyle = block.color;
                ctx.fillRect(block.x * blockSize, block.y * blockSize, blockSize, blockSize);
                ctx.globalAlpha = 1;
            }
        }

        // Draw grid lines (only visible portion)
        if (showGridLines) {
            ctx.strokeStyle = '#e5e5e5';
            ctx.lineWidth = 1 / camera.zoom; // Scale line width with zoom

            for (let i = visibleStartX; i <= visibleEndX; i++) {
                ctx.beginPath();
                ctx.moveTo(i * blockSize, visibleStartY * blockSize);
                ctx.lineTo(i * blockSize, visibleEndY * blockSize);
                ctx.stroke();
            }

            for (let i = visibleStartY; i <= visibleEndY; i++) {
                ctx.beginPath();
                ctx.moveTo(visibleStartX * blockSize, i * blockSize);
                ctx.lineTo(visibleEndX * blockSize, i * blockSize);
                ctx.stroke();
            }
        }

        if (showIsoGrid) {
            const startX = Math.max(-22, visibleStartX - 22);
            const startY = Math.max(-20, visibleStartY - 20);
            const endX = visibleEndX + 32;
            const endY = visibleEndY + 32;

            const size = blockSize;
            const color = "rgba(0,0,0,0.1)";
            const slope = 2;

            for (let y = startY; y < endY; y++) {
                for (let x = startX; x < endX; x++) {
                    if (Math.floor(x / slope + y) % isoGapX === 0) {
                        ctx.fillStyle = color;
                        ctx.fillRect((x - 10) * size, (y - 4) * size, size, size);
                    }

                    if (Math.floor((x - 2) / slope - y + gridSize) % isoGapY === 0) {
                        ctx.fillStyle = color;
                        ctx.fillRect((x - 12) * size, (y - 13) * size, size, size);
                    }
                }
            }
        }

        if (hoveringBlock) {
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.lineWidth = 2 / camera.zoom;
            ctx.strokeRect(
                hoveringBlock.x * blockSize, 
                hoveringBlock.y * blockSize, 
                blockSize, 
                blockSize
            );
        }

        ctx.restore();
    }


    $effect(() => {
        // Only redraw when these specific values change
        camera.x; camera.y; camera.zoom;
        showIsoGrid; showGridLines;
        blockMap;
        canvasSize.width; canvasSize.height;
        
        drawCanvas();
    });


    // handle events
    function getBlockFromMouseEvent(e) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Convert screen → world coordinates
        const worldX = (mouseX + camera.x) / camera.zoom;
        const worldY = (mouseY + camera.y) / camera.zoom;

        const x = Math.floor(worldX / blockSize);
        const y = Math.floor(worldY / blockSize);

        if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
            // Try to get from blockMap, or create a temporary block object
            let block = blockMap.get(`${x},${y}`);
            if (!block) {
                block = { id: `${x}-${y}`, x, y, color: 'transparent', opacity: 1 };
            }
            return { block, x, y };
        }
        return null;
    }

    function handleMouseMove(e) {
        const data = getBlockFromMouseEvent(e);
        if (isPanning) {
            const newX = panStart.cameraStart.x - (e.clientX - panStart.x);
            const newY = panStart.cameraStart.y - (e.clientY - panStart.y);
            
            // Calculate bounds
            const maxX = Math.max(0, gridSize * blockSize * camera.zoom - canvasSize.width);
            const maxY = Math.max(0, gridSize * blockSize * camera.zoom - canvasSize.height);
            
            // Clamp camera position to bounds
            camera.x = Math.max(0, Math.min(maxX, newX));
            camera.y = Math.max(0, Math.min(maxY, newY));
           
            return;
        }

        if (!data || !data.block) {
            hoveringBlock = null;            
            return;
        }

        hoveringBlock = data.block;
    }

    function handleMouseDown(e) {
        // Check for middle button or space+left click
        if (e.button === 1 || (e.button === 0 && isSpacePressed)) {
            isPanning = true;
            panStart = {
                x: e.clientX,
                y: e.clientY,
                cameraStart: { ...camera }
            };
            return;
        }
        
    }
    
	function handleMouseUp() {
        isPanning = false;
        isDragging = false;
    }

    function handleClick(e) {
        const data = getBlockFromMouseEvent(e);
	}

    function handleMouseLeave() {
        hoveringBlock = null;
    }

    function handleWheel(e) {
        e.preventDefault();

        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Zoom in (scroll up) or out (scroll down)
        const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;

        // Compute how many grid blocks are visible horizontally
        const visibleBlocksX = canvasSize.width / (camera.zoom * blockSize);
        const visibleBlocksY = canvasSize.height / (camera.zoom * blockSize);

        // Stop zooming OUT if 100 or more grids fit horizontally or vertically
        if (e.deltaY > 0 && (visibleBlocksX >= 200 || visibleBlocksY >= 200)) {
            return; // stop further zooming out
        }

        // Apply zoom, clamped between min and max
        const minZoomX = canvasSize.width / (gridSize * blockSize);
        const minZoomY = canvasSize.height / (gridSize * blockSize);
        const minZoom = Math.max(minZoomX, minZoomY) * 7;
        const maxZoom = 8;

        const newZoom = Math.max(minZoom, Math.min(maxZoom, camera.zoom * zoomFactor));

        // Adjust camera to zoom toward mouse position
        const worldX = (mouseX + camera.x) / camera.zoom;
        const worldY = (mouseY + camera.y) / camera.zoom;

        camera.x = worldX * newZoom - mouseX;
        camera.y = worldY * newZoom - mouseY;
        camera.zoom = newZoom;

        // Clamp camera bounds
        const maxX = Math.max(0, gridSize * blockSize * newZoom - canvasSize.width);
        const maxY = Math.max(0, gridSize * blockSize * newZoom - canvasSize.height);

        camera.x = Math.max(0, Math.min(maxX, camera.x));
        camera.y = Math.max(0, Math.min(maxY, camera.y));

    }



    onMount(() => {
        ctx = canvas.getContext('2d');
        handleResize(); // Add this
        window.addEventListener('resize', handleResize); // Add this
        // drawCanvas();
        
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    });

    // $inspect(isSpacePressed)

</script>

<svelte:window 
    onmouseup={handleMouseUp}
    onkeydown={(e) => { if (e.code === 'Space') isSpacePressed = true; }}
    onkeyup={(e) => { if (e.code === 'Space') isSpacePressed = false; }}
/>

<div 
bind:this={container}
class="relative  h-screen w-full">

    <!-- svelte-ignore element_invalid_self_closing_tag -->
    <canvas
		bind:this={canvas}
		width={canvasSize.width}
        height={canvasSize.height}
		onmousedown={handleMouseDown}
		onmousemove={handleMouseMove}
		onclick={handleClick}
        onmouseleave={handleMouseLeave}
        onwheel={handleWheel} 
		class="border-[0.125em] border-[#ccc]"
        style="width: {canvasSize.width}px; height: {canvasSize.height}px; cursor: {isPanning ? 'grabbing' : 'crosshair'};"
	/>
    
    <div class="pointer-events-none absolute top-1em  flex justify-center items-center gap-[0.5em] w-full">
        <button
            onclick={() => { showIsoGrid = !showIsoGrid }}
            class="pointer-events-auto shadow-md rounded-[0.5em] py-[0.3em] px-[1em]
            {showIsoGrid ? 'bg-black text-white' : 'bg-[#f8f8f8]'}"
        >
            Iso Grid
        </button>
        <button
            onclick={() => { showGridLines = !showGridLines }}
            class="pointer-events-auto shadow-md rounded-[0.5em] py-[0.3em] px-[1em]
            {showGridLines ? 'bg-black text-white' : 'bg-[#f8f8f8]'}"
        >
            Grid Lines
        </button>
    </div>
    {#if hoveringBlock}
        <div
            class="pointer-events-none left-1em top-1em absolute text-[1em] bg-white/80 rounded-[0.25em] px-[0.5em] py-[0.2em] text-black border border-[#ccc]"
        >
            X: {hoveringBlock.x}, Y: {hoveringBlock.y}
        </div>
    {/if}

</div>