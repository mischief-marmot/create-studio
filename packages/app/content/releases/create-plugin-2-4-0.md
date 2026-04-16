---
_published: true
title: 'Create 2.4: Amazon Creators API Migration'
description: 'Create 2.4 migrates the Amazon affiliate product integration to Amazon''s new Creators API ahead of the April 30, 2026 PA-API deprecation.'
version: '2.4.0'
product: 'create-plugin'
date: '2026-04-16'
highlights:
  - title: 'Amazon Creators API Integration'
    description: 'Migrates the Amazon PA-API affiliate integration to the new Creators API ahead of the April 30, 2026 PA-API deprecation.'
    type: 'feature'
  - title: 'Fixed-Height Editor Panes'
    description: 'Recipe and how-to editors now scroll independently pane-by-pane, matching the list editor layout.'
    type: 'fix'
previousVersion: '2.3.0'
faq:
  - question: 'Why is Amazon PA-API being deprecated?'
    answer: 'Amazon is retiring the legacy Product Advertising API (PA-API) on April 30, 2026 in favor of the new Creators API, which uses OAuth 2.0 for authentication. All Amazon affiliate integrations that rely on PA-API need to migrate before that date to keep working.'
  - question: 'Do I need to do anything to switch to the new API?'
    answer: 'Yes. You''ll need to generate new credentials (a Credential ID and Credential Secret) from your Amazon Associates account and add them under Create > Settings > Affiliates > Amazon. The new credentials replace the old Access Key, Secret Key, and Partner Tag fields. A step-by-step setup tutorial is linked in this release note.'
  - question: 'Will my existing PA-API credentials still work?'
    answer: 'They''ll keep working until Amazon shuts off PA-API on April 30, 2026. After that, you''ll need to be on the Creators API to continue scraping Amazon product data.'
  - question: 'What happens to my existing Amazon product cards after PA-API is deprecated?'
    answer: 'Published Amazon product cards already on your site will keep rendering — images, prices, and affiliate links stay on the page. However, Create periodically refreshes Amazon product data in the background so details like prices and availability stay accurate. That periodic refresh is also a requirement of Amazon''s Associates Program Operating Agreement. Once PA-API shuts down on April 30, 2026, sites still using legacy credentials will stop getting those refreshes — existing product cards will grow stale over time and drift out of TOS compliance. Adding Creators API credentials before the cutoff keeps the refreshes running.'
  - question: 'Does this work on my PHP version?'
    answer: 'Yes! It will work on PHP 7.4 and above, matching the rest of the Create plugin.'
  - question: 'What changed in the Recipe and How-To editors?'
    answer: 'The three panes in the Recipe and How-To editors now have fixed heights and scroll independently, just like the list editor introduced in Create 2.3. This keeps your section navigation and preview visible while you scroll through long ingredient or instruction lists.'
---

Create 2.4 is a focused release centered on one thing: **migrating the Amazon affiliate product integration to Amazon's new Creators API** before the legacy Product Advertising API (PA-API) is turned off on **April 30, 2026**.

If you use [Create's Amazon affiliate integration](/features/lists-and-roundups) to pull product details into your [lists](/features/lists-and-roundups) or [recipe cards](/features/recipe-cards), this release is the migration path. If you don't, you'll still benefit from better editor ergonomics in [recipe cards](/features/recipe-cards) and [how-to guides](/features/how-to-cards).

## What's New in Create 2.4

- **Amazon Creators API integration**: OAuth 2.0 replacement for the deprecated PA-API, available on PHP 7.4+
- **Actionable Amazon error messages**: every documented Creators API error is mapped to clear, specific guidance
- **Masked credential inputs**: Credential Secret and PA-API Secret Key fields now have show/hide toggles
- **Region-aware marketplace routing**: DE/FR/IT/ES and other marketplaces now route to the correct Amazon domain
- **Fixed-height editor panes**: recipe and how-to editors scroll independently pane-by-pane
- **Sticky section headers fix**: section headers no longer hide behind the editor's control bar

## Amazon Creators API Migration

Amazon is **deprecating PA-API 5.0 on April 30, 2026** in favor of the new [Creators API](https://affiliate-program.amazon.com/help/topic/t442), which uses OAuth 2.0. Create 2.4 adds full support for the new API alongside the legacy one, so you can migrate on your own timeline before the cutoff.

Under **Create > Settings > Affiliates > Amazon**, you'll find new fields for the Creators API: a **Credential ID**, a **Credential Secret**, and a marketplace region selector. Once you add those, Create routes all Amazon product lookups through the Creators API instead of PA-API. The legacy Access Key, Secret Key, and Partner Tag fields remain available until the cutoff date; they now show a deprecation badge so you always know where you stand.

### Step-by-step setup tutorial

Getting Amazon Creators API credentials requires a few clicks inside your Amazon Associates dashboard. We put together an interactive walkthrough:

**[How to set up Amazon Creators API credentials for Create](https://www.wizardshot.com/tutorials/51132?utm_source=create.studio&utm_medium=release-notes&utm_campaign=create-plugin-2.4.0&utm_content=amazon-creators-setup)**

### Region-aware marketplace routing

The Creators API requires each request to declare the target marketplace domain. Previously, non-UK European marketplaces (DE, FR, IT, ES, and others) could silently route through the wrong endpoint. Create 2.4 maps every marketplace setting to the correct Amazon domain so product lookups return accurate, localized results for your region.

### What happens to my existing product cards?

Any Amazon product cards already published on your site will keep rendering exactly as they are — images, prices, and affiliate links don't vanish on April 30, 2026.

What does stop is the **background refresh**. Create periodically re-fetches Amazon product data in the background so details like price, availability, and star ratings don't go stale on your readers. That periodic refresh also isn't just a nice-to-have; it's a requirement of Amazon's [Associates Program Operating Agreement](https://affiliate-program.amazon.com/help/operating/agreement), which requires that published product information stay accurate and current.

Once PA-API shuts down, sites still using legacy credentials will silently stop getting fresh product data. Existing cards will grow stale over time — and drift out of TOS compliance. **Adding Creators API credentials before the April 30, 2026 cutoff keeps the refreshes running and your cards compliant.**

## Fixed-Height Editor Panes

Create 2.3 introduced a fixed-height, independently-scrolling three-pane layout for the [list editor](/releases/create-plugin-2-3-0). Create 2.4 brings the same layout to the [recipe](/features/recipe-cards) and [how-to](/features/how-to-cards) editors.

In practice, this means you can scroll through a long ingredient list or a multi-step how-to guide without losing sight of the section navigation on the left or the live preview on the right. Each pane scrolls on its own, inside a fixed editor viewport; no more end-of-page scroll jumps to get back to the top of your recipe.

## Sticky Section Headers Fix

Section headers in the recipe, how-to, and list editors had a subtle bug where they appeared to stick in place but actually scrolled behind the editor's control bar, making them invisible at the exact moment you needed them. Create 2.4 fixes this: section headers now stay fully visible above the control bar as you scroll, so you always know which section you're editing.

## Upgrade Notes

- **No breaking changes.** Existing PA-API credentials keep working until Amazon's April 30, 2026 cutoff.
- **Recommended action:** Generate Creators API credentials from your Amazon Associates account and add them in Create > Settings > Affiliates > Amazon before the cutoff date.
