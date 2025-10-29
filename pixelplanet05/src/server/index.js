import express from "express";
import {
	createServer,
	context,
	getServerPort,
	reddit,
	redis,
} from "@devvit/web/server";
import { createPost } from "./core/post.js";
import { media } from '@devvit/web/server';

const app = express();

// Middleware for JSON body parsing
app.use(express.json());
// Middleware for URL-encoded body parsing
app.use(express.urlencoded({ extended: true }));
// Middleware for plain text body parsing
app.use(express.text());

const router = express.Router();

// Plot Configuration
const PLOT_SIZE = 128*2;
const PLOT_GAP = 16*3;
const PLOT_OFFSET_X = 64*3;
const PLOT_OFFSET_Y = 64*3;

// Calculate world coordinates from plot grid coordinates
function getPlotWorldCoordinates(plotX, plotY) {
    const worldX = PLOT_OFFSET_X + (plotX * (PLOT_SIZE + PLOT_GAP));
    const worldY = PLOT_OFFSET_Y + (plotY * (PLOT_SIZE + PLOT_GAP));
    return { worldX, worldY };
}

function isWithinUserPlot(x, y, plotX, plotY) {
    const { worldX, worldY } = getPlotWorldCoordinates(plotX, plotY);
    return (
        x >= worldX && x < worldX + PLOT_SIZE &&
        y >= worldY && y < worldY + PLOT_SIZE
    );
}

router.get("/api/get-all-plots", async (_req, res) => {
    const { postId } = context;
    
    if (!postId) {
        res.status(400).json({ status: "error", message: "postId required" });
        return;
    }

    try {
        const plotAssignmentsKey = `plot-assignments:post:${postId}`;
        const plotAssignments = await redis.get(plotAssignmentsKey);
        
        if (!plotAssignments) {
            res.json({ status: "success", plots: [], totalPlots: 0 });
            return;
        }

        const assignments = JSON.parse(plotAssignments);
        const allPlots = Object.entries(assignments).map(([owner, coords]) => {
            const [plotX, plotY] = coords.split(',').map(Number);
            const { worldX, worldY } = getPlotWorldCoordinates(plotX, plotY);
            return { owner, plotX, plotY, worldX, worldY, plotSize: PLOT_SIZE };
        });

        res.json({
            status: "success",
            plots: allPlots,
            totalPlots: allPlots.length
        });
    } catch (error) {
        res.status(500).json({ status: "error", message: "Failed to fetch plots" });
    }
});

router.get("/api/init", async (_req, res) => {
	const { postId } = context;

	if (!postId) {
		console.error("API Init Error: postId not found in devvit context");
		res.status(400).json({
			status: "error",
			message: "postId is required but missing from context",
		});
		return;
	}

	try {
		const [count, username] = await Promise.all([
			redis.get("count"),
			reddit.getCurrentUsername(),
		]);

        // Plot assignment logic
        const plotAssignmentsKey = `plot-assignments:post:${postId}`;
        const nextPlotIndexKey = `next-plot-index:post:${postId}`;

        let plotAssignments = {};
        const existingAssignments = await redis.get(plotAssignmentsKey);
        if (existingAssignments) {
            plotAssignments = JSON.parse(existingAssignments);
        }

        let userPlot = null;

        if (plotAssignments[username]) {
            const [plotX, plotY] = plotAssignments[username].split(',').map(Number);
            const { worldX, worldY } = getPlotWorldCoordinates(plotX, plotY);
            userPlot = { plotX, plotY, worldX, worldY, plotSize: PLOT_SIZE };
        } else {
            let nextPlotIndex = { x: 0, y: 0 };
            const existingIndex = await redis.get(nextPlotIndexKey);
            if (existingIndex) {
                nextPlotIndex = JSON.parse(existingIndex);
            }

            const { worldX, worldY } = getPlotWorldCoordinates(nextPlotIndex.x, nextPlotIndex.y);
            userPlot = { 
                plotX: nextPlotIndex.x, 
                plotY: nextPlotIndex.y, 
                worldX, 
                worldY, 
                plotSize: PLOT_SIZE 
            };

            plotAssignments[username] = `${nextPlotIndex.x},${nextPlotIndex.y}`;
            await redis.set(plotAssignmentsKey, JSON.stringify(plotAssignments));

            nextPlotIndex.x += 1;
            if (nextPlotIndex.x >= 10) {
                nextPlotIndex.x = 0;
                nextPlotIndex.y += 1;
            }
            await redis.set(nextPlotIndexKey, JSON.stringify(nextPlotIndex));
        }

        const allPlots = Object.entries(plotAssignments).map(([owner, coords]) => {
            const [plotX, plotY] = coords.split(',').map(Number);
            const { worldX, worldY } = getPlotWorldCoordinates(plotX, plotY);
            return { owner, plotX, plotY, worldX, worldY, plotSize: PLOT_SIZE };
        });


		res.json({
			type: "init",
			postId: postId,
			count: count ? parseInt(count) : 0,
			username: username ?? "anonymous",
            userPlot: userPlot,
            allPlots: allPlots,
            plotConfig: {
                size: PLOT_SIZE,
                gap: PLOT_GAP,
                offsetX: PLOT_OFFSET_X,
                offsetY: PLOT_OFFSET_Y
            }
		});
	} catch (error) {
		console.error(`API Init Error for post ${postId}:`, error);
		let errorMessage = "Unknown error during initialization";
		if (error instanceof Error) {
			errorMessage = `Initialization failed: ${error.message}`;
		}
		res.status(400).json({ status: "error", message: errorMessage });
	}
});

