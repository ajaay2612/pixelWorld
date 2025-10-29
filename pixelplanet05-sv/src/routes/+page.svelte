<script>
    import { Assets } from "$lib/stores/Assets.svelte.js";
    import { GlobalAssets } from "$lib/stores/GlobalAssets.svelte.js";
    import { InitData } from "$lib/stores/InitData.svelte";
    import { onMount } from "svelte";
    // import assetsData from '$lib/assets.json';
    import { SceneNavigation } from "$lib/stores/SceneNavigation.svelte";
    import { fade, scale } from "svelte/transition";
    import { context } from '@devvit/web/client';
    import { showToast, navigateTo } from '@devvit/web/client';

    const RenderComponent = $derived.by(() => {
        return SceneNavigation.all[SceneNavigation.active]?.component;
    });

    // $inspect(RenderComponent)
    // onMount(() => {
    //     Assets.blocks = assetsData?.blocks ;
    // });

    let logData = $state("");

    let isLoading = $state(true)

    // async function fetchUserAssets(page = 1, limit = 20) {
    //     try {
    //         const response = await fetch(`/api/get-assets?scope=user&page=${page}&limit=${limit}`);
    //         const data = await response.json();
            
    //         if (data.status === 'success') {
    //             return {
    //                 assets: data.assets,
    //                 pagination: data.pagination
    //             };
    //         }
    //         return { assets: [], pagination: null };
    //     } catch (error) {
    //         console.error('Error fetching user assets:', error);
    //         return { assets: [], pagination: null };
    //     }
    // }

    async function fetchGlobalAssets(page, limit) {
        try {
            const response = await fetch(`/api/get-assets?scope=global&page=${page}&limit=${limit}`);
            const data = await response.json();
            
            if (data.status === 'success') {
                return {
                    assets: data.assets,
                    pagination: data.pagination
                };
            }
            return { assets: [], pagination: null };
        } catch (error) {
            console.error('Error fetching global assets:', error);
            return { assets: [], pagination: null };
        }
    }

    onMount(async () => {
        try {
            const response = await fetch("/api/init");
            logData = await response.json();
            InitData.value.postId = logData?.postId;
            InitData.value.username = logData?.username;
            InitData.value.userPlot = logData?.userPlot;
            InitData.value.allPlots = logData?.allPlots || [];
            InitData.value.plotConfig = logData?.plotConfig|| {};

            console.log("context.postData", context?.postData?.showHome)

            // const fetchGlobalAssetsdata = await fetchGlobalAssets(1, 50);

            // console.log("fetchGlobalAssetsdata",fetchGlobalAssetsdata)

            if(context?.postData?.goto){
                console.log("goto", context?.postData?.goto)
  
                navigateTo(context?.postData?.goto)
                return
            }

            if(context?.postData?.showHome){
                SceneNavigation.active = 4
            }else{
                SceneNavigation.active = 0          
            }

            // const { assets, pagination } = await fetchUserAssets(1, 20);
            // Assets.blocks = assets || []
            
            // const { glAssets, glPagination } = await fetchGlobalAssets(1, 20);
            // GlobalAssets.blocks =  glAssets || []

            isLoading = false
        } catch (error) {
            console.error("Failed to initialize:", error);
        }
    });

    let showHelper = $state(false);
</script>

{#if isLoading}
    <div class="text-[1.1em] sm:text-[1.25em] lg:text-[1.5em] bg-[url(/images/bg/background.jpg)] flex justify-center items-center h-full w-full">
        <div class="text-[1.2em]">Loading...</div>
    </div>
{:else}
    <div class="w-full relative h-svh text-[1.05em] sm:text-[1.05em] lg:text-[1.2em]">
        {#if RenderComponent}
            {#key RenderComponent}
                <div in:fade={{ duration: 200 }} class="h-full w-full">
                    <RenderComponent />
                </div>
            {/key}
        {/if}
    </div>

    {#if SceneNavigation.all[SceneNavigation.active].name == "Editor" || SceneNavigation.all[SceneNavigation.active].name == "World" }
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="text-[1.1em] sm:text-[1.25em] lg:text-[1.5em] absolute right-1em top-1em border">
            {#each SceneNavigation.all as scene, i}
                {#if scene.name == "Editor" || scene.name == "World" }
                    <button
                        onclick={() => {
                            SceneNavigation.active = i;
                        }}
                        class="pointer-events-auto py-[0.1em] px-[1em]
                        {SceneNavigation.active == i ? 'bg-black text-white' : 'bg-[#f8f8f8]'}"
                        >{scene.name}</button
                    >
                {/if}
            {/each}


            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <div 
            onclick={()=>{showHelper = true}}
            class="bg-black text-center text-white w-[1.7em] py-[0.1em] absolute top-1/2 -translate-y-1/2 left-[-2em]">
                ?
            </div>
              
            
        </div>
        {/if}
{/if}
        
        
{#if showHelper}
    <div class="fixedCenter z-[50] bg-white w-[90%] p-[0.4em] border">
        <div class="p-[1.5em] border relative">
    
            <!-- svelte-ignore a11y_consider_explicit_label -->
            <button onclick={()=>{showHelper = false}} class="cursor-pointer absolute top-[0.5em] right-[0.5em] w-[0.8em] mb-1em">
                <svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1.5 10.5V11.5H0.5V10.5H1.5ZM3.5 8.5V9.5H2.5V8.5H3.5ZM5.5 6.5V7.5H4.5V6.5H5.5ZM7.5 4.5V5.5H6.5V4.5H7.5ZM9.5 2.5V3.5H8.5V2.5H9.5ZM11.5 0.5V1.5H10.5V0.5H11.5Z" stroke="black"/>
                    <path d="M1.5 1.5H0.5V0.5L1.5 0.5V1.5ZM3.5 3.5L2.5 3.5V2.5L3.5 2.5V3.5ZM5.5 5.5H4.5V4.5H5.5V5.5ZM7.5 7.5H6.5V6.5H7.5V7.5ZM9.5 9.5H8.5V8.5H9.5V9.5ZM11.5 11.5H10.5V10.5H11.5V11.5Z" stroke="black"/>
                </svg>  
            </button>
    
            <div class="w-[90%] max-h-[80svh] overflow-y-auto mx-auto mt-[0.3em]">
                <p class="text-center leading-[1em] text-[1.2em]">How to Play</p>
    
                <div class="mt-[1.5em] pb-2em space-y-[0.5em]">
                    <p>🖐 Move Around Use two fingers on the screen to pan across your world.</p>
                    <p>📦 Access Assets Tap the first icon on the right to open your Local or Global assets. Drag and drop trees, houses, or any design you like into your world.</p>
                    <p>🌤 Weather & Lighting Use the bottom controls to adjust light, shadows, and weather add rain, snow, or sunlight to bring your world to life.</p>
                    <p>🎨 Create Your Own Assets Switch between World and Editor modes to design your own creations from scratch. Use the pixel tools pencil, eraser, line, eyedropper, and selection to build anything you imagine.</p>
                    <p>💾 Save or Share Save your asset locally or share it globally so others can use it too!</p>
                </div>
            </div>
    
        </div>
    </div>
    
{/if}

<!-- <pre
    class="text-[0.8em] bg-gray-200 text-black p-0hem rounded overflow-auto max-h-[20em]">
    output: 
    {JSON.stringify(logData, null, 2)}
    GlobalAssets:
    {JSON.stringify(GlobalAssets, null, 2)}
    userAssets:
    {JSON.stringify(Assets, null, 2)}
</pre> -->
