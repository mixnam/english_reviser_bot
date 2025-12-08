# Image Search Feature Plan (Google Custom Search)

This document outlines the steps to implement an image search feature for new words using the Google Custom Search API, replacing the previously planned AI generation.

## Goal
Allow users to search for and select an illustrative image for a word they are learning using Google Images.

## 1. Prerequisites (Google Cloud Setup)
Before implementation, the following credentials are required:
1.  **Google Cloud Project**: Create a project in the Google Cloud Console.
2.  **Enable API**: Enable the "Custom Search API".
3.  **API Key**: Create a credential (API Key) restricted to this API.
4.  **Programmable Search Engine (CSE)**:
    *   Go to [Programmable Search Engine](https://programmablesearchengine.google.com/).
    *   Create a new engine.
    *   Enable "Image search" in the settings.
    *   Set "Sites to search" to "Search the entire web" (or restrict as needed).
    *   Get the **Search Engine ID (cx)**.

## 2. Server-Side Changes

### 2.1. Create `GoogleImageService`
Create a new service file `src/services/googleImage.ts`.

*   **Class**: `GoogleImageService`
*   **Method**: `searchImages(query: string, logger: Logger): Promise<string[] | Error>`
*   **Mechanism**:
    *   Make a GET request to `https://www.googleapis.com/customsearch/v1`.
    *   **Query Parameters**:
        *   `key`: `process.env.GOOGLE_SEARCH_API_KEY`
        *   `cx`: `process.env.GOOGLE_SEARCH_ENGINE_ID`
        *   `q`: The search query (e.g., `word`).
        *   `searchType`: `image`
        *   `num`: `3` (Number of results to return).
        *   `safe`: `active` (SafeSearch).
    *   **Return Value**: An array of image URLs (`items[].link`).

### 2.2. Update API Endpoints (`src/api/api.ts`)

*   **New Endpoint**: `POST /chat/:chat_id/word/image/search`
    *   **Body**: `{ word: string, translation: string }`
    *   **Action**:
        *   Construct a query (e.g., `word + " illustration"` or just `word`).
        *   Call `GoogleImageService.searchImages`.
    *   **Response**: `{ urls: string[] }` (A list of 3-5 image URLs).

*   **Update Endpoint**: `POST /chat/:chat_id/word/save`
    *   **Body Update**: Accept `imageUrl` (string).
    *   **Logic**:
        *   (Existing logic from previous plan applies here)
        *   Download the image from the selected `imageUrl`.
        *   Save to GridFS.
        *   Link to the Word.

## 3. Client-Side Changes (Web App)

### 3.1. UI Update
*   **"Search Image" Button**: Replaces "Generate Image".
*   **Carousel/Grid**: Display the returned images (thumbnails).
*   **Selection**: User clicks an image to select it (highlight it).

### 3.2. Logic
*   Call search endpoint -> Get list -> Show list -> User Selects -> Save endpoint sends selected URL.

## 4. Environment Variables
*   `GOOGLE_SEARCH_API_KEY`: New.
*   `GOOGLE_SEARCH_ENGINE_ID`: New.