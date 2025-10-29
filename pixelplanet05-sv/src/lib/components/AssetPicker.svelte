<script>
    import { Assets } from '$lib/stores/Assets.svelte.js'
    import { GlobalAssets } from '$lib/stores/GlobalAssets.svelte'
    import Block from "$lib/components/Block.svelte";
    import { SceneNavigation } from '$lib/stores/SceneNavigation.svelte' // adjust path as needed
    import { EditorState } from '$lib/stores/EditorState.svelte' // adjust path
    import { onMount } from 'svelte';


    let {placeBlockInCenter, showAssetPicker=$bindable(), editMode} = $props();
    
    let perPageAssets = $state(10);


    let currentPage = $state(1);
    let pagination = $state(null);
    let isLoading = $state(false);
    let displayAssets = $state([]);

    let assetType = [
        {name:"Local"},
        {name:"Global"},
    ]
    let currentAssetType = $state(0);

    async function loadPage(page) {
        const requestedType = currentAssetType;
        
        isLoading = true;
        currentPage = page;
        
        const currentAssets = currentAssetType === 0 ? Assets.blocks : GlobalAssets.blocks;
        const startIndex = (page - 1) * perPageAssets;

        // Check if we already have this data
        if (currentAssets && currentAssets[startIndex]) {
            displayAssets = currentAssets.slice(startIndex, startIndex + perPageAssets);
            pagination = currentAssetType === 0 ? Assets.pagination : GlobalAssets.pagination; // Add this
            isLoading = false;
            return;
        }

        if (requestedType === 0) {
            const { assets, pagination: pag } = await fetchUserAssets(page, perPageAssets);
            if (requestedType === currentAssetType) {
                const startIndex = (page - 1) * perPageAssets;
                if (!Assets.blocks) Assets.blocks = [];
                assets.forEach((asset, i) => {
                    Assets.blocks[startIndex + i] = asset;
                });
                Assets.pagination = pag;
                pagination = pag;
            }
        } else {
            const { assets, pagination: pag } = await fetchGlobalAssets(page, perPageAssets);
            if (requestedType === currentAssetType) {
                const startIndex = (page - 1) * perPageAssets;
                if (!GlobalAssets.blocks) GlobalAssets.blocks = [];
                assets.forEach((asset, i) => {
                    GlobalAssets.blocks[startIndex + i] = asset;
                });
                GlobalAssets.pagination = pag;
                pagination = pag;
            }
        }
        
        const updatedAssets = currentAssetType === 0 ? Assets.blocks : GlobalAssets.blocks;
        const idx = (page - 1) * perPageAssets;
        displayAssets = updatedAssets.slice(idx, idx + perPageAssets);

        isLoading = false;
    }

    // Helper to get visible page numbers
    function getVisiblePages() {
        if (!pagination) return [];
        
        const total = pagination.totalPages;
        const current = currentPage;
        
        let pages = [];
        
        // Add previous page if exists
        if (current > 1) {
            pages.push(current - 1);
        }
        
        // Always show current page
        pages.push(current);
        
        // Add next page if exists
        if (current < total) {
            pages.push(current + 1);
        }
        
        return pages;
    }

    // Add this new helper
    function shouldShowEllipsis() {
        if (!pagination) return false;
        return currentPage < pagination.totalPages - 1;
    }

    async function fetchUserAssets(page, limit) {
        try {
            const response = await fetch(`/api/get-assets?scope=user&page=${page}&limit=${limit}`);
            const data = await response.json();
            
            if (data.status === 'success') {
                return {
                    assets: data.assets,
                    pagination: data.pagination
                };
            }
            return { assets: [], pagination: null };
        } catch (error) {
            console.error('Error fetching user assets:', error);
            return { assets: [], pagination: null };
        }
    }

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

    // Load initial page
    // $effect(() => {
    //     const currentAssets = currentAssetType === 0 ? Assets.blocks : GlobalAssets.blocks;
    //     const currentPagination = currentAssetType === 0 ? Assets.pagination : GlobalAssets.pagination;
        
    //     if (!currentAssets || currentAssets.length === 0) {
    //         if (!isLoading) {  // Add this check
    //             loadPage(1);
    //         }
    //     } else {
    //         // Use cached data
    //         pagination = currentPagination;
    //         const startIndex = (currentPage - 1) * perPageAssets;
    //         displayAssets = currentAssets.slice(startIndex, startIndex + perPageAssets);
    //     }
    // });

    onMount(async () => {
        await loadPage(1);
        // Check for new user assets
        const { assets: latestUserAssets } = await fetchUserAssets(1, perPageAssets);
        const currentUserAssets = Assets.blocks || [];
        
        if (latestUserAssets.length > 0 && 
            (currentUserAssets.length === 0 || 
            latestUserAssets[0].id !== currentUserAssets[0].id)) {
            // New user asset detected
            if (currentAssetType === 0) {
                loadPage(1);
            } else {
                // Update cache for when user switches back
                Assets.blocks = [];
                Assets.pagination = null;
            }
        }
        
        // Check for new global assets
        const { assets: latestGlobalAssets } = await fetchGlobalAssets(1, perPageAssets);
        const currentGlobalAssets = GlobalAssets.blocks || [];
        
        if (latestGlobalAssets.length > 0 && 
            (currentGlobalAssets.length === 0 || 
            latestGlobalAssets[0].id !== currentGlobalAssets[0].id)) {
            // New global asset detected
            if (currentAssetType === 1) {
                loadPage(1);
            } else {
                // Update cache for when user switches
                GlobalAssets.blocks = [];
                GlobalAssets.pagination = null;
            }
        }
    });

    function truncate(str, maxLength = 13) {
        if (!str) return '';
        if (str.length <= maxLength) return str;
        return str.slice(0, maxLength) + '...';
    }

