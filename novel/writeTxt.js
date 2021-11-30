import { readOriginConfig } from '../utils.js'
import fs from 'fs'
import puppeteer from 'puppeteer'
import config from '../config.js'
const savePath = config.novelSavePath

export const writeTxt = async (novelName) => {
  const json = readOriginConfig(`./novel/${novelName}.json`)
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: {
      width: 1400,
      height: 900
    },
    args: ['--start-fullscreen']
  })
  let page = await browser.newPage()
  
  const {
    title,
    author,
    novelId
  } = json.info

  const url = json.chapters[0]?.url || ''
  let result = {
    txt: `\t书名：${title}\r\n` + `\t作者：${author}\r\n`,
    hasNext: true,
    curUrl: url,
    novelId
  }

  const filePath = `${savePath}/${novelName}.txt`
  let ws = fs.createWriteStream(filePath, 'utf-8')
  ws.write(result.txt)

  while(result?.hasNext) {
    const curUrl = result.curUrl
    if (!curUrl) break
    await page.goto(
      curUrl
      , { // 等待加载完成
      waitUntil: 'domcontentloaded'
    })
    await page.waitForTimeout(2000)
  
    result = await page.evaluate(function (params) {

      const href = document.querySelector('.next')?.href
      params.curUrl = href !== `https://www.biqugeu.net/${params.novelId}/` ? href : false
      params.hasNext = !!params.curUrl
      if (!params.hasNext) return {}
      const chapterName = document.querySelector('.bookname h1')?.innerText
      params.txt = `\t${chapterName}\r\n`
      const article = document.querySelector('#content')?.innerHTML
      params.txt += article.replace(/<br>/g, '\r\n')
      
      return params
    }, result)

    if (result?.txt) ws.write(result.txt)
  }

  ws.end()
  await page.close()
  browser.close()
}