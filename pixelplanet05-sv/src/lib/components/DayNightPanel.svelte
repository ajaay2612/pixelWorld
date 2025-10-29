<script>
    import ColorPickerForForm from "./ColorPickerForForm.svelte";
    
    let {
        dayNightConfig = $bindable(),
        onUpdate = () => {}
    } = $props();
    
    // Time of day: 0 = midnight, 0.25 = sunrise, 0.5 = noon, 0.75 = sunset, 1 = midnight
    let timeOfDay = $state(dayNightConfig?.timeOfDay || 0.5);
    let morningColor = $state(dayNightConfig?.morningColor || '#ff9966');
    let noonColor = $state(dayNightConfig?.noonColor || '#87ceeb');
    let nightColor = $state(dayNightConfig?.nightColor || '#0a0a2e');
    let overlayOpacity = $state(dayNightConfig?.overlayOpacity || 0.4);
    
    // Calculate interpolated color based on time of day
    let currentSkyColor = $derived.by(() => {
        const t = timeOfDay;
        
        // Morning: 0 to 0.5
        if (t < 0.5) {
            return interpolateColors(nightColor, morningColor, noonColor, t * 2);
        }
        // Evening: 0.5 to 1
        else {
            return interpolateColors(noonColor, morningColor, nightColor, (t - 0.5) * 2);
        }
    });
    
    // Get time label
    let timeLabel = $derived.by(() => {
        if (timeOfDay < 0.15) return 'Midnight';
        if (timeOfDay < 0.35) return 'Dawn';
        if (timeOfDay < 0.65) return 'Day';
        if (timeOfDay < 0.85) return 'Dusk';
        return 'Night';
    });
    
    function interpolateColors(color1, color2, color3, t) {
        // First half: blend from color1 to color2
        // Second half: blend from color2 to color3
        let fromColor, toColor, blendFactor;
        
        if (t < 0.5) {
            fromColor = color1;
            toColor = color2;
            blendFactor = t * 2;
        } else {
            fromColor = color2;
            toColor = color3;
            blendFactor = (t - 0.5) * 2;
        }
        
        const hex1 = fromColor.replace('#', '');
        const hex2 = toColor.replace('#', '');
        
        const r1 = parseInt(hex1.substring(0, 2), 16);
        const g1 = parseInt(hex1.substring(2, 4), 16);
        const b1 = parseInt(hex1.substring(4, 6), 16);
        
        const r2 = parseInt(hex2.substring(0, 2), 16);
        const g2 = parseInt(hex2.substring(2, 4), 16);
        const b2 = parseInt(hex2.substring(4, 6), 16);
        
        const r = Math.round(r1 + (r2 - r1) * blendFactor);
        const g = Math.round(g1 + (g2 - g1) * blendFactor);
        const b = Math.round(b1 + (b2 - b1) * blendFactor);
        
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    
    function updateConfig() {
        if (dayNightConfig) {
            dayNightConfig.timeOfDay = timeOfDay;
            dayNightConfig.morningColor = morningColor;
            dayNightConfig.noonColor = noonColor;
            dayNightConfig.nightColor = nightColor;
            dayNightConfig.overlayOpacity = overlayOpacity;
            dayNightConfig.currentColor = currentSkyColor;
            onUpdate();
        }
    }
    
    // Watch for changes
    $effect(() => {
        timeOfDay;
        morningColor;
        noonColor;
        nightColor;
        overlayOpacity;
        updateConfig();
    });
</script>

<div class="day-night-panel space-y-[0.4em]">
    <!-- ADD THIS ENABLE CHECKBOX -->
    <div class="flex items-center gap-2 mb-2 ">
        <input
            type="checkbox"
            bind:checked={dayNightConfig.enabled}
            onchange={() => {
                updateConfig();
            }}
        />
        <span class="">Enable Day/Night Cycle</span>
    </div>
    {#if dayNightConfig.enabled}
        <div class="mb-[0.5em] border-t pt-[0.3em]">
            <div class="flex justify-between items-center mb-[0.3em]">
                <label class=" text-[0.95em]">Time of Day</label>
                <span class="text-[0.85em] px-[0.4em] py-[0.1em] rounded" 
                      style="background-color: {currentSkyColor}; color: {timeOfDay > 0.3 && timeOfDay < 0.7 ? '#000' : '#fff'}">
                    {timeLabel}
                </span>
            </div>
            <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                bind:value={timeOfDay}
                class="w-full"
                style="background: linear-gradient(to right, {nightColor} 0%, {morningColor} 25%, {noonColor} 50%, {morningColor} 75%, {nightColor} 100%);"
            />
        </div>
        
        <div>
            <label class="block  text-[0.9em] mb-[0.3em]">Sky Colors</label>
            <div class="grid grid-cols-3 gap-[0.5em]">
                <div>
                    <label class="block text-[0.8em] mb-[0.2em]"> Dawn</label>
                    <ColorPickerForForm
                        startValue={morningColor}
                        on:input={(e) => {
                            morningColor = e.detail;
                        }}
                    />
                </div>
                
                <div>
                    <label class="block text-[0.8em] mb-[0.2em]"> Noon</label>
                    <ColorPickerForForm
                        startValue={noonColor}
                        on:input={(e) => {
                            noonColor = e.detail;
                        }}
                    />
                </div>
                
                <div>
                    <label class="block text-[0.8em] mb-[0.2em]"> Night</label>
                    <ColorPickerForForm
                        startValue={nightColor}
                        on:input={(e) => {
                            nightColor = e.detail;
                        }}
                    />
                </div>
            </div>
        </div>
        
        <div>
            <label class="block">Overlay Opacity: {overlayOpacity.toFixed(2)}</label>
            <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                bind:value={overlayOpacity}
                class="w-full"
            />
        </div>
        
        <!-- Preview -->
        <div class="mt-[0.5em] p-[0.5em] rounded border" 
             style="background-color: {currentSkyColor}; opacity: {overlayOpacity}; min-height: 2em;">
            <span class="text-[0.75em]" style="color: {timeOfDay > 0.3 && timeOfDay < 0.7 ? '#000' : '#fff'}">
                Sky Preview
            </span>
        </div>
    {/if}
</div>
