<script>
    import { Pointer } from "./../stores/Pointer.svelte";

    let {
        handleExport,
        handleOpenAssetPicker,
        handleCloseAssetPicker,
        handleToggleAssetPicker,
        handleClearAll,
        showPlotBoundary =  $bindable(true) ,
        showIsoGrid =  $bindable(true),
        showGridLines =  $bindable(true),
        isEditor,
        canvasRef,
        showDayNightPanel = $bindable(false),
        showLightEditor = $bindable(false),
        showShadowEditor = $bindable(false),
        canEditSelectedInstance = $bindable(false),
        showAssetPicker = $bindable(false),
        showWeatherEditor = $bindable(false)
    } = $props();

    // export art
    let showExportModal = $state(false);

    let name = $state("");
    let isGlobal = $state(false);

    function handleOpen() {
        showExportModal = true;
    }
    function handleClose() {
        showExportModal = false;
    }

    function handleSave() {
        handleExport(name, isGlobal);

        setTimeout(() => {
            handleClose();
            name = "";
            isGlobal = false;
        }, 100)
    }

    // clear confirmation
    let showClearConfirmationModal = $state(false)

    function handleOpenClearConfirmation() {
        showClearConfirmationModal = true;
    }
    function handleCloseClearConfirmation() {
        showClearConfirmationModal = false;
    }


    function closeAllPanels() {
        showAssetPicker = false;
        showWeatherEditor = false;
        showShadowEditor = false;
        showLightEditor = false;
        showDayNightPanel = false;
    }


</script>

