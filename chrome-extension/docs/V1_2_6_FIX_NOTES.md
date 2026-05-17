# v1.2.6 Fix Notes

- Variant 02 Tree Status Badge only.
- Floating logo is fixed to left rail first.
- If left rail is unavailable, the badge falls back to centered placement above the composer.
- Floating badge scale is fixed to 90%.
- Hover and entry nudge text scale is fixed to 90%.
- High-entry detection uses token-threshold crossing, so direct low/high paste and medium/high typing both trigger the high nudge once per prompt session.
- High hover uses high.hover messages and high.on_send_hover when applicable.
- Bubble placement is computed near the badge first and rejects placements that intersect the editor/composer area.
