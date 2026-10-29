# Pick one boundary to test

These are original test recipes, not production save/shop systems. Use a fake boundary or an isolated project you are authorized to change. Do not execute adversarial requests in someone else's live game.

## Failed profile load

Observable invariant: a failed read must not become a default profile that is later saved over an existing player's progress.

First make a fake reader fail. Check that the session is not considered loaded and that a subsequent departure/save request writes nothing. Then check the distinct case of a successful read returning nil: that can represent an absent key. A successful existing-profile read should retain its data. Also inspect what happens when the eventual write fails; a catch alone is not a retry/durability design.

The failure lab covers the first three branches only. Real persistence additionally needs the project's session ownership, concurrency, shutdown, retries, schema and request-budget strategy. Roblox documents that Studio API access can reach the same data as the live game: [Data stores](https://create.roblox.com/docs/cloud-services/data-stores).

## Duplicate purchase

Observable invariant: replaying the same request within the chosen scope does not charge or grant twice.

Use a server-owned catalog in a fake profile. Start from a known balance, send the same request ID twice and inspect both the balance and inventory. Then try the same ID with a different item: it must not silently authorize that other purchase. A different legitimate request should still work if the game's purchase rules allow it.

The lab handles sequential in-memory calls. It does not prove correctness under yields, multiple servers, process crashes, persistent receipts, developer-product callbacks or malicious request spam. Runtime remotes also need server-side type, range, context, permission and rate checks: [Client/server boundary](https://create.roblox.com/docs/scripting/security/client-server-boundary).

## Progression rollback

Observable invariant: reaching stage 3, touching stage 1 and respawning keeps the player at the intended stage 3.

Start with a pure progression transition, including equal stages and invalid input. Then run the real touch/respawn sequence in the copied Studio game, observe the character's actual location/state and compare against an explicit tolerance. Do not substitute an assignment to the stage value for the player touching a checkpoint.

The lab checks the numeric transition only. It does not exercise touch events, respawn positions, persistence or multiplayer authority. A server must also establish that reaching that stage is legitimate; the increasing-number guard alone is not an anti-exploit system.
