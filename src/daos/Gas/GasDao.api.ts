import { ResponseGASContent, RequestGASContent } from '@/entities/Gas'
import axios, { AxiosResponse } from 'axios'

export interface IGasDao {
  createSheet<T>(
    sheetBody: Array<T>
  ): Promise<ResponseGASContent<Array<T>> | null>
}

class GasDao implements IGasDao {
  public async createSheet<T>(
    sheetBody: Array<T>
  ): Promise<ResponseGASContent<Array<T>>> {
    // TODO エラーハンドリング
    const url =
      // TODO環境変数化
      // eslint-disable-next-line max-len
      'https://script.google.com/macros/s/AKfycbw9ElYWv_n7jUNqIXD9PYn6UlqRegOTBDhMQEnKIGnLzYdvBXWXIA0bq1SfkMwizg75/exec'

    const response = await axios.post<
      Array<T>,
      AxiosResponse<ResponseGASContent<Array<T>>>
    >(url, sheetBody)

    return response.data
  }
}

export default GasDao
