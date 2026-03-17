import { createApp } from 'vue';
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';

import App from '@/App.vue';
import './style.scss';
import { definePreset } from '@primeuix/themes';

const Noir = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{slate.50}',
      100: '{slate.100}',
      200: '{slate.200}',
      300: '{slate.300}',
      400: '{slate.400}',
      500: '{slate.500}',
      600: '{slate.600}',
      700: '{slate.700}',
      800: '{slate.800}',
      900: '{slate.900}',
      950: '{slate.950}',
    },
    colorScheme: {
      light: {
        primary: {
          color: '{slate.950}',
          inverseColor: '#ffffff',
          hoverColor: '{slate.900}',
          activeColor: '{slate.800}',
        },
      },
      dark: {
        primary: {
          color: '{slate.50}',
          inverseColor: '{slate.950}',
          hoverColor: '{slate.100}',
          activeColor: '{slate.200}',
        },
      },
    },
  },
});

const app = createApp(App);
app.use(PrimeVue, {
  theme: {
    preset: Noir,
  },
});
app.mount('#app');