// ============================================
// SAVE DAY/NIGHT CONFIG
// ============================================
router.post("/api/save-daynight", async (req, res) => {
    const { postId } = context;
    const username = await reddit.getCurrentUsername();
    
    if (!postId) {
        res.status(400).json({
            status: "error",
            message: "postId is required",
        });
        return;
    }

    if (!username) {
        res.status(401).json({
            status: "error",
            message: "Authentication required",
        });
        return;
    }

    try {
        const { dayNightConfig } = req.body;
        
        if (!dayNightConfig || typeof dayNightConfig !== 'object') {
            res.status(400).json({
                status: "error",
                message: "Invalid day/night config data",
            });
            return;
        }

        // Get user's plot to associate day/night with it
        const plotAssignmentsKey = `plot-assignments:post:${postId}`;
        const plotAssignments = await redis.get(plotAssignmentsKey);

        if (!plotAssignments) {
            res.status(403).json({ status: "error", message: "No plot assigned" });
            return;
        }

        const assignments = JSON.parse(plotAssignments);
        const userPlotCoords = assignments[username];

        if (!userPlotCoords) {
            res.status(403).json({ status: "error", message: "User has no assigned plot" });
            return;
        }

        // Save day/night config associated with user's plot
        const dayNightKey = `daynight:post:${postId}:user:${username}`;
        const dayNightData = {
            ...dayNightConfig,
            plotCoords: userPlotCoords,
            username: username,
            updatedAt: Date.now()
        };

        await redis.set(dayNightKey, JSON.stringify(dayNightData));

        res.json({
            status: "success",
            message: "Day/night config saved successfully",
            dayNightKey: dayNightKey
        });
    } catch (error) {
        console.error(`Error saving day/night for user ${username}:`, error);
        res.status(500).json({ 
            status: "error", 
            message: error.message || "Failed to save day/night config"
        });
    }
});

// ============================================
// GET DAY/NIGHT CONFIG
// ============================================
router.get("/api/get-daynight", async (req, res) => {
    const { postId } = context;
    const username = await reddit.getCurrentUsername();
    
    if (!postId) {
        res.status(400).json({
            status: "error",
            message: "postId is required",
        });
        return;
    }

    try {
        // Get user's day/night config
        const dayNightKey = `daynight:post:${postId}:user:${username}`;
        const dayNightData = await redis.get(dayNightKey);

        if (!dayNightData) {
            // Return default day/night config if none exists
            res.json({
                status: "success",
                dayNightConfig: null,
                message: "No saved day/night config found"
            });
            return;
        }

        const config = JSON.parse(dayNightData);

        res.json({
            status: "success",
            dayNightConfig: config
        });
    } catch (error) {
        console.error(`Error fetching day/night for user ${username}:`, error);
        res.status(500).json({ 
            status: "error", 
            message: error.message || "Failed to fetch day/night config"
        });
    }
});

// ============================================
// GET ALL PLOT DAY/NIGHT CONFIGS
// ============================================
router.get("/api/get-all-daynight", async (req, res) => {
    const { postId } = context;
    
    if (!postId) {
        res.status(400).json({
            status: "error",
            message: "postId is required",
        });
        return;
    }

    try {
        // Get all plot assignments
        const plotAssignmentsKey = `plot-assignments:post:${postId}`;
        const plotAssignments = await redis.get(plotAssignmentsKey);
        
        if (!plotAssignments) {
            res.json({ status: "success", dayNightConfigs: [] });
            return;
        }

        const assignments = JSON.parse(plotAssignments);
        const dayNightPromises = Object.keys(assignments).map(async (username) => {
            const dayNightKey = `daynight:post:${postId}:user:${username}`;
            const dayNightData = await redis.get(dayNightKey);
            
            if (!dayNightData) return null;
            
            const config = JSON.parse(dayNightData);
            return {
                username,
                plotCoords: assignments[username],
                dayNightConfig: config
            };
        });

        const allDayNight = (await Promise.all(dayNightPromises)).filter(d => d !== null);

        res.json({
            status: "success",
            dayNightConfigs: allDayNight
        });
    } catch (error) {
        console.error(`Error fetching all day/night configs:`, error);
        res.status(500).json({ 
            status: "error", 
            message: "Failed to fetch day/night configs"
        });
    }
});


