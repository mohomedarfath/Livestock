# Cow Section Implementation Plan

## Summary

Build the Cow section first as a cattle and dairy workflow inside the existing LivestockTrack React app. The first release focuses on the wedge shared by the MooTrack and CowTrack blueprints: cow profiles, AM/PM milk records, breeding reminders, medicine and withdrawal tracking, milk payment clarity, and cow-level profitability.

## Key Changes

- Add cow-only navigation modules that appear when the selected animal type is Cow or All Animals.
- Keep existing poultry workflows intact and avoid changing poultry storage semantics.
- Add organization-scoped cow data repositories with localStorage fallback for demo/offline use.
- Add cow screens for dashboard, herd profiles, milk logging, breeding, health, milk payments, and profitability.
- Use simple rules first: milk-drop warnings, expected heat/calving dates, active withdrawal warnings, and margin calculations.

## Data Model

- `cows`: name, tag number, breed, date of birth, status, lactation number, last calving date, purchase price, notes.
- `cowMilkLogs`: cow ID, cow name, date, morning litres, evening litres, rejected litres, fat percent, SNF percent, notes.
- `cowBreedingRecords`: cow ID, event type, event date, AI date, pregnancy check date, pregnancy result, expected calving date, dry-off date, sire/bull, technician, notes.
- `cowHealthRecords`: cow ID, issue type, symptoms, medicine, dose, vet name, event date, withdrawal days, withdrawal until, cost, notes.
- `milkPayments`: date range, buyer/MCC, litres, rate, fat/SNF bonus, deductions, expected payment, actual payment, notes.

## Implementation Steps

- Add repositories and hooks for the cow collections using the existing Firebase/localStorage pattern.
- Add cow pages under `src/pages/cow/` and register them in `src/app/modules.jsx`.
- Update animal module filtering so cow modules are hidden for poultry/goat, while poultry-specific modules stay hidden for cow where needed.
- Add dashboard calculations from milk logs, cows, breeding records, health records, and milk payments.
- Keep the MVP local and operational; defer AI, co-op dashboards, vet portals, marketplace, finance integrations, and hardware.

## Test Plan

- Run `npm run lint`.
- Run `npm run test`.
- Run `npm run build`.
- Manually verify that cow mode can add cows, log milk, record breeding, record medicine withdrawal, enter milk payments, and view profitability.
- Confirm poultry navigation and existing pages still render after switching back to Poultry.

## Assumptions

- Cow MVP should be usable for small dairy farms with 2 to 25 cattle.
- Milk sales are tracked through a passbook-style payment flow, not through the generic poultry sales inventory flow.
- Photo uploads are deferred; the model keeps a `photoUrl` field for later.
- Notifications are shown as in-app due/attention cards in this pass, not push notifications.
