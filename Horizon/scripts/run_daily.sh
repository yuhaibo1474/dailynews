#!/usr/bin/env bash
# 一键运行 Horizon 日报流水线：先刷新中国政府网政策 RSS，再执行抓取/分析/生成。
set -euo pipefail
cd "$(dirname "$0")/.."

# 确保独立安装的 uv 在 PATH 中
export PATH="$PATH:/c/Users/yuhaibo/.local/bin"

# 1) 刷新「政策」板块来源（gov.cn JSON -> data/gov_policy.rss）
uv run python scripts/gov_policy_rss.py

# 2) 运行 Horizon（透传所有参数，如 --hours 24）
uv run horizon "$@"
