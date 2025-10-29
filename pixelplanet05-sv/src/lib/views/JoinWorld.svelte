<script>
    import { InitData } from "$lib/stores/InitData.svelte";
    import { showToast, navigateTo } from '@devvit/web/client';
    import { onMount } from "svelte";
    import { SceneNavigation } from "$lib/stores/SceneNavigation.svelte";

    let themes = $state([ ]);
    let loading = $state(true);
    let error = $state(null);
    let subredditName = $state("");
    onMount(async () => {
        try {
            loading = true;
            const response = await fetch("/api/themes");
            const data = await response.json();
            
            if (data.status === "success") {
                themes = data.themes;
                subredditName = data.subredditName;
            } else {
                error = data.message || "Failed to load themes";
            }
        } catch (err) {
            console.error("Error fetching themes:", err);
            error = "An error occurred while loading themes";
        } finally {
            loading = false;
        }
    });
</script>

<div class="text-[0.92em] h-full w-full bg-[url(/images/bg/background.jpg)]">
    <div class="text-[1.7em] left-1/2 -translate-x-1/2 top-[0.5em] absolute">
        <p>{InitData.value.username|| ""}</p>
    </div>
    
    
    <div class="bg-white fixedCenter z-[50] w-[21em] border h-[70%] flex flex-col">
        
   
        
        <div class="p-[0.4em] ">
            <div class="bg-black text-white flex justify-between items-center px-[0.8em] py-[0.4em] border relative">
                <p class="text-[1.12em]">Explore what others are building</p>
                <!-- svelte-ignore a11y_consider_explicit_label -->
                <button
                    onclick={()=>SceneNavigation.active = 4}
                    class="cursor-pointer w-[0.8em]"
                >
                    <svg
                        viewBox="0 0 12 12"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M1.5 10.5V11.5H0.5V10.5H1.5ZM3.5 8.5V9.5H2.5V8.5H3.5ZM5.5 6.5V7.5H4.5V6.5H5.5ZM7.5 4.5V5.5H6.5V4.5H7.5ZM9.5 2.5V3.5H8.5V2.5H9.5ZM11.5 0.5V1.5H10.5V0.5H11.5Z"
                            stroke="#fff"
                        />
                        <path
                            d="M1.5 1.5H0.5V0.5L1.5 0.5V1.5ZM3.5 3.5L2.5 3.5V2.5L3.5 2.5V3.5ZM5.5 5.5H4.5V4.5H5.5V5.5ZM7.5 7.5H6.5V6.5H7.5V7.5ZM9.5 9.5H8.5V8.5H9.5V9.5ZM11.5 11.5H10.5V10.5H11.5V11.5Z"
                            stroke="#fff"
                        />
                    </svg>
                </button>
            </div>
        </div>
        <div class="border-t overflow-y-auto flex-1">
            {#if loading}
                <p class="text-center px-1em mt-1em ">Loading themes...</p>
            {:else if error}
                <p class="text-center px-1em mt-1em error">{error}</p>
            {:else if themes.length === 0}
                <p class="text-center px-1em mt-1em ">No themes created yet</p>
            {:else}
                <div class="">
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    {#each themes as theme}
                        <!-- svelte-ignore a11y_click_events_have_key_events -->
                        <div 
                        class="hover:bg-light-grey border-b px-1em py-[0.1em] flex justify-between items-center"
                        onclick={navigateTo(`https://reddit.com/r/${subredditName}/comments/${theme.postId}`)}>
                            <p>u/{theme.creator}</p>
                            <p>{theme.title}</p>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
        <div class="px-[3em] py-[0.1em] bg-black flex justify-end items-center gap-[0.5em] text-white">
            <div class="w-[0.8em]">
                <svg viewBox="0 0 11 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5.88 4.24C5.912 4.368 5.928 4.528 5.928 4.72C5.928 4.904 5.912 5.064 5.88 5.2C5.912 5.328 5.928 5.488 5.928 5.68C5.928 5.864 5.912 6.024 5.88 6.16C5.912 6.288 5.928 6.448 5.928 6.64C5.928 6.824 5.912 6.984 5.88 7.12C5.912 7.248 5.928 7.408 5.928 7.6C5.928 7.784 5.912 7.944 5.88 8.08H4.92C4.888 7.944 4.872 7.784 4.872 7.6C4.872 7.408 4.888 7.248 4.92 7.12C4.888 6.984 4.872 6.824 4.872 6.64C4.872 6.448 4.888 6.288 4.92 6.16C4.888 6.024 4.872 5.864 4.872 5.68C4.872 5.488 4.888 5.328 4.92 5.2C4.888 5.064 4.872 4.904 4.872 4.72C4.872 4.528 4.888 4.368 4.92 4.24C4.888 4.104 4.872 3.944 4.872 3.76C4.872 3.568 4.888 3.408 4.92 3.28H5.88C5.912 3.408 5.928 3.568 5.928 3.76C5.928 3.944 5.912 4.104 5.88 4.24ZM5.88 9.04C5.912 9.168 5.928 9.328 5.928 9.52C5.928 9.704 5.912 9.864 5.88 10H4.92C4.888 9.864 4.872 9.704 4.872 9.52C4.872 9.328 4.888 9.168 4.92 9.04H5.88Z" fill="white"/>
                    <circle cx="5.5" cy="6.5" r="5" stroke="white"/>
                </svg>
            </div>
            <p class="text-[0.9em]">Click to visit</p>
        </div>
    </div>
</div>
