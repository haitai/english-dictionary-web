import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DICT_DIR = path.join(__dirname, '../public/dictionary');
const OUTPUT_DIR = DICT_DIR;

console.log('开始处理词典数据...');

// 读取所有 JSON 文件
const files = fs.readdirSync(DICT_DIR).filter(f => f.endsWith('.json') && f.length > 2);

console.log(`找到 ${files.length} 个词条文件`);

// 按首字母分组
const groups = {};
const allWords = [];

for (const file of files) {
  try {
    const filePath = path.join(DICT_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    // 确保 word 字段存在，否则使用文件名
    const word = data.word || file.replace('.json', '');
    
    // 如果 data.word 不存在，补充到数据对象中
    if (!data.word) {
      data.word = word;
    }
    
    const firstChar = word[0].toLowerCase();
    
    // 确定分组键（a-z 或 other）
    const groupKey = /[a-z]/.test(firstChar) ? firstChar : 'other';
    
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    
    groups[groupKey].push(data);
    
    // 添加到索引（确保 word 字段存在）
    if (word && typeof word === 'string') {
      allWords.push({
        word: word,
        pronunciation: data.pronunciation || '',
        concise_definition: data.concise_definition || '',
        firstChar: groupKey
      });
    }
  } catch (error) {
    console.error(`处理文件 ${file} 时出错:`, error.message);
  }
}

console.log(`按字母分组完成，共 ${Object.keys(groups).length} 个组`);

// 保存分组文件
for (const [letter, words] of Object.entries(groups)) {
  const outputPath = path.join(OUTPUT_DIR, `${letter}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(words, null, 2), 'utf-8');
  console.log(`保存 ${letter}.json - ${words.length} 个单词`);
}

// 生成索引文件
// 过滤掉无效的词条并排序
const validWords = allWords.filter(w => w.word && typeof w.word === 'string');
validWords.sort((a, b) => a.word.localeCompare(b.word));
const indexPath = path.join(OUTPUT_DIR, 'index.json');
fs.writeFileSync(indexPath, JSON.stringify({
  totalWords: validWords.length,
  words: validWords,
  groups: Object.keys(groups).sort()
}, null, 2), 'utf-8');

console.log(`索引文件已生成: index.json - 总计 ${validWords.length} 个单词`);
console.log('词典数据处理完成！');

