# Gym-Manager Pivot — Grilled Decisions

_2026-07-16 · produced by an owner grilling session (7 branches, all resolved) · supersedes the
single-fighter framing in `binaryboxer-redesign-decisions.md` where they conflict — that doc's
engine-level decisions (derived stats, behavioural scouting, explainable AI, archetypes with
variants) remain authoritative · story/canon: `../binary-boxing/04-story-canon.md`_

## Resolved decisions

| # | Decision | Choice | Why |
|---|---|---|---|
| 1 | **Fixture format** | One fixture = **one bout**. Toppling a rival gym = win a **5-bout series** against their card, then the leader bout | Reddit/Devvit session length; daily-return cadence; roster matters via matchup-picking and condition rotation; keeps "defeat all 5" canon |
| 2 | **Matchup pick** | Rival fighter **announced on the fight bill**; scouting depth gates the intel; player counter-picks | Counter-picking is the coach fantasy; makes scouting valuable; feeds the Chief's bills-preview unlock |
| 3 | **Prestige identity** | **Non-spendable reputation ladder** — gates leader challenges, hiring-pool tiers, venue progression | One spendable currency (scrap) keeps Gate 0 balance sane; club-reputation model |
| 4 | **Entertainment scoring** | **Momentum-swing crowd meter**: lead changes, comeback rounds, knockdowns/KOs, risky gameplan choices — itemized in the debrief | Sim already computes all inputs; "reasons are UI" honoured. Anti-farm: losses pay half; same-opponent rematch payouts decay |
| 5 | **Ransom rules** | Buying frees the fighter (cup + recruit) but the leader's card **refills**; series progress comes **only from won bouts** | Kills pay-to-skip; keeps both verbs (buy = mercy/recruiting, fight = progression) meaningful |
| 6 | **Purse** | **Crowd pays both**: purse = venue base + win bonus + crowd share (prestige earned in parallel) | Promoters pay for thrills; one meter, two rewards; a thrilling loss still covers repairs |
| 7 | **Fighter DNA** | **Languages remain the stat seed** (2 per Remnant); the machine job = chassis art + one stat lean | Preserves the stat engine, 10-language content, learning-tips hook, and the game's name |
| 8 | **Run structure** | **Lamps & generations**: lamps = gym integrity; a lost fixture "takes a light"; dark gym ends the generation; the **Heart-Gauge transplants into a new founding fighter**; woken friends/cups persist across generations; prestige drops to a floor; dynasty leaderboard = gym generations | Merges old integrity+dynasty with the gym model; mechanizes the story's transplant ritual; wakes-persist gives roguelite meta-progress |
| 9 | **First-slice scope (= Gate 1)** | **"The First Cup" slice**: roster 2–3, no selling, scripted ransom offers, one leader series (the Chief) with staff rows 1–4, lamps on, crowd meter on, short prestige ladder | Proves every pillar at a size that respects the reliability-first priority; full market + 5-roster is Gate 2. _Gate naming reconciled 2026-07-17 (`story-presentation-decisions.md` #1): Gate 0 = engineering foundations per the build-loop; this slice is **Gate 1**_ |

Logged assumption (raise if wrong): the in-bout engine ships unchanged — gameplan levers,
behavioural tells, reasons-as-UI, one corner call per ordinary bout, two per boss.

## Deferred to the implementation plan (not silently dropped)

- Ransom price curve (scale with ability/potential/venue tier)
- Sell-side market rules and pricing (selling woken fighters is *legal* — contracts, not souls — UI at Gate 1)
- Wages/upkeep — out of Gate 0 entirely; revisit Gate 2
- Roster-cap overflow behaviour (default: must sell before buying at 5/5; confirm at Gate 1)
- Potential (PA) numbers, growth-ceiling curve, trainer acceleration rate
- Lamp count per generation; prestige floor value
- Redis schema for gym scope — **installation-scoped, postId dropped** (`gym:{username}`, `fighter:{username}:{id}`, series state; per the spec §6 scoping fix and `story-presentation-decisions.md` #2; the earlier `{postId}:gym:{username}` sketch is void)
- Champion endgame structure (post-Gate 2; his true form is book-2 canon)
- ~~In-world sport name~~ — resolved: **Bantam** (`bantam-decisions.md` #2, 2026-07-16)

## Superseded from the old model

- Single-fighter Manager Mode framing (player now runs the gym; fighters are roster units)
- Per-robot integrity lives → gym lamps (same drama, new home)
- Heirloom program inheritance → Heart-Gauge founding-fighter transplant (story-true)
