import { IUser } from '@/entities/User'
import {
  BuymaLoginRequest,
  IBuymaV1,
  RequestBodyBuymaUseCaseNo2,
  RequestBodyBuymaUseCaseNo6,
  RequestBodyBuymaUseCaseNo7,
} from '@/entities/BuymaV1'

import { RequestGASContent } from '@/entities/Gas'

declare module 'express' {
  export interface Request {
    host: string
    body: {
      user: IUser
      buymaLoginRequest: BuymaLoginRequest // テスト用 TODO削除
      requestGASContent: RequestGASContent[] // テスト用 TODO削除
      requestBodyBuymaUseCaseNo2: RequestBodyBuymaUseCaseNo2
      requestBodyBuymaUseCaseNo6: RequestBodyBuymaUseCaseNo6
      requestBodyBuymaUseCaseNo7: RequestBodyBuymaUseCaseNo7
    }
  }
}
