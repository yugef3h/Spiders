import { getUrls } from './getUrls.js'
import { writeTxt } from './writeTxt.js'

async function download(novelId) {
  await getUrls(novelId)
  writeTxt(novelId)
}

// https://www.bqgyy.com/book/20814/index_1.html
// 20814 夜的命名术
// 16599 从红月开始
download(16599)