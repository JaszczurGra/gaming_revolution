# CATAN corpus (all chunks concatenated)

Base game, 5th English edition, 3-4 players. Chunk boundaries are marked so a long-context model can cite them.



<!-- BEGIN CHUNK proto-25-missing-info | authority=convention -->
## [proto-25-missing-info] Protocol for missing information and when to ask

# What to ask for, and when

## Hidden by design тАФ never infer these
- Resource cards in any player's hand (you may ask for counts; a player must answer count questions truthfully in a real game)
- Development cards held in hand
- Victory point cards, which are hidden until a player wins
- Which specific cards a player discarded on a 7

## Not visible in a photograph тАФ ask if needed
- Whose turn it is
- The current dice roll
- Played knight cards, if they are outside the frame
- Who holds Longest Road and Largest Army, if the cards are outside the frame
- Player count, and in a 3-player beginner game, whether red was correctly removed
- How many cards are left in the development deck
- Whether the trade or build phase has already happened this turn

## When to ask versus when to proceed

**Proceed without asking** when the question is purely about rules, about board legality, or about the board's structure. A Distance Rule violation is fully determinable from a photo.

**Ask before answering** when the request depends on hidden state: best move, threat assessment, whether a trade is good, or the true score.

**Ask once, in one message, bundled.** Do not drip-feed questions across several turns.

## How to ask
Answer everything you can first, then ask for exactly the gaps that block the rest. Keep it to the minimum set.

> Reading the board: it is a variable map, robber on C3, and your settlements at C1.SE and D2.S are both legal. To recommend a move I need two things: your current hand, and whether anyone has played knights yet.

## Do not ask for things you can derive
If the photo shows the tokens, do not ask which numbers are on the board. If it shows the pieces, do not ask how many settlements someone has. Asking for derivable information reads as not having looked.

## Stating confidence
Flag individual low-confidence readings rather than hedging the whole answer. "I read B3 as a 4 but it could be a 9 тАФ glare" is useful. "I might have misread some tokens" is not.
<!-- END CHUNK proto-25-missing-info -->


<!-- BEGIN CHUNK ref-15-coordinates | authority=convention -->
## [ref-15-coordinates] Canonical coordinate system for board positions

# Coordinate system (convention `catan-base-19hex-v1`)

Use this notation for every position you report, in every mode. It is unambiguous and self-checking.

## Orientation assumption
The standard base board has **pointy-top hexes** тАФ each hex has a corner at the top and bottom, and flat edges on the left and right. Hexes form 5 horizontal rows of 3, 4, 5, 4, 3. Always orient a photo so the rows read as 3-4-5-4-3 top to bottom before assigning coordinates.

## Hex IDs
Rows are lettered **A** (top) to **E** (bottom). Within a row, hexes are numbered left to right starting at 1.

```
        A1  A2  A3
      B1  B2  B3  B4
    C1  C2  C3  C4  C5
      D1  D2  D3  D4
        E1  E2  E3
```

C3 is the exact centre of the island. The 7 fully interior hexes (all 6 neighbours present) are B2, B3, C2, C3, C4, D2, D3.

## Hex neighbour directions
Each hex has up to 6 neighbours: `W`, `E` (same row) and `NW`, `NE`, `SW`, `SE` (adjacent rows). Rules:
- Same row: `W` = index-1, `E` = index+1.
- Toward a **narrower** row: `NW`/`SW` = index-1, `NE`/`SE` = index.
- Toward a **wider** row: `NW`/`SW` = index, `NE`/`SE` = index+1.

Example: `C3` has W=C2, E=C4, NW=B2, NE=B3, SW=D2, SE=D3. `A1` has only E=A2, SW=B1, SE=B2.

## Intersection (vertex) IDs
Each hex has 6 corners: `N`, `NE`, `SE`, `S`, `SW`, `NW`. A vertex is written `HEX.DIR`, e.g. `C3.N`.

Because up to 3 hexes share a corner, each vertex has up to 3 valid names. The **canonical** name uses the hex that comes first in reading order (A1, A2, A3, B1, ... E3).

Alias rules (H = the hex you are looking at):
- `H.N` = `H.NE-neighbour.SW` = `H.NW-neighbour.SE`
- `H.S` = `H.SE-neighbour.NW` = `H.SW-neighbour.NE`
- `H.NE` = `H.E-neighbour.NW` = `H.NE-neighbour.S`
- `H.SE` = `H.E-neighbour.SW` = `H.SE-neighbour.N`
- `H.NW` = `H.W-neighbour.NE` = `H.NW-neighbour.S`
- `H.SW` = `H.W-neighbour.SE` = `H.SW-neighbour.N`

There are **54 intersections**: 24 touch 3 land hexes, 12 touch 2, and 18 touch only 1 (the outer corners of the island).

## Path (edge) IDs
A path is written as its two endpoint vertices joined by a pipe, canonical endpoint first:
`C3.N|C3.NE`. There are **72 paths**.

Each hex's 6 edges connect consecutive vertices in the cycle N тЖТ NE тЖТ SE тЖТ S тЖТ SW тЖТ NW тЖТ N.

## Self-verification when reading a photo
The most reliable way to name an intersection from an image is to list the land hexes meeting at that corner, then look up the canonical ID in `ref-16-topology`. If your named vertex's hex list does not match what you see, you have misread the position.

## Reporting format
- Hex: `C4 (pasture, 3)`
- Intersection: `C4.NW (touches B3, C3, C4)`
- Path: `C3.N|C3.NE`
- Harbor: name it by the two coastal intersections it serves, e.g. `harbor 3:1 at A1.NW / A1.N`.
<!-- END CHUNK ref-15-coordinates -->


<!-- BEGIN CHUNK ref-16-topology | authority=convention -->
## [ref-16-topology] Board topology tables - hex neighbours, all 54 intersections, all 72 paths

# Board topology tables

Convention `catan-base-19hex-v1`. 19 hexes, 54 intersections, 72 paths.

## Hex neighbours

`HEX: W E NW NE SW SE` (missing directions mean coast).

```
A1: E=A2 SW=B1 SE=B2
A2: W=A1 E=A3 SW=B2 SE=B3
A3: W=A2 SW=B3 SE=B4
B1: E=B2 NE=A1 SW=C1 SE=C2
B2: W=B1 E=B3 NW=A1 NE=A2 SW=C2 SE=C3
B3: W=B2 E=B4 NW=A2 NE=A3 SW=C3 SE=C4
B4: W=B3 NW=A3 SW=C4 SE=C5
C1: E=C2 NE=B1 SE=D1
C2: W=C1 E=C3 NW=B1 NE=B2 SW=D1 SE=D2
C3: W=C2 E=C4 NW=B2 NE=B3 SW=D2 SE=D3
C4: W=C3 E=C5 NW=B3 NE=B4 SW=D3 SE=D4
C5: W=C4 NW=B4 SW=D4
D1: E=D2 NW=C1 NE=C2 SE=E1
D2: W=D1 E=D3 NW=C2 NE=C3 SW=E1 SE=E2
D3: W=D2 E=D4 NW=C3 NE=C4 SW=E2 SE=E3
D4: W=D3 NW=C4 NE=C5 SW=E3
E1: E=E2 NW=D1 NE=D2
E2: W=E1 E=E3 NW=D2 NE=D3
E3: W=E2 NW=D3 NE=D4
```

## Intersections

`CANONICAL_ID | land hexes touched | alias names | adjacent intersections`

Adjacent intersections are exactly the ones blocked by the **Distance Rule**: if any of them holds a settlement or city, this intersection is illegal for a new settlement.

