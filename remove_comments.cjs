
const fs = require('fs');
['app/frontend/pages/Public/Tracking.tsx', 'app/frontend/pages/Public/Order/New.tsx'].forEach(file => {
  let code = fs.readFileSync(file, 'utf8');
  code = code.replace(/\/\*[\s\S]*?\*\//g, '');
  code = code.replace(/(?<!https?:)\/\/.*$/gm, '');
  fs.writeFileSync(file, code);
});

