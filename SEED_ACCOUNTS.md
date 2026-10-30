# UNIFIÉE seed accounts

Run `npm run db:seed` against a non-production database. The script prints the
database host and refuses hosts not listed in `SEED_ALLOWED_HOSTS`.

Default password: `Unifiee@123`

All seeded email addresses use `@seed.unifiee.test`. The deterministic accounts
include:

- 6 businesses: `seed-business-anjali`, `rahul`, `neha`, `vikram`, `sana`, and `empty`
- 4 designers: `seed-designer-meera`, `kabir`, `riya`, and `dev`
- 5 manufacturers: `seed-manufacturer-packcraft`, `ecowrap`, `printnest`, `boxsmith`, and `empty`
- `seed-none-onboarding@seed.unifiee.test`: account without a profile
- `seed-none-google@seed.unifiee.test`: Google-provider account without a password

The non-empty profiles include requirements, quotations, orders, fulfilment
milestones, shipments, offerings, facilities, designer services, hired
services, inquiries, reviews, invoices, and payout account data. The empty
profiles intentionally contain no activity to exercise empty states.

Commands:

```bash
npm run db:seed
npm run db:seed -- --skip-embeddings
npm run db:seed:reset
npm run db:verify
```
