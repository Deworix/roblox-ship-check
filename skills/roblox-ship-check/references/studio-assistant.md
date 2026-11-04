# Run a Roblox Ship Check in Studio Assistant

Start with one behavior you can observe in an existing game. You can try the one-time prompt in Assistant or save the instructions as a reusable skill.

## One-time prompt

> On my authorized local test copy, help me check one regression. Ask me for the player action, expected result and observed result. Record the exact setup, steps and assertion. Establish the baseline before editing. Show the smallest proposed change and wait for me to approve it. Repeat the same test after the change. If a tool or a second client is unavailable, give me the manual steps and leave the result unverified until we have the observation.

For example, say that A opens a private panel and B should be able to keep playing. Use [the Player Two Test](recipes.md#player-two-test) to check both clients and swap roles.

## Save it as a reusable skill

In Studio open **Assistant → … → Assistant Settings → Skills**. Choose the control to add a skill manually. Enter these fields, paste the instructions below, then invoke the saved skill from the `/` menu. It can also load automatically when enabled and matched. Roblox associates these skills with your account across places. [Roblox Assistant skill documentation](https://create.roblox.com/docs/assistant/skills#create-a-skill)

**Name** `roblox-ship-check`

**Description** `Check one Roblox regression after a gameplay change. Record the baseline, propose a focused fix and repeat the same Studio test.`

**Instructions**

```text
Help the creator check one behavior on an authorized local test copy or separate test experience.

1. Agree on one player action and its expected and observed results. Record the place, revision, test mode, initial state and exact steps. Stop and ask if the target or expectation is ambiguous.
2. Establish the baseline using only the available tools and approved actions. Record what happened. If it does not reproduce, diagnose the mismatch before proposing a fix. Never substitute a clean Output window for observing the behavior.
3. Explain the smallest relevant change and ask for approval before editing. Verify that the changed script is present in the tested place. Keep the initial state, actions and assertion fixed for the rerun.
4. Use the test mode that can observe the result. For private UI, replication and player isolation, observe both clients and swap roles. If only solo play is available, give the creator the manual Server & Clients steps and leave the multiplayer result unverified.
5. For failed DataStore reads, use an in-memory or stubbed reader first. Test failure separately from a successful missing-key read and an existing profile. Use a separate test experience and test data for any real persistence test. Never change production access or data.
6. Report the baseline, the change, the same test after it and the actual outcome. Name each unobserved result. Keep any captures, code and reports with the creator. Do not publish the place or run a change the creator has not approved.
```

The template is based on the documented Assistant skill format. The steps you can execute depend on the tools available in your session. For a local exercise with an observed result, run [the MIT Luau lab](../../../README.md#try-the-failure-lab-without-ai).

If you want help adapting one test to your own project, [describe the player action and what you saw](https://baseplatedev.com/founding-10.html?utm_source=github&amp;utm_medium=resource&amp;utm_campaign=assistant_ship_check_20261104) for free written help from Baseplate.
