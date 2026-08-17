# Facebook Inbox Import Policy

The Inbox-review tool is designed to discover **recurring customer questions**, not to copy historic conversations into the live chatbot. Every candidate starts in the `pending` state and cannot be used in customer replies until a staff member writes or completes both English and Arabic answers, supplies matching keywords, and marks the FAQ entry as `approved`.

| Control | Implementation |
|---|---|
| Source handling | The raw Facebook archive is processed in memory for normal uploads and is not stored in the database. The supplied 100 MB archive was analysed locally entry-by-entry, then converted to frequency-only candidates. |
| Upload limit | The dashboard’s standard browser import accepts ZIP files up to 25 MB because it is transmitted through a request payload. Larger exports should be processed through the managed staff migration workflow rather than placed in application storage. |
| Supported format | A Facebook Inbox ZIP containing `message_*.json` files. The importer reads messages in timestamp order and pairs a customer question with a following academy response only as a review suggestion. |
| Redaction | Email addresses and phone-like strings are replaced before candidates are stored. Thread paths are omitted from the large-export bootstrap import. |
| Filtering | Automated platform notices, Meta messages, greetings, contact-bearing messages, oversized content, and one-off topics are excluded from the initial candidate queue. |
| Approval control | Historical answers are never automatically approved, published, or sent by the chatbot. The large-export bootstrap intentionally imports questions only, preserving staff ownership of all new answer copy. |

The production database retains only approved FAQs, pending candidate snippets where applicable, aggregate import statistics, and operational logs required for customer-service quality control. Raw archive bytes and customer inbox history are not used as a live answer source.
