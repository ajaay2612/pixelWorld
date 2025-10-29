<script>
    import { onMount } from "svelte";
    import { Pointer } from '../stores/Pointer.svelte';
    import { getContext } from 'svelte';
    import {Assets} from '../stores/Assets.svelte'
    import { deserialize } from '$app/forms';


    let colorPickerApi = getContext('colorpickerApi');


    export async function exportArt() {

        blocks.forEach(b => {
            if (b.color !== 'transparent' && !Assets.colors.includes(b.color)) {
                Assets.colors.push(b.color);
            }
        });

        const exportdata = {
            gridSize,
            blocks: blocks
                .filter(b => b.color !== 'transparent')
                .map(b => [
                    b.x,
                    b.y,
                    Assets.colors.indexOf(b.color),
                    Math.round(b.opacity * 255) // optional, store opacity as int
                ]) // array instead of string
        };

        Assets.blocks.push(exportdata)

        await saveToServer();
    }
    
    async function saveToServer() {
        try {
            const formData = new FormData();
            formData.append('assets', JSON.stringify(Assets));
            
            const response = await fetch('?/saveAssets', {
                method: 'POST',
                body: formData
            });
            
	        const result = deserialize(await response.text());
            console.log(result)
            if (result.status == 200) {
                console.log('✓ Assets saved successfully!');
            } else {
                console.error('✗ Failed to save:', result.error);
            }
        } catch (error) {
            console.error('✗ Error:', error);
        }
    }


    const { 
        availableGrids, 
        selectedColor = $bindable({ color: '#000000', opacity: 1 })
    } = $props()

    let canvas;
    let ctx;
    let canvasSize = 512; // Fixed canvas size in pixels
    let isAltPressed = $state(false);
    let showIsoGrid = $state(true);
    let showGridLines = $state(true);  


    // grid maker
    let activeGridSize = $state(0)
    let gridSize = $derived(availableGrids?.[activeGridSize] || 16);
    let blockSize = $derived(Math.floor(canvasSize / gridSize));
    let blocks = $state([]);
    let blockMap = $state(new Map());
    
    $effect(() => {
        if (gridSize) {
            selectedRect = null;
        }
    });

    function getBorderSides(block) {
        if (!selectedRect) return null;
        const { x1, x2, y1, y2 } = selectedRect;
        if (block.x < x1 || block.x > x2 || block.y < y1 || block.y > y2) return null;

        return {
            left: block.x === x1,
            right: block.x === x2,
            top: block.y === y1,
            bottom: block.y === y2
        };
    }

    let isoGapX = $state(16);
    let isoGapY = $state(16);
   
    function drawIsoGrid() {
        if (!showIsoGrid || !ctx) return;

        const cols = gridSize;
        const rows = gridSize;
        const size = blockSize;
        const color = "rgba(0,0,0,0.1)";

        ctx.save();

        const slope = 2; // 2 horizontal : 1 vertical  → 26.57°

        for (let y = 0; y < rows + 9; y++) {  // +8 to extend rows
            for (let x = 0; x < cols + isoGapY; x++) {  // extend cols to connect shifted blocks
                // ↘ diagonal (shallower, 2:1)
                if (x < cols && Math.floor(x / slope + y) % isoGapX === 0) {
                    ctx.fillStyle = color;
                    ctx.fillRect(x * size, y * size - 9 * size, size, size);  // -8 grid units up
                }

                // ↙ diagonal (mirrored, shifted)
                if (x - 2 < cols && Math.floor(x / slope - y + cols) % isoGapY === 0) {
                    ctx.save();
                    ctx.translate(x * size, y * size - 9 * size);  // -8 grid units up
                    ctx.fillStyle = color;
                    ctx.fillRect(-2 * size, 0, size, size);  // shifted by 2 grid units
                    ctx.restore();
                }
            }
        }

        ctx.restore();
    }


    function handleChangeGridSize(i) {
        const newGridSize = availableGrids[i];
        const oldGridSize = gridSize;
        const scale = newGridSize / oldGridSize;

        const newBlocks = Array.from({ length: newGridSize * newGridSize }, (_, idx) => {
            const x = idx % newGridSize;
            const y = Math.floor(idx / newGridSize);

            let representative;

            if (scale >= 1) {
                const oldX = Math.floor(x / scale);
                const oldY = Math.floor(y / scale);
                representative = blockMap.get(`${oldX},${oldY}`) || { color: 'transparent', opacity: 1 };
            } else {
                const startX = Math.floor(x / scale);
                const endX = Math.floor((x + 1) / scale);
                const startY = Math.floor(y / scale);
                const endY = Math.floor((y + 1) / scale);

                let found = false;
                outer: for (let oy = startY; oy < endY; oy++) {
                    for (let ox = startX; ox < endX; ox++) {
                        const b = blockMap.get(`${ox},${oy}`);
                        if (b && b.color !== 'transparent') {
                            representative = b;
                            found = true;
                            break outer;
                        }
                    }
                }
                if (!found) representative = { color: 'transparent', opacity: 1 };
            }

            return {
                id: idx,
                x,
                y,
                color: representative.color,
                opacity: representative.opacity
            };
        });

        blocks = newBlocks;
        activeGridSize = i;

		drawCanvas();
    }

    $effect(() => {
        if (blocks.length !== gridSize * gridSize) {
            blocks = Array.from({ length: gridSize * gridSize }, (_, i) => ({
                id: i,
                x: i % gridSize,
                y: Math.floor(i / gridSize),
                color: 'transparent',
                opacity: 1
            }));
        }
    });

    $effect(() => {
        blockMap.clear();
        blocks.forEach(b => {
            blockMap.set(`${b.x},${b.y}`, b);
        });
    });

    // Render canvas
    function drawCanvas() {
        if (!ctx) return;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvasSize, canvasSize);
        
        // Draw blocks
        blocks.forEach(block => {
            const x = block.x * blockSize;
            const y = block.y * blockSize;
            
            if (block.color !== 'transparent') {
                ctx.globalAlpha = block.opacity;
                ctx.fillStyle = block.color;
                ctx.fillRect(x, y, blockSize, blockSize);
                ctx.globalAlpha = 1;
            }
        });
        
        // Draw hover preview
        if (Pointer.shouldUseSelectedColor && hoveringBlock && !isDragging) {
            const x = hoveringBlock.x * blockSize;
            const y = hoveringBlock.y * blockSize;
            ctx.globalAlpha = selectedColor.opacity * 0.5;
            ctx.fillStyle = selectedColor.color;
            ctx.fillRect(x, y, blockSize, blockSize);
            ctx.globalAlpha = 1;
        }
        
        // Draw selection border
        if (selectedRect) {
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            const x = selectedRect.x1 * blockSize;
            const y = selectedRect.y1 * blockSize;
            const w = (selectedRect.x2 - selectedRect.x1 + 1) * blockSize;
            const h = (selectedRect.y2 - selectedRect.y1 + 1) * blockSize;
            ctx.strokeRect(x, y, w, h);
        }
        
        // Draw grid lines
        if (showGridLines) {
            ctx.strokeStyle = '#e5e5e5';
            ctx.lineWidth = 1;
            for (let i = 0; i <= gridSize; i++) {
                ctx.beginPath();
                ctx.moveTo(i * blockSize, 0);
                ctx.lineTo(i * blockSize, canvasSize);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(0, i * blockSize);
                ctx.lineTo(canvasSize, i * blockSize);
                ctx.stroke();
            }
        }
		// Draw moving preview
		if (isMoving && moveSnapshot && (currentMoveOffset.x !== 0 || currentMoveOffset.y !== 0)) {
			moveSnapshot.forEach(s => {
				const newX = s.x + currentMoveOffset.x;
				const newY = s.y + currentMoveOffset.y;
				if (newX >= 0 && newX < gridSize && newY >= 0 && newY < gridSize) {
					const x = newX * blockSize;
					const y = newY * blockSize;
					if (s.color !== 'transparent') {
						ctx.globalAlpha = s.opacity * 0.7;
						ctx.fillStyle = s.color;
						ctx.fillRect(x, y, blockSize, blockSize);
						ctx.globalAlpha = 1;
					}
				}
			});
		}

		// Draw selection border for moving preview
		if (isMoving && selectedRect && (currentMoveOffset.x !== 0 || currentMoveOffset.y !== 0)) {
			ctx.strokeStyle = '#000000';
			ctx.lineWidth = 2;
			ctx.setLineDash([5, 5]); // Dashed line to show it's moving
			const x = (selectedRect.x1 + currentMoveOffset.x) * blockSize;
			const y = (selectedRect.y1 + currentMoveOffset.y) * blockSize;
			const w = (selectedRect.x2 - selectedRect.x1 + 1) * blockSize;
			const h = (selectedRect.y2 - selectedRect.y1 + 1) * blockSize;
			ctx.strokeRect(x, y, w, h);
			ctx.setLineDash([]); // Reset to solid line
		}

        if (isLineMode && lineStart && lineEnd) {
            ctx.globalAlpha = selectedColor.opacity * 0.5;
            ctx.fillStyle = selectedColor.color;

            // Bresenham preview
            const x1 = lineStart[0], y1 = lineStart[1];
            const x2 = lineEnd[0], y2 = lineEnd[1];
            const dx = Math.abs(x2 - x1), dy = Math.abs(y2 - y1);
            const sx = x1 < x2 ? 1 : -1;
            const sy = y1 < y2 ? 1 : -1;
            let err = dx - dy;

            let x = x1, y = y1;
            while (true) {
                ctx.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);
                if (x === x2 && y === y2) break;
                const e2 = 2 * err;
                if (e2 > -dy) { err -= dy; x += sx; }
                if (e2 < dx) { err += dx; y += sy; }
            }

            ctx.globalAlpha = 1;
        }


        // Add this:
        drawIsoGrid();

    }

    $effect(() => {
        drawCanvas();
    });

    // tools
    let isDragging = false;

    // $inspect(Pointer.shouldUseSelectedColor)

    // fill tool
    let isFillMode = $derived(Pointer.current == 0);
    let isEraseMode = $derived(Pointer.current == 1);
    let hoveringBlock = $state(null);
    
    // rect tool
    let isRectMode = $derived(Pointer.current == 2);
    let rectStart = $state(null);
    let rectEnd = $state(null);

    let selectedRect = $state(null);
    let isMoving = $state(false);
    let moveStart = $state(null);
	let moveSnapshot = $state(null);
	let currentMoveOffset = $state({ x: 0, y: 0 });


	// eyedropper tool
	let isEyedropperMode = $derived(Pointer.current == 3);


    // line tool
    let isLineMode = $derived(Pointer.current == 4); // assuming 4 = line tool
    let lineStart = $state(null);
    let lineEnd = $state(null);

    function getBlockFromMouseEvent(e) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const x = Math.floor(mouseX / blockSize);
        const y = Math.floor(mouseY / blockSize);
        
        if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
            return blockMap.get(`${x},${y}`);
        }
        return null;
    }

    function handleMouseMove(e) {
        const block = getBlockFromMouseEvent(e);
        
        if (!block) {
            hoveringBlock = null;
            return;
        }
        
        if (!isDragging) {
            if (Pointer.shouldUseSelectedColor) {
                hoveringBlock = block;
                drawCanvas();
                return;
            }
        }

        if (isDragging && isMoving && selectedRect && moveStart) {
			const rawDeltaX = block.x - moveStart[0];
			const rawDeltaY = block.y - moveStart[1];
			const deltaX = Math.round(rawDeltaX);
			const deltaY = Math.round(rawDeltaY);

			if (deltaX === 0 && deltaY === 0) return;

			const maxLeft = -selectedRect.x1;
			const maxRight = gridSize - 1 - selectedRect.x2;
			const maxTop = -selectedRect.y1;
			const maxBottom = gridSize - 1 - selectedRect.y2;

			const clampedDeltaX = Math.max(maxLeft, Math.min(deltaX, maxRight));
			const clampedDeltaY = Math.max(maxTop, Math.min(deltaY, maxBottom));

			currentMoveOffset = { x: clampedDeltaX, y: clampedDeltaY };
			drawCanvas();
		} else if (isDragging && !isMoving) {
            if (isFillMode || isEraseMode) {
                block.color = selectedColor.color;
                block.opacity = selectedColor.opacity;
                drawCanvas();
            } else if (isRectMode && rectStart) {
                rectEnd = [block.x, block.y];

                const x1 = Math.min(rectStart[0], rectEnd[0]);
                const x2 = Math.max(rectStart[0], rectEnd[0]);
                const y1 = Math.min(rectStart[1], rectEnd[1]);
                const y2 = Math.max(rectStart[1], rectEnd[1]);
                selectedRect = { x1, x2, y1, y2 };
                
                drawCanvas();
            }
        }


        if (isDragging && isLineMode && lineStart) {
            lineEnd = [block.x, block.y];
            drawCanvas();
        }
    }

    function handleMouseDown(e) {
        const block = getBlockFromMouseEvent(e);
        if (!block) return;
        
        isDragging = true;

        if (isRectMode) {
			if (selectedRect && block.x >= selectedRect.x1 && block.x <= selectedRect.x2 && block.y >= selectedRect.y1 && block.y <= selectedRect.y2) {
				isMoving = true;
				moveStart = [block.x, block.y];
				
				// Take snapshot of selected area
				moveSnapshot = [];
				for (let y = selectedRect.y1; y <= selectedRect.y2; y++) {
					for (let x = selectedRect.x1; x <= selectedRect.x2; x++) {
						const b = blockMap.get(`${x},${y}`);
						if (b) {
							moveSnapshot.push({
								x: b.x,
								y: b.y,
								color: b.color,
								opacity: b.opacity
							});
						}
					}
				}
			} else {
				rectStart = [block.x, block.y];
				rectEnd = [block.x, block.y];
				selectedRect = null;
			}
		}
        
        if (isLineMode) {
            const block = getBlockFromMouseEvent(e);
            if (!block) return;
            lineStart = [block.x, block.y];
            lineEnd = [block.x, block.y];
        }
    }
    
	function handleMouseUp() {
		if (isMoving && moveSnapshot && (currentMoveOffset.x !== 0 || currentMoveOffset.y !== 0)) {
			// Create a copy to modify
			const newBlocks = blocks.map(b => ({ ...b }));
			const newBlockMap = new Map();
			newBlocks.forEach(b => {
				newBlockMap.set(`${b.x},${b.y}`, b);
			});

			// If Alt is NOT pressed = move (clear originals)
			if (!isAltPressed) {
				for (let i = 0; i < moveSnapshot.length; i++) {
					const s = moveSnapshot[i];
					const original = newBlockMap.get(`${s.x},${s.y}`);
					if (original) {
						original.color = 'transparent';
						original.opacity = 1;
					}
				}
			}

			// Apply to new positions (for both move and copy)
			for (let i = 0; i < moveSnapshot.length; i++) {
				const s = moveSnapshot[i];
				const newX = s.x + currentMoveOffset.x;
				const newY = s.y + currentMoveOffset.y;
				if (newX >= 0 && newX < gridSize && newY >= 0 && newY < gridSize) {
					const target = newBlockMap.get(`${newX},${newY}`);
					if (target) {
						target.color = s.color;
						target.opacity = s.opacity;
					}
				}
			}

			// Single update
			blocks = newBlocks;

			// Update selectedRect position
			selectedRect.x1 += currentMoveOffset.x;
			selectedRect.x2 += currentMoveOffset.x;
			selectedRect.y1 += currentMoveOffset.y;
			selectedRect.y2 += currentMoveOffset.y;
		}

		isDragging = false;
		isMoving = false;
		moveSnapshot = null;
		currentMoveOffset = { x: 0, y: 0 };

		if (isRectMode && rectStart && rectEnd) {
			rectStart = null;
			rectEnd = null;
		}
		
        if (isLineMode && lineStart && lineEnd) {
            // Bresenham's line algorithm or simple step interpolation
            const x1 = lineStart[0], y1 = lineStart[1];
            const x2 = lineEnd[0], y2 = lineEnd[1];

            const dx = Math.abs(x2 - x1), dy = Math.abs(y2 - y1);
            const sx = x1 < x2 ? 1 : -1;
            const sy = y1 < y2 ? 1 : -1;
            let err = dx - dy;

            let x = x1, y = y1;
            while (true) {
                const b = blockMap.get(`${x},${y}`);
                if (b) {
                    b.color = selectedColor.color;
                    b.opacity = selectedColor.opacity;
                }
                if (x === x2 && y === y2) break;
                const e2 = 2 * err;
                if (e2 > -dy) { err -= dy; x += sx; }
                if (e2 < dx) { err += dx; y += sy; }
            }

            lineStart = null;
            lineEnd = null;
            drawCanvas();
        }

		drawCanvas();
	}

    function handleClick(e) {
		const block = getBlockFromMouseEvent(e);
		if (!block) return;
		
		if (isEyedropperMode) {
            console.log(block.color);
			// Pick color from block
			if (block.color !== 'transparent') {
                colorPickerApi.setColor?.(block.color, block.opacity);
			}
            Pointer.current = 0
		}  else if (Pointer.shouldUseSelectedColor && !isRectMode && !isLineMode) {
			block.color = selectedColor.color;
			block.opacity = selectedColor.opacity;
			drawCanvas();
		}
	}

    function handleMouseLeave() {
        hoveringBlock = null;
        drawCanvas();
    }

    $effect(() => {
        if (!isRectMode) {
            selectedRect = null;
            drawCanvas();
        }
    });

    onMount(() => {
        ctx = canvas.getContext('2d');
        drawCanvas();
    });

    // color map exporter
    let colorMaps = $derived.by(() => {
        return blocks
            .map(block => ({
                x: block.x,
                y: block.y,
                color: block.color,
                opacity: block.opacity
            }));
    });

	// $inspect(colorMaps)
