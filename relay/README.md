# Single-phone notification relay

Companion relay for Bloop's self-hosted Letta app-server profiles. Runs separately from the phone. No inbound HTTP service is exposed; phone-token provisioning is manual.

## Configuration

Copy `config.example.json` to ignored `config.local.json` and fill in the app-server URL, agent ID, and Firebase project. These identifiers are deployment-specific, not authentication credentials.

The sample service expects these files under `/etc/anna-relay`:

- `config.json`: your completed configuration.
- `letta-token`: app-server capability token.
- `firebase-key.json`: dedicated Google service-account credential with only `cloudmessaging.messages.create` permission.
- `phone-token`: native FCM token copied from Bloop's Notifications screen.

Keep the directory root-owned, mode 0750, group `anna-relay`; credential/config files mode 0640 root:anna-relay. Never copy service-account credentials into the mobile app or Git. Firebase Android client configuration is a different file; see `../docs/notification-deployment.md`.

## Install

Requires Node 22 with `node:sqlite` support (experimental in Node 22). Create a non-login `anna-relay` user, place source in `/opt/anna-relay`, and create `/var/lib/anna-relay` owned by that user. Run `npm ci --omit=dev --ignore-scripts` and `npm test`. Review `anna-relay.service`, including its Node path, before installing it with systemd. Enable it only after configuration and credentials are present.

The service uses `/var/lib/anna-relay/outbox.sqlite` for event deduplication and pending delivery. Replacing a phone token retires the historical pending backlog; no catch-up flood is sent. Do not delete this database casually: it contains delivery deduplication state.

## Behavior and limitations

- Verified protocol shape: Letta Code 0.32.3. The observer sends only `conversation_list` and scoped `sync` with `recover_approvals:false`; it never approves tools or submits messages.
- Discovers the newest 100 conversations every 30 seconds. A fast reply in a new conversation can be missed before subscription.
- Missed events during disconnects are not reconstructed.
- A successful `turn_finished` event yields a completion alert. Pending approval state is checked before sending approval alerts; unknown/stale state waits.
- At most one push attempt every 30 seconds, persisted across restart. Unsent events expire after five minutes. Retired IDs remain recorded to prevent replay.
- Already-delivered approval notifications are not automatically removed when resolved. A state change racing delivery can still make an alert stale.
- Delivery is at-least-once with stable Android notification tags. FCM acceptance does not guarantee receipt.
- Token rotation requires manually reprovisioning `phone-token`.
- Android force-stop, permissions, networking and power policies affect delivery.
- Generic text only is sent; no tool arguments or conversation text is included.

Stop with `systemctl stop anna-relay`; this does not stop the Letta app-server. Local one-off provisioning/probe scripts are intentionally excluded from the public project.
