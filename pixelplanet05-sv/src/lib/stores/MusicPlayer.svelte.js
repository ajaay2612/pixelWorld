let audioRef = $state(null);
let isPlaying = $state(false);
let hasStarted = $state(false);

export const MusicPlayer = {
    get audioRef() { return audioRef; },
    set audioRef(value) { audioRef = value; },
    get isPlaying() { return isPlaying; },
    set isPlaying(value) { isPlaying = value; },
    get hasStarted() { return hasStarted; },
    set hasStarted(value) { hasStarted = value; }
};