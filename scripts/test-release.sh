"#!/bin/bash

# 测试发布脚本 - 只显示会执行的操作，不实际修改

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
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

print_info "=== 发布模拟运行 ==="
print_info "版本更新类型: $VERSION_TYPE"

# 1. 检查工作目录
print_info "1. 检查工作目录状态..."
if [[ -n $(git status --porcelain) ]]; then
    print_warn "工作目录有未提交的更改"
else
    print_info "✓ 工作目录干净"
fi

# 2. 显示当前版本
OLD_VERSION=$(node -p "require('./package.json').version")
print_info "2. 当前版本: $OLD_VERSION"

# 3. 模拟版本更新
print_info "3. 模拟版本更新..."
case $VERSION_TYPE in
    patch)
        # 模拟patch版本更新
        MAJOR_MINOR=$(echo $OLD_VERSION | cut -d. -f1-2)
        PATCH=$(echo $OLD_VERSION | cut -d. -f3)
        NEW_PATCH=$((PATCH + 1))
        NEW_VERSION="$MAJOR_MINOR.$NEW_PATCH"
        ;;
    minor)
        # 模拟minor版本更新
        MAJOR=$(echo $OLD_VERSION | cut -d. -f1)
        MINOR=$(echo $OLD_VERSION | cut -d. -f2)
        PATCH=$(echo $OLD_VERSION | cut -d. -f3)
        NEW_MINOR=$((MINOR + 1))
        NEW_VERSION="$MAJOR.$NEW_MINOR.0"
        ;;
    major)
        # 模拟major版本更新
        MAJOR=$(echo $OLD_VERSION | cut -d. -f1)
        NEW_MAJOR=$((MAJOR + 1))
        NEW_VERSION="$NEW_MAJOR.0.0"
        ;;
    *)
        print_error "无效的版本类型: $VERSION_TYPE"
        exit 1
        ;;
esac

print_info "新版本号: $NEW_VERSION"

# 4. 显示会修改的文件
print_info "4. 会修改的文件:"
echo "  - package.json (版本: $OLD_VERSION -> $NEW_VERSION)"
echo "  - src-tauri/Cargo.toml (版本: $OLD_VERSION -> $NEW_VERSION)"
echo "  - src-tauri/tauri.conf.json (版本: $OLD_VERSION -> $NEW_VERSION)"
echo "  - CHANGELOG.md (添加新版本记录)"

# 5. 显示Git操作
print_info "5. Git操作:"
echo "  - git add ."
echo "  - git commit -m \"chore: release v$NEW_VERSION\""
echo "  - git tag -a \"v$NEW_VERSION\" -m \"Release v$NEW_VERSION\""
echo "  - git push origin main"
echo "  - git push origin \"v$NEW_VERSION\""

# 6. 显示后续步骤
print_info "6. 后续步骤:"
echo "  - GitHub Actions会自动开始构建"
echo "  - 构建完成后，前往GitHub Releases页面"
echo "  - 检查构建产物并发布"

print_info ""
print_info "=== 模拟完成 ==="
print_info "要实际执行发布，请运行: ./scripts/release.sh $VERSION_TYPE"
print_info "或使用Tauri CLI: npm run tauri publish --bump $VERSION_TYPE"
"