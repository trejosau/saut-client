# SAUT — UI Patterns

## Purpose

This document governs composition. Exact component styling and tokens remain in `saut-DESIGN.md` and the three token representations.

## Storefront hierarchy

Default commerce priority:

1. product/campaign imagery;
2. product or collection identity;
3. price and availability;
4. options such as color/size;
5. primary action;
6. supporting detail.

Do not make navigation chrome visually compete with the product.

## Home / campaign landing

Use campaign tiles and product groups to create contrast between editorial storytelling and commerce.

A campaign section should have a clear visual thesis. Avoid repeating the same centered hero + heading + paragraph + two buttons pattern throughout the site.

## Collection / PLP

Prioritize:

- collection identity;
- useful filters;
- product count/sort when relevant;
- product grid;
- product photography;
- clear active filter state.

Do not wrap every product in a decorative card shell when the canonical product card is flat.

## Product detail / PDP

Prioritize:

1. media;
2. product name;
3. price/status;
4. color/variant;
5. size;
6. primary action;
7. disclosures/details.

Use the canonical PDP disclosure row for expandable supporting information.

On mobile, preserve the ability to inspect product imagery while keeping purchase decisions understandable and reachable.

## Customization

The garment/canvas is the main object, not a decorative preview.

Keep the interface explicit about:

- selected garment;
- selected side/view;
- selected artwork/object;
- editable action;
- current state;
- product-supported constraints.

Do not invent print dimensions or manufacturing constraints that do not exist in product data.

## Search

Use the canonical search pill treatment. Search should prioritize fast product discovery over ornamental motion.

## Filters

Use the canonical filter chip and filter sidebar patterns.

Active filters must be visually unambiguous. On mobile, filtering may move into a drawer/sheet if the existing application pattern supports it.

## Cart / checkout

Reduce editorial spectacle as purchase commitment increases.

Prioritize:

- item identity;
- variant/size;
- quantity;
- price;
- errors;
- delivery/payment decisions;
- final action.

Do not hide essential checkout information behind decorative interaction.

## Empty / loading / error states

Design these states as part of the flow, not afterthoughts.

- Empty search: explain no results and provide a recovery action.
- Empty cart: return the user to shopping/customization.
- Loading: preserve layout when possible.
- Error: explain the affected action and the next possible recovery step.
- Disabled: remain legible and clearly non-interactive.

## Responsive

Do not scale desktop proportionally.

At each major breakpoint decide:

- what remains dominant;
- what stacks;
- what becomes horizontally scrollable;
- what moves into a drawer/sheet;
- what becomes sticky;
- what editorial composition must simplify.

Validate at minimum one narrow phone viewport and one desktop viewport.

## Motion

Use motion only when it communicates state, continuity, selection or direct manipulation.

Do not default to:

- fade-up on every section;
- parallax everywhere;
- hover-scale on every product;
- continuous decorative animation;
- long transitions that slow commerce.

Respect reduced-motion preferences.

## Anti-generic rule

Do not add a visual pattern because it is currently fashionable.

Specifically avoid defaulting to:

- SaaS hero composition;
- bento grids;
- glassmorphism;
- decorative gradients;
- floating glow/orb backgrounds;
- excessive rounded cards;
- generic AI copy;
- fake technical labels.

Use SAUT's product, photography, typography and canonical component language instead.
