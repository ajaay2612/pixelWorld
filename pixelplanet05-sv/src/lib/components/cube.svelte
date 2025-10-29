<script>

    const gridSize = 16;
    const blocks = Array.from({ length: gridSize * gridSize }, (_, i) => ({
        id: i,
        x: i % gridSize,
        y: Math.floor(i / gridSize),
    }));


    let cube = [
  // Y=0 (top peak)
  { x: 7, y: 0, color: '#73b859' },
  { x: 8, y: 0, color: '#75b85b' },
  
  // Y=1
  { x: 6, y: 1, color: '#70b857' },
  { x: 7, y: 1, color: '#72b859' },
  { x: 8, y: 1, color: '#74b85b' },
  { x: 9, y: 1, color: '#76ba5d' },
  
  // Y=2
  { x: 4, y: 2, color: '#6eb356' },
  { x: 5, y: 2, color: '#70b557' },
  { x: 6, y: 2, color: '#72b758' },
  { x: 7, y: 2, color: '#74b959' },
  { x: 8, y: 2, color: '#76bb5b' },
  { x: 9, y: 2, color: '#78bd5d' },
  { x: 10, y: 2, color: '#7abf5f' },
  { x: 11, y: 2, color: '#7cc161' },
  
  // Y=3
  { x: 3, y: 3, color: '#6bb055' },
  { x: 4, y: 3, color: '#6db256' },
  { x: 5, y: 3, color: '#6fb457' },
  { x: 6, y: 3, color: '#71b658' },
  { x: 7, y: 3, color: '#73b859' },
  { x: 8, y: 3, color: '#75ba5b' },
  { x: 9, y: 3, color: '#77bc5c' },
  { x: 10, y: 3, color: '#79be5e' },
  { x: 11, y: 3, color: '#7bc060' },
  { x: 12, y: 3, color: '#7dc262' },
  
  // Y=4
  { x: 1, y: 4, color: '#66a552' },
  { x: 2, y: 4, color: '#68a753' },
  { x: 3, y: 4, color: '#6aa954' },
  { x: 4, y: 4, color: '#6cab55' },
  { x: 5, y: 4, color: '#6ead56' },
  { x: 6, y: 4, color: '#70af57' },
  { x: 7, y: 4, color: '#72b158' },
  { x: 8, y: 4, color: '#74b359' },
  { x: 9, y: 4, color: '#76b55a' },
  { x: 10, y: 4, color: '#78b75c' },
  { x: 11, y: 4, color: '#7ab95d' },
  { x: 12, y: 4, color: '#7cbb5f' },
  { x: 13, y: 4, color: '#7ebd60' },
  { x: 14, y: 4, color: '#80bf62' },
  
  // Y=5 (full width - grass top with edge shading)
  { x: 0, y: 5, color: '#2b3044' },
  { x: 1, y: 5, color: '#5f9c50' },
  { x: 2, y: 5, color: '#619e51' },
  { x: 3, y: 5, color: '#63a052' },
  { x: 4, y: 5, color: '#65a253' },
  { x: 5, y: 5, color: '#67a454' },
  { x: 6, y: 5, color: '#69a655' },
  { x: 7, y: 5, color: '#6ba856' },
  { x: 8, y: 5, color: '#6daa57' },
  { x: 9, y: 5, color: '#6fac58' },
  { x: 10, y: 5, color: '#71ae59' },
  { x: 11, y: 5, color: '#73b05a' },
  { x: 12, y: 5, color: '#75b25b' },
  { x: 13, y: 5, color: '#77b45c' },
  { x: 14, y: 5, color: '#79b65d' },
  { x: 15, y: 5, color: '#7c4042' },
  
  // Y=6 (full width - grass with side transitions)
  { x: 0, y: 6, color: '#2b3044' },
  { x: 1, y: 6, color: '#5d9a4f' },
  { x: 2, y: 6, color: '#5f9c50' },
  { x: 3, y: 6, color: '#619e51' },
  { x: 4, y: 6, color: '#63a052' },
  { x: 5, y: 6, color: '#65a253' },
  { x: 6, y: 6, color: '#67a454' },
  { x: 7, y: 6, color: '#69a655' },
  { x: 8, y: 6, color: '#6ba856' },
  { x: 9, y: 6, color: '#6daa57' },
  { x: 10, y: 6, color: '#6fac58' },
  { x: 11, y: 6, color: '#71ae59' },
  { x: 12, y: 6, color: '#73b05a' },
  { x: 13, y: 6, color: '#75b25b' },
  { x: 14, y: 6, color: '#77b45c' },
  { x: 15, y: 6, color: '#7c4042' },
  
  // Y=7 (full width - transitioning to darker)
  { x: 0, y: 7, color: '#2b3044' },
  { x: 1, y: 7, color: '#5b984e' },
  { x: 2, y: 7, color: '#5d9a4f' },
  { x: 3, y: 7, color: '#5f9c50' },
  { x: 4, y: 7, color: '#619e51' },
  { x: 5, y: 7, color: '#63a052' },
  { x: 6, y: 7, color: '#65a253' },
  { x: 7, y: 7, color: '#67a454' },
  { x: 8, y: 7, color: '#69a655' },
  { x: 9, y: 7, color: '#6ba856' },
  { x: 10, y: 7, color: '#6daa57' },
  { x: 11, y: 7, color: '#6fac58' },
  { x: 12, y: 7, color: '#71ae59' },
  { x: 13, y: 7, color: '#73b05a' },
  { x: 14, y: 7, color: '#75b25b' },
  { x: 15, y: 7, color: '#7c4042' },
  
  // Y=8 (full width - more dirt/brown showing)
  { x: 0, y: 8, color: '#2b3044' },
  { x: 1, y: 8, color: '#59964d' },
  { x: 2, y: 8, color: '#5a244b' },
  { x: 3, y: 8, color: '#5c264d' },
  { x: 4, y: 8, color: '#5e284f' },
  { x: 5, y: 8, color: '#602a51' },
  { x: 6, y: 8, color: '#622c53' },
  { x: 7, y: 8, color: '#642e55' },
  { x: 8, y: 8, color: '#663057' },
  { x: 9, y: 8, color: '#683259' },
  { x: 10, y: 8, color: '#6a345b' },
  { x: 11, y: 8, color: '#6c365d' },
  { x: 12, y: 8, color: '#6e385f' },
  { x: 13, y: 8, color: '#703a61' },
  { x: 14, y: 8, color: '#723c63' },
  { x: 15, y: 8, color: '#7c4042' },
  
  // Y=9 (full width - predominantly dirt colors)
  { x: 0, y: 9, color: '#2b3044' },
  { x: 1, y: 9, color: '#57944c' },
  { x: 2, y: 9, color: '#58224a' },
  { x: 3, y: 9, color: '#5a244c' },
  { x: 4, y: 9, color: '#5c264e' },
  { x: 5, y: 9, color: '#5e2850' },
  { x: 6, y: 9, color: '#602a52' },
  { x: 7, y: 9, color: '#622c54' },
  { x: 8, y: 9, color: '#642e56' },
  { x: 9, y: 9, color: '#663058' },
  { x: 10, y: 9, color: '#68325a' },
  { x: 11, y: 9, color: '#6a345c' },
  { x: 12, y: 9, color: '#6c365e' },
  { x: 13, y: 9, color: '#6e3860' },
  { x: 14, y: 9, color: '#703a62' },
  { x: 15, y: 9, color: '#7c4042' },
  
  // Y=10 (full width - dirt/brown base)
  { x: 0, y: 10, color: '#2b3044' },
  { x: 1, y: 10, color: '#55924b' },
  { x: 2, y: 10, color: '#562049' },
  { x: 3, y: 10, color: '#58224b' },
  { x: 4, y: 10, color: '#5a244d' },
  { x: 5, y: 10, color: '#5c264f' },
  { x: 6, y: 10, color: '#5e2851' },
  { x: 7, y: 10, color: '#602a53' },
  { x: 8, y: 10, color: '#622c55' },
  { x: 9, y: 10, color: '#642e57' },
  { x: 10, y: 10, color: '#663059' },
  { x: 11, y: 10, color: '#68325b' },
  { x: 12, y: 10, color: '#6a345d' },
  { x: 13, y: 10, color: '#6c365f' },
  { x: 14, y: 10, color: '#6e3861' },
  { x: 15, y: 10, color: '#7c4042' },
  
  // Y=11 (tapering inward)
  { x: 1, y: 11, color: '#53904a' },
  { x: 2, y: 11, color: '#541e48' },
  { x: 3, y: 11, color: '#56204a' },
  { x: 4, y: 11, color: '#58224c' },
  { x: 5, y: 11, color: '#5a244e' },
  { x: 6, y: 11, color: '#5c2650' },
  { x: 7, y: 11, color: '#5e2852' },
  { x: 8, y: 11, color: '#602a54' },
  { x: 9, y: 11, color: '#622c56' },
  { x: 10, y: 11, color: '#642e58' },
  { x: 11, y: 11, color: '#66305a' },
  { x: 12, y: 11, color: '#68325c' },
  { x: 13, y: 11, color: '#6a345e' },
  { x: 14, y: 11, color: '#6c3660' },
  
  // Y=12
  { x: 3, y: 12, color: '#518e49' },
  { x: 4, y: 12, color: '#521c47' },
  { x: 5, y: 12, color: '#541e49' },
  { x: 6, y: 12, color: '#56204b' },
  { x: 7, y: 12, color: '#58224d' },
  { x: 8, y: 12, color: '#5a244f' },
  { x: 9, y: 12, color: '#5c2651' },
  { x: 10, y: 12, color: '#5e2853' },
  { x: 11, y: 12, color: '#602a55' },
  { x: 12, y: 12, color: '#622c57' },
  
  // Y=13
  { x: 4, y: 13, color: '#4f8c48' },
  { x: 5, y: 13, color: '#501a46' },
  { x: 6, y: 13, color: '#521c48' },
  { x: 7, y: 13, color: '#541e4a' },
  { x: 8, y: 13, color: '#56204c' },
  { x: 9, y: 13, color: '#58224e' },
  { x: 10, y: 13, color: '#5a2450' },
  { x: 11, y: 13, color: '#5c2652' },
  
  // Y=14
  { x: 6, y: 14, color: '#4d8a47' },
  { x: 7, y: 14, color: '#4e1845' },
  { x: 8, y: 14, color: '#501a47' },
  { x: 9, y: 14, color: '#521c49' },
  
  // Y=15 (bottom tip)
  { x: 7, y: 15, color: '#4b8846' },
  { x: 8, y: 15, color: '#4c1644' }
];

</script>



<div class="text-[1.1em]">
    <div
    class="grid gap-[0em] w-[16em] border-[0.0625em] border-gray-300"
    style="
        grid-template-columns: repeat({gridSize}, 1em); 
        grid-template-rows: repeat({gridSize}, 1em);
    "
    >
        {#each blocks as block}
            <div
                class="w-[1em] h-[1em]"
                style="
                    background-color: {cube.find(c => c.x === block.x && c.y === block.y)?.color || ''};
                "
                data-x={block.x}
                data-y={block.y}
            ><span class="text-[0.4em] absolute">{block.x},{block.y}</span></div>
        {/each}
    </div>
</div>