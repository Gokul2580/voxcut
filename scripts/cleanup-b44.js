import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

const files = [
  'src/pages/Landing.jsx',
  'src/pages/Editor.jsx',
  'src/pages/Dashboard.jsx',
  'src/lib/PageNotFound.jsx',
  'src/components/editor/editorPipeline.jsx',
  'src/components/editor/RenderModal.jsx',
  'src/components/editor/OneShotPanel.jsx',
  'src/components/editor/MediaLibrary.jsx',
  'src/components/editor/ClipEditPanel.jsx',
  'src/components/editor/AdvancedAIFeatures.jsx',
  'src/components/dashboard/CreateProjectDialog.jsx',
];

const b44Pattern = /const db = globalThis\.__B44_DB__.*?}\);?\n\n/s;

files.forEach(file => {
  const filePath = path.join(projectRoot, file);
  try {
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf-8');
      const updated = content.replace(b44Pattern, '');
      if (updated !== content) {
        fs.writeFileSync(filePath, updated, 'utf-8');
        console.log(`✓ Cleaned ${file}`);
      }
    }
  } catch (err) {
    console.error(`✗ Error processing ${file}:`, err.message);
  }
});

console.log('Cleanup complete!');
