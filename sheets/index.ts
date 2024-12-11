import fs from 'fs'
import readline from 'readline'
import logger from 'jet-logger'

import { google } from 'googleapis'

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
]
const TOKEN_PATH = 'sheets/secrets/token.json'
const CRED_PATH = 'sheets/secrets/credentials.json'

async function main() {
  const auth = await authorize(JSON.parse(fs.readFileSync(CRED_PATH, 'utf8')))
  const sheets = google.sheets({ version: 'v4', auth })
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
    range: 'Class Data!A2:E',
  })

  if (response) {
    logger.info('スプレッドシートに接続成功')
    const rows = response.data.values
    if (rows) {
      if (rows.length) {
        rows.map((row) => {
          logger.info(`${row[0]}, ${row[4]}`)
        })
      } else {
        logger.info('データがありません')
      }
    }
  }
}

async function authorize(cred: any) {
  const { client_secret, client_id, redirect_uris } = cred.installed
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  )

  if (fs.existsSync(TOKEN_PATH)) {
    oAuth2Client.setCredentials(JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8')))
    return oAuth2Client
  }

  return getNewToken<typeof oAuth2Client>(oAuth2Client)
}

async function getNewToken<T = any>(oAuth2Client: any): Promise<T> {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  })

  logger.info('このURLにアクセスし、このアプリを認証してください:' + authUrl)
  const code = await readlineAsync(
    '認証ページにあるコードをここに入力してください:'
  )

  // トークン取得
  const token = await new Promise((resolve, reject) => {
    oAuth2Client.getToken(code, (err: any, token: any) => {
      err ? reject(err) : resolve(token)
    })
  })
  oAuth2Client.setCredentials(token)
  // トークンを保存
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(token))
  logger.info('トークンの保存先' + TOKEN_PATH)

  return oAuth2Client
}

async function readlineAsync(question: string) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer)
    })
  })
}

main()
