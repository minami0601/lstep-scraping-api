export interface ResponseContent<T> {
  code: number
  message: string
  data?: T | null
  errorData?: any
}
