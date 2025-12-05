# Image Generation Feature Plan

This document outlines the steps to implement the AI-powered image generation feature for new words, similar to the existing example generation feature.

## Goal
Allow users to generate an illustrative image for a word they are learning using OpenAI (DALL-E), both via the Telegram Bot flow and the Web App.

## 1. Server-Side Changes

### 1.1. Create `OpenAIImageService`
Create a new service file `src/services/openAIImage.ts` to handle interactions with the OpenAI Images API.

*   **Class**: `OpenAIImageService`
*   **Method**: `generateImage(word: string, translation: string, logger: Logger): Promise<string | null | Error>`
*   **Logic**:
    *   Construct a prompt (e.g., "A simple, clear illustration of [word] (meaning: [translation])").
    *   Call OpenAI `images.generate` API (model `dall-e-3` or `dall-e-2`).
    *   Return the temporary URL of the generated image.

### 1.2. Update API Endpoints (`src/api/api.ts`)
Expose the image generation capability to the Web App and update the save logic.

*   **New Endpoint**: `POST /chat/:chat_id/word/image`
    *   **Body**: `{ word: string, translation: string }`
    *   **Action**: Calls `OpenAIImageService.generateImage`.
    *   **Response**: `{ url: string }`
*   **Update Endpoint**: `POST /chat/:chat_id/word/save`
    *   **Body Update**: Accept optional `imageUrl` (string) field.
    *   **Logic**:
        *   If `imageUrl` is present:
            1.  Fetch the image from the URL (using `fetch` or `axios`).
            2.  Get the buffer/stream.
            3.  Call `uploadPicture` (from `src/repo/files.ts`) to save it to GridFS.
            4.  Set `PictureFileName` in the `Word` object.

### 1.3. Update Telegram Bot Flow (`src/flows/steps/addNewWordPictureFork.ts`)
Integrate image generation into the interactive "Add New Word" flow.

*   **Modify `makeAction`**:
    *   Call `OpenAIImageService.generateImage` using `user.state.newWord`.
    *   If an image is generated:
        *   Save the image URL to `user.state.generatedImageURL`.
        *   Send the image to the chat (`bot.sendPhoto`).
        *   Ask: "Do you want to use this picture?" (Yes/No).
    *   If generation fails or returns null, fallback to existing behavior (ask "Do you want to add a picture?").
*   **Modify `makeTransition`**:
    *   **Case "Yes"**:
        *   If `user.state.generatedImageURL` exists:
            1.  Download the image from the URL.
            2.  Upload to GridFS (`uploadPicture`).
            3.  Update `newWord.PictureFileName`.
            4.  Proceed to next step.
    *   **Case "No"**:
        *   Clear `user.state.generatedImageURL`.
        *   Proceed to `noStepID` (which likely asks for manual photo upload or skips).

## 2. Client-Side Changes (Web App)

*> Note: These changes are to be applied in the Web App codebase.*

### 2.1. UI Update
*   In the "Add Word" form, add a **"Generate Image"** button next to the image upload field.
*   Add an image preview area to show the generated image.

### 2.2. Logic Update
*   **On "Generate Image" Click**:
    *   Call `POST /chat/:chat_id/word/image` with the current word and translation.
    *   Show loading state.
    *   On success, display the image from the returned URL.
    *   Store the URL in the form state.
*   **On Form Submit**:
    *   Include the `imageUrl` in the payload sent to `POST /chat/:chat_id/word/save`.

## 3. Dependencies
*   Ensure `openai` package is up to date (v4) and configured.
*   Ensure `node-fetch` or built-in `fetch` is available for downloading the image on the server.

## 4. Environment Variables
*   Ensure `OPENAI_API_KEY` is set.
*   Optional: `OPENAI_IMAGE_MODEL` (default to `dall-e-3`).
