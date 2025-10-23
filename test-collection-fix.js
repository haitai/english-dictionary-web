// 测试收藏功能的修复
// 在浏览器控制台中运行此脚本来测试

async function testCollectionFix() {
  console.log('开始测试收藏功能...')
  
  try {
    // 测试添加收藏
    console.log('1. 测试添加收藏...')
    const addResult = await window.learningStore.addCollection('test-word')
    console.log('添加收藏结果:', addResult)
    
    // 等待一下
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 测试移除收藏
    console.log('2. 测试移除收藏...')
    const removeResult = await window.learningStore.removeCollection('test-word')
    console.log('移除收藏结果:', removeResult)
    
    // 检查是否真的被移除
    await new Promise(resolve => setTimeout(resolve, 1000))
    const isStillCollected = window.learningStore.isCollected('test-word')
    console.log('3. 检查是否已移除:', !isStillCollected)
    
    if (!isStillCollected) {
      console.log('✅ 收藏功能修复成功！')
    } else {
      console.log('❌ 收藏功能仍有问题')
    }
    
  } catch (error) {
    console.error('测试过程中出错:', error)
  }
}

// 运行测试
testCollectionFix()
