<script>
    import WorldCanvas from "$lib/components/WorldCanvas.svelte";
    import ColorPicker from "../components/ColorPicker.svelte";
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

    let ColorPickerRef;
    function handleSetColorPicker(color, opacity) {   
        if (ColorPickerRef) {
            ColorPickerRef.setColorpickerColor(color, opacity);
        }
    }


    let isEditor = $state(true)

    let showPlotBoundary =  $state(true) 
    let showIsoGrid =  $state(true)
    let showGridLines =  $state(true)

    let showAssetPicker = $state(false)
</script>


<!-- editable -->
<WorldCanvas
    bind:this={canvasRef}
    editMode={isEditor}
    gridSizeMultiplier={2}
    {handleSetColorPicker}

    bind:showPlotBoundary={showPlotBoundary}
    bind:showIsoGrid={showIsoGrid}
    bind:showGridLines={showGridLines}
     bind:showAssetPicker={showAssetPicker}
/>


<!-- <div class="text-[0.94em] sm:text-[1.1em]"> -->
    <ToolPanel
        {handleExport}
        {handleOpenAssetPicker}
        {handleCloseAssetPicker}
        {handleToggleAssetPicker}
        {handleClearAll}
        {isEditor}
        bind:canvasRef={canvasRef}
        bind:showPlotBoundary={showPlotBoundary}
        bind:showIsoGrid={showIsoGrid}
        bind:showGridLines={showGridLines}
         bind:showAssetPicker={showAssetPicker}
    />
<!-- </div> -->

<ColorPicker
    bind:this={ColorPickerRef}
/>

<!-- <button 
type="button"
class="bg-green-300 absolute top-1em right-1em shadow px-1em py-[0.23em]"
onclick={handleExport}>Export</button> -->
