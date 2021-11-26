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
    novelId,
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
      const convertToChinaNum = (num) => {
        var arr1 = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
        var arr2 = ['', '十', '百', '千', '万', '十', '百', '千', '亿', '十', '百', '千','万', '十', '百', '千','亿'];//可继续追加更高位转换值
        if(!num || isNaN(num)){
            return "零";
        }
        var english = num.toString().split("")
        var result = "";
        for (var i = 0; i < english.length; i++) {
            var des_i = english.length - 1 - i;//倒序排列设值
            result = arr2[i] + result;
            var arr1_index = english[des_i];
            result = arr1[arr1_index] + result;
        }
        //将【零千、零百】换成【零】 【十零】换成【十】
        result = result.replace(/零(千|百|十)/g, '零').replace(/十零/g, '十');
        //合并中间多个零为一个零
        result = result.replace(/零+/g, '零');
        //将【零亿】换成【亿】【零万】换成【万】
        result = result.replace(/零亿/g, '亿').replace(/零万/g, '万');
        //将【亿万】换成【亿】
        result = result.replace(/亿万/g, '亿');
        //移除末尾的零
        result = result.replace(/零+$/, '')
        //将【零一十】换成【零十】
        //result = result.replace(/零一十/g, '零十');//貌似正规读法是零一十
        //将【一十】换成【十】
        result = result.replace(/^一十/g, '十');
        return result;
      }


      const href = document.querySelector('#next_url')?.href
      params.curUrl = href !== `https://www.bqgyy.com/book/${params.novelId}` ? href : false
      params.hasNext = !!params.curUrl
      if (!params.hasNext) return {}
      const chapterName = document.querySelector('.reader-main h1')?.innerText
      const idx = Number(chapterName.split('、')[0])
      params.txt = `\t第${isNaN(idx) ? chapterName.split(` `)[0].match(/第(.*)章/)?.[1] : idx}章：${chapterName}\r\n`
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