<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the PLAYBACK Next.js App Router project. PostHog was already partially instrumented (searches and booking redirects in PLAYScanner), so the integration supplements those existing events rather than replacing anything. Environment variables were written to `.env.local`, and seven new events were added across four files covering the full user acquisition funnel (signup → login) and the PLAYScanner conversion journey (sport/date selection → search → slot selection → booking redirect).

| Event | Description | File |
|---|---|---|
| `user_signed_up` | User successfully completed registration; fires with `posthog.identify()` before redirect to email verification | `src/app/auth/register/page.tsx` |
| `user_logged_in` | User successfully signed in with email and password; fires with `posthog.identify()` before redirect to dashboard | `src/app/auth/login/page.tsx` |
| `playscanner_sport_changed` | User switched to a different sport tab; includes `sport`, `previous_sport`, and `date` | `src/components/playscanner/PLAYScannerMain.tsx` |
| `playscanner_date_changed` | User selected a different date; includes `date` and current `sport` | `src/components/playscanner/PLAYScannerMain.tsx` |
| `playscanner_slot_selected` | User tapped a court slot to open the booking confirmation modal; includes provider, sport, venue, price, and listing type | `src/components/playscanner/SearchResults.tsx` |
| `playscanner_view_mode_changed` | User toggled between list and map view; includes `view_mode` and `sport` | `src/components/playscanner/SearchResults.tsx` |
| `playscanner_filter_applied` | User applied advanced filters and confirmed; includes sport, provider/venue/price/time filter counts, and filtered result count | `src/components/playscanner/SearchResults.tsx` |

**Previously instrumented (unchanged):**
- `playscanner_search_performed` — `src/components/playscanner/PLAYScannerMain.tsx`
- `playscanner_booking_redirect_clicked` — `src/components/playscanner/BookingConfirm.tsx`

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics:** https://eu.posthog.com/project/159212/dashboard/621255
- **PLAYScanner booking funnel** (search → slot selected → booking redirect): https://eu.posthog.com/project/159212/insights/CjejvwTx
- **New user signups over time:** https://eu.posthog.com/project/159212/insights/QW7BLGoO
- **PLAYScanner searches by sport:** https://eu.posthog.com/project/159212/insights/SOw8Cvkv
- **Login vs signup activity:** https://eu.posthog.com/project/159212/insights/ivkz3QDA
- **Booking redirect clicks by sport:** https://eu.posthog.com/project/159212/insights/HN4eZs5t

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
