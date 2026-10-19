const fs = require('fs');
const path = require('path');

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
  });

  return arrayOfFiles;
}

const allFiles = getAllFiles(path.join(process.cwd(), 'app'));

allFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // This regex finds any string starting with "dark:" and stops at the next space, quote, or backtick
  // It handles classes like "dark:bg-neutral-900", "dark:text-white", "dark:hover:bg-black", etc.
  const darkClassRegex = /\bdark:[^\s"`']+/g;
  
  if (darkClassRegex.test(content)) {
    content = content.replace(darkClassRegex, '');
    
    // Clean up extra spaces that might be left behind in className strings
    content = content.replace(/\s+/g, ' ');
    content = content.replace(/ className=" /g, ' className="');
    content = content.replace(/ "/g, '"');

    fs.writeFileSync(file, content);
    console.log(`✅ Fixed: ${file.replace(process.cwd(), '')}`);
  }
});

console.log("All done! Every dark: class has been removed.");