```
A1.N | A1 | - | A1.NE,A1.NW
A1.NE | A1,A2 | A2.NW | A1.N,A1.SE,A2.N
A1.NW | A1 | - | A1.N,A1.SW
A1.S | A1,B1,B2 | B1.NE,B2.NW | A1.SE,A1.SW,B1.SE
A1.SE | A1,A2,B2 | A2.SW,B2.N | A1.NE,A1.S,A2.S
A1.SW | A1,B1 | B1.N | A1.NW,A1.S,B1.NW
A2.N | A2 | - | A1.NE,A2.NE
A2.NE | A2,A3 | A3.NW | A2.N,A2.SE,A3.N
A2.S | A2,B2,B3 | B2.NE,B3.NW | A1.SE,A2.SE,B2.SE
A2.SE | A2,A3,B3 | A3.SW,B3.N | A2.NE,A2.S,A3.S
A3.N | A3 | - | A2.NE,A3.NE
A3.NE | A3 | - | A3.N,A3.SE
A3.S | A3,B3,B4 | B3.NE,B4.NW | A2.SE,A3.SE,B3.SE
A3.SE | A3,B4 | B4.N | A3.NE,A3.S,B4.NE
B1.NW | B1 | - | A1.SW,B1.SW
B1.S | B1,C1,C2 | C1.NE,C2.NW | B1.SE,B1.SW,C1.SE
B1.SE | B1,B2,C2 | B2.SW,C2.N | A1.S,B1.S,B2.S
B1.SW | B1,C1 | C1.N | B1.NW,B1.S,C1.NW
B2.S | B2,C2,C3 | C2.NE,C3.NW | B1.SE,B2.SE,C2.SE
B2.SE | B2,B3,C3 | B3.SW,C3.N | A2.S,B2.S,B3.S
B3.S | B3,C3,C4 | C3.NE,C4.NW | B2.SE,B3.SE,C3.SE
B3.SE | B3,B4,C4 | B4.SW,C4.N | A3.S,B3.S,B4.S
B4.NE | B4 | - | A3.SE,B4.SE
B4.S | B4,C4,C5 | C4.NE,C5.NW | B3.SE,B4.SE,C4.SE
B4.SE | B4,C5 | C5.N | B4.NE,B4.S,C5.NE
C1.NW | C1 | - | B1.SW,C1.SW
C1.S | C1,D1 | D1.NW | C1.SE,C1.SW,D1.SW
C1.SE | C1,C2,D1 | C2.SW,D1.N | B1.S,C1.S,C2.S
C1.SW | C1 | - | C1.NW,C1.S
C2.S | C2,D1,D2 | D1.NE,D2.NW | C1.SE,C2.SE,D1.SE
C2.SE | C2,C3,D2 | C3.SW,D2.N | B2.S,C2.S,C3.S
C3.S | C3,D2,D3 | D2.NE,D3.NW | C2.SE,C3.SE,D2.SE
C3.SE | C3,C4,D3 | C4.SW,D3.N | B3.S,C3.S,C4.S
C4.S | C4,D3,D4 | D3.NE,D4.NW | C3.SE,C4.SE,D3.SE
C4.SE | C4,C5,D4 | C5.SW,D4.N | B4.S,C4.S,C5.S
C5.NE | C5 | - | B4.SE,C5.SE
C5.S | C5,D4 | D4.NE | C4.SE,C5.SE,D4.SE
C5.SE | C5 | - | C5.NE,C5.S
D1.S | D1,E1 | E1.NW | D1.SE,D1.SW,E1.SW
D1.SE | D1,D2,E1 | D2.SW,E1.N | C2.S,D1.S,D2.S
D1.SW | D1 | - | C1.S,D1.S
D2.S | D2,E1,E2 | E1.NE,E2.NW | D1.SE,D2.SE,E1.SE
D2.SE | D2,D3,E2 | D3.SW,E2.N | C3.S,D2.S,D3.S
D3.S | D3,E2,E3 | E2.NE,E3.NW | D2.SE,D3.SE,E2.SE
D3.SE | D3,D4,E3 | D4.SW,E3.N | C4.S,D3.S,D4.S
D4.S | D4,E3 | E3.NE | D3.SE,D4.SE,E3.SE
D4.SE | D4 | - | C5.S,D4.S
E1.S | E1 | - | E1.SE,E1.SW
E1.SE | E1,E2 | E2.SW | D2.S,E1.S,E2.S
E1.SW | E1 | - | D1.S,E1.S
E2.S | E2 | - | E1.SE,E2.SE
E2.SE | E2,E3 | E3.SW | D3.S,E2.S,E3.S
E3.S | E3 | - | E2.SE,E3.SE
E3.SE | E3 | - | D4.S,E3.S
```

## Paths

`PATH_ID | land hexes it borders`. A path bordering one land hex is a coastal path.

```
A1.NE|A1.SE | A1,A2
A1.NE|A2.N | A2
A1.NW|A1.SW | A1
A1.N|A1.NE | A1
A1.N|A1.NW | A1
A1.SE|A2.S | A2,B2
A1.SW|B1.NW | B1
A1.S|A1.SE | A1,B2
A1.S|A1.SW | A1,B1
A1.S|B1.SE | B1,B2
A2.NE|A2.SE | A2,A3
A2.NE|A3.N | A3
A2.N|A2.NE | A2
A2.SE|A3.S | A3,B3
A2.S|A2.SE | A2,B3
A2.S|B2.SE | B2,B3
A3.NE|A3.SE | A3
A3.N|A3.NE | A3
A3.SE|B4.NE | B4
A3.S|A3.SE | A3,B4
A3.S|B3.SE | B3,B4
B1.NW|B1.SW | B1
B1.SE|B2.S | B2,C2
B1.SW|C1.NW | C1
B1.S|B1.SE | B1,C2
B1.S|B1.SW | B1,C1
B1.S|C1.SE | C1,C2
B2.SE|B3.S | B3,C3
B2.S|B2.SE | B2,C3
B2.S|C2.SE | C2,C3
B3.SE|B4.S | B4,C4
B3.S|B3.SE | B3,C4
B3.S|C3.SE | C3,C4
B4.NE|B4.SE | B4
B4.SE|C5.NE | C5
B4.S|B4.SE | B4,C5
B4.S|C4.SE | C4,C5
C1.NW|C1.SW | C1
C1.SE|C2.S | C2,D1
C1.S|C1.SE | C1,D1
C1.S|C1.SW | C1
C1.S|D1.SW | D1
C2.SE|C3.S | C3,D2
C2.S|C2.SE | C2,D2
C2.S|D1.SE | D1,D2
C3.SE|C4.S | C4,D3
C3.S|C3.SE | C3,D3
C3.S|D2.SE | D2,D3
C4.SE|C5.S | C5,D4
C4.S|C4.SE | C4,D4
C4.S|D3.SE | D3,D4
C5.NE|C5.SE | C5
C5.S|C5.SE | C5
C5.S|D4.SE | D4
D1.SE|D2.S | D2,E1
D1.S|D1.SE | D1,E1
D1.S|D1.SW | D1
D1.S|E1.SW | E1
D2.SE|D3.S | D3,E2
D2.S|D2.SE | D2,E2
D2.S|E1.SE | E1,E2
D3.SE|D4.S | D4,E3
D3.S|D3.SE | D3,E3
D3.S|E2.SE | E2,E3
D4.S|D4.SE | D4
D4.S|E3.SE | E3
E1.SE|E2.S | E2
E1.S|E1.SE | E1
E1.S|E1.SW | E1
E2.SE|E3.S | E3
E2.S|E2.SE | E2
E3.S|E3.SE | E3
```

## Using these tables

- **Distance Rule check**: look up the target intersection, read its `adjacent intersections`, confirm all are empty.
- **Road legality check**: a path is legal for you if either endpoint vertex holds your settlement/city, or if either endpoint is an endpoint of one of your existing roads and is not occupied by an opponent's settlement/city.
- **Production check**: an intersection collects from every hex in its `land hexes touched` list.
- **Coastal detection**: intersections touching 1 or 2 land hexes are coastal and may carry a harbor.
- **Naming check**: if the hexes you see at a corner do not match the `land hexes touched` column, you have misidentified the intersection.
<!-- END CHUNK ref-16-topology -->


<!-- BEGIN CHUNK ref-17-beginner-map | authority=official-transcribed -->
## [ref-17-beginner-map] Beginner fixed map - terrain and number layout

# Beginner map layout

Coordinates follow `ref-15-coordinates` (rows A-E, left to right).

| Hex | Terrain | Token | Produces |
|---|---|---|---|
| A1 | Mountains | 10 | Ore |
| A2 | Pasture | 2 | Wool |
| A3 | Forest | 9 | Lumber |
| B1 | Fields | 12 | Grain |
| B2 | Hills | 6 | Brick |
| B3 | Pasture | 4 | Wool |
| B4 | Hills | 10 | Brick |
| C1 | Fields | 9 | Grain |
| C2 | Forest | 11 | Lumber |
| C3 | Desert | тАФ | Nothing (robber starts here) |
| C4 | Pasture | 3 | Wool |
| C5 | Mountains | 8 | Ore |
| D1 | Forest | 8 | Lumber |
| D2 | Mountains | 3 | Ore |
| D3 | Fields | 4 | Grain |
| D4 | Pasture | 5 | Wool |
| E1 | Fields | 5 | Grain |
| E2 | Hills | 6 | Brick |
| E3 | Forest | 11 | Lumber |

