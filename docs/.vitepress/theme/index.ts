import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import ExerciseBrowser from "../../components/ExerciseBrowser.vue";
import ExerciseGenerator from "../../components/ExerciseGenerator.vue";
import './custom.css';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('ExerciseBrowser', ExerciseBrowser);
    app.component('ExerciseGenerator', ExerciseGenerator);
  },
} satisfies Theme;
