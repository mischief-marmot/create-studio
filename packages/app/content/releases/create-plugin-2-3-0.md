---
_published: true
title: 'Create 2.3: Enhanced List Creation'
description: 'Create 2.3 delivers an improved List editor with a new search pane that doesn''t get in the way of your workflow, item numbers in the editor, and enhanced drag-and-drop; plus sticky section headers and WYSIWYG formatting toolbars and PageSpeed fixes.'
version: '2.3.0'
product: 'create-plugin'
date: '2026-04-14'
highlights:
  - title: 'Redesigned List Editor'
    description: 'A new three-pane layout with permanent search, item numbers, and smoother drag-and-drop.'
    type: 'feature'
  - title: 'Sticky Section Headers & Toolbars'
    description: 'Section headers and formatting toolbars stay visible as you scroll through long recipes and how-to guides.'
    type: 'feature'
  - title: 'Ad Provider Setting'
    description: 'Choose whether Mediavine ad slot markup appears in your cards, or disable it for non-Mediavine setups.'
    type: 'feature'
previousVersion: '2.2.0'
faq:
  - question: 'Do I need to change anything to use the new list editor?'
    answer: 'No. The redesigned list editor is available automatically when you update to Create 2.3. Your existing lists and workflow carry over, the new layout simply gives you more room to work.'
  - question: 'What are the three panes in the list editor?'
    answer: 'The search pane on the left lets you find and add content, the editor pane in the center is where you arrange and edit items, and the preview pane on the right shows a live rendering of your list. On smaller screens the panes collapse responsively.'
  - question: 'Will the sticky toolbar slow down my editor?'
    answer: 'No. The sticky toolbar uses native CSS positioning and only activates when the content area is tall enough to scroll. There is no performance impact.'
  - question: 'What does the Ad Provider setting do?'
    answer: 'It lets you control whether Mediavine ad slot markup is included in your Create cards. If you use a different ad network or no ads at all, you can disable it to keep your card markup clean.'
---

Create 2.3 delivers a **redesigned list editor** built for faster, less frustrating list creation; plus sticky section headers and formatting toolbars that follow you as you scroll through long [recipes](/features/recipe-cards) and [how-to guides](/features/how-to-cards).

## What's New in Create 2.3

- **Redesigned list editor**: three-pane layout with a permanent search panel, item numbers, and smoother drag-and-drop
- **Sticky section headers**: recipe and how-to section headers stay visible as you scroll, so you always know where you are
- **Sticky formatting toolbar**: bold, italic, links, and headings follow you down the page in long instruction fields
- **Ad Provider setting**: choose whether Mediavine ad slot markup appears in your cards
- **Configurable default admin page**: set which Create admin page loads first
- **Copy-to-clipboard on errors**: easily share error details with support
- **PageSpeed fix**: eliminated layout reflow triggered by card size detection
- **Editor stability**: resolved crashes related to Slate selection sync, importer rendering, and card preview errors

## Redesigned List Editor

*Special thanks to Rebecca at [Unexpectedly Domestic](https://www.unexpectedlydomestic.com/) for her feedback that helped shape the new list editor.*

The list editor has been rebuilt with a three-pane layout that gives you a permanent search panel, a scrollable editor, and a live preview all visible at the same time. Item numbers appear in the editor so you always know the order at a glance, and drag-and-drop has been reworked with scroll compensation and state tracking to eliminate the reorder bugs that could occur with rapid edits.

::release-demo-plugin-230{feature="list-editor"}
::

### Search Without Losing Your Place

The search pane sits permanently on the left side of the editor instead of opening as a modal or overlay. Search for posts, recipes, how-to guides, or pages and add them to your list without losing your scroll position or context in the editor. Filter by content type and use the keyboard shortcut (Cmd+/ or Ctrl+/) to jump straight to the search input.

### Item Numbers & Drag-and-Drop

Every list item now displays its number in a colored tab on the left edge. Numbers update instantly as you drag items to new positions, and arrow buttons let you reorder with precision when drag-and-drop isn't convenient. The header layout puts the most important details (position, drag handle, title) right where you need them.

### Sync Scroll (Pro)

Pro users can enable **Sync Scroll** under Create > Settings > Advanced > Editor Behavior. When turned on, scrolling through list items in the editor automatically scrolls the preview pane to the matching item so you always see what you're editing.

## Sticky Section Headers & Formatting Toolbar

Long recipe and how-to cards can have dozens of fields spread across many sections. In Create 2.3, section headers stick to the top of the editor as you scroll, so you always know which section you're editing. The WYSIWYG formatting toolbar also sticks below the section header, keeping your formatting tools within reach no matter how long your instructions get.

::release-demo-plugin-230{feature="sticky-toolbar"}
::

## Ad Provider Setting

A new setting lets you manually control whether Mediavine ad slot markup is included in your Create cards (formerly an automatic process only). If you use a different ad network, or no ads at all, you can now disable the ad slots to keep your card markup clean and avoid unnecessary DOM elements.

## Bug Fixes

Create 2.3 also includes stability and performance improvements:

- **PageSpeed improvement**: eliminated layout reflow triggered by card size detection, improving Core Web Vitals scores
- **Editor crashes**: resolved edge-case crashes related to the WYSIWYG editor, importer page rendering, and card preview errors
