// データの受け渡しのみが責務
// TODO アクセストークン設定
import StatusCodes from 'http-status-codes'
import { Request, Response } from 'express'
import { ResponseContent } from '@/entities/Http'
import { ResponseGASContent } from '@/entities/Gas'
import {
  RequestGasBuymaNo6Data,
  BuymaUseCaseNo2ScrapData,
  BuymaUseCaseNo7ScrapData,
} from '@/entities/BuymaV1'
import { workerLog } from '@/shared/functions'

const TIME_OUT = 1000 * 60 * 15 // 15分

import LstepV1UseCase from '@/usecase/BuymaV1/LstepV1UseCase'

const lstepV1UseCase = new LstepV1UseCase()

import { AuthError } from '@/shared/constants'
import logger, { responseLog } from '@/shared/Logger'

// const { BAD_REQUEST, CREATED, OK } = StatusCodes
const { BAD_REQUEST, OK } = StatusCodes

// CSV吐き出し
export async function lstepCSV(req: Request, res: Response) {
  // タイムアウト設定
  await lstepV1UseCase.lstep()

  req.setTimeout(TIME_OUT)
  // workerLog('')
  return res.status(OK).json({})
}