router.post("/api/create-theme", async (req, res) => {
    const { postId } = context;
    const { theme } = req.body;

    if (!postId) {
        console.error("API Create Theme Error: postId not found in devvit context");
        res.status(400).json({
            status: "error",
            message: "postId is required but missing from context",
        });
        return;
    }

    if (!theme || theme.trim() === "") {
        res.status(400).json({
            status: "error",
            message: "Theme is required",
        });
        return;
    }

    try {
        const username = await reddit.getCurrentUsername();
        
        if (!username) {
            res.status(400).json({
                status: "error",
                message: "Unable to get username",
            });
            return;
        }

        // Get the current subreddit
        const post = await reddit.getPostById(postId);
        const subredditName = post.subredditName;

        const newPost = await reddit.submitCustomPost({
            title: theme.trim(),
            subredditName: subredditName,
            splash: {
                appDisplayName: 'pixelplanet05',
                backgroundUri: "bg.jpg",
                heading: `Theme: ${theme.trim()}`,
                appIconUri: 'logo.png',
                buttonLabel: 'Start building yours'
            },
        });

        // Add to themes list in Redis
        const themesListKey = "themes-list";
        let themesList = [];
        
        const existingList = await redis.get(themesListKey);
        if (existingList) {
            themesList = JSON.parse(existingList);
        }

        // Add new theme entry
        const themeEntry = {
            postId: newPost.id,
            creator: username,
            title: theme.trim(),
            createdAt: Date.now(),
        };

        themesList.push(themeEntry);
        await redis.set(themesListKey, JSON.stringify(themesList));

        res.json({
            status: "success",
            message: "Theme created successfully",
            navigateTo: `https://reddit.com/r/${subredditName}/comments/${newPost.id}`,
        });
    } catch (error) {
        console.error(`API Create Theme Error for post ${postId}:`, error);
        let errorMessage = "Unknown error during theme creation";
        if (error instanceof Error) {
            errorMessage = `Theme creation failed: ${error.message}`;
        }
        res.status(400).json({ status: "error", message: errorMessage });
    }
});

router.get("/api/themes", async (_req, res) => {
    const { postId } = context;

    const post = await reddit.getPostById(postId);
    const subredditName = post.subredditName;
    try {
        const themesListKey = "themes-list";
        const existingList = await redis.get(themesListKey);
        
        const themesList = existingList ? JSON.parse(existingList) : [];
        
        res.json({
            status: "success",
            themes: themesList,
            subredditName
        });
    } catch (error) {
        console.error("Error fetching themes:", error);
        res.status(500).json({ status: "error", message: "Failed to fetch themes" });
    }
});


router.post("/api/toggle-like", async (req, res) => {
    const { postId } = context;
    const username = await reddit.getCurrentUsername();
    
    if (!postId || !username) {
        res.status(400).json({ status: "error", message: "Invalid request" });
        return;
    }

    try {
        const { plotOwner } = req.body; // Username of plot owner
        
        if (!plotOwner) {
            res.status(400).json({ status: "error", message: "plotOwner required" });
            return;
        }

        // Can't like your own plot
        if (plotOwner === username) {
            res.status(400).json({ status: "error", message: "Cannot like your own plot" });
            return;
        }

        // Key to store who liked this plot
        const plotLikesKey = `plot-likes:post:${postId}:owner:${plotOwner}`;
        
        // Get current likes array
        let likesData = await redis.get(plotLikesKey);
        let likes = likesData ? JSON.parse(likesData) : [];
        
        // Toggle like
        const likeIndex = likes.indexOf(username);
        let action = 'liked';
        
        if (likeIndex > -1) {
            // Unlike
            likes.splice(likeIndex, 1);
            action = 'unliked';
        } else {
            // Like
            likes.push(username);
        }
        
        // Save back
        await redis.set(plotLikesKey, JSON.stringify(likes));
        
        res.json({
            status: "success",
            action: action,
            likeCount: likes.length,
            hasLiked: action === 'liked'
        });
    } catch (error) {
        console.error('Error toggling like:', error);
        res.status(500).json({ status: "error", message: "Failed to toggle like" });
    }
});

