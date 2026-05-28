const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk(path.join(__dirname, 'src'));

let report = "## Термінологія та Плюралізація (Автоматичні заміни)\n\n";
let updatedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // 1. Replace pluralize(...) with pluralUk(..., '', '', '')
    // Before: pluralize(count, ['товар', 'товари', 'товарів'])
    // After: `${count} ${pluralUk(count, 'товар', 'товари', 'товарів')}`
    if (content.includes('pluralize(') && content.includes("from '@/lib/utils/dates'")) {
        content = content.replace(/import \{.*?pluralize.*?\} from '@\/lib\/utils\/dates';/, "import { pluralUk } from '@/lib/utils/pluralUk';");
        
        // This regex is complex, let's just do simple replacements for known patterns if possible, or add import and regex replace
        content = content.replace(/pluralize\(([^,]+),\s*\[['"]([^'"]+)['"],\s*['"]([^'"]+)['"],\s*['"]([^'"]+)['"]\]\)/g, "pluralUk($1, '$2', '$3', '$4')");
    }

    // 2. Add import for pluralUk if we use it
    const ensureImport = () => {
        if (!content.includes("import { pluralUk }") && !content.includes("import {pluralUk}")) {
            const importMatches = [...content.matchAll(/^import.*from.*$/gm)];
            if (importMatches.length > 0) {
                const lastImport = importMatches[importMatches.length - 1];
                const insertPos = lastImport.index + lastImport[0].length;
                content = content.slice(0, insertPos) + "\nimport { pluralUk } from '@/lib/utils/pluralUk';" + content.slice(insertPos);
            } else {
                content = "import { pluralUk } from '@/lib/utils/pluralUk';\n" + content;
            }
        }
    };

    // 3. Fix specific ternaries found
    if (content.includes("memberCount === 1 ? '1 майстер' :")) {
        content = content.replace(/memberCount === 1 \? '1 майстер' :[^<]+/, "`${memberCount} ${pluralUk(memberCount, 'майстер', 'майстри', 'майстрів')}`");
        ensureImport();
    }
    
    if (content.includes("discountDays === 1 ? 'день' : 'дні'")) {
        content = content.replace(/discountDays === 1 \? 'день' : 'дні'/g, "pluralUk(discountDays, 'день', 'дні', 'днів')");
        ensureImport();
    }
    
    if (content.includes("length === 1 ? 'товар' : (master.products ?? []).length < 5 ? 'товари' : 'товарів'")) {
        content = content.replace(/\(master\.products \?\? \[\]\)\.length === 1 \? 'товар' : \(master\.products \?\? \[\]\)\.length < 5 \? 'товари' : 'товарів'/g, "pluralUk((master.products ?? []).length, 'товар', 'товари', 'товарів')");
        ensureImport();
    }

    if (content.includes("visitsLeft === 1 ? 'візит' : visitsLeft < 5 ? 'візити' : 'візитів'")) {
        content = content.replace(/visitsLeft === 1 \? 'візит' : visitsLeft < 5 \? 'візити' : 'візитів'/g, "pluralUk(visitsLeft, 'візит', 'візити', 'візитів')");
        ensureImport();
    }

    if (content.includes("count === 1 ? 'ий' : count < 5 ? 'их' : 'их'")) {
        content = content.replace(/count === 1 \? 'ий' : count < 5 \? 'их' : 'их'/g, "pluralUk(count, 'ий', 'их', 'их')");
        content = content.replace(/count === 1 \? 'запис' : 'записи'/g, "pluralUk(count, 'запис', 'записи', 'записів')");
        ensureImport();
    }

    // 4. Terminology Unification
    let termReplaced = false;

    // юзер -> клієнт (only outside comments/variables if possible, but regex is tricky. Let's rely on specific replacements)
    // We already fixed Dashboard/Billing manually.

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        updatedCount++;
        report += `- Оновлено ${path.basename(file)}: застосовано \`pluralUk\`.\n`;
    }
});

fs.writeFileSync('COPYWRITING_REPORT.md', report);
console.log(`Updated ${updatedCount} files.`);
