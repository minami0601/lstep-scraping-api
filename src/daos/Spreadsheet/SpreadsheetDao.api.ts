/* eslint-disable max-len */
import fs from 'fs'

import { google } from 'googleapis'

import { GOOGLE_API, DRIVE_INFO } from '@/shared/constants'
import {
  BuymaUseCaseNo2ScrapData,
  No2Count,
  BuymaUseCaseNo7ScrapData,
} from '@/entities/BuymaV1'
export interface ISpreadsheetDao {
  createSheetModelingResearchToTemplate: (
    data: BuymaUseCaseNo2ScrapData
  ) => Promise<string>
  createSheetModelingResearch: (data: No2Count) => Promise<string>
  createSheetMaintenanceToTemplate: (
    data: BuymaUseCaseNo7ScrapData[],
    failureCount: number
  ) => Promise<string>
}
interface Credentials {
  installed: Installed
}
interface Installed {
  client_secret: string
  client_id: string
  redirect_uris: [string]
}
export interface Token {
  refresh_token?: string
  expiry_date?: number
  access_token?: string
  token_type?: string
  id_token?: string
}

class SpreadsheetDao implements ISpreadsheetDao {
  /**
   * APIのorderingパラメータ用に並び順を変換
   * @param cred 認証情報
   * @returns oAuth2Client
   */
  authorize(tokenPath: string): any {
    const cred = JSON.parse(
      fs.readFileSync(GOOGLE_API.CRED_PATH, 'utf8')
    ) as Credentials
    const { client_secret, client_id, redirect_uris } = cred.installed
    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
    )

