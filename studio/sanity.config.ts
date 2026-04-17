import {defineConfig} from 'sanity';
import {structureTool} from 'sanity/structure';
import {dashboardTool} from '@sanity/dashboard';
import {netlifyWidget} from 'sanity-plugin-dashboard-widget-netlify';
import {schemaTypes} from './schemas';
import {structure} from './structure';
import {StudioLayout} from './StudioLayout';

export default defineConfig({
  name: 'default',
  title: 'Wilma Collective',
  projectId: 'x5vhv4vi',
  dataset: 'production',
  plugins: [
    structureTool({structure}),
    dashboardTool({
      widgets: [
        netlifyWidget({
          title: 'Netlify Deploys',
          sites: [
            {
              title: 'Wilma Collective',
              apiId: '1c99b824-6b85-41fe-bb21-6d972974719c',
              buildHookId: '69e0f2f98b851a5cc9f3102b',
              name: 'wilmacollective',
              url: 'https://wilmacollective.netlify.app'
            }
          ]
        })
      ]
    })
    // visionTool() intentionally removed — developer-only GROQ query tool, not relevant to content editors
  ],
  schema: {
    types: schemaTypes
  },
  studio: {
    components: {
      layout: StudioLayout
    }
  }
});
