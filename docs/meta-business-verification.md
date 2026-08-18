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

However, the supplied token’s Graph API validation returned a valid principal but did not return one identifiable Premier Ballet Academy Page with a linked Instagram professional account through the authorised Page list. This prevents automatic runtime account discovery. In addition, the developer interface shows the Instagram messaging permissions and webhook controls as setup requirements but does not provide evidence that all are granted with live access or that a callback URL and verify token have been saved.

## Business asset confirmation

The exact **Premier Ballet Academy** Page (`1097461780292447`) is owned by the active Premier Ballet Academy business portfolio. Its Connected assets tab explicitly lists the Instagram account **premierballet_academy**. The **Autubot** app (`1018705307641940`) is also owned by the same business portfolio, and the connected browser user has full access to that app. This confirms the core asset ownership and Page–Instagram linkage; the remaining issue is the access-token grant and application-level access configuration.

The app’s Connected assets tab is empty. Its available connection dialog exposes advertising assets only, not the Facebook Page or Instagram account. No assets were changed. This indicates that the missing runtime authorisation must be established through the app’s Pages/Instagram product setup, permission grant, and token-generation flow—not through the generic connected-assets dialog.

## Instagram API permissions and tester status

The required Instagram permissions were added successfully in the Autubot Instagram API setup: `instagram_business_basic`, `instagram_business_manage_comments`, and `instagram_business_manage_messages`. Meta confirmed that all required permissions were added.

The subsequent Add Instagram Account flow did not produce a tester-role assignment. The Autubot app’s Roles screen currently reports **0 of 50 testers**. The logged-in academy Instagram account therefore still needs to complete the tester-role authorization inside Meta’s account-add flow before it can generate the dedicated Instagram token for testing.
