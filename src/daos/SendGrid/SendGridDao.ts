// using SendGrid's Node.js Library - https://github.com/sendgrid/sendgrid-nodejs

import sgMail from '@sendgrid/mail'
import { TOKEN } from '@/shared/code'
import logger from '@/shared/Logger'

if (TOKEN.SEND_GRID_API_KEY) {
  sgMail.setApiKey(TOKEN.SEND_GRID_API_KEY)
} else {
  logger.err('SEND_GRID_API_KEYを設定してください。')
  throw 'SEND_GRID_API_KEYを設定してください。'
}

// export interface IGasDao {
//   createSheet<T>(
//     sheetBody: Array<T>
//   ): Promise<ResponseGASContent<Array<T>> | null>
// }

export type msgInfo = {
  to: string
  from: string
  subject: string
  text: string
}

// class SendGridDao implements IGasDao {
class SendGridDao {
  public async sendEmail(msgInfo: msgInfo) {
    try {
      const result = await sgMail.send(msgInfo)
      console.log(result)
      console.log('success to sendGrid')
    } catch (error) {
      console.log('failed to sendGrid')
      console.log(error)
    }
  }
}

export default SendGridDao
