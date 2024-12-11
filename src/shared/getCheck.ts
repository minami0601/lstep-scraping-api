export const getCheck = (
  text: string | null | undefined,
  customText?: string,
  customErrText?: string
) => {
  if (text) {
    // return customText || text
    return text
  }
  return customErrText || '取得できませんでした'
}
