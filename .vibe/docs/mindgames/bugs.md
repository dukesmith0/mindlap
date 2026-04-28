# Bugs
Next ID: 2

## Open

## Deferred

## Resolved
#1 [HIGH] app.js:78-118 showResult(): submit button disabled-state persists across games. cloneNode(true) copies the disabled attribute from the previous clone. After any successful submit (line 101 sets disabled=true before await) or any score<=0 result (line 96 sets disabled=true), the DOM node retains disabled=true. Fix: explicitly reset newSubmit.disabled = false and newRetry.disabled = false at the top of showResult before the score<=0 check. (found 2026-04-18, resolved 2026-04-18)
