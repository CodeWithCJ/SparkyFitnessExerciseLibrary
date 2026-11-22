import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import ExerciseBrowser from "../../components/ExerciseBrowser.vue";
import './custom.css';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('ExerciseBrowser', ExerciseBrowser);
  },
} satisfies Theme;
