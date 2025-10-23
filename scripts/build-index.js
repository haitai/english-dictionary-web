/**
 * 构建轻量级索引文件
 * 只包含单词列表和基本信息，不包含完整内容
 * 单词详情按需从原始文件加载
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const WORDS_DIR = path.join(__dirname, '../public/dictionary')
const OUTPUT_FILE = path.join(__dirname, '../public/dictionary/index.json')

console.log('📚 开始构建轻量级索引...')

// 读取所有单词文件（排除index.json）
const files = fs.readdirSync(WORDS_DIR).filter(f => f.endsWith('.json') && f !== 'index.json')
console.log(`找到 ${files.length} 个单词文件`)

const wordList = []
const groups = {}

// 只提取基本信息
for (const file of files) {
  try {
    const filePath = path.join(WORDS_DIR, file)
    const content = fs.readFileSync(filePath, 'utf-8')
    const data = JSON.parse(content)
    
    const word = data.word || file.replace('.json', '')
    const firstChar = word.charAt(0).toLowerCase()
    const groupKey = /[a-z]/.test(firstChar) ? firstChar : 'other'
    
    // 只保存基本信息，减少索引文件大小
    const basicInfo = {
      word: word,
      pronunciation: data.pronunciation || '',
      definition: data.concise_definition || data.definitions?.[0]?.text || ''
    }
    
    wordList.push(basicInfo)
    
    if (!groups[groupKey]) {
      groups[groupKey] = 0
    }
    groups[groupKey]++
    
  } catch (err) {
    console.warn(`⚠️  处理 ${file} 失败:`, err.message)
  }
}

// 按字母排序
wordList.sort((a, b) => a.word.localeCompare(b.word))

// 生成轻量级索引
const index = {
  version: '2.0',
  totalWords: wordList.length,
  groups: Object.keys(groups).sort(),
  groupCounts: groups,
  words: wordList,
  // 添加元数据
  buildTime: new Date().toISOString(),
  // 说明：完整单词数据从 /dictionary/[word].json 按需加载
  dataSource: 'dictionary'
}

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(index, null, 2), 'utf-8')

console.log('\n✅ 索引构建完成！')
console.log(`📊 总单词数: ${wordList.length}`)
console.log(`📁 索引文件: ${OUTPUT_FILE}`)
console.log(`💾 文件大小: ${(fs.statSync(OUTPUT_FILE).size / 1024).toFixed(2)} KB`)
console.log('\n💡 提示：单词详情将从 dictionary/[word].json 按需加载')

