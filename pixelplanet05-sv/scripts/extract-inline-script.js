import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the equivalent of __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to your built index.html - adjust the path if needed
const htmlPath = path.resolve(__dirname, '../build/index.html');
// Path to create the new script
const scriptPath = path.resolve(__dirname, '../build/sveltekit-init.js');
// Path to copy build files to
const destPath = path.resolve(__dirname, '../../pixelplanet05/dist/build');

// Function to recursively copy a directory
function copyDir(src, dest) {
    // Create destination directory if it doesn't exist
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    // Read source directory contents
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            // Recursively copy subdirectories
            copyDir(srcPath, destPath);
        } else {
            // Copy files
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// Read the HTML file
let html = fs.readFileSync(htmlPath, 'utf8');

// Extract the script
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (scriptMatch && scriptMatch[1]) {
    const scriptContent = scriptMatch[1];

    // Write the script to a file
    fs.writeFileSync(scriptPath, scriptContent);

    // Replace the inline script with a reference to the external script
    html = html.replace(
        /<script>[\s\S]*?<\/script>/,
        '<script type="application/javascript" src="sveltekit-init.js"></script>'
    );

    // Write the updated HTML back
    fs.writeFileSync(htmlPath, html);

    console.log('Successfully extracted inline script to sveltekit-init.js');
} else {
    console.error('Could not find inline script in the HTML');
}

// Copy build files to destination
try {
    copyDir(path.resolve(__dirname, '../build'), destPath);
    console.log(`Successfully copied build files to ${destPath}`);
} catch (err) {
    console.error(`Error copying build files: ${err.message}`);
}