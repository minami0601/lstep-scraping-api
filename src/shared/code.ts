const BUYMA = 'https://www.buyma.com'
const BUILD_ENV = process.env.BUILD_ENV

export const BUYMA_URL = Object.freeze({
  TOP: BUYMA,
  LOGIN: BUYMA + '/login/',
  MY_PAGE: BUYMA + '/my',
})

export const PLAN_COUNT = Object.freeze({
  BASIC: {
    NO2: {
      MONTH_COUNT: 3, // 取得してくる月数
    },
    NO6: {
      // ITEM_COUNT: BUILD_ENV == 'heroku' ? 2 : 40,
      ITEM_COUNT: BUILD_ENV == 'heroku' ? 2 : 20,
      // ITEM_COUNT: BUILD_ENV == 'heroku' ? 2 : 5,
      ORDER_RECORD: BUILD_ENV == 'heroku' ? 1 : 30,
    },
    NO7: {
      ITEM_COUNT: 500,
    },
  },
})

export const TOKEN = Object.freeze({
  SEND_GRID_API_KEY: process.env.SEND_GRID_API_KEY,
})
