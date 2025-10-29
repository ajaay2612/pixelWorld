<script>
    // Color picker state
    let hue = $state(0);
    let saturation = $state(100);
    let lightness = $state(50);
    
    // Picker position
    let pickerX = $state(100); // 0-100%
    let pickerY = $state(0); // 0-100%
    
    let isDragging = $state(false);
    
    // Convert HSL to hex
    function hsvToHsl(h, s, v) {
        s /= 100;
        v /= 100;

        const l = v * (1 - s / 2);
        const sl = l === 0 || l === 1 ? 0 : (v - l) / Math.min(l, 1 - l);
        return [h, sl * 100, l * 100];
    }
    
    // Derived hex color
    let hexColor = $derived(hslToHex(hue, saturation, lightness));
    
    // Handle picker drag
    let pickerElement = $state(null);

    function handlePickerMove(e) {
        if (!pickerElement) return;
        const rect = pickerElement.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
            
        const s = (x / rect.width) * 100;
        const v = 100 - (y / rect.height) * 100;

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
    

    // Color palette state
    let colorPalette = $state([
        '#ff0000', '#00ff00', '#0000ff', '#ffff00',
        '#ff00ff', '#00ffff', '#ffffff', '#000000'
    ]);
    let selectedPaletteIndex = $state(0);

    // Load color from palette when selecting a box
    function selectPaletteColor(index) {
        selectedPaletteIndex = index;
        const hex = colorPalette[index];
        
        // Convert hex to HSL and update picker
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        
        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }

        
        hue = Math.round(h * 360);
        saturation = Math.round(s * 100);
        lightness = Math.round(l * 100);
        
        console.log('saturation', saturation);
        console.log('lightness',  lightness);

    }

    // Update selected palette color when picker changes
    $effect(() => {
        colorPalette[selectedPaletteIndex] = hexColor;
    });
</script>

<svelte:window 
    onmousemove={handleMouseMove} 
    onmouseup={handleMouseUp}
/>

<div class="flex flex-col gap-[0.5em] p-[1em] bg-[#ffffff] rounded-[0.5em] shadow-[0_0.625em_1.5em_rgba(0,0,0,0.1)] w-[16em]">
    
    <!-- Color Square Picker -->
    <div 
        bind:this={pickerElement}
        class="w-[100%] aspect-square rounded-[0.25em] border-[0.125em] border-[#d1d5db] cursor-[crosshair] relative"
        style="background: 
            linear-gradient(to top, black, transparent),
            linear-gradient(to right, white, hsl({hue}, 100%, 50%));"
        onmousedown={handleMouseDown}
        role="slider"
        tabindex="0"
    >
        <!-- Picker Circle -->
        <div 
            class="absolute w-[1em] h-[1em] border-[0.125em] border-[#ffffff] rounded-[50%] pointer-events-none shadow-[0_0_0.25em_rgba(0,0,0,0.5)]"
            style="left: calc({pickerX}% - 0.5em); top: calc({pickerY}% - 0.5em);"
        ></div>
    </div>
    
    <!-- Hex Value Display -->
    <input 
        type="text"
        bind:value={hexColor}
        oninput={(e) => {
            const hex = e.target.value;
            if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
                // Convert hex to HSL
                const r = parseInt(hex.slice(1, 3), 16) / 255;
                const g = parseInt(hex.slice(3, 5), 16) / 255;
                const b = parseInt(hex.slice(5, 7), 16) / 255;
                
                const max = Math.max(r, g, b);
                const min = Math.min(r, g, b);
                let h, s, l = (max + min) / 2;
                
                if (max === min) {
                    h = s = 0;
                } else {
                    const d = max - min;
                    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                    
                    switch (max) {
                        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                        case g: h = ((b - r) / d + 2) / 6; break;
                        case b: h = ((r - g) / d + 4) / 6; break;
                    }
                }
                
                hue = Math.round(h * 360);
                saturation = Math.round(s * 100);
                lightness = Math.round(l * 100);
                
                // Update picker position
                pickerX = saturation;
                pickerY = 100 - lightness;
            }
        }}
        class="w-[100%] p-[0.5em] text-[center] font-[monospace] text-[0.875em] border-[0.125em] border-[#d1d5db] rounded-[0.25em] bg-[#f9fafb]"
        placeholder="#000000"
    />
    
    <!-- Hue Slider -->
    <div class="flex flex-col gap-[0.25em]">
        <label class="text-[0.75em] text-[#6b7280]">Hue</label>
        <input 
            type="range" 
            bind:value={hue}
            min="0" 
            max="360" 
            class="w-[100%] h-[0.75em] rounded-[0.5em] appearance-none cursor-[pointer]"
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
    
    <!-- Color Palette -->
    <div class="flex flex-col gap-[0.25em]">
        <label class="text-[0.75em] text-[#6b7280]">Color Palette</label>
        <div class="grid grid-cols-[repeat(4,1fr)] gap-[0.25em]">
            {#each colorPalette as color, index}
                <button
                    onclick={() => selectPaletteColor(index)}
                    class="w-[100%] h-[2em] rounded-[0.25em] border-[0.125em] cursor-[pointer] {selectedPaletteIndex === index ? 'border-[#3b82f6]' : 'border-[#d1d5db]'}"
                    style="background-color: {color};"
                ></button>
            {/each}
        </div>
    </div>
</div>



<style>
    input[type="range"]::-webkit-slider-thumb {
        appearance: none;
        width: 1em;
        height: 1em;
        border-radius: 50%;
        background: white;
        border: 0.125em solid #333;
        cursor: pointer;
        box-shadow: 0 0.125em 0.25em rgba(0,0,0,0.2);
    }
    
    input[type="range"]::-moz-range-thumb {
        width: 1em;
        height: 1em;
        border-radius: 50%;
        background: white;
        border: 0.125em solid #333;
        cursor: pointer;
        box-shadow: 0 0.125em 0.25em rgba(0,0,0,0.2);
    }
</style>