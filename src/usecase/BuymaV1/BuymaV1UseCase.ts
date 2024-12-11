// データの加工が責務
// レスポンスの管理が責務

import { ResponseContent } from '@/entities/Http'
import { ResponseGASContent } from '@/entities/Gas'
import {
  RequestBodyBuymaUseCaseNo2,
  BuymaUseCaseNo2ScrapData,
  No2Row,
  No2Col,
  No2Count,
  RequestGasBuymaNo6Data,
  RequestBodyBuymaUseCaseNo6,
  RequestBodyBuymaUseCaseNo7,
  BuymaUseCaseNo7ScrapData,
} from '@/entities/BuymaV1'

import BuymaV1Dao from '@/daos/BuymaV1/BuymaV1Dao.scraping'
import GasDao from '@/daos/Gas/GasDao.api'
import SpreadsheetDao from '@/daos/Spreadsheet/SpreadsheetDao.api'
import logger from '@/shared/Logger'
import SendGridDao from '@/daos/SendGrid/SendGridDao'
import TasksDao from '@/daos/Tasks/TasksDao'

interface IBuymaV1UseCase {
  exhibitPlaceResearch(
    requestBody: RequestBodyBuymaUseCaseNo6
  ): Promise<ResponseContent<any>> // TODO anyをちゃんと
  modelingResearch(
    requestBody: RequestBodyBuymaUseCaseNo2,
    host: string
  ): Promise<ResponseContent<null>>
  modelingResearchScrap(
    request: RequestBodyBuymaUseCaseNo2
  ): Promise<ResponseContent<any>> // TODO anyをちゃんと
  maintenance(
    requestBody: RequestBodyBuymaUseCaseNo7,
    host: string
  ): Promise<ResponseContent<null>>
  maintenanceScrap(
    request: RequestBodyBuymaUseCaseNo7
  ): Promise<ResponseContent<BuymaUseCaseNo7ScrapData[]>>
}

const buymaV1Dao = new BuymaV1Dao()
const gasDao = new GasDao()
const sendGridDao = new SendGridDao()
const spreadsheetDao = new SpreadsheetDao()
const tasksDao = new TasksDao()

