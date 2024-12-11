// データの加工が責務
// レスポンスの管理が責務

import { ResponseContent } from '@/entities/Http'
import { ResponseGASContent } from '@/entities/Gas'
// import {
//   RequestBodyBuymaUseCaseNo2,
//   BuymaUseCaseNo2ScrapData,
//   No2Row,
//   No2Col,
//   No2Count,
//   RequestGasBuymaNo6Data,
//   RequestBodyBuymaUseCaseNo6,
//   RequestBodyBuymaUseCaseNo7,
//   BuymaUseCaseNo7ScrapData,
// } from '@/entities/BuymaV1'

import LstepV1Dao from '@/daos/LstepV1/LstepV1Dao.scraping'

// interface IBuymaV1UseCase {
//   exhibitPlaceResearch(
//     requestBody: RequestBodyBuymaUseCaseNo6
//   ): Promise<ResponseContent<any>> // TODO anyをちゃんと
//   modelingResearch(
//     requestBody: RequestBodyBuymaUseCaseNo2,
//     host: string
//   ): Promise<ResponseContent<null>>
//   modelingResearchScrap(
//     request: RequestBodyBuymaUseCaseNo2
//   ): Promise<ResponseContent<any>> // TODO anyをちゃんと
//   maintenance(
//     requestBody: RequestBodyBuymaUseCaseNo7,
//     host: string
//   ): Promise<ResponseContent<null>>
//   maintenanceScrap(
//     request: RequestBodyBuymaUseCaseNo7
//   ): Promise<ResponseContent<BuymaUseCaseNo7ScrapData[]>>
// }

const lstepV1Dao = new LstepV1Dao()

class LstepV1UseCase {
  public async lstep() {
    await lstepV1Dao.lstepCSV()
  }
}

export default LstepV1UseCase
