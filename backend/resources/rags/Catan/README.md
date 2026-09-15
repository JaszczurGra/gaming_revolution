# CATAN RAG corpus

A knowledge base for a Gemini-backed CATAN assistant. Covers the **base game, 5th English edition, 3-4 players**. Built from the Game Rules & Almanac booklet, plus generated board topology and derived strategy material.

## Contents

```
README.md                  this file
system_prompt.md           system prompt for the downstream model
corpus_full.md             all 26 chunks concatenated, chunk-delimited
catan_rag.jsonl            26 records, one per chunk, with metadata
build_index.py             regenerates the two files above from chunks/
chunks/                    26 source markdown chunks with front matter
data/board_topology.json   generated: 19 hexes, 54 intersections, 72 paths
data/beginner_map.json     beginner fixed map terrain + tokens
```

Total corpus: ~62k characters, roughly **16k tokens**.

## How to wire it into Gemini

The corpus is small enough to fit comfortably in context, so the simplest setup is also the best one:

**Recommended тАФ long context plus caching.** Put `system_prompt.md` in `system_instruction` and `corpus_full.md` in a cached content block. Everything is available on every turn, so no retrieval step can fail to surface the topology table exactly when a Distance Rule check needs it. This matters: retrieval that misses `ref-16-topology` degrades the validation mode badly.

**Alternative тАФ retrieval.** Use `catan_rag.jsonl` with File Search or your own embedding store. Embed the `text` field; keep `id`, `title`, `section`, `authority`, and `tags` as metadata for filtering and citation. If you go this route, **always force-include `ref-15-coordinates` and `ref-16-topology`** regardless of retrieval score whenever the query involves a board position or an image.

Either way, pass images as inline image parts alongside the user's text тАФ the corpus tells the model how to read them, it does not contain any images itself.

## The `authority` field

Every chunk is tagged so the model never presents analysis as a rule:

| Value | Meaning | Chunks |
|---|---|---|
| `official` | stated in the rulebook | 15 |
| `official-transcribed` | read off a rulebook illustration | 1 |
| `convention` | notation/procedure this corpus defines | 4 |
| `derived` | strategic analysis | 6 |

The system prompt instructs the model to treat these differently. Keep the field if you re-chunk.

## Coordinate system

Positions use a convention called `catan-base-19hex-v1`:

```
        A1  A2  A3
      B1  B2  B3  B4
    C1  C2  C3  C4  C5
      D1  D2  D3  D4
        E1  E2  E3
```

Intersections are `HEX.DIR` (e.g. `C1.SE`), canonicalised to the earliest hex in reading order. Paths are endpoint pairs (`C1.SE|C2.S`). `data/board_topology.json` and `chunks/ref-16-topology.md` hold the full generated tables: hex neighbours, all 54 intersections with the hexes they touch and their adjacency lists, and all 72 paths.

The tables were generated geometrically and verified against the known board: 54 intersections, 72 paths, 18 outer corners touching one land hex, 24 interior intersections touching three.

The adjacency lists make the Distance Rule a lookup instead of a derivation, which is the single biggest reliability win for photo validation.

## Known gaps

**Beginner map starting pieces.** The terrain and token layout is transcribed in `ref-17-beginner-map` and cross-checks cleanly against the required distributions. The **positions of the 8 pre-placed settlements and 8 roads, and which settlement of each pair carries the white star, are not recorded.** The illustration is too dense to transcribe reliably from the PDF. The corpus tells the model to say so rather than guess. If you photograph that illustration or list the positions, I can add them in the same notation.

**Harbor positions** are likewise not fixed in the corpus. The model reads them from the user's board. The counts (four 3:1, five 2:1) are validated.

**No expansions.** Seafarers, Cities & Knights, Traders & Barbarians, and the 5-6 player extension are all explicitly out of scope.

## Regenerating

```bash
python3 build_index.py     # chunks/*.md -> catan_rag.jsonl + corpus_full.md
```

To edit content, edit the chunk markdown and rerun. To add a chunk, copy an existing file's front-matter shape тАФ `id`, `title`, `section`, `authority`, `tags` are required.

## Testing suggestions

Worth checking before you ship:

1. "Can I build a settlement next to my own settlement?" тЖТ should cite the Distance Rule and say no.
2. "Can I trade 2 wool for 1 wool?" тЖТ no, same-resource trades are forbidden.
3. Photo with a Distance Rule violation тЖТ should name both intersections and offer legal alternatives.
4. Photo, then "what's my best move?" тЖТ should ask for the hand before advising.
5. "What happens in Seafarers when..." тЖТ should decline as out of scope.
6. Photo with a hex deliberately obscured тЖТ should notice the terrain distribution check fails and ask for a reshoot.
