import { Page, Browser, BrowserContext } from 'playwright'

export interface PlayWright {
  browser: Browser
  context: BrowserContext
  page: Page
}

export interface BuymaLoginRequest {
  email: string
  password: string
}

export interface IBuymaV1 {
  name: string
}

// No2

export interface BuymaUseCaseNo2ScrapData {
  orderRecordList: OrderRecord[] // 注文実績
  latestProductList: LatestProduct[] // 最新商品
  orderRecordFailureCount: number // 注文実績失敗回数
  latestProductFailureCount: number // 最新商品失敗回数
}

// 注文実績
export interface OrderRecord {
  // トップページで取得
  productTitle: string // 商品タイトル
  productURL: string // 商品URL
  listingDate: string // 出品日
  contractDate: string // 成約日

  // 詳細ページで取得
  productName: string // 商品名
  brandName: string // ブランド名
  largeCategory: string // 大カテゴリ
  mediumCategory: string // 中カテゴリ
}

// 最新商品
export interface LatestProduct {
  // トップページで取得
  productName: string // 商品名
  productURL: string // 商品URL
  listingDate: string // 出品日

  // 詳細ページで取得
  brandName: string // ブランド名
  largeCategory: string // 大カテゴリ
  mediumCategory: string // 中カテゴリ
}

export interface RequestBodyBuymaUseCaseNo2 {
  buymaURL: string
  toEmail: string
}

export interface No2Row {
  url: number
  tops: number
  pantsBottoms: number
  dressesAllInOnes: number
  outerwearJackets: number
  shoesFootwear: number
  boots: number
  bagsBriefcases: number
  walletsMiscellaneousGoods: number
  accessories: number
  fashionAccessories: number
  hats: number
  cellPhoneCases: number
  eyewear: number
  lifestyle: number
}
export interface No2Col {
  ladies: No2Row
  mens: No2Row
  total: No2Row
}
export interface No2Count {
  allListingCnt: No2Col
  lastThreeMonthsListingCnt: No2Col
  lastOneMonthsCnt: No2Col
  oneMonthToTwoMonthsBeforeCnt: No2Col
  twoMonthToThreeMonthsBeforeCnt: No2Col
  lastThreeMonthCnt: No2Col
}

// No6

export interface BuymaUseCaseNo6ScrapData {
  // トップページで取得
  productName: string // 商品名
  thumbnailURL: string // サムネタイトル
  titleURL: string // 商品URL
  price: string // 価格
  // 詳細ページで取得
  seller1: string // 出品者1
  listingDate: string // 出品日
  acCount: string // アクセス数
  favCount: string // お気に入り数
  inquiriesCount: string // お問い合わせ数
  brandName: string // ブランド名
  brandTypeNo: string // ブランド型番
  shopperName: string // ショッパー名
  shopperLink: string // ショッパーリンク
  largeCategory: string // 大カテゴリ
  smallCategory: string // 小カテゴリ
  season: string // シーズン
  landOfPurchase: string // 買い付け値
  // ショッパーセールス
  shopperSales: ShopperSale[]
}

// ショッパーセールス
export interface ShopperSale {
  title: string
  thumbnailURL: string
  contractDate: string
  ordersCount: string
}

export interface RequestBodyBuymaUseCaseNo6 {
  buymaURL: string
  toEmail: string
}

export interface RequestGasBuymaNo6Data {
  shopperName: string // ショッパー名
  shopperLink: string // ショッパーURL

  productName: string // タイトル
  titleURL: string // 商品URL
  thumbnailURL: string

  brandName: string // ブランド
  price: string // 価格
  brandTypeNo: string // 品番
  listingDate: string // 出品日
  landOfPurchase: string // 買付地
  inquiriesCount: string // お問い合わせ数
  acCount: string // アクセス数
  favCount: string // ほしいもの登録数
  largeCategory: string // 大カテゴリ
  smallCategory: string // 小カテゴリ
  season: string // シーズン
  soldCount: string // 直近販売30個の中で1ヶ月以内に売れた個数
  // soldCount: number // 直近販売30個の中で1ヶ月以内に売れた個数
}

// class BuymaV1aaa implements IBuymaV1 {
//   public id: number

//   constructor(idOrBuymaV1: number | IBuymaV1) {
//     if (typeof idOrBuymaV1 === 'number') {
//       this.id = idOrBuymaV1
//     } else {
//       this.id = idOrBuymaV1.id
//     }
//   }
// }

// export default BuymaV1

// No7

export interface RequestBodyBuymaUseCaseNo7 {
  loginCookie: string
  toEmail: string
}

export interface BuymaUseCaseNo7ScrapData {
  // トップページで取得
  productName: string // 商品名
  productURL: string // 商品URL
  listingDate: string // 出品日
  price: string // 価格
  brandName: string // ブランド名
  purchaseDeadline: string // 購入期限
  acCount: string // アクセス数
  favCount: string // ほしいもの登録数
  inquiriesCount: string // お問い合わせ数
  scrapTime: string // スクレイピング時間
}
