#!/bin/bash

# Easy Proton 发布脚本
# 使用方法: ./scripts/release.sh [patch|minor|major]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查参数
if [ $# -eq 0 ]; then
    print_error "请指定版本更新类型: patch, minor 或 major"
    echo "用法: $0 [patch|minor|major]"
    exit 1
fi

VERSION_TYPE=$1

# 1. 检查工作目录是否干净
if [[ -n $(git status --porcelain) ]]; then
    print_error "工作目录有未提交的更改，请先提交更改"
    exit 1
fi

print_info "1. 拉取最新代码..."
git pull origin main

# 2. 运行测试
print_info "2. 运行测试..."
npm run build
cd src-tauri && cargo check
cd ..

# 3. 更新版本号
print_info "3. 更新版本号 ($VERSION_TYPE)..."

# 更新前端版本号
OLD_VERSION=$(node -p "require('./package.json').version")
npm version $VERSION_TYPE --no-git-tag-version
NEW_VERSION=$(node -p "require('./package.json').version")

print_info "前端版本从 $OLD_VERSION 更新到 $NEW_VERSION"

# 更新Rust版本号
sed -i "s/version = \"$OLD_VERSION\"/version = \"$NEW_VERSION\"/" src-tauri/Cargo.toml

# 更新tauri.conf.json版本号
sed -i "s/\"version\":\"$OLD_VERSION\"/\"version\":\"$NEW_VERSION\"/" src-tauri/tauri.conf.json

# 4. 生成更新日志
print_info "4. 生成更新日志..."
if [ ! -f CHANGELOG.md ]; then
    echo "# 更新日志" > CHANGELOG.md
    echo "" >> CHANGELOG.md
fi

# 获取最近的提交信息
RECENT_COMMITS=$(git log --oneline -n 10)
echo "" >> CHANGELOG.md
echo "## v$NEW_VERSION ($(date +%Y-%m-%d))" >> CHANGELOG.md
echo "" >> CHANGELOG.md
echo "### 新功能" >> CHANGELOG.md
echo "- 自动发布脚本" >> CHANGELOG.md
echo "" >> CHANGELOG.md
echo "### 最近提交" >> CHANGELOG.md
echo "\`\`\`" >> CHANGELOG.md
echo "$RECENT_COMMITS" >> CHANGELOG.md
echo "\`\`\`" >> CHANGELOG.md

# 5. 提交更改
print_info "5. 提交版本更新..."
git add .
git commit -m "chore: release v$NEW_VERSION"

# 6. 创建标签
print_info "6. 创建Git标签 v$NEW_VERSION..."
git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION"

# 7. 推送代码和标签
print_info "7. 推送到GitHub..."
git push origin main
git push origin "v$NEW_VERSION"

print_info "\n🎉 发布准备完成！"
print_info "版本: v$NEW_VERSION"
print_info "标签已推送到GitHub"
print_info "\n下一步:"
echo "1. GitHub Actions会自动开始构建"
echo "2. 前往 https://github.com/$USER/easy-proton-ui/releases"
echo "3. 等待构建完成（约5-10分钟）"
echo "4. 检查构建产物并发布Release"

print_info "\n发布完成！ 🚀"
