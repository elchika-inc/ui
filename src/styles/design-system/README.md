# elchika inc. — Design Tokens

Read this first. It maps the files, states what must not be broken, and lists
what is still open.

**Current version: v1.8**

---

## Files

| File | Role |
|---|---|
| `design-tokens.html` | **Source of truth.** The spec page. All token values live in its `<style>` block. Open it in a browser to read the system; edit it to change the system. ~2000 lines. |
| `build-tokens.mjs` | Generates `tokens.css` and `brands.css` from the spec page, then verifies the result. No dependencies. |
| `tokens.css` | **Generated — do not edit.** Core tokens for both themes, plus density and language variants. |
| `brands.css` | **Generated — do not edit.** The unadopted product hue reserve. Loading it is optional. |
| `tailwind.config.js` | Hand-maintained. Maps tokens to utility names — a naming decision, so not generated. The build verifies its references resolve and warns about tokens it does not expose. |
| `typeface-compare.html` | Scratch. Used once to pick the Japanese typeface; kept for the record. Not part of the system. |

## Workflow

```bash
node build-tokens.mjs          # generate + verify
node build-tokens.mjs --check  # verify only; exits 1 on failure (use in CI)
```

Edit `design-tokens.html`, rebuild, commit all four files together. Never edit
`tokens.css` or `brands.css` by hand — the next build overwrites them.

## Where things are in the spec page

Values live in the `<style>` block near the top, in this order:

- `:root` — every token, light mode
- `[data-theme="dark"]` — dark overrides only
- `[data-density="compact"]` — density overrides
- `:lang(en)` — typesetting overrides for Latin
- `[data-brand="…"]` — the hue reserve

Everything below that in the `<style>` block styles the page itself, not the
system. The prose sections after it document each area and end with
**Decisions**, which records why each choice was made.

## Invariants

Breaking these quietly undoes work that was done for a reason. Each is
explained in the Decisions section.

1. **Products override Layer 0 only.** A product may redefine `--brand-100/300/400/600/700`.
   It must never redefine a `--color-*` token — that layer is the contract between products.
2. **Status colours are never overridden.** Green and red meaning different things
   in different products is a safety problem, not a branding choice.
3. **Warm hues are reserved for status.** Product and chart colours stay on the
   cool arc (222°–334°). A warm product colour reads as a signal.
4. **`indigo` is effectively unusable.** ΔE 7.4 from the corporate blue; indistinguishable
   under protanopia. Needing a sixth hue means stop identifying products by colour.
5. **Chart series cap at five.** Past five, drop the legend and label lines directly.
6. **Colour is never the only carrier of meaning.** Status = colour + glyph + shape.
   Chart series = colour + dash pattern.
7. **Contrast is enforced, not assumed.** Every text pair clears 4.5:1 and every
   control boundary clears 3:1, in both themes. The build fails otherwise.
8. **Density never touches `--space-*`.** It has its own tokens and applies only to
   tables, lists and toolbars.
9. **No manual spaces between Japanese and Latin text.** Spacing is the
   typesetter's job; manual spaces break translation, search and screen readers.

## Decided

- Blue-led with a yellow accent, aimed at "intellectual and curious"
- IBM Plex Sans JP / Plex Sans / Plex Mono, with Mono as the label-and-numeral layer
- Japanese body at 16px / 1.75 leading / +0.02em tracking
- Tabular numerals for anything that updates in place
- All products inherit the corporate blue; per-product hues exist only as a reserve
- Tailwind overrides (not extends) `spacing`, `fontWeight` and `screens`, so
  out-of-system values cannot be written

## Open

- **Logo and wordmark.** Being designed separately. Since products share one colour,
  identification rests on the mark — this is the largest open item, and the reason
  the hue reserve was kept.
- **Icons.** lucide is the chosen set. Status glyphs in the spec page are still
  placeholder characters (`✓ ! × i`) and should be swapped for real icons.
- **Tailwind coverage.** 29 tokens are defined but not exposed as utilities. The
  build lists them. Expose the ones that are actually needed rather than all of them.
- **Component tokens (Layer 2).** Deliberately not built. States are shared instead.
  Revisit only if a component genuinely cannot be expressed with the current layers.

## If you are picking this up cold

Open `design-tokens.html` in a browser before reading its source — it is a
document, not just a stylesheet, and reading it rendered takes a few minutes
versus a long time reading 2000 lines. Then read the **Decisions** section at
the bottom. Most questions about "why is it like this" are answered there.

Run `node build-tokens.mjs --check` before and after any change. If it passes
before your change and fails after, the change broke something measurable.
