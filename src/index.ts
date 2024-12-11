// TODO メンテナンスモード

import './pre-start' // Must be the first import
import app from '@/Server'
import logger from '@/shared/Logger'
import { PLAN_COUNT } from '@/shared/code'
import cluster from 'cluster'
import os from 'os'
import { gracefulShutdown } from '@/shared/functions'
import { workerLog } from '@/shared/functions'
import runSocket from './Socket'
import http from 'http'
import { Express } from 'express'

const PORT = Number(process.env.PORT || 3000)
const HOST = String(process.env.HOST || 'http://localhost')
const IS_WEBSOCKET = process.env.IS_WEBSOCKET // WebSocketを使うか
const IS_ClUSTER_MODE = process.env.IS_ClUSTER_MODE // クラスターサーバーを使うか

const shutdownHandling = (server: http.Server) => {
  const SIGTERM = 'SIGTERM'
  process.on(SIGTERM, (signal) => {
    logger.err(`process.onエラー`)
    logger.err('signal' + signal)
    gracefulShutdown(server, SIGTERM)
  }) // for kill

  const SIGINT = 'SIGINT'
  process.on(SIGINT, (signal) => {
    logger.err(`process.onエラー`)
    logger.err('signal' + signal)
    gracefulShutdown(server, SIGINT)
  }) // for kill
}

// シングルスレッドの場合
const singleServer = (server: http.Server | Express) => {
  const expressServer = server.listen(PORT, () => {
    logger.info('Express server started on port: ' + PORT)
    logger.info(`${HOST}:${PORT}`)
  })
  shutdownHandling(expressServer)
}

// クラスターの場合
const clusterServer = (server: http.Server | Express) => {
  // CPU のコア (スレッド) 数を調べる
  const cpus = os.cpus()
  const numCPUs = cpus.length

  logger.info(`==================`)
  logger.info(`numCPUs:${numCPUs}\n`)

  // https://runebook.dev/ja/docs/node/cluster
  if (cluster.isPrimary) {
    logger.info(`Primary ${process.pid} is running`)

    //フォークワーカー。
    for (let i = 0; i < numCPUs; i++) {
      logger.info(`Primary : Cluster Fork ${i}`)
      cluster.fork()
    }

    cpus.forEach((_, index) => {
      const worker = cluster.fork()
      logger.info(`Primary : Cluster Fork ${index} Worker:${worker.id} started`)
      cluster.fork()
    })

    cluster.on('exit', (worker, code, signal) => {
      const id = worker.process.pid || 'undefined'
      const pid = worker.process.pid || 'undefined'

      logger.err(`[${id}] Worker died : [PID ${pid}] [Signal ${signal}] [Code ${code}]`)

      cluster.fork()
    })
  } else {
    //ワーカーは任意のTCP接続を共有できます
    //この場合はHTTPサーバーです
    logger.info(`Worker ${process.pid} started \n`)

    workerLog('Worker')

    const expressServer = server.listen(PORT, () => {
      workerLog(`Express server started on port:${PORT}`)
      // logger.info('Express server started on port: ' + port)
      logger.info(`${HOST}:${PORT}`)
    })

    shutdownHandling(expressServer)
  }
}

let server: http.Server | Express

// WebSocketサーバーを使うかどうか
if (IS_WEBSOCKET) {
  logger.info(`WebSocket起動`)
  server = runSocket(app)
} else {
  logger.info(`WebSocket起動なし`)
  server = app
}

// サーバー起動
if (IS_ClUSTER_MODE) {
  logger.info(`クラスタサーバーで起動`)
  clusterServer(server) // クラスターサーバーの場合
} else {
  logger.info(`シングルサーバーで起動`)
  singleServer(server) // シングルサーバーの場合
}

logger.info(`No2 モデリングリサーチ取得可能期間`)
logger.info(`MONTH_COUNT: ${PLAN_COUNT.BASIC.NO2.MONTH_COUNT}`)

logger.info(`No6 出品地リサーチ取得可能件数`)
logger.info(`ITEM_COUNT: ${PLAN_COUNT.BASIC.NO6.ITEM_COUNT}`)
logger.info(`ORDER_RECORD: ${PLAN_COUNT.BASIC.NO6.ORDER_RECORD}\n`)

import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// openai.chat.completions.create({

// })

import * as lineSDK from '@line/bot-sdk'
import { WebhookEvent } from '@line/bot-sdk'

const client = new lineSDK.Client({
  channelAccessToken: '',
})

client.pushMessage('userID', '')
