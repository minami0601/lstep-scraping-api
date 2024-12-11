import socketio from 'socket.io'
import http from 'http'
import { Express } from 'express'
import logger from '@/shared/Logger'

const runSocket = (app: Express): http.Server => {
  const server: http.Server = http.createServer(app)
  const io: socketio.Server = new socketio.Server(server, {
    cors: {
      origin: '*',
      // origin: ['http://localhost:8080'],
      methods: '*',
      // methods: ['GET', 'POST'],
    },
  })

  const ioConnect = io.on('connection', (socket) => {
    logger.info(`socket_id: ${socket.id} is connected.`)

    // send-msgイベントを受け取ったらブロードキャストする
    socket.on('send-msg', (msg: { id: string; text: string }) => {
      msg.text = 'XXXXX'
      socket.emit('new-msg', msg)
      logger.info(`receive message: ${JSON.stringify(msg)}`)
    })
  })
  // send-msgイベントを受け取ったらブロードキャストする
  //   ioConnect.on('send-msg', (msg: { id: string; text: string }) => {
  //     msg.text = 'XXXXX'
  //     ioConnect.emit('new-msg', msg)
  //     logger.info(`receive message: ${JSON.stringify(msg)}`)
  //   })

  return server
}

export default runSocket
