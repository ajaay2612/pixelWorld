<script>
    import { untrack } from "svelte";
    import ColorPickerForForm from "./ColorPickerForForm.svelte";
    
    let {
        instance = $bindable(),
        onUpdate = () => {}
    } = $props();
    
    // Default light config with updated intensity and ellipse properties
    let lightConfig = $state(instance?.light || {
        enabled: false,
        color: '#ffaa00',
        intensity: 2,          // Changed default
        radius: 5,
        blur: 30,
        offsetX: 0,
        offsetY: 0,
        ellipseX: 1,           // NEW: horizontal scale (1 = circle)
        ellipseY: 1,           // NEW: vertical scale (1 = circle)
        pulseEnabled: false,
        pulseSpeed: 1,
        pulseMin: 0.5,
        pulseMax: 1
    });
    
    // ... rest of your existing code ...
    
    function updateLight() {
        if (instance) {
            instance.light = { ...lightConfig };
            onUpdate();
        }
    }
    
    let maxRadius = $derived(instance?.width ? Math.max(instance.width, instance.height) * 3 : 15);
    let maxOffsetX = $derived(instance?.width ? instance.width * 3 : 10);
    let maxOffsetY = $derived(instance?.height ? instance.height * 3 : 10);
    let minOffsetX = $derived(-maxOffsetX);
    let minOffsetY = $derived(-maxOffsetY);
</script>

<div class="light-editor  space-y-[0.3em]">
    <div class="flex items-center gap-2 mb-2">
        <input
            type="checkbox"
            bind:checked={lightConfig.enabled}
            onchange={updateLight}
        />
        <span class="">Enable Light</span>
    </div>
    
    {#if lightConfig.enabled}
        <div class="space-y-[0.2em]">
            <!-- UPDATED: Intensity now goes to 5 instead of 1 -->
            <div class="grid sm:grid-cols-3 gap-[0.3em] gap-x-[1em]">
                <div>
                    <label class="block">Light Intensity: {lightConfig.intensity.toFixed(2)}</label>
                    <input
                        type="range"
                        min="0.1"
                        max="5"
                        step="0.1"
                        bind:value={lightConfig.intensity}
                        oninput={updateLight}
                        class="w-full"
                    />
                </div>
                
                <div>
                    <label class="block">Light Radius: {lightConfig.radius}</label>
                    <input
                        type="range"
                        min="1"
                        max={maxRadius}
                        step="0.5"
                        bind:value={lightConfig.radius}
                        oninput={updateLight}
                        class="w-full"
                    />
                </div>
                
                <!-- NEW: Ellipse controls -->
                <div>
                    <label class="block">Horizontal Scale: {lightConfig.ellipseX.toFixed(2)}</label>
                    <input
                        type="range"
                        min="0.2"
                        max="3"
                        step="0.1"
                        bind:value={lightConfig.ellipseX}
                        oninput={updateLight}
                        class="w-full"
                    />
                </div>
                
                <div>
                    <label class="block">Vertical Scale: {lightConfig.ellipseY.toFixed(2)}</label>
                    <input
                        type="range"
                        min="0.2"
                        max="3"
                        step="0.1"
                        bind:value={lightConfig.ellipseY}
                        oninput={updateLight}
                        class="w-full"
                    />
                </div>
                
                <div>
                    <label class="block">Blur Amount: {lightConfig.blur}</label>
                    <input
                        type="range"
                        min="0"
                        max="50"
                        bind:value={lightConfig.blur}
                        oninput={updateLight}
                        class="w-full"
                    />
                </div>
                
                <div>
                    <label class="block">Horizontal Offset: {lightConfig.offsetX}</label>
                    <input
                        type="range"
                        min={minOffsetX}
                        max={maxOffsetX}
                        step="0.5"
                        bind:value={lightConfig.offsetX}
                        oninput={updateLight}
                        class="w-full"
                    />
                </div>
                
                <div>
                    <label class="block">Vertical Offset: {lightConfig.offsetY}</label>
                    <input
                        type="range"
                        min={minOffsetY}
                        max={maxOffsetY}
                        step="0.5"
                        bind:value={lightConfig.offsetY}
                        oninput={updateLight}
                        class="w-full"
                    />
                </div>
                
                <div>
                    <label class="block mb-[0.2em]">Light Color:</label>
                    <ColorPickerForForm
                        startValue={lightConfig.color}
                        on:input={(e) => {
                            lightConfig.color = e.detail;
                            updateLight();
                        }}
                    />
                </div>
            </div>
            
            <div class="border-t pt-[0.3em] mt-[0.3em]">
                <div class="flex items-center gap-2 mb-2">
                    <input
                        type="checkbox"
                        bind:checked={lightConfig.pulseEnabled}
                        onchange={updateLight}
                    />
                    <span class=" text-[0.9em]">Pulse Effect</span>
                </div>
                
                {#if lightConfig.pulseEnabled}
                    <div class="grid sm:grid-cols-3 gap-[0.3em] gap-x-[1em]">
                        <div>
                            <label class="block">Pulse Speed: {lightConfig.pulseSpeed.toFixed(1)}</label>
                            <input
                                type="range"
                                min="0.1"
                                max="5"
                                step="0.1"
                                bind:value={lightConfig.pulseSpeed}
                                oninput={updateLight}
                                class="w-full"
                            />
                        </div>
                        
                        <div>
                            <label class="block">Min Intensity: {lightConfig.pulseMin.toFixed(2)}</label>
                            <input
                                type="range"
                                min="0.1"
                                max="5"
                                step="0.1"
                                bind:value={lightConfig.pulseMin}
                                oninput={updateLight}
                                class="w-full"
                            />
                        </div>
                        
                        <div>
                            <label class="block">Max Intensity: {lightConfig.pulseMax.toFixed(2)}</label>
                            <input
                                type="range"
                                min="0.1"
                                max="5"
                                step="0.1"
                                bind:value={lightConfig.pulseMax}
                                oninput={updateLight}
                                class="w-full"
                            />
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    {/if}
</div>
