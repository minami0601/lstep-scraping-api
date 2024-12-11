// import {
//   IBuymaV1,
//   BuymaLoginRequest,
//   PlayWright,
//   BuymaUseCaseNo6ScrapData,
// } from '@/entities/BuymaV1'
// import { ResponseGASContent, RequestGASContent } from '@/entities/Gas'

// export interface IBuymaV1Dao {
//   buymaLogin: (
//     buymaLoginRequest: BuymaLoginRequest
//   ) => Promise<PlayWright | null>
//   getUserName: (buymaLoginRequest: BuymaLoginRequest) => Promise<IBuymaV1[]>
//   getTestPeriodicExecution: () => void
//   createSheet(
//     buymaLoginRequests: BuymaLoginRequest[]
//   ): Promise<ResponseGASContent<RequestGASContent> | null>
//   // exhibitPlaceResearch(): Promise<void>
//   exhibitPlaceResearch1(): Promise<void>
//   exhibitPlaceResearch(): Promise<BuymaUseCaseNo6ScrapData[]>
// }

// // class BuymaDao implements IBuymaV1Dao {
// //   public async chromiumNewPage(): Promise<PlayWright | null> {
// //     return Promise.resolve(null)
// //   }

// //   public async buymaLogin(
// //     buymaLoginRequest: BuymaLoginRequest
// //   ): Promise<PlayWright | null> {
// //     return Promise.resolve(null)
// //   }

// //   public getUserName(
// //     buymaLoginRequest: BuymaLoginRequest
// //   ): Promise<IBuymaV1[]> {
// //     // TODO
// //     return Promise.resolve([])
// //   }

// //   public getTestPeriodicExecution(): void {
// //     return
// //   }

// //   public async createSheet(
// //     buymaLoginRequests: BuymaLoginRequest[]
// //   ): Promise<ResponseGASContent<RequestGASContent> | null> {
// //     return Promise.resolve(null)
// //   }

// //   // public async exhibitPlaceResearch(): Promise<any> {
// //   //   return Promise.resolve(undefined)
// //   // }

// //   public async exhibitPlaceResearch1(): Promise<any> {
// //     return Promise.resolve(undefined)
// //   }

// //   public async exhibitPlaceResearch2(): Promise<any> {
// //     return Promise.resolve(undefined)
// //   }
// // }

// // export default BuymaDao
