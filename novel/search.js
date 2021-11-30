import puppeteer from 'puppeteer'
// 搜索书名是否存在本书

export const searchNovel = async (novelName) => {
  if (!novelName) return
  const searchUrl = `https://www.biqugeu.net/searchbook.php?keyword=${encodeURI(novelName)}`
  const browser = await puppeteer.launch({
    headless: true
  })
  const page = await browser.newPage()
  await page.goto(
    searchUrl
    , { // 等待加载完成
    waitUntil: 'domcontentloaded'
  })
  await page.waitForTimeout(2000)
  const href = await page.evaluate(function () {
    return document.querySelector('.item .image a')?.href || ''
  })
  await page.close()
  browser.close()
  return href
}