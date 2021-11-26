import { readOriginConfig, convertToChinaNum } from '../utils.js'
import fs from 'fs'
import puppeteer from 'puppeteer'
import config from '../config.js'
const savePath = config.novelSavePath

export const writeTxt = async (novelId) => {
  const json = readOriginConfig(`./novel/${novelId}.json`)
  const url = json.chapters[0]?.url || ''
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: {
      width: 1400,
      height: 900
    },
    args: ['--start-fullscreen']
  })
  let page = await browser.newPage()
  const info = json.info
  const {
    title,
    author
  } = info
  
  let result = {
    txt: `\t书名：${title}\r\n` + `\t作者：${author}\r\n`,
    hasNext: true,
    curUrl: url,
    novelId
  }

  const filePath = `${savePath}/${novelId}.txt`
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
      const href = document.querySelector('#next_url')?.href
      params.curUrl = href !== `https://www.bqgyy.com/book/${params.novelId}` ? href : false
      params.hasNext = !!params.curUrl
      if (!params.hasNext) return {}
      const chapterName = document.querySelector('.reader-main h1')?.innerText
      console.log('章节名：' + chapterName)
      const idx = chapterName.split('、')[0]
      params.txt = `\t第${convertToChinaNum(+idx)}章：${chapterName}\r\n`
      const article = document.querySelector('#article')?.innerHTML
      params.txt += article.replace(/<p>/g, '\t').replace(/<\/p>/g, '\r\n') + '\r\n'
      
      return params
    }, result)

    if (result?.txt) ws.write(result.txt)
  }

  ws.end()
  const name = `${savePath}/${title}_${novelId}.txt`
  fs.rename(filePath, name, (err) => {
    if (err) throw err
    console.log('文件重命名为：' + `${title}_${novelId}.txt`)
  })
  await page.close()
  browser.close()
}