class BuymaV1UseCase implements IBuymaV1UseCase {
  public async exhibitPlaceResearch(
    requestBody: RequestBodyBuymaUseCaseNo6
  ): Promise<ResponseContent<ResponseGASContent<RequestGasBuymaNo6Data[]>>> {
    const useCaseResponse: ResponseContent<
      ResponseGASContent<RequestGasBuymaNo6Data[]>
    > = {
      code: 200,
      message: '',
      data: null,
    }

    const buymaURL = requestBody.buymaURL
    const toEmail = requestBody.toEmail

    if (!buymaURL) {
      useCaseResponse.code = 400
      useCaseResponse.message = 'BUYMAの検索URLを入力してください。'
      await sendGridDao.sendEmail({
        to: toEmail,
        from: 'seiya1025198@gmail.com',
        subject: '出品地リサーチに失敗しました。',
        text: useCaseResponse.message,
      })
      return useCaseResponse
    }

    if (!toEmail) {
      useCaseResponse.code = 400
      useCaseResponse.message = 'メールアドレスを入力してください。'
      await sendGridDao.sendEmail({
        to: toEmail,
        from: 'seiya1025198@gmail.com',
        subject: '出品地リサーチに失敗しました。',
        text: useCaseResponse.message,
      })
      return useCaseResponse
    }

    // URLチェック
    const isBuymaURL = buymaURL.indexOf('https://www.buyma.com/r/')
    if (isBuymaURL < 0) {
      useCaseResponse.code = 400
      useCaseResponse.message = 'BUYMAの検索URLを入力してください。'
      await sendGridDao.sendEmail({
        to: toEmail,
        from: 'seiya1025198@gmail.com',
        subject: '出品地リサーチに失敗しました。',
        text: useCaseResponse.message,
      })
      return useCaseResponse
    }

    // BUYMAスクレピング データ取得

    try {
      logger.info('BUYMAスクレピング データ取得')
      const responseBuymaData = await buymaV1Dao.exhibitPlaceResearch(buymaURL)

      logger.info('BUYMAスクレピング データ取得完了')

      if (!responseBuymaData.length) {
        useCaseResponse.code = 404
        useCaseResponse.message = 'BUYMAのスクレイピング処理に失敗しました。'
        await sendGridDao.sendEmail({
          to: toEmail,
          from: 'seiya1025198@gmail.com',
          subject: '出品地リサーチに失敗しました。',
          text: '出品地リサーチに失敗しました。',
        })
        return useCaseResponse
      }

      // 計算ロジック
      logger.info('注文実績を計算中')

      const requestGasData: RequestGasBuymaNo6Data[] = []

      responseBuymaData.forEach((value) => {
        const requestData: RequestGasBuymaNo6Data = {
          shopperName: value.shopperName,
          shopperLink: value.shopperLink,
          productName: value.productName,
          titleURL: value.titleURL,
          thumbnailURL: value.thumbnailURL,
          brandName: value.brandName,
          price: value.price,
          brandTypeNo: value.brandTypeNo,
          listingDate: value.listingDate,
          landOfPurchase: value.landOfPurchase,
          inquiriesCount: value.inquiriesCount,
          acCount: value.acCount,
          favCount: value.favCount,
          largeCategory: value.largeCategory,
          smallCategory: value.smallCategory,
          season: value.season,
          soldCount: '',
        }

        let count = 0
        value.shopperSales.forEach((v) => {
          if (value.productName == v.title) {
            count += Number(v.ordersCount)
          }
        })
        requestData.soldCount = String(count)

        requestGasData.push(requestData)
      })

      logger.info('注文実績を計算完了')

      // スプレッドシート化
      logger.info('スプレッドシートに変換中')
      const respnseGas = await gasDao.createSheet<RequestGasBuymaNo6Data>(
        requestGasData
      )
      logger.info('スプレッドシートに変換完了')

      // エラー時にはエラーのデータを取得したいな
      useCaseResponse.data = respnseGas
      useCaseResponse.message = '処理が完了しました。'

      const ssURL = respnseGas.data.ssURL

      logger.info(toEmail + 'にメールを送ります。')

      await sendGridDao.sendEmail({
        to: toEmail,
        from: 'seiya1025198@gmail.com',
        subject: '出品地リサーチが完了しました。',
        text: 'リサーチ結果です\n' + ssURL,
      })

      return useCaseResponse
    } catch (error) {
      useCaseResponse.code = 500
      useCaseResponse.message = 'UseCaseでエラーが発生しました。'
      logger.err('UseCaseでエラーが発生しました。')
      logger.err(error)
      await sendGridDao.sendEmail({
        to: toEmail,
        from: 'seiya1025198@gmail.com',
        subject: '出品地リサーチに失敗しました。',
        text: '出品地リサーチに失敗しました。',
      })
      return useCaseResponse
    }
  }
  // No2 モデリングリサーチ
  public async modelingResearch(
    requestBody: RequestBodyBuymaUseCaseNo2,
    host: string
  ): Promise<ResponseContent<null>> {
    const useCaseResponse: ResponseContent<null> = {
      code: 200,
      message: '',
      data: null,
    }
    const buymaURL = requestBody.buymaURL
    const toEmail = requestBody.toEmail
    try {
      if (!buymaURL) {
        useCaseResponse.code = 400
        useCaseResponse.message = 'BUYMAの検索URLを入力してください。'
        await sendGridDao.sendEmail({
          to: toEmail,
          from: 'seiya1025198@gmail.com',
          subject: 'モデリングリサーチに失敗しました。',
          text: useCaseResponse.message,
        })
        return useCaseResponse
      }

      if (!toEmail) {
        useCaseResponse.code = 400
        useCaseResponse.message = 'メールアドレスを入力してください。'
        await sendGridDao.sendEmail({
          to: toEmail,
          from: 'seiya1025198@gmail.com',
          subject: 'モデリングリサーチに失敗しました。',
          text: useCaseResponse.message,
        })
        return useCaseResponse
      }

      // URLチェック
      const isBuymaURL = buymaURL.indexOf('https://www.buyma.com/buyer/')
      if (isBuymaURL < 0) {
        useCaseResponse.code = 400
        useCaseResponse.message = 'BUYMAの検索URLを入力してください。'
        await sendGridDao.sendEmail({
          to: toEmail,
          from: 'seiya1025198@gmail.com',
          subject: 'モデリングリサーチに失敗しました。',
          text: useCaseResponse.message,
        })
        return useCaseResponse
      }
      const payload = {
        requestBodyBuymaUseCaseNo2: requestBody,
      }
      const endpoint = 'api/v1/buyma/modeling-research/scraping'

      // cloud tasksのタスクを作成
      tasksDao.createHttpTask({
        host: host,
        endpoint: endpoint,
        payload: payload,
      })
    } catch (error) {
      useCaseResponse.code = 500
      useCaseResponse.message = 'UseCaseでエラーが発生しました。'
      logger.err('UseCaseでエラーが発生しました。')
      logger.err(error)
    }
    return useCaseResponse
  }
  public async modelingResearchScrap(
    requestBody: RequestBodyBuymaUseCaseNo2
  ): Promise<ResponseContent<BuymaUseCaseNo2ScrapData>> {
    const useCaseResponse: ResponseContent<BuymaUseCaseNo2ScrapData> = {
      code: 200,
      message: '',
      data: {
        orderRecordList: [],
        latestProductList: [],
        orderRecordFailureCount: 0,
        latestProductFailureCount: 0,
      },
    }
    const buymaURL = requestBody.buymaURL
    const toEmail = requestBody.toEmail

    // BUYMAスクレピング データ取得

    try {
      logger.info('BUYMAスクレピング データ取得')
      const responseBuymaData = await buymaV1Dao.modelingResearch(buymaURL)
      logger.info('BUYMAスクレピング データ取得完了')

      if (
        !responseBuymaData.orderRecordList.length &&
        !responseBuymaData.latestProductList.length
      ) {
        useCaseResponse.code = 404
        useCaseResponse.message = 'BUYMAのスクレイピング処理に失敗しました。'
        await sendGridDao.sendEmail({
          to: toEmail,
          from: 'seiya1025198@gmail.com',
          subject: 'モデリングリサーチに失敗しました。',
          text: 'モデリングリサーチに失敗しました。',
        })
        return useCaseResponse
      }

      // logger.info('計算開始')
      // const row: No2Row = {
      //   url: 0,
      //   tops: 0,
      //   pantsBottoms: 0,
      //   dressesAllInOnes: 0,
      //   outerwearJackets: 0,
      //   shoesFootwear: 0,
      //   boots: 0,
      //   bagsBriefcases: 0,
      //   walletsMiscellaneousGoods: 0,
      //   accessories: 0,
      //   fashionAccessories: 0,
      //   hats: 0,
      //   cellPhoneCases: 0,
      //   eyewear: 0,
      //   lifestyle: 0,
      // }
      // const count: No2Count = {
      //   allListingCnt: {
      //     ladies: Object.assign({}, row),
      //     mens: Object.assign({}, row),
      //     total: Object.assign({}, row),
      //   },
      //   lastThreeMonthsListingCnt: {
      //     ladies: Object.assign({}, row),
      //     mens: Object.assign({}, row),
      //     total: Object.assign({}, row),
      //   },
      //   lastOneMonthsCnt: {
      //     ladies: Object.assign({}, row),
      //     mens: Object.assign({}, row),
      //     total: Object.assign({}, row),
      //   },
      //   oneMonthToTwoMonthsBeforeCnt: {
      //     ladies: Object.assign({}, row),
      //     mens: Object.assign({}, row),
      //     total: Object.assign({}, row),
      //   },
      //   twoMonthToThreeMonthsBeforeCnt: {
      //     ladies: Object.assign({}, row),
      //     mens: Object.assign({}, row),
      //     total: Object.assign({}, row),
      //   },
      //   lastThreeMonthCnt: {
      //     ladies: Object.assign({}, row),
      //     mens: Object.assign({}, row),
      //     total: Object.assign({}, row),
      //   },
      // }

      // const checkCategory = (category: string, row: No2Row) => {
      //   switch (true) {
      //     case /.*(トップス).*/.test(category): // トップス
      //       row.tops += 1
      //       row.url += 1
      //       break
      //     case /.*(パンツ).*/.test(category): // パンツ・ボトムス
      //       row.pantsBottoms += 1
      //       row.url += 1
      //       break
      //     case /.*(ワンピース).*/.test(category): // ワンピース・オールインワン
      //       row.dressesAllInOnes += 1
      //       row.url += 1
      //       break

      //     case /.*(アウター).*/.test(category): // アウター・ジャケット
      //       row.outerwearJackets += 1
      //       row.url += 1
      //       break

      //     case /.*(靴).*/.test(category): // 靴・シューズ
      //       row.shoesFootwear += 1
      //       row.url += 1
      //       break

      //     case /.*(ブーツ).*/.test(category): // ブーツ
      //       row.boots += 1
      //       row.url += 1
      //       break

      //     case /.*(バッグ).*/.test(category): // バッグ・カバン
      //       row.bagsBriefcases += 1
      //       row.url += 1
      //       break

      //     case /.*(財布).*/.test(category): // 財布・雑貨
      //       row.walletsMiscellaneousGoods += 1
      //       row.url += 1
      //       break

      //     case /.*(アクセサリー).*/.test(category): // アクセサリー
      //       row.accessories += 1
      //       row.url += 1
      //       break

      //     case /.*(ファッション雑貨・小物).*/.test(category): // ファッション雑貨・小物
      //       row.fashionAccessories += 1
      //       row.url += 1
      //       break

      //     case /.*(帽子).*/.test(category): // 帽子
      //       row.hats += 1
      //       break

      //     case /.*(スマホケース).*/.test(category): // スマホケース
      //       row.cellPhoneCases += 1
      //       break

      //     case /.*(アイウェア).*/.test(category): // アイウェア
      //       row.eyewear += 1
      //       break

      //     case /.*(ライフスタイル).*/.test(category): // ライフスタイル
      //       row.lifestyle += 1
      //       break
      //   }
      // }
      // const checkGgender = (gender: string, category: string, col: No2Col) => {
      //   checkCategory(category, col.total)
      //   switch (gender) {
      //     case 'レディースファッション':
      //       checkCategory(category, col.ladies)
      //       break
      //     case 'メンズファッション':
      //       checkCategory(category, col.mens)
      //       break
      //   }
      // }
      // // 3ヶ月前の日付取得
      // const now = new Date()
      // const dateOneMonthsAgo = now.setMonth(now.getMonth() - 1)
      // const dateTowMonthsAgo = now.setMonth(now.getMonth() - 2)
      // const dateThreeMonthsAgo = now.setMonth(now.getMonth() - 3)

      // for (const value of responseBuymaData.orderRecordList) {
      //   if (value.largeCategory === '') continue
      //   const contractDate = new Date(value.contractDate).getTime()
      //   if (dateOneMonthsAgo < contractDate) {
      //     // 本日~1ヶ月前
      //     checkGgender(
      //       value.largeCategory,
      //       value.mediumCategory,
      //       count.lastOneMonthsCnt
      //     )
      //     checkGgender(
      //       value.largeCategory,
      //       value.mediumCategory,
      //       count.lastThreeMonthCnt
      //     )
      //   } else if (
      //     dateOneMonthsAgo > contractDate &&
      //     contractDate > dateTowMonthsAgo
      //   ) {
      //     // 1ヶ月前~2ヶ月前
      //     checkGgender(
      //       value.largeCategory,
      //       value.mediumCategory,
      //       count.twoMonthToThreeMonthsBeforeCnt
      //     )
      //     checkGgender(
      //       value.largeCategory,
      //       value.mediumCategory,
      //       count.lastThreeMonthCnt
      //     )
      //   } else if (
      //     dateTowMonthsAgo > contractDate &&
      //     contractDate > dateThreeMonthsAgo
      //   ) {
      //     // 2ヶ月前~3ヶ月前
      //     checkGgender(
      //       value.largeCategory,
      //       value.mediumCategory,
      //       count.twoMonthToThreeMonthsBeforeCnt
      //     )
      //     checkGgender(
      //       value.largeCategory,
      //       value.mediumCategory,
      //       count.lastThreeMonthCnt
      //     )
      //   }
      // }
      // // 最新商品
      // for (const value of responseBuymaData.latestProductList) {
      //   if (value.largeCategory === '') continue
      //   const listingDate = new Date(value.listingDate).getTime()
      //   checkGgender(
      //     value.largeCategory,
      //     value.mediumCategory,
      //     count.allListingCnt
      //   )
      //   if (dateThreeMonthsAgo < listingDate) {
      //     // 直近3か月出品数
      //     checkGgender(
      //       value.largeCategory,
      //       value.mediumCategory,
      //       count.lastThreeMonthsListingCnt
      //     )
      //   }
      // }
      // logger.info('計算完了')

      // テンプレート不使用
      // logger.info('スプレッドシートに変換中')
      // const spreadsheetId = await spreadsheetDao.createSheetModelingResearch(
      //   count
      // )
      // logger.info('スプレッドシートに変換完了')

      // スプレッドシート化
      logger.info('スプレッドシートに変換中')
      // テンプレート使用
      const spreadsheetIdT =
        await spreadsheetDao.createSheetModelingResearchToTemplate(
          responseBuymaData
        )
      logger.info('スプレッドシートに変換完了')

      logger.info(toEmail + 'にメールを送ります。')

      await sendGridDao.sendEmail({
        to: toEmail,
        from: 'seiya1025198@gmail.com',
        subject: 'モデリングリサーチが完了しました。',
        text:
          'リサーチ結果です\n' +
          'https://docs.google.com/spreadsheets/d/' +
          spreadsheetIdT,
        // '\n' +
        // 'テンプレート不使用:' +
        // 'https://docs.google.com/spreadsheets/d/' +
        // spreadsheetId,
      })

      useCaseResponse.data = responseBuymaData

      return useCaseResponse
    } catch (error) {
      useCaseResponse.code = 500
      useCaseResponse.message = 'UseCaseでエラーが発生しました。'
      logger.err('UseCaseでエラーが発生しました。')
      logger.err(error)
      await sendGridDao.sendEmail({
        to: toEmail,
        from: 'seiya1025198@gmail.com',
        subject: 'モデリングリサーチに失敗しました。',
        text: 'モデリングリサーチに失敗しました。',
      })
      return useCaseResponse
    }
  }

