export const Pointer = $state({
    modes: [
        { name: "fill", image:"pencil.svg" },
        { name: "erase", image:"eraser.svg" },
        { name: "rect", image:"selection.svg" },
        { name: "eye dropper", image:"eyeDropper.svg" },
        { name: "line tool", image:"line.svg" },     
    ],
    current: 0,
    colorTools: [0, 1, 4], 
    get shouldUseSelectedColor() {
        return this.colorTools.includes(this.current);
    }
});