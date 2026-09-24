import { createApp } from 'vue';
import StateCard from './StateCard.vue';

const app = createApp(StateCard);
app.mount('#dlnm-state');
window.addEventListener('pagehide', () => app.unmount(), { once: true });
