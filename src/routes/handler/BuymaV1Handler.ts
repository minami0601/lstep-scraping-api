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

// import axios, { AxiosResponse } from 'axios'

const TIME_OUT = 1000 * 60 * 15 // 15分

// import BuymaV1Dao from '@/daos/BuymaV1/BuymaV1Dao.scraping' // TODO削除
// const buymaV1Dao = new BuymaV1Dao() // TODO削除

// import GasDao from '@/daos/Gas/GasDao.api' // TODO削除
// const gasDao = new GasDao() // TODO削除

import BuymaV1UseCase from '@/usecase/BuymaV1/BuymaV1UseCase'

const buymaV1UseCase = new BuymaV1UseCase()

import { AuthError } from '@/shared/constants'
import logger, { responseLog } from '@/shared/Logger'

// const { BAD_REQUEST, CREATED, OK } = StatusCodes
const { BAD_REQUEST, OK } = StatusCodes

// /**
//  * Get users name.
//  *
//  * @param req
//  * @param res
//  * @returns
//  */
// export async function getUserName(req: Request, res: Response) {
//   const buymaLogin = req.body.buymaLoginRequest
//   if (!buymaLogin?.email || !buymaLogin?.password) {
//     return res.status(BAD_REQUEST).json(AuthError)
//   }
//   try {
//     const buymaV1 = await buymaV1Dao.getUserName(buymaLogin)
//     return res.status(OK).json(buymaV1)
//   } catch (error) {
//     logger.err(error)
//     return res.status(BAD_REQUEST).json(error)
//   }
// }

// /**
//  * getTestPeriodicExecution 定期実行テスト
//  *
//  * @param req
//  * @param res
//  * @returns
//  */
// export function getTestPeriodicExecution(req: Request, res: Response) {
//   const response: ResponseContent<any> = {
//     code: 200,
//     data: null,
//     message: 'テスト',
//   }

//   try {
//     buymaV1Dao.getTestPeriodicExecution()
//     // return res.status(OK).json(buymaV1)

//     return res.status(OK).json(response)
//   } catch (error) {
//     logger.err(error)
//     return res.status(BAD_REQUEST).json(error)
//   }
// }

// /**
//  * getTestPeriodicExecution 定期実行テスト
//  *
//  * @param req
//  * @param res
//  * @returns
//  */
// export async function createSheet(req: Request, res: Response) {
//   const requestGASContent = req.body.requestGASContent
//   try {
//     const response = await gasDao.createSheet(requestGASContent)
//     return res.status(OK).json(response)
//   } catch (error) {
//     logger.err(error)
//     return res.status(BAD_REQUEST).json(error)
//   }
// }

// No.2 モデリングリサーチ
export async function modelingResearch(
  req: Request,
  res: Response<ResponseContent<null>>
) {
  // タイムアウト設定
  req.setTimeout(TIME_OUT)

  workerLog('modelingResearch')

  const requestBody = req.body.requestBodyBuymaUseCaseNo2
  const host = req.host

  try {
    logger.info('modelingResearchリクエスト')
    const response = await buymaV1UseCase.modelingResearch(requestBody, host)
    if (response.code != 200) {
      responseLog(response, 'err')
    }
    return res.status(OK).json(response)
  } catch (error) {
    logger.err(error)
    return res.status(BAD_REQUEST) // TODO エラー時のレスポンス
  }
}

// No.2 モデリングリサーチスクレイピング
export async function modelingResearchScrap(
  req: Request,
  res: Response<ResponseContent<BuymaUseCaseNo2ScrapData>>
) {
  // タイムアウト設定
  req.setTimeout(TIME_OUT)

  workerLog('modelingResearchScrap')

  const requestBody = req.body.requestBodyBuymaUseCaseNo2

  try {
    logger.info('modelingResearchScrapリクエスト')
    const response = await buymaV1UseCase.modelingResearchScrap(requestBody)
    if (response.code != 200) {
      responseLog(response, 'err')
    }
    return res.status(OK).json(response)
  } catch (error) {
    logger.err(error)
    return res.status(BAD_REQUEST)
  }
}
export async function exhibitPlaceResearch(
  req: Request,
  res: Response<ResponseContent<ResponseGASContent<RequestGasBuymaNo6Data[]>>>
) {
  // タイムアウト設定
  req.setTimeout(TIME_OUT)

  workerLog('exhibitPlaceResearch')

  const requestBody = req.body.requestBodyBuymaUseCaseNo6

  try {
    logger.info('exhibitPlaceResearchリクエスト')
    const response = await buymaV1UseCase.exhibitPlaceResearch(requestBody)
    if (response.code != 200) {
      responseLog(response, 'err')
    }
    return res.status(OK).json(response)
  } catch (error) {
    logger.err(error)
    return res.status(BAD_REQUEST) // TODO エラー時のレスポンス
  }
}

// export function exhibitPlaceResearchTasks(
//   req: Request,
//   res: Response<ResponseContent<ResponseGASContent<RequestGasBuymaNo6Data[]>>>
// ) {
//   // タイムアウト設定
//   req.setTimeout(TIME_OUT)
//   workerLog()

//   const requestBody = req.body.requestBodyBuymaUseCaseNo6

//   try {
//     logger.info('exhibitPlaceResearchTasksリクエスト')
//     return res.status(OK)
//   } catch (error) {
//     logger.err(error)
//     return res.status(BAD_REQUEST) // TODO エラー時のレスポンス
//   }
// }

// No7 メンテナンス
export async function maintenance(
  req: Request,
  res: Response<ResponseContent<null>>
) {
  // タイムアウト設定
  req.setTimeout(TIME_OUT)

  workerLog('maintenance')

  const requestBody = req.body.requestBodyBuymaUseCaseNo7
  const host = req.host

  try {
    logger.info('maintenanceリクエスト')
    const response = await buymaV1UseCase.maintenance(requestBody, host)
    if (response.code != 200) {
      responseLog(response, 'err')
    }
    return res.status(OK).json(response)
  } catch (error) {
    logger.err(error)
    return res.status(BAD_REQUEST) // TODO エラー時のレスポンス
  }
}

// No7 メンテナンススクレイピング
export async function maintenanceScrap(
  req: Request,
  res: Response<ResponseContent<BuymaUseCaseNo7ScrapData[]>>
) {
  // タイムアウト設定
  req.setTimeout(TIME_OUT)

  workerLog('maintenanceScrap')

  const requestBody = req.body.requestBodyBuymaUseCaseNo7

  try {
    logger.info('maintenanceScrapリクエスト')
    const response = await buymaV1UseCase.maintenanceScrap(requestBody)
    if (response.code != 200) {
      responseLog(response, 'err')
    }
    return res.status(OK).json(response)
  } catch (error) {
    logger.err(error)
    return res.status(BAD_REQUEST)
  }
}
