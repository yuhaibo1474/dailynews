#!/usr/bin/env python3
"""Fetch 中国政府网 policy feed (JSON) and emit a local RSS 2.0 file for Horizon.

gov.cn's HTTPS endpoint triggers TLS handshake / CRL-revocation failures on
some TLS stacks (Python/OpenSSL), while curl's schannel backend works when the
revocation check is skipped. We therefore fetch with curl (--ssl-no-revoke keeps
full certificate-chain verification, only skipping the unreachable CRL lookup),
then convert the JSON feed into RSS 2.0 that Horizon's RSS scraper can read.

Usage:
    python scripts/gov_policy_rss.py [--out data/gov_policy.rss]
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from xml.sax.saxutils import escape, quoteattr

FEED_URL = "https://www.gov.cn/pushinfo/v150203/pushinfo.json"
DEFAULT_OUT = Path("data") / "gov_policy.rss"
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"


def fetch_json(url: str) -> list[dict]:
    proc = subprocess.run(
        [
            "curl",
            "-sS",
            "--ssl-no-revoke",  # skip unreachable CRL lookup only; cert chain still verified
            "--max-time",
            "30",
            "-A",
            USER_AGENT,
            url,
        ],
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    if proc.returncode != 0:
        raise RuntimeError(f"curl failed ({proc.returncode}): {proc.stderr.strip()[:300]}")
    data = json.loads(proc.stdout)
    if not isinstance(data, list):
        raise RuntimeError("unexpected gov.cn feed shape (expected a JSON array)")
    return data


def _rfc822(date_str: str) -> str:
    for fmt in ("%Y-%m-%d", "%Y-%m-%d %H:%M:%S"):
        try:
            return datetime.strptime(date_str, fmt).strftime("%a, %d %b %Y %H:%M:%S +0800")
        except ValueError:
            continue
    return date_str


def to_rss(items: list[dict], title: str = "中国政府网·政策文件") -> str:
    entries = []
    for it in items:
        link = str(it.get("link") or "")
        item_title = str(it.get("title") or "未命名")
        desc = str(it.get("description") or "")
        author = str(it.get("author") or "中国政府网")
        pub = _rfc822(str(it.get("pubDate") or ""))
        entries.append(
            "    <item>\n"
            f"      <title>{escape(item_title)}</title>\n"
            f"      <link>{escape(link)}</link>\n"
            f"      <description>{escape(desc)}</description>\n"
            f"      <author>{escape(author)}</author>\n"
            f"      <pubDate>{escape(pub)}</pubDate>\n"
            f"      <guid isPermaLink=\"false\">{escape(link)}</guid>\n"
            "    </item>"
        )
    body = "\n".join(entries)
    now = datetime.now().strftime("%a, %d %b %Y %H:%M:%S +0800")
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<rss version="2.0">\n'
        "  <channel>\n"
        f"    <title>{escape(title)}</title>\n"
        "    <link>https://www.gov.cn/zhengce/</link>\n"
        f"    <description>{escape(title)}</description>\n"
        "    <language>zh-cn</language>\n"
        f"    <lastBuildDate>{escape(now)}</lastBuildDate>\n"
        f"{body}\n"
        "  </channel>\n"
        "</rss>\n"
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", default=str(DEFAULT_OUT), help="output RSS path")
    args = parser.parse_args()

    out = Path(args.out)
    items = fetch_json(FEED_URL)
    rss = to_rss(items)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(rss, encoding="utf-8")
    print(f"[ok] wrote {len(items)} policy items -> {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
