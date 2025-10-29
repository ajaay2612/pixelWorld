<script>
    import { onMount } from 'svelte';
    import { MusicPlayer } from '$lib/stores/MusicPlayer.svelte';
    
    let {isPlaying = $bindable(false)} = $props();
    
    const musicUrl = "/music/bgm.mp3";
    
    export function toggleMusic() {
        if (!MusicPlayer.audioRef) return;
        
        if (MusicPlayer.isPlaying) {
            MusicPlayer.audioRef.pause();
        } else {
            MusicPlayer.audioRef.play().catch(err => {
                console.error('Playback failed:', err);
            });
        }
        MusicPlayer.isPlaying = !MusicPlayer.isPlaying;
        isPlaying = MusicPlayer.isPlaying;
    }
    
    function handleFirstInteraction() {
        if (!MusicPlayer.hasStarted && MusicPlayer.audioRef) {
            MusicPlayer.audioRef.play().catch(err => {
                console.error('Autoplay failed:', err);
            });
            MusicPlayer.isPlaying = true;
            isPlaying = true;
            MusicPlayer.hasStarted = true;
            
            document.removeEventListener('click', handleFirstInteraction);
            document.removeEventListener('touchstart', handleFirstInteraction);
            document.removeEventListener('keydown', handleFirstInteraction);
        }
    }
    
    onMount(() => {
        if (!MusicPlayer.audioRef) {
            MusicPlayer.audioRef = new Audio(musicUrl);
            MusicPlayer.audioRef.volume = 0.05;
            MusicPlayer.audioRef.loop = true;
        }
        
        isPlaying = MusicPlayer.isPlaying;
        
        document.addEventListener('click', handleFirstInteraction);
        document.addEventListener('touchstart', handleFirstInteraction);
        document.addEventListener('keydown', handleFirstInteraction);
        
        return () => {
            document.removeEventListener('click', handleFirstInteraction);
            document.removeEventListener('touchstart', handleFirstInteraction);
            document.removeEventListener('keydown', handleFirstInteraction);
        };
    });
</script>