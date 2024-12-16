/* eslint-disable max-len */
// 外部との処理が責務
import { PlayWright } from '@/entities/BuymaV1'
import { chromium } from 'playwright'

import fs from 'fs'
import path from 'path'
import os from 'os'

import logger from '@/shared/Logger'
import dotenv from 'dotenv'
dotenv.config()

export interface ILstepV1Dao {
  lStepLogin: () => Promise<PlayWright>
}

class LstepV1Dao implements ILstepV1Dao {
  private readonly username: string
  private readonly password: string

  constructor() {
    const username = process.env.LSTEP_USERNAME
    const password = process.env.LSTEP_PASSWORD

    if (!username || !password) {
      throw new Error('Lステップのログイン情報が設定されていません。')
    }

    this.username = username
    this.password = password
  }

  public async chromiumNewPage(): Promise<PlayWright> {
    const browser = await chromium.launch({
      // headless: process.env.NODE_ENV !== 'development', // 開発モード以外はバックグラウンド実行
      // headless: true,
      headless: false,
      slowMo: 1000,
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
    // Click input name
    await page.click('#input_name')
    // Fill input name
    await page.fill('#input_name', this.username)

    // Fill password
    await page.fill('#input_password', this.password)

    await page.waitForURL('https://manager.linestep.net/')

    await page.goto(`https://manager.linestep.net/line/show`)

    // page.url() != `https://manager.linestep.net/line/show`
    //   ? logger.err('ログインに失敗しました')
    //   : logger.info('ログインに成功しました')

    return { browser, context, page }
  }

  public async lstepCSV() {
    const { browser, context, page } = await this.lStepLogin()

    await page.waitForSelector('text=CSV操作')
    const csvBtn = await page.$('text=CSV操作')
    if (!csvBtn) {
      logger.err('csvBtn')
      return
    }
    await csvBtn.click()

    await page.waitForSelector('#csv_export_mover')
    const csvExBtn = await page.$('#csv_export_mover')

    if (!csvExBtn) {
      logger.err('csvExBtn')
      return
    }
    await csvExBtn.click()

    await page.waitForSelector('.btn-primary')
    const csvFavBtn = await page.$$('.btn-primary')

    if (!csvFavBtn[0]) {
      logger.err('csvFavBtn')
      return
    }
    await csvFavBtn[0].click()

    await page.waitForSelector('text=表示項目・検索条件をコピーして利用')
    const btn = await page.$$('text=表示項目・検索条件をコピーして利用')
    await btn[0].click()

    // 今日の日付を取得してフォーマット
    const today = new Date()
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
    const fileName = `${dateStr}_lstep.csv`

    // name属性が"name"のinput要素に日付を入力
    await page.waitForSelector('input[name="name"]')
    await page.fill('input[name="name"]', `${dateStr}Lステップデータ`)

    // 「この条件でダウンロード」ボタンをクリック
    await page.waitForSelector('text=この条件でダウンロード')
    const downloadConditionBtn = await page.$('text=この条件でダウンロード')
    if (!downloadConditionBtn) {
      logger.err('この条件でダウンロードボタンが見つかりません')
      return
    }
    await downloadConditionBtn.click()

    // 10秒待機
    await page.waitForTimeout(10000)

    // ページをリロード
    await page.reload()

    // 最初のダウンロードボタンをクリック
    await page.waitForSelector('a.btn.btn-info.btn-sm[data-original-title*="まで有効"]')
    const downloadButtons = await page.$$('a.btn.btn-info.btn-sm[data-original-title*="まで有効"]')
    if (!downloadButtons || downloadButtons.length === 0) {
      logger.err('ダウンロードボタンが見つかりません')
      return
    }

    // 最初のダウンロードボタンをクリック
    const [download] = await Promise.all([
      page.waitForEvent('download'),  // ダウンロードイベントを待つ
      downloadButtons[0].click()      // ダウンロードボタンをクリック
    ])

    // Macのダウンロードフォルダのパスを取得
    const downloadPath = path.join(os.homedir(), 'Downloads', fileName)

    // ファイルを保存
    await download.saveAs(downloadPath)
    await download.delete()  // 一時ファイルを削除

    logger.info(`ファイルをダウンロードしました: ${downloadPath}`)

    // ブラウザを閉じる
    await this.browserClose({ browser, context, page })

    return
  }
}

export default LstepV1Dao
