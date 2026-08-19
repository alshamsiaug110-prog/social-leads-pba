# Meta Business Verification Notes

## Initial authenticated check — 18 August 2026

The first Business Settings portfolio opened in the connected browser was **Solutions Engineering Team** (`business_id=1913840705898985`). Its Pages section stated that no Pages were added, so it does not appear to be the portfolio managing Premier Ballet Academy.

The connected browser then opened the active **Premier Ballet Academy** Meta Business Suite surface (`asset_id=1097461780292447`, `business_id=219097775606279`). It displayed both the Facebook Page **Premier Ballet Academy** and the Instagram account **@premierballet_academy** together, with the linked-asset indicators shown in the suite. The authenticated surface also reported approximately 13.7K Facebook followers and 12.2K Instagram followers.

This confirms that the Facebook Page and Instagram professional account are connected in the active operating surface. App-level permissions, app assignment, token provenance, and webhook configuration remain to be checked separately.

## App association check

The authenticated Meta developer account lists a live app named **Autubot** (`app_id=1018705307641940`) whose business is shown as **Premier Ballet Academy**. The app is published and has the Facebook Login for Business use case configured. This is the app selected for the remaining permission and webhook verification.

## Available app capabilities

The Autubot app’s Use Cases screen includes the relevant offerings for the intended system: **Manage messaging & content on Instagram**, **Manage everything on your Page**, and **Engage with customers on Messenger from Meta**. This confirms the app can be configured for the required product areas; the individual configuration, permissions, and webhook subscriptions still require inspection.

## Instagram configuration surface

The active Instagram API configuration is available inside the Autubot app. It exposes **Permissions and features**, **API setup with Instagram login**, **API setup with Facebook login**, and **Webhooks**. The page notes that Facebook-login setup is the relevant path for additional tracking and insights, while the Instagram API use case supports publishing, direct-message handling, and comment moderation.

## Visible Instagram setup requirements

The Instagram API setup screen lists the required messaging permissions as `instagram_business_basic`, `instagram_business_manage_comments`, and `instagram_business_manage_messages`. The screen also exposes an **Add all required permissions** action, an account-add action for token generation and webhook subscriptions, and blank callback URL / verify-token setup controls. The UI states that successful app review is required before accessing live Instagram data. The currently visible state does not prove that these permissions, account assignment, webhook fields, or advanced access have been completed.

The direct permissions route was opened but did not render per-permission access statuses in the available authenticated view. The live app still needs a permission-management or app-review confirmation for each required scope.

## Verification result

The current authenticated Business Suite surface confirms that **Premier Ballet Academy** and **@premierballet_academy** are connected. The current authenticated developer account also confirms that the live **Autubot** app belongs to the Premier Ballet Academy business and exposes the required Instagram, Page, and Messenger product areas.

The live Page token now validates against the confirmed Premier Ballet Academy Page. The approved Instagram user token validates against `graph.instagram.com` and returns the connected professional account. The protected staff dashboard successfully discovered and persisted the non-secret Page and Instagram identifiers, confirming the runtime account-discovery path. The developer interface still requires the published callback URL and verify token to be saved and the required webhook fields to be subscribed.

## Business asset confirmation

The exact **Premier Ballet Academy** Page (`1097461780292447`) is owned by the active Premier Ballet Academy business portfolio. Its Connected assets tab explicitly lists the Instagram account **premierballet_academy**. The **Autubot** app (`1018705307641940`) is also owned by the same business portfolio, and the connected browser user has full access to that app. This confirms the core asset ownership and Page–Instagram linkage; the remaining issue is the access-token grant and application-level access configuration.

The app’s Connected assets tab is empty. Its available connection dialog exposes advertising assets only, not the Facebook Page or Instagram account. No assets were changed. This indicates that the missing runtime authorisation must be established through the app’s Pages/Instagram product setup, permission grant, and token-generation flow—not through the generic connected-assets dialog.

## Instagram API permissions and tester status

The required Instagram permissions were added successfully in the Autubot Instagram API setup: `instagram_business_basic`, `instagram_business_manage_comments`, and `instagram_business_manage_messages`. Meta confirmed that all required permissions were added.

The approved Instagram API token was subsequently generated and validated against the live Instagram identity endpoint. The account is no longer blocked on token generation for the current production activation; remaining work is to save the webhook callback and complete field subscriptions in the Autubot developer configuration.

## Published service and live credential verification