// ============================================
// GET LIKES FOR ALL PLOTS
// ============================================
router.get("/api/get-all-likes", async (req, res) => {
    const { postId } = context;
    
    if (!postId) {
        res.status(400).json({ status: "error", message: "postId required" });
        return;
    }

    try {
        // Get all plot assignments
        const plotAssignmentsKey = `plot-assignments:post:${postId}`;
        const plotAssignments = await redis.get(plotAssignmentsKey);
        
        if (!plotAssignments) {
            res.json({ status: "success", likes: {} });
            return;
        }

        const assignments = JSON.parse(plotAssignments);
        const likesData = {};
        
        // Fetch likes for each plot owner
        const likePromises = Object.keys(assignments).map(async (owner) => {
            const plotLikesKey = `plot-likes:post:${postId}:owner:${owner}`;
            const likes = await redis.get(plotLikesKey);
            return {
                owner,
                likes: likes ? JSON.parse(likes) : [],
                count: likes ? JSON.parse(likes).length : 0
            };
        });
        
        const allLikes = await Promise.all(likePromises);
        
        // Convert to object format
        allLikes.forEach(plotLikes => {
            likesData[plotLikes.owner] = {
                count: plotLikes.count,
                likers: plotLikes.likes
            };
        });
        
        res.json({
            status: "success",
            likes: likesData
        });
    } catch (error) {
        console.error('Error fetching likes:', error);
        res.status(500).json({ status: "error", message: "Failed to fetch likes" });
    }
});

// ============================================
// GET LEADERBOARD (sorted by likes)
// ============================================
router.get("/api/get-leaderboard", async (req, res) => {
    const { postId } = context;
    const username = await reddit.getCurrentUsername();
    
    if (!postId) {
        res.status(400).json({ status: "error", message: "postId required" });
        return;
    }

    try {
        const plotAssignmentsKey = `plot-assignments:post:${postId}`;
        const plotAssignments = await redis.get(plotAssignmentsKey);
        
        if (!plotAssignments) {
            res.json({ status: "success", leaderboard: [] });
            return;
        }

        const assignments = JSON.parse(plotAssignments);
        
        // Fetch likes for each plot
        const leaderboardPromises = Object.keys(assignments).map(async (owner) => {
            const plotLikesKey = `plot-likes:post:${postId}:owner:${owner}`;
            const likes = await redis.get(plotLikesKey);
            const likeArray = likes ? JSON.parse(likes) : [];
            const likeCount = likeArray.length;
            const hasLiked = likeArray.includes(username); // Check if current user liked
            
            const [plotX, plotY] = assignments[owner].split(',').map(Number);
            
            return {
                owner,
                plotX,
                plotY,
                likes: likeCount,
                hasLiked: hasLiked  // ADD THIS
            };
        });
        
        const leaderboard = await Promise.all(leaderboardPromises);
        
        // Sort by likes descending
        leaderboard.sort((a, b) => b.likes - a.likes);
        
        res.json({
            status: "success",
            leaderboard: leaderboard
        });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ 
            status: "error", 
            message: "Failed to fetch leaderboard"
        });
    }
});


// ============================================
// SHARE PLOT AS GIF
// ============================================
router.post("/api/share-plot", async (req, res) => {
    const { postId } = context;
    const username = await reddit.getCurrentUsername();
    
    if (!postId || !username) {
        res.status(400).json({ status: "error", message: "Auth error" });
        return;
    }

    try {
        const { imageData, caption } = req.body;
        
        if (!imageData || !caption) {
            res.status(400).json({ status: "error", message: "Missing data" });
            return;
        }
        
        console.log('Uploading PNG to Reddit...');
        
        // Upload PNG
        const dataUrl = `data:image/png;base64,${imageData}`;
        const uploadResult = await media.upload({
            url: dataUrl,
            type: 'image'
        });
        
        console.log('Upload result:', uploadResult);
        
        // Get subreddit
        const currentPost = await reddit.getPostById(postId);
        const subredditName = currentPost.subredditName;
        
        // Create image post
        const newPost = await reddit.submitCustomPost({
            title: caption,
            subredditName: subredditName,
            splash: {
                appDisplayName: 'pixelplanet05',
                backgroundUri: uploadResult.mediaUrl,
                buttonLabel: '🌍 View World',
                description: `by u/${username}`,
                heading: caption,
                appIconUri: 'logo.png'
            },
            postData: {             
                goto:`https://reddit.com/r/${subredditName}/comments/${currentPost.id}`
            }
        });
        
        // Save metadata to Redis (not the image)
        const shareId = `share-${Date.now()}-${username}`;
        await redis.set(`plot-share:post:${postId}:${shareId}`, JSON.stringify({
            id: shareId,
            username,
            caption,
            redditPostId: newPost.id,
            mediaId: uploadResult.mediaId,
            createdAt: Date.now()
        }));
        
        res.json({
            status: "success",
            redditPostUrl: `https://reddit.com/r/${subredditName}/comments/${newPost.id}`,
            redditPostId: newPost.id
        });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            status: "error", 
            message: error.message
        });
    }
});