    const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8')) as Token
    oAuth2Client.setCredentials(token)
    return oAuth2Client
  }

  /**
   * No2モデリングインリサーチのスプレッドシート作成
   * @param scrapData スクレイピングしたNo2のデータ
   * @returns 作成したスプレッドシートのID
   */
  public async createSheetModelingResearchToTemplate(
    scrapData: BuymaUseCaseNo2ScrapData
  ): Promise<string> {
    const orderRecordValues = []
    const latestProductValues = []
    const now = new Date()
    const year = now.getFullYear()
    const month = ('00' + (now.getMonth() + 1)).slice(-2)
    const date = ('00' + now.getDate()).slice(-2)
    const hour = ('00' + now.getHours()).slice(-2)
    const minutes = ('00' + now.getMinutes()).slice(-2)

    // 認証情報取得
    const auth = this.authorize(GOOGLE_API.TOKEN_PATH)

    // APIのクライアント取得
    const drive = google.drive({ version: 'v3', auth })
    const sheets = google.sheets({ version: 'v4', auth })

    // スプレッドシートコピー
    const driveCopyParam = {
      fileId: DRIVE_INFO.NO2.TEMPLATE_ID, // コピー元ファイルのID
      requestBody: {
        name: `モデリングリサーチ結果ファイル${year}/${month}/${date}_${hour}:${minutes} (テンプレート使用)`, // ファイル名
        parents: [DRIVE_INFO.NO2.RESULT_FOLDER_ID], // コピー先のフォルダID
      },
    }
    const driveCopyRes = await drive.files.copy(driveCopyParam)

    // コピーしたスプレッドシートのID取得
    const spreadsheetId =
      driveCopyRes.data.id === undefined ? '' : driveCopyRes.data.id

    // データ貼り付けのリクエストパラメータ作成
    for (const orderRecord of scrapData.orderRecordList) {
      const value = [
        orderRecord.productTitle,
        orderRecord.productURL,
        orderRecord.listingDate,
        orderRecord.contractDate,
        orderRecord.productName,
        orderRecord.brandName,
        orderRecord.largeCategory,
        orderRecord.mediumCategory,
      ]
      orderRecordValues.push(value)
    }

    for (const latestProduct of scrapData.latestProductList) {
      const value = [
        latestProduct.productName,
        latestProduct.productURL,
        latestProduct.listingDate,
        latestProduct.brandName,
        latestProduct.largeCategory,
        latestProduct.mediumCategory,
      ]
      latestProductValues.push(value)
    }

    const orderRecordParam = {
      spreadsheetId: spreadsheetId,
      range: 'No.2_(注文実績)結果貼り付け!A2', // 1列目は上書きしない
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: orderRecordValues,
      },
    }

    const latestProductParam = {
      spreadsheetId: spreadsheetId,
      range: 'No.2_(最新商品)結果貼り付け!A2', // 1列目は上書きしない
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: latestProductValues,
      },
    }

    const failureCountParam = {
      spreadsheetId: spreadsheetId,
      range: 'No2.ゴール!A2', // 1列目は上書きしない
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [
          [
            `注文実績は${scrapData.orderRecordList.length}件中${
              scrapData.orderRecordList.length -
              scrapData.orderRecordFailureCount
            }件成功しました。`,
          ],
          [
            `最新商品は${scrapData.latestProductList.length}件中${
              scrapData.latestProductList.length -
              scrapData.latestProductFailureCount
            }件成功しました。`,
          ],
        ],
      },
    }

    // スプレッドシートに注文実績のデータを貼り付け
    await sheets.spreadsheets.values.update(orderRecordParam)

    // スプレッドシートに最新商品のデータを貼り付け
    await sheets.spreadsheets.values.update(latestProductParam)

    // スプレッドシートに失敗回数のデータを貼り付け
    await sheets.spreadsheets.values.update(failureCountParam)

    return spreadsheetId
  }
  /**
   * No2モデリングインリサーチのスプレッドシート作成
   * @param data 計算したNo2のデータ
   * @returns 作成したスプレッドシートのID
   */
  public async createSheetModelingResearch(data: No2Count): Promise<string> {
    const now = new Date()
    const year = now.getFullYear()
    const month = ('00' + (now.getMonth() + 1)).slice(-2)
    const date = ('00' + now.getDate()).slice(-2)
    const hour = ('00' + now.getHours()).slice(-2)
    const minutes = ('00' + now.getMinutes()).slice(-2)

    // 認証情報取得
    const auth = this.authorize(GOOGLE_API.TOKEN_PATH)

    // APIのクライアント取得
    const drive = google.drive({ version: 'v3', auth })
    const sheets = google.sheets({ version: 'v4', auth })
    // スプレッドシートコピー
    const driveCreateParam = {
      requestBody: {
        name: `モデリングリサーチ結果ファイル${year}/${month}/${date}_${hour}:${minutes}`, // ファイル名
        parents: [DRIVE_INFO.NO2.RESULT_FOLDER_ID], // コピー先のフォルダID
        mimeType: 'application/vnd.google-apps.spreadsheet',
      },
    }
    const driveCopyRes = await drive.files.create(driveCreateParam)

    // コピーしたスプレッドシートのID取得
    const spreadsheetId =
      driveCopyRes.data.id === undefined ? '' : driveCopyRes.data.id

    const values = [
      [],
      [],
      [
        'ショップ名',
        '出品数計',
        '',
        '直近3か月\n出品数',
        '',
        '本日~1ヶ月前\n受注数',
        '',
        '1ヶ月前~2ヶ月前\n受注数',
        '',
        '2ヶ月前~3ヶ月前\n受注数',
        '',
        '直近3か月\n受注計',
      ],
      ['', '女', '男', '女', '男', '女', '男', '女', '男', '女', '男'],
      [
        'URL',
        data.allListingCnt.ladies.url,
        data.allListingCnt.mens.url,
        data.lastThreeMonthsListingCnt.ladies.url,
        data.lastThreeMonthsListingCnt.mens.url,
        data.lastOneMonthsCnt.ladies.url,
        data.lastOneMonthsCnt.mens.url,
        data.oneMonthToTwoMonthsBeforeCnt.ladies.url,
        data.oneMonthToTwoMonthsBeforeCnt.mens.url,
        data.twoMonthToThreeMonthsBeforeCnt.ladies.url,
        data.twoMonthToThreeMonthsBeforeCnt.mens.url,
      ],
      [
        '合計',
        data.allListingCnt.total.url,
        '',
        data.lastThreeMonthsListingCnt.total.url,
        '',
        data.lastOneMonthsCnt.total.url,
        '',
        data.oneMonthToTwoMonthsBeforeCnt.total.url,
        '',
        data.twoMonthToThreeMonthsBeforeCnt.total.url,
        '',
        data.lastThreeMonthCnt.total.url,
      ],
      [
        'トップス',
        data.allListingCnt.ladies.tops,
        data.allListingCnt.mens.tops,
        data.lastThreeMonthsListingCnt.ladies.tops,
        data.lastThreeMonthsListingCnt.mens.tops,
        data.lastOneMonthsCnt.ladies.tops,
        data.lastOneMonthsCnt.mens.tops,
        data.oneMonthToTwoMonthsBeforeCnt.ladies.tops,
        data.oneMonthToTwoMonthsBeforeCnt.mens.tops,
        data.twoMonthToThreeMonthsBeforeCnt.ladies.tops,
        data.twoMonthToThreeMonthsBeforeCnt.mens.tops,
        data.lastThreeMonthCnt.total.tops,
      ],
      [
        'アウター・ジャケット',
        data.allListingCnt.ladies.outerwearJackets,
        data.allListingCnt.mens.outerwearJackets,
        data.lastThreeMonthsListingCnt.ladies.outerwearJackets,
        data.lastThreeMonthsListingCnt.mens.outerwearJackets,
        data.lastOneMonthsCnt.ladies.outerwearJackets,
        data.lastOneMonthsCnt.mens.outerwearJackets,
        data.oneMonthToTwoMonthsBeforeCnt.ladies.outerwearJackets,
        data.oneMonthToTwoMonthsBeforeCnt.mens.outerwearJackets,
        data.twoMonthToThreeMonthsBeforeCnt.ladies.outerwearJackets,
        data.twoMonthToThreeMonthsBeforeCnt.mens.outerwearJackets,
        data.lastThreeMonthCnt.total.outerwearJackets,
      ],
      [
        '靴・シューズ',
        data.allListingCnt.ladies.shoesFootwear,
        data.allListingCnt.mens.shoesFootwear,
        data.lastThreeMonthsListingCnt.ladies.shoesFootwear,
        data.lastThreeMonthsListingCnt.mens.shoesFootwear,
        data.lastOneMonthsCnt.ladies.shoesFootwear,
        data.lastOneMonthsCnt.mens.shoesFootwear,
        data.oneMonthToTwoMonthsBeforeCnt.ladies.shoesFootwear,
        data.oneMonthToTwoMonthsBeforeCnt.mens.shoesFootwear,
        data.twoMonthToThreeMonthsBeforeCnt.ladies.shoesFootwear,
        data.twoMonthToThreeMonthsBeforeCnt.mens.shoesFootwear,
        data.lastThreeMonthCnt.total.shoesFootwear,
      ],
      [
        'ブーツ',
        data.allListingCnt.ladies.boots,
        data.allListingCnt.mens.boots,
        data.lastThreeMonthsListingCnt.ladies.boots,
        data.lastThreeMonthsListingCnt.mens.boots,
        data.lastOneMonthsCnt.ladies.boots,
        data.lastOneMonthsCnt.mens.boots,
        data.oneMonthToTwoMonthsBeforeCnt.ladies.boots,
        data.oneMonthToTwoMonthsBeforeCnt.mens.boots,
        data.twoMonthToThreeMonthsBeforeCnt.ladies.boots,
        data.twoMonthToThreeMonthsBeforeCnt.mens.boots,
        data.lastThreeMonthCnt.total.boots,
      ],
      [
        'バッグ・カバン',
        data.allListingCnt.ladies.bagsBriefcases,
        data.allListingCnt.mens.bagsBriefcases,
        data.lastThreeMonthsListingCnt.ladies.bagsBriefcases,
        data.lastThreeMonthsListingCnt.mens.bagsBriefcases,
        data.lastOneMonthsCnt.ladies.bagsBriefcases,
        data.lastOneMonthsCnt.mens.bagsBriefcases,
        data.oneMonthToTwoMonthsBeforeCnt.ladies.bagsBriefcases,
        data.oneMonthToTwoMonthsBeforeCnt.mens.bagsBriefcases,
        data.twoMonthToThreeMonthsBeforeCnt.ladies.bagsBriefcases,
        data.twoMonthToThreeMonthsBeforeCnt.mens.bagsBriefcases,
        data.lastThreeMonthCnt.total.bagsBriefcases,
      ],
      [
        '財布・雑貨',
        data.allListingCnt.ladies.walletsMiscellaneousGoods,
        data.allListingCnt.mens.walletsMiscellaneousGoods,
        data.lastThreeMonthsListingCnt.ladies.walletsMiscellaneousGoods,
        data.lastThreeMonthsListingCnt.mens.walletsMiscellaneousGoods,
        data.lastOneMonthsCnt.ladies.walletsMiscellaneousGoods,
        data.lastOneMonthsCnt.mens.walletsMiscellaneousGoods,
        data.oneMonthToTwoMonthsBeforeCnt.ladies.walletsMiscellaneousGoods,
        data.oneMonthToTwoMonthsBeforeCnt.mens.walletsMiscellaneousGoods,
        data.twoMonthToThreeMonthsBeforeCnt.ladies.walletsMiscellaneousGoods,
        data.twoMonthToThreeMonthsBeforeCnt.mens.walletsMiscellaneousGoods,
        data.lastThreeMonthCnt.total.walletsMiscellaneousGoods,
      ],
      [
        'アクセサリー',
        data.allListingCnt.ladies.accessories,
        data.allListingCnt.mens.accessories,
        data.lastThreeMonthsListingCnt.ladies.accessories,
        data.lastThreeMonthsListingCnt.mens.accessories,
        data.lastOneMonthsCnt.ladies.accessories,
        data.lastOneMonthsCnt.mens.accessories,
        data.oneMonthToTwoMonthsBeforeCnt.ladies.accessories,
        data.oneMonthToTwoMonthsBeforeCnt.mens.accessories,
        data.twoMonthToThreeMonthsBeforeCnt.ladies.accessories,
        data.twoMonthToThreeMonthsBeforeCnt.mens.accessories,
        data.lastThreeMonthCnt.total.accessories,
      ],
      [
        'ファッション雑貨・小物',
        data.allListingCnt.ladies.fashionAccessories,
        data.allListingCnt.mens.fashionAccessories,
        data.lastThreeMonthsListingCnt.ladies.fashionAccessories,
        data.lastThreeMonthsListingCnt.mens.fashionAccessories,
        data.lastOneMonthsCnt.ladies.fashionAccessories,
        data.lastOneMonthsCnt.mens.fashionAccessories,
        data.oneMonthToTwoMonthsBeforeCnt.ladies.fashionAccessories,
        data.oneMonthToTwoMonthsBeforeCnt.mens.fashionAccessories,
        data.twoMonthToThreeMonthsBeforeCnt.ladies.fashionAccessories,
        data.twoMonthToThreeMonthsBeforeCnt.mens.fashionAccessories,
        data.lastThreeMonthCnt.total.fashionAccessories,
      ],
      [
        '帽子',
        data.allListingCnt.ladies.hats,
        data.allListingCnt.mens.hats,
        data.lastThreeMonthsListingCnt.ladies.hats,
        data.lastThreeMonthsListingCnt.mens.hats,
        data.lastOneMonthsCnt.ladies.hats,
        data.lastOneMonthsCnt.mens.hats,
        data.oneMonthToTwoMonthsBeforeCnt.ladies.hats,
        data.oneMonthToTwoMonthsBeforeCnt.mens.hats,
        data.twoMonthToThreeMonthsBeforeCnt.ladies.hats,
        data.twoMonthToThreeMonthsBeforeCnt.mens.hats,
        data.lastThreeMonthCnt.total.hats,
      ],
      [
        'スマホケース',
        data.allListingCnt.ladies.cellPhoneCases,
        data.allListingCnt.mens.cellPhoneCases,
        data.lastThreeMonthsListingCnt.ladies.cellPhoneCases,
        data.lastThreeMonthsListingCnt.mens.cellPhoneCases,
        data.lastOneMonthsCnt.ladies.cellPhoneCases,
        data.lastOneMonthsCnt.mens.cellPhoneCases,
        data.oneMonthToTwoMonthsBeforeCnt.ladies.cellPhoneCases,
        data.oneMonthToTwoMonthsBeforeCnt.mens.cellPhoneCases,
        data.twoMonthToThreeMonthsBeforeCnt.ladies.cellPhoneCases,
        data.twoMonthToThreeMonthsBeforeCnt.mens.cellPhoneCases,
        data.lastThreeMonthCnt.total.cellPhoneCases,
      ],
      [
        'アイウェア',
        data.allListingCnt.ladies.eyewear,
        data.allListingCnt.mens.eyewear,
        data.lastThreeMonthsListingCnt.ladies.eyewear,
        data.lastThreeMonthsListingCnt.mens.eyewear,
        data.lastOneMonthsCnt.ladies.eyewear,
        data.lastOneMonthsCnt.mens.eyewear,
        data.oneMonthToTwoMonthsBeforeCnt.ladies.eyewear,
        data.oneMonthToTwoMonthsBeforeCnt.mens.eyewear,
        data.twoMonthToThreeMonthsBeforeCnt.ladies.eyewear,
        data.twoMonthToThreeMonthsBeforeCnt.mens.eyewear,
        data.lastThreeMonthCnt.total.eyewear,
      ],
      [
        'ライフスタイル',
        data.allListingCnt.total.lifestyle,
        '',
        data.lastThreeMonthsListingCnt.total.lifestyle,
        '',
        data.lastOneMonthsCnt.total.lifestyle,
        '',
        data.oneMonthToTwoMonthsBeforeCnt.total.lifestyle,
        '',
        data.twoMonthToThreeMonthsBeforeCnt.total.lifestyle,
        '',
        data.lastThreeMonthCnt.total.lifestyle,
      ],
    ]

    const latestProductParam = {
      spreadsheetId: spreadsheetId,
      range: 'シート1!A1', // 1列目は上書きしない
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: values,
      },
    }

    // スプレッドシートに注文実績のデータを貼り付け
    await sheets.spreadsheets.values.update(latestProductParam)

    return spreadsheetId
  }
  /**
   * No７モデリングインリサーチのスプレッドシート作成
   * @param scrapData スクレイピングしたNo2のデータ
   * @returns 作成したスプレッドシートのID
   */
  public async createSheetMaintenanceToTemplate(
    scrapDataList: BuymaUseCaseNo7ScrapData[],
    failureCount: number
  ): Promise<string> {
    const values = []

    const now = new Date()
    const year = now.getFullYear()
    const month = ('00' + (now.getMonth() + 1)).slice(-2)
    const date = ('00' + now.getDate()).slice(-2)
    const hour = ('00' + now.getHours()).slice(-2)
    const minutes = ('00' + now.getMinutes()).slice(-2)

    // 認証情報取得
    const auth = this.authorize(GOOGLE_API.TOKEN_PATH)

    // APIのクライアント取得
    const drive = google.drive({ version: 'v3', auth })
    const sheets = google.sheets({ version: 'v4', auth })

    // スプレッドシートコピー
    const driveCopyParam = {
      fileId: DRIVE_INFO.NO7.TEMPLATE_ID, // コピー元ファイルのID
      requestBody: {
        name: `メンテナンス結果ファイル${year}/${month}/${date}_${hour}:${minutes}`, // ファイル名
        parents: [DRIVE_INFO.NO7.RESULT_FOLDER_ID], // コピー先のフォルダID
      },
    }
    const driveCopyRes = await drive.files.copy(driveCopyParam)

    // コピーしたスプレッドシートのID取得
    const spreadsheetId =
      driveCopyRes.data.id === undefined ? '' : driveCopyRes.data.id

    // データ貼り付けのリクエストパラメータ作成
    for (const scrapData of scrapDataList) {
      const value = [
        scrapData.productName,
        scrapData.productURL,
        scrapData.price,
        scrapData.listingDate,
        scrapData.brandName,
        scrapData.purchaseDeadline,
        scrapData.acCount,
        scrapData.favCount,
        scrapData.inquiriesCount,
        scrapData.scrapTime,
      ]
      values.push(value)
    }

    const orderRecordParam = {
      spreadsheetId: spreadsheetId,
      range: 'No.7_結果貼り付け!A2', // 1列目は上書きしない
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: values,
      },
    }

    const failureCountParam = {
      spreadsheetId: spreadsheetId,
      range: 'No.7ゴール!B2', // 1列目は上書きしない
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [
          [
            `注文リストは${scrapDataList.length}件中${
              scrapDataList.length - failureCount
            }件成功しました。`,
          ],
        ],
      },
    }

    // スプレッドシートに注文実績のデータを貼り付け
    await sheets.spreadsheets.values.update(orderRecordParam)

    // スプレッドシートに失敗回数のデータを貼り付け
    await sheets.spreadsheets.values.update(failureCountParam)

    return spreadsheetId
  }
}

export default SpreadsheetDao
