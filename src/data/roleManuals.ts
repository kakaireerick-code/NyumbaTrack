export const ROLE_HELP_GETTING_STARTED: Record<string, string> = {
  property_owner: `## Getting started (Property Owner)

1. **Add a property** — Properties → Add Building
2. **Add units** — Each shop, flat, or room is a separate unit with its own rent
3. **Invite tenants** — Copy the join link or code from a vacant unit and share via WhatsApp
4. **Record payments** — When rent arrives via MoMo, log it under Payments
5. **Track balances** — Balance Tracker shows who owes (tenants never see this)

Use **Guided Workflows** for step-by-step help. Turn on **Demo Mode** to practice safely.`,

  tenant: `## Getting started (Tenant)

1. **Register** — Open the join link from your landlord and enter your invite code (free for you)
2. **Home** — See what you owe and when rent is due
3. **Pay** — Use the MoMo numbers on Home, then tell your landlord under Payments
4. **Lease** — Your dates and landlord contact
5. **Help** — FAQs and Ask Assistant anytime

You only ever see **your unit** — nothing about other tenants or the owner's private notes.`,

  housekeeper: `## Getting started (Housekeeper)

You can view **units**, **vacancy**, **maintenance**, and **tenant names**.

You cannot see rent amounts, balances, or owner reports.

Log repair issues under Maintenance and update them when fixed.`,
}

export const ROLE_MANUALS: Record<string, string> = {
  property_owner: `${ROLE_HELP_GETTING_STARTED.property_owner}

## Daily tasks
- Check dashboard for overdue rent
- Record MoMo payments when received
- Send reminders before due dates
- Share invite codes for vacant units

## FAQ
**Can tenants see my notes?** No. Owner notes and portfolio stats are stripped before any tenant screen.

**How do tenants register?** They use your join link at /join — free for them forever.

**Subscription?** 14-day trial, then pay to 0793068911 via Plans & Billing.`,

  tenant: `${ROLE_HELP_GETTING_STARTED.tenant}

## FAQ
**Is the app free for me?** Yes. Your landlord pays; you never subscribe.

**Wrong balance?** Contact your landlord. Use Payments → I paid after sending MoMo.`,

  housekeeper: `${ROLE_HELP_GETTING_STARTED.housekeeper}`,
}
