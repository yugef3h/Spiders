import puppeteer from 'puppeteer'
import fs from 'fs'
import http from 'http'
import config from '../config.js'
import path from 'path'

function readOriginConfig () {
  try {
    const videoListPath = './douyin/videoList.json'
    const data = JSON.parse(fs.readFileSync(path.resolve(videoListPath), 'utf-8'))
    return data
  } catch (err) {
    console.error(err)
  }
}


function getVideoData(url, encoding='utf-8') {
  return new Promise((resolve, reject) => {
    let req = http.get(url, function (res) {
      let result = ''
      encoding && res.setEncoding(encoding)
      res.on('data', function (d) {
        result += d
      })
      res.on('end', function () {
        resolve(result)
      })
      res.on('error', function (e) {
        reject(e)
      })
    })
    req.end()
  })
}

function savefileToPath(fileName, fileData) {
  let fileFullName = `${config.douyinVideosSavePath}/${fileName}.mp4`
  return new Promise((resolve) => {
    fs.writeFile(fileFullName, fileData, 'binary', function (err) {
      if (err) {
        console.log('savefileToPath error:', err)
      }
      resolve('已下载')
    })
  })
}

/**
 * video.title
 * video.url
 * @param {*} video 
 */
async function downloadVideo(video) {
  // 判断视频文件是否已经下载
  if (!video.url) {
    console.log('链接不存在')
    return
  }
  if (!fs.existsSync(`${config.douyinVideosSavePath}/${video.title}.mp4`)) {
    await getVideoData(video.url, 'binary').then(fileData => {
      savefileToPath(video.title, fileData).then(res =>
        console.log(`${res}: ${video.title}`)
      )
    })
  } else {
    console.log(`视频文件已存在：${video.title}`)
  }
}

export const getUrl = async (linkUrl = 'https://v.douyin.com/JdngHhh/', options) => {
  const isHeadless = options?.headless || false
  const browser = await puppeteer.launch({
    headless: isHeadless,
    defaultViewport: {
      width: 1400,
      height: 900
    },
    args: ['--start-fullscreen']
  })

  // const pageAlert = async (page, pageMsg) => {
  //   await page.evaluate((msg) => {
  //     alert(msg);
  //   }, pageMsg);
  // };

  let page = await browser.newPage()
  await page.goto('https://www.axx.cc/', { // 等待加载完成
    waitUntil: 'domcontentloaded'
  })
  const newPagePromise = new Promise(r => browser.once('targetcreated', target => r(target.page()))) // 创建对象

  await page.waitForSelector('#url') // 获取 dom
  await page.evaluate((params) => { // 脚本修改 input.value
    const u = params.url
    const i = params.elId
    const el = document.querySelector(i)
    if (el) el.value = u
  }, {
    url: linkUrl,
    elId: '#url'
  })
  const btn = await page.$('.button2')
  await btn.click() // 点击去除水印按钮
  let pages = await browser.pages()
  await page.waitForTimeout(3000) // pyppeteer 报 Execution context was destroyed, most likely because of a navigation
  return pages[1].evaluate((params) => {
    const i = params.elId
    const el = document.querySelector(i)
    const url = params.url
    return {
      title: url.split('video/')?.[1] || +new Date(),
      url: el ? el.value : ''
    }
  }, {
    url: linkUrl,
    elId: '#url'
  })
}

(async () => {
  const jsonData = readOriginConfig()
  for (let i=0; i<10; i++) {
    const result = await getUrl(jsonData[i], {
      headless: true // 开启无头
    })
    await downloadVideo(result)
  }
})()
