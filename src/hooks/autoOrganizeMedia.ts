import type { CollectionAfterChangeHook } from 'payload'

/**
 * Auto-organize media into folders when uploaded through a collection.
 *
 * This hook automatically moves uploaded media files into a specified folder
 * in the Media collection. It's designed to be reusable across multiple collections.
 *
 * @param folderName - The name of the folder to organize media into (e.g., "Country Flags")
 * @param fieldName - The field name containing the media upload (e.g., "flag")
 * @returns A CollectionAfterChangeHook function
 *
 * Usage:
 * ```ts
 * hooks: {
 *   afterChange: [autoOrganizeMedia('Country Flags', 'flag')]
 * }
 * ```
 *
 * Note: Payload 3.x with `folders: true` uses an internal `payload-folders` collection
 * to manage folder structure. This hook will find or create the specified folder
 * and update the media document's `_parentFolder` field.
 */
export const autoOrganizeMedia = (
  folderName: string,
  fieldName: string
): CollectionAfterChangeHook => {
  return async ({ doc, req, previousDoc }) => {
    try {
      // Get the media ID from the specified field
      const mediaId = typeof doc[fieldName] === 'object' ? doc[fieldName]?.id : doc[fieldName]

      // Only proceed if there's a media ID
      if (!mediaId) {
        return doc
      }

      // Check if this is a new upload (not just a reference to existing media)
      const previousMediaId =
        typeof previousDoc?.[fieldName] === 'object'
          ? previousDoc[fieldName]?.id
          : previousDoc?.[fieldName]

      if (previousMediaId === mediaId) {
        return doc // Same media, no need to reorganize
      }

      // Find or create the folder in the payload-folders collection
      // Payload 3.x stores folders in a separate collection when folders: true is enabled
      let folderId: number | null = null

      try {
        // First, try to find existing folder
        const existingFolders = await req.payload.find({
          collection: 'payload-folders',
          where: {
            name: { equals: folderName },
          },
          limit: 1,
          depth: 0,
        })

        if (existingFolders.docs.length > 0) {
          folderId = existingFolders.docs[0].id
        } else {
          // Create the folder if it doesn't exist
          const newFolder = await req.payload.create({
            collection: 'payload-folders',
            data: {
              name: folderName,
            },
          })
          folderId = newFolder.id
          req.payload.logger.info(`Created folder "${folderName}" for media organization`)
        }
      } catch (folderError) {
        // If payload-folders collection doesn't exist or there's an error,
        // log it but continue - the media upload still succeeded
        req.payload.logger.warn(
          `Could not find/create folder "${folderName}". ` +
            `Ensure the Media collection has folders: true enabled. Error: ${folderError}`
        )
        return doc
      }

      // Update the media document to assign it to the folder
      if (folderId) {
        try {
          await req.payload.update({
            collection: 'media',
            id: mediaId,
            data: {
              folder: folderId,
            },
          })
          req.payload.logger.info(
            `Organized media ${mediaId} into folder "${folderName}"`
          )
        } catch (updateError) {
          req.payload.logger.warn(
            `Failed to move media ${mediaId} to folder "${folderName}": ${updateError}`
          )
        }
      }
    } catch (error) {
      // Log error but don't block the save operation
      req.payload.logger.error(
        `Failed to organize media into folder "${folderName}": ${error}`
      )
    }

    return doc
  }
}
