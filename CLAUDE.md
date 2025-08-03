# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Shopify theme based on Dawn (v15.3.0) with extensive customizations for electronics/tech products. Features AI-generated blocks, interactive hotspots, and modern e-commerce functionality.

## Development Commands

**Primary Commands:**
- `shopify theme dev` - Start local development server with live reload
- `shopify theme push` - Deploy changes to connected store
- `shopify theme pull` - Sync theme files from Shopify store
- `shopify theme check` - Validate theme code and performance

**Store Connection:**
- Use `shopify theme list` to see available themes
- Connect to specific store with `shopify theme dev --store=STORE_NAME`

## Architecture

### Event System
- **pubsub.js**: Central event bus for component communication
- Pattern: `subscribe(eventName, callback)` and `publish(eventName, data)`
- Key events: `PUB_SUB_EVENTS.cartUpdate`, custom element interactions

### Custom Elements
- Web Components architecture with `customElements.define()`
- Cart system: `CartItems`, `CartRemoveButton`, `SlidingCartItems`
- Product system: `ProductInfo`, `ProductForm`, `VariantPicker`
- All elements extend `HTMLElement` with lifecycle methods

### Template Structure
- **templates/*.json**: Page-level configuration with section references
- **sections/*.liquid**: Reusable UI components with schema definitions
- **snippets/*.liquid**: Micro-components for repeated patterns
- **blocks/**: AI-generated interactive elements with hotspot functionality

### Asset Pipeline
- No build system - direct Liquid asset references
- CSS: Component-based with `component-*.css` naming
- JS: Module-based with deferred loading via `defer="defer"`
- Icons: Inline SVG system with `icon-*.svg` files

## Key Patterns

### Section Development
```liquid
{% schema %}
{
  "name": "Section Name",
  "settings": [...],
  "blocks": [...],
  "presets": [...]
}
{% endschema %}
```

### Asset Loading
```liquid
{{ 'component-name.css' | asset_url | stylesheet_tag }}
<script src="{{ 'script-name.js' | asset_url }}" defer="defer"></script>
```

### AI Block Integration
- Blocks prefixed with `ai_gen_block_*` contain interactive features
- Hotspot system with tooltip positioning and styling options
- Modal popups for forms and user interactions

## Critical Considerations

- **Performance**: Defer non-critical JS, optimize images, minimize CSS
- **Shopify Objects**: Use `product`, `cart`, `customer` objects correctly
- **Localization**: All user-facing text must use `{{ 'key' | t }}` syntax
- **Responsive**: Mobile-first approach with progressive enhancement