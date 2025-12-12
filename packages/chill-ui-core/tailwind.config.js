/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,ts,tsx}', './src/**/*.{js,ts,tsx}', './.storybook/*.{js,ts,tsx}', './stories/**/*.{js,ts,tsx}'],

  plugins: [],
  // eslint-disable-next-line global-require
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        button: {
          accent: {
            background: '#CBD2D9',
            content: '#FF0000',
          },
          danger: {
            background: '#FF0000',
            content: '#FFF',
          },
          dark: {
            background: '#323F4B',
            content: '#FFF',
          },
          disabled: {
            background: '#CBD2D9',
            content: '#666',
          },
          error: {
            background: '#FF0000',
            content: '#FFF',
          },
          info: {
            background: '#6EE7B7',
            content: '#000',
          },
          inverted: {
            background: '#F5F7FA',
            content: '#000',
          },
          light: {
            background: '#F5F7FA',
            content: '#000',
          },
          muted: {
            background: '#CBD2D9',
            content: '#666',
          },
          neutral: {
            background: '#CBD2D9',
            content: '#333',
          },
          primary: {
            background: '#7DD3FC',
            content: '#000',
          },
          secondary: {
            background: '#CBD2D9',
            content: '#FCD34D',
          },
          warning: {
            background: '#FCD34D',
            content: '#000',
          },
          white: {
            background: '#F5F7FA',
            content: '#000',
          },
        },
        chip: {
          accent: {
            background: '#CBD2D9',
            text: '#FF0000',
          },
          danger: {
            background: '#FF0000',
            text: '#FFF',
          },
          dark: {
            background: '#323F4B',
            text: '#FFF',
          },
          disabled: {
            background: '#CBD2D9',
            text: '#666',
          },
          error: {
            background: '#FF0000',
            text: '#FFF',
          },
          info: {
            background: '#6EE7B7',
            text: '#000',
          },
          inverted: {
            background: '#F5F7FA',
            text: '#000',
          },
          light: {
            background: '#F5F7FA',
            text: '#000',
          },
          muted: {
            background: '#CBD2D9',
            text: '#666',
          },
          neutral: {
            background: '#CBD2D9',
            text: '#333',
          },
          primary: {
            background: '#7DD3FC',
            text: '#000',
          },
          secondary: {
            background: '#CBD2D9',
            text: '#333',
          },
          warning: {
            background: '#FCD34D',
            text: '#000',
          },
          white: {
            background: '#F5F7FA',
            text: '#000',
          },
        },
        danger: '#FF0000',
        dark: '#323F4B',
        disabled: '#CBD2D9',
        error: '#FF0000',
        info: '#6EE7B7',
        inverted: '#F5F7FA',
        light: '#F5F7FA',
        muted: '#CBD2D9',
        neutral: '#CBD2D9',
        primary: '#7DD3FC',
        secondary: '#CBD2D9',
        success: '#86EFAC',
        tertiary: '#CBD2D9',
        warning: '#FCD34D',
        white: '#F5F7FA',
      },
      fontFamily: {
        // Poppins (primary)
        primary_bold_font: ['Poppins', 'sans-serif'],
        primary_extra_bold_font: ['Poppins', 'sans-serif'],
        primary_extra_light_font: ['Poppins', 'sans-serif'],
        primary_italic_font: ['Poppins', 'sans-serif'],
        primary_light_font: ['Poppins', 'sans-serif'],
        primary_medium_font: ['Poppins', 'sans-serif'],
        primary_regular_font: ['Poppins', 'sans-serif'],
        primary_semi_bold_font: ['Poppins', 'sans-serif'],
        primary_thin_font: ['Poppins', 'sans-serif'],
        // Montserrat (secondary)
        secondary_bold_font: ['Montserrat', 'sans-serif'],
        secondary_extra_bold_font: ['Montserrat', 'sans-serif'],
        secondary_extra_light_font: ['Montserrat', 'sans-serif'],
        secondary_italic_font: ['Montserrat', 'sans-serif'],
        secondary_light_font: ['Montserrat', 'sans-serif'],
        secondary_medium_font: ['Montserrat', 'sans-serif'],
        secondary_regular_font: ['Montserrat', 'sans-serif'],
        secondary_semi_bold_font: ['Montserrat', 'sans-serif'],
        secondary_thin_font: ['Montserrat', 'sans-serif'],
        // Tertiary (fallback to Poppins)
        tertiary_bold_font: ['Poppins', 'sans-serif'],
        tertiary_extra_bold_font: ['Poppins', 'sans-serif'],
        tertiary_extra_light_font: ['Poppins', 'sans-serif'],
        tertiary_italic_font: ['Poppins', 'sans-serif'],
        tertiary_light_font: ['Poppins', 'sans-serif'],
        tertiary_medium_font: ['Poppins', 'sans-serif'],
        tertiary_regular_font: ['Poppins', 'sans-serif'],
        tertiary_semi_bold_font: ['Poppins', 'sans-serif'],
        tertiary_thin_font: ['Poppins', 'sans-serif'],
      },
      textColor: {
        primary: '#000',
      },
    },
  },
};
