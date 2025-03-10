import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import helmet from 'helmet'

import express, { NextFunction, Request, Response } from 'express'
import StatusCodes from 'http-status-codes'
import 'express-async-errors'

import BaseRouter from './routes'
import logger from '@/shared/Logger'

const app = express()
const { BAD_REQUEST } = StatusCodes

/************************************************************************************
 *                              Set basic express settings
 ***********************************************************************************/

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// app.use((req, res, next) => {
//   res.header('Access-Control-Allow-Origin', '*')
//   // res.header('Access-Control-Allow-Origin', 'http://localhost:8080')
//   res.header(
//     'Access-Control-Allow-Headers',
//     'Origin, X-Requested-With, Content-Type, Accept'
//   )
//   next()
// })

// CORSの許可
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*') // TODO ドメイン指定
  res.header('Access-Control-Allow-Methods', '*')
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  )
  next()
})

// Show routes called in console during development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

// Security
if (process.env.NODE_ENV === 'production') {
  app.use(helmet())
}

// Add APIs
app.use('/api', BaseRouter)

// Print API errors
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.err('エラーが発生しました。')
  logger.err(err, true)
  return res.status(BAD_REQUEST).json({
    error: err.message,
  })
})

// Export express instance
export default app
