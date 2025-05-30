import { createApp } from 'vue'
import PrimeVue from 'primevue/config';
import Material from '@primeuix/themes/material'
import './style.css'
import App from './App.vue'

if (!document.querySelector('#app')) {
  // In production, `#app` may or may not exist.
  const rootElement = document.createElement('div')
  rootElement.id = 'app'
  document.body.appendChild(rootElement)
}

const app = createApp(App)
app.use(PrimeVue, {
  theme: {
      preset: Material,
      options: {
          prefix: 'p',
          darkModeSelector: 'system',
          cssLayer: false
      }
  }
});
app.mount('#app')

// This error replaces another error which message is harder to understand and impossible to avoid util the issue https://github.com/storyblok/field-plugin/issues/107 has been resolved.
throw new Error(
  `This error can be safely ignored. It is caused by the legacy field plugin API. See issue https://github.com/storyblok/field-plugin/issues/107`,
)
