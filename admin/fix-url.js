const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, 'app', 'api');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('route.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(apiDir);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace `const domain = process.env.OOPOS_DOMAIN;` with safe base URL
  if (content.includes('const domain = process.env.OOPOS_DOMAIN;')) {
    content = content.replace(
      /const domain = process\.env\.OOPOS_DOMAIN;/g,
      "const domain = process.env.OOPOS_DOMAIN;\n    const baseUrl = domain?.startsWith('http') ? domain : `https://${domain}`;"
    );
    // Now replace `${domain}/api/v2` with `${baseUrl}/api/v2`
    content = content.replace(/\$\{domain\}\/api\/v2/g, '${baseUrl}/api/v2');
    
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
  }
});
