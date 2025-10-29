<script>
    let theme = $state("");
    import { InitData } from "$lib/stores/InitData.svelte";
    import { showToast, navigateTo } from '@devvit/web/client';
    import { SceneNavigation } from "$lib/stores/SceneNavigation.svelte";


    async function handleCreate(e) {
        e.preventDefault();
        if (!theme.trim()) {
            console.log("Please enter a theme");
            return;
        }
        
        try {
            const response = await fetch("/api/create-theme", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ theme }),
            });
            
            const data = await response.json();
            

            console.log(data);

            if (data.status === "success") {
                console.log("Theme created successfully!");

                // Show success toast
                showToast({
                    text: `Theme "${theme.trim()}" created successfully!`,
                    appearance: 'success'
                });
                
                // Navigate to the new post
                setTimeout(() => {
                    navigateTo(data.navigateTo);
                }, 500);

            } else {
                console.error(data?.message || "Failed to create theme");
            }
        } catch (error) {
            console.error("Error creating theme:", error);
            console.error("An error occurred while creating the theme");
        }
    }
</script>

<div class="text-[0.92em] h-full w-full bg-[url(/images/bg/background.jpg)]">
    <div class="text-[1.7em] left-1/2 -translate-x-1/2 top-[0.5em] absolute">
        <p>{InitData.value.username|| ""}</p>
    </div>
    
    
    <div class="bg-white fixedCenter z-[50] w-[19em] p-[0.4em] border">
        
        <div class="gap-[0.5em] absolute top-[-2.2em] text-[2.2em] whitespace-nowrap left-1/2 -translate-x-1/2">
            
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
        
        <div class="p-[1.5em] border relative">
            <!-- svelte-ignore a11y_consider_explicit_label -->
            <div class="absolute top-0 left-0 flex justify-end w-full p-[0.65em]">
                <button
                    onclick={()=>SceneNavigation.active = 4}
                    class="cursor-pointer w-[0.8em] mb-1em"
                >
                    <svg
                        viewBox="0 0 12 12"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M1.5 10.5V11.5H0.5V10.5H1.5ZM3.5 8.5V9.5H2.5V8.5H3.5ZM5.5 6.5V7.5H4.5V6.5H5.5ZM7.5 4.5V5.5H6.5V4.5H7.5ZM9.5 2.5V3.5H8.5V2.5H9.5ZM11.5 0.5V1.5H10.5V0.5H11.5Z"
                            stroke="black"
                        />
                        <path
                            d="M1.5 1.5H0.5V0.5L1.5 0.5V1.5ZM3.5 3.5L2.5 3.5V2.5L3.5 2.5V3.5ZM5.5 5.5H4.5V4.5H5.5V5.5ZM7.5 7.5H6.5V6.5H7.5V7.5ZM9.5 9.5H8.5V8.5H9.5V9.5ZM11.5 11.5H10.5V10.5H11.5V11.5Z"
                            stroke="black"
                        />
                    </svg>
                </button>
            </div>
    
            <form onsubmit={handleCreate} class="relative w-[70%] mx-auto mt-[0.6em]">
                <div class="space-y-[0.2em]">
                    <label
                        class="text-center mx-auto block whitespace-nowrap"
                        for="name"
                    >
                        Set a Theme:</label
                    >
                    <input
                        placeholder="Snowyy planet"
                        class="text-center px-[0.2em] border w-full"
                        type="text"
                        id="name"
                        required
                        bind:value={theme}
                    />
                </div>
    
                <button
                    type="submit"
                    class="cursor-pointer w-[65%] mx-auto block mt-[1em] bg-black text-white py-[1px]"
                >
                    Create
                </button>
            </form>
        </div>
    </div>
</div>
