/* eslint-disable max-len */
// 外部との処理が責務
import {
  IBuymaV1,
  BuymaLoginRequest,
  PlayWright,
  BuymaUseCaseNo2ScrapData,
  OrderRecord,
  LatestProduct,
  BuymaUseCaseNo6ScrapData,
  ShopperSale,
  BuymaUseCaseNo7ScrapData,
} from '@/entities/BuymaV1'
import { chromium } from 'playwright'
import { BUYMA_URL, PLAN_COUNT } from '@/shared/code'
import { getCheck } from '@/shared/getCheck'

import logger from '@/shared/Logger'
import { schedule } from 'node-cron'
import axios, { AxiosRequestConfig, AxiosError } from 'axios'
import cheerio from 'cheerio'

export interface IBuymaV1Dao {
  buymaLogin: (
    buymaLoginRequest: BuymaLoginRequest
  ) => Promise<PlayWright | null>
  getUserName: (buymaLoginRequest: BuymaLoginRequest) => Promise<IBuymaV1[]>
  getTestPeriodicExecution: () => void
  modelingResearch(buymaURL: string): Promise<BuymaUseCaseNo2ScrapData>
  exhibitPlaceResearch(buymaURL: string): Promise<BuymaUseCaseNo6ScrapData[]>
  maintenance(
    loginCookie: string
  ): Promise<[BuymaUseCaseNo7ScrapData[], number]>
}