// // ============================================
// // GET SHARED PLOTS FROM REDIS
// // ============================================
// router.get("/api/get-shared-plots", async (req, res) => {
//     const { postId } = context;
    
//     if (!postId) {
//         res.status(400).json({ status: "error", message: "postId required" });
//         return;
//     }

//     try {
//         const sharesIndexKey = `plot-shares-index:post:${postId}`;
//         const sharesIndex = await redis.get(sharesIndexKey);
        
//         if (!sharesIndex) {
//             res.json({ status: "success", shares: [] });
//             return;
//         }
        
//         const shareIds = JSON.parse(sharesIndex);
        
//         // Fetch all shares from Redis
//         const sharePromises = shareIds.map(async (shareId) => {
//             const shareKey = `plot-share:post:${postId}:${shareId}`;
//             const shareData = await redis.get(shareKey);
//             return shareData ? JSON.parse(shareData) : null;
//         });
        
//         const shares = (await Promise.all(sharePromises)).filter(s => s !== null);
        
//         res.json({
//             status: "success",
//             shares: shares
//         });
        
//     } catch (error) {
//         console.error('Error fetching shared plots:', error);
//         res.status(500).json({ 
//             status: "error", 
//             message: "Failed to fetch shared plots" 
//         });
//     }
// });


// ============================================
// SAVE WEATHER CONFIG
// ============================================
router.post("/api/save-weather", async (req, res) => {
    const { postId } = context;
    const username = await reddit.getCurrentUsername();
    
    if (!postId) {
        res.status(400).json({
            status: "error",
            message: "postId is required",
        });
        return;
    }

    if (!username) {
        res.status(401).json({
            status: "error",
            message: "Authentication required",
        });
        return;
    }

    try {
        const { weatherConfig } = req.body;
        
        if (!weatherConfig || typeof weatherConfig !== 'object') {
            res.status(400).json({
                status: "error",
                message: "Invalid weather config data",
            });
            return;
        }

        // Get user's plot to associate weather with it
        const plotAssignmentsKey = `plot-assignments:post:${postId}`;
        const plotAssignments = await redis.get(plotAssignmentsKey);

        if (!plotAssignments) {
            res.status(403).json({ status: "error", message: "No plot assigned" });
            return;
        }

        const assignments = JSON.parse(plotAssignments);
        const userPlotCoords = assignments[username];

        if (!userPlotCoords) {
            res.status(403).json({ status: "error", message: "User has no assigned plot" });
            return;
        }

        // Save weather config associated with user's plot
        const weatherKey = `weather:post:${postId}:user:${username}`;
        const weatherData = {
            ...weatherConfig,
            plotCoords: userPlotCoords,
            username: username,
            updatedAt: Date.now()
        };

        await redis.set(weatherKey, JSON.stringify(weatherData));

        res.json({
            status: "success",
            message: "Weather config saved successfully",
            weatherKey: weatherKey
        });
    } catch (error) {
        console.error(`Error saving weather for user ${username}:`, error);
        res.status(500).json({ 
            status: "error", 
            message: error.message || "Failed to save weather config"
        });
    }
});

// ============================================
// GET WEATHER CONFIG
// ============================================
router.get("/api/get-weather", async (req, res) => {
    const { postId } = context;
    const username = await reddit.getCurrentUsername();
    
    if (!postId) {
        res.status(400).json({
            status: "error",
            message: "postId is required",
        });
        return;
    }

    try {
        // Get user's weather config
        const weatherKey = `weather:post:${postId}:user:${username}`;
        const weatherData = await redis.get(weatherKey);

        if (!weatherData) {
            // Return default weather config if none exists
            res.json({
                status: "success",
                weatherConfig: null,
                message: "No saved weather config found"
            });
            return;
        }

        const config = JSON.parse(weatherData);

        res.json({
            status: "success",
            weatherConfig: config
        });
    } catch (error) {
        console.error(`Error fetching weather for user ${username}:`, error);
        res.status(500).json({ 
            status: "error", 
            message: error.message || "Failed to fetch weather config"
        });
    }
});

// ============================================
// GET ALL PLOT WEATHER (Optional - for viewing other plots)
// ============================================
router.get("/api/get-all-weather", async (req, res) => {
    const { postId } = context;
    
    if (!postId) {
        res.status(400).json({
            status: "error",
            message: "postId is required",
        });
        return;
    }

    try {
        // Get all plot assignments
        const plotAssignmentsKey = `plot-assignments:post:${postId}`;
        const plotAssignments = await redis.get(plotAssignmentsKey);
        
        if (!plotAssignments) {
            res.json({ status: "success", weatherConfigs: [] });
            return;
        }

        const assignments = JSON.parse(plotAssignments);
        const weatherPromises = Object.keys(assignments).map(async (username) => {
            const weatherKey = `weather:post:${postId}:user:${username}`;
            const weatherData = await redis.get(weatherKey);
            
            if (!weatherData) return null;
            
            const config = JSON.parse(weatherData);
            return {
                username,
                plotCoords: assignments[username],
                weatherConfig: config
            };
        });

        const allWeather = (await Promise.all(weatherPromises)).filter(w => w !== null);

        res.json({
            status: "success",
            weatherConfigs: allWeather
        });
    } catch (error) {
        console.error(`Error fetching all weather configs:`, error);
        res.status(500).json({ 
            status: "error", 
            message: "Failed to fetch weather configs"
        });
    }
});

