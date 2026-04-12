# Plan: fix edit-word image replacement deleting the newly uploaded image

## Goal

Fix the edit-word flow so replacing an image never deletes the newly uploaded image, while also preserving the existing image if the replacement upload fails.

## Repo / branch context

- Repo: `english_reviser_bot`
- Focus area: `client2` edit-word flow + `server` word edit service
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

1. `WordForm` allows the user to keep the existing image, pick a searched remote URL, or upload a local file.
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

That second strategy is the source of the edit bug.

## Root cause

`WordService.editWord()` treats the previous image and the replacement image as if they were different files, but it uploads replacements to an object key derived from the same `word._id`.

When the replacement image resolves to the same storage path as the previous one (for example both are `jpeg`, so both map to `images/<wordId>.jpeg`):

1. the upload overwrites the object at the old path;
2. `existingWord.ImageURL` still points to that same path;
3. the cleanup step calls `deleteFile(existingWord.ImageURL)`;
4. that delete removes the just-uploaded replacement object.

So the bug is not just “wrong ordering”; it is **identity collision**:

- the old and new binary assets are stored under the same logical key,
- then cleanup runs against a URL that no longer uniquely identifies the old asset.

## Recommended fix

### Chosen approach

**Use upload-then-swap with a new image object key / version per replacement.**

This is the safest and cleanest fix.

### Why this approach

#### Not delete-then-upload

Do **not** delete first.

If upload or fetch fails after deleting the old object, the word loses its existing image and the user ends up worse off than before.

#### Not same-key upload-then-conditional-delete only

A smaller patch could skip deletion when `existingWord.ImageURL === finalImageUrl`, but that leaves the broader design flaw in place:

- asset identity is still conflated with word identity;
- future cleanup logic remains fragile;
- same-URL cache invalidation is worse for clients/CDNs/browsers.

That would be a tactical mitigation, not a robust fix.

#### Why new key per replacement is better

A fresh object key makes old/new assets distinct, which enables safe replacement semantics:

1. upload new image to a new object key;
2. update the DB record to point to the new URL;
3. only after DB success, best-effort delete the old image;
4. if upload fails, DB still points to the old image;
5. if DB update fails after upload, delete the newly uploaded object as rollback.

## Detailed implementation plan for worker

### 1) Introduce a dedicated helper for edit-word image object keys

In `server/src/api/services/wordService.ts` (or a nearby storage helper), add a helper that generates a unique image file name for word replacements, for example:

- `${word._id}-${new ObjectId().toString()}.${extension}``
- or `words/${word._id}/images/${new ObjectId().toString()}.${extension}``

Recommendation:

- prefer a per-word prefix directory if convenient, e.g. `images/words/<wordId>/<assetId>.<ext>`,
- otherwise keep the current flat `images/` namespace and use `wordId + assetId` in the filename.

Key requirement: **every replacement upload gets a new key**.

### 2) Rework `WordService.editWord()` to use swap semantics

Target file:

- `server/src/api/services/wordService.ts`

Refactor the image branch roughly as follows:

1. Read `existingWord.ImageURL` into `previousImageUrl`.
2. If image is unchanged, keep existing URL.
3. If a new remote/local image is selected and it is not already one of this app’s GCS URLs:
   - fetch it;
   - upload it to a **new unique object key**;
   - store the returned URL in `nextImageUrl`.
4. Update the DB via `updateWord()` with `nextImageUrl`.
5. After DB success:
   - if `previousImageUrl` exists,
   - and differs from `nextImageUrl`,
   - delete `previousImageUrl` best-effort.
6. If DB update fails after uploading `nextImageUrl`:
   - delete the newly uploaded object best-effort,
   - return the original error.

### 3) Preserve the existing image on upload failure

Explicit requirement:

- upload/fetch must happen **before** DB mutation,
- previous image deletion must happen **after** DB mutation,
- no old image deletion should occur on upload/fetch failure.

This keeps the current image intact if:

- remote fetch fails,
- content type is unsupported,
- GCS upload fails,
- DB update fails before the pointer swap commits.

### 4) Keep current client contract compatible

