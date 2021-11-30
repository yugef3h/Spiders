import fs from 'fs'
import puppeteer from 'puppeteer'

export const getUrls = async (novelHref) => {
  const browser = await puppeteer.launch({
    headless: true,
    // defaultViewport: {
    //   width: 1400,
    //   height: 900
    // },
    // args: ['--start-fullscreen']
  })
  let page = await browser.newPage()
  let result = {
    info: {
      novelHref
    }
  }
  await page.goto(
    novelHref
    , { // 等待加载完成
    waitUntil: 'domcontentloaded'
  })
  await page.waitForTimeout(2000)

  result = await page.evaluate(function (result) {
    const { novelHref } = result.info
    const innerHtml = document.querySelector('#maininfo').innerHTML
    const img = document.querySelector('#fmimg img')?.src
    const title = innerHtml?.match(/<h1>(.*)<\/h1>/)?.[1]
    const author = innerHtml?.match(/者：(.*)<\/p>/)?.[1]
    const desc = document.querySelector('#intro')?.innerText
    const lastChapter = innerHtml.match(/最新章节：<.*>(.*)<\/a>/)?.[1].split('、')
    const isEmpty = isNaN(+lastChapter[0])
    result.info = {
      novelHref,
      title,
      author,
      desc: desc.trim(),
      img,
      novelId: novelHref.split('net/')?.[1].split('/')?.[0],
      lastChapter: isEmpty ? [lastChapter?.[0]?.split(` `)[0].match(/第(.*)章/)?.[1]] : lastChapter,
    }
    
    mainInfo = document.querySelector('#list')
    const chaptersArr = mainInfo.getElementsByTagName('a')
    const chapters = []
    for (let i = 0; i<chaptersArr.length; i++) {
      const cur = chaptersArr[i]
      chapters.push({
        url: cur.href,
        title: cur.innerText
      })
    }
    result.chapters = chapters.slice(12)

    return result
  }, result)

  fs.writeFileSync(`./novel/${result.info.title}.json`, JSON.stringify(result, null, 2))
  await page.close()
  browser.close()
}