</script>

<div class="border bg-white fixedCenter p-[0.4em] z-[49] flex flex-col h-[80%]">
    <div class="flex p-[0.2em]">
        <p class="text-[1.3em] leading-[0.9em]">Assets</p>
        <!-- svelte-ignore a11y_consider_explicit_label -->
        <button onclick={()=>{showAssetPicker = false}} class="ml-auto block w-fit cursor-pointer py-[2px]">
            <div class=" w-[1em]">
                <svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1.5 10.5V11.5H0.5V10.5H1.5ZM3.5 8.5V9.5H2.5V8.5H3.5ZM5.5 6.5V7.5H4.5V6.5H5.5ZM7.5 4.5V5.5H6.5V4.5H7.5ZM9.5 2.5V3.5H8.5V2.5H9.5ZM11.5 0.5V1.5H10.5V0.5H11.5Z" stroke="black"/>
                    <path d="M1.5 1.5H0.5V0.5L1.5 0.5V1.5ZM3.5 3.5L2.5 3.5V2.5L3.5 2.5V3.5ZM5.5 5.5H4.5V4.5H5.5V5.5ZM7.5 7.5H6.5V6.5H7.5V7.5ZM9.5 9.5H8.5V8.5H9.5V9.5ZM11.5 11.5H10.5V10.5H11.5V11.5Z" stroke="black"/>
                </svg>
            </div>
        </button>
    </div>
    <div class="bg-black gap-[1px] border-t border-x grid grid-cols-2 w-full">
        {#each assetType as type, i}
            <button 
            onclick={() => {
                currentAssetType = i;
                currentPage = 1;
                pagination = null; 
                loadPage(1);
            }}

            class=" {currentAssetType == i ?"bg-black text-white":"bg-white text-black"} text-center py-[0.2em] w-full">
                {type.name}
            </button>
        {/each}
    </div>
    <div class="p-[0.4em] overflow-y-auto h-full border ">
        {#if isLoading}
            <div class="w-[15em] flex h-full justify-center items-center">
                loading...
            </div>
        {:else if displayAssets.length === 0}
            <div class="w-[15em] flex h-full justify-center items-center text-gray-500">
                No assets made yet
            </div>
        {:else}
            <div class="w-[15em] content-baseline grid grid-cols-2 gap-[0.4em]">
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                {#key displayAssets}
                    {#each displayAssets as asset}
                        <!-- svelte-ignore a11y_click_events_have_key_events -->
                        <div class="">
                            <div onclick={()=> {placeBlockInCenter(asset), showAssetPicker = false }}  class="border p-1em">
                                <div class=" w-full">
                                    <Block
                                        {asset}
                                    />
                                </div>
                            </div>
                            {#if asset?.name}
                                <div class="bg-black text-white text-center py-[0.2em]">
                                    <p class="text-[1em] leading-[0.9em]">{truncate(asset?.name)}</p>
                                </div>
                            {/if}
                            {#if !editMode}
                                <button 
                                onclick={() => {
                                    EditorState.assetToPlace = asset;
                                    SceneNavigation.active = 1;
                                }}
                                class="py-[0.25em] leading-[0.9em] mt-[0.4em] px-[1em] bg-[#C7C7C7] border">Edit</button>
                            {/if}
                        </div>
                    {/each}
                {/key}
            </div>
        {/if}
    </div>
    {#if pagination && pagination.totalPages > 1}
        <div class="flex items-center justify-center gap-[0.5em] pt-[0.4em] border-t">
            <button 
                onclick={() => loadPage(currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
                class="w-[2em] flex justify-center items-center border bg-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
                ←
            </button>
            
            <div class="flex gap-[0.2em]">
                {#each getVisiblePages() as page}
                    <button 
                        onclick={() => loadPage(page)}
                        disabled={isLoading}
                        class="w-[2em] flex justify-center items-center border {currentPage === page ? 'bg-black text-white' : 'bg-white'}"
                    >
                        {page}
                    </button>
                {/each}
                {#if shouldShowEllipsis()}
                    <span class="w-[1.5em] flex justify-center items-center">...</span>
                {/if}
            </div>
       

            <button 
                onclick={() => loadPage(currentPage + 1)}
                disabled={currentPage === pagination.totalPages || isLoading}
                class="w-[2em] flex justify-center items-center border bg-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
                →
            </button>
        </div>
        
        <!-- <div class="text-center text-[0.8em] text-gray-600 pb-[0.2em]">
            Page {currentPage} of {pagination.totalPages} • {pagination.showing} of {pagination.total} assets
        </div> -->
    {/if}
</div>