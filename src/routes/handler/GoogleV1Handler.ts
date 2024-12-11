import StatusCodes from 'http-status-codes'
import { Request, Response } from 'express'

const TIME_OUT = 1000 * 60 * 15 // 15分

import GoogleV1UserCase from '@/usecase/BuymaV1/GoogleV1UserCase'

const googleV1UseCase = new GoogleV1UserCase()

import { AuthError } from '@/shared/constants'
import logger, { responseLog } from '@/shared/Logger'

const { BAD_REQUEST, OK } = StatusCodes

// CSV吐き出し
export async function google(req: Request, res: Response) {
  // タイムアウト設定
  const data = await googleV1UseCase.Google()

  req.setTimeout(TIME_OUT)
  // workerLog('')
  return res.status(OK).json(data)
}
