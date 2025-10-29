<script>
    import WorldCanvas from "$lib/components/WorldCanvas.svelte";
    import { Assets } from '$lib/stores/Assets.svelte.js'
    import ToolPanel from "../components/ToolPanel.svelte";


    let canvasRef = $state(null);
    function handleExport(name, isGlobal) {
        if (canvasRef) {
            canvasRef.exportArt(name, isGlobal);
        }
    }
    function handleOpenAssetPicker() {
        if (canvasRef) {
            canvasRef.openAssetPicker();
        }
    }
    function handleCloseAssetPicker() {
        if (canvasRef) {
            canvasRef.closeAssetPicker();
        }
    }
    function handleToggleAssetPicker() {
        if (canvasRef) {
            canvasRef.toggleAssetPicker();
        }
    }
    function handleClearAll() {
        if (canvasRef) {
            canvasRef.clearAll();
        }
    }

    let showPlotBoundary =  $state(true) 
    let showIsoGrid =  $state(true)
    let showGridLines =  $state(false)

    let showDayNightPanel = $state(false)
    let showLightEditor = $state(false)
    let showShadowEditor = $state(false)
    let canEditSelectedInstance = $state(false)
    
    let showAssetPicker = $state(false)


    let isEditor = $state(false)

    let showWeatherEditor = $state(false)
</script>

<WorldCanvas
    bind:this={canvasRef}
    bind:showPlotBoundary={showPlotBoundary}
    bind:showIsoGrid={showIsoGrid}
    bind:showGridLines={showGridLines}

    bind:showDayNightPanel={showDayNightPanel}
    bind:showLightEditor={showLightEditor}
    bind:showShadowEditor={showShadowEditor}
    bind:canEditSelectedInstance={canEditSelectedInstance}
    bind:showAssetPicker={showAssetPicker}
    bind:showWeatherEditor = {showWeatherEditor}
/>

<!-- <div class="text-[0.94em] sm:text-[1.1em]"> -->
    <ToolPanel
        {handleExport}
        {handleOpenAssetPicker}
        {handleCloseAssetPicker}
        {handleToggleAssetPicker}
        {handleClearAll}
        bind:canvasRef={canvasRef}
    
        {isEditor}
        bind:showPlotBoundary={showPlotBoundary}
        bind:showIsoGrid={showIsoGrid}
        bind:showGridLines={showGridLines}
    
        bind:showDayNightPanel={showDayNightPanel}
        bind:showLightEditor={showLightEditor}
        bind:showShadowEditor={showShadowEditor}
        bind:canEditSelectedInstance={canEditSelectedInstance}
        bind:showAssetPicker={showAssetPicker}
        bind:showWeatherEditor = {showWeatherEditor}
    />
<!-- </div> -->