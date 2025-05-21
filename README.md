# Storyblok Featured Article by Category Field Plugin

This field plugin allows content editors to select a featured article from a specific category in Storyblok. It provides a user-friendly interface for managing featured articles within blog categories or collections.

## Features

- Select a category to filter articles
- Search and select a featured article from the selected category
- Automatic content type detection for blog categories and collections
- Real-time updates when content changes
- Responsive design with Storyblok's design system

## Plugin Structure

The plugin consists of two main components:

1. **Category Selection**: Allows editors to select a category to filter articles
2. **Featured Article Selection**: Enables editors to choose a featured article from the selected category

The plugin automatically detects if it's being used within a blog category or collection and adjusts its behavior accordingly.

## Development

### Prerequisites

- Node.js (version specified in `.nvmrc`)
- npm or yarn
- A Storyblok account with a personal access token

### Local Development

1. Clone the repository
2. Install dependencies:
   ```shell
   npm install
   ```
3. Start the development server:
   ```shell
   npm run dev
   ```
4. Open the [Storyblok Field Plugin Sandbox](https://plugin-sandbox.storyblok.com/field-plugin/) to test your plugin

### Building

To build the plugin for production:

```shell
npm run build
```

This will create a production-ready build in the `dist` directory.

### Deployment

1. Create a personal access token in your Storyblok account
2. Create a `.env` file in the root directory with your token:
   ```
   STORYBLOK_PERSONAL_ACCESS_TOKEN=your_token_here
   ```
3. Deploy the plugin:
   ```shell
   npm run deploy
   ```

For continuous delivery, you can use the CLI with the following options:
```shell
npm run deploy --name $NAME --skipPrompts
```

## Configuration

The plugin uses a manifest file (`field-plugin.config.json`) to configure its behavior. Currently, no additional options are required, but you can add custom options as needed:

```json
{
  "options": []
}
```

## Technical Details

- Built with Vue 3 and TypeScript
- Uses PrimeVue for UI components
- Integrates with Storyblok's Field Plugin API
- Supports both published and draft content
- Implements real-time content synchronization

## Support

For more information about Storyblok Field Plugins, visit the [official documentation](https://www.storyblok.com/docs/plugins/field-plugins/introduction).
