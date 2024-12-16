/* eslint-disable max-len */
import { PlayWright } from '@/entities/BuymaV1'
import { chromium } from 'playwright'
import fs from 'fs'
import json2csv from 'json2csv'
import openai from 'openai'
import { createReadStream } from 'fs'
import logger from '@/shared/Logger'
type ChatCompletionMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}
import dotenv from 'dotenv'
dotenv.config()

interface FileJsonl {
  messages: ChatCompletionMessage[]
}

class GoogleV1Dao {
  public async chromiumNewPage(): Promise<PlayWright> {
    const browser = await chromium.launch({
      // headless: process.env.NODE_ENV !== 'development', // 開発モード以外はバックグラウンド実行
      headless: true,
      // headless: false,
      slowMo: 300,
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

  convertToJsonl(data: FileJsonl[]): string {
    return data.map((item) => JSON.stringify(item)).join('\n')
  }

  public async GoogleScraping() {
    const { browser, context, page } = await this.chromiumNewPage()
    page.setDefaultTimeout(0)

    const data: FileJsonl[] = []

    // const keyWordList = [
    //   'プログラミングスクール',
    //   'プログラミングスクール おすすめ',
    //   'プログラミングスクール 無料',
    //   'プログラミングスクール オンライン',
    //   'プログラミングスクール 比較',
    //   'プログラミングスクール おすすめ',
    //   'プログラミングスクール おすすめ 社会人',
    //   'プログラミングスクール おすすめ 安い',
    //   'プログラミングスクール おすすめ侍エンジニア',
    //   'エンジニア フリーランス',
    //   'itエンジニア フリーランス',
    //   'ｉｔエンジニア フリーランス',
    //   'エンジニア フリーランス 年収',
    //   'エンジニア フリーランス案件',
    //   'webエンジニア フリーランス',
    //   'エンジニア 年収',
    //   'システム エンジニア 年収',
    //   'エンジニア年収',
    //   'it エンジニア年収',
    //   'webエンジニア 年収',
    //   'フリーランス エンジニア 年収',
    // ]

    // for (const keyWord of keyWordList) {
    //   await page.goto(
    //     // `https://www.google.com/search?q=%E3%83%97%E3%83%AD%E3%82%B0%E3%83%A9%E3%83%9F%E3%83%B3%E3%82%B0`
    //     `https://www.google.com/search?q=${keyWord}}`
    //   )

    //   // const nameElements = await page.$$('.uEierd') // 広告
    //   const nameElements = await page.$$('.MjjYud') // 検索結果

    //   const herfList: string[] = []
    //   for (const nameElement of nameElements) {
    //     const aElement = await nameElement.$('a')
    //     if (!aElement) continue
    //     const href = await aElement.getProperty('href')
    //     const hrefValue = await href.jsonValue()

    //     if (!hrefValue) continue
    //     herfList.push(hrefValue as string)
    //   }

    //   for (const herf of herfList) {
    //     try {
    //       await page.goto(herf)

    //       const title = await page.title()

    //       data.push({
    //         messages: [
    //           { role: 'system', content: `これからは『${keyWord}』のキーワードで検索して上位に` },
    //           {
    //             role: 'user',
    //             content: title + 'をタイトルにしたブログ記事を作ってください',
    //           },
    //           {
    //             role: 'assistant',
    //             content: await page.content(),
    //           },
    //         ],
    //       })
    //       console.info(title, herf, keyWord)
    //     } catch (error) {
    //       logger.err(error)
    //     }
    //   }
    // }

    // const jsonl = this.convertToJsonl(data)

    const fileName = 'グーグルリサーチ.jsonl'

    // fs.writeFileSync(fileName, jsonl)

    // await this.fileUpload(fileName)

    const fileID = 'file-qzX3CjE21Sjvli7Itznp3pn1'
    const jobId = 'ftjob-lNO0eZvhq87CIDVleIujdsvB'

    // console.info(await this.modelFineTurning(fileID))
    console.info(await this.checkFineTuningJobStatus(jobId))

    browser.close()

    // console.info(await this.getCompletion('テストです'))

    return data
  }

  public client() {
    return new openai({
      // https://platform.openai.com/account/billing/payment-methods
      // クレカ登録しないといけない
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  async fileUpload(fileName: string) {
    const client = this.client()

    const jsonl = fs.createReadStream(fileName)

    const file = await openai.toFile(jsonl)
    const res = await client.files.create({ file, purpose: 'fine-tune' })
    console.log(res, 'res')
    return res
  }

  async modelFineTurning(fileId: string) {
    const client = this.client()
    return await client.fineTuning.jobs.create({
      training_file: fileId,
      model: 'gpt-3.5-turbo-0613',
    })
  }

  async checkFineTuningJobStatus(jobID: string) {
    const client = this.client()
    return await client.fineTuning.jobs.retrieve(jobID)
  }

  public async getCompletion(prompt: string): Promise<string | null> {
    const client = this.client()

    const messages: ChatCompletionMessage[] = [{ role: 'user', content: prompt }]

    const completion = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      // model: 'gpt-4',
      messages,
      temperature: 0.9,
      max_tokens: 4000,
      top_p: 1,
      frequency_penalty: 0.0,
      presence_penalty: 0.6,
      stop: [' Human:', ' AI:'],
    })

    const { content } = completion.choices[0].message

    if (!content) {
      return null
    }
    if (content.substring(0, 1) === `\n`) {
      return content.substring(1)
    }
    return content
  }
}

export default GoogleV1Dao
