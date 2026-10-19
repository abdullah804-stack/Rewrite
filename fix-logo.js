const fs = require('fs');
const path = require('path');

const files = [
  "app/dashboard/page.tsx",
  "app/workspace/page.tsx",
  "app/workspace/[id]/page.tsx",
  "app/workspace/[id]/settings/page.tsx",
  "app/settings/page.tsx",
  "app/profiles/page.tsx",
  "app/tools/page.tsx",
  "app/quick/page.tsx",
  "app/login/page.tsx",
  "app/clipper/page.tsx",
  "app/terms/page.tsx",
  "app/privacy/page.tsx",
  "app/examples/page.tsx",
  "app/phrases/page.tsx",
  "app/phrases/[slug]/page.tsx"
];

const correctImport = 'import { Logo } from "@/app/Logo";\n';

files.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (!fs.existsSync(fullPath)) {
    console.log(`Skipping (not found): ${file}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');

  // 1. Remove all broken/duplicate Logo imports
  content = content.replace(/import \{ Logo \} from ".*?Logo";\n?/g, '');
  
  // 2. Fix the broken login page syntax from the previous script
  if (file.includes('login/page.tsx')) {
    content = content.replace(/^\}\n/, ''); 
  }

  // 3. Find the old text logo (with different indentation variations) and replace with <Logo />
  const logoRegex = /<Link href="\/"[^>]*>\s*<div[^>]*>\s*R\s*<\/div>\s*Rewrite\s*<\/Link>/g;
  content = content.replace(logoRegex, '<Logo />');

  const divLogoRegex = /<div className="flex items-center gap-2">\s*<div[^>]*>\s*R\s*<\/div>\s*<span[^>]*>Rewrite<\/span>\s*<\/div>/g;
  content = content.replace(divLogoRegex, '<Logo />');

  // 4. Add the correct import at the top (after "use client" if it exists, otherwise at the top)
  if (content.includes('"use client";')) {
    content = content.replace('"use client";', `"use client";\n\n${correctImport}`);
  } else {
    // If it starts with an import, inject before the first one. Otherwise, at the very top.
    if (content.trim().startsWith('import ')) {
      content = correctImport + content;
    } else {
      content = correctImport + '\n' + content;
    }
  }

  fs.writeFileSync(fullPath, content);
  console.log(`✅ Fixed: ${file}`);
});

console.log("All done!");