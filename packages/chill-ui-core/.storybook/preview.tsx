// Import your global CSS file (includes Google Fonts)
import "../global.css"

import type { Preview } from "@storybook/react";
import { AutocompleteDropdownContext } from "../src/components/AutocompleteDropdown";

const cleanDescription = (description: string): string => {
  if (!description) return '';
  
  let cleaned = description.replace(/@param[\s\S]*/g, '').trim();
  
  const importMatch = cleaned.match(/<!-- STORYBOOK_IMPORT_START([\s\S]*?)STORYBOOK_IMPORT_END -->/);
  if (importMatch) {
    const importContent = importMatch[1].trim();
    cleaned = cleaned.replace(
      /<!-- STORYBOOK_IMPORT_START[\s\S]*?STORYBOOK_IMPORT_END -->/,
      `## Import\n${importContent}`
    );
  }
  
  // Remplacer @example par un titre markdown
  cleaned = cleaned.replace(/@example/gi, '## Example');
  
  return cleaned;
};

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    docs: {
      extractComponentDescription: (component: any) => {
        const docgen = component.__docgenInfo;
        if (!docgen?.description) return '';
        
        return cleanDescription(docgen.description);
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => {
      // Fonts are loaded via CSS (Google Fonts), no need for Expo Font in Storybook
      return <AutocompleteDropdownContext> <Story /></AutocompleteDropdownContext>;
    },
  ],
};

export default preview;