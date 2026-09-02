# SAUT — Component Guidance

## Authority

The component definitions and exact visual values in `saut-DESIGN.md` are canonical.

This document explains reuse and refactor behavior. It must not redefine their dimensions, typography, colors, radii or spacing.

## Canonical visual components

The current SAUT reference defines:

- button primary;
- button primary active;
- button secondary;
- button outline on image;
- button icon circular;
- search pill;
- search pill focused;
- filter chip;
- filter chip active;
- badge promo;
- badge sale text;
- product card;
- product card image;
- swatch dot;
- swatch dot active;
- campaign tile;
- category icon card;
- member benefit card;
- faq row;
- pdp disclosure row;
- utility bar;
- primary nav;
- filter sidebar;
- footer.

When a current project component performs one of these jobs, refactor it toward the matching canonical component instead of creating another competing variant.

## Reuse rule

Reuse a component when it represents the same semantic job.

Do not create a duplicate because one page needs:

- different margin;
- a one-off color;
- a one-off radius;
- slightly different internal spacing;
- a page-specific class name.

Page composition belongs to the page/layout layer.

## States

A component implementation must preserve the states required by the product. Where a state is visually defined in `saut-DESIGN.md`, use that definition.

Where the product requires an additional state not yet defined:

1. preserve the component's established geometry and type system;
2. use existing canonical tokens;
3. solve accessibility first;
4. avoid inventing another visual language;
5. only promote the new state into the design system when it is reusable.

## Forms and controls not present in the snapshot

The canonical reference does not currently enumerate every possible form primitive.

Do not pretend that it does.

For controls needed by the product but absent from `saut-DESIGN.md`:

- use the canonical typography, spacing, radius and color system;
- make labels real labels, not placeholders;
- provide focus-visible behavior;
- associate errors with the relevant field;
- preserve keyboard and touch usability;
- avoid introducing a second styling system.

If a new control becomes a durable repeated pattern, update the design system intentionally rather than documenting a one-off implementation as canonical.

## Product cards

Product cards should keep photography and product identity dominant. Do not convert them into dashboard cards or add decorative containers without a product reason.

## Buttons

Use the canonical button treatments. Do not invent color variants for campaigns or pages. Campaign personality should primarily come from media and composition.

## Navigation and filters

Keep navigation and filtering predictable. Use the canonical primary nav, search pill, filter chips and sidebar as the visual baseline.

## Refactor rule

During refactoring:

1. locate duplicate implementations;
2. classify them by semantic job;
3. choose the canonical SAUT component;
4. preserve behavior;
5. consolidate implementation;
6. verify all affected states and breakpoints.

Do not refactor unrelated business logic merely to make the component tree look cleaner.
