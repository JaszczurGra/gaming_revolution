#!/usr/bin/env python3
"""Build catan_rag.jsonl and corpus_full.md from chunks/*.md.

Each chunk has YAML-ish front matter delimited by --- lines.
Output records are ready for Gemini embedding / File Search, or for
concatenation into a single long-context payload.
"""
import json, os, re, glob

CHUNK_DIR = os.path.join(os.path.dirname(__file__), "chunks")
OUT_JSONL = os.path.join(os.path.dirname(__file__), "catan_rag.jsonl")
OUT_FULL = os.path.join(os.path.dirname(__file__), "corpus_full.md")

def parse(path):
    raw = open(path, encoding="utf-8").read()
    m = re.match(r"^---\n(.*?)\n---\n(.*)$", raw, re.S)
    if not m:
        raise ValueError(f"missing front matter: {path}")
    meta_raw, body = m.group(1), m.group(2).strip()
    meta = {}
    for line in meta_raw.split("\n"):
        if not line.strip() or line.startswith(" "):
            continue
        k, _, v = line.partition(":")
        v = v.strip()
        if v.startswith("[") and v.endswith("]"):
            v = [x.strip() for x in v[1:-1].split(",") if x.strip()]
        meta[k.strip()] = v
    meta["text"] = body
    meta["chars"] = len(body)
    meta["file"] = os.path.basename(path)
    return meta

records = [parse(p) for p in sorted(glob.glob(os.path.join(CHUNK_DIR, "*.md")))]

with open(OUT_JSONL, "w", encoding="utf-8") as f:
    for r in records:
        f.write(json.dumps(r, ensure_ascii=False) + "\n")

with open(OUT_FULL, "w", encoding="utf-8") as f:
    f.write("# CATAN corpus (all chunks concatenated)\n\n")
    f.write("Base game, 5th English edition, 3-4 players. "
            "Chunk boundaries are marked so a long-context model can cite them.\n\n")
    for r in records:
        f.write(f"\n\n<!-- BEGIN CHUNK {r['id']} | authority={r.get('authority')} -->\n")
        f.write(f"## [{r['id']}] {r['title']}\n\n{r['text']}\n")
        f.write(f"<!-- END CHUNK {r['id']} -->\n")

print(f"{len(records)} chunks -> catan_rag.jsonl, corpus_full.md")
print(f"total body chars: {sum(r['chars'] for r in records):,}  (~{sum(r['chars'] for r in records)//4:,} tokens)")
by_auth = {}
for r in records:
    by_auth[r.get("authority")] = by_auth.get(r.get("authority"), 0) + 1
print("authority mix:", by_auth)
for r in records:
    print(f"  {r['id']:<30} {r['chars']:>6}  {r.get('authority')}")
