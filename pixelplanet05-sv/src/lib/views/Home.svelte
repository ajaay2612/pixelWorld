<script>
    let theme = $state("");
    import { InitData } from "$lib/stores/InitData.svelte";
    import { SceneNavigation } from "$lib/stores/SceneNavigation.svelte";


</script>

<div class="text-[0.92em] h-full flex justify-center items-center flex-col w-full bg-[url(/images/bg/background.jpg)]">
    <div class="text-[1.7em] left-1/2 -translate-x-1/2 top-[0.5em] absolute">
        <p>{InitData.value.username|| ""}</p>
    </div>
    
    <div class="w-[49%] mt-2em max-w-[20em]">
        <img class="w-full h-full" src="/images/logo.png" alt="">
    </div>
    
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div onclick={()=>SceneNavigation.active = 2} class="mt-1em relative text-[2.2em] whitespace-nowrap">
        <div class="absolute left-[-1em] top-[.5em] w-[0.5em]">
            <svg  viewBox="0 0 16 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="2" height="2" fill="black"/>
                <rect x="2" width="2" height="2" fill="black"/>
                <rect x="4" y="2" width="2" height="2" fill="black"/>
                <rect x="6" y="2" width="2" height="2" fill="black"/>
                <rect x="8" y="4" width="2" height="2" fill="black"/>
                <rect x="10" y="4" width="2" height="2" fill="black"/>
                <rect x="12" y="6" width="2" height="2" fill="black"/>
                <rect x="14" y="6" width="2" height="2" fill="black"/>
                <rect x="8" y="8" width="2" height="2" fill="black"/>
                <rect x="10" y="8" width="2" height="2" fill="black"/>
                <rect x="4" y="10" width="2" height="2" fill="black"/>
                <rect x="6" y="10" width="2" height="2" fill="black"/>
                <rect y="12" width="2" height="2" fill="black"/>
                <rect x="2" y="12" width="2" height="2" fill="black"/>
            </svg>

        </div>
        
        Create Your World
    </div>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div onclick={()=>SceneNavigation.active = 3} class="relative text-[2.2em] whitespace-nowrap">
        <div class="absolute left-[-1em] top-[.5em] w-[0.5em]">
            <svg  viewBox="0 0 16 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="2" height="2" fill="black"/>
                <rect x="2" width="2" height="2" fill="black"/>
                <rect x="4" y="2" width="2" height="2" fill="black"/>
                <rect x="6" y="2" width="2" height="2" fill="black"/>
                <rect x="8" y="4" width="2" height="2" fill="black"/>
                <rect x="10" y="4" width="2" height="2" fill="black"/>
                <rect x="12" y="6" width="2" height="2" fill="black"/>
                <rect x="14" y="6" width="2" height="2" fill="black"/>
                <rect x="8" y="8" width="2" height="2" fill="black"/>
                <rect x="10" y="8" width="2" height="2" fill="black"/>
                <rect x="4" y="10" width="2" height="2" fill="black"/>
                <rect x="6" y="10" width="2" height="2" fill="black"/>
                <rect y="12" width="2" height="2" fill="black"/>
                <rect x="2" y="12" width="2" height="2" fill="black"/>
            </svg>

        </div>
        
        Join a Theme
    </div>
</div>