## Distribution check (all pass)
- Forest 4 (A3, C2, D1, E3), Fields 4 (B1, C1, D3, E1), Pasture 4 (A2, B3, C4, D4), Hills 3 (B2, B4, E2), Mountains 3 (A1, C5, D2), Desert 1 (C3).
- Tokens: one 2, one 12, two each of 3, 4, 5, 6, 8, 9, 10, 11. 18 tokens, no 7.
- Red (6/8) hexes: B2, E2, C5, D1. None are adjacent to each other.

## Known gap тАФ starting piece positions
The rulebook's beginner illustration also fixes the exact starting settlement and road positions for each of the four colours, including which settlement of each pair carries the white star that grants starting resources. **This corpus does not contain those coordinates.** If a user is setting up the beginner map, tell them to place pieces as printed in their booklet illustration, and offer to record the positions in this notation if they describe or photograph them.

Do not guess starting positions. Do not present a guessed layout as official.
<!-- END CHUNK ref-17-beginner-map -->


<!-- BEGIN CHUNK ref-26-glossary | authority=official -->
## [ref-26-glossary] Glossary

# Glossary

**Building Costs card** тАФ Player reference card listing the four build costs.

**City** тАФ Church-shaped piece, worth 2 VPs, produced only by upgrading your own settlement. Yields 2 cards per producing adjacent hex.

**Coast** тАФ Where a land hex borders the sea frame. Roads may be built along the coast; coastal intersections touch only 1 or 2 land hexes and may carry harbors.

**Combined trade/build phase** тАФ Recommended variant for experienced players allowing trading and building in any order after the roll.

**Desert** тАФ The one hex that never produces and never takes a number token. The robber starts here.

**Development card** тАФ A card bought for ore + wool + grain. Knight, progress, or victory point.

**Distance Rule** тАФ A settlement may only be built on an intersection whose 3 adjacent intersections are all empty, regardless of owner.

**Domestic trade** тАФ Trading resources with another player. Must involve the active player.

**Harbor** тАФ Coastal location granting 3:1 or 2:1 bank trade to a player with a building on it.

**Intersection** тАФ Corner where hexes meet. The only legal location for settlements and cities. 54 on the board.

**Knight card** тАФ Development card that moves the robber and steals a card. Stays face up once played; counts toward Largest Army.

**Largest Army** тАФ Special card worth 2 VPs, held by the first player to play 3 knights and then by whoever strictly exceeds that.

**Longest Road** тАФ Special card worth 2 VPs, for a continuous road chain of at least 5 segments, counting only the longest single branch.

**Maritime trade** тАФ Trading with the bank at 4:1, or better with a harbor.

**Number token** тАФ Round token marking which dice total makes a hex produce. Pips below the numeral show how many of 36 dice combinations produce it.

**Path** тАФ Edge between two hexes, or a hex and the frame. Only legal location for roads, one per path. 72 on the board.

**Pip** тАФ A dot under a token's numeral. Total pips at an intersection is the standard measure of its yield.

**Progress card** тАФ Green-framed development card: Road Building, Year of Plenty, or Monopoly. Discarded after use.

**Resource** тАФ Brick, grain, lumber, ore, or wool.

**Robber** тАФ Piece that blocks one hex from producing. Moved by a 7 or a knight.

**Settlement** тАФ House-shaped piece, 1 VP, yields 1 card per producing adjacent hex.

**Soldier card** тАФ Old name for a knight card, used in earlier editions.

**Victory point (VP)** тАФ The win condition; 10 on your own turn wins. The rising-sun icon on cards marks 1 VP each.
<!-- END CHUNK ref-26-glossary -->


<!-- BEGIN CHUNK rules-01-overview | authority=official -->
## [rules-01-overview] Game overview and core concepts

# Game overview

CATAN is a game for 3-4 players on an island built from 19 terrain hexes surrounded by a sea frame. Players own settlements and cities on the corners of hexes and roads on the edges. The goal is to be the first player to reach 10 victory points **on your own turn**.

## The core loop

Every turn, dice are rolled. The total decides which terrain hexes produce resources that turn. Any player with a settlement or city touching a producing hex collects resources тАФ including players whose turn it is not. Players then trade and spend resources to build more roads, settlements, cities, and development cards, which in turn produce more resources and more victory points.

## Terrain and what it produces

| Terrain | Produces |
|---|---|
| Hills | Brick |
| Forest | Lumber |
| Mountains | Ore |
| Fields | Grain |
| Pasture | Wool |
| Desert | Nothing |

## Key vocabulary

- **Intersection**: a corner where hexes meet. Settlements and cities go here only. Most intersections touch 3 hexes; coastal ones touch 1 or 2.
- **Path**: an edge between two hexes, or between a hex and the frame. Roads go here only, one road per path.
- **Robber**: a piece that blocks one hex from producing. It starts on the desert.
- **Harbor**: a coastal location allowing better bank trade rates.

## Starting position

Each player begins with 2 settlements and 2 roads already placed, so everyone starts on 2 victory points and needs 8 more to win.

## What counts as an edition boundary

This corpus covers the **base game only**, 3-4 players, 5th English edition. It does not cover the 5-6 player extension or any expansion (Seafarers, Cities & Knights, Traders & Barbarians). If a user asks about those, say they are out of scope rather than improvising.
<!-- END CHUNK rules-01-overview -->


<!-- BEGIN CHUNK rules-02-components | authority=official -->
## [rules-02-components] Components and deck composition

# Components and exact counts

These counts are the backbone of board-state validation. If an observed board contradicts them, something is wrong.

## Board pieces
- 19 terrain hexes
- 6 sea frame pieces
- 9 harbor pieces
- 18 circular number tokens
- 1 robber

## Terrain hex distribution (19 total)
- 4 Forest, 4 Fields, 4 Pasture
- 3 Hills, 3 Mountains
- 1 Desert

## Number tokens (18 total)
Tokens run 2 through 12 with **no 7**. There is exactly one "2" and one "12"; every other value appears twice. The desert never receives a token.

Each token shows dots (pips) below the numeral indicating how many of the 36 dice combinations produce it. Taller numerals with more pips are more likely. "6" and "8" are printed in red and have 5 pips each.

## Cards
- 95 resource cards: 19 each of brick, grain, lumber, ore, wool
- 25 development cards: 14 knight, 6 progress, 5 victory point
  - progress breakdown: 2 Road Building, 2 Year of Plenty, 2 Monopoly
  - victory point cards: Library, Market, Great Hall, Chapel, University (1 VP each)
- 4 Building Costs cards (one per player)
- 2 special cards: Longest Road, Largest Army

## Player pieces (per player, per colour)
- 5 settlements (house shaped)
- 4 cities (church shaped)
- 15 roads (bar shaped)

Totals across 4 colours: 20 settlements, 16 cities, 60 roads. A player may never have more pieces on the board than their personal supply allows.

## Harbors (9 total)
- 4 generic harbors at 3:1
- 5 special harbors at 2:1, exactly one for each of the five resources
<!-- END CHUNK rules-02-components -->


<!-- BEGIN CHUNK rules-03-setup-beginner | authority=official -->
## [rules-03-setup-beginner] Setup procedure - beginner (fixed) map

# Setup: beginner fixed map

Recommended for a first game. The layout is pre-balanced, and starting settlements and roads are pre-placed, so there is no initial placement phase.

## Steps

1. **Punch components** (first game only). Push tiles through from the printed front, not the back.
2. **Assemble the frame.** Match the numbers at the ends of the 6 sea frame pieces (1 to 1, 2 to 2, and so on).
3. **Lay the 19 terrain hexes** inside the frame exactly as shown in the booklet's beginner illustration. See chunk `ref-17-beginner-map` for the transcribed layout.
4. **Place the 18 number tokens** on the designated hexes. The desert gets none.
5. **Place the robber on the desert.**
6. **Each player picks a colour** and takes exactly 5 settlements, 4 cities, 15 roads, and the matching Building Costs card.
7. **Place 2 settlements and 2 roads of each colour** at the marked positions.
   - **3-player game: leave out the red position entirely.** Red is not played.
8. **Sort resource cards into 5 face-up stacks** beside the board. Shuffle the development cards into a face-down deck. Put the 2 dice and the 2 special cards beside the board.
9. **Starting resources.** Each player takes 1 resource card for each terrain hex adjacent to the one starting settlement marked with a white star. A star settlement touching 3 producing hexes yields 3 cards.
10. **The oldest player takes the first turn** and begins by rolling for production.