No client API shape change is required for the bug fix.

Current client behavior already works with the server-side swap design:

- unchanged image => `ImageURL` omitted / `undefined`
- remote search selection => submit remote URL
- local upload => submit temporary uploaded GCS URL from `/word/image/upload`

The worker should preserve this contract unless they discover a separate bug.

### 5) Add targeted safeguards in cleanup logic

Even with unique keys, cleanup should remain defensive:

- only delete when `previousImageUrl` belongs to this bucket;
- only delete when `previousImageUrl !== nextImageUrl`;
- log cleanup failures without failing the whole edit request after the DB update has succeeded.

### 6) Consider optional follow-up alignment (not required for this fix)

There is a broader inconsistency in image storage strategy:

- `/word/image/upload` already creates unique image ids,
- `saveWord` / `editWord` / legacy flows still use word-id-based keys.

For this bug fix, the worker should prioritize `editWord()`.

Optional follow-up (separate PR unless tiny and low risk):

- standardize server-side word-owned image uploads on a single helper with versioned keys.

## Compatibility concerns

### Existing edit-word flow compatibility

This fix should be backward compatible because:

- existing words may still reference historical URLs like `images/<wordId>.<ext>`;
- `deleteFile()` already deletes by URL/path and does not care how the file name was generated;
- updated words will gradually migrate to new versioned URLs as users replace images.

### No explicit “clear image” support

The current edit UI has no dedicated “remove image” action:

- `selectedImage` is optional,
- but the edit reducer sends `ImageURL: undefined` for unchanged state,
- and there is no distinct “clear this image” signal.

This plan does **not** change that behavior.

The worker should preserve current semantics and avoid accidentally turning “unchanged” into “delete image”.

### Temporary uploads from `/word/image/upload`

The client upload endpoint already returns a bucket URL with a unique object id. The current server edit path treats bucket URLs as already-final and skips re-upload.

That behavior can remain as-is for this fix.

Implication:

- for locally uploaded replacement images, the edit flow is already using a unique object id before `editWord()` runs;
- the dangerous path is primarily the remote-image replacement branch inside `editWord()`.

Still, the worker should verify that cleanup logic does not accidentally delete the temporary-uploaded replacement URL.

## Concrete file-level worker tasks

### Server

- `server/src/api/services/wordService.ts`
  - add helper for unique replacement image key generation;
  - refactor `editWord()` image branch to upload new asset first, update DB second, delete old asset third;
  - add rollback cleanup for newly uploaded asset when DB update fails.

### Storage helper (only if useful)

- `server/src/services/googleCloudStorage.ts`
  - optional: add a small helper or overload if cleaner path construction is needed.

### Tests / verification

There do not appear to be focused automated tests around this flow yet. At minimum the worker should run the repo’s existing relevant checks and perform manual verification.

Recommended manual verification matrix:

1. Edit word without changing image:
   - image remains unchanged.
2. Edit word and replace remote image with same extension as existing image:
   - new image persists after save.
3. Edit word and replace remote image with different extension:
   - new image persists;
   - old image is deleted.
4. Edit word and replace with local upload:
   - new image persists;
   - old image is deleted only after successful save.
5. Force upload/fetch failure:
   - save fails cleanly;
   - old image remains usable.
6. Force DB update failure after successful upload (if practical in dev/staging/mock):
   - old image reference remains unchanged;
   - newly uploaded object is best-effort cleaned up.

## Rollout / risk notes

### Risk level

- Medium-low, scoped to edit-word image replacement.
- Main sensitivity is cleanup ordering and avoiding orphaned uploads on partial failure.

### Rollout strategy

1. Implement server-side swap logic.
2. Manually verify the 6 cases above.
3. Watch logs for:
   - image fetch failures,
   - post-commit delete failures,
   - rollback delete failures.

## Implementation summary for worker

Fix `WordService.editWord()` so image replacement uses a **new unique storage key**, then **updates the DB pointer**, then **best-effort deletes the old image**. Never delete the old image before the replacement is safely uploaded and committed. If the DB update fails after a new upload, best-effort delete the new upload to avoid orphaned files.
