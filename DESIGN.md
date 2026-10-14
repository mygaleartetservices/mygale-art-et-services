# Mygale Art et Services: design direction

Source of truth for every screen and every AI-assisted change (web app in
`apps/web`). If a request conflicts with it, flag the conflict before building.

## Product truth

A Yaoundé studio that designs and makes things with its hands: architecture
and site management, fashion design and pattern making, textile printing,
stained glass and glazing, construction supplies and websites. Clients arrive
from WhatsApp, a recommendation or Google Maps and want to know three things
fast: can they do my project, what have they made, how do I reach them. The
feeling to create: a serious atelier, precise like an architect's drawing,
alive like light through coloured glass.

## References (what we take from each)

| Reference | Trait we take |
| --- | --- |
| Stained-glass windows and their lead lines (primary) | Images set as panes inside thick dark "came" lines; colour appears where light passes |
| The Mygale spider logo | Navy-to-cobalt blue, sharp geometric legs, a web of lines that connects |
| Architectural drawings | Thin construction lines, precise labels, generous margins |
| West African atelier signage | Bold, wide capitals that can be read from across the street |

## Palette with roles

| Token | Value | Job |
| --- | --- | --- |
| `--canvas` | `#F3F2EE` | Plaster-white page background (never #fff) |
| `--surface` | `#FBFBF8` | Cards, forms |
| `--ink` | `#0E1A3A` | Text, the dark "lead" between panes, dark sections |
| `--ink-muted` | `#4B5470` | Secondary text |
| `--line` | `#D9DAE1` | Hairlines and borders |
| `--primary` | `#1F44C9` | Logo cobalt: primary actions, links, active states only |
| glass tints | amber `#E0A23A`, ruby `#B83A30`, emerald `#2E8A5A`, cobalt `#2B57DA` | Content colour inside the stained-glass panes, one per discipline. Never UI chrome |

Ratio: canvas 60%, ink 30% (type, lead lines, dark bands), cobalt 10%.

## Type roles

- **Display: Unbounded 600 to 700.** Wide, geometric capitals with the
  weight of atelier signage and the logo's lettering. Sentence case for
  headings; uppercase only for the wordmark.
- **Text: Instrument Sans 400/500/600.** Neutral, slightly narrow, with full
  French diacritics. French runs about 20% longer: layouts are checked in
  French first.

## Layout idea

Asymmetric and image-led. The services are a stained-glass window: an
irregular mosaic of photo panes separated by thick ink lines, one large pane
per row. Text sits in calm left-aligned columns beside it.

## Signature element

**The vitrail mosaic.** Service photos set as panes inside ink lead lines.
In the hero the panes light up one by one as if the sun came through; on
hover a pane takes its discipline's glass tint. Recognisable without the
logo.

## Motion (Level 2, expressive on marketing pages)

- Hero: headline words rise; mosaic panes uncover one after another with a
  clip-path wipe and a short tint flash, then settle. Desktop: the mosaic
  drifts slightly slower than the page (one parallax per page).
- Services mosaic: panes reveal on scroll in reading order; hover tints the
  pane and slides its caption up 6px.
- Reveals alternate direction section by section; lists stagger at 50ms.
- Mobile menu: drawer from the right with staggered links, focus trapped,
  ESC closes. Services dropdown opens on click and keyboard, not hover only.
- Lenis smooth scroll on the home, about and services pages only.
- Reduced motion: panes appear in place, no parallax, no smooth scroll.

## Boldness budget

Spent on the mosaic and the wide display type. Everything else is plaster,
ink and one blue.

## Ban list for this project

- Gradient buttons (the old navy-to-blue `btn-primary`), glow, glass
- A floating logo on an infinite loop
- Scale-up hover on buttons and cards; hover-only "learn more" links
- "Innovation, créativité, excellence" style triplets; Title Case headings
- Centred hero with three equal buttons
- Emoji or arrows in UI labels