// save instances
router.post("/api/save-instances", async (req, res) => {
    const { postId } = context;
    const username = await reddit.getCurrentUsername();
    
    if (!postId) {
        res.status(400).json({
            status: "error",
            message: "postId is required",
        });
        return;
    }

    if (!username) {
        res.status(401).json({
            status: "error",
            message: "Authentication required",
        });
        return;
    }

    // Get user's plot
    const plotAssignmentsKey = `plot-assignments:post:${postId}`;
    const plotAssignments = await redis.get(plotAssignmentsKey);

    if (!plotAssignments) {
        res.status(403).json({ status: "error", message: "No plot assigned" });
        return;
    }

    const assignments = JSON.parse(plotAssignments);
    const userPlotCoords = assignments[username];

    if (!userPlotCoords) {
        res.status(403).json({ status: "error", message: "User has no assigned plot" });
        return;
    }

    const [plotX, plotY] = userPlotCoords.split(',').map(Number);

    try {
        const { regions } = req.body; // { "0,0": [...instances], "1,0": [...instances] }
        
        if (!regions || typeof regions !== 'object') {
            res.status(400).json({
                status: "error",
                message: "Invalid regions data",
            });
            return;
        }
        // Validate instances are within plot
        for (const [regionKey, instances] of Object.entries(regions)) {
            for (const instance of instances) {
                if (!isWithinUserPlot(instance.x, instance.y, plotX, plotY)) {
                    res.status(403).json({
                        status: "error",
                        message: `Instance outside plot boundaries`
                    });
                    return;
                }
                
                const endX = instance.x + (instance.width || 1) - 1;
                const endY = instance.y + (instance.height || 1) - 1;
                if (!isWithinUserPlot(endX, endY, plotX, plotY)) {
                    res.status(403).json({
                        status: "error",
                        message: `Instance extends outside plot`
                    });
                    return;
                }
            }
        }

        const savedRegions = [];

        // Save each region
        for (const [regionKey, instances] of Object.entries(regions)) {
            const redisKey = `instances:post:${postId}:region:${regionKey}`;
            
            // Add owner to each instance if not present
            const instancesWithOwner = instances.map(inst => ({
                ...inst,
                owner: inst.owner || username,
                updatedAt: Date.now()
            }));
            
            await redis.set(redisKey, JSON.stringify(instancesWithOwner));
            savedRegions.push(regionKey);
        }

        // Update metadata (instance counts per region)
        const metadataKey = `region-metadata:post:${postId}`;
        let metadata = {};
        
        const existingMetadata = await redis.get(metadataKey);
        if (existingMetadata) {
            metadata = JSON.parse(existingMetadata);
        }
        
        // Update counts for saved regions
        for (const [regionKey, instances] of Object.entries(regions)) {
            metadata[regionKey] = instances.length;
        }
        
        await redis.set(metadataKey, JSON.stringify(metadata));

        res.json({
            status: "success",
            message: "Regions saved successfully",
            savedRegions: savedRegions,
            postId: postId
        });
    } catch (error) {
        console.error(`Error saving instances for post ${postId}:`, error);
        res.status(500).json({ 
            status: "error", 
            message: error.message || "Failed to save instances"
        });
    }
});

// get instances
router.post("/api/get-instances", async (req, res) => {
    const { postId } = context;
    const username = await reddit.getCurrentUsername();
    
    if (!postId) {
        res.status(400).json({
            status: "error",
            message: "postId is required",
        });
        return;
    }

    try {
        const { regions } = req.body; // ["0,0", "1,0", "0,1"]
        
        if (!regions || !Array.isArray(regions)) {
            res.status(400).json({
                status: "error",
                message: "Invalid regions array",
            });
            return;
        }

        const allInstances = [];

        // Fetch each region in parallel
        const fetchPromises = regions.map(async (regionKey) => {
            const redisKey = `instances:post:${postId}:region:${regionKey}`;
            const data = await redis.get(redisKey);
            return data ? JSON.parse(data) : [];
        });

        const regionResults = await Promise.all(fetchPromises);
        
        // Flatten all instances into single array
        regionResults.forEach(instances => {
            allInstances.push(...instances);
        });

        res.json({
            status: "success",
            instances: allInstances,
            regionCount: regions.length,
            instanceCount: allInstances.length
        });
    } catch (error) {
        console.error(`Error fetching instances for post ${postId}:`, error);
        res.status(500).json({ 
            status: "error", 
            message: error.message || "Failed to fetch instances"
        });
    }
});


