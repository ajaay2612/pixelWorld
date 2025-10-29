<script>
    import { untrack } from "svelte";
    import ColorPickerForForm from "./ColorPickerForForm.svelte";
    
    let {
        instance = $bindable(),
        onUpdate = () => {}
    } = $props();
    
    // Default shadow config if instance doesn't have one
    let shadowConfig = $state(instance?.shadow || {
        enabled: false,
        color: '#000000',
        opacity: 0.3,
        offsetX: 2,
        offsetY: 2,
        angle: 45,
        length: 4,
        blur: 2,
        skewX: 0.5
    });
    
    // Initialize from instance shadow when component mounts
    $effect(() => {
        if (instance?.shadow) {
            untrack(() => {
                shadowConfig = { ...instance.shadow };
            });
        }
    });
    
    // Manual update function instead of reactive effect
    function updateShadow() {
        if (instance) {
            instance.shadow = { ...shadowConfig };
            onUpdate();
        }
    }

    let maxOffsetX = $derived(instance?.width ? instance.width * 3 : 10);
    let maxOffsetY = $derived(instance?.height ? instance.height * 3 : 10);
    let minOffsetX = $derived(-maxOffsetX);
    let minOffsetY = $derived(-maxOffsetY);
</script>

<div class="shadow-editor space-y-[0.3em]">
    <div class="p-[0.2em] flex items-center gap-2 mb-2">
        <input
            type="checkbox"
            bind:checked={shadowConfig.enabled}
            onchange={updateShadow}
        />
        <span class="text-[1.3em] leading-[0.9em]">Enable Shadow</span>
    </div>
    
    {#if shadowConfig.enabled}
        <div class="grid sm:grid-cols-3 gap-[0.3em] gap-x-[1em]">
            <div>
                <label class="block">Shadow Angle: {shadowConfig.angle}°</label>
                <input
                    type="range"
                    min="0"
                    max="90"
                    bind:value={shadowConfig.angle}
                    oninput={updateShadow}
                    class="w-full"
                />
            </div>
            
            <div>
                <label class="block">Shadow Length: {shadowConfig.length}</label>
                <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.5"
                    bind:value={shadowConfig.length}
                    oninput={updateShadow}
                    class="w-full"
                />
            </div>
            
            <div>
                <label class="block">Horizontal Offset: {shadowConfig.offsetX}</label>
                <input
                    type="range"
                    min={minOffsetX}
                    max={maxOffsetX}
                    step="0.5"
                    bind:value={shadowConfig.offsetX}
                    oninput={updateShadow}
                    class="w-full"
                />
            </div>

            <div>
                <label class="block">Vertical Offset: {shadowConfig.offsetY}</label>
                <input
                    type="range"
                    min={minOffsetY}
                    max={maxOffsetY}
                    step="0.5"
                    bind:value={shadowConfig.offsetY}
                    oninput={updateShadow}
                    class="w-full"
                />
            </div>
            
            <div>
                <label class="block">Perspective Skew: {shadowConfig.skewX.toFixed(2)}</label>
                <input
                    type="range"
                    min="-2"
                    max="2"
                    step="0.1"
                    bind:value={shadowConfig.skewX}
                    oninput={updateShadow}
                    class="w-full"
                />
            </div>
            
            <div>
                <label class="block">Shadow Opacity: {shadowConfig.opacity.toFixed(2)}</label>
                <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    bind:value={shadowConfig.opacity}
                    oninput={updateShadow}
                    class="w-full"
                />
            </div>
            
            <div>
                <label class="block">Blur Amount: {shadowConfig.blur}</label>
                <input
                    type="range"
                    min="0"
                    max="10"
                    bind:value={shadowConfig.blur}
                    oninput={updateShadow}
                    class="w-full"
                />
            </div>
            
            <div>
                <label class="block mb-[0.2em]">Shadow Color:</label>
                <ColorPickerForForm
                    startValue={shadowConfig.color}
                    on:input={(e) => {
                        shadowConfig.color = e.detail;
                        updateShadow();
                    }}
                />
            </div>
        </div>
    {/if}
</div>