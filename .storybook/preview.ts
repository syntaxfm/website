import type { Preview } from '@storybook/sveltekit';
import '../src/routes/(site)/style.css';

const preview: Preview = {
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i
			}
		},
		backgrounds: {
			options: {
				// 👇 Default options
				system: { name: 'System', value: 'light-dark(white, black)' },
				dark: { name: 'Dark', value: '#333' },
				light: { name: 'Light', value: '#F7F9F2' }
				// 👇 Add your own
			}
		}
	}
};

export default preview;
