const fs = require('fs');
const path = require('path');

function getFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(getFiles(fullPath));
        } else {
            results.push({ path: path.relative(path.resolve(__dirname, '..'), fullPath), sizeKB: Math.round(stat.size / 1024) });
        }
    });
    return results;
}

const images = getFiles(path.resolve(__dirname, '../images'));
images.sort((a, b) => b.sizeKB - a.sizeKB);
console.log('Total images:', images.length);
console.log('Top largest images:');
images.slice(0, 15).forEach(img => console.log(`${img.sizeKB} KB - ${img.path}`));