</script>

<svelte:window 
    onmouseup={handleMouseUp}
    onkeydown={(e) => { if (e.key === 'Alt') isAltPressed = true; }}
    onkeyup={(e) => { if (e.key === 'Alt') isAltPressed = false; }}
/>

<div class="">

    <!-- svelte-ignore element_invalid_self_closing_tag -->
    <canvas
		bind:this={canvas}
		width={canvasSize}
		height={canvasSize}
		onmousedown={handleMouseDown}
		onmousemove={handleMouseMove}
		onclick={handleClick}
        onmouseleave={handleMouseLeave}
		oncontextmenu={(e) => e.preventDefault()}
		class="border-[0.125em] border-[#ccc]"
		style="width: {canvasSize}px; height: {canvasSize}px; cursor: {isEyedropperMode ? 'crosshair' : 'crosshair'};"
	/>
    
    <div class="mt-[1em] flex justify-center items-center gap-[0.5em] w-full">
        {#each availableGrids as grid, i}
            <button
                onclick={() => handleChangeGridSize(i)}
                class="shadow-md rounded-[0.5em] py-[0.3em] w-[3em]
                {activeGridSize === i ? 'bg-black text-white' : 'bg-[#f8f8f8]'}"
            >
                {grid}
            </button>
        {/each}
        <button
            onclick={() => { showIsoGrid = !showIsoGrid; drawCanvas(); }}
            class="shadow-md rounded-[0.5em] py-[0.3em] px-[1em]
            {showIsoGrid ? 'bg-black text-white' : 'bg-[#f8f8f8]'}"
        >
            Iso Grid
        </button>
        <button
            onclick={() => { showGridLines = !showGridLines; drawCanvas(); }}
            class="shadow-md rounded-[0.5em] py-[0.3em] px-[1em]
            {showGridLines ? 'bg-black text-white' : 'bg-[#f8f8f8]'}"
        >
            Grid Lines
        </button>
    </div>

</div>