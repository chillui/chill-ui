# ChillUI

A modern, flexible React Native UI component library with 32+ production-ready components.

## Installation

```bash
npm install {{PACKAGE_NAME}}
```

## Quick Start

```tsx
import { Button, Input, Avatar } from '{{PACKAGE_NAME}}';

export default function App() {
  return (
    <>
      <Avatar source={{ uri: 'https://i.pravatar.cc/150' }} size="lg" />
      <Input placeholder="Enter your email" />
      <Button onPress={() => console.log('Pressed!')}>Get Started</Button>
    </>
  );
}
```

## Features

- 🎨 **32+ Components** - From basic inputs to complex carousels
- 🎯 **TypeScript** - Full type safety and IntelliSense support
- 🌐 **Cross-Platform** - iOS, Android, and Web
- ♿ **Accessible** - Built with accessibility in mind
- ⚡ **Performant** - Optimized animations

## Components

### Layout & Structure
Box, Wrapper, Separator

### Inputs & Forms
Input, MaskedInput, PhoneNumberInput, PlacesInput, Checkbox, Toggle, Slider, TimePicker, InputDropdown, InputSelectDropdown, AutocompleteDropdown

### Buttons & Actions
Button, ButtonIcon, RipplePressable, ScalePressable

### Display & Feedback
Avatar, Chip, Icon, String/Text, Skeleton, LoadingIndicatorsKit, Toast, HighlightString

### Navigation & Organization
Accordion, Carousel, SegmentedControl, DropdownMenu

### Overlays & Modals
Dialog

### Animation
AnimatedBox, FadeInBox, SlideInBox, ScaleInBox, BounceBox, RotatingBox

## Documentation

Full documentation and examples: [GitHub Repository](https://github.com/chillui/chill-ui)

## License

MIT © [ChillUI](https://github.com/chillui/chill-ui/LICENSE.md)
