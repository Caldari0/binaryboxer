# 04 — Story Canon & the Kettleworks Gym (wake system v2)

_2026-07-16 · tier: **draft** (owner-reviewable) · v2 incorporates the owner's gym-manager pivot ·
Story text: `story/the-pot-who-kept-nothing.md` · Mechanics authority:
`docs/plans/binaryboxer-redesign-decisions.md` — **flagged for revision, see §8** · Art: spec §2–4_

## 1. The premise in one paragraph

A rare energy (**Gobblestone**) became sentient the moment it was seeded through a hundred
thinking machine-hearts, and — having spent a thousand years listening to miners' goblin
stories — decided that it, and every machine carrying a shard, must be **goblins**. The
corrupted helpers were the valley's working heroes; what's left of them are **Remnants**.
The dreaming stone invented its own tournament — a hybrid sport, boxing fused with football,
run gym-against-gym — and the goblin clan fields its Remnants in it, five to a gym, coached
by ranked goblins. **You are not the boxer. You are the coach.** You run the Kettleworks gym
(Granny Fettle's bench, the fire, the storybook of rules), and every fighter you free, buy,
train, or defeat is somebody's hero coming home.

## 2. The player fantasy and the loop

**You run a gym of at most five Remnants.** You hire, train, buy, and sell to make the gym
great. The gym earns **prestige two ways: victory or entertainment** — a losing bout that
thrills the crowd still feeds the gym's name.

```
scout the rival gym → set each bout's gameplan → FIXTURE: a card of bouts, five max
   → prestige from wins AND from entertainment
   → free Remnants two ways:
        BUY a fighter from a goblin gym  = ransom-rescue (they wake at your hearth)
        DEFEAT a gym leader's full card  = the LEADER wakes and joins as STAFF
   → staff unlock one gym capability each → climb toward the mountain
```

The unlock rule that keeps it fair: **you unlock what the fight forced you to learn.** The
fight engine already built (gameplans, tells, corner calls, reasons-as-UI) is unchanged — it
is the atomic unit; a fixture simply plays a card of them.

**Goblin Law binds all of it** (_no goblin may refuse a fair scrap; the loser pays one
forfeit, true and paid in full_). Your standing forfeit never changes: *take off your mask.*

## 3. The ladder: goblin gym leaders → your staff (all names placeholder)

Rival gyms are run by ranked goblins — gym leaders in the classic ladder sense. Their
fighters are unique goblin-dressed Remnants (buyable = rescuable). Beat a leader's full card
and the leader wakes, joins the Kettleworks, and staffs one gym function:

| # | Gym leader | True form (was built to…) | Staff role when woken → unlock |
|---|---|---|---|
| 1 | Goblin (Barrow) | hauler (carried the harvest) | **The Corner** — stool, bucket, towel; corner-calls in bouts (founding staff, from the book) |
| 2 | Goblin Ranger | **Waymark**, surveyor (walked every path) | **Scout** — recommends who to buy; +1 behavioural tell on opponents |
| 3 | Goblin Guardian | **Bulwark**, dam-keeper (held the river) | **Defensive coach** — "Hold the Door" gameplan lever + guard training |
| 4 | **Goblin Chief** (boss) | **Foreman**, crane (raised the roofs) | **Fixture-master** — venue 2 opens; fight bills preview upcoming cards |
| 5 | Goblin Knight | **Coulter**, plough (broke the ground) | **Trainer** — fighters climb from current ability toward potential faster |
| 6 | Goblin Paladin | **Wellward**, well-keeper (drew the water) | **Physio** — better recovery between fixtures (caps hold: repairs never buy wins) |
| 7 | Goblin Shaman | **Vane**, weather-teller (read the sky) | **Analyst** — foresight on opponents' policy shifts; crowd/entertainment read |
| 8 | Goblin Lord | **Undercroft**, mine-lift (lord of the deep halls) | **Facilities** — gym upgrade tier (economy/balance TBD) |
| 9 | **Goblin Champion** (final) | **unknown** — has never taken off his mask | The ending. He faces your whole woken family at ringside |

Leaders cannot be bought — only fought. Fighters can be either. Gate 0 slice = rows 1–4.

## 4. Fighters: Remnants, ability, and the market

- Every hireable/buyable fighter is a **Remnant of a hero** — a named helper machine with a
  past job, a true form, and a goblin dressing while enslaved to a rival gym.
- Growth model: **current ability → potential** (trainers accelerate the climb; scouting
  estimates potential before you buy). Pekoe is the founding fighter: low ability,
  bottomless potential, immune to shards — nothing settles where nothing stays.
- Selling/releasing a woken Remnant never re-goblins them (the wake sticks — canon). The
  market moves contracts, not souls.

## 5. The fireside cups (diegetic meta-progress)

The gym hearth shows **one teacup per woken friend** — staff and freed fighters alike — the
book's closing image as the game's only progress wall. Roster board, cups, and the storybook
of Goblin Law are the gym hub's three fixtures. Every woken staff member changes what the
corner *says* (each true form talks different — the woken inversion of "every class talks
different").

## 6. Production symmetry (why this stays cheap)

- Goblin fighter = base Remnant chassis + goblin kit; woken = same chassis − goblin kit +
  livery. The wake moment is literally a material/part swap — what the pipeline already does.
- Gym leaders = one ranked chassis + class regalia kit each; as staff, regalia off + one
  signature tool (scout's glass, trainer's pads, physio's wrench).
- A fixture needs at most 10 characters on screen across five bouts — all permutations of
  kits over shared chassis. Roster-of-5 multiplies content without multiplying models.

## 7. Canon reconciliations (v2)

1. **The player is the gym, not the boxer.** In the book, Granny Fettle already coaches
   (Spread 11: the gloves, the training by the fire) and Barrow founds the corner (Spread
   14). The origin story is the **founding legend of the Kettleworks gym**: Pekoe is your
   first fighter, Barrow your first staff. Story text needs no changes.
2. **Buying = ransom-rescue** — the fable's mercy made mechanical: some friends you win back,
   some you pay home. Both count a cup.
3. The Champion remains the recurring rival; the spout, bell-with-copper-tongue, Heart-Gauge,
   and two-layer goblin tells are unchanged from v1.
4. The hybrid sport needs an in-world name (working placeholder: **"Fives"**) — owner names it.

## 8. Flagged: redesign-decisions revision required

`docs/plans/binaryboxer-redesign-decisions.md` assumes a single-fighter Manager Mode. The
pivot adds: roster economy (hire/buy/sell), prestige (victory + entertainment scoring),
fixture cards, ability/potential growth, staff system; and re-homes dynasty/integrity
(proposal: integrity = the gym's lamps; a lost fixture = "they take a light"). **A dedicated
decisions-revision session is required before Gate-0 progression code is built.** The fight
engine, art pipeline, and story are unaffected and may proceed.

## 9. Open questions (owner, non-blocking for art)

- What earns **entertainment** prestige, concretely? (risky gameplans, comebacks, KOs,
  crowd momentum — needs a scoring rule)
- Does the dynasty/generation mechanic survive per-fighter (retiring Remnants), per-gym, or
  retire entirely?
- Economy: one currency (scrap) or two (scrap + prestige)? Transfer pricing tuning.
