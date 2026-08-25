// Google Drive upload helper for grant agreement PDFs (Phase 3.5 PR B).
//
// Design:
//   - Uses a Google Cloud service account (creds JSON at GOOGLE_APPLICATION_CREDENTIALS).
//   - Uploads into GDRIVE_GRANT_CONTRACTS_FOLDER_ID or a per-year subfolder.
//   - Returns the new file's Drive id + a webViewLink for admins to open the file.
//   - Silent no-op when creds/folder aren't configured — matches PR C's Twilio pattern.
//     Callers can proceed to create the grant record without a driveFileId; the admin
//     can attach a file later via the admin form (fsgrants.inc).
//
// Env vars:
//   GOOGLE_APPLICATION_CREDENTIALS  Absolute path to the service account JSON key.
//   GDRIVE_GRANT_CONTRACTS_FOLDER_ID Parent folder id in Drive (e.g. the "Grant Contracts" folder,
//                                    or a per-year folder if you want auto-nesting handled elsewhere).
//
// Dependency: googleapis (added in package.json). Import is dynamic so the app still
// boots + builds even if the package isn't installed on a given environment yet.

import { env } from '$env/dynamic/private'

export type DriveUploadResult = {
  fileId: string
  webViewLink: string
}

export type DriveUploadInput = {
  fileName: string
  mimeType: string
  fileBuffer: Buffer
  /** Override the folder id from env (e.g. per-year subfolder). Optional. */
  folderId?: string
}

/**
 * Upload a file to Drive. Returns null (not an error) when credentials or folder
 * id aren't configured — callers should log-and-continue in that case, not crash.
 */
export async function uploadFileToDrive(input: DriveUploadInput): Promise<DriveUploadResult | null> {
  const keyFile = env.GOOGLE_APPLICATION_CREDENTIALS
  const folderId = input.folderId || env.GDRIVE_GRANT_CONTRACTS_FOLDER_ID

  if (!keyFile || !folderId) {
    console.warn('[drive] skipped upload - GOOGLE_APPLICATION_CREDENTIALS or GDRIVE_GRANT_CONTRACTS_FOLDER_ID not set')
    return null
  }

  // Dynamic import so the app still builds without the googleapis package
  // (useful during rollout / on environments not yet running the Drive feature).
  const { google } = await import('googleapis')
  const { Readable } = await import('node:stream')

  const auth = new google.auth.GoogleAuth({
    keyFile,
    scopes: ['https://www.googleapis.com/auth/drive.file']
  })
  const drive = google.drive({ version: 'v3', auth })

  const res = await drive.files.create({
    requestBody: {
      name: input.fileName,
      parents: [folderId]
    },
    media: {
      mimeType: input.mimeType,
      body: Readable.from(input.fileBuffer)
    },
    fields: 'id, webViewLink'
  })

  const fileId = res.data.id
  if (!fileId) {
    throw new Error('Drive upload returned no file id')
  }
  return {
    fileId,
    webViewLink: res.data.webViewLink ?? ''
  }
}

/**
 * Build the Drive filename per William's convention:
 *   `{YYYY-MM-DD} {grantor} ${amount} to {sponsee}.{ext}`
 * Example: `2026-08-25 Ford Foundation $50,000 to Earthseed.pdf`
 *
 * Strips filename-unsafe characters from grantor + sponsee names.
 */
export function driveFileName(input: {
  createdSec: number
  grantorName: string
  amount: number
  sponseeName: string
  originalName: string
}): string {
  const date = new Date(input.createdSec * 1000).toISOString().slice(0, 10) // YYYY-MM-DD
  const amt = '$' + Math.round(input.amount).toLocaleString('en-US')
  const ext = (input.originalName.split('.').pop() || 'pdf').toLowerCase().replace(/[^a-z0-9]/g, '') || 'pdf'
  const clean = (s: string) => s.replace(/[\/\\:*?"<>|]/g, '').trim()
  return `${date} ${clean(input.grantorName)} ${amt} to ${clean(input.sponseeName)}.${ext}`
}

/** UNDOC_GRANT_MAX from PHP defs.inc — file upload is required when grant > this. */
export const UNDOC_GRANT_MAX = 5000
