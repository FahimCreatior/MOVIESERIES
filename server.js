import express from 'express';
import cors from 'cors';
import fs from 'fs/promises'; // Using promises version for async/await
import path from 'path'; // To construct file paths
// Assuming fetchMovieDetails.js is renamed to mediaFetcher.js
// If not, change 'mediaFetcher.js' back to 'fetchMovieDetails.js'
import { getMediaDetails } from './mediaFetcher.js'; // Import the function

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Serve static files from the 'public' directory (if you have one for frontend)
// app.use(express.static('public')); // Uncomment if your HTML/JS/CSS are in 'public'
// Or from 'frontend' directory
app.use(express.static('frontend'));


app.get('/', (req, res) => {
    res.json({ message: 'Media Search API is running' });
});

// New endpoint to handle both movie and TV show searches
app.get('/api/search', async (req, res) => {
    const { query, type } = req.query; // e.g., /api/search?query=Inception&type=movie

    if (!query || !type) {
        return res.status(400).json({ error: 'Missing query or type parameter. Use ?query=YourSearchTerm&type=movie|tv' });
    }

    if (type !== 'movie' && type !== 'tv') {
        return res.status(400).json({ error: 'Invalid type parameter. Use "movie" or "tv".' });
    }

    try {
        // Call the refactored function from mediaFetcher.js
        // This function writes to a file (e.g., movieDetails.txt or tvDetails.txt)
        await getMediaDetails(query, type);

        // Determine the filename based on the type
        const outputFileName = `${type}Details.txt`;
        const filePath = path.join(process.cwd(), outputFileName); // Assumes files are in root

        // Read the content of the generated file
        const fileContent = await fs.readFile(filePath, 'utf-8');
        
        // For now, send the raw text content.
        // Ideally, the frontend would parse this, or getMediaDetails would return structured JSON.
        // If sending as JSON, you might parse the text file here or modify getMediaDetails.
        // We also need to decide if we send back an array of results or just the first one.
        // The current getMediaDetails only processes the first result.
        // The old server endpoint returned an array.
        // For now, let's adapt to send what getMediaDetails produces.

        // The current getMediaDetails writes a string like:
        // Movie: Inception
        // Description: ...
        // We should parse this into a JSON object for consistency with typical API responses.

        const details = {};
        fileContent.split('\n').forEach(line => {
            const parts = line.split(': ');
            if (parts.length === 2) {
                const key = parts[0].toLowerCase().replace(/\s+/g, ''); // e.g. "releasedate"
                details[key] = parts[1];
            }
        });
        
        // Since getMediaDetails focuses on one item, we send an object, not an array.
        // If you want multiple results, getMediaDetails and this parsing logic would need to change.
        res.json(details);

    } catch (error) {
        console.error('Error in /api/search:', error);
        if (error.code === 'ENOENT') {
            res.status(404).json({ error: `Details file not found. The search for '${query}' (${type}) might have failed or produced no results.` });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});


app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
