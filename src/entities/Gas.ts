export interface RequestGASContent<T> {
  sheetBody: T
}

export interface ResponseGASContent<T> {
  status: number
  data: {
    ssURL: string
  }
  message: string
  requestBody: T
  csv: Array<Array<string>>
}
