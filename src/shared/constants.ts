// Put shared constants here

export const paramMissingError =
  'One or more of the required parameters was missing.'

export const AuthError = 'バイマのログイン情報を入力してください'

//
export const GOOGLE_API = {
  SCOPES: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.file',
  ],
  TOKEN_PATH: 'sheets/secrets/token.json',
  CRED_PATH: 'sheets/secrets/credentials.json',
}

export const DRIVE_INFO = {
  NO2: {
    TEMPLATE_ID: '1jXGURPFsyGDMoSX6993uoA-cX4MkJkz_W1PueSz7Tgc',
    RESULT_FOLDER_ID: '133Gp50EkBQI0WhyKhFZipiGqAGNxwzHf',
  },
  NO7: {
    TEMPLATE_ID: '1lCmvhb0PGHj54nMaYPtwq8pNSFeO7y6YDgY71lf4WfI',
    RESULT_FOLDER_ID: '1zACAXpC9P2iE2omAtOrnhxpzWeboczaA',
  },
}
