# Image Generation Feature Plan (v0 - API Only)

This document outlines the steps to implement the AI-powered image generation feature for new words via the Web App API.

## Goal
Allow users to generate an illustrative image for a word they are learning using OpenAI (DALL-E) via the Web App.

## 1. Server-Side Changes

### 1.1. Create `OpenAIImageService`
Create a new service file `src/services/openAIImage.ts` to handle interactions with the OpenAI Images API.

*   **Class**: `OpenAIImageService`
*   **Method**: `generateImage(word: string, translation: string, logger: Logger): Promise<string | null | Error>`
*   **Mechanism**:
    *   Use the OpenAI Node.js client `client.images.generate`.
    *   **Prompt Strategy**: Construct a prompt (e.g., "A simple, iconic illustration representing the word '[word]' (meaning: [translation]). Minimalist, clear, white background.").
    *   **Parameters**:
        *   `model`: `dall-e-3` (or `dall-e-2` for speed/cost).
        *   `n`: 1
        *   `size`: `1024x1024` (or smaller if allowed by model).
        *   `response_format`: `'url'` (Default).
    *   **Return Value**: The OpenAI API returns a temporary public URL (hosted on OpenAI's servers) valid for 60 minutes. The service will return this string directly.

### 1.2. Update API Endpoints (`src/api/api.ts`)
Expose the image generation capability and update the save logic to handle the generated image.

*   **New Endpoint**: `POST /chat/:chat_id/word/image`
    *   **Body**: `{ word: string, translation: string }`
    *   **Action**: Calls `OpenAIImageService.generateImage`.
    *   **Response**: `{ url: string }` (The temporary OpenAI URL).
    *   **Details**: This endpoint does *not* save the image to our database yet. It just proxies the generation request.

*   **Update Endpoint**: `POST /chat/:chat_id/word/save`
    *   **Body Update**: Accept optional `imageUrl` (string) field.
    *   **Logic**:
        *   If `imageUrl` is present:
            1.  **Fetch**: Perform a server-side HTTP GET request to the provided `imageUrl` (using `fetch`) to retrieve the image binary data.
            2.  **Stream**: Convert the response body to a Readable Stream.
            3.  **Save**: Call `uploadPicture` (from `src/repo/files.ts`) passing the stream.
            4.  **Link**: Set `PictureFileName` in the new `Word` object to the returned filename from `uploadPicture`.
        *   Proceed with existing saving logic (saving word metadata to MongoDB).

## 2. Client-Side Changes (Web App)

*> Note: These changes are to be applied in the separate Web App codebase.*

### 2.1. UI Update
*   In the "Add Word" form, add a **"Generate Image"** button.
*   Add an image preview area to display the image from the returned URL.

### 2.2. Logic Update
*   **On "Generate Image" Click**:
    *   Call `POST /chat/:chat_id/word/image`.
    *   Receive the temporary URL.
    *   Display it in an `<img>` tag.
    *   Store the URL in the component state.
*   **On Form Submit**:
    *   Pass the stored `imageUrl` in the payload to `POST /chat/:chat_id/word/save`.

## 3. Dependencies & Config
*   **OpenAI SDK**: Existing `openai` package is sufficient.
*   **Environment**:
    *   `OPENAI_API_KEY`: Already exists.
    *   `OPENAI_IMAGE_MODEL`: Optional env var (default to `dall-e-3`).