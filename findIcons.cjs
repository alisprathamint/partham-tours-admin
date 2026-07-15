const fs = require('fs');
const path = require('path');

const srcDir = 'c:/Users/DELL/Desktop/pratham-tours/pratham-tours-admin/src';
const allIcons = new Set();

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const matches = content.match(/import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"]/g);
      if (matches) {
        matches.forEach(m => {
          const match = m.match(/\{([^}]+)\}/);
          if (match) {
            match[1].split(',').forEach(icon => {
              const name = icon.trim().split(' as ')[0];
              if (name) allIcons.add(name);
            });
          }
        });
      }
    }
  }
}

walk(srcDir);
console.log(Array.from(allIcons).join(', '));
