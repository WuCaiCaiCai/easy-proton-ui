#!/bin/bash

# 简单测试脚本

echo "=== 发布测试 ==="
echo "当前版本: $(node -p "require('./package.json').version")"
echo ""
echo "如果运行 ./scripts/release.sh patch，将会:"
echo "1. 版本从 0.2.0 更新到 0.2.1"
echo "2. 提交更改到Git"
echo "3. 创建标签 v0.2.1"
echo "4. 推送到GitHub"
echo "5. 触发GitHub Actions构建"
echo ""
echo "要实际发布，请运行:"
echo "./scripts/release.sh patch"
