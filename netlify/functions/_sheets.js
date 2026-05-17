import { google } from 'googleapis'

export function getSheetsClient() {
  const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON)
  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  return google.sheets({ version: 'v4', auth })
}

export const SHEET_ID = process.env.GOOGLE_SHEET_WRITE_ID

export function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(body),
  }
}

/** Convert a sheet's values array (with header row) to array of objects */
export function toObjects(values) {
  if (!values || values.length < 2) return []
  const [headers, ...rows] = values
  return rows.map((row) =>
    Object.fromEntries(headers.map((h, i) => [h, row[i] ?? '']))
  )
}

/** Convert array of objects back to 2D values array (header + rows) */
export function fromObjects(objects) {
  if (!objects.length) return []
  const headers = Object.keys(objects[0])
  return [headers, ...objects.map((o) => headers.map((h) => o[h] ?? ''))]
}