The social assistant is published at `https://pbabots-ugnivxro.manus.space/`. Its public webhook route is `https://pbabots-ugnivxro.manus.space/api/meta/webhook`. A direct request without Meta’s verification parameters returns the expected webhook-verification failure response, confirming that the route is live and rejects unauthenticated verification attempts.

The protected staff dashboard successfully stored and displayed the Meta app secret, webhook verify token, Facebook Page access token, and Instagram user access token. Using these credentials, the dashboard completed account discovery and confirmed the linked assets as **Premier Ballet Academy** and **@premierballet_academy**.

## Facebook Page webhook activation status

The Autubot app-level Page webhook callback was configured successfully for `https://pbabots-ugnivxro.manus.space/api/meta/webhook` with the message, reaction, and Page-feed fields. The verified Facebook credential is a valid non-expiring **Autubot system-user token** and can derive a Page-specific token for the academy Page.

The Page-level activation is currently blocked only for Page comments: Meta returned error `(#200)` stating that subscribing to the `feed` field requires `pages_manage_metadata`. The token currently has `pages_show_list`, `pages_messaging`, `pages_read_engagement`, `pages_manage_posts`, and `pages_manage_engagement`, but it does **not** have `pages_manage_metadata`. This specific scope must be granted to the Autubot system-user token, then the existing activation control can subscribe the academy Page without changing any bot behavior.

### Resolution — Page subscription active

The Autubot system-user token was replaced through the authenticated Meta Business Settings flow with a non-expiring token that includes `pages_manage_metadata`. The replacement token validated successfully, and Meta confirmed the Page-level subscription is active for **Autubot** on **Premier Ballet Academy**. The active fields are `messages`, `messaging_postbacks`, `messaging_optins`, `message_reactions`, and `feed`. This enables Facebook Messenger events and Facebook Page comment events to reach the published webhook callback.

## Instagram webhook callback status

The authenticated Autubot Instagram API screen exposes the expected **Callback URL**, **Verify token**, and **Verify and save** controls, and the fields are currently blank. The confirmed production values are `https://pbabots-ugnivxro.manus.space/api/meta/webhook` and the existing protected project verify token. Direct navigation to the embedded Webhooks sub-tab did not render its form contents reliably in the browser session, so the callback is being completed through the visible API setup surface rather than by guessing an unpublished Meta configuration endpoint.

The Instagram account-level subscription was activated successfully with the verified Instagram user token. Meta now reports the active Autubot subscription fields as `messages`, `comments`, and `message_reactions` for `@premierballet_academy`. This confirms that Instagram event categories are enabled at account level; the remaining app-level callback form remains the last visible Meta configuration item to verify.

### Resolution — Instagram callback active

Using Meta’s documented app-subscriptions flow, the Autubot app-level Instagram subscription was configured successfully for `https://pbabots-ugnivxro.manus.space/api/meta/webhook`. Meta confirms the `instagram` object is active for `messages`, `comments`, and `message_reactions`. The same subscription record confirms the `page` object remains active for `messages`, `messaging_postbacks`, `messaging_optins`, `message_reactions`, and `feed`. Both supported social channels now reference the same published, HMAC-validating webhook endpoint.

## Autoscale operating note

The project remains on Manus autoscaling hosting by the academy’s explicit decision. The public webhook route is stable and correctly validates Meta verification requests, but an autoscaling instance can have an initial cold-start delay after inactivity. Meta’s delivery retries and the implementation’s webhook-delivery deduplication provide resilience, but staff should monitor the notification center after long idle periods and consider Reserved hosting only if rapid first-event response becomes business-critical.

## Initial external DM test observation

After the owner sent `Hi` from a personal Instagram account, the published conversation log had not yet recorded an inbound event after the first refresh interval. The app-level and account-level subscriptions remain verified active; the delivery path is being traced before treating the test as complete.

## Legacy Facebook Page automation review

An external Facebook test returned a legacy welcome response referencing Peter Pan and PSI rather than the approved bilingual Social Desk flow. The authenticated Premier Ballet Academy Meta Business Suite **Inbox → Automations** surface is available for review. This legacy automation must be disabled or rewritten before the controlled bot is treated as the sole customer-service responder.

### Resolution — legacy welcome rule disabled

The conflicting **Auto-reply** rule was opened in Meta Business Suite and confirmed to contain the unapproved Peter Pan / PSI welcome copy. Its automation switch is now **Off** and the disabled state was saved. The legacy rule no longer sends first-message greetings on Messenger or Instagram; the other existing Page automations were left unchanged.
