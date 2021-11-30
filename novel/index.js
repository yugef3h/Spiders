import { getUrls } from './getUrls.js'
import { writeTxt } from './writeTxt.js'
import { searchNovel } from './search.js'

async function download(novelName) {
  const href = await searchNovel(novelName)
  if (!href) {
    console.log('该小说暂未收录！')
    return
  }
  await getUrls(href)
  writeTxt(novelName)
}

// https://www.biqugeu.net/
download('从红月开始')