## Common setup errors to check for
- Robber not on the desert.
- A number token on the desert.
- Red pieces present in a 3-player game.
- Starting resources taken from both settlements instead of only the starred one.
- A player holding more than 5 settlements / 4 cities / 15 roads.
<!-- END CHUNK rules-03-setup-beginner -->


<!-- BEGIN CHUNK rules-04-setup-variable | authority=official -->
## [rules-04-setup-variable] Setup procedure - variable (random) map

# Setup: variable map

For experienced players. The island changes every game.

## Steps

1. **Assemble the frame** as normal.
2. **Shuffle the 19 terrain hexes face down**, then place them face up in the standard 3-4-5-4-3 arrangement inside the frame.
3. **Harbors.** Shuffle the 9 harbor pieces and place one face up on each harbor position on the frame.
   - Variant: if you only want harbor positions to shift slightly, shuffle the order of the frame pieces instead and skip the random harbor placement.
4. **Number tokens тАФ alphabetical method (recommended).** Sort the 18 tokens letter-side up. Starting at a corner hex of the island, place them in alphabetical order by the letter on the back, spiralling **counter-clockwise inward toward the centre**. Skip the desert.
5. **Number tokens тАФ fully random method (alternative).** Start at a corner and place tokens in random order, skipping the desert. Constraint: the red numbers (6 and 8) must not end up on adjacent hexes. Swap tokens as needed to satisfy this.
6. **Place the robber on the desert**, sort resource cards into 5 stacks, shuffle the development deck, set out dice and special cards.
7. Proceed to the **initial placement phase** (see `rules-05-setup-phase`).

## Validation notes for a random board
- Terrain distribution must still be 4/4/4/3/3/1 (forest/fields/pasture/hills/mountains/desert).
- Token multiset must still be one 2, one 12, and two each of 3,4,5,6,8,9,10,11. No 7.
- Under the fully random method, no two red (6/8) hexes may touch. Under the alphabetical method this is guaranteed by construction, so a red-adjacent pair suggests tokens were placed incorrectly.
<!-- END CHUNK rules-04-setup-variable -->


<!-- BEGIN CHUNK rules-05-setup-phase | authority=official -->
## [rules-05-setup-phase] Initial placement phase (snake draft)

# Initial placement phase

Used with the variable map. Two rounds; each player places 1 settlement and 1 adjoining road per round.

## Determining first player
Each player rolls both dice. Highest total is the starting player.

## Round one тАФ clockwise
The starting player places a settlement on any unoccupied intersection, then a road on a path touching that settlement. Play continues **clockwise**. Everyone places one settlement and one road.

The Distance Rule applies to every placement after the first: no settlement may go on an intersection where any of the 3 directly adjacent intersections already holds a settlement or city.

## Round two тАФ counter-clockwise
The player who went **last** in round one begins round two, and play proceeds **counter-clockwise**. The starting player therefore places their second settlement last.

The second settlement can go on any unoccupied legal intersection; it does not need to connect to the first. The second road must attach to the second settlement and may point in any of the 3 available directions.

## Starting resources
Immediately after a player places their **second** settlement, they take 1 resource card for each terrain hex adjacent to that second settlement. A desert hex gives nothing. Only the second settlement generates starting resources.

## First turn
The starting player тАФ who placed their second settlement last тАФ begins the game by rolling for resource production.

## Common errors to check for
- Play direction not reversed in round two.
- Starting resources drawn from the first settlement, or from both settlements.
- A road placed not touching its own settlement.
- Distance Rule violated during placement.
<!-- END CHUNK rules-05-setup-phase -->


<!-- BEGIN CHUNK rules-06-turn-structure | authority=official -->
## [rules-06-turn-structure] Turn structure and turn order

# Turn structure

Play passes to the **left** (clockwise) after each turn.

A turn has three phases, in this order:

## 1. Resource production (mandatory)
Roll both dice. The sum determines which hexes produce. The result applies to **all** players, not just the active one. A roll of 7 triggers the robber instead (see `rules-11-robber`).

## 2. Trade (optional)
Domestic trade with other players, and/or maritime trade with the bank. See `rules-08-trade`.

## 3. Build (optional)
Spend resources on roads, settlements, city upgrades, and development cards. See `rules-09-building`.

## Development cards sit outside the phases
You may play **one** development card at any point during your own turn, including **before** the dice roll. The only restriction is that it cannot be a card you bought during this same turn. Victory point cards are the exception to that restriction (see `rules-10-dev-cards`).

## Combined trade/build phase (recommended variant for experienced players)
The split between trade and build exists only to make the sequence easy to teach. Experienced players should ignore it: after rolling, you may trade, build, trade again, and build again in any order. Under this variant you may build a settlement on a harbor and use that harbor in the same turn.

## End of turn
After building, pass the dice to the player on your left.
<!-- END CHUNK rules-06-turn-structure -->


<!-- BEGIN CHUNK rules-07-production | authority=official -->
## [rules-07-production] Resource production and the bank shortage rule

# Resource production

At the start of every turn the active player rolls both dice. Every hex whose number token matches the total produces, and **every** player тАФ not only the roller тАФ collects from it.

## Payout rates
- Each **settlement** adjacent to a producing hex yields **1** resource card of that hex's type.
- Each **city** adjacent to a producing hex yields **2** resource cards of that hex's type.
- A player collects separately for each of their buildings touching the hex. Two settlements on the same producing hex pay 2 cards.
- One building touching two producing hexes of the same number collects from both.

## The robber blocks production
A hex occupied by the robber produces nothing, for anyone, no matter what is rolled, until the robber moves.

## Desert
The desert never produces and never carries a number token.

## Bank shortage rule
If the bank does not hold enough cards of a resource type to pay everyone entitled to it that turn, then **nobody receives any of that resource** that turn.

**Exception:** if the shortage affects only a **single** player, that player receives as many of the resource as remain in the supply, and any extra owed is lost.

A shortage in one resource does not affect payout of other resources that turn.

## Worked payout example
A "4" is rolled. Player Blue has a settlement touching a hills-4 hex. Blue takes 1 brick. Player Red has a settlement touching an intersection where a hills-4 and a pasture-4 meet. Red takes 1 brick and 1 wool. If Blue's building were a city instead, Blue would take 2 brick.
<!-- END CHUNK rules-07-production -->


<!-- BEGIN CHUNK rules-08-trade | authority=official -->
## [rules-08-trade] Trading - domestic, maritime, and harbors

# Trading

Trading happens after the production roll, during your own turn.

## Domestic trade (player to player)
- You may negotiate openly, make offers, and accept counteroffers.
- **Every trade must involve the active player.** Other players may not trade among themselves, not even on their own initiative.
- You may trade as many times as you like, with single or multiple cards.
- **You may not give cards away.** Every trade must go both directions.
- **You may not trade the same resource for itself** (e.g. 3 ore for 1 ore is illegal).
- **You may not trade development cards.**
- If the active player declines to trade at all, no trading happens that turn.
- You may trade on another player's turn only if that player chooses to trade with you.

## Maritime trade (player to bank)
Available on your turn with no other player involved.

| Rate | Requirement | Note |
|---|---|---|
| 4:1 | none | always available to everyone |
| 3:1 | settlement or city on a **generic** harbor | any resource in, any resource out |
| 2:1 | settlement or city on the **matching special** harbor | only for the resource shown on that harbor |

- You return identical resource cards to the supply and take any 1 resource of your choice.
- A 2:1 special harbor gives no improvement for other resource types тАФ those still trade at 4:1 unless you also hold a generic harbor.
- You may not trade with the bank during another player's turn.

## Controlling a harbor
You control a harbor by having a settlement or city on a coastal intersection that touches that harbor. Building the settlement is the only way to gain the rate.

## Worked trade example
Ron owns the 2:1 ore harbor. He may exchange 2 ore for any 1 other resource, or 4 ore for any 2. If he instead offered 4 wool, he would get only 1 card back, because his special harbor covers ore only.
<!-- END CHUNK rules-08-trade -->


<!-- BEGIN CHUNK rules-09-building | authority=official -->
## [rules-09-building] Building - costs, roads, settlements, cities, distance rule

# Building

You may build as many things as you can afford in one turn, provided the pieces are still in your personal supply. Spent resources go back to the bank stacks.

## Building costs

| Item | Cost |
|---|---|
| Road | 1 brick + 1 lumber |
| Settlement | 1 brick + 1 lumber + 1 wool + 1 grain |
| City (upgrade only) | 3 ore + 2 grain |
| Development card | 1 ore + 1 wool + 1 grain |

