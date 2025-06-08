import config from './config.js';
import fetch from 'node-fetch';
import fs from 'fs'; // Import the file system module

export async function getMediaDetails(mediaName, mediaType) {
    try {
        let apiUrl;
        let itemTypeLabel;

        if (mediaType === 'movie') {
            apiUrl = config.movieApiUrl;
            itemTypeLabel = 'Movie';
        } else if (mediaType === 'tv') {
            apiUrl = config.tvApiUrl;
            itemTypeLabel = 'TV Show';
        } else {
            console.error('Invalid media type specified. Please use "movie" or "tv".');
            return;
        }

        // Construct the API URL
        const url = `${apiUrl}?api_key=${config.apiKey}&query=${encodeURIComponent(mediaName)}`;
        console.log(`Fetching data from: ${url}`); // Debug log

        // Fetch data from the API
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Error fetching ${mediaType} details: ${response.statusText}`);
        }

        // Parse the JSON response
        const data = await response.json();
        console.log('API Response:', JSON.stringify(data, null, 2)); // Pretty-print the API response

        // Extract relevant details
        const item = data.results[0]; // Assuming the API returns an array of results
        if (!item) {
            console.log(`No details found for ${mediaType}: ${mediaName}`);
            return;
        }

        const description = item.overview || 'No description available';
        const posterUrl = item.poster_path
            ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
            : 'No poster available';

        let mediaDetailsContent;

        if (mediaType === 'movie') {
            mediaDetailsContent = `
${itemTypeLabel}: ${item.title}
Description: ${description}
Release Date: ${item.release_date || 'N/A'}
Poster URL: ${posterUrl}
`;
        } else if (mediaType === 'tv') {
            mediaDetailsContent = `
${itemTypeLabel}: ${item.name}
Description: ${description}
First Air Date: ${item.first_air_date || 'N/A'}
Vote Average: ${item.vote_average || 'N/A'}
Poster URL: ${posterUrl}
`;
        }

        // Prepare the output filename
        const outputFileName = `${mediaType}Details.txt`;

        // Write the details to a text file
        fs.writeFileSync(outputFileName, mediaDetailsContent.trim(), 'utf-8');
        console.log(`${itemTypeLabel} details saved to ${outputFileName}`);

    } catch (error) {
        console.error(`Error in getMediaDetails: ${error.message}`);
    }
}

// Example usage:
// To search for a movie:
// getMediaDetails('Inception', 'movie');

// To search for a TV show:
// getMediaDetails('Breaking Bad', 'tv');

// Example: Fetch details for a specific movie and TV show
// (You can uncomment these lines to test, or call the function from elsewhere)
getMediaDetails('The Matrix', 'movie');
getMediaDetails('Stranger Things', 'tv');