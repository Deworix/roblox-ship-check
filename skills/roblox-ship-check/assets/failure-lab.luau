-- Roblox Ship Check / Baseplate / MIT
-- In-memory demonstrations only. No services, DataStores, HTTP or place edits.
-- The deliberately broken variants exist only to show that the assertions detect them.
-- These simplified corrected variants are NOT production save/shop/progression systems.

local assertions = 0
local function check(condition, label)
    assertions += 1
    assert(condition, "FAIL: " .. label)
    print("CHECK " .. assertions .. ": " .. label)
end

print("ROBLOX SHIP CHECK — IN-MEMORY FIXTURE LAB, NOT YOUR GAME")

-- Case 1: a failed load is different from a successful read of an absent key.
local function fakeStore(mode)
    return {
        writes = 0,
        read = function()
            if mode == "error" then error("simulated read failure") end
            if mode == "existing" then return {coins = 750} end
            return nil
        end,
    }
end

local function brokenLoadThenSave(store)
    local ok, value = pcall(store.read)
    local profile = if ok and value then value else {coins = 0}
    store.writes += 1 -- incorrectly saves defaults even after a failed read
    return profile
end

local function guardedLoadThenSave(store)
    local ok, value = pcall(store.read)
    if not ok then return false, nil end
    local profile = value or {coins = 0}
    store.writes += 1
    return true, profile
end

local failedBefore = fakeStore("error")
brokenLoadThenSave(failedBefore)
check(failedBefore.writes ~= 0, "BEFORE: failed-load test catches the unwanted write")
local failedAfter = fakeStore("error")
local loaded = guardedLoadThenSave(failedAfter)
check(loaded == false and failedAfter.writes == 0, "AFTER: failed load does not authorize a save")
local absent = fakeStore("absent")
local newLoaded, newProfile = guardedLoadThenSave(absent)
check(newLoaded and newProfile.coins == 0 and absent.writes == 1, "successful absent-key read remains a distinct case")
local existing = fakeStore("existing")
local existingLoaded, existingProfile = guardedLoadThenSave(existing)
check(existingLoaded and existingProfile.coins == 750, "existing profile is retained")

-- Case 2: sequential in-memory request replay; no yield or distributed receipt handling.
local catalog = {Sword = 40, Shield = 30}
local function profile()
    return {coins = 100, grants = 0, receipts = {}}
end
local function brokenPurchase(state, itemId, _requestId)
    state.coins -= catalog[itemId]
    state.grants += 1
end
local function guardedPurchase(state, itemId, requestId)
    if type(itemId) ~= "string" or type(requestId) ~= "string" or #requestId == 0 or #requestId > 64 then
        return false, "invalid input"
    end
    local price = catalog[itemId]
    if not price then return false, "unknown item" end
    local receipt = state.receipts[requestId]
    if receipt then
        if receipt.itemId ~= itemId then return false, "request/item mismatch" end
        return true, "replayed"
    end
    if state.coins < price then return false, "insufficient funds" end
    state.coins -= price
    state.grants += 1
    state.receipts[requestId] = {itemId = itemId}
    return true, "purchased"
end

local shopBefore = profile()
brokenPurchase(shopBefore, "Sword", "request-1")
brokenPurchase(shopBefore, "Sword", "request-1")
check(shopBefore.coins ~= 60 and shopBefore.grants ~= 1, "BEFORE: repeated request is detected as a double charge/grant")
local shopAfter = profile()
check(guardedPurchase(shopAfter, "Sword", "request-1") == true, "first legitimate request succeeds")
local replayed, replayReason = guardedPurchase(shopAfter, "Sword", "request-1")
check(replayed and replayReason == "replayed" and shopAfter.coins == 60 and shopAfter.grants == 1, "AFTER: same request charges/grants once")
check(guardedPurchase(shopAfter, "Shield", "request-1") == false, "same request cannot silently buy a different item")
check(shopAfter.coins == 60 and shopAfter.grants == 1, "mismatched replay changes no state")
check(guardedPurchase(shopAfter, "Shield", "request-2") == true and shopAfter.coins == 30, "a different legitimate request still works")
check(guardedPurchase(shopAfter, "Sword", "request-3") == false and shopAfter.coins == 30, "insufficient funds do not mutate the balance")
check(guardedPurchase(shopAfter, "Unknown", "request-4") == false, "unknown catalog item is rejected")
check(guardedPurchase(shopAfter, "Sword", {}) == false, "non-string request ID is rejected")

-- Case 3: pure numeric progression. The actual touch/respawn sequence still needs Studio.
local function brokenProgress(_current, touched)
    return touched
end
local function guardedProgress(current, touched)
    if type(touched) ~= "number" or touched ~= touched or touched == math.huge or touched == -math.huge then
        return current
    end
    if touched % 1 ~= 0 or touched < 1 or touched > 100 then return current end
    return math.max(current, touched)
end

check(brokenProgress(3, 1) ~= 3, "BEFORE: earlier checkpoint rolls progress back")
check(guardedProgress(3, 1) == 3, "AFTER: earlier stage does not replace progress")
check(guardedProgress(3, 3) == 3, "equal stage stays unchanged")
check(guardedProgress(3, 4) == 4, "legitimate next stage advances")
for _, invalid in {0, -1, 1.5, 101, math.huge, -math.huge, 0 / 0, "4", {}} do
    check(guardedProgress(3, invalid) == 3, "invalid progression input leaves state unchanged")
end

print("PASS: " .. assertions .. " fixture assertions; 3 broken behaviors detected, 3 corrected transitions checked.")
print("NOT TESTED: your game, live DataStores, concurrent/yielding purchases, real touch/respawn or whole-game security.")
