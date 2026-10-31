# Game-over advertising

The incident newspaper's **Back to home** action requests a Google Ad Placement API `next` break, then returns to the game's landing page. Ordinary pause-menu exits do not request ads. The engine is paused and muted before the request; repeated taps are ignored. Google owns the ad overlay, format, duration, frequency, and close/skip controls. The integration does not guarantee a video on every exit and never asks the user to click an advertisement.

Publisher: `pub-6693217545827146` (script client `ca-pub-6693217545827146`).

## Activation in Vercel

1. Confirm Google H5 Games Ads / Ad Placement API access and approval for the game/site. An ordinary AdSense publisher ID does not establish H5 eligibility.
2. Configure the site's required privacy disclosures and consent messaging/CMP for the audiences served before enabling live ads. The game currently has no custom consent UI. Do not assume an environment flag supplies consent.
3. Add `VITE_GAME_ADS_MODE=test` to a Preview deployment and redeploy. This loads Google's test integration; do not test by repeatedly requesting or clicking live ads.
4. Check a completed incident -> Back to home -> test ad -> home, including phone orientation/fullscreen, provider close controls, no fill, and an ad blocker.
5. Once approved and ready, set `VITE_GAME_ADS_MODE=live` for Production and redeploy. Off/unset makes no Google ad script requests and goes home immediately.

The API is preloaded on application startup only in enabled deployments. If it isn't ready when the player exits, navigation is immediate. An unanswered break request has a four-second fallback; once `beforeAd` signals an active ad, no timer forcibly truncates it. `afterAd`/`adBreakDone` complete navigation once. Google callbacks and frequency rules determine actual serving.

`public/ads.txt` supplies the authorized-seller record on the game deployment. Because the game runs under `rasta.vihar.online`, also publish the appropriate ads.txt record at the registered domain `https://vihar.online/ads.txt` in the separate catalogue project, following the AdSense site's instructions. This repository cannot update that project's DNS or files. The ID is public, not a secret.

Reference for account setup and current API requirements: https://developers.google.com/ad-placement

Live Google delivery and account approval have not been verified in this workspace. Automated tests simulate completion, no-fill, blocked/missing APIs, timeout, and unmount. They do not generate ad impressions.

This game-specific opt-in implementation supersedes the earlier website brief's initial no-incident-ad proposal. Ads are requested only after the player explicitly leaves the newspaper; no banners are inserted over the collision scene or driving controls.
