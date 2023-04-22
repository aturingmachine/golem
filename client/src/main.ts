import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import 'vuetify/styles'
import { createVuetify, type ThemeDefinition } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { VVirtualScroll } from 'vuetify/labs/VVirtualScroll'

const myCustomLightTheme: ThemeDefinition = {
  dark: false,
  colors: {
    background: '#263238',
    surface: '#263238',
    primary: '#ffffff',
    secondary: '#03DAC6',
    error: '#D50000',
    info: '#039BE5',
    success: '#00E676',
    warning: '#FF6E40',
  }
}

const vuetify = createVuetify({
  components: {
    ...components,
    VVirtualScroll,
  },
  theme: {
    defaultTheme: 'myCustomLightTheme',
    themes: {
      myCustomLightTheme
    }
  },
  directives,
})

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(vuetify)

app.mount('#app')