  // No7メンテナンス
  public async maintenance(
    requestBody: RequestBodyBuymaUseCaseNo7,
    host: string
  ): Promise<ResponseContent<null>> {
    const useCaseResponse: ResponseContent<null> = {
      code: 200,
      message: '',
      data: null,
    }
    const loginCookie = requestBody.loginCookie
    const toEmail = requestBody.toEmail
    try {
      if (!toEmail) {
        useCaseResponse.code = 400
        useCaseResponse.message = 'メールアドレスを入力してください。'
        await sendGridDao.sendEmail({
          to: toEmail,
          from: 'seiya1025198@gmail.com',
          subject: 'メンテナンスに失敗しました。',
          text: useCaseResponse.message,
        })
        return useCaseResponse
      }
      if (!loginCookie) {
        useCaseResponse.code = 400
        useCaseResponse.message = 'ログインクッキーを入力してください。'
        await sendGridDao.sendEmail({
          to: toEmail,
          from: 'seiya1025198@gmail.com',
          subject: 'メンテナンスに失敗しました。',
          text: useCaseResponse.message,
        })
        return useCaseResponse
      }

      // ログインチェック
      const { success: success } = await buymaV1Dao.preLogin(loginCookie)
      if (!success) {
        useCaseResponse.code = 400
        useCaseResponse.message =
          'ログインに失敗しました。ログインクッキーが間違っています。'
        sendGridDao.sendEmail({
          to: toEmail,
          from: 'seiya1025198@gmail.com',
          subject: 'メンテナンスに失敗しました。',
          text: useCaseResponse.message,
        })
        return useCaseResponse
      }

      const payload = {
        requestBodyBuymaUseCaseNo7: requestBody,
      }
      const endpoint = 'api/v1/buyma/maintenance/scraping'

      // cloud tasksのタスクを作成
      tasksDao.createHttpTask({
        host: host,
        endpoint: endpoint,
        payload: payload,
      })
    } catch (error) {
      useCaseResponse.code = 500
      useCaseResponse.message = 'UseCaseでエラーが発生しました。'
      logger.err('UseCaseでエラーが発生しました。')
      logger.err(error)
    }
    return useCaseResponse
  }
  public async maintenanceScrap(
    requestBody: RequestBodyBuymaUseCaseNo7
  ): Promise<ResponseContent<BuymaUseCaseNo7ScrapData[]>> {
    const useCaseResponse: ResponseContent<BuymaUseCaseNo7ScrapData[]> = {
      code: 200,
      message: '',
      data: [],
    }
    const loginCookie = requestBody.loginCookie
    const toEmail = requestBody.toEmail

    try {
      // BUYMAスクレピング データ取得
      logger.info('BUYMAスクレピング データ取得')
      const [responseBuymaData, failureCount] = await buymaV1Dao.maintenance(
        loginCookie
      )
      logger.info('BUYMAスクレピング データ取得完了')

      if (!responseBuymaData.length) {
        useCaseResponse.code = 404
        useCaseResponse.message = 'BUYMAのスクレイピング処理に失敗しました。'
        await sendGridDao.sendEmail({
          to: toEmail,
          from: 'seiya1025198@gmail.com',
          subject: 'メンテナンスに失敗しました。',
          text: 'メンテナンスに失敗しました。',
        })
        return useCaseResponse
      }

      // スプレッドシート化
      logger.info('スプレッドシートに変換中')
      // テンプレート使用
      const spreadsheetIdT =
        await spreadsheetDao.createSheetMaintenanceToTemplate(
          responseBuymaData,
          failureCount
        )
      logger.info('スプレッドシートに変換完了')

      logger.info(toEmail + 'にメールを送ります。')

      await sendGridDao.sendEmail({
        to: toEmail,
        from: 'seiya1025198@gmail.com',
        subject: 'メンテナンスに成功しました',
        text:
          'リサーチ結果です\n' +
          'https://docs.google.com/spreadsheets/d/' +
          spreadsheetIdT,
      })

      useCaseResponse.data = responseBuymaData

      return useCaseResponse
    } catch (error) {
      useCaseResponse.code = 500
      useCaseResponse.message = 'UseCaseでエラーが発生しました。'
      logger.err('UseCaseでエラーが発生しました。')
      logger.err(error)
      await sendGridDao.sendEmail({
        to: toEmail,
        from: 'seiya1025198@gmail.com',
        subject: 'メンテナンスに失敗しました',
        text: 'メンテナンスに失敗しました',
      })
      return useCaseResponse
    }
  }
}

export default BuymaV1UseCase
