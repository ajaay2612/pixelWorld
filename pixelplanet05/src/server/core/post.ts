import { context, reddit } from "@devvit/web/server";

export const createPost = async () => {
  const { subredditName } = context;
  if (!subredditName) {
    throw new Error("subredditName is required");
  }

  return await reddit.submitCustomPost({
    splash: { // Splash Screen Configuration
      appDisplayName: 'pixelplanet05', 
      backgroundUri: 'bg.jpg',
      buttonLabel: 'Start',
      description: 'Create. Build. Share. Discover endless pixel worlds.',
      entryUri: 'index.html',
      heading: 'Welcome to Pixel Planet!',
      appIconUri: 'logo.png',
    },
    postData: {
      gameState: 'initial',
      score: 0,
      showHome:true
    },
    subredditName: subredditName,
    title: "Welcome to Pixel Planet",
  });
};