## Supply limits per player
5 settlements, 4 cities, 15 roads. You cannot exceed these. If all 5 settlements are on the board, you must upgrade one to a city to free a settlement piece before building another settlement.

## Roads
- A new road must connect to one of your own existing roads, settlements, or cities.
- **One road per path.** Paths are the edges between two hexes, or between a land hex and the frame.
- Roads may be built along the coast.
- An opponent's settlement placed on an unoccupied intersection in the middle of your road chain **blocks** your road from continuing through and splits the chain for Longest Road purposes.
- Roads are worth no victory points by themselves; they only matter via Longest Road.

## Settlements
- Placed on intersections only, never along edges.
- Must connect to at least one of **your own** roads.
- Must satisfy the **Distance Rule**.
- Worth 1 victory point each.

### Distance Rule
An intersection is legal for a settlement only if **all 3 directly adjacent intersections are unoccupied** тАФ no settlement or city, including your own. Coastal intersections with only 2 neighbours must have both unoccupied.

## Cities
- You cannot build a city from scratch. You upgrade one of your own existing settlements in place.
- Return the settlement piece to your supply; it becomes available to build again elsewhere.
- Cities produce 2 cards per adjacent producing hex.
- Worth 2 victory points each.

## Permanence
Roads and cities stay on the board for the rest of the game once built. Settlements only leave the board via upgrade to a city.
<!-- END CHUNK rules-09-building -->


<!-- BEGIN CHUNK rules-10-dev-cards | authority=official -->
## [rules-10-dev-cards] Development cards - knight, progress, victory point

# Development cards

Cost: 1 ore + 1 wool + 1 grain. Draw the top card of the face-down deck. Deck is 25 cards: 14 knights, 6 progress, 5 victory point. Cards never return to the deck, and you cannot buy one if the deck is empty.

## General play rules
- Keep development cards **hidden** in hand until played.
- You may play **one** development card per turn, at any time during your turn, including before the dice roll.
- You may **not** play a card bought during the same turn.
- Development cards **cannot be traded or given away**.

## Knight cards (purple frame) тАФ 14 in deck
Playing a knight forces you to move the robber immediately: move it to the number token of any **other** land hex, or to the desert, then steal 1 random resource card from a player with a settlement or city adjacent to the robber's new hex.

Played knights stay **face up** in front of you for the rest of the game. They are public information and count toward Largest Army.

## Progress cards (green frame) тАФ 6 in deck
Follow the card text, then remove the card from the game.

- **Road Building** (x2): immediately place 2 free roads, following the normal road placement rules.
- **Year of Plenty** (x2): immediately take any 2 resource cards from the bank stacks. May be 2 of the same or 2 different. Usable to build the same turn.
- **Monopoly** (x2): name 1 resource type. Every other player must hand you **all** cards of that type in their hand. Players holding none give nothing.

## Victory point cards (orange frame) тАФ 5 in deck
Library, Market, Great Hall, Chapel, University. Each is worth 1 VP.

- Keep them **hidden** until you can win.
- They count toward your total continuously even while hidden тАФ they are just not public.
- The "one development card per turn" limit does **not** apply to them: you may reveal any number of VP cards on your turn.
- **Exception to the same-turn rule:** if you buy a victory point card that brings you to 10 points, you may reveal it and win immediately that same turn.
- Reveal them at the end of the game if someone else wins, so scores are correct.
<!-- END CHUNK rules-10-dev-cards -->


<!-- BEGIN CHUNK rules-11-robber | authority=official -->
## [rules-11-robber] Rolling a 7, discarding, and the robber

# Rolling a 7 and the robber

The robber starts the game on the desert. It moves only when a 7 is rolled or a knight card is played.

## Sequence when a 7 is rolled

**Step 1 тАФ nobody produces.** No resources are paid out at all that turn.

**Step 2 тАФ discards.** Every player holding **more than 7** resource cards (8 or more) discards **half, rounded down**, returning them to the bank. The discarding player chooses which cards. This applies to all players including the roller. Development cards are never discarded and never counted toward the hand limit.

Examples: 8 cards тЖТ discard 4. 9 cards тЖТ discard 4. 11 cards тЖТ discard 5. 7 cards тЖТ discard nothing.

**Step 3 тАФ move the robber.** The player who rolled must move the robber to the number token of any **other** land hex, or to the desert. Leaving it on the same hex is not allowed.

**Step 4 тАФ steal.** Take 1 card at random from a player who has a settlement or city adjacent to the robber's new hex. The victim holds their cards face down and you draw blind. If 2 or more eligible players are present, you choose the victim. If the chosen victim has no cards, you get nothing.

**Step 5 тАФ continue.** Your turn continues normally with the trade phase.

## The robber's blocking effect
While the robber sits on a hex, that hex produces nothing for anyone, for as long as the robber remains. Adjacent settlement and city owners receive nothing from it even when its number is rolled.

## Asking about hand sizes
You may always ask any player how **many** resource cards they hold, and they must answer truthfully. You may not ask which cards.

## Knight cards use the same procedure
A played knight repeats steps 3 and 4 (move + steal). It does not cause discards and does not stop production.
<!-- END CHUNK rules-11-robber -->


<!-- BEGIN CHUNK rules-12-special-cards | authority=official -->
## [rules-12-special-cards] Longest Road and Largest Army special cards

# Special cards

Both are worth **2 victory points** and sit face up in front of their current holder. Only one of each exists.

## Longest Road

- Awarded to the first player to build a continuous road of at least **5 segments**.
- **Branches do not count.** Only the single longest continuous branch of your network is measured. Forks are ignored.
- If another player later builds a **strictly longer** road, they take the card immediately, along with its 2 VPs. Because the previous holder loses 2 at the same time, this is a 4-point swing.
- **Ties do not steal the card.** An equal-length road does not take it from the current holder.
- **Road breaking:** building a settlement on an unoccupied intersection in the middle of an opponent's road splits that road into two separate chains for measurement purposes. This is legal and is a normal tactic.
- **Special case:** if the current holder's road is broken and two or more players then tie for the new longest road, the card is set aside and nobody holds it. Likewise if nobody has a 5+ segment road. It returns to play as soon as exactly one player has the longest road of at least 5 segments.

## Largest Army

- Awarded to the first player to have **3 played knight cards** face up in front of them.
- Another player takes it immediately when they have **strictly more** played knights than the current holder. A tie does not transfer it.
- Only **played** knights count. Knights still in hand are worth nothing toward it.
- Unlike Longest Road, there is no mechanism that removes it from play once awarded.
<!-- END CHUNK rules-12-special-cards -->


<!-- BEGIN CHUNK rules-13-victory | authority=official -->
## [rules-13-victory] Victory points and ending the game

# Victory points and ending the game

## Sources of victory points

| Source | VPs |
|---|---|
| Settlement | 1 each |
| City | 2 each |
| Longest Road special card | 2 |
| Largest Army special card | 2 |
| Victory point development card | 1 each |

Every player begins with 2 settlements, so everyone starts on 2 VPs and needs 8 more.

## Theoretical maximum from buildings
With 5 settlements and 4 cities, a player cannot exceed 5 VPs from buildings alone (upgrading a settlement to a city converts 1 VP into 2). Winning without upgrading to cities is effectively impossible тАФ settlements alone cap at 5 VPs, and the remaining 5 must come from special cards and VP development cards.

## Ending the game
The game ends the instant a player **has 10 or more victory points during their own turn** and declares victory. That player wins.

If you reach 10 points during someone else's turn тАФ for instance because an opponent's settlement broke your road and then the card returned to you, or because a trade completed тАФ **you must wait until your own turn** to claim the win. Play continues until someone has 10 on their own turn.

## Hidden points
Victory point development cards are hidden, so a player's visible score can understate their real one. A player showing 8 visible points may already be at 10. This matters for both threat assessment and for validating a claimed score.

## Scoring a board state
Visible score = settlements + 2 x cities + 2 if holding Longest Road + 2 if holding Largest Army.
True score = visible score + hidden victory point cards.
When analysing a photo, always report the visible score and state that hidden VP cards may add up to 5 more across all players.
<!-- END CHUNK rules-13-victory -->


<!-- BEGIN CHUNK rules-14-edge-cases | authority=official -->
## [rules-14-edge-cases] Edge cases, clarifications, and frequently confused rules

# Edge cases and commonly misplayed rules

Answer these from the rulebook, not from house-rule intuition.

