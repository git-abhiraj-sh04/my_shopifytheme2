# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Shopify theme called "Nexus" based on the Dawn theme (v15.3.0). It's a complete e-commerce theme with modern design patterns and extensive customization options.

## Architecture

### Core Structure
- **assets/**: JavaScript, CSS, and SVG assets for theme functionality
- **blocks/**: AI-generated Liquid blocks for customizable content
- **config/**: Theme configuration including settings schema and data
- **layout/**: Base Liquid layout templates (theme.liquid, password.liquid)
- **locales/**: Internationalization files for multiple languages
- **sections/**: Reusable Liquid sections for different page areas
- **snippets/**: Small, reusable Liquid components
- **templates/**: Page templates and customer account templates

### Key Components
- **Product System**: Product display, variants, media gallery, and forms
- **Cart System**: Drawer-based cart with notifications and live updates
- **Search**: Predictive search with faceted filtering
- **Collections**: Product grid with filtering and sorting
- **Customer Portal**: Complete account management system

### Asset Organization
- CSS components follow BEM-like naming: `component-*.css`
- JavaScript modules are feature-specific: `product-*.js`, `cart-*.js`
- SVG icons use semantic naming: `icon-*.svg`

## Development Commands

This is a Shopify theme project. Development typically involves:

1. **Shopify CLI**: Use `shopify theme dev` to start local development server
2. **Theme Push**: Use `shopify theme push` to deploy changes
3. **Theme Pull**: Use `shopify theme pull` to sync from Shopify

Note: No package.json found - this uses Shopify's native Liquid templating system.

## File Patterns

### Liquid Templates
- Sections use `{% schema %}` blocks for theme customization
- Snippets are included with `{% render 'snippet-name' %}`
- Localization uses `{{ 'key' | t }}` syntax

### JavaScript Architecture
- Uses ES6 modules with `pubsub.js` for event communication
- DOM manipulation without frameworks
- Lazy loading for performance optimization

### CSS Structure
- Component-based CSS organization
- CSS custom properties for theming
- Mobile-first responsive design

## Important Considerations

- All changes should maintain Shopify theme standards
- Liquid syntax and Shopify objects are core to functionality
- Performance optimization is critical for e-commerce
- Accessibility compliance is required
- Multi-language support must be maintained