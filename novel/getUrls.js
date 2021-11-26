import fs from 'fs'
import puppeteer from 'puppeteer'

export const getUrls = async (novelId) => {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: {
      width: 1400,
      height: 900
    },
    args: ['--start-fullscreen']
  })
  let page = await browser.newPage()
  let result = {
    info: {
      isNew: false
    }
  }
  let indexId = 1
  while(!result?.info?.isNew === true) {
    await page.goto(
      `https://www.bqgyy.com/book/${novelId}/index_${indexId}.html`
      , { // 等待加载完成
      waitUntil: 'domcontentloaded'
    })
    await page.waitForTimeout(2000)
  
    result = await page.evaluate(function (result) {
      // 该页面只有第 1，3 的 container 有用
      // 1：包括书名、作者、封面、最新章节、最后更新时间、描述
      // 3：当前页的具体章节，包括章节名、章节链接
      // other：获取下一页的链接
      const containers = document.getElementsByClassName('container')
      // 1
      const infoEl = containers[0]
      let mainInfo = infoEl?.querySelector('.info-main')
      const img = mainInfo?.querySelector('img')?.src
      const innerHtml = mainInfo?.querySelector('.w100').innerHTML
      const title = innerHtml?.match(/<h1>(.*)<\/h1>/)?.[1]
      const author = innerHtml?.match(/本书作者：(.*)<\/a><\/span>/)?.[1]
      const mtime = innerHtml?.match(/最后更新：(.*)<\/span>/)?.[1]
      const desc = innerHtml?.match(/最后更新：(.*)<\/span>/)?.[1]
      const lastChapter = innerHtml.match(/最新章节：<.*>(.*)<\/a>/)?.[1].split('、')
      const isEmpty = isNaN(+lastChapter[0])
      result.info = {
        title,
        author,
        mtime,
        desc,
        img,
        lastChapter: isEmpty ? [lastChapter?.[0]?.split(` `)[0].match(/第(.*)章/)?.[1]] : lastChapter,
        isNew: true,
        nextPage: ''
      }
      if (!result?.chapters?.length) result.chapters = []
      // 3
      const chaptersEl = containers[3 - 1]
      mainInfo = chaptersEl.querySelector('.info-chapters')
      const chaptersA = mainInfo.getElementsByTagName('a')
      for (let i = 0; i<chaptersA.length; i++) {
        const cur = chaptersA[i]
        const halfTitle = cur.title?.replace(`${title} `, '')
        const idx = halfTitle?.split('、')[0]
        result.chapters.push({
          url: cur.href,
          title: cur.title,
          idx: isNaN(idx) ? (halfTitle.split(` `)[0].match(/第(.*)章/)?.[1] || '0') : idx
        })
      }
      // 下一页路径
      const href = document.querySelector('.listpage .right .onclick')?.href || ''
      result.info.isNew = !(href && href.indexOf('index') >= 0)
      result.info.nextPage = href
      return result
    }, result)
    if (!result.info.isNew) ++indexId
  }

  fs.writeFileSync(`./novel/${novelId}.json`, JSON.stringify(result, null, 2))
  await page.close()
  browser.close()
}