// ============================================
// SAVE ASSET (Individual key + Index arrays)
// ============================================
router.post("/api/save-assets", async (req, res) => {
    const { postId } = context;
    const username = await reddit.getCurrentUsername();
    
    if (!postId) {
        res.status(400).json({
            status: "error",
            message: "postId is required",
        });
        return;
    }

    if (!username) {
        res.status(401).json({
            status: "error",
            message: "Authentication required",
        });
        return;
    }

    try {
        const newAsset = req.body;
        
        // Validate that asset data exists
        if (!newAsset || typeof newAsset !== 'object') {
            res.status(400).json({
                status: "error",
                message: "Invalid asset data",
            });
            return;
        }

        // Validate required fields
        if (!newAsset.id || !newAsset.width || !newAsset.height || !newAsset.pixels) {
            res.status(400).json({
                status: "error",
                message: "Missing required asset fields (id, width, height, pixels)",
            });
            return;
        }

        // 1. Save individual asset with its own key
        // Key format: asset:{assetId}
        const assetKey = `asset:${newAsset.id}`;
        const assetData = {
            ...newAsset,
            creator: username,
            createdAt: Date.now(),
            postId: postId
        };
        await redis.set(assetKey, JSON.stringify(assetData));

        // 2. Update user's asset index (just IDs)
        const userIndexKey = `assets-index:${username}`;
        let userIndex = [];
        
        const existingUserIndex = await redis.get(userIndexKey);
        if (existingUserIndex) {
            userIndex = JSON.parse(existingUserIndex);
        }
        
        // Add to index if not already present
        if (!userIndex.includes(newAsset.id)) {
            userIndex.push(newAsset.id);
            await redis.set(userIndexKey, JSON.stringify(userIndex));
        }

        // 3. Update global asset index (just IDs)
        const globalIndexKey = 'assets-index:global';
        let globalIndex = [];
        
        const existingGlobalIndex = await redis.get(globalIndexKey);
        if (existingGlobalIndex) {
            globalIndex = JSON.parse(existingGlobalIndex);
        }
        
        // Add to global index if not already present
        if (!globalIndex.includes(newAsset.id)) {
            globalIndex.push(newAsset.id);
            await redis.set(globalIndexKey, JSON.stringify(globalIndex));
        }

        res.json({
            status: "success",
            message: "Asset saved successfully",
            postId: postId,
            assetId: newAsset.id,
            assetKey: assetKey
        });
    } catch (error) {
        console.error(`Error saving asset for user ${username}:`, error);
        let errorMessage = "Failed to save asset";
        if (error instanceof Error) {
            errorMessage = `Save failed: ${error.message}`;
        }
        res.status(500).json({ 
            status: "error", 
            message: errorMessage 
        });
    }
});

// ============================================
// GET ASSETS (Paginated with individual keys)
// ============================================
router.get("/api/get-assets", async (req, res) => {
    const username = await reddit.getCurrentUsername();
    const { scope, page = '1', limit = '20' } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    try {
        let allAssetIds = [];
        
        // 1. Collect asset IDs from indices
        if (scope === 'user' || scope === 'all') {
            const userIndexKey = `assets-index:${username}`;
            const userIndex = await redis.get(userIndexKey);
            if (userIndex) {
                const userIds = JSON.parse(userIndex);
                allAssetIds = [...allAssetIds, ...userIds];
            }
        }
        
        if (scope === 'global' || scope === 'all') {
			const globalIndexKey = 'assets-index:global';
			const globalIndex = await redis.get(globalIndexKey);
			if (globalIndex) {
				const globalIds = JSON.parse(globalIndex);
				
				// Fetch assets to check global flag and filter by creator
				const globalAssetPromises = globalIds.map(async (assetId) => {
					const assetKey = `asset:${assetId}`;
					const assetData = await redis.get(assetKey);
					if (!assetData) return null;
					
					const asset = JSON.parse(assetData);
					
					// Only include if:
					// 1. Asset has global:true flag
					// 2. Asset is NOT created by current user
					if (asset.global === true && asset.creator !== username) {
						return assetId;
					}
					return null;
				});
				
				const filteredGlobalIds = (await Promise.all(globalAssetPromises))
					.filter(id => id !== null);
				
				// Deduplicate: if scope is 'all', filter out user assets already added
				if (scope === 'all') {
					const existingIds = new Set(allAssetIds);
					const uniqueGlobalIds = filteredGlobalIds.filter(id => !existingIds.has(id));
					allAssetIds = [...allAssetIds, ...uniqueGlobalIds];
				} else {
					allAssetIds = filteredGlobalIds;
				}
			}
		}
        
        // 2. Calculate pagination
        const totalAssets = allAssetIds.length;
        const totalPages = Math.ceil(totalAssets / limitNum);
        const startIndex = (pageNum - 1) * limitNum;
        const endIndex = startIndex + limitNum;
        
        // 3. Get IDs for this page
        const pageAssetIds = allAssetIds.slice(startIndex, endIndex);
        
        // 4. Fetch individual assets in parallel
        const assetPromises = pageAssetIds.map(async (assetId) => {
            const assetKey = `asset:${assetId}`;
            const assetData = await redis.get(assetKey);
            return assetData ? JSON.parse(assetData) : null;
        });
        
        const assets = (await Promise.all(assetPromises)).filter(asset => asset !== null);
        
        res.json({
            status: "success",
            assets: assets,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: totalAssets,
                totalPages: totalPages,
                hasMore: endIndex < totalAssets,
                showing: assets.length
            }
        });
    } catch (error) {
        console.error('Error retrieving assets:', error);
        res.status(500).json({ 
            status: "error", 
            message: "Failed to retrieve assets" 
        });
    }
});

