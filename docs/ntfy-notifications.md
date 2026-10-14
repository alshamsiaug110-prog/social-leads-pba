# Staff push notifications (ntfy)

Every staff notification (escalations, reply failures, Meta integration failures,
publishing outcomes) can also be pushed to staff phones through
[ntfy](https://ntfy.sh). It is optional and off until `NTFY_URL` is set.

| Variable | Required | Purpose |
| --- | --- | --- |
| `NTFY_URL` | yes | Full topic URL, e.g. `https://ntfy.sh/pba-social-desk-<long-random-suffix>` |
| `NTFY_TOKEN` | no | Access token for a protected topic |
| `NTFY_CLICK_BASE` | no | Dashboard base URL so tapping an alert opens the right page |
| `NTFY_MIN_SEVERITY` | no | `info` (default), `warning` or `critical` |

Setup: install the ntfy app on each staff phone, subscribe to the topic, and set
the variables on the server. On the public ntfy.sh anyone who knows the topic name
can read it, so use a long random topic name or a self-hosted server with a token.
Alerts contain only the generic notification text, never customer message content.
Delivery is best-effort and never blocks webhook processing.
