<script>
    import { Pointer } from '../stores/Pointer.svelte';
    import { getContext } from 'svelte';
    import * as SelectedColor from "$lib/stores/SelectedColor.svelte"
    
    export function setColorpickerColor(setcolor, setopacity) {
        if (!setcolor || !setopacity ) return;

        // Convert hex to HSL
        const [h, s, l] = hexToHsl(setcolor);
        hue = h;
        saturation = s;
        lightness = l;

        // Update opacity
        if (setopacity != null) {
            opacity = setopacity;
        }

        // Update picker coordinates (HSL → HSV → pickerX/Y)
        const [_, sV, v] = hslToHsv(h, s, l);
        pickerX = sV;
        pickerY = 100 - v;
    }



    // === COLOR STATE ===
    let hue = $state(0);         // 0–360 (horizontal hue slider elsewhere)
    let saturation = $state(100);
    let lightness = $state(50);
    let opacity = $state(1); // 1 = fully opaque

    let hex = $derived.by(() => {
        const h = hue / 360;
        const s = saturation / 100;
        const l = lightness / 100;

        const a = s * Math.min(l, 1 - l);
        const f = n => {
            const k = (n + h * 12) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color).toString(16).padStart(2, '0');
        };

        return `#${f(0)}${f(8)}${f(4)}`;
    });

    let pickerElement;
    let pickerX = $state(100);
    let pickerY = $state(0);

    let isDragging = $state(false);


    // === HELPER: HSV → HSL CONVERSION ===
    function hsvToHsl(h, s, v) {
        s /= 100;
        v /= 100;
        const l = v * (1 - s / 2);
        const sl = l === 0 || l === 1 ? 0 : (v - l) / Math.min(l, 1 - l);
        return [h, sl * 100, l * 100];
    }

    function hslToHsv(h, s, l) {
        s /= 100;
        l /= 100;
        const v = l + s * Math.min(l, 1 - l);
        const sv = v === 0 ? 0 : 2 * (1 - l / v);
        return [h, sv * 100, v * 100]; // returns H, S, V
    }

    // === MOUSE HANDLERS ===
    function handlePickerMove(event) {
        const rect = pickerElement.getBoundingClientRect();
        let x = Math.min(Math.max(0, event.clientX - rect.left), rect.width);
        let y = Math.min(Math.max(0, event.clientY - rect.top), rect.height);

        pickerX = (x / rect.width) * 100;
        pickerY = (y / rect.height) * 100;

        // Convert from picker coords → HSV → HSL
        const s = pickerX;
        const v = 100 - pickerY;
        const [h_, s_, l_] = hsvToHsl(hue, s, v);

        saturation = s_;
        lightness = l_;
    }

    function handleMouseDown(e) {
        isDragging = true;
        handlePickerMove(e);
    }
    
    function handleMouseMove(e) {
        if (isDragging) {
            handlePickerMove(e);
        }
    }
    
    function handleMouseUp() {
        isDragging = false;
    }


    // color pallete
    let colorSlots = $state([
        { color: '#ff4d4d', opacity: 1 },
        { color: '#ffb84d', opacity: 1 },
        { color: '#ffff4d', opacity: 1 },
        { color: '#80ff80', opacity: 1 },
        { color: '#4dd2ff', opacity: 1 },
        { color: '#4d4dff', opacity: 1 },
        { color: '#b84dff', opacity: 1 },
        { color: '#ff4da6', opacity: 1 }
    ]);

    let activeSlot = $state(0);

    function hexToHsl(H) {
        let r = 0, g = 0, b = 0;
        if (H.length === 4) {
            r = "0x" + H[1] + H[1];
            g = "0x" + H[2] + H[2];
            b = "0x" + H[3] + H[3];
        } else {
            r = "0x" + H[1] + H[2];
            g = "0x" + H[3] + H[4];
            b = "0x" + H[5] + H[6];
        }
        r /= 255; g /= 255; b /= 255;
        const cmin = Math.min(r,g,b), cmax = Math.max(r,g,b), delta = cmax - cmin;
        let h = 0, s = 0, l = 0;
        if (delta !== 0) {
            if (cmax === r) h = ((g - b) / delta) % 6;
            else if (cmax === g) h = (b - r) / delta + 2;
            else h = (r - g) / delta + 4;
            h = Math.round(h * 60);
            if (h < 0) h += 360;
        }
        l = (cmax + cmin) / 2;
        s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
        return [h, s * 100, l * 100];
    }

    $effect(() => {
        if (activeSlot !== null) {
            colorSlots[activeSlot].color = hex;
            colorSlots[activeSlot].opacity = opacity;

            if (Pointer.shouldUseSelectedColor) {
                SelectedColor.setColor(hex,opacity)
            }else{
                SelectedColor.setColor("transparent",1)
            }
        }
    });

    function handleHexInput(e) {
        const value = e.target.value;
        if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
            const [h, s, l] = hexToHsl(value);
            hue = h;
            saturation = s;
            lightness = l;
            const [_, sV, v] = hslToHsv(h, s, l);
            pickerX = sV;
            pickerY = 100 - v;
        }
    }


    function removeColorSlot(index) {
        if (colorSlots.length <= 1) return; // Don't allow removing if only one slot left
        
        colorSlots.splice(activeSlot, 1);
        
        // Adjust activeSlot if needed
        if (activeSlot >= colorSlots.length) {
            activeSlot = colorSlots.length - 1;
        }
        
        // Update the picker to show the new active slot's color
        const slot = colorSlots[activeSlot];
        const [h, s, l] = hexToHsl(slot.color);
        opacity = slot.opacity;
        hue = h;
        saturation = s;
        lightness = l;
        
        const [_, sV, v] = hslToHsv(h, s, l);
        pickerX = sV;
        pickerY = 100 - v;
    }

    function addColorSlot() {
        showPicker = true;
        // Add new color slot with current picker color
        colorSlots.push({
            color: hex,
            opacity: opacity
        });
        // Set it as active
        activeSlot = colorSlots.length - 1;
    }

    function openPicker(){
        showPicker = true;
    }
    function closePicker(){
        showPicker = false;
    }

    let showPicker = $state(false) 