// ============================================
// OPTIONAL: Delete asset endpoint
// ============================================
router.delete("/api/delete-asset/:assetId", async (req, res) => {
    const username = await reddit.getCurrentUsername();
    const { assetId } = req.params;
    
    try {
        // 1. Delete the asset itself
        const assetKey = `asset:${assetId}`;
        await redis.del(assetKey);
        
        // 2. Remove from user index
        const userIndexKey = `assets-index:${username}`;
        const userIndex = await redis.get(userIndexKey);
        if (userIndex) {
            let userIds = JSON.parse(userIndex);
            userIds = userIds.filter(id => id !== assetId);
            await redis.set(userIndexKey, JSON.stringify(userIds));
        }
        
        // 3. Remove from global index
        const globalIndexKey = 'assets-index:global';
        const globalIndex = await redis.get(globalIndexKey);
        if (globalIndex) {
            let globalIds = JSON.parse(globalIndex);
            globalIds = globalIds.filter(id => id !== assetId);
            await redis.set(globalIndexKey, JSON.stringify(globalIds));
        }
        
        res.json({
            status: "success",
            message: "Asset deleted successfully",
            assetId: assetId
        });
    } catch (error) {
        console.error('Error deleting asset:', error);
        res.status(500).json({ 
            status: "error", 
            message: "Failed to delete asset" 
        });
    }
});

// ============================================
// GET SINGLE ASSET BY ID
// ============================================
router.get("/api/get-asset/:assetId", async (req, res) => {
    const { assetId } = req.params;
    
    try {
        // Fetch directly from individual asset key
        const assetKey = `asset:${assetId}`;
        const assetData = await redis.get(assetKey);
        
        if (!assetData) {
            res.status(404).json({
                status: "error",
                message: "Asset not found"
            });
            return;
        }
        
        const asset = JSON.parse(assetData);
        
        res.json({
            status: "success",
            asset: asset    
        });
    } catch (error) {
        console.error(`Error fetching asset ${assetId}:`, error);
        res.status(500).json({ 
            status: "error", 
            message: "Failed to fetch asset"
        });
    }
});

router.post("/api/increment", async (_req, res) => {
	const { postId } = context;
	if (!postId) {
		res.status(400).json({
			status: "error",
			message: "postId is required",
		});
		return;
	}

	res.json({
		count: await redis.incrBy("count", 1),
		postId,
		type: "increment",
	});
});

router.post("/api/decrement", async (_req, res) => {
	const { postId } = context;
	if (!postId) {
		res.status(400).json({
			status: "error",
			message: "postId is required",
		});
		return;
	}

	res.json({
		count: await redis.incrBy("count", -1),
		postId,
		type: "decrement",
	});
});

router.post("/internal/on-app-install", async (_req, res) => {
	try {
		const post = await createPost();

		res.json({
			status: "success",
			message: `Post created in subreddit ${context.subredditName} with id ${post.id}`,
		});
	} catch (error) {
		console.error(`Error creating post: ${error}`);
		res.status(400).json({
			status: "error",
			message: "Failed to create post",
		});
	}
});

router.post("/internal/menu/post-create", async (_req, res) => {
	try {
		const post = await createPost();

		res.json({
			navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`,
		});
	} catch (error) {
		console.error(`Error creating post: ${error}`);
		res.status(400).json({
			status: "error",
			message: "Failed to create post",
		});
	}
});

app.use(router);

const server = createServer(app);
server.on("error", (err) => console.error(`server error; ${err.stack}`));
server.listen(getServerPort());