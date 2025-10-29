import Editor from '$lib/views/Editor.svelte'
import World from "$lib/views/World.svelte";
import CreateWorld from "$lib/views/CreateWorld.svelte";
import JoinWorld from "$lib/views/JoinWorld.svelte";
import Home from "$lib/views/Home.svelte";

export const SceneNavigation = $state({
    all: [
        {name:"World" , component: World},
        {name:"Editor" , component: Editor},
        {name:"CreateWorld" , component: CreateWorld},
        {name:"JoinWorld" , component: JoinWorld},
        {name:"home" , component: Home},
    ],
    active: 0
});