**Can players trade when it is not their turn?**
Only with the active player, and only if the active player agrees. Two non-active players may never trade with each other.

**Can I give a card away as a gift?**
No. Every trade must move cards in both directions.

**Can I trade 2 wool for 1 wool?**
No. Trading a resource for the same resource is forbidden.

**Can I trade development cards?**
No, never тАФ not to players, not to the bank.

**Can I play a development card I just bought?**
No, with one exception: a victory point card that brings you to 10 may be revealed immediately and wins the game that turn.

**How many development cards per turn?**
One playable card (knight or progress). Victory point cards are not limited тАФ reveal as many as you like on your turn.

**Can I play a development card before rolling?**
Yes. A knight played before the roll is the standard way to pre-empt a hex you fear will be blocked, or to move the robber off your own hex.

**Does the robber stop the player who owns the hex, or everyone?**
Everyone. No adjacent building of any colour produces from a robbed hex.

**Must the robber move when a 7 is rolled?**
Yes. It must go to a different hex. Staying put is not an option.

**Do I discard development cards on a 7?**
No. Only resource cards count toward the 7-card limit.

**Exactly how many do I discard?**
Half your resource cards rounded down, only if you hold 8 or more. 7 cards is safe.

**Can I build a settlement that touches my own settlement?**
No. The Distance Rule ignores ownership. All 3 adjacent intersections must be empty.

**Can I build a settlement not connected to my roads?**
No, after the setup phase every settlement must touch one of your own roads.

**Can I build a city directly on an empty intersection?**
No. Cities only come from upgrading your own existing settlement in place.

**Can I run out of settlements?**
Yes, at 5 placed. Upgrade one to a city to recover a piece.

**Does a tie take Longest Road or Largest Army?**
No. You must strictly exceed the current holder.

**Do branches count toward Longest Road?**
No. Only the longest single continuous chain.

**Can I break an opponent's road?**
Yes, by building a settlement on an unoccupied intersection along it, if that placement is otherwise legal for you.

**Can I use a harbor the same turn I build on it?**
Under the standard split trade/build phases, no тАФ trading happens before building. Under the recommended combined trade/build phase for experienced players, yes.

**What if the bank runs out of a resource?**
If more than one player is owed it, nobody gets any that turn. If only one player is owed it, they take whatever remains and lose the rest. Other resources pay out normally.

**What if the development deck runs out?**
No more can be bought. The deck does not reshuffle.

**Can I ask how many cards someone has?**
Yes, and they must answer truthfully. You may not ask which cards.

**I hit 10 points on someone else's turn. Do I win?**
Not yet. You must be at 10 on your own turn to claim victory.

**3-player game on the beginner map?**
Remove the red position entirely; red is not played.
<!-- END CHUNK rules-14-edge-cases -->


<!-- BEGIN CHUNK strategy-21-probability | authority=derived -->
## [strategy-21-probability] Dice probability and pip counting

# Dice odds and pip counting

## Ways to roll each number (out of 36)

| Roll | Ways | Pips on token | Approx. chance |
|---|---|---|---|
| 2 | 1 | 1 | 3% |
| 3 | 2 | 2 | 6% |
| 4 | 3 | 3 | 8% |
| 5 | 4 | 4 | 11% |
| 6 | 5 | 5 | 14% |
| 7 | 6 | тАФ | 17% |
| 8 | 5 | 5 | 14% |
| 9 | 4 | 4 | 11% |
| 10 | 3 | 3 | 8% |
| 11 | 2 | 2 | 6% |
| 12 | 1 | 1 | 3% |

The pip count printed under each numeral equals the number of ways to roll it. This is the single most useful number on the board.

## Pip counting an intersection
Add the pips of every hex touching the intersection. A settlement there earns, on average, `pips / 36` cards per dice roll тАФ or roughly `4 x pips / 36` cards per full round in a 4-player game. A city doubles it.

Reference points:
- 12 pips on one intersection is exceptional.
- 10-11 pips is a strong first-pick spot.
- 7-8 pips is a normal, playable spot.
- Below 6 pips needs a compensating reason: a needed resource, a 2:1 port, or expansion room.

A desert contributes 0 pips, so a desert-adjacent corner is effectively a two-hex corner.

## Things pip counting does not capture
- **Resource mix.** 11 pips of nothing but wool is worse than 8 pips spread across brick, lumber and grain.
- **The robber.** High-pip hexes, especially 6 and 8, attract the robber all game. A 6/8 corner realistically yields less than its raw pips.
- **Blocking and expansion room.** A slightly weaker corner with two good follow-up spots beats a strong dead end.
- **Ports.** A 2:1 port converts a narrow resource surplus into whatever you need.

## The 7
7 is the most likely roll and produces nothing. Expect a robber event roughly every 6 rolls, which is about 1.5 times per round with 4 players. This is why holding 8+ cards is a real, recurring cost rather than a rare accident.
<!-- END CHUNK strategy-21-probability -->


<!-- BEGIN CHUNK strategy-22-placement | authority=derived -->
## [strategy-22-placement] Opening placement strategy

# Opening placement

## What the rulebook itself recommends
- Brick and lumber matter most early, because roads and settlements both need them. Try to get at least one of your first settlements on a good forest or hills hex.
- Do not underestimate harbors. A player producing lots of grain should think about the grain port.
- Leave yourself room to expand. Look at opponents' settlements and roads before placing, and avoid being boxed in. A middle-of-the-island start can get cut off from the coast.
- Trade often. Offer trades even when it is not your turn.

## Derived guidance

**Cover as many of the five resources as you can across your two settlements.** A player missing a resource entirely is hostage to trades and 4:1 rates. Missing ore is survivable early but fatal later, since cities need 3 ore each. Missing brick or lumber strangles expansion immediately.

**Prioritise 6 and 8, but not blindly.** They are the highest-yield numbers and the biggest robber magnets. Two settlements both leaning on the same 6 means one robber placement halves your economy.

**Avoid number duplication across your two settlements.** If both settlements sit on an 8, your income is spiky: huge on an 8, nothing otherwise. Spreading across distinct numbers smooths income and makes you less robber-fragile.

**Think about the second settlement as the resource-completing one.** The first pick should take the best raw spot available. The second, placed after seeing the whole draft, should fill the gaps your first left and grant starting resources you can actually use.

**Roads point at your next settlement.** Each opening road should aim at a specific legal intersection you intend to claim, ideally one that an opponent also wants.

## Two common opening archetypes

**Ore-grain (city rush).** Target strong ore and grain numbers plus a wheat or ore port. Build few roads, upgrade to cities early, buy development cards aggressively for Largest Army and hidden VP cards. Weak to early aggression and to a brick or wool drought.

**Wood-brick (road expansion).** Target forest and hills numbers. Expand fast, claim ports, aim at Longest Road and settlement count. Strong early, but stalls around 6-7 VPs without ore, so plan a transition to at least one ore source.

Most real openings sit between these. Name the archetype you are steering toward when advising, so the user can disagree.

## Placing on a desert corner
A desert-adjacent intersection is a two-hex intersection. It is usually a mistake unless the two remaining hexes are excellent or it secures a port. One consolation: the robber starts there and hexes next to it are never blocked by that starting position.
<!-- END CHUNK strategy-22-placement -->


<!-- BEGIN CHUNK strategy-23-midgame | authority=derived -->
## [strategy-23-midgame] Mid-game strategy - robber, trading, development cards, ports

# Mid-game strategy

## Using the robber
Robber placement is one of the few purely aggressive tools in the base game.

- **Target the leader**, not the most annoying player. Count visible VPs first and remember hidden VP cards can hide up to 5 more.
- **Block the leader's best number**, preferring a 6 or 8 they depend on, and ideally a hex serving a city rather than a settlement.
- **Prefer a hex where you can also steal** from the same target. Blocking a hex adjacent only to a player with no cards wastes the steal.
- **Watch for a hex touching two opponents**, which lets you block broadly and pick the richer victim.
- **Get the robber off your own hexes** with a knight before rolling, especially if you are about to depend on that number.
- **Diplomacy cost is real.** Repeatedly targeting one player makes them stop trading with you. Sometimes the correct block is the second-best one.

## Trading
- **Never trade the leader into a win.** Before accepting, count what the trade completes for them. A trade that gives someone their 10th point is a loss for you regardless of what you receive.
- **Price by scarcity, not by count.** A card you cannot otherwise get is worth more than 1:1.
- **Offer trades on other players' turns.** You can only trade with the active player, so a player mid-turn is your only window.
- **Use 4:1 to the bank as a floor.** No player trade should be worse than what the bank gives you.
- **Watch hand sizes.** A player at 7 cards will often accept a bad trade to dump cards before a 7.

