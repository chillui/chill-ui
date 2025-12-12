import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { action } from 'storybook/actions';

import { ICONS_OPTIONS } from '../src/constants';
import UiPresentation from './storybook/UiPresentation';
import { ButtonIconTw as ButtonIcon } from '../src/components';

const meta: Meta<typeof ButtonIcon> = {
  args: {
    as: 'touchable-opacity',
    colorVariant: 'primary',
    iconName: 'bell-solid',
    isDisabled: false,
    isLoading: false,
    onPress: action('onPress'),
    rounded: 'square',
    size: 'md',
    variant: 'contained',
  },
  argTypes: {
    as: {
      table: {
        defaultValue: {
          summary: 'touchable-opacity',
        },
      },
    },
    colorVariant: {
      control: 'select',
      options: [
        'accent',
        'danger',
        'dark',
        'error',
        'info',
        'inverted',
        'light',
        'muted',
        'neutral',
        'primary',
        'secondary',
        'success',
        'tertiary',
        'warning',
        'white',
      ],
      table: {
        defaultValue: {
          summary: 'primary',
        },
      },
    },

    iconName: {
      control: 'select',
      options: ICONS_OPTIONS,
    },
    isDisabled: {
      table: {
        defaultValue: {
          summary: false,
        },
      },
    },
    isLoading: {
      table: {
        defaultValue: {
          summary: false,
        },
      },
    },
    rounded: {
      control: 'select',
      options: ['circle', 'square'],
      table: {
        defaultValue: {
          summary: 'square',
        },
      },
    },

    variant: {
      control: 'select',
      options: ['contained', 'outlined'],
      table: {
        defaultValue: {
          summary: 'contained',
        },
      },
    },
  },
  component: ButtonIcon,
  decorators: [
    Story => (
      <UiPresentation className="items-center">
        <Story />
      </UiPresentation>
    ),
  ],
  title: 'ACTIONS/ButtonIcon',
};

export default meta;

type Story = StoryObj<typeof ButtonIcon>;

export const Default: Story = {
  args: {
    as: 'RipplePressable',
    iconName: 'bell-solid',
    isDisabled: false,
    isLoading: false,
    onPress: action('onPress'),
    size: 'md',
  },
};

export const Disabled: Story = {
  args: {
    ...Default.args,
    isDisabled: true,
  },
};

export const Loading: Story = {
  args: {
    ...Default.args,
    isLoading: true,
  },
};

export const Small: Story = {
  args: {
    ...Default.args,
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    ...Default.args,
    size: 'lg',
  },
};

export const ColoredIcons: Story = {
  args: {
    ...Default.args,
    iconColor: '#007AFF',
  },
  parameters: {
    docs: {
      description: {
        story: 'ButtonIcon with custom icon color',
      },
    },
  },
};

export const IconColorVariants: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Different icon colors for various use cases',
      },
    },
  },
  render: (_args: any) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
      <ButtonIcon iconName="bell-solid" iconColor="#007AFF" onPress={action('Blue icon pressed')} size="md" />
      <ButtonIcon iconName="home-solid" iconColor="#34C759" onPress={action('Green icon pressed')} size="md" />
      <ButtonIcon iconName="gear-solid" iconColor="#FF3B30" onPress={action('Red icon pressed')} size="md" />
      <ButtonIcon iconName="star-solid" iconColor="#FF9500" onPress={action('Orange icon pressed')} size="md" />
      <ButtonIcon iconName="heart-solid" iconColor="#AF52DE" onPress={action('Purple icon pressed')} size="md" />
    </div>
  ),
};

export const TouchableComparison: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Comparison of different touchable components - try pressing each button to see the different effects',
      },
    },
  },
  render: (_args: any) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
      <ButtonIcon as="touchable-opacity" iconName="bell-solid" onPress={action('TouchableOpacity pressed')} size="md" />
      <ButtonIcon as="pressable" iconName="bell-solid" onPress={action('Pressable pressed')} size="md" />
      <ButtonIcon as="ripple-pressable" iconName="bell-solid" onPress={action('RipplePressable pressed')} size="md" />
    </div>
  ),
};
