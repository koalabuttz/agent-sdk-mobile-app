# Optional notification deployment

The repository must not contain an operator's Firebase project configuration, network addresses, agent identifiers, or server credentials. The same source supports local deployments via ignored configuration.

## Android client

1. Copy `.env.example` to `.env.local`.
2. Set `EXPO_PUBLIC_NOTIFICATION_AGENT_ID` and `EXPO_PUBLIC_NOTIFICATION_SERVER_URL` to the agent and remote-profile URL used for notification routing. The URL should match the saved Bloop profile (a trailing slash is ignored).
3. Download the **Android client** `google-services.json` from your Firebase project for the configured Android package. Place it in the project root, or set `GOOGLE_SERVICES_JSON` to its path.
4. Prebuild and compile Android using your normal release process.

`app.config.js` includes Firebase's client file only when present. A checkout without local configuration can build without your Firebase project; remote-push registration will not work until configured. Missing routing identifiers disable deployment-specific notification tap routing. No secret belongs in an `EXPO_PUBLIC_*` variable: these values are embedded in the APK.

The Android client file contains project identifiers and a client API key; it is not the service-account credential used to send pushes. It is ignored to keep deployments separate, not because it can be kept secret inside an APK.

## Relay

See `../relay/README.md`. Use a completed `relay/config.local.json` locally, then install it as `/etc/anna-relay/config.json` on the relay. Server keys and app-server tokens remain exclusively in protected server files. Do not transfer them to Android or commit them.

## Local-only artifacts

Ignored paths include `.env.local`, `google-services.json`, `.local-deployment/`, `relay/config.local.json`, relay credential filenames, and SQLite files. `.local-deployment/` may contain operator-specific setup scripts; it is neither portable source nor part of the published package. When packaging for deployment, explicitly select source files—do not archive the whole checkout with ignored files included.

## Verification

Run the application typecheck and tests, plus `npm test` inside `relay/`. Inspect `git status --ignored` and staged diffs before publishing. Never use a broad `git add -f` on deployment files.
