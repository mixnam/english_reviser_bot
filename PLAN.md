# Implementation Plan: Migrate Audio Storage to Google Cloud Storage

This plan outlines the steps to move audio file storage from MongoDB (binary) to Google Cloud Storage (GCS), similar to how images are currently handled.

## 1. Preparation
- [x] Add `GOOGLE_CLOUD_STORAGE_AUDIO_BUCKET` to environment variables.
- [x] Update `server/src/services/googleCloudStorage.ts` to support multiple buckets or provide a specific instance for audio.
- [x] Update `Word` and `WordDTO` types in `server/src/repo/words.ts` to include `AudioURL?: string`.
- [x] Update `mapWord` and repo functions (`addNewWord`, `updateWord`, `getWordByID`, etc.) in `server/src/repo/words.ts` to handle `AudioURL`.

## 2. Implement GCS Upload for Audio
- [x] Update `server/src/flows/steps/addNewWordSubbmit.ts`:
    - Upload generated TTS audio to the dedicated audio GCS bucket.
    - Set `AudioURL` in the `newWord` object.
- [x] Update `server/src/webAppCommands/addWord.ts`:
    - Upload generated TTS audio to the dedicated audio GCS bucket.
    - Set `AudioURL` in the `word` object.
- [x] Update `server/src/webAppCommands/editWord.ts`:
    - Upload generated TTS audio to the dedicated audio GCS bucket.
    - Set `AudioURL` in the `word` object.

## 3. Update Audio Playback/Sending
- [x] Update `server/src/commands/learn.ts`:
    - Prefer `word.AudioURL` over `word.Audio` when sending voice messages.
- [x] Update `server/src/commands/revise.ts`:
    - Prefer `word.AudioURL` over `word.Audio` when sending voice messages.
- [x] Update `server/src/flows/processor/index.ts`:
    - Handle `audio` being a URL string instead of a Buffer/Uint8Array.

## 4. Migration Script
- [ ] Create a migration script `server/scripts/migrateAudioToGcs.ts` to:
    - Iterate through all words in MongoDB.
    - If `Audio` (binary) exists and `AudioURL` is missing:
        - Upload the binary data to GCS.
        - Update the document with the new `AudioURL`.
    - (Optional) Clear the `Audio` binary field after successful upload to save space in MongoDB.

## 5. Cleanup (Optional)
- [ ] After verifying the migration, remove the `Audio` field from the `Word` type and all repo operations to completely switch to `AudioURL`.

## Notes
- Audio files in GCS will be stored in a dedicated bucket (defined by `GOOGLE_CLOUD_STORAGE_AUDIO_BUCKET`).
- Filenames will follow the pattern: `${wordID}.ogg`.
- Ensure the new bucket has appropriate permissions (e.g., public read if using public URLs).