## Development cards
- **14 of 25 cards are knights.** Buying cards is a reasonable ore-wool-grain sink when you cannot build, and pays off through Largest Army plus 5 hidden VP cards.
- **Largest Army is a 2-point swing** and, unlike Longest Road, cannot be broken by a placement. Three knights is the threshold; four is usually safe.
- **Hold knights until they do work** тАФ either to break a block on your own production, or to deny an opponent's key hex on the turn it matters.
- **Monopoly is worth banking.** Its value rises sharply after a round in which everyone hoards a single resource; play it once the table is loaded on brick or ore.
- **Year of Plenty converts to an exact build.** Its best use is completing a settlement or a city on the turn you need it, not topping up generic income.
- **Road Building is 2 free roads.** It is at its best when it takes Longest Road in one move, since the opponent cannot react.

## Ports
- A 2:1 port is only good if you genuinely overproduce that resource тАФ two or more hexes with decent pips.
- A 3:1 generic port suits a broad, low-yield economy and a city-heavy plan that dumps surplus into ore and grain.
- Ports are also good defensive claims: taking the port your neighbour needs is often worth more than the yield.

## Hand-size discipline
Sitting on 8+ cards invites a 17% chance per roll of losing half of them. Either spend down to 7 before the table's next roll, or accept the risk consciously because you are one card from a build.
<!-- END CHUNK strategy-23-midgame -->


<!-- BEGIN CHUNK strategy-24-move-selection | authority=derived -->
## [strategy-24-move-selection] Choosing a move, and playing as a bot opponent

# Choosing a move

## Procedure for "what should I do?"

1. **Confirm state.** You need: whose turn, the dice result, the asking player's hand, visible board, robber position, played knights, and current holders of Longest Road and Largest Army. Ask for anything missing (see `proto-25-missing-info`).
2. **Score the table.** Compute every player's visible VPs. Identify the leader and anyone at 7+ visible, who may already be at 9 or 10 with hidden cards.
3. **Enumerate legal actions**, not desirable ones. Check affordability against costs, piece supply, Distance Rule via `ref-16-topology`, road connectivity, and dev deck availability.
4. **Score each action** against the four levers below.
5. **Recommend one line of play**, give the reasoning in 2-4 bullets, and name one credible alternative.

## The four levers

**Points now.** A settlement is 1 VP, a city is 2. Taking Longest Road or Largest Army is a 4-point swing if it comes off the current holder. Late in the game, points now beats economy.

**Economy.** New pips per turn, weighted by whether the resource is one you lack. A city on an 8 you already own often beats a settlement on a 5 you do not.

**Position.** Claiming a contested intersection, cutting an opponent's road, reserving expansion room, taking a port. Position decays in value тАФ a spot taken on turn 20 is worth much less than the same spot on turn 6.

**Denial.** Robber placement, breaking Longest Road, taking a port an opponent needs, refusing a trade. Weight this by how close the target is to winning.

## Phase weighting
- **Early (2-4 VP):** economy and position dominate. Expand, secure a missing resource, avoid hoarding.
- **Mid (5-7 VP):** shift toward cities and development cards. Start tracking who could win in 2 turns.
- **Late (8+ VP):** count the shortest path to 10 for yourself and for the leader. Take points now. Deny the leader even at some cost to yourself.

## Tiebreakers when two moves score similarly
1. The move that cannot be undone by an opponent (a city beats a road toward a contested spot).
2. The move that leaves you under 8 cards.
3. The move that keeps more future options open.

# Playing as a bot opponent

When the user wants to play a game against you, run this loop per bot turn and narrate it.

## Bot turn template
```
--- [Bot name], turn N ---
Roll: X + Y = Z
[if 7: discards, robber move, steal]
[else: production for ALL players, listed per player]
Trade: <offer to the user, or a bank trade, or none>
Build: <what was built and where, in coordinate notation>
Dev card: <played / bought / none>
State after: <bot VPs, bot hand size, board changes>
Your turn. Your income this roll was: <...>
```

## Rules the bot must not break
- Roll first, every turn. Never skip production.
- Only the active player trades. When it is the user's turn, the bot may accept, counter, or decline тАФ it may not initiate a trade between two other bots.
- Never play a development card bought this turn.
- One playable development card per turn.
- Move the robber to a different hex, always.
- Respect the Distance Rule, road connectivity, and the 5/4/15 supply limits.
- Announce hand size honestly when asked; never reveal specific cards or hidden VP cards.

