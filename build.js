#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function log(message) {
  console.log(`[构建] ${message}`);
}

function error(message) {
  console.error(`[错误] ${message}`);
}

function ensureDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    log(`创建目录: ${dirPath}`);
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function emptyDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    log(`清空目录: ${dirPath}`);
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      if (fs.lstatSync(filePath).isDirectory()) {
        fs.rmSync(filePath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(filePath);
      }
    }
  }
}

function moveFiles(sourceDir, targetDir) {
  if (!fs.existsSync(sourceDir)) {
    log(`源目录不存在，跳过移动: ${sourceDir}`);
    return;
  }
  
  ensureDirectory(targetDir);
  
  const files = fs.readdirSync(sourceDir);
  if (files.length === 0) {
    log(`源目录为空，跳过移动: ${sourceDir}`);
    return;
  }
  
  log(`移动文件从 ${sourceDir} 到 ${targetDir}`);
  for (const file of files) {
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetDir, file);
    
    if (fs.lstatSync(sourcePath).isDirectory()) {
      // 如果是目录，递归移动
      moveFiles(sourcePath, targetPath);
      fs.rmdirSync(sourcePath);
    } else {
      // 如果是文件，直接移动
      fs.renameSync(sourcePath, targetPath);
    }
  }
}

function copyFiles(sourceDir, targetDir) {
  if (!fs.existsSync(sourceDir)) {
    error(`源目录不存在: ${sourceDir}`);
    return false;
  }
  
  ensureDirectory(targetDir);
  
  const files = fs.readdirSync(sourceDir);
  if (files.length === 0) {
    log(`源目录为空，跳过复制: ${sourceDir}`);
    return true;
  }
  
  log(`复制文件从 ${sourceDir} 到 ${targetDir}`);
  for (const file of files) {
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetDir, file);
    
    if (fs.lstatSync(sourcePath).isDirectory()) {
      // 如果是目录，递归复制
      copyFiles(sourcePath, targetPath);
    } else {
      // 如果是文件，直接复制
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
  
  return true;
}

function runBuild() {
  try {
    log('开始构建...');
    execSync('npx rollup -c rollup.config.mjs', { stdio: 'inherit' });
    log('构建成功');
    return true;
  } catch (err) {
    error('构建失败');
    return false;
  }
}

function main() {
  log('开始优化构建流程');
  
  // 1. 检查并创建dist.bak文件夹
  const distBakPath = path.join(__dirname, 'dist.bak');
  ensureDirectory(distBakPath);
  
  // 2. 清空dist.bak文件夹
  emptyDirectory(distBakPath);
  
  // 3. 将dist文件夹中的文件移动到dist.bak文件夹
  const distPath = path.join(__dirname, 'dist');
  moveFiles(distPath, distBakPath);
  
  // 4. 运行rollup构建
  const buildSuccess = runBuild();
  
  if (buildSuccess) {
    // 5. 检查并创建test-local/dist文件夹
    const testLocalDistPath = path.join(__dirname, 'test-local', 'dist');
    ensureDirectory(testLocalDistPath);
    
    // 6. 清空test-local/dist文件夹
    emptyDirectory(testLocalDistPath);
    
    // 7. 复制dist中的文件到test-local/dist
    copyFiles(distPath, testLocalDistPath);
    
    log('构建流程完成，文件已复制到 test-local/dist');
  } else {
    error('构建失败，跳过后续步骤');
    process.exit(1);
  }
  
  log('构建流程完成');
}

if (require.main === module) {
  main();
}

module.exports = { main };