class BuymaV1Dao implements IBuymaV1Dao {
  public async chromiumNewPage(): Promise<PlayWright> {
    const browser = await chromium.launch({
      // headless: process.env.NODE_ENV !== 'development', // 開発モード以外はバックグラウンド実行
      headless: true,
      // headless: false,
      // slowMo: 50,
      // executablePath: '/usr/bin/google-chrome',
      // args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    const context = await browser.newContext()
    // Open new page
    const page = await context.newPage()
    return { browser, context, page }
  }

  public async browserClose(playWright: PlayWright): Promise<void> {
    await playWright.context.close()
    await playWright.browser.close()
  }

  public async scrapingTest(): Promise<PlayWright> {
    const { browser, context, page } = await this.chromiumNewPage()
    await page.goto('https://dummy-table-app-m74hgheam-htlsne.vercel.app/')
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const content = await page.evaluate(() => {
        const table = document.querySelector(
          '.MuiTableBody-root'
        ) as HTMLTableElement
        return Array.from(table.rows).map((row) => row.cells[0].textContent)
      })
      console.log(content)

      if (await page.isDisabled('[aria-label="Next Page"]')) {
        break
      }
      await page.click('[aria-label="Next Page"]')
    }

    await context.close()
    await browser.close()
    return { browser, context, page }
  }

  public async buymaLogin(
    buymaLoginRequest: BuymaLoginRequest
  ): Promise<PlayWright> {
    const { browser, context, page } = await this.chromiumNewPage()

    // try {
    //   await page.goto(BUYMA_URL.LOGIN)
    //   logger.info('ログインページに遷移しました')
    //   await page.waitForTimeout(15000)
    //   // Click input[name="txtLoginId"]
    //   await page.click('input[name="txtLoginId"]')
    //   await page.waitForTimeout(15000)
    //   // Fill input[name="txtLoginId"]
    //   await page.fill('input[name="txtLoginId"]', buymaLoginRequest.email)
    //   logger.info('メアドを入力しました')
    //   await page.waitForTimeout(15000)
    //   // Click input[name="txtLoginPass"]
    //   await page.click('input[name="txtLoginPass"]')
    //   await page.waitForTimeout(15000)
    //   // Fill input[name="txtLoginPass"]
    //   await page.fill('input[name="txtLoginPass"]', buymaLoginRequest.password)
    //   logger.info('パスワードを入力しました')
    //   await page.waitForTimeout(15000)
    //   // Click input:has-text("ログイン")
    //   await Promise.all([
    //     page.click('input:has-text("ログイン")'),
    //     page.waitForNavigation(/*{ url: 'https://www.buyma.com/my/' }*/),
    //   ])
    // } catch (error) {
    //   logger.err(error)
    //   await page.screenshot({ path: 'buymaLogin.png' })
    // }
    // page.url() != BUYMA_URL.MY_PAGE
    //   ? logger.err('ログインに失敗しました')
    //   : logger.info('ログインに成功しました')
    await context.addCookies([
      {
        name: 'BUYMA_COOKIE',
        value: 'COOKIE_VALUE',
        url: 'https://www.buyma.com',
      },
    ])

    await page.goto(`https://www.buyma.com/my`)
    page.url() != BUYMA_URL.MY_PAGE
      ? logger.err('ログインに失敗しました')
      : logger.info('ログインに成功しました')
    return { browser, context, page }

    // 適宜ちゃんと画面遷移できているかと、タイムアウトの処理
  }

  public async getUserName(
    buymaLoginRequest: BuymaLoginRequest
  ): Promise<IBuymaV1[]> {
    let name: string | undefined
    const { browser, context, page } = await this.buymaLogin(buymaLoginRequest)

    logger.info('現在のページURL')
    logger.info(page.url())

    try {
      if (page.url() != BUYMA_URL.MY_PAGE) {
        return []
      }

      await page.waitForSelector('.user_name')
      const nameElement = await page.$('.user_name')
      name = await nameElement?.innerText()
    } catch (error) {
      logger.err(error)
      await page.screenshot({ path: 'getName.png' })
    }

    if (!name) {
      await page.screenshot({ path: 'getName.png' })
      this.browserClose({ browser, context, page })
      return []
    }

    context.clearCookies()
    this.browserClose({ browser, context, page })

    const buyma: IBuymaV1[] = [{ name }]
    return buyma
  }

  public getTestPeriodicExecution() {
    logger.info('getTestPeriodicExecution')
    let count = 0
    const job = schedule('*/1 * * * * *', () => {
      count++
      logger.info('XXXXXXXXX')
      logger.info('1秒ごとに実行' + count + '回目')
    })
    setTimeout(() => {
      logger.err(count + '回実行しました。定期実行を停止します。')
      job.stop()
    }, 6000)
  }
  // 事前ログイン
  async preLogin(
    buymaLoginCookie: string
  ): Promise<{ playWright: PlayWright; success: boolean }> {
    const { browser, context, page } = await this.chromiumNewPage()
    let success = false // ログイン成功
    await context.addCookies([
      {
        name: '_GEWZxdbe2H2bte4N',
        value: buymaLoginCookie,
        url: 'https://www.buyma.com',
      },
    ])

    await page.goto(`https://www.buyma.com/my`)
    if (page.url() != BUYMA_URL.MY_PAGE) {
      logger.err('ログインに失敗しました')
      success = false
    } else {
      logger.info('ログインに成功しました')
      success = true
    }

    return { playWright: { browser, context, page }, success: success }
  }

  // No.2 モデリングリサーチ
  public async modelingResearch(
    buymaURL: string
  ): Promise<BuymaUseCaseNo2ScrapData> {
    const scrapData: BuymaUseCaseNo2ScrapData = {
      orderRecordList: [],
      latestProductList: [],
      orderRecordFailureCount: 0,
      latestProductFailureCount: 0,
    }

    // 取得する月数前の日付取得
    const now = new Date()
    const dateThreeMonthsAgo = now.setMonth(
      now.getMonth() - PLAN_COUNT.BASIC.NO2.MONTH_COUNT
    )

    const orderRecordPage = await this.chromiumNewPage()
    const latestProductPage = await this.chromiumNewPage()

    const getorderRecordList = async () => {
      // 注文実績取得
      const { context, page } = orderRecordPage

      context.setDefaultTimeout(0)
      page.setDefaultTimeout(0)

      logger.info('バイマページに遷移')

      await Promise.all([
        page.goto(buymaURL),
        page.waitForSelector('a:has-text("注文実績")'),
      ])

      logger.info('注文実績一覧ページ遷移に遷移')

      await Promise.all([
        await page.click('a:has-text("注文実績")'),
        page.waitForSelector('#buyeritemtable_wrap'),
      ])

      // 最後ページの数を取得
      const paging = await page.$(
        '#buyeritemtable_wrap > div.pager > div > a:last-child'
      )
      const lastPageURL = await paging?.getAttribute('href')
      const mach = lastPageURL?.match(/sales_(\d+).html/)
      const maxPageStr = mach ? mach[1] : '0'
      const maxPageNum = Number(maxPageStr)

      page_loop: for (let pageNum = 1; pageNum <= maxPageNum; pageNum++) {
        const items = await page.$$('#buyeritemtable > .buyeritemtable_body')

        for (let i = 0; i < items.length; i++) {
          const orderRecord: OrderRecord = {
            // トップページで取得
            productTitle: '', // 商品タイトル
            productURL: '', // 商品URL
            listingDate: '', // 出品日
            contractDate: '', // 成約日
            // 詳細ページで取得
            productName: '', // 商品名
            brandName: '', // ブランド名
            largeCategory: '', // 大カテゴリ
            mediumCategory: '', // 中カテゴリ
          }

          // 成約日が３か月以上前かどうか
          let threeMonthsAgoFlag = false

          // 商品タイトル取得
          const getProductTitle = async () => {
            const name = await items[i].$(
              'ul > li.buyeritemtable_info > p.buyeritem_name'
            )
            const nameText = await name?.innerText()
            orderRecord.productTitle = getCheck(nameText)
          }

          // 商品リンク取得
          const getProductURL = async () => {
            const product = await items[i].$('ul > li.buyeritemtable_img > a')
            const productURL = await product?.getAttribute('href')
            orderRecord.productURL = productURL
              ? `https://www.buyma.com${productURL}`
              : '取得できませんでした。'
          }

          // 成約日
          const getContractDate = async () => {
            const contractDateElem = await items[i].$(
              'ul > li.buyeritemtable_info >  p:last-child'
            )
            if (contractDateElem !== null) {
              const contractDateElemText = await contractDateElem.innerText()
              const contractDateText = contractDateElemText.slice(4)
              const contractDate = new Date(contractDateText)
              orderRecord.contractDate = getCheck(contractDateText)
              // 成約日が現在時刻から直近3か月であるが判定
              if (dateThreeMonthsAgo > contractDate.getTime()) {
                threeMonthsAgoFlag = true
              }
            }
          }

          // 出品日
          const getListingDate = async () => {
            const thumbnail = await items[i].$('img')
            const thumbnailURL = await thumbnail?.getAttribute('src')
            const listingDateMatch = thumbnailURL?.match(
              /.*\/(\d{2})(\d{2})(\d{2})\/.*/
            )
            const listingDateText = '20' + listingDateMatch?.slice(1).join('/')
            orderRecord.listingDate = getCheck(listingDateText)
          }

          await Promise.all([
            getProductTitle(),
            getProductURL(),
            getListingDate(),
            getContractDate(),
          ])

          // 成約日が現在時刻から直近3か月でない場合は取得終了
          if (threeMonthsAgoFlag) break page_loop

          scrapData.orderRecordList.push(orderRecord)
        }
        await Promise.all([
          await page.click('text=次の30件へ'),
          page.waitForSelector('#buyeritemtable_wrap'),
        ])
        logger.info('注文実績一覧' + pageNum + 'ページ目取得完了')
      }
      logger.info('注文実績一覧ページ取得完了')
    }

    const getLatestProductList = async () => {
      // 最新商品ページ取得

      const { context, page } = latestProductPage

      context.setDefaultTimeout(0)
      page.setDefaultTimeout(0)

      logger.info('バイマページに遷移')

      await Promise.all([
        page.goto(buymaURL),
        page.waitForSelector('a:has-text("最新商品")'),
      ])

      logger.info('最新商品一覧ページ遷移に遷移')

      await Promise.all([
        await page.click('a:has-text("最新商品")'),
        page.waitForSelector('#buyeritemtable_wrap'),
      ])

      // 最後ページの数を取得
      const paging = await page.$(
        '#buyeritemtable_wrap > div.pager > div > a:last-child'
      )
      const lastPageURL = await paging?.getAttribute('href')
      const mach = lastPageURL?.match(/item_(\d+).html/)
      const maxPageStr = mach ? mach[1] : '0'
      const maxPageNum = Number(maxPageStr)

      // const maxPageNum =  2 // とりあえず２ページ取得
      page_loop: for (let pageNum = 1; pageNum < maxPageNum; pageNum++) {
        const items = await page.$$('#buyeritemtable > .buyeritemtable_body')

        for (let i = 0; i < items.length; i++) {
          const latestProduct: LatestProduct = {
            // トップページで取得
            productName: '', // 商品名
            productURL: '', // 商品URL
            listingDate: '', // 出品日
            // 詳細ページで取得
            brandName: '', // ブランド名
            largeCategory: '', // 大カテゴリ
            mediumCategory: '', // 中カテゴリ
          }

          // 出品日が３か月以上前かどうか
          let threeMonthsAgoFlag = false

          // 商品タイトル取得
          const getproductName = async () => {
            const name = await items[i].$(
              'ul > li.buyeritemtable_info > p.buyeritem_name'
            )
            const nameText = await name?.innerText()
            latestProduct.productName = getCheck(nameText)
          }
          // 商品リンク取得
          const getProductURL = async () => {
            const product = await items[i].$('ul > li.buyeritemtable_img > a')
            const productURL = await product?.getAttribute('href')
            latestProduct.productURL = productURL
              ? `https://www.buyma.com${productURL}`
              : '取得できませんでした。'
          }

          // 出品日
          const getListingDate = async () => {
            const thumbnail = await items[i].$('img')
            const thumbnailURL = await thumbnail?.getAttribute('src')
            const listingDateMatch = thumbnailURL?.match(
              /.*\/(\d{2})(\d{2})(\d{2})\/.*/
            )
            const listingDateText = '20' + listingDateMatch?.slice(1).join('/')
            latestProduct.listingDate = getCheck(listingDateText)
            const listingDate = new Date(listingDateText)
            if (dateThreeMonthsAgo > listingDate.getTime()) {
              threeMonthsAgoFlag = true
            }
          }

          await Promise.all([
            getproductName(),
            getProductURL(),
            getListingDate(),
          ])

          // 出品日が現在時刻から直近3か月でない場合は取得終了
          if (threeMonthsAgoFlag) break page_loop

          scrapData.latestProductList.push(latestProduct)
        }
        await Promise.all([
          await page.click('text=次の30件へ'),
          page.waitForSelector('#buyeritemtable_wrap'),
        ])
        logger.info('最新商品一覧' + pageNum + 'ページ目取得完了')
      }
      logger.info('最新商品一覧ページ取得完了')
    }

    await Promise.all([
      getorderRecordList().catch((error) => {
        logger.err('注文実績一覧ページ取得でエラー')
        logger.err(error)
        this.browserClose(orderRecordPage)
        this.browserClose(latestProductPage)
        return scrapData
      }),
      getLatestProductList().catch((error) => {
        logger.err('最新商品ページ取得でエラー')
        logger.err(error)
        this.browserClose(orderRecordPage)
        this.browserClose(latestProductPage)
        return scrapData
      }),
    ])

    const getDetails = async (
      data: OrderRecord[] | LatestProduct[]
    ): Promise<number> => {
      let failureCount = 0

      // 詳細ページから取得
      for (let i = 0; i < data.length; i++) {
        const options: AxiosRequestConfig = {
          url: data[i].productURL,
          method: 'GET',
        }
        const response = await axios(options).catch(
          (error: AxiosError<{ error: string }>) => {
            // エラー処理
            logger.warn(error.message)
          }
        )

        if (!response) {
          logger.warn('詳細情報を取得失敗' + (i + 1) + '件目')
          failureCount += 1
          continue
        }
        if (typeof response.data !== 'string') {
          logger.warn('詳細情報を取得失敗' + (i + 1) + '件目')
          failureCount += 1
          continue
        }
        const cheerioBody = cheerio.load(response.data)

        // 商品名
        const getProductName = () => {
          const productName = cheerioBody('#item_h1 > span')
          const productNameText = cheerioBody(productName).text()
          data[i].productName = getCheck(productNameText)
        }

        // ブランド
        const getBrandName = () => {
          const brandName = cheerioBody('#s_brand > dd > a')
          const brandNameText = cheerioBody(brandName).text()
          data[i].brandName = getCheck(brandNameText)
        }

        // 大カテゴリ
        const getLargeCategory = () => {
          const largeCategory = cheerioBody('#s_cate > dd > a:nth-child(1)')
          const largeCategoryText = cheerioBody(largeCategory).text()
          data[i].largeCategory = getCheck(largeCategoryText)
        }

        // 中カテゴリ
        const getMediumCategory = () => {
          const mediumCategory = cheerioBody('#s_cate > dd > a:nth-child(2)')
          const mediumCategoryText = cheerioBody(mediumCategory).text()
          data[i].mediumCategory = getCheck(mediumCategoryText)
        }

        getProductName()
        getBrandName()
        getLargeCategory()
        getMediumCategory()

        logger.info(
          '詳細情報を取得完了' + (i + 1) + '件目 URL:' + data[i].productURL
        )
      }

      logger.info('詳細ページ取得完了')
      return failureCount
    }

    try {
      // https://qiita.com/gounx2/items/18602a4081d0aaffe852
      await Promise.all([
        getDetails(scrapData.orderRecordList).catch((e) => {
          throw '詳細ページ取得でエラー ' + e.message
        }),
        getDetails(scrapData.latestProductList).catch((e) => {
          throw '詳細ページ取得でエラー ' + e.message
        }),
      ]).then((values) => {
        scrapData.orderRecordFailureCount = values[0]
        scrapData.latestProductFailureCount = values[1]
      })
    } catch (err) {
      logger.err('XXXXXXXXXXX' + err)

      return scrapData // １つでもエラーになったら、関数を抜ける
    }
    // ブラウザクローズ
    this.browserClose(orderRecordPage)
    this.browserClose(latestProductPage)

    return scrapData
  }

  public async exhibitPlaceResearch(
    buymaURL: string
  ): Promise<BuymaUseCaseNo6ScrapData[]> {
    const responseList: BuymaUseCaseNo6ScrapData[] = []

    const indexPage = await this.chromiumNewPage()

    try {
      const { context, page } = indexPage

      context.setDefaultTimeout(0)
      page.setDefaultTimeout(0)

      logger.info('バイマページに遷移')

      await Promise.all([
        page.goto(buymaURL),
        page.waitForSelector('#n_ResultList'),
      ])
      // await page.goto(buymaURL)
      // await page.waitForSelector('#n_ResultList')
      const items = await page.$$('#n_ResultList > ul > li')
      // ここでは数のみ取得

      if (!items) {
        logger.err('アイテムリストを取得できませんでした')
        logger.err(items)
        return []
      }
      const itemCount = PLAN_COUNT.BASIC.NO6.ITEM_COUNT
      // 40件以上ある場合、40件、それ以下の場合はitemsの長さ
      const getLength = items.length > itemCount ? itemCount : items.length

      for (let i = 0; i < getLength; i++) {
        const response: BuymaUseCaseNo6ScrapData = {
          productName: '',
          thumbnailURL: '',
          titleURL: '',
          price: '',
          seller1: '',
          listingDate: '',
          acCount: '',
          favCount: '',
          inquiriesCount: '',
          brandName: '',
          brandTypeNo: '',
          shopperName: '',
          shopperLink: '',
          largeCategory: '',
          smallCategory: '',
          season: '',
          landOfPurchase: '',
          // ショッパーセールス
          shopperSales: [],
        }

        await page.waitForSelector('#n_ResultList')
        // 商品名取得

        const getName = async () => {
          const name = await items[i].$('.product_name')
          const nameText = await name?.innerText()
          response.productName = getCheck(nameText)
        }
        // サムネイル
        const getThumbnail = async () => {
          const thumbnail = await items[i].$('img')
          const thumbnailURL = await thumbnail?.getAttribute('src')
          response.thumbnailURL = getCheck(thumbnailURL)
        }

        // タイトルリンク
        const getTitleURL = async () => {
          const title = await items[i].$('.product_name a')
          const titleURL = await title?.getAttribute('href')
          response.titleURL = titleURL
            ? `https://www.buyma.com${titleURL}`
            : '取得できませんでした。'
        }

        // 価格
        const getPrice = async () => {
          const price = await items[i].$('.Price_Txt')
          const priceText = await price?.innerText()

          response.price = priceText
            ? priceText.replace(/,|¥/g, '')
            : '取得できませんでした。'
        }

        // ショッパー名_リンク
        const getShopperLink = async () => {
          const shopperLink = await items[i].$('.product_Buyer a')
          const shopperURL = await shopperLink?.getAttribute('href')

          response.shopperLink = shopperURL
            ? `https://www.buyma.com${shopperURL.replace(
                '.html',
                ''
              )}/sales_1.html`
            : '取得できませんでした。'
        }

        await Promise.all([
          getName(),
          getThumbnail(),
          getTitleURL(),
          getPrice(),
          getShopperLink(),
        ])

        responseList.push(response)
      }
      logger.info('一覧ページ取得完了')
    } catch (error) {
      logger.err('一覧ページ取得でエラー')
      logger.err(error)
      this.browserClose(indexPage)
      return []
    }

    const getDetails = async () => {
      const { context, page } = indexPage

      context.setDefaultTimeout(0)
      // page.setDefaultNavigationTimeout(0)
      page.setDefaultTimeout(0)

      // 詳細ページから取得
      for (let i = 0; i < responseList.length; i++) {
        // await page.goto(responseList[i].titleURL)
        // await page.waitForSelector('.side_buyer_link')

        await Promise.all([
          page.goto(responseList[i].titleURL),
          page.waitForSelector('.side_buyer_link'),
        ])

        // 出品者1
        const getSeller = async () => {
          const seller1 = await page.$('.side_buyer_link')
          const seller1Text = await seller1?.innerText()

          responseList[i].seller1 = getCheck(seller1Text)

          // ショッパー名
          const shopperName = seller1Text
          responseList[i].shopperName = getCheck(shopperName)
        }

        // 出品日
        const getListingDate = () => {
          const listingDateText = responseList[i]?.thumbnailURL
            .replace(
              'https://static-buyma-com.akamaized.net/imgdata/item/',
              '20'
            )
            .slice(0, 8) // TODO エラー処理
          responseList[i].listingDate = getCheck(listingDateText)
        }

        // アクセス数
        const getAcCount = async () => {
          const acCount = await page.$('.ac_count')
          const acCountText = await acCount?.innerText()
          responseList[i].acCount = getCheck(acCountText)
        }

        // ほしいもの登録数
        const getFavCount = async () => {
          const favCount = await page.$('.fav_count')
          const favCountText = await favCount?.innerText()
          responseList[i].favCount = favCountText
            ? favCountText.replace('人', '')
            : '取得できませんでした。'
        }

        // お問い合わせ数
        const getInquiriesCount = async () => {
          const inquiriesCount = await page.$('#tabmenu_inqcnt')
          const inquiriesCountText = await inquiriesCount?.innerText()
          responseList[i].inquiriesCount = getCheck(inquiriesCountText)
        }

        // ブランド
        const getBrandName = async () => {
          const brandName = await page.$('#s_brand > dd > a')
          const brandNameText = await brandName?.innerText()
          responseList[i].brandName = getCheck(brandNameText)
        }

        // ブランド型番
        const getBrandTypeNo = async () => {
          const brandTypeNo = await page.$('#s_season span')
          const brandTypeNoText = brandTypeNo
            ? await brandTypeNo?.innerText()
            : '型番なし'
          responseList[i].brandTypeNo = getCheck(brandTypeNoText)
        }

        // 大カテゴリ
        const getLargeCategory = async () => {
          const largeCategory = await page.$('#s_cate > dd > a:nth-child(1)')
          const largeCategoryText = await largeCategory?.innerText()
          responseList[i].largeCategory = getCheck(largeCategoryText)
        }

        // 小カテゴリ
        const getSmallCategory = async () => {
          const smallCategory = await page.$('#s_cate > dd > a:nth-child(3)')
          const smallCategoryText = await smallCategory?.innerText()
          responseList[i].smallCategory = getCheck(smallCategoryText)
        }

        // シーズン
        const getSeason = async () => {
          const season = await page.$('#s_season > dd > a')
          const seasonText = season ? await season?.innerText() : 'シーズンなし'
          responseList[i].season = getCheck(seasonText)
        }

        // 買付地
        const getLandOfPurchase = async () => {
          const landOfPurchase = await page.$('#s_buying_area > dd > a')
          const landOfPurchaseText = await landOfPurchase?.innerText()
          responseList[i].landOfPurchase = getCheck(landOfPurchaseText)
        }

        await Promise.all([
          getSeller(),
          getListingDate(),
          getAcCount(),
          getFavCount(),
          getInquiriesCount(),
          getBrandName(),
          getBrandTypeNo(),
          getLargeCategory(),
          getSmallCategory(),
          getSeason(),
          getLandOfPurchase(),
        ])

        logger.info('詳細情報を取得完了' + (i + 1) + '件目')
      }

      logger.info('詳細ページ取得完了')
    }

    const shopperPage = await this.chromiumNewPage()

    const getShoppers = async () => {
      const { context, page } = shopperPage

      context.setDefaultTimeout(0)
      // page.setDefaultNavigationTimeout(0)
      page.setDefaultTimeout(0)
      // ショッパーページから30件取得
      for (let i = 0; i < responseList.length; i++) {
        const shopperLink = responseList[i]?.shopperLink
        if (!shopperLink) {
          responseList[i].shopperSales = []
          continue
        }

        await Promise.all([
          page.goto(shopperLink),
          page.waitForSelector('#buyeritemtable'),
        ])

        // await page.goto(shopperLink)
        // // ショッパーセールスページ
        // await page.waitForSelector('#buyeritemtable')

        const shopperSales: ShopperSale[] = []

        // #buyeritemtable > div:nth-child(1)
        const sales = await page.$$('#buyeritemtable > div')

        if (!sales) {
          logger.err('セールスリストを取得できませんでした')
          logger.err(sales)
        }

        const orderCount = PLAN_COUNT.BASIC.NO6.ORDER_RECORD

        const getOrderRecordLength =
          sales.length > orderCount ? orderCount : sales.length

        for (let index = 0; index < getOrderRecordLength; index++) {
          let titleText = ''
          let ordersCountText = ''
          let contractDateText = ''

          const tableInfo = await sales[index]?.$$(`.buyeritemtable_info > p`)
          if (tableInfo) {
            const info = await Promise.all([
              tableInfo[0]?.innerText(), // タイトル
              tableInfo[1]?.innerText(), // 注文数
              tableInfo[2]?.innerText(), // 成約日
            ])
            titleText = info[0] // タイトル
            ordersCountText = info[1] // 注文数
            contractDateText = info[2] // 成約日
          } else {
            logger.err('tableInfoを取得できませんでした')
            logger.err(tableInfo)
          }

          // サムネイル取得
          const thumbnail = await sales[index]?.$(`.buyeritemtable_img img`)
          const thumbnailURLText = await thumbnail?.getAttribute('src')

          shopperSales.push({
            title: titleText || '取得できませんでした。',
            thumbnailURL: thumbnailURLText || '取得できませんでした。',
            ordersCount:
              ordersCountText.replace(/注文数：|個/g, '') ||
              '取得できませんでした。',
            contractDate:
              contractDateText.replace('成約日：', '') ||
              '取得できませんでした。',
          })
        }

        responseList[i].shopperSales = shopperSales
        logger.info('セールスリスト情報を取得完了' + (i + 1) + '件目')
      }

      logger.info('ショッパーページ取得完了')
    }

    try {
      // https://qiita.com/gounx2/items/18602a4081d0aaffe852
      await Promise.all([
        getDetails().catch((e) => {
          this.browserClose(indexPage)
          this.browserClose(shopperPage)
          throw '詳細ページ取得でエラー ' + e.message
        }),
        getShoppers().catch((e) => {
          this.browserClose(indexPage)
          this.browserClose(shopperPage)
          throw 'ショッパーページ取得でエラー ' + e.message
        }),
      ])
    } catch (err) {
      logger.err('XXXXXXXXXXX' + err)
      // this.browserClose(indexPage)
      // this.browserClose(shopperPage)
      return [] // １つでもエラーになったら、関数を抜ける
    }
    // ブラウザクローズ
    this.browserClose(indexPage)
    this.browserClose(shopperPage)

    return responseList
  }
  // No.7 メンテナンス
  public async maintenance(
    loginCookie: string
  ): Promise<[BuymaUseCaseNo7ScrapData[], number]> {
    const scrapDataList: BuymaUseCaseNo7ScrapData[] = [] // スクレイピングで取得したデータ
    const itemCountLimit = PLAN_COUNT.BASIC.NO7.ITEM_COUNT // 取得数の制限
    let failureCount = 0 // 取得失敗数
    if (!itemCountLimit) {
      logger.err('NO7の取得数の制限を設定してください。')
      return [scrapDataList, failureCount]
    }
    let itemCount = 0 // 実際取得した数
    let pageCount = 0 // 取得したページ数

    // 事前ログイン
    const {
      playWright: { browser, context, page },
      success: success,
    } = await this.preLogin(loginCookie)

    if (!success) {
      // ログイン失敗時は後続の処理はしない
      return [scrapDataList, failureCount]
    }
    context.setDefaultTimeout(0)
    page.setDefaultTimeout(0)
    try {
      // マイページ出品リストに遷移
      await Promise.all([
        page.goto('https://www.buyma.com/my/sell/?status=for_sale&tab=b#/'),
        page.waitForSelector('#inputform'),
      ])
      // 取得数
      page_loop: while (itemCount < itemCountLimit) {
        const items = await page.$$('#inputform > table > tbody > tr')
        let lastPageFlag = false
        let count = 0

        for (let i = 0; i < items.length; i++) {
          // データ取得に関係ないテーブルの列を飛ばす
          if (i % 2 === 0) continue
          const scrapData: BuymaUseCaseNo7ScrapData = {
            // トップページで取得
            productName: '', // 商品名
            productURL: '', // 商品URL
            listingDate: '', // 出品日
            price: '', // 価格
            brandName: '', // ブランド名
            purchaseDeadline: '', // 購入期限
            acCount: '', // アクセス数
            favCount: '', // ほしいもの登録数
            inquiriesCount: '', // お問い合わせ数
            scrapTime: '', // スクレイピング時間
          }

          // 商品名
          const getProductName = async () => {
            const name = await items[i].$('td.item_name > p:nth-child(1) > a')
            const nameText = await name?.innerText()
            scrapData.productName = getCheck(nameText)
          }

          // 商品リンク取得
          const getProductURL = async () => {
            const productURL = await items[i].$('td.LineHeight_1 > a')
            const productURLHref = await productURL?.getAttribute('href')
            const productURLText = productURLHref
              ? `https://www.buyma.com${productURLHref}`
              : '取得できませんでした。'
            scrapData.productURL = productURLText
          }

          // 出品日
          const getListingDate = async () => {
            const listingDate = await items[i].$('td:nth-child(9) > span')
            const listingDateText = await listingDate?.innerText()
            scrapData.listingDate = getCheck(listingDateText)
          }

          // 価格
          const getPrice = async () => {
            const price = await items[i].$('td:nth-child(8) > div > span')
            const priceText = await price?.innerText()
            scrapData.price = getCheck(priceText)
          }

          // 購入期限
          const getPurchaseDeadline = async () => {
            const purchaseDeadline = await items[i].$(
              'td:nth-child(10) > div > span'
            )
            const purchaseDeadlineText = await purchaseDeadline?.innerText()
            scrapData.purchaseDeadline = getCheck(purchaseDeadlineText)
          }

          // ほしいもの登録数
          const getFavCount = async () => {
            const favCount = await items[i].$('td:nth-child(12) > span')
            const favCountText = await favCount?.innerText()
            scrapData.favCount = getCheck(favCountText)
          }

          // アクセス数
          const getAcCount = async () => {
            const acCount = await items[i].$('td:nth-child(13) > span')
            const acCountText = await acCount?.innerText()
            scrapData.acCount = getCheck(acCountText)
          }

          await Promise.all([
            getProductName(),
            getProductURL(),
            getListingDate(),
            getPrice(),
            getPurchaseDeadline(),
            getAcCount(),
            getFavCount(),
          ])

          scrapDataList.push(scrapData)
          itemCount += 1
          // 取得数が取得制限を超えたら取得終了
          if (itemCount >= itemCountLimit) break page_loop
          // 20件取得後はデータ取得に関係ないテーブルの列を飛ばす
          count += 1
          if (count >= 20) break
        }
        pageCount += 1
        logger.info('商品リスト' + pageCount + 'ページ目取得完了')

        // 次のページへ遷移
        await page
          .click('text=次へ', {
            timeout: 10 * 1000,
          })
          .catch(() => {
            lastPageFlag = true
          })
        // 最後のページであれば取得完了
        if (lastPageFlag) {
          logger.info('商品リスト取得完了')
          break
        }
      }
    } catch (error) {
      logger.err(error)
      logger.err('商品リスト取得失敗')
    }
    // ブラウザをクローズ
    this.browserClose({ browser, context, page })

    try {
      // 詳細ページから取得
      for (let i = 0; i < scrapDataList.length; i++) {
        const options: AxiosRequestConfig = {
          url: scrapDataList[i].productURL,
          method: 'GET',
        }
        const response = await axios(options).catch(
          (error: AxiosError<{ error: string }>) => {
            // エラー処理
            logger.warn(error.message)
          }
        )

        if (!response) {
          logger.warn('詳細情報を取得失敗' + (i + 1) + '件目')
          failureCount += 1
          continue
        }
        if (typeof response.data !== 'string') {
          logger.warn('詳細情報を取得失敗' + (i + 1) + '件目')
          failureCount += 1
          continue
        }
        const cheerioBody = cheerio.load(response.data)

        // ブランド
        const getBrandName = () => {
          const brandName = cheerioBody('#s_brand > dd > a')
          const brandNameText = cheerioBody(brandName).text().trim()
          scrapDataList[i].brandName = getCheck(brandNameText)
        }

        // お問い合わせ数
        const getInquiriesCount = () => {
          const inquiriesCount = cheerioBody('#tabmenu_inqcnt')
          const inquiriesCountText = cheerioBody(inquiriesCount).text().trim()
          scrapDataList[i].inquiriesCount = getCheck(inquiriesCountText)
        }

        // スクレイピング時間
        const getScrapTime = () => {
          const now = new Date()
          const year = now.getFullYear()
          const month = ('00' + (now.getMonth() + 1)).slice(-2)
          const date = ('00' + now.getDate()).slice(-2)
          const hour = ('00' + now.getHours()).slice(-2)
          const minutes = ('00' + now.getMinutes()).slice(-2)
          const time = ('00' + now.getSeconds()).slice(-2)

          scrapDataList[
            i
          ].scrapTime = `${year}/${month}/${date} ${hour}:${minutes}:${time}`
        }

        getBrandName()
        getInquiriesCount()
        getScrapTime()

        logger.info(
          '詳細情報を取得完了' +
            (i + 1) +
            '件目 URL:' +
            scrapDataList[i].productURL
        )
      }

      logger.info('詳細ページ取得完了')
    } catch (error) {
      logger.err(error)
      logger.info('詳細ページ取得失敗')
    }

    return [scrapDataList, failureCount]
  }
}

export default BuymaV1Dao
