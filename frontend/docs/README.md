# ResumeCraft Frontend Documentation

Welcome to the ResumeCraft frontend documentation. This directory contains comprehensive guides for using and extending the design system.

## 📚 Documentation Index

### [Component Documentation](./COMPONENT_DOCUMENTATION.md)
Complete guide to all UI components including:
- Button, Form components, Card, Badge, Avatar
- Modal, Toast, Loading states
- Typography utilities
- Usage examples and best practices

### [Animation Guidelines](./ANIMATION_GUIDELINES.md)
Comprehensive guide to animations including:
- Motion variants and patterns
- Animation timing and easing
- Accessibility considerations
- Performance optimization
- Common animation patterns

### [Responsive Design Guide](./RESPONSIVE_DESIGN_GUIDE.md)
Complete responsive design guide including:
- Breakpoint system
- Responsive utilities
- Mobile-first approach
- Common responsive patterns
- Testing checklist

### [Improvements Summary](./IMPROVEMENTS_SUMMARY.md)
Summary of all UI/UX improvements including:
- New components and features
- Enhanced utilities
- Documentation overview
- Usage examples

## 🚀 Quick Start

### Using Components

```jsx
import { Button, Card, Badge, Avatar } from '@/components/ui'

// Button with variants
<Button variant="success">Save</Button>

// Card with hover effect
<Card hover>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>

// Badge
<Badge variant="success">Active</Badge>

// Avatar
<Avatar src="/user.jpg" fallback="JD" size="lg" />
```

### Using Typography

```jsx
// Heading classes
<h1 className="h1">Heading 1</h1>
<h2 className="h2">Heading 2</h2>

// Responsive text
<p className="text-responsive-base">Responsive text</p>

// Gradient text
<h1 className="h1 text-gradient">Gradient Heading</h1>
```

### Using Responsive Utilities

```jsx
// Responsive grid
<div className="grid-responsive">
  <Card>Item 1</Card>
  <Card>Item 2</Card>
</div>

// Responsive flex
<div className="flex-responsive">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

// Responsive container
<div className="container-md">
  Content
</div>
```

### Using Theme

```jsx
import { useTheme } from '@/contexts/ThemeContext'

const { toggleTheme, toggleContrast, isDark, isHighContrast } = useTheme()

// Toggle theme
<Button onClick={toggleTheme}>
  {isDark ? 'Light' : 'Dark'} Mode
</Button>

// Toggle contrast
<Button onClick={toggleContrast}>
  {isHighContrast ? 'Normal' : 'High'} Contrast
</Button>
```

## 🎨 Design System

### Colors

The design system uses CSS variables for theming:

- `--primary`: Primary brand color
- `--secondary`: Secondary color
- `--destructive`: Error/destructive actions
- `--muted`: Muted backgrounds
- `--accent`: Accent color
- `--background`: Page background
- `--foreground`: Text color

### Typography

- **Font Family**: Plus Jakarta Sans (primary), Inter (fallback)
- **Font Sizes**: Responsive utilities available
- **Font Weights**: 400, 500, 600, 700, 800

### Spacing

- Uses Tailwind's spacing scale
- Responsive spacing utilities available
- Mobile-first approach

### Breakpoints

- `xs`: 475px
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

## 🔧 Development

### Adding New Components

1. Create component in `src/components/ui/`
2. Export from `src/components/ui/index.js`
3. Add to component documentation
4. Include accessibility features
5. Support dark mode and high contrast

### Adding Animations

1. Use predefined motion variants from `motionVariants.ts`
2. Respect `prefers-reduced-motion`
3. Use GPU-accelerated properties
4. Follow animation guidelines

### Testing Responsiveness

1. Test on real devices when possible
2. Use browser DevTools device emulation
3. Test all breakpoints
4. Verify touch targets (min 44px)
5. Check text readability

## 📖 Additional Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [Radix UI Documentation](https://www.radix-ui.com/docs)
- [Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## 🤝 Contributing

When contributing to the design system:

1. Follow existing patterns
2. Maintain accessibility standards
3. Add documentation
4. Include examples
5. Test across devices
6. Support dark mode and high contrast

---

For detailed information, see the individual documentation files linked above.

