const fs = require('fs');
const path = require('path');

const nextDir = path.join(__dirname, '.next');

if (fs.existsSync(nextDir)) {
  console.log('🧹 Suppression du cache Next.js (.next)...');
  try {
    fs.rmSync(nextDir, { recursive: true, force: true });
    console.log('✅ Dossier .next supprimé. Vous pouvez relancer "npm run dev" maintenant.');
  } catch (err) {
    console.error('❌ Erreur lors de la suppression :', err.message);
  }
} else {
  console.log('ℹ️ Le dossier .next n\'existe pas ou a déjà été supprimé.');
}