</script>

<svelte:window 
    onmousemove={handleMouseMove} 
    onmouseup={handleMouseUp}
/>


<div class="{showPicker ? "opacity-100 pointer-events-auto":"opacity-0 pointer-events-none"} text-[0.8em] z-[50] fixed left-1/2 -translate-y-1/2 top-1/2 -translate-x-1/2 border-[1px] shadow bg-white w-[18em] p-[0.7em] flex flex-col gap-[0.5em]">
    <!-- svelte-ignore a11y_consider_explicit_label -->
    <div class="flex">
        <p class="text-[1.3em] leading-[0.9em]">Color Picker</p>
        <button onclick={closePicker} class="ml-auto block w-fit cursor-pointer py-[2px]">
            <div class=" w-[1em]">
                <svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1.5 10.5V11.5H0.5V10.5H1.5ZM3.5 8.5V9.5H2.5V8.5H3.5ZM5.5 6.5V7.5H4.5V6.5H5.5ZM7.5 4.5V5.5H6.5V4.5H7.5ZM9.5 2.5V3.5H8.5V2.5H9.5ZM11.5 0.5V1.5H10.5V0.5H11.5Z" stroke="black"/>
                    <path d="M1.5 1.5H0.5V0.5L1.5 0.5V1.5ZM3.5 3.5L2.5 3.5V2.5L3.5 2.5V3.5ZM5.5 5.5H4.5V4.5H5.5V5.5ZM7.5 7.5H6.5V6.5H7.5V7.5ZM9.5 9.5H8.5V8.5H9.5V9.5ZM11.5 11.5H10.5V10.5H11.5V11.5Z" stroke="black"/>
                </svg>
            </div>
        </button>
    </div>

    <div class="">
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
            bind:this={pickerElement}
            class="border-[1px] relative w-[100%] aspect-video cursor-[crosshair]"
            style="
                background:
                    linear-gradient(to top, black, transparent),
                    linear-gradient(to right, white, hsl({hue}, 100%, 50%));
            "
            onmousedown={handleMouseDown}
        >
            <!-- Picker handle -->
            <div
                class="-translate-x-1/2 -translate-y-1/2 absolute size-[1em] border-2 border-white shadow-[0_0_2px_#000]"
                style="
                    left: calc({pickerX}%);
                    top: calc({pickerY}%);
                "
            ></div>
        </div>
        <!-- <p class="text-[0.8em] mt-[0.4em] text-[#939393] text-center">H: {hue}° | S: {saturation.toFixed(1)}% | L: {lightness.toFixed(1)}% | {hex}</p> -->
        
    </div>

    <div class="">
        <!-- <label class="allLabels text-[#6b7280]">Hex Color</label> -->
        <input
            type="text"
            value={hex}
            onchange={handleHexInput}
            class="uppercase w-[100%] border-[1px] px-[0.5em] py-[1px]"
        />
    </div>

    <div class="space-y-[2px]">
    
        <div class="">
            <!-- <label class="allLabels text-[#6b7280]">Hue</label> -->
            <input
                type="range"
                bind:value={hue}
                min="0"
                max="360"
                class="w-[100%] h-[0.4em] appearance-none cursor-[pointer]"
                style="background: linear-gradient(to right,
                    hsl(0, 100%, 50%),
                    hsl(60, 100%, 50%),
                    hsl(120, 100%, 50%),
                    hsl(180, 100%, 50%),
                    hsl(240, 100%, 50%),
                    hsl(300, 100%, 50%),
                    hsl(360, 100%, 50%)
                );"
            />
        </div>
        
        <div class="">
            <!-- <label class="allLabels text-[#6b7280]">Opacity {Math.round(opacity*100)}%</label> -->
            <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                bind:value={opacity}
                class="w-[100%] h-[0.4em]  appearance-none cursor-[pointer]"
                style="background: linear-gradient(to right, transparent, {colorSlots[activeSlot].color}),
                   repeating-linear-gradient(45deg, #ccc 0, #ccc 0.25em, #fff 0.25em, #fff 0.5em);"
            />
        </div>

      
    </div>

</div>

<div class="fixed left-1em top-1/2 -translate-y-1/2 space-y-[2px]">
    <div class="bg-[#655561] grid grid-cols-1 sm:grid-cols-2 gap-[1px] border h-[17em] md:h-[12em] content-baseline overflow-y-auto">
        {#each colorSlots as slot, i}
            <!-- svelte-ignore a11y_consider_explicit_label -->
            <button
                class="{activeSlot === i ? '' : ''}
                overflow-hidden size-[1.5em] aspect-square relative cursor-[pointer]"
                style="
                    background: repeating-linear-gradient(45deg, #ccc 0, #ccc 0.25em, #fff 0.25em, #fff 0.5em);
                "
    
                onclick={() => {
                    activeSlot = i;
                    const [h, s, l] = hexToHsl(slot.color);
                    opacity = slot.opacity;
                    hue = h;
                    saturation = s;
                    lightness = l;
    
                    // Convert HSL → HSV for picker coords
                    const [_, sV, v] = hslToHsv(h, s, l);
                    pickerX = sV;
                    pickerY = 100 - v;

                    if (Pointer.current != 0 && Pointer.current != 4) {
                        Pointer.current = 0
                    }
                }}
            >
                <div
                style="
                    background-color: {slot.color};
                    opacity: {slot.opacity};
                "
                class="w-full h-full left-0 top-0 absolute"></div>
    
                {#if activeSlot === i}
                    <div class="shadow-md">
                        <div onclick={openPicker} class="bg-white  w-1/2 h-1/4 absolute right-0 bottom-0">
    
                        </div>
                        <div onclick={openPicker} class="bg-white w-1/4 h-1/2 absolute right-0 bottom-0">
    
                        </div>
                    </div>
                {/if}
    
            </button>
        {/each}
    </div>
    
    <div class="bg-black grid grid-cols-1 sm:grid-cols-2 gap-[1px] p-[1px]">
        <!-- svelte-ignore a11y_consider_explicit_label -->
        <button onclick={addColorSlot}
            class="flex justify-center items-center bg-white overflow-hidden w-[1.5em] aspect-square relative cursor-[pointer]">
            <div class="w-[0.8em]">
                <svg viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5.5 0.5L5.5 10.5" stroke="black" stroke-linecap="square" stroke-linejoin="round"/>
                    <path d="M10.5 5.5L0.5 5.5" stroke="black" stroke-linecap="square" stroke-linejoin="round"/>
                </svg>
            </div>

        </button>
        <!-- svelte-ignore a11y_consider_explicit_label -->
        <button onclick={removeColorSlot}
            class="flex justify-center items-center bg-white overflow-hidden w-[1.5em] aspect-square relative cursor-[pointer]">
        
            <div class="w-[0.8em]">
                <svg viewBox="0 0 11 1" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10.5 0.5L0.5 0.499999" stroke="black" stroke-linecap="square" stroke-linejoin="round"/>
                </svg>
            </div>
        </button>
    </div>
</div>


<style>
       input[type="range"] {
        -webkit-appearance: none;
        appearance: none;
        width: 100%;
        height: 5px; /* gives track some presence */
        margin: 8px 0; /* adds space between sliders */
        background: transparent;
    }

    /* WebKit (Chrome, Safari) */
    input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: white;
        border: 3px solid #333;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        margin-top: -5px; /* centers thumb */
    }

    input[type="range"]::-webkit-slider-runnable-track {
        height: 4px;
        border-radius: 2px;
    }

    /* Firefox */
    input[type="range"]::-moz-range-thumb {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: white;
        border: 3px solid #333;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    input[type="range"]::-moz-range-track {
        height: 4px;
        border-radius: 2px;
    }

    input[type="range"]::-moz-focus-outer {
        border: 0;
    }
</style>
