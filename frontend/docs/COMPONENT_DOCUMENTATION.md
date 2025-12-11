# Component Documentation

This document provides comprehensive documentation for all UI components in the ResumeCraft design system.

## Table of Contents

- [Button](#button)
- [Form Components](#form-components)
- [Card](#card)
- [Badge](#badge)
- [Avatar](#avatar)
- [Modal](#modal)
- [Toast](#toast)
- [Loading States](#loading-states)
- [Typography](#typography)

---

## Button

A versatile button component with multiple variants and sizes.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'destructive' \| 'success' \| 'warning' \| 'outline' \| 'secondary' \| 'ghost' \| 'link' \| 'brand'` | `'default'` | Button style variant |
| `size` | `'default' \| 'sm' \| 'lg' \| 'icon'` | `'default'` | Button size |
| `disabled` | `boolean` | `false` | Disable the button |
| `className` | `string` | - | Additional CSS classes |
| `children` | `ReactNode` | - | Button content |

### Variants

- **default**: Primary button with primary color
- **destructive**: Red button for destructive actions
- **success**: Green button for success actions
- **warning**: Yellow button for warning actions
- **outline**: Outlined button with transparent background
- **secondary**: Secondary button with muted colors
- **ghost**: Ghost button with no background
- **link**: Link-styled button
- **brand**: Brand-colored button

### Sizes

- **sm**: Small button (36px height on desktop, 44px on mobile)
- **default**: Default button (40px height on desktop, 44px on mobile)
- **lg**: Large button (48px height)
- **icon**: Square icon button

### Example

```jsx
import { Button } from '@/components/ui'

// Primary button
<Button variant="default" size="lg">
  Click Me
</Button>

// Success button
<Button variant="success">
  Save Changes
</Button>

// Destructive button
<Button variant="destructive">
  Delete
</Button>

// Icon button
<Button variant="ghost" size="icon">
  <Icon />
</Button>
```

---

## Form Components

### Input

Text input field with validation states.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `string` | `'text'` | Input type |
| `error` | `string` | - | Error message |
| `valid` | `boolean` | `false` | Show valid state |
| `className` | `string` | - | Additional CSS classes |

#### Example

```jsx
import { Input, FormField } from '@/components/ui'

<FormField label="Email" required error={errors.email}>
  <Input
    type="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    error={errors.email}
    valid={!errors.email && email}
  />
</FormField>
```

### Textarea

Multi-line text input.

#### Example

```jsx
<FormField label="Description">
  <Textarea
    rows={4}
    value={description}
    onChange={(e) => setDescription(e.target.value)}
  />
</FormField>
```

### Select

Dropdown select input.

#### Example

```jsx
<FormField label="Country">
  <Select value={country} onChange={(e) => setCountry(e.target.value)}>
    <option value="">Select a country</option>
    <option value="us">United States</option>
    <option value="uk">United Kingdom</option>
  </Select>
</FormField>
```

### Checkbox

Checkbox input.

#### Example

```jsx
<label className="flex items-center gap-2">
  <Checkbox
    checked={agreed}
    onChange={(e) => setAgreed(e.target.checked)}
  />
  <span>I agree to the terms</span>
</label>
```

### Switch

Toggle switch component.

#### Example

```jsx
<Switch
  checked={enabled}
  onCheckedChange={setEnabled}
/>
```

### Radio & RadioGroup

Radio button inputs.

#### Example

```jsx
import { Radio, RadioGroup } from '@/components/ui'

<RadioGroup
  name="option"
  value={selected}
  onChange={setSelected}
>
  <Radio value="option1" label="Option 1" />
  <Radio value="option2" label="Option 2" />
  <Radio value="option3" label="Option 3" />
</RadioGroup>
```

### DatePicker

Date input field.

#### Example

```jsx
import { DatePicker, FormField } from '@/components/ui'

<FormField label="Birth Date">
  <DatePicker
    value={date}
    onChange={(e) => setDate(e.target.value)}
  />
</FormField>
```

### FileUpload

File upload component with drag-and-drop support.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `accept` | `string` | - | Accepted file types (e.g., "image/*") |
| `multiple` | `boolean` | `false` | Allow multiple files |
| `onChange` | `function` | - | Change handler |

#### Example

```jsx
import { FileUpload, FormField } from '@/components/ui'

<FormField label="Upload Resume">
  <FileUpload
    accept=".pdf,.doc,.docx"
    onChange={(e) => handleFileUpload(e.target.files)}
  />
</FormField>
```

---

## Card

Card component for displaying content in containers.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `gradient` | `boolean` | `false` | Enable gradient background |
| `glow` | `boolean` | `false` | Enable glow effect on hover |
| `hover` | `boolean` | `false` | Enable hover lift effect |
| `className` | `string` | - | Additional CSS classes |

### Sub-components

- `CardHeader`: Card header section
- `CardTitle`: Card title
- `CardDescription`: Card description
- `CardContent`: Card main content
- `CardFooter`: Card footer section

### Example

```jsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui'

<Card hover>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    Card content goes here
  </CardContent>
</Card>
```

---

## Badge

Badge component for labels, tags, or status indicators.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'success' \| 'warning' \| 'destructive' \| 'outline'` | `'default'` | Badge variant |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | Badge size |
| `className` | `string` | - | Additional CSS classes |

### Example

```jsx
import { Badge } from '@/components/ui'

<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="destructive">Error</Badge>
```

---

## Avatar

Avatar component for displaying user profile pictures or initials.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | `string` | - | Image source URL |
| `alt` | `string` | - | Alt text for the image |
| `fallback` | `string` | - | Fallback text (usually initials) |
| `size` | `'sm' \| 'default' \| 'lg' \| 'xl'` | `'default'` | Avatar size |
| `className` | `string` | - | Additional CSS classes |

### AvatarGroup

Component for displaying multiple avatars.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `max` | `number` | `3` | Maximum number of avatars to show |
| `children` | `ReactNode` | - | Avatar components |

### Example

```jsx
import { Avatar, AvatarGroup } from '@/components/ui'

// Single avatar
<Avatar
  src="/user.jpg"
  alt="User"
  fallback="JD"
  size="lg"
/>

// Avatar group
<AvatarGroup max={3}>
  <Avatar src="/user1.jpg" fallback="U1" />
  <Avatar src="/user2.jpg" fallback="U2" />
  <Avatar src="/user3.jpg" fallback="U3" />
  <Avatar src="/user4.jpg" fallback="U4" />
</AvatarGroup>
```

---

## Modal

Modal component for dialogs and overlays.

### Components

- `Modal`: Main modal container
- `ModalHeader`: Modal header
- `ModalTitle`: Modal title
- `ModalDescription`: Modal description
- `ModalContent`: Modal content
- `ModalFooter`: Modal footer

### Example

```jsx
import { Modal, ModalHeader, ModalTitle, ModalContent, ModalFooter, Button } from '@/components/ui'

<Modal isOpen={isOpen} onClose={onClose}>
  <ModalHeader>
    <ModalTitle>Confirm Action</ModalTitle>
  </ModalHeader>
  <ModalContent>
    Are you sure you want to proceed?
  </ModalContent>
  <ModalFooter>
    <Button variant="outline" onClick={onClose}>Cancel</Button>
    <Button variant="destructive" onClick={handleConfirm}>Confirm</Button>
  </ModalFooter>
</Modal>
```

---

## Toast

Toast notification component.

### Usage

```jsx
import { useToast } from '@/components/ui'

const { showToast } = useToast()

showToast({
  message: 'Operation successful!',
  type: 'success',
  duration: 5000
})
```

### Types

- `info`: Blue toast for informational messages
- `success`: Green toast for success messages
- `warning`: Yellow toast for warnings
- `error`: Red toast for errors
- `rateLimit`: Purple toast for rate limit messages

---

## Loading States

### Components

- `LoadingSpinner`: Basic loading spinner
- `PageLoading`: Full page loading indicator
- `ButtonLoading`: Loading state for buttons
- `Skeleton`: Generic skeleton loader
- `SkeletonText`: Text skeleton
- `SkeletonCard`: Card skeleton
- `Progress`: Progress bar
- `CircularProgress`: Circular progress indicator

### Example

```jsx
import { LoadingSpinner, SkeletonCard, Progress } from '@/components/ui'

// Spinner
<LoadingSpinner />

// Skeleton
<SkeletonCard />

// Progress
<Progress value={75} max={100} />
```

---

## Typography

### Heading Classes

Use semantic heading classes for consistent typography:

```jsx
<h1 className="h1">Heading 1</h1>
<h2 className="h2">Heading 2</h2>
<h3 className="h3">Heading 3</h3>
<h4 className="h4">Heading 4</h4>
<h5 className="h5">Heading 5</h5>
<h6 className="h6">Heading 6</h6>
```

### Responsive Text Utilities

- `.text-responsive-sm`: Small responsive text
- `.text-responsive-base`: Base responsive text
- `.text-responsive-lg`: Large responsive text
- `.text-responsive-xl`: Extra large responsive text
- `.text-responsive-2xl`: 2XL responsive text
- `.text-responsive-3xl`: 3XL responsive text

### Text Utilities

- `.text-balance`: Balanced text wrapping
- `.text-pretty`: Pretty text wrapping
- `.text-gradient`: Gradient text effect
- `.text-gradient-brand`: Brand gradient text
- `.text-shadow-sm`: Small text shadow
- `.text-shadow`: Default text shadow
- `.text-shadow-lg`: Large text shadow

### Example

```jsx
<h1 className="h1 text-gradient">Gradient Heading</h1>
<p className="text-responsive-base text-balance">
  Responsive text that balances nicely
</p>
```

---

## Best Practices

1. **Accessibility**: Always provide proper labels, ARIA attributes, and keyboard navigation
2. **Responsive Design**: Use responsive utilities for mobile-first design
3. **Theme Support**: All components support dark mode automatically
4. **Animation**: Components respect `prefers-reduced-motion` for accessibility
5. **Consistency**: Use the design system components instead of custom implementations

---

## Component Composition

Components are designed to be composable:

```jsx
<Card hover>
  <CardHeader>
    <div className="flex items-center gap-2">
      <Avatar src="/user.jpg" fallback="JD" size="sm" />
      <div>
        <CardTitle>User Name</CardTitle>
        <Badge variant="success">Active</Badge>
      </div>
    </div>
  </CardHeader>
  <CardContent>
    <FormField label="Email">
      <Input type="email" />
    </FormField>
  </CardContent>
  <CardFooter>
    <Button variant="primary">Save</Button>
    <Button variant="outline">Cancel</Button>
  </CardFooter>
</Card>
```

---

For more information, see the [Animation Guidelines](./ANIMATION_GUIDELINES.md) and [Theme Documentation](../src/contexts/ThemeContext.jsx).

