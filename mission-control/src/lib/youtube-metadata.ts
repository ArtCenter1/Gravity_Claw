/**
 * YouTube URL Metadata Fetcher
 * Automatically fetches video title, thumbnail, and other info when a YouTube URL is added
 */

interface YouTubeMetadata {
    title: string;
    thumbnail: string;
    description?: string;
    channelName?: string;
    videoId: string;
}

/**
 * Extract video ID from YouTube URL
 * Supports various YouTube URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/v/VIDEO_ID
 */
export function extractYouTubeVideoId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
        /^[a-zA-Z0-9_-]{11}$/ // Direct video ID
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            return match[1];
        }
    }
    return null;
}

/**
 * Check if a URL is a YouTube URL
 */
export function isYouTubeUrl(url: string): boolean {
    return extractYouTubeVideoId(url) !== null;
}

/**
 * Fetch YouTube video metadata using oEmbed API
 * This is a lightweight approach that doesn't require an API key
 */
export async function fetchYouTubeMetadata(url: string): Promise<YouTubeMetadata | null> {
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) {
        return null;
    }

    try {
        // Use YouTube oEmbed endpoint
        const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;

        const response = await fetch(oembedUrl);
        if (!response.ok) {
            console.error('YouTube oEmbed request failed:', response.status);
            return null;
        }

        const data = await response.json();

        return {
            title: data.title || 'Untitled',
            thumbnail: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
            channelName: data.author_name || 'Unknown Channel',
            videoId
        };
    } catch (error) {
        console.error('Failed to fetch YouTube metadata:', error);
        return null;
    }
}

/**
 * Fetch additional YouTube video details using noembed API
 * Provides more metadata including description
 */
export async function fetchYouTubeDetails(url: string): Promise<YouTubeMetadata | null> {
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) {
        return null;
    }

    try {
        // Try noembed first for more details
        const noembedUrl = `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`;

        const response = await fetch(noembedUrl);
        if (response.ok) {
            const data = await response.json();
            if (data.error) {
                // Fall back to oEmbed
                return fetchYouTubeMetadata(url);
            }

            return {
                title: data.title || 'Untitled',
                thumbnail: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
                description: data.description || undefined,
                channelName: data.author_name || 'Unknown Channel',
                videoId
            };
        }

        // Fall back to oEmbed
        return fetchYouTubeMetadata(url);
    } catch (error) {
        console.error('Failed to fetch YouTube details:', error);
        // Fall back to basic oEmbed
        return fetchYouTubeMetadata(url);
    }
}
