<script>
    import { Pointer } from '../stores/Pointer.svelte';
    import { getContext, onMount } from 'svelte';
    import * as SelectedColor from "$lib/stores/SelectedColor.svelte"
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    let {oninput = () => {}, startValue} = $props()

    // === COLOR STATE ===
    let hue = $state(0);         // 0–360 (horizontal hue slider elsewhere)
    let saturation = $state(100);
    let lightness = $state(50);

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

    // $effect(() => {
    //     oninput(hex);  
    // });

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

        dispatch('input', hex);
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

            dispatch('input', value);
        }
    }


    let showPicker = $state(false) 

    onMount(() => {
        if (startValue) {
            // Validate hex format
            if (/^#[0-9A-Fa-f]{6}$/.test(startValue)) {
                const [h, s, l] = hexToHsl(startValue);
                hue = h;
                saturation = s;
                lightness = l;
                
                // Update picker position
                const [_, sV, v] = hslToHsv(h, s, l);
                pickerX = sV;
                pickerY = 100 - v;
            }
        }
    });
</script>

<svelte:window 
    onmousemove={handleMouseMove} 
    onmouseup={handleMouseUp}
/>

<div class="relative">
    <!-- <label class="allLabels text-[#6b7280]">Hex Color</label> -->
    <input
        type="text"
        value={hex}
        onfocus={() => showPicker = true}
        onchange={handleHexInput}
        class="uppercase w-[100%] border-[1px] px-[0.5em] py-[1px]"
    />


    <div class="{showPicker ? "opacity-100 pointer-events-auto":"opacity-0 pointer-events-none"} text-[0.8em] z-[50] absolute left-0 bottom-full border-[1px] shadow bg-white w-full p-[0.7em] flex flex-col gap-[0.5em]">
        
        
        <!-- svelte-ignore a11y_consider_explicit_label -->
        <div class="flex">
            <p class="text-[1.3em] leading-[0.9em]">Color Picker</p>
            <button onclick={()=>{showPicker = false}} class="ml-auto block w-fit cursor-pointer py-[2px]">
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

        <div class="space-y-[2px]">
            <div class="">
                <!-- <label class="allLabels text-[#6b7280]">Hue</label> -->
                <input
                    type="range"
                    bind:value={hue}
                    oninput={() => dispatch('input', hex)}
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
        </div>
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
