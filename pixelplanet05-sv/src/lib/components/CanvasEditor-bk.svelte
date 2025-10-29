<script>
	import { onMount } from "svelte";
	// import * as fabric from "fabric";

	let canvasEl = $state(null);
	let fabricCanvas = $state(null);
	let color = $state("#000000");
	let brushSize = $state(16);
	let tool = $state('pencil');

	let zoom = $state(0);
	let isPanning = $state(false);
	let lastPosX = $state(0);
	let lastPosY = $state(0);

	onMount(() => {
		const script = document.createElement('script');
		script.src = '/fabric.min.js';
		script.onload = () => {
			initializeFabric();
		};
		document.head.appendChild(script);
	});

	const initializeFabric = () => {
		fabricCanvas = new fabric.Canvas(canvasEl, {
			width: 700,
			height: 700,
			backgroundColor: 'transparent',
			isDrawingMode: true,
		});

		fabricCanvas.getContext().imageSmoothingEnabled = false;
		fabricCanvas.getContext().mozImageSmoothingEnabled = false;
		fabricCanvas.getContext().webkitImageSmoothingEnabled = false;
		fabricCanvas.getContext().msImageSmoothingEnabled = false;	
		
		fabricCanvas.freeDrawingBrush = new fabric.PencilBrush(fabricCanvas);
		fabricCanvas.freeDrawingBrush.color = color;
		fabricCanvas.freeDrawingBrush.width = brushSize;

		fabricCanvas.setZoom(0.01)

		// Mouse wheel zoom
		fabricCanvas.on('mouse:wheel', (opt) => {
			const delta = opt.e.deltaY;
			let newZoom = fabricCanvas.getZoom();
			newZoom *= 0.999 ** delta;
			newZoom = Math.max(0.01, Math.min(1, newZoom));

			
			fabricCanvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, newZoom);
			zoom = newZoom;
			opt.e.preventDefault();
			opt.e.stopPropagation();
		});

		// Panning
		fabricCanvas.on('mouse:down', (opt) => {
			if (tool === 'pan') {
				isPanning = true;
				lastPosX = opt.e.clientX;
				lastPosY = opt.e.clientY;
			}
		});

		fabricCanvas.on('mouse:move', (opt) => {
			if (isPanning && tool === 'pan') {
				const vpt = fabricCanvas.viewportTransform;
				vpt[4] += opt.e.clientX - lastPosX;
				vpt[5] += opt.e.clientY - lastPosY;
				fabricCanvas.requestRenderAll();
				lastPosX = opt.e.clientX;
				lastPosY = opt.e.clientY;
			}
		});

		fabricCanvas.on('mouse:up', () => {
			isPanning = false;
		});

	};

	const clearCanvas = () => {
		fabricCanvas.clear();
		fabricCanvas.backgroundColor = 'transparent';
		fabricCanvas.renderAll();
	};

	$effect(() => {
		if (fabricCanvas?.freeDrawingBrush) {
			if (tool === 'pan') {
				fabricCanvas.isDrawingMode = false;
			} else if (tool === 'eraser') {
				fabricCanvas.isDrawingMode = true;
				fabricCanvas.freeDrawingBrush = new fabric.EraserBrush(fabricCanvas);
				fabricCanvas.freeDrawingBrush.width = brushSize;
			} else {
				fabricCanvas.isDrawingMode = true;
				fabricCanvas.freeDrawingBrush = new fabric.PencilBrush(fabricCanvas);
				fabricCanvas.freeDrawingBrush.color = color;
				fabricCanvas.freeDrawingBrush.width = brushSize;
			}
		}
	});

	const zoomIn = () => {
		const newZoom = Math.min(zoom + 0.1, 1); // Max is 1 (100%)
		fabricCanvas.setZoom(newZoom);
		zoom = newZoom;
	};

	const zoomOut = () => {
		const newZoom = Math.max(zoom - 0.1, 0.01); // Min is 0.01 (near 0%)
		fabricCanvas.setZoom(newZoom);
		zoom = newZoom;
	};

	const resetView = () => {
		fabricCanvas.setViewportTransform([0.01, 0, 0, 0.01, 0, 0]);
		zoom = 0.01;
	};


	

</script>

<div class="flex flex-col gap-[1em] p-[1em] bg-gray-100 rounded-[0.8em]">
	<div class="flex gap-[0.8em] flex-wrap items-center">
		
		
		<button
			onclick={clearCanvas}
			class="px-[1em] py-[0.5em] bg-red-500 border-none rounded-[0.5em] cursor-pointer text-white font-[500]"
		>
			Clear All
		</button>

		<button
			onclick={() => (tool = "pencil")}
			class={`px-[1em] py-[0.5em] rounded-[0.5em] font-[500] cursor-pointer border-none transition-colors ${tool === "pencil" ? "bg-blue-500 text-white" : "bg-gray-200 text-black"}`}
		>
			Pencil
		</button>

		<button
			onclick={() => (tool = "eraser")}
			class={`px-[1em] py-[0.5em] rounded-[0.5em] font-[500] cursor-pointer border-none transition-colors ${tool === "eraser" ? "bg-blue-500 text-white" : "bg-gray-200 text-black"}`}
		>
			Eraser
		</button>
		
		<button
			onclick={() => (tool = "pan")}
			class={`px-[1em] py-[0.5em] rounded-[0.5em] font-[500] cursor-pointer border-none transition-colors ${tool === "pan" ? "bg-blue-500 text-white" : "bg-gray-200 text-black"}`}
		>
			Pan
		</button>


		<div class="flex items-center gap-[0.5em]">
			<button onclick={zoomIn} class="px-[0.8em] py-[0.4em] bg-gray-200 rounded cursor-pointer border-none">+</button>
			<span class="text-[0.9em] min-w-[3em]">{Math.round(zoom * 100)}%</span>
			<button onclick={zoomOut} class="px-[0.8em] py-[0.4em] bg-gray-200 rounded cursor-pointer border-none">-</button>
			<button onclick={resetView} class="px-[0.8em] py-[0.4em] bg-gray-200 rounded cursor-pointer border-none text-[0.85em]">Reset</button>
		</div>

		<input
			type="color"
			bind:value={color}
			class="w-[3em] h-[2em] border-[2px] border-gray-300 rounded-[0.5em] cursor-pointer"
		/>

		<div class="flex items-center gap-[0.5em]">
			<label class="text-[0.9em] font-[500]">Size:</label>
			<input
				type="range"
				bind:value={brushSize}
				min="1"
				max="50"
				class="w-[8em]"
			/>
			<span class="text-[0.9em] min-w-[2em]">{brushSize}px</span>
		</div>
	</div>

	<div
		class="border-[2px] border-gray-300 w-fit rounded-[0.5em] overflow-hidden inline-block"
	>
		<canvas 
		style="image-rendering: pixelated; image-rendering: crisp-edges;"
		bind:this={canvasEl}></canvas>
	</div>
</div>
