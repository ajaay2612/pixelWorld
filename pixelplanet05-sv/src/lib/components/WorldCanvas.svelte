<script>
    import { onMount, untrack } from "svelte";
    import { Pointer } from '../stores/Pointer.svelte';
    import { Assets } from '../stores/Assets.svelte'
    import { deserialize } from '$app/forms';
    import AssetPicker from "$lib/components/AssetPicker.svelte";
    import * as SelectedColor from "$lib/stores/SelectedColor.svelte"
    import { InitData } from "$lib/stores/InitData.svelte";
    import { EditorState } from '$lib/stores/EditorState.svelte' // adjust path
    import Weather from "$lib/components/Weather.svelte";
    import ColorPickerForForm from "$lib/components/ColorPickerForForm.svelte";
    import ShadowEditor from "$lib/components/ShadowEditor.svelte";
    import LightEditor from "$lib/components/LightEditor.svelte";
    import DayNightPanel from "$lib/components/DayNightPanel.svelte";
    import MusicPlayer from "$lib/components/MusicPlayer.svelte";
    // import { showForm } from '@devvit/web/client';
    // import '$lib/gif.js'; // This adds GIF to global window object
    // import gifWorkerUrl from '$lib/gif.worker.js?url';
    import { showToast, navigateTo } from '@devvit/web/client';


    let plotLikes = $state({}); // { username: { count: 0, likers: [], hasLiked: false } }
    let showLeaderboard = $state(false);
    let leaderboardData = $state([]);

    // Load all plot likes
    async function loadAllLikes() {
        try {
            const response = await fetch('/api/get-all-likes');
            const data = await response.json();
            
            if (data.status === 'success') {
                // Mark which plots current user has liked
                const currentUser = userName;
                const likesMap = {};
                
                Object.entries(data.likes).forEach(([owner, likeData]) => {
                    likesMap[owner] = {
                        count: likeData.count,
                        likers: likeData.likers,
                        hasLiked: likeData.likers.includes(currentUser)
                    };
                });
                
                plotLikes = likesMap;
                needsRedraw = true;
                drawCanvas();
            }
        } catch (error) {
            console.error('Error loading likes:', error);
        }
    }

    // Toggle like for a plot
    async function toggleLike(plotOwner) {
        try {
            console.log('Toggling like for:', plotOwner);
            
            const response = await fetch('/api/toggle-like', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plotOwner })
            });
            
            const data = await response.json();
            console.log('Toggle response:', data);
            
            if (data.status === 'success') {
                // Update leaderboardData with new array (triggers Svelte reactivity)
                leaderboardData = leaderboardData.map(plot => 
                    plot.owner === plotOwner 
                        ? { ...plot, likes: data.likeCount, hasLiked: data.hasLiked }
                        : plot
                );
                
                // CRITICAL: Multiple redraw triggers
                needsRedraw = true;
                
                // Use requestAnimationFrame to ensure redraw happens
                requestAnimationFrame(() => {
                    drawCanvas();
                });
                
                console.log('Leaderboard updated:', leaderboardData);
            }
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    }


    // Load leaderboard
    async function loadLeaderboard() {
        try {
            const response = await fetch('/api/get-leaderboard');
            const data = await response.json();
            
            if (data.status === 'success') {
                leaderboardData = data.leaderboard; // Already sorted by backend
            }
        } catch (error) {
            console.error('Error loading leaderboard:', error);
            // Fallback to allPlots with 0 likes
            leaderboardData = allPlots.map(plot => ({
                owner: plot.owner,
                plotX: plot.plotX,
                plotY: plot.plotY,
                likes: 0
            }));
        }
    }

    function drawPlotLikes(ctx) {
        if (!allPlots || allPlots.length === 0 || editMode) return;
        
        allPlots.forEach(plot => {
            const plotLikeData = leaderboardData.find(d => d.owner === plot.owner);
            const likes = plotLikeData?.likes || 0;
            const hasLiked = plotLikeData?.hasLiked || false; // Check if user has liked
            const isOwnPlot = plot.owner === userName;
            
            // Position at bottom of plot
            const plotCenterX = (plot.worldX + plot.plotSize / 2) * blockSize;
            const plotBottomY = (plot.worldY + plot.plotSize + 4) * blockSize;
            
            ctx.save();
            
            // Fixed size - NOT affected by zoom
            const scale = 1 / camera.zoom;
            
            // Button dimensions
            const buttonWidth = 70 * scale;
            const buttonHeight = 35 * scale;
            const buttonX = plotCenterX - 60 * scale;
            const buttonY = plotBottomY;
            
            // Heart display beside button
            const heartX = buttonX + buttonWidth + 10 * scale;
            const heartY = buttonY;
            const heartWidth = 50 * scale;
            const heartHeight = 35 * scale;
            
            // Draw button (don't show for own plot)
            if (!isOwnPlot) {
                // Button background - change color if already liked
                ctx.fillStyle = hasLiked ? 'rgba(255, 107, 107, 0.9)' : 'rgba(255, 255, 255, 0.95)';
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 2 * scale;
                ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
                ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
                
                // Button text - "Like" or "Unlike"
                ctx.fillStyle = hasLiked ? '#fff' : '#000';
                ctx.font = `bold ${14 * scale}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(hasLiked ? 'Unlike' : 'Like', buttonX + buttonWidth / 2, buttonY + buttonHeight / 2);
            }
            
            // Draw heart + number display (NO BORDER)
            const displayX = isOwnPlot ? plotCenterX - heartWidth / 2 : heartX;
            
            // NO BACKGROUND, NO BORDER - just text
            ctx.fillStyle = '#000';
            ctx.font = `bold ${20 * scale}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`❤️ ${likes}`, displayX + heartWidth / 2, heartY + heartHeight / 2);
            
            ctx.restore();
        });
    }




    // day and night
    let isDayNightLoaded = $state(false);
    let dayNightConfig = $state({
        enabled: false,
        timeOfDay: 0.5,
        morningColor: '#ff9966',
        noonColor: '#87ceeb',
        nightColor: '#0a0a2e',
        overlayOpacity: 0.4,
        currentColor: '#87ceeb'
    });

    // light


    // shadows

    // let showInstanceDebug = $state(false);
    // function toggleInstanceDebug() {
    //     showInstanceDebug = !showInstanceDebug;
    // }

    // og
    const userName = $derived(InitData?.value?.username)
    const userPlot = $derived(InitData?.value?.userPlot)
    const allPlots = $derived(InitData?.value?.allPlots || [])
    const plotConfig = $derived(InitData?.value?.plotConfig || {})

    // Dummy data for local development
    // const DUMMY_USERNAME = "ajay";
    // const DUMMY_USER_PLOT = {
    //     owner: "ajay",
    //     plotX: 5,
    //     plotY: 5,
    //     worldX: 256,  // plotX * plotSize (assuming 32x32 plot size)
    //     worldY: 256,  // plotY * plotSize
    //     plotSize: 64
    // };
    // const DUMMY_ALL_PLOTS = [
    //     { owner: "ajay", plotX: 5, plotY: 5, worldX: 256, worldY: 256, plotSize: 64 },
    //     { owner: "ravi", plotX: 6, plotY: 5, worldX: 320, worldY: 256, plotSize: 64 },
    //     { owner: "meena", plotX: 5, plotY: 6, worldX: 256, worldY: 320, plotSize: 64 },
    //     { owner: "rahul", plotX: 7, plotY: 5, worldX: 384, worldY: 256, plotSize: 64 },
    //     { owner: "priya", plotX: 4, plotY: 5, worldX: 192, worldY: 256, plotSize: 64 },
    //     { owner: "meena", plotX: 5, plotY: 6, worldX: 256, worldY: 320, plotSize: 64 },
    //     { owner: "rahul", plotX: 7, plotY: 5, worldX: 384, worldY: 256, plotSize: 64 },
    //     { owner: "priya", plotX: 4, plotY: 5, worldX: 192, worldY: 256, plotSize: 64 },
    // ];
    // const DUMMY_PLOT_CONFIG = {
    //     plotSize: 64,
    //     maxPlotsPerUser: 3
    // };

    // const userName = $derived(InitData?.value?.username || DUMMY_USERNAME);
    // const userPlot = $derived(InitData?.value?.userPlot || DUMMY_USER_PLOT);
    // const allPlots = $derived(InitData?.value?.allPlots || DUMMY_ALL_PLOTS);
    // const plotConfig = $derived(InitData?.value?.plotConfig || DUMMY_PLOT_CONFIG);

    let weatherEnabled = $state(false);
    let weatherComponent = $state(null);
    let animationFrameId = null;
    let lastFrameTime = 0;
    let visiblePlotsWeather = $state(new Map()); // Map of plotKey -> weatherConfig
    let weatherComponents = $state(new Map()); // Map of plotKey -> Weather component instance
    
    let needsRedraw = $state(false);
    let currentAnimationTime = $state(0);

    function animate(currentTime) {
        currentAnimationTime = currentTime;
        const deltaTime = currentTime - lastFrameTime;
        lastFrameTime = currentTime;
        
        let shouldRedraw = needsRedraw;
        
        // Update weather particles (don't force redraw every frame)
        if (weatherComponent && weatherEnabled && !editMode) {
            weatherComponent.update();
            // Only redraw for weather if nothing else is happening
            if (!needsRedraw && !isPanning && !isDragging) {
                shouldRedraw = true;
            }
        }

        if (!editMode) {
            const hasPulsingLights = placedInstances.some(inst => 
                inst.light?.enabled && inst.light?.pulseEnabled
            );
            
            if (hasPulsingLights) {
                shouldRedraw = true;
            }
        }
        
        // Only redraw if something changed
        if (shouldRedraw) {
            drawCanvas();
            needsRedraw = false;
        }
        
        animationFrameId = requestAnimationFrame(animate);
    }

    async function loadVisiblePlotsWeather() {
        if (editMode) return; // Only in world mode
        
        try {
            const response = await fetch('/api/get-all-weather');
            if (!response.ok) throw new Error('Failed to load weather configs');
            
            const data = await response.json();
            
            if (data.status === 'success' && data.weatherConfigs) {
                // Clear old weather data
                visiblePlotsWeather.clear();
                
                // Store weather configs by plot coordinates
                data.weatherConfigs.forEach(plotWeather => {
                    const plotKey = plotWeather.plotCoords; // e.g., "5,5"
                    visiblePlotsWeather.set(plotKey, plotWeather.weatherConfig);
                });
                
                needsRedraw = true;
            }
        } catch (error) {
            console.error('Error loading plots weather:', error);
        }
    }

    function getCurrentlyViewedPlot() {
        if (!allPlots || allPlots.length === 0) return null;
        
        // Calculate center of viewport
        const centerX = (camera.x + canvasSize.width / 2) / (camera.zoom * blockSize);
        const centerY = (camera.y + canvasSize.height / 2) / (camera.zoom * blockSize);
        
        // Find which plot contains this center point
        for (const plot of allPlots) {
            if (
                centerX >= plot.worldX && 
                centerX < plot.worldX + plot.plotSize &&
                centerY >= plot.worldY && 
                centerY < plot.worldY + plot.plotSize
            ) {
                return plot;
            }
        }
        
        return null;
    }

    // day and night
    async function saveDayNightConfig() {
        if (!dayNightConfig) return;
        
        try {
            const response = await fetch('/api/save-daynight', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dayNightConfig })
            });
            
            const data = await response.json();
            if (data.status === 'success') {
                console.log('Day/night config saved successfully');
            }
        } catch (error) {
            console.error('Error saving day/night config:', error);
        }
    }

    async function loadDayNightConfig() {
        try {
            const response = await fetch('/api/get-daynight');
            const data = await response.json();
            
            if (data.status === 'success' && data.dayNightConfig) {
                // Use untrack to prevent triggering the effect during load
                untrack(() => {
                    dayNightConfig = data.dayNightConfig;
                });
            }
            
            // Mark as loaded AFTER setting the data
            isDayNightLoaded = true;
        } catch (error) {
            console.error('Error loading day/night config:', error);
            isDayNightLoaded = true; // Still mark as loaded even on error
        }
    }
    async function loadAllPlotsDayNight() {
        try {
            const response = await fetch('/api/get-all-daynight');
            const data = await response.json();
            
            if (data.status === 'success') {
                // Store in a Map: plotCoords -> dayNightConfig
                const dayNightMap = new Map();
                data.dayNightConfigs.forEach(plotDayNight => {
                    dayNightMap.set(plotDayNight.plotCoords, plotDayNight.dayNightConfig);
                });
                return dayNightMap;
            }
        } catch (error) {
            console.error('Error loading all day/night configs:', error);
        }
        return new Map();
    }

    let dayNightSaveTimer = null;

    function scheduleDayNightSave() {
        if (dayNightSaveTimer) clearTimeout(dayNightSaveTimer);
        dayNightSaveTimer = setTimeout(async () => {
            await saveDayNightConfig();
        }, 150); // Save 2 seconds after last change
    }

    // weather
    async function saveWeatherConfig() {
        if (!weatherComponent) return;
        
        const config = weatherComponent.getConfig();
        
        try {
            const response = await fetch('/api/save-weather', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    weatherConfig: {
                        ...config,
                        enabled: weatherEnabled
                    }
                })
            });
            
            if (!response.ok) throw new Error('Failed to save weather');
            
            const data = await response.json();
            
            if (data.status === 'success') {
                console.log('Weather config saved successfully');
            }
        } catch (error) {
            console.error('Error saving weather config:', error);
        }
    }

    let myWeatherConfig = $state(null);

    async function loadWeatherConfig() {
        try {
            const response = await fetch('/api/get-weather');
            
            if (!response.ok) throw new Error('Failed to load weather');
            
            const data = await response.json();
            
            if (data.status === 'success' && data.weatherConfig) {
                myWeatherConfig = data.weatherConfig; // Store it
                
                // Apply immediately if in your own plot OR if no plot selected yet
                if (!currentViewedPlot || currentViewedPlot?.owner === userName) {
                    weatherEnabled = myWeatherConfig.enabled ?? false;
                    
                    if (weatherComponent) {
                        // Use untrack to prevent triggering saves during load
                        untrack(() => {
                            weatherComponent.setConfig(myWeatherConfig);
                            weatherComponent.reinitialize();
                        });
                    }
                }
                
                console.log('Weather config loaded successfully');
            }else{
                myWeatherConfig = {
                    enabled: false
                };
                
                weatherEnabled = false;
                if (weatherComponent) {
                    untrack(() => {
                    weatherComponent.setConfig(myWeatherConfig);
                    weatherComponent.reinitialize();
                    });
                }
                console.log('No weather config found, using defaults');
            }
        } catch (error) {
            console.error('Error loading weather config:', error);
        }
    }

    // Debounced auto-save for weather changes
    let weatherSaveTimer = null;

    function scheduleWeatherSave() {
        if (weatherSaveTimer) clearTimeout(weatherSaveTimer);
        
        weatherSaveTimer = setTimeout(async () => {
            await saveWeatherConfig();
        }, 150); // Save 2 seconds after last change
    }
    
    function deepEqual(obj1, obj2) {
        if (obj1 === obj2) return true;
        
        if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || 
            obj1 === null || obj2 === null) {
            return false;
        }
        
        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);
        
        if (keys1.length !== keys2.length) return false;
        
        for (const key of keys1) {
            if (!keys2.includes(key)) return false;
            if (!deepEqual(obj1[key], obj2[key])) return false;
        }
        
        return true;
    }

    $effect(() => {
        // Only auto-save when in world mode AND in your own plot
        if (!weatherComponent || editMode || !myWeatherConfig) return;
        if (!currentViewedPlot || currentViewedPlot.owner !== userName) return; // ADD THIS LINE
        
        // Watch for weather config changes
        weatherEnabled;
        weatherComponent.getConfig();
        weatherComponent.getWeatherType();
        
        const newConfig = {
            ...weatherComponent.getConfig(),
            enabled: weatherEnabled
        };
        
        // Only update if deeply different
        if (!deepEqual(myWeatherConfig, newConfig)) {
            myWeatherConfig = newConfig;
        }

        // Schedule save
        scheduleWeatherSave();
    });
   
    // $effect(() => {
    //     if (EditorState?.assetToPlace) {
    //         placeBlockInCenter(EditorState?.assetToPlace);
    //         EditorState.assetToPlace = null; // Clear after placing
    //     }
    // });

    let {
        handleSetColorPicker,
        gridSizeMultiplier =1000,
        editMode = false,
        showPlotBoundary =  $bindable(true) ,
        showIsoGrid =  $bindable(true),
        showGridLines =  $bindable(true),
        showDayNightPanel = $bindable(false),
        showLightEditor = $bindable(false),
        showShadowEditor = $bindable(false),
        canEditSelectedInstance = $bindable(false),
        showAssetPicker = $bindable(false),
        showWeatherEditor = $bindable(false)
    } = $props()
  

    // touch controls 
    let lastTouchDistance = $state(null);
    let lastTouchCenter = $state(null);
    let touchStartTime = $state(0);
    let isTouchDragging = $state(false);

    // helper function to convert touch to mouse-like event
    function getTouchAsMouseEvent(touch) {
        const rect = canvas.getBoundingClientRect();
        return {
            clientX: touch.clientX,
            clientY: touch.clientY,
            button: 0,
            preventDefault: () => {}
        };
    }

    function getTouchDistance(touch1, touch2) {
        const dx = touch2.clientX - touch1.clientX;
        const dy = touch2.clientY - touch1.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    function getTouchCenter(touch1, touch2) {
        return {
            x: (touch1.clientX + touch2.clientX) / 2,
            y: (touch1.clientY + touch2.clientY) / 2
        };
    }


    // instance placing

    let placedInstances = $state([]);  // Array of placed asset instances
    let selectedInstance = $state(null);  // Currently selected instance
    let lastClickPos = $state(null);  // To detect same-position clicks
    let instancesAtLastClick = $state([]);  // Stack of instances at click position
    let currentCycleIndex = $state(0);  // Which instance in stack is selected
    let assetImageCache = $state(new Map());
    let assetLookupCache = $state(new Map());
    let sortedInstancesCache = $state([]);
    let needsResort = $state(true);
    let spatialGrid = $state(new Map());
    const SPATIAL_CELL_SIZE = 32; // How many blocks per cell
    let needsSpatialRebuild = $state(false);

    // saving to devit
    const STORAGE_REGION_SIZE = 128; // Storage region size in blocks
    
    // Region management state
    let loadedRegions = $state(new Set());  // Which regions are loaded
    let dirtyRegions = $state(new Set());   // Which regions need saving
    let isSavingRegions = $state(false);
    let isLoadingRegions = $state(false);
    let saveTimer = null;

    // asset fetch on demand
    let assetFetchCache = $state(new Map()); // Cache fetched assets by ID
    let fetchingAssets = $state(new Set()); 

    async function fetchAssetById(assetId) {
        // Check if already cached
        if (assetFetchCache.has(assetId)) {
            return assetFetchCache.get(assetId);
        }

        // Check if already fetching
        if (fetchingAssets.has(assetId)) {
            // Wait for existing fetch to complete
            return new Promise((resolve) => {
                const checkInterval = setInterval(() => {
                    if (assetFetchCache.has(assetId)) {
                        clearInterval(checkInterval);
                        resolve(assetFetchCache.get(assetId));
                    }
                }, 50);
            });
        }

        // Mark as fetching
        fetchingAssets.add(assetId);

        try {
            const response = await fetch(`/api/get-asset/${assetId}`);
            
            if (!response.ok) {
                throw new Error(`Asset ${assetId} not found`);
            }

            const data = await response.json();
            
            if (data.status === 'success' && data.asset) {
                // Cache the asset
                assetFetchCache.set(assetId, data.asset);
                
                // Also add to assetLookupCache for getAssetImage
                assetLookupCache.set(assetId, data.asset);
                
                // Clear image cache to force re-render
                if (assetImageCache.has(assetId)) {
                    assetImageCache.delete(assetId);
                }
                
                return data.asset;
            }
            
            return null;
        } catch (error) {
            console.error(`Error fetching asset ${assetId}:`, error);
            return null;
        } finally {
            fetchingAssets.delete(assetId);
        }
    }

    function rebuildSpatialGrid() {
        spatialGrid.clear();
        placedInstances.forEach(instance => {
            // Calculate which cells this instance touches
            const cellX1 = Math.floor(instance.x / SPATIAL_CELL_SIZE);
            const cellY1 = Math.floor(instance.y / SPATIAL_CELL_SIZE);
            const cellX2 = Math.floor((instance.x + instance.width) / SPATIAL_CELL_SIZE);
            const cellY2 = Math.floor((instance.y + instance.height) / SPATIAL_CELL_SIZE);
            
            // Add to all overlapping cells
            for (let cy = cellY1; cy <= cellY2; cy++) {
                for (let cx = cellX1; cx <= cellX2; cx++) {
                    const key = `${cx},${cy}`;
                    if (!spatialGrid.has(key)) spatialGrid.set(key, []);
                    spatialGrid.get(key).push(instance);
                }
            }
        });
        needsSpatialRebuild = false;
    }

    function getAssetImage(assetId) {
        if (assetImageCache.has(assetId)) {
            return assetImageCache.get(assetId);
        }
        
        const asset = assetLookupCache.get(assetId);
        if (!asset) return null;
        
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = asset.width * blockSize;
        offscreenCanvas.height = asset.height * blockSize;
        const offscreenCtx = offscreenCanvas.getContext('2d');
        
        // Draw all pixels once to offscreen canvas
        asset.pixels.forEach(([px, py, colorIndex, opacity]) => {
            offscreenCtx.globalAlpha = opacity / 255;
            offscreenCtx.fillStyle = asset.colors[colorIndex];
            offscreenCtx.fillRect(px * blockSize, py * blockSize, blockSize, blockSize);
        });
        offscreenCtx.globalAlpha = 1;
        
        assetImageCache.set(assetId, offscreenCanvas);
        return offscreenCanvas;
    }

    function drawDayNightOverlay(ctx) {
        if (!dayNightConfig || !dayNightConfig.enabled || !userPlot) return;
        
        const color = dayNightConfig.currentColor;
        const opacity = dayNightConfig.overlayOpacity;
        
        // Draw only over the user's plot boundaries
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = color;
        ctx.globalAlpha = opacity;
        
        // Draw rectangle over user's plot in world coordinates
        ctx.fillRect(
            userPlot.worldX * blockSize, 
            userPlot.worldY * blockSize, 
            userPlot.plotSize * blockSize, 
            userPlot.plotSize * blockSize
        );
        
        ctx.restore();
    }



    function drawInstanceLight(ctx, instance, currentTime) {
        if (!instance.light || !instance.light.enabled) return;
        
        const light = instance.light;
        
        // Calculate pulsing intensity if enabled
        let currentIntensity = light.intensity;
        if (light.pulseEnabled) {
            const pulsePhase = Math.sin(currentTime * 0.001 * light.pulseSpeed);
            const pulseRange = light.pulseMax - light.pulseMin;
            currentIntensity = light.pulseMin + ((pulsePhase + 1) / 2) * pulseRange;
        }
        
        // Calculate light position (center of asset + offset)
        const centerX = (instance.x + instance.width / 2) * blockSize + light.offsetX * blockSize;
        const centerY = (instance.y + instance.height / 2) * blockSize + light.offsetY * blockSize;
        const radius = light.radius * blockSize;
        
        const scaleX = light.ellipseX || 1;
        const scaleY = light.ellipseY || 1;
        
        const hexToRgb = (hex) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : { r: 255, g: 255, b: 255 };
        };
        
        const rgb = hexToRgb(light.color);
        
        ctx.save();
        
        // Use 'screen' blend mode for better visibility against dark overlay
        ctx.globalCompositeOperation = 'screen';
        
        if (light.blur > 0) {
            ctx.filter = `blur(${light.blur}px)`;
        }
        
        ctx.translate(centerX, centerY);
        ctx.scale(scaleX, scaleY);
        
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
        
        gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${Math.min(1, currentIntensity)})`);
        gradient.addColorStop(0.5, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${Math.min(1, currentIntensity * 0.4)})`);
        gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
        
        ctx.restore();
    }




    function drawInstanceShadow(ctx, instance, assetImage) {
        if (!assetImage || !instance.shadow || !instance.shadow.enabled) return;
        
        const shadow = instance.shadow;
        const angleRad = (shadow.angle * Math.PI) / 180;
        const shadowDepth = shadow.length * blockSize;
        const isoOffsetX = Math.cos(angleRad) * shadowDepth;
        const isoOffsetY = Math.sin(angleRad) * shadowDepth * 0.5;
        
        const assetWidth = instance.width * blockSize;
        const assetHeight = instance.height * blockSize;
        
        // Calculate skew horizontal extension
        const skewExtent = Math.abs(shadow.skewX * assetHeight);
        
        // CREATE OFFSCREEN CANVAS with proper sizing
        const buffer = 100;
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = assetWidth + Math.abs(isoOffsetX) + skewExtent + buffer;
        offscreenCanvas.height = assetHeight + Math.abs(isoOffsetY) + buffer;
        const offCtx = offscreenCanvas.getContext('2d');
        
        // Draw shadow on OFFSCREEN canvas
        offCtx.save();
        offCtx.globalAlpha = shadow.opacity;
        if (shadow.blur > 0) {
            offCtx.filter = `blur(${shadow.blur}px)`;
        }
        
        const bufferOffset = buffer / 2 + skewExtent / 2;
        offCtx.translate(bufferOffset, buffer / 2);
        offCtx.transform(1, 0, shadow.skewX, 0.5, 0, 0);
        
        // Draw asset
        offCtx.drawImage(assetImage, isoOffsetX, -isoOffsetY, assetWidth, assetHeight);
        
        // Apply source-in ONLY on offscreen canvas
        offCtx.globalCompositeOperation = 'source-in';
        offCtx.fillStyle = shadow.color;
        offCtx.fillRect(isoOffsetX, -isoOffsetY, assetWidth, assetHeight);
        offCtx.restore();
        
        // Draw completed shadow to MAIN canvas
        const baseX = instance.x * blockSize + shadow.offsetX * blockSize;
        const baseY = instance.y * blockSize + shadow.offsetY * blockSize;
        ctx.drawImage(offscreenCanvas, baseX - bufferOffset, baseY - buffer / 2);
    }




    $effect(() => {
        // Add Assets.blocks to lookup cache WITHOUT clearing existing fetched assets
        Assets.blocks;
        
        // Only add/update from Assets.blocks, don't clear
        Assets.blocks.forEach((block, index) => {
            const key = block.id !== undefined ? block.id : index;
            assetLookupCache.set(key, block);
            
            // Clear image cache only for this specific asset (force re-render if updated)
            if (assetImageCache.has(key)) {
                assetImageCache.delete(key);
            }
        });
    });

    $inspect(placedInstances)

    // Add this function near your other helper functions
    export function placeBlockInCenter(block) {
        console.log('Placing block:', block);
        // console.log('Placing block in center:', block);
        if (block && block.pixels && block.pixels.length > 0) {
            // Calculate center of viewport in world coordinates
            const centerScreenX = canvasSize.width / 2;
            const centerScreenY = canvasSize.height / 2;

            const centerWorldX = (centerScreenX + camera.x) / camera.zoom;
            const centerWorldY = (centerScreenY + camera.y) / camera.zoom;

            // Convert to grid coordinates and offset by half the block dimensions
            const startX = Math.floor(centerWorldX / blockSize) - Math.floor(block.width / 2);
            const startY = Math.floor(centerWorldY / blockSize) - Math.floor(block.height / 2);

            if (editMode) {
                // Place each pixel from the block data
                block.pixels.forEach(([x, y, colorIndex, opacity]) => {
                    const gridX = startX + x;
                    const gridY = startY + y;
    
                    if (gridX >= 0 && gridX < gridSize && gridY >= 0 && gridY < gridSize) {
                        const color = block.colors[colorIndex];
                        let existingBlock = blockMap.get(`${gridX},${gridY}`);
                        if (!existingBlock) {
                            existingBlock = { 
                                id: `${gridX}-${gridY}`, 
                                x: gridX, 
                                y: gridY, 
                                color: 'transparent', 
                                opacity: 1 
                            };
                            blockMap.set(`${gridX},${gridY}`, existingBlock);
                        }
                        existingBlock.color = color;
                        existingBlock.opacity = opacity / 255;
                    }
                })
            }else{
                
                // Check if placement is within user's plot
                if (!isInUserPlot(startX, startY)) {
                    console.log("Can't place outside your plot!");
                    return;
                }
                
                // Check if entire asset fits within plot
                const endX = startX + block.width - 1;
                const endY = startY + block.height - 1;
                if (!isInUserPlot(endX, endY)) {
                    console.log("Asset doesn't fit in your plot!");
                    return;
                }

                const instance = {
                    id: `instance-${crypto.randomUUID()}`,
                    assetId: block.id,
                    x: startX,
                    y: startY,
                    width: block.width,
                    height: block.height,
                    zIndex: placedInstances.length > 0 
                        ? Math.max(...placedInstances.map(i => i.zIndex)) + 1 
                        : 0, 
                    owner: userName ,
                    shadow: {
                        enabled: false,
                        color: '#000000',
                        opacity: 0.7,
                        offsetX: 8,
                        offsetY: 8,
                        angle: 0,        
                        length: 2,        
                        blur: 4,        
                        skewX: -0.6 
                    },
                    light: {
                        enabled: false,
                        color: '#ffaa00',
                        intensity: 2,           // Updated default
                        radius: 5,
                        blur: 30,
                        offsetX: 0,
                        offsetY: 0,
                        ellipseX: 1,           // NEW
                        ellipseY: 1,           // NEW
                        pulseEnabled: false,
                        pulseSpeed: 1,
                        pulseMin: 0.5,
                        pulseMax: 5  
                    }
                };
                placedInstances.push(instance);
                normalizeZIndices();
                needsResort = true; 
                needsSpatialRebuild = true; 
                markRegionDirty(startX, startY);
            }


            drawCanvas();
        }
    }

    // Add this helper function near the top after your state declarations
    function canControlInstance(instance) {
        if (!instance || !instance.owner) return false;
        // console.log(instance, userName)
        return instance.owner === userName;
    }

    function getEffectiveColor() {
        if (isEraseMode) {
            return { color: 'transparent', opacity: 1 };
        }
        return SelectedColor.getColor();
    }   

    export async function exportArt(artName = "untitled", idGlobalFlag = false) {
        
        console.log(artName,idGlobalFlag)
        // Filter out transparent blocks first
        const nonTransparentBlocks = Array.from(blockMap.values())
            .filter(b => b.color !== 'transparent');

        // If nothing to export, return early
        if (nonTransparentBlocks.length === 0) {
            console.log('No content to export');
            return null;
        }

        // Find bounding box of actual content
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;

        nonTransparentBlocks.forEach(b => {
            minX = Math.min(minX, b.x);
            maxX = Math.max(maxX, b.x);
            minY = Math.min(minY, b.y);
            maxY = Math.max(maxY, b.y);
        });

        // Calculate actual dimensions
        const width = maxX - minX + 1;
        const height = maxY - minY + 1;

        // Collect unique colors
        let colors = []
        nonTransparentBlocks.forEach(b => {
            if (!colors.includes(b.color)) {
                colors.push(b.color);
            }
        });

        // Export blocks with translated coordinates (starting from 0,0)
        const exportData = nonTransparentBlocks.map(b => [
            b.x - minX,  // Translate X to start from 0
            b.y - minY,  // Translate Y to start from 0
            colors.indexOf(b.color),  // Color index
            Math.round(b.opacity * 255)  // Opacity as 0-255
        ]);

        const blockObjects = {
            id: `asset-${crypto.randomUUID()}`,
            name:artName,
            width,
            global:idGlobalFlag,
            height,
            colors,
            pixels:exportData
        }

        Assets.blocks.push(blockObjects);

        console.log('Exported data:', Assets.blocks);
        // await saveToServer() 

        // Save to server
        try {
            await saveAssets(blockObjects);
            console.log('Asset saved successfully');
        } catch (error) {
            console.error('Failed to save asset:', error);
            // Optionally remove from local store if save failed
            // Assets.blocks = Assets.blocks.filter(b => b.id !== blockObjects.id);
        }

    }

    async function saveAssets(blockObject) {
        const response = await fetch('/api/save-assets', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(blockObject),
        });

        if (!response.ok) {
            throw new Error('Failed to save asset');
        }
        return await response.json();
    }


    // async function saveToServer() {
    //     try {
    //         const formData = new FormData();
    //         formData.append('assets', JSON.stringify(Assets));
            
    //         const response = await fetch('?/saveAssets', {
    //             method: 'POST',
    //             body: formData
    //         });
            
	//         const result = deserialize(await response.text());
    //         console.log(result)
    //         if (result.status == 200) {
    //             console.log('✓ Assets saved successfully!');
    //         } else {
    //             console.error('✗ Failed to save:', result.error);
    //         }
    //     } catch (error) {
    //         console.error('✗ Error:', error);
    //     }
    // }

    // devvit saving optimisation
    function getRegionKey(x, y) {
        const regionX = Math.floor(x / STORAGE_REGION_SIZE);
        const regionY = Math.floor(y / STORAGE_REGION_SIZE);
        return `${regionX},${regionY}`;
    }

    function getVisibleRegions() {
        const visibleStartX = Math.floor(camera.x / camera.zoom / blockSize);
        const visibleStartY = Math.floor(camera.y / camera.zoom / blockSize);
        const visibleEndX = Math.ceil((camera.x + canvasSize.width) / camera.zoom / blockSize);
        const visibleEndY = Math.ceil((camera.y + canvasSize.height) / camera.zoom / blockSize);
        
        const regionStartX = Math.floor(visibleStartX / STORAGE_REGION_SIZE);
        const regionStartY = Math.floor(visibleStartY / STORAGE_REGION_SIZE);
        const regionEndX = Math.floor(visibleEndX / STORAGE_REGION_SIZE);
        const regionEndY = Math.floor(visibleEndY / STORAGE_REGION_SIZE);
        
        const regions = [];
        for (let ry = regionStartY; ry <= regionEndY; ry++) {
            for (let rx = regionStartX; rx <= regionEndX; rx++) {
                regions.push(`${rx},${ry}`);
            }
        }
        
        return regions;
    }

    function groupInstancesByRegion(instances) {
        const regions = new Map();
        
        instances.forEach(instance => {
            const regionKey = getRegionKey(instance.x, instance.y);
            
            if (!regions.has(regionKey)) {
                regions.set(regionKey, []);
            }
            
            regions.get(regionKey).push(instance);
        });
        
        return regions;
    }

    // ============================================
    // LOAD REGIONS
    // ============================================
    
    async function loadVisibleRegions() {
        const visibleRegions = getVisibleRegions();
        const regionsToLoad = visibleRegions.filter(r => !loadedRegions.has(r));
        
        if (regionsToLoad.length === 0) return;
        
        isLoadingRegions = true;
        
        try {
            const response = await fetch('/api/get-instances', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ regions: regionsToLoad })
            });
            
            if (!response.ok) throw new Error('Failed to load regions');
            
            const data = await response.json();
            
            if (data.status === 'success') {
                // Add loaded instances to placedInstances
                data.instances.forEach(instance => {
                    if (!placedInstances.find(i => i.id === instance.id)) {
                        placedInstances.push(instance);
                    }
                });

                // normalizeZIndices();
                
                // Mark regions as loaded
                regionsToLoad.forEach(r => loadedRegions.add(r));
                
                // Fetch assets for all new instances
                const uniqueAssetIds = new Set(data.instances.map(i => i.assetId));
                const assetFetchPromises = Array.from(uniqueAssetIds).map(assetId => 
                    fetchAssetById(assetId)
                );
                
                // Wait for all assets to load
                await Promise.all(assetFetchPromises);
                
                // Rebuild spatial grid for rendering
                needsSpatialRebuild = true;
                drawCanvas();
                
                console.log(`Loaded ${regionsToLoad.length} regions with ${data.instances.length} instances`);
            }
        } catch (error) {
            console.error('Error loading regions:', error);
        } finally {
            isLoadingRegions = false;
        }
    }

    // ============================================
    // SAVE REGIONS (DEBOUNCED)
    // ============================================
    
    function markRegionDirty(x, y) {
        const regionKey = getRegionKey(x, y);
        dirtyRegions.add(regionKey);
        
        // Clear existing timer
        if (saveTimer) clearTimeout(saveTimer);
        
        // Set new timer for 2 seconds
        saveTimer = setTimeout(async () => {
            await saveRegions();
        }, 150);
    }

    async function saveRegions() {
        if (dirtyRegions.size === 0) return;
        
        isSavingRegions = true;
        
        try {
            // Group all instances by region
            const regionGroups = groupInstancesByRegion(placedInstances);
            
            // Prepare data for dirty regions only
            const regionsToSave = {};
            dirtyRegions.forEach(regionKey => {
                regionsToSave[regionKey] = regionGroups.get(regionKey) || [];
            });
            
            // Filter to only include user's own instances
            Object.keys(regionsToSave).forEach(regionKey => {
                regionsToSave[regionKey] = regionsToSave[regionKey].filter(inst => 
                    inst.owner === userName
                );
            });

            const response = await fetch('/api/save-instances', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ regions: regionsToSave })
            });
            
            if (!response.ok) throw new Error('Failed to save regions');
            
            const data = await response.json();
            
            if (data.status === 'success') {
                // Clear dirty regions
                dirtyRegions.clear();
                console.log(`Saved ${Object.keys(regionsToSave).length} regions`);
            }
        } catch (error) {
            console.error('Error saving regions:', error);
        } finally {
            isSavingRegions = false;
        }
    }


    // world 
    let canvas;
    let ctx;
 
    let camera = $state({ x: 0, y: 0, zoom: 1 });
    let worldBlockSize = 16; // pixels per block in world space
    let container; // add this variable
    let canvasSize = $state({ width: 800, height: 600 }); // change to object

    // Add this in onMount or as $effect
    function handleResize() {
        if (container) {
            canvasSize = {
                width: window.innerWidth,
                height: window.innerHeight
            };
        }
    }

    
    // mouse pos
    let isDragging = false;
    let hoveringBlock = $state(null);
    let isAltPressed = $state(false);
    
    // grid maker
    const gridSize = 512 * gridSizeMultiplier;
    const blockSize = worldBlockSize;
    let blockMap = $state(new Map());
    const isoGapX = 16;
    const isoGapY = 16;

    // pan state
    let isPanning = $state(false);
    let panStart = $state({ x: 0, y: 0, cameraStart: { x: 0, y: 0 } });


    // Render canvas
    function drawCanvas() {
        if (!ctx) return;
        // isogrid
      

        ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

        ctx.save();
        ctx.translate(-camera.x, -camera.y);
        ctx.scale(camera.zoom, camera.zoom);

        // Calculate visible grid range
        const visibleStartX = Math.floor(camera.x / camera.zoom / blockSize);
        const visibleStartY = Math.floor(camera.y / camera.zoom / blockSize);
        const visibleEndX = Math.ceil((camera.x + canvasSize.width) / camera.zoom / blockSize);
        const visibleEndY = Math.ceil((camera.y + canvasSize.height) / camera.zoom / blockSize);

        if (editMode) {
            // Only draw blocks that exist in blockMap and are visible
            for (const block of blockMap.values()) {
                if (
                    block.color !== 'transparent' &&
                    block.x >= visibleStartX && block.x < visibleEndX &&
                    block.y >= visibleStartY && block.y < visibleEndY
                ) {
                    ctx.globalAlpha = block.opacity;
                    ctx.fillStyle = block.color;
                    ctx.fillRect(block.x * blockSize, block.y * blockSize, blockSize, blockSize);
                    ctx.globalAlpha = 1;
                }
            }
        } else{
            // Rebuild spatial grid if needed
            if (needsSpatialRebuild || spatialGrid.size === 0) {
                rebuildSpatialGrid();
            }
            
            // Draw all plot boundaries
            if (allPlots && allPlots.length > 0) {
                allPlots.forEach(plot => {
                    const isUserPlot = plot.owner === userName;
                    
                    // Skip if toggled off
                    if (!showPlotBoundary) return;
                    
                    // Draw plot border
                    ctx.strokeStyle = isUserPlot ? 'rgba(0, 0, 0, 0.47)' : 'rgba(255, 136, 136, 0.5)'; // Orange for others
                    ctx.lineWidth = (3) / camera.zoom;
                    ctx.strokeRect(
                        plot.worldX * blockSize,
                        plot.worldY * blockSize,
                        plot.plotSize * blockSize,
                        plot.plotSize * blockSize
                    );
                    
                    // Draw owner name
                    ctx.save();
                    ctx.fillStyle = isUserPlot ? 'black' : '#ff8888'; // Orange for others
                    ctx.font = `${12 / camera.zoom}px Arial`;
                    ctx.fillText(
                        plot.owner,
                        plot.worldX * blockSize + 5,
                        plot.worldY * blockSize + 15
                    );
                    ctx.restore();
                });
            }

            // Calculate visible cells
            const cellStartX = Math.floor(visibleStartX / SPATIAL_CELL_SIZE);
            const cellStartY = Math.floor(visibleStartY / SPATIAL_CELL_SIZE);
            const cellEndX = Math.floor(visibleEndX / SPATIAL_CELL_SIZE);
            const cellEndY = Math.floor(visibleEndY / SPATIAL_CELL_SIZE);
            
            // Collect instances from visible cells only
            const visibleInstances = new Set();
            for (let cy = cellStartY; cy <= cellEndY; cy++) {
                for (let cx = cellStartX; cx <= cellEndX; cx++) {
                    const instances = spatialGrid.get(`${cx},${cy}`);
                    if (instances) instances.forEach(i => visibleInstances.add(i));
                }
            }
            
            // Sort by z-index and draw
            const instancesToRender = Array.from(visibleInstances).sort((a, b) => a.zIndex - b.zIndex);
            
        
            // Draw all assets
            instancesToRender.forEach(instance => {
                const assetImage = getAssetImage(instance.assetId);
                
                if (instance.shadow?.enabled) {
                    drawInstanceShadow(ctx, instance, getAssetImage(instance.assetId));
                }

                // if (instance.light?.enabled) {
                //     drawInstanceLight(ctx, instance, currentAnimationTime);
                // }

                if (assetImage) {
                    // Asset is ready, render it
                    ctx.drawImage(assetImage, instance.x * blockSize, instance.y * blockSize);
                } else {
                    // Asset not loaded yet, try to fetch it and show placeholder
                    if (!fetchingAssets.has(instance.assetId) && !assetFetchCache.has(instance.assetId)) {
                        fetchAssetById(instance.assetId).then(() => {
                            drawCanvas();
                        });
                    }
                    
                    // Draw placeholder while loading
                    ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
                    ctx.fillRect(
                        instance.x * blockSize, 
                        instance.y * blockSize, 
                        instance.width * blockSize, 
                        instance.height * blockSize
                    );
                    ctx.strokeStyle = 'rgba(150, 150, 150, 0.5)';
                    ctx.lineWidth = 1 / camera.zoom;
                    ctx.strokeRect(
                        instance.x * blockSize, 
                        instance.y * blockSize, 
                        instance.width * blockSize, 
                        instance.height * blockSize
                    );
                }
            });

            drawDayNightOverlay(ctx);

            // PASS 4: Draw lights AFTER overlay so they shine through
            instancesToRender.forEach(instance => {
                if (instance.light?.enabled) {
                    drawInstanceLight(ctx, instance, currentAnimationTime);
                }
            });

            // PASS 5: Draw like buttons
            drawPlotLikes(ctx);
            // PASS 3: Apply day/night overlay (darkens everything rendered so far)
            // drawDayNightOverlay(ctx);

            // PASS 4: Draw all lights AFTER overlay so they shine through darkness
            // instancesToRender.forEach(instance => {
            //     if (instance.light?.enabled) {
            //         drawInstanceLight(ctx, instance, currentAnimationTime);
            //     }
            // });

            // if (showInstanceDebug && !editMode) {
            //     instancesToRender.forEach((instance, idx) => {
            //         ctx.save();
            //         ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
            //         ctx.font = `${16 / camera.zoom}px Arial`;
            //         ctx.strokeStyle = 'white';
            //         ctx.lineWidth = 3 / camera.zoom;
                    
            //         const text = `#${placedInstances.indexOf(instance)} (${instance.x},${instance.y})`;
            //         const textX = instance.x * blockSize + 5;
            //         const textY = instance.y * blockSize + 20;
                    
            //         ctx.strokeText(text, textX, textY);
            //         ctx.fillText(text, textX, textY);
            //         ctx.restore();
            //     });
            // }
            
            // Draw selection border
            if (selectedInstance) {
                const isOwned = canControlInstance(selectedInstance);
                ctx.strokeStyle = isOwned ? '#0066ff' : '#ff6600';  // Blue if yours, orange if not
                ctx.lineWidth = 3 / camera.zoom;
                ctx.strokeRect(
                    selectedInstance.x * blockSize,
                    selectedInstance.y * blockSize,
                    selectedInstance.width * blockSize,
                    selectedInstance.height * blockSize
                );
                
                // Show owner name for others' instances
                if (!isOwned && selectedInstance.owner) {
                    ctx.save();
                    ctx.fillStyle = 'rgba(255, 102, 0, 0.9)';
                    ctx.font = `${14 / camera.zoom}px Arial`;
                    ctx.fillText(
                        `🔒 ${selectedInstance.owner}`, 
                        selectedInstance.x * blockSize + 5, 
                        selectedInstance.y * blockSize - 5
                    );
                    ctx.restore();
                }
            }

            // Draw moving preview
            if (isMoving && selectedInstance && (currentMoveOffset.x !== 0 || currentMoveOffset.y !== 0)) {
                const newX = selectedInstance.x + currentMoveOffset.x;
                const newY = selectedInstance.y + currentMoveOffset.y;
                
                // Draw pre-rendered asset image with transparency
                const assetImage = getAssetImage(selectedInstance.assetId);
                if (assetImage) {
                    ctx.globalAlpha = 0.5;
                    ctx.drawImage(
                        assetImage,
                        newX * blockSize,
                        newY * blockSize
                    );
                    ctx.globalAlpha = 1;
                    
                    // Draw dashed border for preview
                    ctx.strokeStyle = '#0066ff';
                    ctx.lineWidth = 3 / camera.zoom;
                    ctx.setLineDash([5, 5]);
                    ctx.strokeRect(
                        newX * blockSize,
                        newY * blockSize,
                        selectedInstance.width * blockSize,
                        selectedInstance.height * blockSize
                    );
                    ctx.setLineDash([]);
                }
            }
        }


        // Draw grid lines (only visible portion)
        if (showGridLines) {
            ctx.strokeStyle = '#e5e5e5';
            ctx.lineWidth = 1 / camera.zoom; // Scale line width with zoom

            for (let i = visibleStartX; i <= visibleEndX; i++) {
                ctx.beginPath();
                ctx.moveTo(i * blockSize, visibleStartY * blockSize);
                ctx.lineTo(i * blockSize, visibleEndY * blockSize);
                ctx.stroke();
            }

            for (let i = visibleStartY; i <= visibleEndY; i++) {
                ctx.beginPath();
                ctx.moveTo(visibleStartX * blockSize, i * blockSize);
                ctx.lineTo(visibleEndX * blockSize, i * blockSize);
                ctx.stroke();
            }
        }

        if (showIsoGrid) {
            const startX = Math.max(-22, visibleStartX - 22);
            const startY = Math.max(-20, visibleStartY - 20);
            const endX = visibleEndX + 32;
            const endY = visibleEndY + 32;

            const size = blockSize;
            const color = "rgba(0,0,0,0.1)";
            const slope = 2;

            for (let y = startY; y < endY; y++) {
                for (let x = startX; x < endX; x++) {
                    if (Math.floor(x / slope + y) % isoGapX === 0) {
                        ctx.fillStyle = color;
                        ctx.fillRect((x - 10) * size, (y - 4) * size, size, size);
                    }

                    if (Math.floor((x - 2) / slope - y + gridSize) % isoGapY === 0) {
                        ctx.fillStyle = color;
                        ctx.fillRect((x - 12) * size, (y - 13) * size, size, size);
                    }
                }
            }
        }


        if (hoveringBlock && !isTouchDevice) {
            
            if (editMode) {
                if (Pointer.shouldUseSelectedColor && !isDragging) {
                    const x = hoveringBlock.x * blockSize;
                    const y = hoveringBlock.y * blockSize;
                    ctx.globalAlpha = getEffectiveColor().opacity * 0.5;
                    ctx.fillStyle = getEffectiveColor().color;
                    ctx.fillRect(x, y, blockSize, blockSize);
                    ctx.globalAlpha = 1;
                }
            }else{
                const inUserPlot = isInUserPlot(hoveringBlock.x, hoveringBlock.y);
                ctx.strokeStyle = inUserPlot ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)';
                ctx.lineWidth = 2 / camera.zoom;
                ctx.strokeRect(
                    hoveringBlock.x * blockSize, 
                    hoveringBlock.y * blockSize, 
                    blockSize, 
                    blockSize
                );
            }
        }

        if (editMode) {
            // Draw selection border
            if (selectedRect) {
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 2 / camera.zoom;
                const x = selectedRect.x1 * blockSize;
                const y = selectedRect.y1 * blockSize;
                const w = (selectedRect.x2 - selectedRect.x1 + 1) * blockSize;
                const h = (selectedRect.y2 - selectedRect.y1 + 1) * blockSize;
                ctx.strokeRect(x, y, w, h);
            }


            // Draw moving preview
            if (isMoving && moveSnapshot && (currentMoveOffset.x !== 0 || currentMoveOffset.y !== 0)) {
                moveSnapshot.forEach(s => {
                    const newX = s.x + currentMoveOffset.x;
                    const newY = s.y + currentMoveOffset.y;
                    if (newX >= 0 && newX < gridSize && newY >= 0 && newY < gridSize) {
                        const x = newX * blockSize;
                        const y = newY * blockSize;
                        if (s.color !== 'transparent') {
                            ctx.globalAlpha = s.opacity * 0.7;
                            ctx.fillStyle = s.color;
                            ctx.fillRect(x, y, blockSize, blockSize);
                            ctx.globalAlpha = 1;
                        }
                    }
                });
            }

            // Draw selection border for moving preview
            if (isMoving && selectedRect && (currentMoveOffset.x !== 0 || currentMoveOffset.y !== 0)) {
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 2 / camera.zoom;
                ctx.setLineDash([5, 5]); // Dashed line to show it's moving
                const x = (selectedRect.x1 + currentMoveOffset.x) * blockSize;
                const y = (selectedRect.y1 + currentMoveOffset.y) * blockSize;
                const w = (selectedRect.x2 - selectedRect.x1 + 1) * blockSize;
                const h = (selectedRect.y2 - selectedRect.y1 + 1) * blockSize;
                ctx.strokeRect(x, y, w, h);
                ctx.setLineDash([]); // Reset to solid line
            }

            if (isLineMode && lineStart && lineEnd) {
                ctx.globalAlpha = getEffectiveColor().opacity * 0.5;
                ctx.fillStyle = getEffectiveColor().color;

                // Bresenham preview
                const x1 = lineStart[0], y1 = lineStart[1];
                const x2 = lineEnd[0], y2 = lineEnd[1];
                const dx = Math.abs(x2 - x1), dy = Math.abs(y2 - y1);
                const sx = x1 < x2 ? 1 : -1;
                const sy = y1 < y2 ? 1 : -1;
                let err = dx - dy;

                let x = x1, y = y1;
                while (true) {
                    ctx.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);
                    if (x === x2 && y === y2) break;
                    const e2 = 2 * err;
                    if (e2 > -dy) { err -= dy; x += sx; }
                    if (e2 < dx) { err += dx; y += sy; }
                }

                ctx.globalAlpha = 1;
            }

        }


        ctx.restore();

        if (weatherComponent && weatherEnabled && !editMode) {
            weatherComponent.render(ctx);
        }
    }

    $effect(() => {
        weatherEnabled;
        if (weatherComponent) {
            weatherComponent.getWeatherType(); // Track weather type changes too
        }
        drawCanvas(); // Force redraw
    });

    // $effect(() => {
    //     // Only redraw when these specific values change
    //     camera.x; camera.y; camera.zoom;
    //     showIsoGrid; showGridLines;
    //     blockMap;
    //     canvasSize.width; canvasSize.height;
    //     needsRedraw = true;
    //     // drawCanvas();
    // });

    // Tool states from Pointer
    let isFillMode = $derived(Pointer.current == 0);
    let isEraseMode = $derived(Pointer.current == 1);
    let isRectMode = $derived(Pointer.current == 2);
    let isEyedropperMode = $derived(Pointer.current == 3);
    let isLineMode = $derived(Pointer.current == 4);

    // Rect tool
    let rectStart = $state(null);
    let rectEnd = $state(null);
    let selectedRect = $state(null);
    let isMoving = $state(false);
    let moveStart = $state(null);
    let moveSnapshot = $state(null);
    let currentMoveOffset = $state({ x: 0, y: 0 });

    // Line tool
    let lineStart = $state(null);
    let lineEnd = $state(null);

    // handle events
    function getBlockFromMouseEvent(e) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Convert screen → world coordinates
        const worldX = (mouseX + camera.x) / camera.zoom;
        const worldY = (mouseY + camera.y) / camera.zoom;

        const x = Math.floor(worldX / blockSize);
        const y = Math.floor(worldY / blockSize);

        if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
            // Try to get from blockMap, or create a temporary block object
            let block = blockMap.get(`${x},${y}`);
            if (!block) {
                block = { id: `${x}-${y}`, x, y, color: 'transparent', opacity: 1 };
            }
            return { block, x, y };
        }
        return null;
    }

    function handleMouseMove(e) {
        const data = getBlockFromMouseEvent(e);
        
        if (isPanning) {
            const newX = panStart.cameraStart.x - (e.clientX - panStart.x);
            const newY = panStart.cameraStart.y - (e.clientY - panStart.y);
            
            const maxX = Math.max(0, gridSize * blockSize * camera.zoom - canvasSize.width);
            const maxY = Math.max(0, gridSize * blockSize * camera.zoom - canvasSize.height);
            
            camera.x = Math.max(0, Math.min(maxX, newX));
            camera.y = Math.max(0, Math.min(maxY, newY));
            needsRedraw = true;
            return;
        }

        if (!data || !data.block) {
            if (hoveringBlock !== null) {  // Only update if actually changed
                hoveringBlock = null;
                needsRedraw = true;
            }
            return;
        }

        if (!hoveringBlock || hoveringBlock.x !== data.block.x || hoveringBlock.y !== data.block.y) {
            hoveringBlock = data.block;
            needsRedraw = true;
        }
        
        if (!editMode && isMoving && selectedInstance && moveStart) {
            const deltaX = data.block.x - moveStart[0];
            const deltaY = data.block.y - moveStart[1];
            
            // ADD THIS: Clamp the offset to keep asset within plot boundaries
            const newX = selectedInstance.x + deltaX;
            const newY = selectedInstance.y + deltaY;
            const endX = newX + selectedInstance.width - 1;
            const endY = newY + selectedInstance.height - 1;
            
            // Calculate clamped offset
            let clampedDeltaX = deltaX;
            let clampedDeltaY = deltaY;
            
            if (userPlot) {
                const minX = userPlot.worldX;
                const minY = userPlot.worldY;
                const maxX = userPlot.worldX + userPlot.plotSize - selectedInstance.width;
                const maxY = userPlot.worldY + userPlot.plotSize - selectedInstance.height;
                
                const clampedNewX = Math.max(minX, Math.min(maxX, newX));
                const clampedNewY = Math.max(minY, Math.min(maxY, newY));
                
                clampedDeltaX = clampedNewX - selectedInstance.x;
                clampedDeltaY = clampedNewY - selectedInstance.y;
            }
            
            currentMoveOffset = { x: clampedDeltaX, y: clampedDeltaY };
            drawCanvas();
        }

        // Only allow drawing in edit mode
        if (!editMode || !isDragging) return;

        const block = data.block;

        if (isMoving && selectedRect && moveStart) {
            const rawDeltaX = block.x - moveStart[0];
            const rawDeltaY = block.y - moveStart[1];
            const deltaX = Math.round(rawDeltaX);
            const deltaY = Math.round(rawDeltaY);

            if (deltaX === 0 && deltaY === 0) return;

            const maxLeft = -selectedRect.x1;
            const maxRight = gridSize - 1 - selectedRect.x2;
            const maxTop = -selectedRect.y1;
            const maxBottom = gridSize - 1 - selectedRect.y2;

            const clampedDeltaX = Math.max(maxLeft, Math.min(deltaX, maxRight));
            const clampedDeltaY = Math.max(maxTop, Math.min(deltaY, maxBottom));

            currentMoveOffset = { x: clampedDeltaX, y: clampedDeltaY };
            drawCanvas();
        } else if (isFillMode || isEraseMode) {
            // Need to actually update blockMap, not just the temporary block
            let existingBlock = blockMap.get(`${block.x},${block.y}`);
            if (!existingBlock) {
                existingBlock = { id: `${block.x}-${block.y}`, x: block.x, y: block.y, color: 'transparent', opacity: 1 };
                blockMap.set(`${block.x},${block.y}`, existingBlock);
            }
            existingBlock.color = getEffectiveColor().color;
            existingBlock.opacity = getEffectiveColor().opacity;
            drawCanvas();
        } else if (isRectMode && rectStart) {
            rectEnd = [block.x, block.y];

            const x1 = Math.min(rectStart[0], rectEnd[0]);
            const x2 = Math.max(rectStart[0], rectEnd[0]);
            const y1 = Math.min(rectStart[1], rectEnd[1]);
            const y2 = Math.max(rectStart[1], rectEnd[1]);
            selectedRect = { x1, x2, y1, y2 };
            
            drawCanvas();
        } else if (isLineMode && lineStart) {
            lineEnd = [block.x, block.y];
            drawCanvas();
        }

        if (!editMode && hoveringBlock && !isInUserPlot(hoveringBlock.x, hoveringBlock.y)) {
            // User is hovering outside their plot - could show visual indicator
        }

        needsRedraw = true; 
    }

    function handleMouseDown(e) {
        // Check for middle button or space+left click
        if (e.button === 1 ||  e.button === 2) {
            isPanning = true;
            panStart = {
                x: e.clientX,
                y: e.clientY,
                cameraStart: { ...camera }
            };
            return;
        }

        const data = getBlockFromMouseEvent(e);
        if (!data) return;

        // Prevent interaction outside user's plot in non-edit mode
        if (!editMode && !isInUserPlot(data.block.x, data.block.y)) {
            console.log("Can't interact outside your plot!");
            return;
        }

        isDragging = true;

        // Only allow drawing in edit mode
        if (!editMode && selectedInstance) {
            if (canControlInstance(selectedInstance)) {
                isMoving = true;
                moveStart = [data.block.x, data.block.y];
            } else {
                // Can't move someone else's instance
                console.log("Can't move - this belongs to", selectedInstance.owner);
                isDragging = false;
                return;
            }
        }
        if (!editMode) return;
        
        if (isRectMode) {
			if (selectedRect && data.block.x >= selectedRect.x1 && data.block.x <= selectedRect.x2 && data.block.y >= selectedRect.y1 && data.block.y <= selectedRect.y2) {
				isMoving = true;
				moveStart = [data.block.x, data.block.y];
				
				// Take snapshot of selected area
				moveSnapshot = [];
				for (let y = selectedRect.y1; y <= selectedRect.y2; y++) {
					for (let x = selectedRect.x1; x <= selectedRect.x2; x++) {
						const b = blockMap.get(`${x},${y}`);
						if (b) {
							moveSnapshot.push({
								x: b.x,
								y: b.y,
								color: b.color,
								opacity: b.opacity
							});
						}
					}
				}
			} else {
				rectStart = [data.block.x, data.block.y];
				rectEnd = [data.block.x, data.block.y];
				selectedRect = null;
			}
		}
        
        if (isLineMode) {
            if (!data || !data.block) return;
            lineStart = [data.block.x, data.block.y];
            lineEnd = [data.block.x, data.block.y];
        }
        
    }
    
	function handleMouseUp() {

        if (!editMode && isMoving && selectedInstance) {
            // ADD THIS: Validate new position is within user's plot
            const newX = selectedInstance.x + currentMoveOffset.x;
            const newY = selectedInstance.y + currentMoveOffset.y;
            
            // Check if new position is in plot
            if (!isInUserPlot(newX, newY)) {
                console.log("Can't move outside your plot!");
                currentMoveOffset = { x: 0, y: 0 };
                isMoving = false;
                isDragging = false;
                drawCanvas();
                return;
            }
            
            // Also check if entire asset fits
            const endX = newX + selectedInstance.width - 1;
            const endY = newY + selectedInstance.height - 1;
            if (!isInUserPlot(endX, endY)) {
                console.log("Asset doesn't fit in your plot!");
                currentMoveOffset = { x: 0, y: 0 };
                isMoving = false;
                isDragging = false;
                drawCanvas();
                return;
            }
            
            // Mark old and new regions as dirty
            const oldRegion = getRegionKey(selectedInstance.x, selectedInstance.y);
            
            selectedInstance.x += currentMoveOffset.x;
            selectedInstance.y += currentMoveOffset.y;
            
            const newRegion = getRegionKey(selectedInstance.x, selectedInstance.y);
            
            dirtyRegions.add(oldRegion);
            dirtyRegions.add(newRegion);
            
            // Trigger debounced save
            if (saveTimer) clearTimeout(saveTimer);
            saveTimer = setTimeout(async () => {
                await saveRegions();
            }, 2000);
            
            currentMoveOffset = { x: 0, y: 0 };
            needsSpatialRebuild = true;
        }

        if (isMoving && moveSnapshot && (currentMoveOffset.x !== 0 || currentMoveOffset.y !== 0)) {
            // If Alt is NOT pressed = move (clear originals)
            if (!isAltPressed) {
                for (let i = 0; i < moveSnapshot.length; i++) {
                    const s = moveSnapshot[i];
                    const original = blockMap.get(`${s.x},${s.y}`);
                    if (original) {
                        original.color = 'transparent';
                        original.opacity = 1;
                    }
                }
            }

            // Apply to new positions
            for (let i = 0; i < moveSnapshot.length; i++) {
                const s = moveSnapshot[i];
                const newX = s.x + currentMoveOffset.x;
                const newY = s.y + currentMoveOffset.y;
                if (newX >= 0 && newX < gridSize && newY >= 0 && newY < gridSize) {
                    let target = blockMap.get(`${newX},${newY}`);
                    if (!target) {
                        target = { id: `${newX}-${newY}`, x: newX, y: newY, color: 'transparent', opacity: 1 };
                        blockMap.set(`${newX},${newY}`, target);
                    }
                    target.color = s.color;
                    target.opacity = s.opacity;
                }
            }

            // Update selectedRect position
            selectedRect.x1 += currentMoveOffset.x;
            selectedRect.x2 += currentMoveOffset.x;
            selectedRect.y1 += currentMoveOffset.y;
            selectedRect.y2 += currentMoveOffset.y;
        }

        // Handle line tool
        if (isLineMode && lineStart && lineEnd) {
            const x1 = lineStart[0], y1 = lineStart[1];
            const x2 = lineEnd[0], y2 = lineEnd[1];

            const dx = Math.abs(x2 - x1), dy = Math.abs(y2 - y1);
            const sx = x1 < x2 ? 1 : -1;
            const sy = y1 < y2 ? 1 : -1;
            let err = dx - dy;

            let x = x1, y = y1;
            while (true) {
                let b = blockMap.get(`${x},${y}`);
                if (!b) {
                    b = { id: `${x}-${y}`, x, y, color: 'transparent', opacity: 1 };
                    blockMap.set(`${x},${y}`, b);
                }
                b.color = getEffectiveColor().color;
                b.opacity = getEffectiveColor().opacity;
                
                if (x === x2 && y === y2) break;
                const e2 = 2 * err;
                if (e2 > -dy) { err -= dy; x += sx; }
                if (e2 < dx) { err += dx; y += sy; }
            }

            lineStart = null;
            lineEnd = null;
        }

        isPanning = false;
        isDragging = false;
        isMoving = false;
        moveSnapshot = null;
        currentMoveOffset = { x: 0, y: 0 };

        if (isRectMode && rectStart && rectEnd) {
            rectStart = null;
            rectEnd = null;
        }

        drawCanvas();
    }

    // TO DELETE IN CASE
    function deleteInstance() {
        if (!canControlInstance(selectedInstance)) {
            console.log("Can't delete - not your instance");
            return;
        }

        const index = placedInstances.findIndex(i => i.id === selectedInstance.id);
        if (index >= 0) {
            placedInstances.splice(index, 1);
            markRegionDirty(selectedInstance.x, selectedInstance.y);
            selectedInstance = null;  
            needsSpatialRebuild = true;
            drawCanvas();
        }
    }

    let currentViewedPlot = $state(null);

    let plotCheckTimer = null;
    let cameraUpdateTimer = null;

    // WATCH CAMERA MOVEMENT TO LOAD NEW REGIONS
    $effect(() => {
        // Watch camera position
        camera.x; camera.y; camera.zoom;
        
        if (cameraUpdateTimer) clearTimeout(cameraUpdateTimer);

        cameraUpdateTimer = setTimeout(() => {
            loadVisibleRegions();
        }, 200);

        // Debounce weather updates to prevent infinite loops
        if (!editMode) {
            if (plotCheckTimer) clearTimeout(plotCheckTimer);
            
            plotCheckTimer = setTimeout(() => {
                const currentPlot = getCurrentlyViewedPlot();
                
                // Only update if we've moved to a different plot
                if (currentPlot && (!currentViewedPlot || 
                    currentPlot.plotX !== currentViewedPlot.plotX || 
                    currentPlot.plotY !== currentViewedPlot.plotY)) {
                    
                    currentViewedPlot = currentPlot;
                    
                    if (weatherComponent) {
                        // Check if this is YOUR plot
                        if (currentPlot.owner === userName && myWeatherConfig) {
                            // Use your saved config
                            untrack(() => {
                                weatherComponent.setConfig(myWeatherConfig);
                                weatherEnabled = myWeatherConfig.enabled ?? false;
                                weatherComponent.reinitialize();
                            });
                        } else {
                            // Use other plot's config
                            const plotKey = `${currentPlot.plotX},${currentPlot.plotY}`;
                            const plotWeather = visiblePlotsWeather.get(plotKey);
                            
                            if (plotWeather) {
                                untrack(() => {
                                    weatherComponent.setConfig(plotWeather);
                                    weatherEnabled = plotWeather.enabled ?? false;
                                    weatherComponent.reinitialize();
                                });
                            } else {
                                untrack(() => {
                                    weatherEnabled = false;
                                });
                            }
                        }
                    }
                }
            }, 150);
        }
    });

    function handleClick(e) {
        const data = getBlockFromMouseEvent(e);
        if (!data) return;

        if (!editMode) {

            // Check if clicking on a like button
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const worldX = (mouseX + camera.x) / camera.zoom;
            const worldY = (mouseY + camera.y) / camera.zoom;
            
            // Check each plot's like button
            for (const plot of allPlots) {
                if (plot.owner === userName) continue;
                
                const plotCenterX = (plot.worldX + plot.plotSize / 2) * blockSize;
                const plotBottomY = (plot.worldY + plot.plotSize + 4) * blockSize;
                
                const scale = 1 / camera.zoom;
                const buttonWidth = 70 * scale;
                const buttonHeight = 35 * scale;
                const buttonX = plotCenterX - 60 * scale;
                const buttonY = plotBottomY;
                
                console.log('Checking click:', { worldX, worldY, buttonX, buttonY, buttonWidth, buttonHeight });
                
                if (worldX >= buttonX && worldX <= buttonX + buttonWidth &&
                    worldY >= buttonY && worldY <= buttonY + buttonHeight) {
                    console.log('Like button clicked for:', plot.owner);
                    toggleLike(plot.owner);
                    return; // Stop here, don't process anything else
                }
            }

            if (!isInUserPlot(data.block.x, data.block.y)) {
                console.log("Can't select outside your plot!");
                selectedInstance = null;
                return;
            }

            const clickedX = data.block.x;
            const clickedY = data.block.y;
            
            // Find all instances containing this position
            const instancesHere = placedInstances.filter(inst => 
                clickedX >= inst.x && clickedX < inst.x + inst.width &&
                clickedY >= inst.y && clickedY < inst.y + inst.height
            ).sort((a, b) => b.zIndex - a.zIndex);
            
            if (instancesHere.length === 0) {
                selectedInstance = null;
                return;
            }
            
            // Filter to only user's own instances
            const ownedInstances = instancesHere.filter(inst => canControlInstance(inst));
            const instancesToSelect = ownedInstances.length > 0 ? ownedInstances : instancesHere;

            if (instancesToSelect.length === 0) {
                selectedInstance = null;
                return;
            }
            
            // Check if clicking same position
            if (lastClickPos && lastClickPos.x === clickedX && lastClickPos.y === clickedY) {
                currentCycleIndex = (currentCycleIndex + 1) % instancesToSelect.length;
            } else {
                currentCycleIndex = 0;
                instancesAtLastClick = instancesToSelect;
            }

            selectedInstance = instancesToSelect[currentCycleIndex];
            lastClickPos = { x: clickedX, y: clickedY };
            return;
        }
        
   
        
        const block = data.block;
        
        if (isEyedropperMode) {
            if (block.color !== 'transparent') {                
                handleSetColorPicker(block.color, block.opacity);
            }
            Pointer.current = 0;
        } else if (Pointer.shouldUseSelectedColor && !isRectMode && !isLineMode) {
            // Update blockMap, not temporary block
            let existingBlock = blockMap.get(`${block.x},${block.y}`);
            if (!existingBlock) {
                existingBlock = { id: `${block.x}-${block.y}`, x: block.x, y: block.y, color: 'transparent', opacity: 1 };
                blockMap.set(`${block.x},${block.y}`, existingBlock);
            }
            existingBlock.color = getEffectiveColor().color;
            existingBlock.opacity = getEffectiveColor().opacity;
            drawCanvas();
        }
    }

    function bringForward() {
        if (!selectedInstance || !canControlInstance(selectedInstance)) return;
        
        // Get all instances sorted by z-index
        const sorted = [...placedInstances].sort((a, b) => a.zIndex - b.zIndex);
        const currentIndex = sorted.findIndex(i => i.id === selectedInstance.id);
        
        // Can't move forward if already at top
        if (currentIndex >= sorted.length - 1) return;
        
        // Swap with next higher instance
        const nextUp = sorted[currentIndex + 1];
        const temp = selectedInstance.zIndex;
        selectedInstance.zIndex = nextUp.zIndex;
        nextUp.zIndex = temp;
        
        // Normalize all z-indices to prevent duplicates
        normalizeZIndices();
        markRegionDirty(selectedInstance.x, selectedInstance.y);
        needsResort = true;
        needsSpatialRebuild = true;
        drawCanvas();
    }

    function sendBackward() {
        if (!selectedInstance || !canControlInstance(selectedInstance)) return;
        
        // Get all instances sorted by z-index
        const sorted = [...placedInstances].sort((a, b) => a.zIndex - b.zIndex);
        const currentIndex = sorted.findIndex(i => i.id === selectedInstance.id);
        
        // Can't move backward if already at bottom
        if (currentIndex <= 0) return;
        
        // Swap with next lower instance
        const nextDown = sorted[currentIndex - 1];
        const temp = selectedInstance.zIndex;
        selectedInstance.zIndex = nextDown.zIndex;
        nextDown.zIndex = temp;
        
        // Normalize all z-indices to prevent duplicates
        normalizeZIndices();
        markRegionDirty(selectedInstance.x, selectedInstance.y);
        needsResort = true;
        needsSpatialRebuild = true;
        drawCanvas();
    }
    function bringToFront() {
        if (!selectedInstance || !canControlInstance(selectedInstance)) return;
        
        // Get current max z-index
        const maxZ = Math.max(...placedInstances.map(i => i.zIndex));
        selectedInstance.zIndex = maxZ + 1;
        
        // Normalize all z-indices
        normalizeZIndices();
        markRegionDirty(selectedInstance.x, selectedInstance.y);
        needsResort = true;
        needsSpatialRebuild = true;
        drawCanvas();
    }
    function sendToBack() {
        if (!selectedInstance || !canControlInstance(selectedInstance)) return;
        
        // Get current min z-index
        const minZ = Math.min(...placedInstances.map(i => i.zIndex));
        selectedInstance.zIndex = minZ - 1;
        
        // Normalize all z-indices
        normalizeZIndices();
        markRegionDirty(selectedInstance.x, selectedInstance.y);
        needsResort = true;
        needsSpatialRebuild = true;
        drawCanvas();
    }

    function normalizeZIndices() {
        // Sort all instances by their current z-index
        const sorted = [...placedInstances].sort((a, b) => a.zIndex - b.zIndex);
        
        // Reassign z-indices starting from 0 with no gaps or duplicates
        sorted.forEach((instance, index) => {
            instance.zIndex = index;
        });
        
        console.log('Z-indices normalized:', placedInstances.map(i => ({ id: i.id.slice(0, 8), z: i.zIndex })));
    }

    function handleMouseLeave() {
        hoveringBlock = null;
    }

    function handleWheel(e) {
        e.preventDefault();

        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Zoom in (scroll up) or out (scroll down)
        const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;

        // Compute how many grid blocks are visible horizontally
        const visibleBlocksX = canvasSize.width / (camera.zoom * blockSize);
        const visibleBlocksY = canvasSize.height / (camera.zoom * blockSize);

        // Stop zooming OUT if 100 or more grids fit horizontally or vertically
        if (e.deltaY > 0 && (visibleBlocksX >= 400 || visibleBlocksY >= 400)) {
            return; // stop further zooming out
        }

        // Apply zoom, clamped between min and max
        const minZoomX = canvasSize.width / (gridSize * blockSize);
        const minZoomY = canvasSize.height / (gridSize * blockSize);
        const minZoom = Math.max(minZoomX, minZoomY) * 7;
        const maxZoom = 8;

        const newZoom = Math.max(minZoom, Math.min(maxZoom, camera.zoom * zoomFactor));

        // Adjust camera to zoom toward mouse position
        const worldX = (mouseX + camera.x) / camera.zoom;
        const worldY = (mouseY + camera.y) / camera.zoom;

        camera.x = worldX * newZoom - mouseX;
        camera.y = worldY * newZoom - mouseY;
        camera.zoom = newZoom;

        // Clamp camera bounds
        const maxX = Math.max(0, gridSize * blockSize * newZoom - canvasSize.width);
        const maxY = Math.max(0, gridSize * blockSize * newZoom - canvasSize.height);

        camera.x = Math.max(0, Math.min(maxX, camera.x));
        camera.y = Math.max(0, Math.min(maxY, camera.y));
        needsRedraw = true; 
    }

    // touch event handlers
    function handleTouchStart(e) {
        e.preventDefault();
        touchStartTime = Date.now();
        
        if (e.touches.length === 1) {
            // Single touch - treat as mouse down for drawing/interaction
            const touch = e.touches[0];
            isTouchDragging = true;
            handleMouseDown(getTouchAsMouseEvent(touch));
        } else if (e.touches.length === 2) {
            // Two fingers - prepare for pinch zoom
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const center = getTouchCenter(touch1, touch2);
            
            lastTouchDistance = getTouchDistance(touch1, touch2);
            lastTouchCenter = center;
        }
    }

    function handleTouchMove(e) {
        e.preventDefault();
        
        if (e.touches.length === 1 && isTouchDragging) {
            const touch = e.touches[0];
            handleMouseMove(getTouchAsMouseEvent(touch));
        } else if (e.touches.length === 2) {
            // Two finger gesture - zoom toward center, pan slightly follows
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const currentDistance = getTouchDistance(touch1, touch2);
            const currentCenter = getTouchCenter(touch1, touch2);
            
            if (lastTouchDistance && lastTouchCenter) {
                const zoomFactor = currentDistance / lastTouchDistance;
                const rect = canvas.getBoundingClientRect();
                
                // FIXED: Use actual canvas dimensions, not scaled ones
                const centerX = currentCenter.x - rect.left;
                const centerY = currentCenter.y - rect.top;
                
                const minZoomX = canvasSize.width / (gridSize * blockSize);
                const minZoomY = canvasSize.height / (gridSize * blockSize);
                const minZoom = Math.max(minZoomX, minZoomY) * 7;
                const maxZoom = 8;
                const newZoom = Math.max(minZoom, Math.min(maxZoom, camera.zoom * zoomFactor));
                
                // Zoom toward the pinch center
                const worldX = (centerX + camera.x) / camera.zoom;
                const worldY = (centerY + camera.y) / camera.zoom;
                
                camera.x = worldX * newZoom - centerX;
                camera.y = worldY * newZoom - centerY;
                
                // FIXED: Calculate pan delta properly
                const centerDeltaX = (currentCenter.x - lastTouchCenter.x);
                const centerDeltaY = (currentCenter.y - lastTouchCenter.y);
                camera.x -= centerDeltaX * 1.2;
                camera.y -= centerDeltaY * 1.2;
                
                camera.zoom = newZoom;
                
                // FIXED: Clamp using actual canvas size
                const maxX = Math.max(0, gridSize * blockSize * newZoom - canvasSize.width);
                const maxY = Math.max(0, gridSize * blockSize * newZoom - canvasSize.height);
                camera.x = Math.max(0, Math.min(maxX, camera.x));
                camera.y = Math.max(0, Math.min(maxY, camera.y));
                
                needsRedraw = true;
            }
            
            lastTouchDistance = currentDistance;
            lastTouchCenter = currentCenter;
        }
    }

    function handleTouchEnd(e) {
        e.preventDefault();
        
        const touchDuration = Date.now() - touchStartTime;
        
        if (e.touches.length === 0) {
            // All fingers lifted
            if (touchDuration < 200 && !isPanning && isTouchDragging) {
                // Quick tap - treat as click
                const touch = e.changedTouches[0];
                handleClick(getTouchAsMouseEvent(touch));
            }
            
            handleMouseUp();
            isTouchDragging = false;
            isPanning = false;
            lastTouchDistance = null;
            lastTouchCenter = null;
        } else if (e.touches.length === 1) {
            // One finger remaining - reset to single touch mode
            lastTouchDistance = null;
            lastTouchCenter = null;
        }
    }

    let isTouchDevice = $state(false);

    function focusOnCoordinates(x, y, width, height) {
        // Calculate center of the asset in world coordinates
        const centerX = (x + width / 2) * blockSize;
        const centerY = (y + height / 2) * blockSize;
        
        // Calculate zoom to fit the asset nicely with padding
        const padding = 1.5;
        const zoomX = canvasSize.width / (width * blockSize * padding);
        const zoomY = canvasSize.height / (height * blockSize * padding);
        const targetZoom = Math.min(zoomX, zoomY);
        
        // Clamp zoom
        const minZoomX = canvasSize.width / (gridSize * blockSize);
        const minZoomY = canvasSize.height / (gridSize * blockSize);
        const minZoom = Math.max(minZoomX, minZoomY) * 7;
        const maxZoom = 8;
        
        camera.zoom = Math.max(minZoom, Math.min(maxZoom, targetZoom));
        
        // Center camera on the asset
        camera.x = centerX * camera.zoom - canvasSize.width / 2;
        camera.y = centerY * camera.zoom - canvasSize.height / 2;
        
        // Clamp camera bounds
        const maxX = Math.max(0, gridSize * blockSize * camera.zoom - canvasSize.width);
        const maxY = Math.max(0, gridSize * blockSize * camera.zoom - canvasSize.height);
        
        camera.x = Math.max(0, Math.min(maxX, camera.x));
        camera.y = Math.max(0, Math.min(maxY, camera.y));
        
        needsRedraw = true;
        drawCanvas();
    }

    function toggleShowPlots() {
        showPlots = !showPlots;
        if (showPlots) {
            loadLeaderboard(); // Refresh when opening
        }
    }

    onMount(async () => {
        ctx = canvas.getContext('2d');
        handleResize(); // Add this
        window.addEventListener('resize', handleResize); // Add this
        animationFrameId = requestAnimationFrame(animate);
        isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        // Check if there's an asset to place when editor mounts
        if (editMode && EditorState?.assetToPlace) {
            const block = EditorState?.assetToPlace;
            
            setTimeout(() => {
                const centerScreenX = canvasSize.width / 2;
                const centerScreenY = canvasSize.height / 2;
                const centerWorldX = (centerScreenX + camera.x) / camera.zoom;
                const centerWorldY = (centerScreenY + camera.y) / camera.zoom;
                
                const startX = Math.floor(centerWorldX / blockSize) - Math.floor(block.width / 2);
                const startY = Math.floor(centerWorldY / blockSize) - Math.floor(block.height / 2);
                
                placeBlockInCenter(block);
                
                setTimeout(() => {
                    focusOnCoordinates(startX, startY, block.width, block.height);
                }, 50);
                
                EditorState.assetToPlace = null;
            }, 100);
        }

        loadVisibleRegions();
        loadVisiblePlotsWeather();
        loadWeatherConfig();
        loadDayNightConfig();

        await loadAllLikes(); // Load likes initially
        await loadLeaderboard();
        // Refresh likes every 30 seconds
        setInterval(() => {
            loadAllLikes();
        }, 30000);

      

        return () => {
            window.removeEventListener('resize', handleResize);
            
            // Cancel animation loop on cleanup
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            
            if (dirtyRegions.size > 0) {
                saveRegions();
            }

            if (weatherComponent && !editMode && currentViewedPlot?.owner === userName) {
                saveWeatherConfig();
            }
        };
    });

    // Focus on user plot when it becomes available (only once)
    let hasInitiallyFocused = $state(false);

    $effect(() => {
        if (!hasInitiallyFocused && userPlot && canvasSize.width > 0 && canvasSize.height > 0) {
            focusOnPlot(userPlot);
            drawCanvas();
            hasInitiallyFocused = true;
        }
    });


    // plot management
    function isInUserPlot(x, y) {
        if (!userPlot) return false;
        
        return (
            x >= userPlot.worldX && 
            x < userPlot.worldX + userPlot.plotSize &&
            y >= userPlot.worldY && 
            y < userPlot.worldY + userPlot.plotSize
        );
    }

    function focusOnPlot(plot) {
        // Calculate zoom level to fit the plot nicely in view (with some padding)
        const padding = 1.5; // Show plot with 50% extra space around it
        const zoomX = canvasSize.width / (plot.plotSize * blockSize * padding);
        const zoomY = canvasSize.height / (plot.plotSize * blockSize * padding);
        
        // Use the smaller zoom to ensure plot fits in both dimensions
        const targetZoom = Math.min(zoomX, zoomY);
        
        // Clamp zoom to acceptable range
        const minZoomX = canvasSize.width / (gridSize * blockSize);
        const minZoomY = canvasSize.height / (gridSize * blockSize);
        const minZoom = Math.max(minZoomX, minZoomY) * 7;
        const maxZoom = 8;
        
        camera.zoom = Math.max(minZoom, Math.min(maxZoom, targetZoom));
        
        // Center camera on the plot with new zoom
        const targetX = (plot.worldX + plot.plotSize / 2) * blockSize * camera.zoom - canvasSize.width / 2;
        const targetY = (plot.worldY + plot.plotSize / 2) * blockSize * camera.zoom - canvasSize.height / 2;
        
        camera.x = Math.max(0, targetX);
        camera.y = Math.max(0, targetY);
    }

    let showPlots = $state(false)

    export function openAssetPicker(){
        showAssetPicker = true
    }

    export function toggleAssetPicker(){
        showAssetPicker = !showAssetPicker
    }

    export function closeAssetPicker(){
        showAssetPicker = false
    }

    function duplicateInstance() {
        if (!canControlInstance(selectedInstance)) {
            console.log("Can't duplicate - not your instance");
            return;
        }

        // Calculate offset for the duplicate (place it slightly to the right and down)
        const offsetX = 2;
        const offsetY = 2;
        
        const newX = selectedInstance.x + offsetX;
        const newY = selectedInstance.y + offsetY;
        
        // Check if duplicate fits within user's plot
        if (!isInUserPlot(newX, newY)) {
            console.log("Can't duplicate outside your plot!");
            return;
        }
        
        const endX = newX + selectedInstance.width - 1;
        const endY = newY + selectedInstance.height - 1;
        if (!isInUserPlot(endX, endY)) {
            console.log("Duplicate doesn't fit in your plot!");
            return;
        }

        // Create the duplicate instance
        const duplicate = {
            id: `instance-${crypto.randomUUID()}`,
            assetId: selectedInstance.assetId,
            x: newX,
            y: newY,
            width: selectedInstance.width,
            height: selectedInstance.height,
            zIndex: Math.max(...placedInstances.map(i => i.zIndex)) + 1, // Place on top
            owner: userName,
            shadow: {
                enabled: false,
                color: '#000000',
                opacity: 0.3,
                offsetX: 2,
                offsetY: 2,
                angle: 45,
                length: 4,
                blur: 2,
                skewX: 0.5
            },
            light: {
                enabled: false,
                color: '#ffaa00',
                intensity: 2,           // Updated default
                radius: 5,
                blur: 30,
                offsetX: 0,
                offsetY: 0,
                ellipseX: 1,           // NEW
                ellipseY: 1,           // NEW
                pulseEnabled: false,
                pulseSpeed: 1,
                pulseMin: 0.5,
                pulseMax: 5  
            }
        };
        
        placedInstances.push(duplicate);
        normalizeZIndices();
        // Mark region as dirty
        markRegionDirty(newX, newY);
        
        // Select the new duplicate
        selectedInstance = null;
        
        needsResort = true;
        needsSpatialRebuild = true;
        drawCanvas();
        
        console.log('Instance duplicated successfully');
    }


    export function clearAll() {
        blockMap.clear();
        drawCanvas();
    }


    export function toggleWeatherEditor(){
        showWeatherEditor = !showWeatherEditor
    }

    $effect(() => {
        Pointer.current;
        selectedRect = null;
    });

    // Watch for shadow changes on selected instance
    $effect(() => {
        if (selectedInstance?.shadow) {
            // Track all shadow properties
            selectedInstance.shadow.enabled;
            selectedInstance.shadow.color;
            selectedInstance.shadow.opacity;
            selectedInstance.shadow.offsetX;
            selectedInstance.shadow.offsetY;
            selectedInstance.shadow.angle;
            selectedInstance.shadow.length;
            selectedInstance.shadow.blur;
            selectedInstance.shadow.skewX;
            
            needsRedraw = true;
            drawCanvas();
        }
    });

    // for lights
    $effect(() => {
        if (selectedInstance?.light) {
            selectedInstance.light.enabled;
            selectedInstance.light.color;
            selectedInstance.light.intensity;
            selectedInstance.light.radius;
            selectedInstance.light.blur;
            selectedInstance.light.offsetX;
            selectedInstance.light.offsetY;
            selectedInstance.light.ellipseX;      // NEW
            selectedInstance.light.ellipseY;      // NEW
            selectedInstance.light.pulseEnabled;
            selectedInstance.light.pulseSpeed;
            selectedInstance.light.pulseMin;
            selectedInstance.light.pulseMax;
            
            needsRedraw = true;
            drawCanvas();
        }
    });

    $effect(() => {
        // Don't save until initial data is loaded
        if (!dayNightConfig || !isDayNightLoaded) return;
        
        dayNightConfig.enabled;
        dayNightConfig.timeOfDay;
        // dayNightConfig.overlayOpacity;
        // // dayNightConfig.currentColor;
        // dayNightConfig.morningColor;
        // dayNightConfig.noonColor;
        // dayNightConfig.nightColor;
        
        scheduleDayNightSave(); // Only save after loaded
        needsRedraw = true;
        // drawCanvas();
    });

    let shareWorldCaption = $state("")
    let showShareModal = $state(false)

    
    let isPosting = $state(false);
    async function handleShare(e) {
        e.preventDefault();
        
        if (!shareWorldCaption.trim()) {
            console.log('Please enter a caption');
            return;
        }
        
        if (!userPlot) {
            console.log('No plot found');
            return;
        }

        isPosting = true;

        try {
            console.log('Creating image...');
            
            // Create capture canvas
            const plotCanvas = document.createElement('canvas');
            const size = 512;
            plotCanvas.width = size;
            plotCanvas.height = size;
            
            const plotCtx = plotCanvas.getContext('2d');
            if (!plotCtx) return;
            
            // Fill background
            plotCtx.fillStyle = '#f0f0f0';
            plotCtx.fillRect(0, 0, size, size);
            
            // Calculate scale
            const scale = size / (userPlot.plotSize * blockSize);
            
            // Get all instances in the user's plot
            const plotInstances = placedInstances.filter(inst => {
                // Check if instance is within user's plot bounds
                return inst.x >= userPlot.worldX && 
                    inst.x < userPlot.worldX + userPlot.plotSize &&
                    inst.y >= userPlot.worldY && 
                    inst.y < userPlot.worldY + userPlot.plotSize;
            }).sort((a, b) => a.zIndex - b.zIndex); // Sort by z-index for correct layering
            
            console.log('Found instances:', plotInstances.length);
            
            // Draw each instance WITH its shadow (in z-index order)
            for (const inst of plotInstances) {
                const assetImage = getAssetImage(inst.assetId);
                
                if (!assetImage) {
                    console.log('Asset not loaded:', inst.assetId);
                    continue;
                }
                
                // Calculate position relative to plot origin
                const relativeX = (inst.x - userPlot.worldX) * blockSize * scale;
                const relativeY = (inst.y - userPlot.worldY) * blockSize * scale;
                const instWidth = inst.width * blockSize * scale;
                const instHeight = inst.height * blockSize * scale;
                
                // 1. Draw shadow FIRST (if enabled)
                if (inst.shadow?.enabled) {
                    const shadow = inst.shadow;
                    const angleRad = (shadow.angle * Math.PI) / 180;
                    const shadowDepth = shadow.length * blockSize * scale;
                    const isoOffsetX = Math.cos(angleRad) * shadowDepth;
                    const isoOffsetY = Math.sin(angleRad) * shadowDepth * 0.5;
                    
                    const skewExtent = Math.abs(shadow.skewX * instHeight);
                    const buffer = 100 * scale;
                    
                    const offscreenCanvas = document.createElement('canvas');
                    offscreenCanvas.width = instWidth + Math.abs(isoOffsetX) + skewExtent + buffer;
                    offscreenCanvas.height = instHeight + Math.abs(isoOffsetY) + buffer;
                    const offCtx = offscreenCanvas.getContext('2d');
                    
                    offCtx.save();
                    offCtx.globalAlpha = shadow.opacity;
                    if (shadow.blur > 0) {
                        offCtx.filter = `blur(${shadow.blur * scale}px)`;
                    }
                    
                    const bufferOffset = buffer / 2 + skewExtent / 2;
                    offCtx.translate(bufferOffset, buffer / 2);
                    offCtx.transform(1, 0, shadow.skewX, 0.5, 0, 0);
                    offCtx.drawImage(assetImage, isoOffsetX, -isoOffsetY, instWidth, instHeight);
                    
                    offCtx.globalCompositeOperation = 'source-in';
                    offCtx.fillStyle = shadow.color;
                    offCtx.fillRect(isoOffsetX, -isoOffsetY, instWidth, instHeight);
                    offCtx.restore();
                    
                    plotCtx.drawImage(
                        offscreenCanvas, 
                        relativeX + shadow.offsetX * blockSize * scale - bufferOffset, 
                        relativeY + shadow.offsetY * blockSize * scale - buffer / 2
                    );
                }
                
                // 2. Draw the asset itself
                plotCtx.drawImage(assetImage, relativeX, relativeY, instWidth, instHeight);
            }

            // 3. THEN apply day/night overlay over everything
            if (dayNightConfig?.enabled) {
                plotCtx.save();
                plotCtx.globalCompositeOperation = 'multiply';
                plotCtx.fillStyle = dayNightConfig.currentColor;
                plotCtx.globalAlpha = dayNightConfig.overlayOpacity;
                plotCtx.fillRect(0, 0, size, size);
                plotCtx.restore();
            }

            // 4. FINALLY draw all lights on top
            // 4. FINALLY draw all lights on top
            for (const inst of plotInstances) {
                if (inst.light?.enabled) {
                    const light = inst.light;
                    const relativeX = (inst.x - userPlot.worldX) * blockSize * scale;
                    const relativeY = (inst.y - userPlot.worldY) * blockSize * scale;
                    const instWidth = inst.width * blockSize * scale;
                    const instHeight = inst.height * blockSize * scale;
                    
                    const centerX = relativeX + instWidth / 2 + light.offsetX * blockSize * scale;
                    const centerY = relativeY + instHeight / 2 + light.offsetY * blockSize * scale;
                    const radius = light.radius * blockSize * scale;
                    
                    plotCtx.save();
                    plotCtx.globalCompositeOperation = 'screen';
                    
                    if (light.blur > 0) {
                        plotCtx.filter = `blur(${light.blur}px)`; // Remove * scale here
                    }
                    
                    plotCtx.translate(centerX, centerY);
                    plotCtx.scale(light.ellipseX || 1, light.ellipseY || 1);
                    
                    const gradient = plotCtx.createRadialGradient(0, 0, 0, 0, 0, radius);
                    const hexToRgb = (hex) => {
                        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                        return result ? {
                            r: parseInt(result[1], 16),
                            g: parseInt(result[2], 16),
                            b: parseInt(result[3], 16)
                        } : { r: 255, g: 255, b: 255 };
                    };
                    const rgb = hexToRgb(light.color);
                    const intensity = light.intensity * 0.6; // Reduce intensity by 40%
                    
                    gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${Math.min(1, intensity)})`);
                    gradient.addColorStop(0.5, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${Math.min(1, intensity * 0.4)})`);
                    gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
                    
                    plotCtx.fillStyle = gradient;
                    plotCtx.fillRect(-radius, -radius, radius * 2, radius * 2);
                    
                    plotCtx.restore();
                }
            }
            
            // Convert to PNG
            const dataUrl = plotCanvas.toDataURL('image/png', 0.95);
            console.log('Image size:', (dataUrl.length * 0.75 / 1024).toFixed(2), 'KB');
            
            const base64Data = dataUrl.split(',')[1];
            
            // Send to backend
            const response = await fetch('/api/share-plot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageData: base64Data,
                    caption: shareWorldCaption
                })
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                showToast({
                    text: `Posted successfully! 🎉\n\n${data.redditPostUrl}`,
                    appearance: 'success'
                });
                console.log(`Posted successfully! 🎉\n\n${data.redditPostUrl}`);
                showShareModal = false;
                shareWorldCaption = '';
            } else {
                console.log('Failed: ' + data.message);
            }
            
        } catch (error) {
            console.error('Error:', error);
            console.log('Error: ' + error.message);
        } finally {
            isPosting = false; // Add this
        }
    }



    $effect(() => {
        // Only update when dependencies actually change
        const shouldEdit = !editMode && canControlInstance(selectedInstance);
        
        // Only update if value actually changed (prevents unnecessary reactivity)
        if (canEditSelectedInstance !== shouldEdit) {
            canEditSelectedInstance = shouldEdit;
        }
    });

    let musicPlayer = $state(null)
    let isPlaying = $state(false)
    function toggleMusic() {
        if (musicPlayer) {
            musicPlayer.toggleMusic();
        }
    }

