/* eslint-disable max-len */
// 外部との処理が責務
import { PlayWright } from '@/entities/BuymaV1'
import { chromium } from 'playwright'

import fs from 'fs'

import logger from '@/shared/Logger'
import json2csv, { FieldInfo } from 'json2csv'

export interface ILstepV1Dao {
  lStepLogin: () => Promise<PlayWright>
}

class LstepV1Dao implements ILstepV1Dao {
  public async chromiumNewPage(): Promise<PlayWright> {
    const browser = await chromium.launch({
      // headless: process.env.NODE_ENV !== 'development', // 開発モード以外はバックグラウンド実行
      // headless: true,
      headless: false,
      slowMo: 2000,
      // executablePath: '/usr/bin/google-chrome',
      // args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    const context = await browser.newContext({ acceptDownloads: true })

    // Open new page
    const page = await context.newPage()
    return { browser, context, page }
  }

  public async browserClose(playWright: PlayWright): Promise<void> {
    await playWright.context.close()
    await playWright.browser.close()
  }

  public async lStepLogin(): Promise<PlayWright> {
    const { browser, context, page } = await this.chromiumNewPage()
    page.setDefaultTimeout(0)

    // await context.addCookies([
    //   {
    //     name: 'laravel_session',
    //     value:
    //       'eyJpdiI6InI0T3Mzb0ZMYjFLamg5YldxV2Joa3c9PSIsInZhbHVlIjoiTjh5T3dJa0RDcXRQNWhXMlVxNEs0XC9XVGV4NVJ3cTV5TlpCT3ljdGlnQUhaejdKZzNjenBkSFRXYzBIV21rYkFrdmVta1ZmeXRjQ25ZWDdhendiZUlnPT0iLCJtYWMiOiI0NzcwNmZiNWI3ZGFiZDE0NWRmYWZhM2U4OTdkMWEwZDE3YjI1OTNiY2ExNDNkNjUzNzMzMGJhZjgyZDNlMTFhIn0%3D%3D%3D',
    //     url: 'https://manager.linestep.net/account',
    //   },
    // ])

    await page.goto('https://manager.linestep.net/account/login')
    // Click [placeholder="yourname"]
    await page.click('[placeholder="yourname"]')
    // Fill [placeholder="yourname"]
    await page.fill('[placeholder="yourname"]', 'seiya1025198')

    // Press a with modifiers
    await page.press('[placeholder="パスワード"]', 'Meta+a')
    // Fill [placeholder="パスワード"]
    await page.fill('[placeholder="パスワード"]', 'seiya1025lstep')

    await page.waitForURL('https://manager.linestep.net/')

    await page.goto(`https://manager.linestep.net/line/show`)

    // page.url() != `https://manager.linestep.net/line/show`
    //   ? logger.err('ログインに失敗しました')
    //   : logger.info('ログインに成功しました')

    return { browser, context, page }
  }

  public async lstepCSV() {
    // const productName = 'ドライヤー'
    // const searchProductName = [
    //   'シャンプー',
    //   'シャンプー 美容室専売',
    //   'ドライヤー',
    //   'ヘアマスク',
    //   'スカルプ',
    //   'ワックス',
    //   'ヘアアイロン',
    //   '美顔ローラー',
    //   '髪 パサつき',
    //   '薄毛',
    //   '頭皮 オイリー',
    //   'ダメージヘア',
    // ]
    const searchProductName = [
      'シャンプー',
      'シャンプー　サロン専売品',
      'シャンプー　ハリツヤ',
      'シャンプー　ダメージ ',
      'シャンプー　パサつき',
      'シャンプー　抜け毛',
      'シャンプー　薄毛',
      'シャンプー　クセ毛',
      'シャンプー　さらさら髪',
      'シャンプー　うるおい',
      'トリートメント',
      'トリートメント　サロン専売品',
      'トリートメント　ハリツヤ',
      'トリートメント　ダメージ ',
      'トリートメント　パサつき',
      'トリートメント　抜け毛',
      'トリートメント　薄毛',
      'トリートメント　クセ毛',
      'トリートメント　さらさら髪',
      'トリートメント　うるおい      ',
    ]

    const { browser, context, page } = await this.chromiumNewPage()

    interface Table {
      index: string
      keyWord: string
      name: string
      imageURL: string
      pageURL: string
      amount: string
    }

    const csvTable: Table[] = []

    for (let index = 0; index < searchProductName.length; index++) {
      await page.goto(
        `https://search.rakuten.co.jp/search/mall/${searchProductName[index]}`
      )
      console.log(searchProductName[index] + 'の結果を集計中')

      const items = await page.$$('.searchresultitem')

      for (let i = 0; i < 8; i++) {
        // 商品名
        const name = await items[i].$('div.content.title')
        const nameText = await name?.innerText()

        // 商品URL
        const imageURL = await items[i].$('div.image > a > img')
        const imageURLText = await imageURL?.getAttribute('src')

        // 商品ページURL
        const pageURL = await items[i].$('div.image > a')
        const pageURLText = await pageURL?.getAttribute('href')

        // 値段
        const amount = await items[i].$('.important')
        const amountText = await amount?.innerText()

        csvTable.push({
          index: i + 1 + '番目',
          keyWord: searchProductName[index],
          name: nameText || '',
          imageURL: imageURLText || '',
          pageURL: pageURLText || '',
          amount: amountText || '',
        })
      }
    }

    // await page.waitForSelector('text=CSV操作')
    // const csvBtn = await page.$('text=CSV操作')
    // if (!csvBtn) {
    //   logger.err('csvBtn')
    //   return
    // }
    // await csvBtn.click()

    // await page.waitForSelector('#csv_export_mover')
    // const csvExBtn = await page.$('#csv_export_mover')

    // if (!csvExBtn) {
    //   logger.err('csvExBtn')
    //   return
    // }
    // await csvExBtn.click()

    // await page.waitForSelector('.btn-primary')
    // const csvFavBtn = await page.$$('.btn-primary')

    // if (!csvFavBtn[0]) {
    //   logger.err('csvFavBtn')
    //   return
    // }
    // await csvFavBtn[0].click()

    // await page.waitForSelector('text=表示項目をコピーして利用')
    // const btn = await page.$$('text=表示項目をコピーして利用')
    // await btn[0].click()

    // // await page.goto(
    // //   `https://manager.linestep.net/line/exporter/zxIpxhVmAqNUZUia/register?csv_id=405650`
    // // )

    // const [download] = await Promise.all([
    //   page.waitForEvent('download'),
    //   page.click('text=この条件でダウンロード'),
    // ])
    // // const path = await download.path()
    // // logger.info('path')
    // // logger.info(path)

    // await download.saveAs('test.csv')
    // // wait for the download and delete the temporary file
    // await download.delete()
    // const csv = json2csv.parse(csvTable, options)
    const csv = json2csv.parse(csvTable)
    // fs.writeFileSync(`${productName}.csv`, csv)
    fs.writeFileSync(`楽天リサーチ.csv`, csv)
    // const json_text = JSON.stringify(csvTable)
    // fs.writeFileSync('get-nyny-user-info.json', json_text)
    browser.close()
    // // logger.info(await download.createReadStream())
    // // logger.info(download.page())
    // // //
    // // if (!path) return
    // // const src = fs.createReadStream(path, 'utf8')
    // // logger.info(src)

    return
  }
}

export default LstepV1Dao
