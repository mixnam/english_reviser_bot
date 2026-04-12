# Plan: fix edit-word image replacement deleting the newly uploaded image

## Goal

Fix the remote-image replacement path in `WordService.editWord()` so replacing an image never deletes the just-uploaded object.

This is a narrow server-side fix for the current bug, not a broader image-storage redesign.

## Repo / branch context

- Repo: `english_reviser_bot`
- Focus area: `server` word edit service, with client behavior reviewed for compatibility
- This is a planning-only change. No application code is included in this branch.

## What I inspected

### Client edit flow

- `client2/src/app/edit-word/page.tsx`
- `client2/src/app/edit-word/hooks/useEditWordSubmission.ts`
- `client2/src/shared/ui/WordForm.tsx`
- `client2/src/shared/api/words.ts`

### Server edit / image storage flow

- `server/src/api/controllers/wordController.ts`
- `server/src/api/routes/wordRoutes.ts`
- `server/src/api/services/wordService.ts`
- `server/src/services/googleCloudStorage.ts`
- `server/src/repo/words.ts`
- `server/src/webAppCommands/addWord.ts`
- `server/scripts/migrateImagesToGcs.ts`

## Current behavior

### Edit flow today

1. `WordForm` lets the user keep the current image, choose a searched remote URL, or upload a local file.
2. `useEditWordSubmission.ts`:
   - uploads local files first via `/chat/:chat_id/word/image/upload`, which returns a GCS URL with a fresh object id;
   - otherwise sends the selected remote URL as-is;
   - then calls `saveWord()` / `POST /chat/:chat_id/word/:word_id`.
3. `wordController.editWord` passes the payload to `WordService.editWord`.
4. `WordService.editWord`:
   - reloads the current DB word;
   - if the submitted `ImageURL` changed and is not already in this app’s GCS bucket, it fetches the remote image and uploads it to:
     - `images/${word._id}.${extension}`
   - then it deletes `existingWord.ImageURL` if present;
   - then it writes the updated word via `updateWord()`.

### Existing image identity pattern

There are two image key strategies in the codebase:

1. **Generic upload endpoint** (`WordService.uploadImage`) uses a fresh object id:
   - `images/${new ObjectId()}.${extension}`
2. **Word-bound image persistence** (`saveWord`, `editWord`, older web app flows, migration script) uses the word id:
   - `images/${wordId}.${extension}`

The bug discussed here is in the remote-image replacement branch inside `editWord()`.

## Root cause

`WordService.editWord()` uploads a replacement remote image to the same word-id-based object key that the current image may already use, and then deletes `existingWord.ImageURL`.

When the existing image URL resolves to that same GCS object key:

1. the upload overwrites the existing object in place;
2. `existingWord.ImageURL` still points at that same object path;
3. the cleanup step calls `deleteFile(existingWord.ImageURL)`;
4. that delete removes the just-uploaded replacement object.

So the immediate bug is:

- **same-key upload**, followed by
- **delete of the existing URL**,
- where the existing URL now points to the newly overwritten object.

## Recommended fix

### Chosen approach

**Keep the same word-id-based GCS object key, overwrite the object in place, and remove the manual delete in this remote-image replacement branch.**

This is the preferred immediate fix for the current bug.

### Why this approach

The current storage model for these word-owned images is already based on `images/${wordId}.${ext}`.

For the narrow bug in `editWord()`, the simplest correct change is:

1. keep uploading the fetched remote replacement image to the same word-owned object key;
2. treat that upload as an overwrite-in-place operation;
3. do **not** call `deleteFile(existingWord.ImageURL)` afterward in that branch.

That removes the self-delete failure mode without expanding this fix into a broader storage-key redesign.

## Detailed implementation plan for worker

### 1) Scope the change to the remote-image replacement branch in `editWord()`

Target file:

- `server/src/api/services/wordService.ts`

Only change the branch where:

- `existingWord.ImageURL` is being replaced,
- the submitted image differs from the current one, and
- the submitted image is a non-bucket remote URL that `editWord()` fetches and re-uploads.

Do **not** redesign the broader image pipeline as part of this fix.

### 2) Keep the current word-id-based object key

When `editWord()` fetches a remote replacement image, continue writing it to the current word-owned object path:

- `images/${word._id}.${extension}`

That upload should now be understood as an overwrite of the existing object when the old and new image resolve to the same key.

No unique-key upload-then-swap behavior is needed for this fix.

### 3) Remove the manual delete from this branch

In the remote-image replacement branch of `WordService.editWord()`:

- remove the cleanup step that deletes `existingWord.ImageURL` after the upload.

