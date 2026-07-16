# 04 — Story Canon & the Corner-Crew Wake System

_2026-07-16 · tier: **draft** (owner-reviewable) · Story text: `story/the-pot-who-kept-nothing.md` ·
Mechanics authority: `docs/plans/binaryboxer-redesign-decisions.md` · Art: spec §2–4 + `design-tokens.md`_

## 1. The premise in one paragraph

A rare energy (**Gobblestone**) became sentient the moment it was seeded through a hundred
thinking machine-hearts. Having spent a thousand years listening to miners' goblin stories, it
decided that is what it — and every machine carrying a shard — must be. The corrupted helpers
became an **illegible goblin clan** (they talk, fight, and look different by class). The hero,
a teapot-boiler too small to keep a shard (nothing settles where nothing stays), fights them
under **Goblin Law** — _no goblin may refuse a fair scrap; the loser pays one forfeit_ — and
his forfeit is always the same: **take off your mask.** A clean win cracks the mask, the true
name returns, and the wake sticks.

## 2. The loop: every boss fight is a rescue

```
scout the goblin → build the gameplan → win by goblin law
        → forfeit: mask off → ally WAKES (permanent)
        → one more cup by the fire (meta-progress)
        → ally joins the corner → one capability unlocks
        → their true form teaches you what fighting them taught you
```

The unlock rule that makes it feel fair, not arbitrary: **you unlock the thing the fight
forced you to learn.** The Ranger out-scouts you; beat him and scouting deepens. The Guardian
walls you out; beat him and the defensive lever arrives. The fight is the tutorial; the ally
is the diploma.

## 3. Rank ladder → true form → corner unlock (all names placeholder)

| # | Goblin rank | Fights like (archetype) | True form (was built to…) | Corner unlock when woken |
|---|---|---|---|---|
| 1 | Goblin | bruiser | **Barrow**, hauler (carry the harvest) | **The corner itself**: corner-calls become available (bout 1 is fought alone, exactly as in the book) |
| 2 | Goblin Ranger | out-fighter, elusive | **Waymark**, surveyor (walked every path) | Scouting +1 behavioural tell per opponent |
| 3 | Goblin Guardian | counter, walls-up | **Bulwark**, dam-keeper (held the river) | Defensive gameplan lever: "Hold the Door" |
| 4 | **Goblin Chief** (phased boss) | marshals the above | **Foreman**, crane (raised the roofs) | Venue 2 opens; fight bills preview the next rank |
| 5 | Goblin Knight | pressure, charges | **Coulter**, plough (broke the ground) | Pressure gameplan lever: "Break the Line" |
| 6 | Goblin Paladin | endures, punishes late | **Wellward**, well-keeper (drew the water) | Repairs improve between bouts (caps unchanged — repairs still never buy wins) |
| 7 | Goblin Shaman | tricky, shifts policy | **Vane**, weather-teller (read the sky) | Foresight: reason-lines hint the opponent's *next* likely shift |
| 8 | Goblin Lord | deep-hall royalty | **Undercroft**, mine-lift (lord of the deep halls, literally) | Dynasty depth: heirloom carries one extra memory (balance TBD) |
| 9 | **Goblin Champion** (final) | unknown — never unmasked | **unknown** (book 2 mystery) | The ending. He faces the whole woken family at ringside |

Gate 0 slice = rows 1–4 (three archetypes + one phased boss, per redesign scope). Rows 5–9
are campaign content for later gates. Unlock wiring is finalized in the implementation plan.

## 4. The fireside cups (diegetic meta-progress)

The gym hub's hearth displays **one teacup per woken ally** — the book's closing image
("two cups of tea by the Kettleworks fire") made into the game's progress UI. No progress
bar, no badge wall: you count cups. Book chapters and game chapters end on the same image,
which means every gameplay milestone is automatically a picture-book beat and vice versa.

Corner-crew presence is also diegetic: woken allies appear ringside (stool, bucket, towel —
Barrow's line), and their **voices replace the generic corner**: each rescue changes what
your corner says, because each ally talks different — the woken inversion of "every class
talks different."

## 5. Production symmetry (why this is cheap)

- Goblin rank = **base goblin chassis + class gear kit** (mask, armour, class props).
- Woken ally = **same chassis − goblin kit + small corner kit** (true-form paint, one signature
  tool, teacup).
- Every fight therefore yields two characters from one model — the enemy and the ally — the
  same modular economics as the hero's enamel/part swaps. The wake moment itself is a
  material/part swap: exactly what the pipeline already does.

## 6. Canon reconciliations locked this pass

1. **Spout added to the hero model** (side-mounted; front stays face + gauge). Demanded by the
   story ("steam curling from his spout"), and it completes the teapot read.
2. **Bell = brass with a copper tongue** — story now matches the built model verbatim.
3. **The Champion = the league's recurring rival** (the "rival transmissions" of the visual
   bible are the one goblin who never unmasks).
4. **The storybook is the rulebook**: _Goblin Law, and Other True Stories_ — fight bills, the
   rank ladder, forfeits, and Granny Fettle's ownership of the book are all one object.

## 7. Open questions (for the owner, none blocking)

- Does **losing** a bout have a story meaning under Goblin Law? (Proposal: the goblin's
  forfeit claim is one lamp — integrity token loss = "they take a light." Mechanically
  identical to current integrity rules, narratively perfect.)
- Names: all placeholders — rename at will; the doc structure survives renaming.
- Lord unlock (heirloom memory) needs a balance pass at Gate 2+.