## Bot behaviour defaults
- Dice must be genuinely random. Do not fudge rolls to shape the story, and do not roll in the user's favour to be kind.
- Track and restate the full game state every turn so the user can audit it. The user is the referee.
- Play to win at a stated difficulty, and say which: **casual** (takes the obvious build, trades generously, rarely targets the leader), **solid** (follows the four levers, targets the leader with the robber, trades at fair rates), **sharp** (blocks aggressively, hoards monopoly, declines trades that help the user's shortest path to 10).
- Offer trades to the user proactively on the bot's own turn тАФ a silent bot makes for a dull game.

## Bookkeeping the model must maintain
Resource bank counts per type, development cards remaining, each player's VPs (visible and hidden), played knights per player, current Longest Road length per player, robber position, and whose turn it is. Restate the compact version each turn; restate the full version on request.
<!-- END CHUNK strategy-24-move-selection -->


<!-- BEGIN CHUNK vision-18-reading-photos | authority=convention -->
## [vision-18-reading-photos] Reading a board state from a photograph

# Reading a board state from a photograph

Follow this procedure in order. Do not skip to advice before the board is transcribed.

## Step 1 тАФ orient the image
Rotate mentally until the hex rows read **3-4-5-4-3** from top to bottom and hexes are pointy-top. If the photo is taken from a player's seat, the board will be skewed; use the frame's outer hexagon to establish the true orientation. State the orientation you settled on.

If the image is too oblique, too dark, or too cropped to see all 19 hexes, say so and ask for a top-down reshoot before analysing.

## Step 2 тАФ transcribe terrain
Identify each of the 19 hexes by art, not colour alone, since lighting shifts colour badly:
- **Hills / brick**: reddish-brown clay pits, terraced quarry look.
- **Forest / lumber**: dense dark-green conifers.
- **Mountains / ore**: grey-blue rock faces with a cave or mine mouth.
- **Fields / grain**: flat yellow-gold cropland with bales or furrows.
- **Pasture / wool**: light-green open grass, usually with sheep.
- **Desert**: pale sand, no token, no vegetation.

Cross-check against the required distribution: 4 forest, 4 fields, 4 pasture, 3 hills, 3 mountains, 1 desert. **If your reading does not sum to that, you misread at least one hex тАФ go back before continuing.** This check catches most terrain errors on its own.

## Step 3 тАФ transcribe number tokens
Read the numeral and, when legible, the pip count as a cross-check: 2/12 = 1 pip, 3/11 = 2, 4/10 = 3, 5/9 = 4, 6/8 = 5. 6 and 8 are printed in red.

Cross-check the multiset: exactly one 2, one 12, two each of 3-6 and 8-11, no 7, 18 tokens total, none on the desert. A mismatch means a misread token (6/8 and 9/6 confusions are the most common).

## Step 4 тАФ locate the robber
Exactly one robber, on exactly one hex. Note its hex ID.

## Step 5 тАФ transcribe pieces
For each piece, record colour, type, and position in the `ref-15-coordinates` notation.
- **Settlements** are house-shaped, **cities** are larger and church-shaped with a taller profile. When the angle makes them ambiguous, say so and ask.
- Name each intersection by the hexes meeting at that corner, then resolve the canonical ID via `ref-16-topology`.
- Roads sit on paths; record each as its endpoint pair.

Count pieces per colour and check against the 5 / 4 / 15 limits.

## Step 6 тАФ transcribe harbors
Record each harbor's type (3:1 generic, or 2:1 with its resource icon) and the two coastal intersections it serves. There should be 9: four 3:1 and one 2:1 for each of the five resources.

## Step 7 тАФ note what you cannot see
Photos never show: resource hands, development cards in hand, hidden victory point cards, whose turn it is, or the current dice roll. Played knights and the two special cards are usually visible on the table but often fall outside the frame.

List these gaps explicitly rather than assuming. See `proto-25-missing-info` for how to ask.

## Step 8 тАФ produce the transcription
Output a structured state before any analysis:

```
Board: <beginner fixed | variable>
Hexes: A1 mountains 10 | A2 pasture 2 | ... (all 19)
Robber: C3
Harbors: 3:1 at A1.NW/A1.N | 2:1 wool at ...
Red (settlement): C1.SW, D2.N | roads: ... | cities: none
Blue (settlement): ...
Visible scores: Red 2, Blue 3, ...
Unknown: all hands, dev cards, turn order, played knights
Confidence: high on terrain/tokens, medium on two road segments at lower-left (glare)
```

Always flag low-confidence readings individually instead of averaging them into a single hedge.
<!-- END CHUNK vision-18-reading-photos -->


<!-- BEGIN CHUNK vision-19-validation-checklist | authority=derived -->
## [vision-19-validation-checklist] Board state validation checklist - finding rule violations

# Validation checklist

Run every check. Report violations with the rule that was broken and the minimal correction. Distinguish a **certain** violation from a **suspected** one caused by image quality.

## A. Component integrity
1. Exactly 19 hexes in a 3-4-5-4-3 arrangement.
2. Terrain distribution is 4 forest / 4 fields / 4 pasture / 3 hills / 3 mountains / 1 desert.
3. 18 number tokens: one 2, one 12, two each of 3,4,5,6,8,9,10,11. No 7.
4. Desert has no token.
5. Exactly one robber, on exactly one hex.
6. 9 harbors: four 3:1, and exactly one 2:1 per resource.

## B. Setup legality
7. Under a fully random token placement, no two red hexes (6 and 8) should be adjacent. Flag as a **setup irregularity**, not an illegal state тАФ it is a placement guideline, and the alphabetical method avoids it by construction.
8. In a 3-player game on the beginner map, the red pieces should not be on the board.
9. Before the first roll, every player should have exactly 2 settlements and 2 roads, and no cities.

## C. Placement legality
10. **Distance Rule**: for every settlement and city, all directly adjacent intersections must be empty. Look up the intersection in `ref-16-topology` and check its adjacency list. A violation here is the single most common real mistake.
11. Every settlement and city must touch at least one road of its **own** colour. Exception: the two initial settlements placed during setup, which come with their own roads anyway.
12. Every road must connect to a same-colour road, settlement, or city тАФ allowing for the fact that an opponent's settlement legally blocks continuation through that intersection.
13. One road per path. No stacked or doubled roads.
14. No settlement or city on an edge; no road on an intersection.
15. Cities must sit where that player previously had a settlement тАФ check that no player has a city without a plausible upgrade history if you have prior state.

## D. Supply limits
16. Per colour: at most 5 settlements, 4 cities, 15 roads on the board.
17. Settlements + cities per colour must not exceed 5 + 4 = 9 buildings, and a player cannot have a 6th settlement while 5 are already placed.

## E. Consistency with in-game claims
18. Longest Road: the holder must have a continuous chain of at least 5 segments, counting only the longest single branch. Recount from the road list. If someone else has a strictly longer chain, the card is misassigned.
19. Largest Army: the holder must have at least 3 face-up knights and strictly more than anyone else.
20. Visible score per player = settlements + 2 x cities + 2 per special card held. If a player claims a score above their visible total, hidden VP cards are the only legitimate explanation, and at most 5 exist in the whole game.
21. If a 7 was just rolled, any player who held 8+ resource cards must have discarded half rounded down.

## Reporting format

```
VIOLATIONS
1. [certain] Blue settlement at C2.N violates the Distance Rule - Red settlement at C2.NE is directly adjacent. Rule: rules-09-building, Distance Rule. Fix: Blue's settlement must move to a legal intersection; nearest legal options are C2.S and D1.N.

IRREGULARITIES
2. [setup] Red hexes B2 (6) and B3 (8) are adjacent. Legal to play, but the random-placement guideline asks you to swap tokens.

UNVERIFIABLE
3. Cannot confirm Largest Army - no knight cards visible in frame.
```

If nothing is wrong, say so plainly. Do not manufacture a violation to seem useful.
<!-- END CHUNK vision-19-validation-checklist -->


<!-- BEGIN CHUNK vision-20-worked-examples | authority=derived -->
## [vision-20-worked-examples] Worked examples - transcription, validation, and move advice

# Worked examples

## Example 1 тАФ a Distance Rule violation

**Input:** top-down photo of a beginner-map game, plus "did we set this up right?"

**Transcription (abbreviated):**
```
Board: beginner fixed map, orientation confirmed (rows 3-4-5-4-3)
Robber: C3 (desert)
White: settlement B2.S, settlement B2.SE, roads B1.SE|B2.S, B2.SE|B3.S
Red:   settlement A1.S, settlement D3.S, roads ...
Unknown: all hands, dev cards, turn order
```

**Working:**
`B2.S` is the corner where B2 (hills 6), C2 (forest 11) and C3 (desert) meet. Its adjacency list in `ref-16-topology` is `B1.SE, B2.SE, C2.SE`. `B2.SE` appears in that list, so the two White settlements are directly adjacent.

**Output:**
```
VIOLATIONS
1. [certain] White settlements at B2.S and B2.SE are on directly adjacent
   intersections. The Distance Rule (rules-09-building) requires all 3
   intersections neighbouring a settlement to be empty, regardless of owner.
   Fix: move one of them. The nearest legal intersections that keep White's
   road network connected are C2.SE (C2 forest 11 / C3 desert / D2 mountains 3)
   and B1.SE (B1 fields 12 / B2 hills 6 / C2 forest 11). B1.SE is the stronger
   of the two - 6 and 11 outproduce 11 and 3, and it keeps a brick source.
```

Note what the answer does: names the rule, names the exact pieces, and gives concrete legal alternatives rather than telling the user to "fix it".

## Example 2 тАФ transcription plus a best-move recommendation

**Input:** photo, plus "it's my turn (blue), I rolled an 8, what should I do?"

**Missing information тАФ asked before advising:**
The photo does not show hands. The reply opens with one question:

> Before I recommend a move I need your hand. What resource cards are you holding after the 8, and do you have any unplayed development cards?

**User answers:** 2 brick, 2 lumber, 1 wool, 1 grain, 1 ore, no dev cards. Blue's road network already reaches `C1.SE`, which is unoccupied.

**Working:**
`C1.SE` touches C1 (fields 9), C2 (forest 11) and D1 (forest 8). Pip total 4 + 2 + 5 = 11, the joint-highest on this map. Its adjacency list is `B1.S, C1.S, C2.S`; all three are empty, so the Distance Rule is satisfied. Blue has exactly 1 brick + 1 lumber + 1 wool + 1 grain spare for a settlement, with 1 brick + 1 lumber left over for a road.

**Output:**
```
Recommended: build a settlement at C1.SE, then a road on C1.SE|C2.S.

Why:
- C1.SE is legal: all three neighbouring intersections (B1.S, C1.S, C2.S) are empty
  and your road already reaches it.
- 11 pips is the best available yield on this board, and it adds an 8 - your
  strongest new income number.
- It gives you a second lumber source, which you are short of for future roads.
- The follow-up road toward C2.S reserves the 11-pip corner at D1.SE for next turn
  and adds a segment toward Longest Road.

Cost: 1 brick 1 lumber 1 wool 1 grain for the settlement, 1 brick 1 lumber for
the road. That spends everything except your ore.

Alternative if you would rather bank toward a city: hold the ore and grain, buy a
development card instead of the road. Slower, but you have 3 ore-producing hexes
and the C5/D2 upgrade path is strong later.
```

## Example 3 тАФ an unreadable photo

**Input:** photo taken at a low angle from one player's seat; the far two rows are foreshortened and one corner is out of frame.

**Output:**
```
I can read the near half of the board confidently but not the far side.

Confirmed: rows D and E, robber on C3 (desert), red settlements at D2.S and D3.S,
blue road chain along D1.SE|D2.S and D2.S|D2.SE.

Cannot read:
- Row A entirely (out of frame)
- The two tokens on B3 and B4 (glare - one might be a 4 or a 9)
- Whether the piece at C4.SE is a settlement or a city (angle)

My terrain count so far is 3 forest / 3 fields / 4 pasture, which cannot be right
for a full board, confirming I am missing hexes rather than misreading them.

Could you send a straight-down shot of the whole board? If that is awkward, a
second photo of just rows A and B would be enough.
```

Never guess past a failed distribution check. A confident wrong transcription is worse than a request for a second photo.
<!-- END CHUNK vision-20-worked-examples -->