Reason:

- after overwrite-in-place, `existingWord.ImageURL` may identify the same object that was just updated;
- deleting that URL can delete the replacement image.

### 4) Preserve existing failure behavior around upload-before-update

The worker should keep the current high-level ordering constraint that avoids losing the old image before a successful upload:

- fetch remote image;
- upload to GCS;
- persist the updated word record.

That way, if fetch or upload fails, the DB pointer is not advanced.

### 5) Keep client/API contract unchanged

No client API shape change is required.

Current client behavior remains compatible:

- unchanged image => `ImageURL` omitted / `undefined`
- remote search selection => submit remote URL
- local upload => submit bucket URL from `/word/image/upload`

This fix is server-side and scoped to the remote-image replacement path only.

## Caveats / tradeoffs

### Cache staleness risk

Overwrite-in-place keeps the same object URL when the extension and word-id-based key stay the same.

That means some clients, proxies, or CDNs may briefly serve stale content from cache after a replacement.

This is an accepted tradeoff for the immediate bug fix.

### Weaker rollback semantics than unique-key swap

Overwrite-in-place is simpler, but it has weaker rollback properties than a unique-key upload-then-swap design:

- once the overwrite succeeds, the prior binary is gone at that key;
- if a later step fails, there is no distinct newly uploaded object to discard while preserving the prior binary at its old URL.

That is acceptable for the current narrow fix, but should be documented as a tradeoff rather than treated as a full storage-strategy solution.

## Compatibility concerns

### Existing edit-word flow compatibility

This fix should be backward compatible because:

- it preserves the current word-id-based object naming used by this path;
- it does not change request or response shapes;
- it only removes the unsafe post-upload delete in the affected branch.

### No explicit “clear image” support

The current edit UI has no dedicated “remove image” action:

- `selectedImage` is optional,
- the edit reducer sends `ImageURL: undefined` for unchanged state,
- there is no distinct “clear this image” signal.

This plan does **not** change that behavior.

### Temporary uploads from `/word/image/upload`

The client upload endpoint already returns a bucket URL with a unique object id. The current server edit path treats bucket URLs as already-final and skips re-upload.

That behavior can remain as-is for this fix.

Implication:

- the dangerous path is specifically the remote-image replacement branch inside `editWord()`;
- locally uploaded replacement images are not the target of this plan change.

## Concrete file-level worker tasks

### Server

- `server/src/api/services/wordService.ts`
  - keep the remote-image replacement upload target as the current word-id-based key;
  - remove the manual `deleteFile(existingWord.ImageURL)` cleanup from that remote-image replacement branch;
  - keep the rest of `editWord()` behavior scoped and unchanged unless a tiny adjacent refactor is needed for clarity.

### Storage helper

- `server/src/services/googleCloudStorage.ts`
  - no change expected unless a very small helper adjustment makes the `editWord()` branch clearer.

### Tests / verification

There do not appear to be focused automated tests around this flow yet. At minimum the worker should run the repo’s existing relevant checks and perform manual verification.

Recommended manual verification matrix:

1. Edit word without changing image:
   - image remains unchanged.
2. Edit word and replace remote image with same extension as existing image:
   - new image persists after save;
   - image is not deleted by cleanup.
3. Edit word and replace remote image with different extension:
   - verify the updated image persists;
   - verify the revised branch does not self-delete the replacement.
4. Edit word and replace with local upload:
   - existing behavior remains intact.
5. Force remote fetch or upload failure:
   - save fails cleanly;
   - DB record does not advance to a broken remote replacement.
6. Check for cache behavior after overwrite-in-place:
   - note whether stale image responses appear briefly in dev/staging/browser refresh flows.

## Rollout / risk notes

### Risk level

- Low, narrowly scoped to the remote-image replacement branch in `editWord()`.
- Main tradeoff is cache staleness and weaker rollback semantics versus a versioned-key design.

### Rollout strategy

1. Implement the scoped server-side overwrite-in-place change.
2. Manually verify the 6 cases above.
3. Watch logs for:
   - image fetch failures,
   - image upload failures,
   - any unexpected edit-word regressions in the remote-image path.

## Implementation summary for worker

Update `server/src/api/services/wordService.ts::editWord()` so the remote-image replacement branch keeps using the existing `wordId`-based GCS object key, overwrites that object in place, and no longer manually deletes `existingWord.ImageURL` afterward. Do not implement unique-key upload-then-swap in this fix. Keep the scope limited to that branch, and note the tradeoffs: possible stale cached images and weaker rollback semantics than a versioned-key design.