</script>

<svelte:window 
    onmouseup={handleMouseUp}
    onkeydown={(e) => { 
        if (e.key === 'Alt') isAltPressed = true;
    }}
    onkeyup={(e) => { 
        if (e.key === 'Alt') isAltPressed = false;
    }}
/>

<MusicPlayer bind:isPlaying={isPlaying} bind:this={musicPlayer} />

<div 
bind:this={container}
class="relative  h-full w-full">

    <!-- svelte-ignore element_invalid_self_closing_tag -->
    <canvas
		bind:this={canvas}
		width={canvasSize.width}
        height={canvasSize.height}
		onmousedown={handleMouseDown}
		onmousemove={handleMouseMove}
		onclick={handleClick}
        onmouseleave={handleMouseLeave}
        onwheel={handleWheel} 
        ontouchstart={handleTouchStart}
        ontouchmove={handleTouchMove}
        ontouchend={handleTouchEnd}
        ontouchcancel={handleTouchEnd}
        oncontextmenu={(e) => e.preventDefault()}
		class="border-[0.125em] border-[#ccc]"
        style="width: {canvasSize.width}px; height: {canvasSize.height}px; 
            cursor: {isPanning ? 'grabbing' : (editMode ? 'crosshair' : 'default')};"	
    />
    
    <!-- <div class="pointer-events-none absolute top-1em  flex justify-center items-center gap-[0.5em] w-full">
        <button
            onclick={() => { showIsoGrid = !showIsoGrid }}
            class="pointer-events-auto shadow-md rounded-[0.5em] py-[0.3em] px-[1em]
            {showIsoGrid ? 'bg-black text-white' : 'bg-[#f8f8f8]'}"
        >
            Iso Grid
        </button>
        <button
            onclick={() => { showGridLines = !showGridLines }}
            class="pointer-events-auto shadow-md rounded-[0.5em] py-[0.3em] px-[1em]
            {showGridLines ? 'bg-black text-white' : 'bg-[#f8f8f8]'}"
        >
            Grid Lines
        </button>
        <button
            onclick={() => { showPlotBoundary = !showPlotBoundary }}
            class="pointer-events-auto shadow-md rounded-[0.5em] py-[0.3em] px-[1em]
            {showPlotBoundary ? 'bg-black text-white' : 'bg-[#f8f8f8]'}"
        >
            My Boundary
        </button>
    </div> -->
    <!-- {#if hoveringBlock}
        <div
            class="flex gap-[1em] pointer-events-none right-1em top-1em absolute text-[1em] bg-white/80 border px-[1em] py-[0.2em] text-black "
        >
            <div class="">X:{hoveringBlock.x}</div> 
            <div class="">Y:{hoveringBlock.y}</div>
        </div>
    {/if} -->

    {#if !editMode && canControlInstance(selectedInstance)}
        <div class="fixed bottom-1em left-1/2 flex  gap-[0.3em] -translate-x-1/2   ">
            
            
            <div class="flex bg-black gap-[1px] p-[1px]">
                <button
                    onclick={duplicateInstance}
                    class=" block p-[0.2em] bg-white
                    "
                    >
                    <div class="size-[2em]">
                        <img src="/images/icons/duplicate.svg" class="" alt="" />
                    </div>
                </button>
            </div>
            <div class="w-[0.2em] bg-black"></div>
            
            <div class="flex bg-black gap-[1px] p-[1px]">
                <button
                    onclick={bringToFront}
                    class="block p-[0.2em] bg-white
                    "
                >
                    <div class="size-[2em]">
                        <img src="/images/icons/tofront.svg" class="" alt="" />
                    </div>
                </button>
                <button
                    onclick={bringForward}
                    class="block p-[0.2em] bg-white
                    "
                >
                    <div class="size-[2em]">
                        <img src="/images/icons/forward.svg" class="" alt="" />
                    </div>
                </button>
                <button
                    onclick={sendBackward}
                    class="block p-[0.2em] bg-white
                    "
                >
                    <div class="size-[2em]">
                        <img src="/images/icons/backward.svg" class="" alt="" />
                    </div>
                </button>
                <button
                    onclick={sendToBack}
                    class="block p-[0.2em] bg-white
                    "
                >
                    <div class="size-[2em]">
                        <img src="/images/icons/tobottom.svg" class="" alt="" />
                    </div>
                </button>
            </div>

            <div class="w-[0.2em] bg-black"></div>
            
            <div class="flex bg-black gap-[1px] p-[1px]">
                <button
                    onclick={deleteInstance}
                    class=" block p-[0.2em] bg-white
                    "
                    >
                    <div class="size-[2em]">
                        <img src="/images/icons/delete.svg" class="" alt="" />
                    </div>
                </button>
            </div>

            <!-- <div class="w-[0.2em] bg-black"></div> -->

            <!-- <div class="flex bg-black gap-[1px] p-[1px]">
                <button
                    onclick={() => showShadowEditor = !showShadowEditor}
                    class="{showShadowEditor ? 'invert' : ''} block p-[0.2em] bg-white"
                >
                    <div class="size-[2em]">
                        <img src="/images/world/shadows.svg" class="" alt="" />
                    </div>
                </button>
            </div> -->
            <!-- <div class="flex bg-black gap-[1px] p-[1px]">
                <button
                    onclick={() => { showLightEditor = !showLightEditor; }}
                    class="bg-white px-[0.5em] py-[0.3em] rounded hover:bg-gray-100"
                >
                    💡 Light
                </button>
            </div> -->
           
            
            
        </div>
    {/if}


</div>

<!-- Instance Debug Panel -->
<!-- {#if showInstanceDebug && !editMode}
    <div class="fixed right-[1em] top-[1em] bg-white border p-[0.5em] max-h-[80vh] overflow-y-auto w-[20em] z-50">
        <div class="flex items-center justify-between mb-[0.5em] pb-[0.3em] border-b">
            <h3 class="text-[1.2em] ">Instance Debug ({placedInstances.length})</h3>
            <button onclick={() => showInstanceDebug = false} class="text-[1.5em] leading-none">×</button>
        </div>
        
        <div class="space-y-[0.3em]">
            {#each placedInstances as instance, idx}
                {@const isOwned = canControlInstance(instance)}
                {@const isSelected = selectedInstance?.id === instance.id}
                <button
                    onclick={() => {
                        selectedInstance = instance;
                        focusOnCoordinates(instance.x, instance.y, instance.width, instance.height);
                    }}
                    class="w-full text-left p-[0.5em] border rounded
                        {isSelected ? 'bg-blue-100 border-blue-500' : 'hover:bg-gray-50'}
                        {!isOwned ? 'opacity-50' : ''}"
                >
                    <div class="flex items-start justify-between gap-[0.5em]">
                        <div class="flex-1">
                            <div class=" text-[0.9em]">
                                #{idx} - {isOwned ? '👤' : '🔒'} {instance.owner}
                            </div>
                            <div class="text-[0.8em] text-gray-600">
                                ID: {instance.id.slice(0, 12)}...
                            </div>
                            <div class="text-[0.8em]">
                                Pos: ({instance.x}, {instance.y})
                            </div>
                            <div class="text-[0.8em]">
                                Size: {instance.width}×{instance.height}
                            </div>
                            <div class="text-[0.8em]">
                                Z-Index: {instance.zIndex}
                            </div>
                            <div class="text-[0.8em]">
                                Asset: {instance.assetId.slice(0, 12)}...
                            </div>
                        </div>
                    </div>
                </button>
            {/each}
        </div>
    </div>
{/if} -->

{#if showShareModal}
    <div class="bg-white fixedCenter z-[50] w-[19em] p-[0.4em] border">  
        <div class="p-[1.5em] border relative">
            <!-- svelte-ignore a11y_consider_explicit_label -->
            <div class="absolute top-0 left-0 flex justify-end w-full p-[0.65em]">
                <button
                    onclick={()=>showShareModal = false}
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
    
            <form onsubmit={handleShare} class="relative w-[70%] mx-auto mt-[0.6em]">
                <div class="space-y-[0.2em]">
                    <label
                        class="text-center mx-auto block whitespace-nowrap"
                        for="name"
                    >
                        Share your world!</label
                    >
                    <input
                        placeholder="Cool Caption"
                        class="text-center px-[0.2em] border w-full"
                        type="text"
                        id="name"
                        required
                        bind:value={shareWorldCaption}
                    />
                </div>
    
                <button
                    type="submit"
                    disabled={isPosting}
                    class="disabled:opacity-50 cursor-pointer w-[65%] mx-auto block mt-[1em] bg-black text-white py-[1px]"
                >
                    {isPosting ? 'Posting...' : 'Post'}
                </button>
            </form>
        </div>
    </div>
    
{/if}
<!-- asset picker -->
{#if showAssetPicker}
    <AssetPicker 
        bind:showAssetPicker={showAssetPicker}
        {placeBlockInCenter}
        {editMode}
    />
{/if}

<div class="absolute bottom-[4em] sm:bottom-[1em] left-[1em]">
    {#if isLoadingRegions}
        <div class="border  bg-white px-[0.89em] py-[0.2em] text-sm">
            Loading regions...
        </div>
    {/if}
    
    {#if isSavingRegions}
        <div class="border bg-green-100 px-[0.89em] py-[0.2em] text-sm">
            Saving...
        </div>
    {:else if dirtyRegions.size === 0 && placedInstances.length > 0}
        <div class="border bg-white px-[0.89em] py-[0.2em] text-sm">
            All changes saved
        </div>
    {/if}
</div>


<div class="fixed left-1em top-1em flex bg-black p-[1px] gap-[1px]">
    <!-- music -->
    <button
        onclick={toggleMusic}
        class="block p-[0.2em] bg-white
        "
    >
        <div class="size-[2em] relative">
            <img src="/images/icons/music.svg" class="" alt="" />
            {#if !isPlaying}
                <div class="absoluteCenter w-[1.5em]">
                    <svg viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <line x1="0.357384" y1="21.5683" x2="21.5706" y2="0.355119" stroke="black"/>
                    </svg>
                </div>
            {/if}
        </div>
    </button>


    {#if !editMode}
        <!-- worlds -->
        <button
            onclick={toggleShowPlots}
            class="{showPlots ? "buttonActive": ""} block p-[0.2em] bg-white
            "
        >
            <div class="size-[2em]">
                <img src="/images/icons/worlds.svg" class="" alt="" />
            </div>
        </button>
    
        <!-- share -->
        <button
            onclick={()=>showShareModal = true}
            class="block p-[0.2em] bg-white
            "
        >
            <div class="size-[2em]">
                <img src="/images/icons/share.svg" class="" alt="" />
            </div>
        </button>
  
        <!-- <button
            onclick={() => { showDayNightPanel = !showDayNightPanel; }}
            class="bg-white px-[0.5em] py-[0.3em] rounded hover:bg-gray-100"
            title="Day/Night Cycle"
        >
            🌗 Day/Night
        </button> -->


       {#if allPlots && allPlots.length > 0 && showPlots}
            <div class="absolute left-0 top-[calc(100%+0.5em)] border bg-white p-[0.2em]">
                <div class="border">
                    <div class="bg-black text-white text-center px-[0.8em] py-[0.1em]">
                        <p class="text-[1em] text-center">Leaderboard</p>
                    </div>
                    
                    <div class="max-h-[15em] overflow-y-auto w-[13em]">
                        <div class="space-y-1">
                            {#each leaderboardData as entry, index}
                                <button
                                    onclick={() => {
                                        const plot = allPlots.find(p => p.owner === entry.owner);
                                        if (plot) focusOnPlot(plot);
                                    }}
                                    class="w-full text-left p-[0.8em] flex justify-between items-center py-[0.2em] hover:bg-gray-100
                                        {entry.owner === userName ? 'bg-light-grey' : ''}"
                                >
                                    <div class="flex items-center gap-[0.3em] flex-1">
                                        <span class=" text-[0.85em] w-[1.2em]">{index + 1}.</span>
                                        <p class="text-[0.9em]">{entry.owner.length > 15 ? entry.owner.slice(0, 15) + '…' : entry.owner} {entry.owner === userName ? '--You' : ''}</p>
                                    </div>
                                    
                                    <div class="flex items-center gap-[0.2em]">
                                        <span class=" text-[0.85em]">{entry.likes}</span>
                                        <div class="w-[1em]">
                                            <svg viewBox="0 0 15 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M1.66314 7.18099L6.7746 12.1327C6.87896 12.2338 6.93114 12.2844 6.98504 12.3154C7.1394 12.4042 7.32935 12.4042 7.48371 12.3154C7.53761 12.2844 7.58979 12.2338 7.69413 12.1327L7.69415 12.1327L12.8056 7.18099C14.1932 5.83677 14.3629 3.66973 13.2014 2.12594L12.9165 1.74723C11.4976 -0.138699 8.57978 0.171087 7.58853 2.3129C7.44886 2.61469 7.01989 2.61469 6.88022 2.3129C5.88897 0.171087 2.97117 -0.138698 1.55229 1.74723L1.26737 2.12594C0.105893 3.66973 0.275555 5.83677 1.66314 7.18099Z" 
                                                    fill="{entry.likes > 0 ? '#ff6b6b' : ''}" 
                                                    stroke="black"/>
                                            </svg>
                                        </div>
                                    </div>
                                </button>
                            {/each}
                        </div>
                    </div>
                    
                    <div class="text-[0.9em] py-[0.1em] bg-black flex justify-center items-center gap-[0.5em] text-white">
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
        {/if}


        <!-- svelte-ignore a11y_consider_explicit_label -->
        <!-- <button
            onclick={() => showInstanceDebug = !showInstanceDebug}
            class="{showInstanceDebug ? "invert": ""} block p-[0.2em] bg-white"
        >
            <div class="size-[2em]">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="3" width="7" height="7" stroke="currentColor" stroke-width="2"/>
                    <rect x="14" y="3" width="7" height="7" stroke="currentColor" stroke-width="2"/>
                    <rect x="3" y="14" width="7" height="7" stroke="currentColor" stroke-width="2"/>
                    <rect x="14" y="14" width="7" height="7" stroke="currentColor" stroke-width="2"/>
                </svg>
            </div>
        </button> -->
    {/if}
</div>


<Weather 
    bind:this={weatherComponent}
    bind:camera={camera}
    bind:canvasSize={canvasSize}
    {blockSize}
    bind:enabled={weatherEnabled}
/>

{#if showDayNightPanel && !editMode}
    <div class="border bg-white fixed bottom-1em left-[50%] -translate-x-1/2 p-[0.4em] z-49 w-[80%]">
        <div class="w-full flex flex-col border p-[0.4em]">
            <div class="flex p-[0.2em] items-center">
                <p class="text-[1.3em] leading-[0.9em]">Day/Night Cycle</p>
                <button 
                    onclick={() => { showDayNightPanel = false; }}
                    class="ml-auto block w-fit cursor-pointer py-[2px]"
                >
                    <div class="w-[1em]">
                        <svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1.5 10.5V11.5H0.5V10.5H1.5ZM3.5 8.5V9.5H2.5V8.5H3.5ZM5.5 6.5V7.5H4.5V6.5H5.5ZM7.5 4.5V5.5H6.5V4.5H7.5ZM9.5 2.5V3.5H8.5V2.5H9.5ZM11.5 0.5V1.5H10.5V0.5H11.5Z" stroke="black"/>
                            <path d="M1.5 1.5H0.5V0.5L1.5 0.5V1.5ZM3.5 3.5L2.5 3.5V2.5L3.5 2.5V3.5ZM5.5 5.5H4.5V4.5H5.5V5.5ZM7.5 7.5H6.5V6.5H7.5V7.5ZM9.5 9.5H8.5V8.5H9.5V9.5ZM11.5 11.5H10.5V10.5H11.5V11.5Z" stroke="black"/>
                        </svg>
                    </div>
                </button>
            </div>
            <div class="max-h-[10em] overflow-y-auto">
                <DayNightPanel 
                    bind:dayNightConfig={dayNightConfig}
                    onUpdate={() => {
                        needsRedraw = true;
                        drawCanvas();
                    }}
                />
            </div>
        </div>
    </div>
{/if}


{#if showLightEditor && selectedInstance && canControlInstance(selectedInstance)}
    <div class="border bg-white fixed bottom-1em left-[50%] -translate-x-1/2 p-[0.4em] z-49 w-[80%]">
        <div class="w-full flex flex-col border p-[0.4em]">
            <div class="flex p-[0.2em] items-center">
                <p class="text-[1.3em] leading-[0.9em]">Light Editor</p>
                <button 
                    onclick={() => { showLightEditor = false; }}
                    class="ml-auto block w-fit cursor-pointer py-[2px]"
                >
                    <div class="w-[1em]">
                        <!-- Close icon SVG (same as shadow editor) -->
                        <svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1.5 10.5V11.5H0.5V10.5H1.5ZM3.5 8.5V9.5H2.5V8.5H3.5ZM5.5 6.5V7.5H4.5V6.5H5.5ZM7.5 4.5V5.5H6.5V4.5H7.5ZM9.5 2.5V3.5H8.5V2.5H9.5ZM11.5 0.5V1.5H10.5V0.5H11.5Z" stroke="black"/>
                            <path d="M1.5 1.5H0.5V0.5L1.5 0.5V1.5ZM3.5 3.5L2.5 3.5V2.5L3.5 2.5V3.5ZM5.5 5.5H4.5V4.5H5.5V5.5ZM7.5 7.5H6.5V6.5H7.5V7.5ZM9.5 9.5H8.5V8.5H9.5V9.5ZM11.5 11.5H10.5V10.5H11.5V11.5Z" stroke="black"/>
                        </svg>
                    </div>
                </button>
            </div>
            <div class="h-[10em] overflow-y-auto">
                <LightEditor 
                    bind:instance={selectedInstance}
                    onUpdate={() => {
                        markRegionDirty(selectedInstance.x, selectedInstance.y);
                        needsRedraw = true;
                        drawCanvas();
                    }}
                />
            </div>
        </div>
    </div>
{/if}

{#if showShadowEditor && selectedInstance && canControlInstance(selectedInstance)}
    <div class="border bg-white fixed bottom-[1em] left-1/2 -translate-x-1/2 p-[0.4em] z-[49] w-[80%]">
        <div class="w-full flex flex-col border p-[0.4em]">
            <div class="flex p-[0.2em] items-center">
                <p class="text-[1.3em] leading-[0.9em]">Shadow Editor</p>
                <button 
                    onclick={() => showShadowEditor = false} 
                    class="ml-auto block w-fit cursor-pointer py-[2px]"
                >
                    <div class="w-[1em]">
                        <svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1.5 10.5V11.5H0.5V10.5H1.5ZM3.5 8.5V9.5H2.5V8.5H3.5ZM5.5 6.5V7.5H4.5V6.5H5.5ZM7.5 4.5V5.5H6.5V4.5H7.5ZM9.5 2.5V3.5H8.5V2.5H9.5ZM11.5 0.5V1.5H10.5V0.5H11.5Z" stroke="black"/>
                            <path d="M1.5 1.5H0.5V0.5L1.5 0.5V1.5ZM3.5 3.5L2.5 3.5V2.5L3.5 2.5V3.5ZM5.5 5.5H4.5V4.5H5.5V5.5ZM7.5 7.5H6.5V6.5H7.5V7.5ZM9.5 9.5H8.5V8.5H9.5V9.5ZM11.5 11.5H10.5V10.5H11.5V11.5Z" stroke="black"/>
                        </svg>
                    </div>
                </button>
            </div>
            <div class="h-[10em] overflow-y-auto">
                <ShadowEditor
                    bind:instance={selectedInstance}
                    onUpdate={() => {
                        markRegionDirty(selectedInstance.x, selectedInstance.y);
                        needsRedraw = true;
                        drawCanvas();
                    }}
                />
            </div>
        </div>
    </div>
{/if}

{#if weatherComponent && !editMode && currentViewedPlot?.owner === userName && myWeatherConfig}
<!-- {#if weatherComponent && showWeatherEditor} -->
    <div class="{showWeatherEditor ? "opacity-100 pointer-events-auto": "opacity-0 pointer-events-none"}  border bg-white fixedCenter p-[0.4em] z-[49] flex flex-col h-[80%]">
        <div class="w-[15em] flex flex-col p-[0.4em] h-full border ">

            <div class="flex p-[0.2em]">
                <p class="text-[1.3em] leading-[0.9em]">Weather</p>
                <!-- svelte-ignore a11y_consider_explicit_label -->
                <button onclick={()=>{showWeatherEditor = false}} class="ml-auto block w-fit cursor-pointer py-[2px]">
                    <div class=" w-[1em]">
                        <svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1.5 10.5V11.5H0.5V10.5H1.5ZM3.5 8.5V9.5H2.5V8.5H3.5ZM5.5 6.5V7.5H4.5V6.5H5.5ZM7.5 4.5V5.5H6.5V4.5H7.5ZM9.5 2.5V3.5H8.5V2.5H9.5ZM11.5 0.5V1.5H10.5V0.5H11.5Z" stroke="black"/>
                            <path d="M1.5 1.5H0.5V0.5L1.5 0.5V1.5ZM3.5 3.5L2.5 3.5V2.5L3.5 2.5V3.5ZM5.5 5.5H4.5V4.5H5.5V5.5ZM7.5 7.5H6.5V6.5H7.5V7.5ZM9.5 9.5H8.5V8.5H9.5V9.5ZM11.5 11.5H10.5V10.5H11.5V11.5Z" stroke="black"/>
                        </svg>
                    </div>
                </button>
            </div>
            
            <div class="px-[0.2em] h-[calc(100%-2em)] flex flex-col mt-0hem [&_.weatherControlContainer]:space-y-[0.2em]">
                <label class="flex items-center gap-2 mb-2">
                    <input
                        type="checkbox"
                        bind:checked={weatherEnabled}
                    />
                    <span>Enable Weather</span>
                </label>
                {#if weatherEnabled}
                    {#key weatherComponent}
                        {@const config = weatherComponent.getConfig()}
                        {@const weatherType = weatherComponent.getWeatherType()}
                
                        <div class="mb-1em">
                            <label class="block  ">Weather Type</label>
                            <select
                                value={weatherType}
                                onchange={(e) => weatherComponent.setConfig({ weatherType: e.target.value })}
                                class="w-full border rounded px-2 py-1"
                            >
                                <option value="rain">Rain</option>
                                <option value="snow">Snow</option>
                                <option value="cherryblossoms">Cherry Blossoms</option>
                            </select>
                        </div>
                        <div class="overflow-y-auto">
                            {#if weatherType === 'rain'}
                                <div class="weatherControlContainer">
                                    <div>
                                        <label class="block">Drop Count: {config.dropCount}</label>
                                        <input
                                            type="range"
                                            min="10"
                                            max="500"
                                            value={config.dropCount}
                                            oninput={(e) => weatherComponent.setConfig({ dropCount: +e.target.value })}
                                            class="w-full"
                                        />
                                    </div>
                                    <div>
                                        <label class="block">Drop Length: {config.dropLength}</label>
                                        <input
                                            type="range"
                                            min="5"
                                            max="50"
                                            value={config.dropLength}
                                            oninput={(e) => weatherComponent.setConfig({ dropLength: +e.target.value })}
                                            class="w-full"
                                        />
                                    </div>
                                    <div>
                                        <label class="block">Fall Speed: {config.fallSpeed}</label>
                                        <input
                                            type="range"
                                            min="1"
                                            max="20"
                                            value={config.fallSpeed}
                                            oninput={(e) => weatherComponent.setConfig({ fallSpeed: +e.target.value })}
                                            class="w-full"
                                        />
                                    </div>
                                    <div>
                                        <label class="block">Fall Angle: {config.fallAngle}°</label>
                                        <input
                                            type="range"
                                            min="-45"
                                            max="45"
                                            value={config.fallAngle}
                                            oninput={(e) => weatherComponent.setConfig({ fallAngle: +e.target.value })}
                                            class="w-full"
                                        />
                                    </div>
                                    <div>
                                        <label class="block">Opacity: {config.opacity.toFixed(2)}</label>
                                        <input
                                            type="range"
                                            min="0.1"
                                            max="1"
                                            step="0.1"
                                            value={config.opacity}
                                            oninput={(e) => weatherComponent.setConfig({ opacity: +e.target.value })}
                                            class="w-full"
                                        />
                                    </div>
                                    <div>
                                        <label class="block">Spawn Rate: {config.spawnRate.toFixed(2)}</label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.1"
                                            value={config.spawnRate}
                                            oninput={(e) => weatherComponent.setConfig({ spawnRate: +e.target.value })}
                                            class="w-full"
                                        />
                                    </div>
                                    <div class="mb-1em">
                                        <label class="block mb-[0.2em]">Color:</label>                      
                                        <ColorPickerForForm
                                            startValue={config.color}
                                            on:input={(e) => {
                                                // Do whatever you want with hexValue
                                                console.log('Color changed:', e.detail);
                                                weatherComponent.setConfig({ color: e.detail })
                                            }}
                                        />
                                    </div>
                                </div>
                            {:else if weatherType === 'snow'}
                                <div class="weatherControlContainer">
                                    <div>
                                        <label class="block">Flake Count: {config.flakeCount}</label>
                                        <input
                                            type="range"
                                            min="10"
                                            max="500"
                                            value={config.flakeCount}
                                            oninput={(e) => weatherComponent.setConfig({ flakeCount: +e.target.value })}
                                            class="w-full"
                                        />
                                    </div>
                                    <div>
                                        <label class="block">Min Size: {config.flakeSize.min}</label>
                                        <input
                                            type="range"
                                            min="1"
                                            max="5"
                                            value={config.flakeSize.min}
                                            oninput={(e) => weatherComponent.setConfig({
                                                flakeSize: { ...config.flakeSize, min: +e.target.value }
                                            })}
                                            class="w-full"
                                        />
                                    </div>
                                    <div>
                                        <label class="block">Max Size: {config.flakeSize.max}</label>
                                        <input
                                            type="range"
                                            min="4"
                                            max="15"
                                            value={config.flakeSize.max}
                                            oninput={(e) => weatherComponent.setConfig({
                                                flakeSize: { ...config.flakeSize, max: +e.target.value }
                                            })}
                                            class="w-full"
                                        />
                                    </div>
                                    <div>
                                        <label class="block">Fall Speed: {config.fallSpeed.toFixed(1)}</label>
                                        <input
                                            type="range"
                                            min="0.5"
                                            max="5"
                                            step="0.1"
                                            value={config.fallSpeed}
                                            oninput={(e) => weatherComponent.setConfig({ fallSpeed: +e.target.value })}
                                            class="w-full"
                                        />
                                    </div>
                                    <div>
                                        <label class="block">Wind Speed: {config.windSpeed.toFixed(1)}</label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="3"
                                            step="0.1"
                                            value={config.windSpeed}
                                            oninput={(e) => weatherComponent.setConfig({ windSpeed: +e.target.value })}
                                            class="w-full"
                                        />
                                    </div>
                                    <div>
                                        <label class="block">Sway Amount: {config.swayAmount.toFixed(1)}</label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="10"
                                            step="0.1"
                                            value={config.swayAmount}
                                            oninput={(e) => weatherComponent.setConfig({ swayAmount: +e.target.value })}
                                            class="w-full"
                                        />
                                    </div>
                                    <div>
                                        <label class="block">Opacity: {config.opacity.toFixed(2)}</label>
                                        <input
                                            type="range"
                                            min="0.1"
                                            max="1"
                                            step="0.1"
                                            value={config.opacity}
                                            oninput={(e) => weatherComponent.setConfig({ opacity: +e.target.value })}
                                            class="w-full"
                                        />
                                    </div>
                                    <div>
                                        <label class="block">Spawn Rate: {config.spawnRate.toFixed(2)}</label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.1"
                                            value={config.spawnRate}
                                            oninput={(e) => weatherComponent.setConfig({ spawnRate: +e.target.value })}
                                            class="w-full"
                                        />
                                    </div>
                                    <div class="mb-1em">
                                        <label class="block mb-[0.2em]">Color:</label>                      
                                        <ColorPickerForForm
                                            startValue={config.color}
                                            on:input={(e) => {
                                                // Do whatever you want with hexValue
                                                console.log('Color changed:', e.detail);
                                                weatherComponent.setConfig({ color: e.detail })
                                            }}
                                        />
                                    </div>
                                </div>
                            {:else if weatherType === 'cherryblossoms'}
                                <div class="weatherControlContainer">
                                    <div>
                                        <label class="block">Petal Count: {config.petalCount}</label>
                                        <input
                                            type="range"
                                            min="10"
                                            max="300"
                                            value={config.petalCount}
                                            oninput={(e) => weatherComponent.setConfig({ petalCount: +e.target.value })}
                                            class="w-full"
                                        />
                                    </div>
                                    <div>
                                        <label class="block">Min Size: {config.petalSize.min}</label>
                                        <input
                                            type="range"
                                            min="2"
                                            max="6"
                                            value={config.petalSize.min}
                                            oninput={(e) => weatherComponent.setConfig({
                                                petalSize: { ...config.petalSize, min: +e.target.value }
                                            })}
                                            class="w-full"
                                        />
                                    </div>
                                    <div>
                                        <label class="block">Max Size: {config.petalSize.max}</label>
                                        <input
                                            type="range"
                                            min="6"
                                            max="12"
                                            value={config.petalSize.max}
                                            oninput={(e) => weatherComponent.setConfig({
                                                petalSize: { ...config.petalSize, max: +e.target.value }
                                            })}
                                            class="w-full"
                                        />
                                    </div>
                                    <div>
                                        <label class="block">Fall Speed: {config.fallSpeed.toFixed(1)}</label>
                                        <input
                                            type="range"
                                            min="0.3"
                                            max="3"
                                            step="0.1"
                                            value={config.fallSpeed}
                                            oninput={(e) => weatherComponent.setConfig({ fallSpeed: +e.target.value })}
                                            class="w-full"
                                        />
                                    </div>
                                    <div>
                                        <label class="block">Wind Speed: {config.windSpeed.toFixed(1)}</label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="3"
                                            step="0.1"
                                            value={config.windSpeed}
                                            oninput={(e) => weatherComponent.setConfig({ windSpeed: +e.target.value })}
                                            class="w-full"
                                        />
                                    </div>
                                    <div>
                                        <label class="block">Sway Amount: {config.swayAmount.toFixed(1)}</label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="10"
                                            step="0.1"
                                            value={config.swayAmount}
                                            oninput={(e) => weatherComponent.setConfig({ swayAmount: +e.target.value })}
                                            class="w-full"
                                        />
                                    </div>
                                    <div>
                                        <label class="block">Spiral Amount: {config.spiralAmount.toFixed(1)}</label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="5"
                                            step="0.1"
                                            value={config.spiralAmount}
                                            oninput={(e) => weatherComponent.setConfig({ spiralAmount: +e.target.value })}
                                            class="w-full"
                                        />
                                    </div>
                                    <div>
                                        <label class="block">Rotation Speed: {config.rotationSpeed.toFixed(2)}</label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="0.2"
                                            step="0.01"
                                            value={config.rotationSpeed}
                                            oninput={(e) => weatherComponent.setConfig({ rotationSpeed: +e.target.value })}
                                            class="w-full"
                                        />
                                    </div>
                                    <div>
                                        <label class="block">Floatiness: {config.floatiness.toFixed(2)}</label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.05"
                                            value={config.floatiness}
                                            oninput={(e) => weatherComponent.setConfig({ floatiness: +e.target.value })}
                                            class="w-full"
                                        />
                                    </div>
                                    <div>
                                        <label class="block">Opacity: {config.opacity.toFixed(2)}</label>
                                        <input
                                            type="range"
                                            min="0.1"
                                            max="1"
                                            step="0.1"
                                            value={config.opacity}
                                            oninput={(e) => weatherComponent.setConfig({ opacity: +e.target.value })}
                                            class="w-full"
                                        />
                                    </div>
                                    <div>
                                        <label class="block">Spawn Rate: {config.spawnRate.toFixed(2)}</label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.05"
                                            value={config.spawnRate}
                                            oninput={(e) => weatherComponent.setConfig({ spawnRate: +e.target.value })}
                                            class="w-full"
                                        />
                                    </div>
                                </div>
                            {/if}
                        </div>
                    {/key}
                {/if}
            </div>
        </div>
    </div>
{:else}
    <div class="{showWeatherEditor ? "opacity-100 pointer-events-auto": "opacity-0 pointer-events-none"}  border bg-white fixedCenter p-[0.4em] z-[49]">
        <div class="w-[15em] flex flex-col p-[0.4em] h-full border ">

            <div class="flex p-[0.2em]">
                <p class="text-[1.3em] leading-[0.9em]">Weather</p>
                <!-- svelte-ignore a11y_consider_explicit_label -->
                <button onclick={()=>{showWeatherEditor = false}} class="ml-auto block w-fit cursor-pointer py-[2px]">
                    <div class=" w-[1em]">
                        <svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1.5 10.5V11.5H0.5V10.5H1.5ZM3.5 8.5V9.5H2.5V8.5H3.5ZM5.5 6.5V7.5H4.5V6.5H5.5ZM7.5 4.5V5.5H6.5V4.5H7.5ZM9.5 2.5V3.5H8.5V2.5H9.5ZM11.5 0.5V1.5H10.5V0.5H11.5Z" stroke="black"/>
                            <path d="M1.5 1.5H0.5V0.5L1.5 0.5V1.5ZM3.5 3.5L2.5 3.5V2.5L3.5 2.5V3.5ZM5.5 5.5H4.5V4.5H5.5V5.5ZM7.5 7.5H6.5V6.5H7.5V7.5ZM9.5 9.5H8.5V8.5H9.5V9.5ZM11.5 11.5H10.5V10.5H11.5V11.5Z" stroke="black"/>
                        </svg>
                    </div>
                </button>
            </div>

            <p class="leading-[1em] w-[90%] text-center mx-auto my-1em">To access the weather panel go to your alloted space</p>
        </div>
    </div>
{/if}


<style>
      input[type="range"] {
        -webkit-appearance: none;
        width: 100%;
        background: transparent;
        margin: 6px 0;
    }

    /* WebKit (Chrome, Safari) */
    input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 16px;
        height: 16px;
        margin-top: -6px; /* centers the thumb vertically */
        border-radius: 50%;
        background: white;
        border: 3px solid #333;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        position: relative;
        z-index: 2;
    }

    input[type="range"]::-webkit-slider-runnable-track {
        background: black;
        height: 4px;
        border-radius: 2px;
    }

    /* Firefox */
    input[type="range"]::-moz-range-thumb {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: white;
        border: 3px solid #333;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    input[type="range"]::-moz-range-track {
        background: black;
        height: 4px;
        border-radius: 2px;
    }

    input[type="range"]::-moz-focus-outer {
        border: 0;
    }
</style>