{#if showClearConfirmationModal && isEditor}
    <div class="fixedCenter z-[50] bg-white w-[19em] p-[0.4em] border">
        <div class="p-[1.5em] border relative">
    
            <!-- svelte-ignore a11y_consider_explicit_label -->
            <button onclick={handleCloseClearConfirmation} class="cursor-pointer absolute top-[0.5em] right-[0.5em] w-[0.8em] mb-1em">
                <svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1.5 10.5V11.5H0.5V10.5H1.5ZM3.5 8.5V9.5H2.5V8.5H3.5ZM5.5 6.5V7.5H4.5V6.5H5.5ZM7.5 4.5V5.5H6.5V4.5H7.5ZM9.5 2.5V3.5H8.5V2.5H9.5ZM11.5 0.5V1.5H10.5V0.5H11.5Z" stroke="black"/>
                    <path d="M1.5 1.5H0.5V0.5L1.5 0.5V1.5ZM3.5 3.5L2.5 3.5V2.5L3.5 2.5V3.5ZM5.5 5.5H4.5V4.5H5.5V5.5ZM7.5 7.5H6.5V6.5H7.5V7.5ZM9.5 9.5H8.5V8.5H9.5V9.5ZM11.5 11.5H10.5V10.5H11.5V11.5Z" stroke="black"/>
                </svg>  
            </button>
    
            <div class="w-[80%] mx-auto mt-[0.3em]">
                <p class="text-center leading-[1em]">Are you sure you want to clear editor?</p>
    
                <div class="flex gap-[0.5em]">
                    <button
                    onclick={()=> {
                        handleClearAll(),
                        handleCloseClearConfirmation()
                    }}
                    class="cursor-pointer w-[75%] mx-auto block mt-[1em] bg-black text-white py-[1px]">
                        Yes
                    </button>
                    <button
                    onclick={handleCloseClearConfirmation}
                    class="cursor-pointer w-[75%] mx-auto block mt-[1em] bg-black text-white py-[1px]">
                        No
                    </button>
                </div>
            </div>
    
        </div>
    </div>
{/if}


{#if showExportModal && isEditor}
    <div class="fixedCenter z-[50] bg-white w-[19em] p-[0.4em] border">
        <div class="p-[1.5em] border relative">
    
            <!-- svelte-ignore a11y_consider_explicit_label -->
            <div class="absolute top-0 left-0 flex justify-between w-full p-[0.65em]">
                <div class="w-[1.5em]"><img src="/images/icons/saveTrimmed.svg" alt=""></div>

                <button onclick={handleClose} class="cursor-pointer  w-[0.8em] mb-1em">
                    <svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1.5 10.5V11.5H0.5V10.5H1.5ZM3.5 8.5V9.5H2.5V8.5H3.5ZM5.5 6.5V7.5H4.5V6.5H5.5ZM7.5 4.5V5.5H6.5V4.5H7.5ZM9.5 2.5V3.5H8.5V2.5H9.5ZM11.5 0.5V1.5H10.5V0.5H11.5Z" stroke="black"/>
                        <path d="M1.5 1.5H0.5V0.5L1.5 0.5V1.5ZM3.5 3.5L2.5 3.5V2.5L3.5 2.5V3.5ZM5.5 5.5H4.5V4.5H5.5V5.5ZM7.5 7.5H6.5V6.5H7.5V7.5ZM9.5 9.5H8.5V8.5H9.5V9.5ZM11.5 11.5H10.5V10.5H11.5V11.5Z" stroke="black"/>
                    </svg>
                </button>
            </div>
    
            <div class="relative w-[80%] mx-auto mt-[0.6em]">
                <div class="flex justify-between items-center gap-[0.5em]">
                    <label class=" whitespace-nowrap" for="name">
                        
                        Asset Name:</label>
                    <input placeholder="Red tree" class=" px-[0.2em] border w-full" type="text" id="name" bind:value={name} />
                </div>
                <div class="mt-[0.2em] flex justify-center items-center gap-[0.5em]">
                    <input id="shareGlobal" type="checkbox" bind:checked={isGlobal} />
                    <label for="shareGlobal">Share asset</label>
                </div>
    
                <button
                onclick={handleSave}
                class="cursor-pointer w-[75%] mx-auto block mt-[1em] bg-black text-white py-[1px]">
                    save
                </button>
            </div>
    
        </div>
    </div>
{/if}

<div class="absolute right-[1em] top-1/2 -translate-y-1/2 space-y-[0.3em]">
    <div class="bg-black p-[1px] space-y-[1px]">
        <button
            onclick={() => {
                closeAllPanels();
                handleToggleAssetPicker()
            }}
            class="{showAssetPicker ? "buttonActive":""} block p-[0.2em] bg-white
            "
        >
            <div class="size-[2em]">
                <img src="/images/icons/assets.svg" class="" alt="" />
            </div>
        </button>
    </div>

    <!-- weather and extras -->
    {#if !isEditor}
        <div class="w-full h-[0.2em] bg-black"></div>
        <div class="bg-black p-[1px] space-y-[1px]">
            <button
                onclick={()=>{
                    closeAllPanels();
                    canvasRef.toggleWeatherEditor()
                }}
                class="{showWeatherEditor ? "buttonActive":""} block p-[0.2em] bg-white
                "
            >
                <div class="size-[2em]">
                    <img src="/images/world/weather.svg" class="" alt="" />
                </div>
            </button>
        </div>
        <div class="bg-black p-[1px] space-y-[1px]">
            <button
                disabled={!canEditSelectedInstance}
                onclick={() => {
                    closeAllPanels();
                    showShadowEditor = !showShadowEditor
                }}
                class="{showShadowEditor ? "buttonActive":""} disabled:opacity-50 block p-[0.2em] bg-white"
            >
                <div class="size-[2em]">
                    <img src="/images/world/shadows.svg" class="" alt="" />
                </div>
            </button>
        </div>
        <div class="bg-black p-[1px] space-y-[1px]">
            <button
                disabled={!canEditSelectedInstance}
                onclick={() => { 
                    closeAllPanels();
                    showLightEditor = !showLightEditor; 
                }}
                class="{showLightEditor ? "buttonActive":""} disabled:opacity-50 block p-[0.2em] bg-white"
            >
                <div class="size-[2em]">
                    <img src="/images/world/light.svg" class="" alt="" />
                </div>
            </button>
        </div>
        <div class="bg-black p-[1px] space-y-[1px]">
            <button
                onclick={() => { 
                    closeAllPanels();
                    showDayNightPanel = !showDayNightPanel; 
                }}
                class="{showDayNightPanel ? "buttonActive":""} block p-[0.2em] bg-white
                "
            >
                <div class="size-[2em]">
                    <img src="/images/world/time.svg" class="" alt="" />
                </div>
            </button>
        </div>

    {:else}

    <!-- draw tools -->

    <div class="w-full h-[0.2em] bg-black"></div>
        <div class="bg-black p-[1px] space-y-[1px]">
            {#each Pointer.modes as mode, i}
                <button
                    onclick={() => (Pointer.current = i)}
                    class="block p-[0.2em] bg-white
                    {Pointer.current === i ? 'buttonActive' : ''}"
                >
                    <div class="size-[2em]">
                        <img src="/images/editor/{mode.image}" class="" alt="" />
                    </div>
                </button>
            {/each}
        </div>

        <!-- save and clear -->

        <div class="w-full h-[0.2em] bg-black"></div>

        <div class="bg-black p-[1px] space-y-[1px]">
            <button
                onclick={handleOpen}
                class="{showExportModal ? "buttonActive" :" "} block p-[0.2em] bg-white
                "
            >
                <div class="size-[2em]">
                    <img src="/images/icons/save.svg" class="" alt="" />
                </div>
            </button>

            <button
                onclick={handleOpenClearConfirmation}
                class="{showClearConfirmationModal ? "buttonActive" :" "} block p-[0.2em] bg-white
                "
            >
                <div class="size-[2em]">
                    <img src="/images/icons/clear.svg" class="" alt="" />
                </div>
            </button>
        </div>
   {/if}
    <div class="w-full h-[0.2em] bg-black"></div>

    <div class="bg-black p-[1px] space-y-[1px]">
        <button
            onclick={() => { showGridLines = !showGridLines }}
            class="block p-[0.2em] bg-white
            {showGridLines ? 'buttonActive' : ''}"
        >
            <div class="size-[2em]">
                <img src="/images/icons/gridline.svg" class="" alt="" />
            </div>
        </button>
        <button
            onclick={() => { showIsoGrid = !showIsoGrid }}
            class="block p-[0.2em] bg-white
            {showIsoGrid ? 'buttonActive' : ''}"
        >
            <div class="size-[2em]">
                <img src="/images/icons/isogridline.svg" class="" alt="" />
            </div>
        </button>
        {#if  !isEditor}
            <button
                onclick={() => { showPlotBoundary = !showPlotBoundary }}
                class="block p-[0.2em] bg-white
                {showPlotBoundary ? 'buttonActive' : ''}"
            >
                <div class="size-[2em]">
                    <img src="/images/icons/boundaries.svg" class="" alt="" />
                </div>
            </button>
        {/if}
    </div>


</div>
