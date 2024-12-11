/**
 * Setup the jet-logger.
 *
 * Documentation: https://github.com/seanpmaxwell/jet-logger
 */
// import path from 'path'
// import { LoggerModes } from 'jet-logger'
import logger from 'jet-logger'
import { ResponseContent } from '@/entities/Http'

export const responseLog = (
  response: ResponseContent<any>,
  logType?: 'info' | 'warn' | 'err'
): void => {
  const log =
    '\n\nresponse.code:' +
    response.code +
    '\n\nresponse.message:' +
    response.message +
    '\n\nresponse.data:' +
    (response.data || 'データ取得なし')

  switch (logType) {
    case 'info':
      logger.info(log)
      break
    case 'warn':
      logger.warn(log)
      break
    case 'err':
      logger.err(log)
      break
    default:
      logger.info(log)
  }
}

export default logger
