import fs from 'fs'
import puppeteer from 'puppeteer'

export const getVideoList = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: {
      width: 1400,
      height: 900
    },
    args: ['--start-fullscreen']
  })
  let page = await browser.newPage()
  await page.goto(
    'https://www.douyin.com/user/MS4wLjABAAAADOBDUp-SUjPGyqZSR0kTXR0aVfr1YJJokHECEX9UgOA?author_id=78779309523&enter_from=video_detail&enter_method=video_title&from_gid=6979561161125645608&group_id=6979561161125645608&log_pb=%7B%22impr_id%22%3A%22021636011220871fdbddc0300fff0010a87549500000c5828422d%22%7D'
    , { // 等待加载完成
    waitUntil: 'domcontentloaded'
  })
  await page.waitForTimeout(2000)
  // 这个跳过就终止请求了。
  // await page.evaluate(() => {
  //   document.querySelector('#verify-bar-close').click()
  // })
  async function scrollPage(i) {
    return await page.evaluate(function (i) {
      for (let y = 0; y <= 1000 * i; y += 50) {
        window.scrollTo(0, y)
      }
      return document.getElementsByTagName('li')
    }, i)
  }
  let i = 0
  let els = await scrollPage(++i)
  while (els.length < 500) {
    els = await scrollPage(++i)
  }
  let data = {
    list: []
  }
  els.map((li, index) => {
    const href = li.href
    if (href.indexOf('video') > 0) {
      const title = href.split('video/')?.[1] || +new Date()
      data.list.push({
        url: href,
        title
      })
    }
  })
  fs.writeFileSync('./videoList.json', JSON.stringify(data))
  await page.close()
  await browser.close()
  return data
}

getVideoList()