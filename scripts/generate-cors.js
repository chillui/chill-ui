#!/usr/bin/env node
/* eslint-disable */
const fs = require('fs');
const path = require('path');

// Configuration
const SOURCE_DIR = 'packages/chill-ui-core/src/components';
const CORE_DIR = 'generated';

const VARIANTS = {
  // hybrid: {
  //   coreDir: 'core-hybrid',
  //   excludeSuffix: '',
  //   suffix: '.tsx',
  // },
  stylesheet: {
    coreDir: 'core-stylesheet',
    excludeSuffix: '.ss',
    suffix: '.ss.tsx',
  },
  tailwind: {
    coreDir: 'core-tailwind',
    excludeSuffix: '.tw',
    suffix: '.tw.tsx',
  },
};

/**
 * Ensure directory exists
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Created directory: ${dirPath}`);
  }
}

/**
 * Copy file and update imports
 */
function copyFileWithImportFix(sourcePath, destPath, variant) {
  // Skip .web files
  if (sourcePath.includes('.web.')) {
    return;
  }

  let content = fs.readFileSync(sourcePath, 'utf8');

  // Fix imports for styles files (vr/sv) in types files
  if (destPath.includes('/types/') && destPath.endsWith('.types.ts')) {
    // For all variants, change ../../components/ to ../components/ for styles imports
    content = content.replace(
      /from\s+['"]\.\.\/\.\.\/components\/(.+?)\/styles\/(.+?)\.(variants|styles)['"]/g,
      "from '../components/$1/styles/$2.$3'",
    );

    // Change ../[file].types to ./[file].types for type imports
    content = content.replace(/from\s+['"]\.\.\/(.+?)\.types['"]/g, "from './$1.types'");
  }

  // Remove /ss/ and /tw/ from utils imports for all variants
  content = content.replace(/from\s+['"](.+?)\/ss\/styleSheetVariants['"]/g, "from '$1/styleSheetVariants'");
  content = content.replace(/from\s+['"](.+?)\/tw\/(.+?)['"]/g, "from '$1/$2'");

  // Fix relative imports based on variant
  if (variant === 'hybrid') {
    // For hybrid, remove .tw and .ss suffixes from imports
    content = content.replace(/from\s+['"](.+?)\.tw\.types['"]/g, "from '$1.types'");
    content = content.replace(/from\s+['"](.+?)\.ss\.types['"]/g, "from '$1.types'");
    content = content.replace(/from\s+['"](.+?)\.tw['"]/g, "from '$1'");
    content = content.replace(/from\s+['"](.+?)\.ss['"]/g, "from '$1'");

    // Remove /hybrid from utils imports
    content = content.replace(/from\s+['"](.+?)\/hybrid\/(.+?)['"]/g, "from '$1/$2'");
  } else if (variant === 'tailwind') {
    // For tailwind, remove .tw suffixes from all imports
    content = content.replace(/from\s+['"](.+?)\.tw\.types['"]/g, "from '$1.types'");
    content = content.replace(/from\s+['"](.+?)\.tw['"]/g, "from '$1'");
  } else if (variant === 'stylesheet') {
    // For stylesheet, change ../../utils/ to ../utils/ in types files
    if (destPath.includes('/types/') && destPath.endsWith('.types.ts')) {
      content = content.replace(/from\s+['"]\.\.\/\.\.\/utils\/(.+?)['"]/g, "from '../utils/$1'");
    }

    // For stylesheet, remove .ss suffixes from all imports (including types)
    content = content.replace(/from\s+['"](.+?)\.ss\.types['"]/g, "from '$1.types'");
    content = content.replace(/from\s+['"](.+?)\.ss['"]/g, "from '$1'");
  }

  // Fix style imports to remove variant suffixes (except for hybrid)
  if (variant === 'tailwind') {
    // Remove .tw.styles suffixes from imports
    content = content.replace(/from\s+['"](.+?)\.tw\.styles['"]/g, "from '$1.styles'");
    // Remove .tw suffixes from component imports (e.g., './Wrapper.tw' -> './Wrapper')
    content = content.replace(/from\s+['"](.+?)\.tw(['"])/g, "from '$1$2");
  } else if (variant === 'stylesheet') {
    // Remove .ss.styles suffixes from imports
    content = content.replace(/from\s+['"](.+?)\.ss\.styles['"]/g, "from '$1.styles'");
    // Remove .ss suffixes from component imports (e.g., './Wrapper.ss' -> './Wrapper')
    content = content.replace(/from\s+['"](.+?)\.ss(['"])/g, "from '$1$2");
  }
  // For hybrid, keep the original import names with suffixes

  // Fix imports from nested component folders (like BounceBox/) to types FIRST
  // e.g., '../../../../types/animatedBox/bounceBox.types' -> '../../../../types/bounceBox.types'
  // This removes only the intermediate component folder name, preserving the relative path depth
  content = content.replace(/(['"])((?:\.\.\/)+)types\/([^\/]+)\/([^\/]+)\.types(['"])/g, '$1$2types/$4.types$5');

  // Fix .tw.types and .ss.types imports to just .types (for all variants)
  content = content.replace(/(['"])(.+?\/types\/)([^\/]+)\/\3\.tw\.types(['"])/g, '$1$2$3.types$4');
  content = content.replace(/(['"])(.+?\/types\/)([^\/]+)\/\3\.ss\.types(['"])/g, '$1$2$3.types$4');

  // Fix types import paths to remove duplicate component name and intermediate folder
  // This applies to ALL variants, not just stylesheet
  // This handles all cases: import, import type, export, etc.
  // e.g., '../../../types/box/box.types' -> '../../../types/box.types'
  // e.g., './string/string.types' -> './string.types'
  // BUT ONLY when the folder name and file name are actually the same
  content = content.replace(/(['"])(.+?\/types\/)([^\/]+)\/\3\.types(['"])/g, '$1$2$3.types$4');
  content = content.replace(/(['"])\.\/([^\/]+)\/\2\.types(['"])/g, '$1./$2.types$3');

  // Remove suffixes from type names in imports (Ss, Tw, etc.)
  // This transforms: import type { StringPropsSs } from '@types' -> import type { StringProps } from '@types'
  // This transforms: import type { StringPropsTw } from '@types' -> import type { StringProps } from '@types'
  content = content.replace(/(import\s+type\s*\{[^}]*?)(\w+)(Ss|Tw)([^}]*?\}\s*from\s*['"][^'"]*['"])/g, '$1$2$4');

  // Also handle cases where the type is used in the import without curly braces
  // e.g., import type StringPropsSs from '@types' -> import type StringProps from '@types'
  content = content.replace(/(import\s+type\s+)(\w+)(Ss|Tw)(\s+from\s+['"][^'"]*['"])/g, '$1$2$4');

  // Remove suffixes from type names used in function parameters and type annotations
  // This transforms: (props: PropsWithChildren<StringPropsSs>) -> (props: PropsWithChildren<StringProps>)
  // This transforms: (props: StringPropsTw) -> (props: StringProps)
  // This transforms: StringPropsSs -> StringProps (anywhere in the code)
  content = content.replace(/(\w+)(Ss|Tw)(\s*[>,\)\]\[\s])/g, '$1$3');

  // Also handle cases where the type name is at the end of a line or followed by other characters
  content = content.replace(/(\w+)(Ss|Tw)(\s*[;,}])/g, '$1$3');

  // Handle cases where the type name is followed by generic parameters like <T>
  content = content.replace(/(\w+)(Ss|Tw)(\s*<)/g, '$1$3');

  // Handle cases where the type name is followed by a quote (for string literals)
  content = content.replace(/(\w+)(Ss|Tw)(['"])/g, '$1$3');

  // Fix utils imports: convert any ../utils to ./utils (ONLY for flattened types)
  // This handles cases where types are flattened to the root types directory
  if (destPath.includes('/types/') && destPath.endsWith('.types.ts')) {
    content = content.replace(/from\s+['"](?:\.\.\/)+utils['"]/g, "from './utils'");
  }

  ensureDir(path.dirname(destPath));
  fs.writeFileSync(destPath, content);
  console.log(`📄 Copied: ${sourcePath} → ${destPath}`);
}

/**
 * Copy directory recursively
 */
function copyDirectory(sourceDir, destDir, variant) {
  ensureDir(destDir);

  const items = fs.readdirSync(sourceDir);

  for (const item of items) {
    const sourcePath = path.join(sourceDir, item);
    const destPath = path.join(destDir, item);
    const stat = fs.statSync(sourcePath);

    if (stat.isDirectory()) {
      copyDirectory(sourcePath, destPath, variant);
    } else if (stat.isFile()) {
      // Skip .web files
      if (item.includes('.web.')) {
        continue;
      }

      let shouldCopy = false;
      let finalDestPath = destPath;

      // Special handling for .types.ts files
      if (item.endsWith('.types.ts')) {
        if (variant === 'stylesheet') {
          // For stylesheet: prefer .ss.types.ts, fallback to base .types.ts
          if (item.includes('.ss.types.ts')) {
            shouldCopy = true;
            // Remove .ss from filename
            finalDestPath = path.join(destDir, item.replace('.ss.types.ts', '.types.ts'));
          } else if (!item.includes('.tw.types.ts')) {
            // Copy base file only if no .tw variant exists
            shouldCopy = true;
          }
        } else if (variant === 'tailwind') {
          // For tailwind: prefer .tw.types.ts, fallback to base .types.ts
          if (item.includes('.tw.types.ts')) {
            shouldCopy = true;
            // Remove .tw from filename
            finalDestPath = path.join(destDir, item.replace('.tw.types.ts', '.types.ts'));
          } else if (!item.includes('.ss.types.ts')) {
            // Copy base file only if no .ss variant exists
            shouldCopy = true;
          }
        } else if (variant === 'hybrid') {
          // For hybrid: keep only base files (no .ss or .tw)
          if (!item.includes('.ss.types.ts') && !item.includes('.tw.types.ts')) {
            shouldCopy = true;
          }
        }
      } else {
        // For non-.types.ts files
        if (variant === 'stylesheet') {
          // For stylesheet: prefer .ss files, fallback to base files
          // Exclude .tw and .hybrid files
          if (item.includes('.ss.')) {
            shouldCopy = true;
            // Remove .ss from filename
            finalDestPath = path.join(destDir, item.replace('.ss.', '.'));
          } else if (!item.includes('.tw.') && !item.includes('.ss.') && !item.includes('.hybrid.')) {
            // Copy base files (no variant suffix means it's for all variants or base)
            shouldCopy = true;
          }
        } else if (variant === 'tailwind') {
          // For tailwind: prefer .tw files, fallback to base files
          // Exclude .ss and .hybrid files
          if (item.includes('.tw.')) {
            shouldCopy = true;
            // Remove .tw from filename
            finalDestPath = path.join(destDir, item.replace('.tw.', '.'));
          } else if (!item.includes('.ss.') && !item.includes('.tw.') && !item.includes('.hybrid.')) {
            // Copy base files (no variant suffix means it's for all variants or base)
            shouldCopy = true;
          }
        } else if (variant === 'hybrid') {
          // For hybrid: prefer .hybrid files, fallback to base files
          // Exclude .ss and .tw files
          if (item.includes('.hybrid.')) {
            shouldCopy = true;
            // Remove .hybrid from filename
            finalDestPath = path.join(destDir, item.replace('.hybrid.', '.'));
          } else if (!item.includes('.ss.') && !item.includes('.tw.') && !item.includes('.hybrid.')) {
            // Copy base files (no variant suffix means it's for all variants or base)
            shouldCopy = true;
          }
        }
      }

      if (shouldCopy) {
        copyFileWithImportFix(sourcePath, finalDestPath, variant);
      }
    }
  }
}

/**
 * Process types for a component
 */
function processComponentTypes(componentName, variantName, coreDir) {
  let typesSourceDir = path.join('packages/chill-ui-core/src/types', componentName);
  const typesDestDir = path.join(CORE_DIR, coreDir, 'src/types');

  // If the exact directory doesn't exist, try to find a matching one
  if (!fs.existsSync(typesSourceDir)) {
    const baseTypesDir = 'packages/chill-ui-core/src/types';
    if (fs.existsSync(baseTypesDir)) {
      const allTypeDirs = fs.readdirSync(baseTypesDir).filter(item => {
        const itemPath = path.join(baseTypesDir, item);
        return fs.statSync(itemPath).isDirectory();
      });
    }

    // If still not found, return
    if (!fs.existsSync(typesSourceDir)) {
      console.log(`⚠️  No types directory found for ${componentName}`);
      return;
    }
  }

  ensureDir(typesDestDir);

  const typeFiles = fs.readdirSync(typesSourceDir);

  // Copy only base type files (no .ss or .tw suffixes)
  for (const file of typeFiles) {
    if (!file.includes('.ss.') && !file.includes('.tw.')) {
      const sourcePath = path.join(typesSourceDir, file);
      const destPath = path.join(typesDestDir, file);
      copyFileWithImportFix(sourcePath, destPath, variantName);
      console.log(`📄 Copied type file: ${file}`);
    }
  }
}

/**
 * Check if component has sub-components structure
 */
function hasSubComponentsStructure(componentPath) {
  const componentsDir = path.join(componentPath, 'components');
  if (!fs.existsSync(componentsDir)) {
    return false;
  }

  // Check if components directory contains subdirectories (indicating sub-components)
  const items = fs.readdirSync(componentsDir);
  return items.some(item => {
    const itemPath = path.join(componentsDir, item);
    return fs.statSync(itemPath).isDirectory();
  });
}

/**
 * Process a single component
 */
function processComponent(componentName) {
  const componentPath = path.join(SOURCE_DIR, componentName);

  if (!fs.existsSync(componentPath)) {
    console.error(`❌ Component not found: ${componentName}`);
    return;
  }

  // Check if this component has sub-components structure
  const hasSubComponents = hasSubComponentsStructure(componentPath);

  if (hasSubComponents) {
    console.log(`\n🔄 Processing component with sub-components: ${componentName}`);
    processComponentWithSubComponents(componentName);
  } else {
    console.log(`\n🔄 Processing standard component: ${componentName}`);
    processStandardComponent(componentName);
  }
}

/**
 * Process index.ts exports for a variant
 */
function processIndexExports(mainIndexContent, variantName) {
  let indexContent = '';
  const lines = mainIndexContent.split('\n');
  const hybridExports = [];
  const baseExports = [];

  // First pass: collect all exports
  for (const line of lines) {
    if (line.includes('export')) {
      // Extract the import path from the line
      const importPathMatch = line.match(/from\s+['"](.+?)['"]/);
      if (!importPathMatch) continue;

      const importPath = importPathMatch[1];

      // Extract all exports from the curly braces
      const exportsMatch = line.match(/export\s*{\s*([^}]+)\s*}\s*from/);
      if (!exportsMatch) continue;

      const exportsStr = exportsMatch[1];
      // Split by comma to get individual exports
      const exports = exportsStr.split(',').map(e => e.trim());

      for (const exportItem of exports) {
        // Parse each export: "Name" or "Name as Alias" or "default as Name"
        let exportedName,
          alias,
          isDefault = false;

        if (exportItem.includes('default')) {
          isDefault = true;
          // Match: "default as Name"
          const match = exportItem.match(/default\s+as\s+(\w+)/);
          if (match) {
            exportedName = match[1];
          }
        } else {
          // Match: "Name" or "Name as Alias"
          const match = exportItem.match(/(\w+)(?:\s+as\s+(\w+))?/);
          if (match) {
            exportedName = match[1];
            alias = match[2];
          }
        }

        if (exportedName) {
          const exportObj = { line, exportedName, alias, importPath, type: isDefault ? 'default' : 'named' };

          if (importPath.includes('.hybrid')) {
            hybridExports.push(exportObj);
          } else if (!importPath.includes('.ss') && !importPath.includes('.tw')) {
            baseExports.push(exportObj);
          }
        }
      }
    }
  }

  // Second pass: use hybrid exports if available, otherwise use base exports
  const exportsToUse = hybridExports.length > 0 ? hybridExports : baseExports;

  for (const exp of exportsToUse) {
    if (exp.type === 'default') {
      const newImportPath = exp.importPath.replace('.hybrid', '');
      indexContent += `export { default as ${exp.exportedName} } from '${newImportPath}';\n`;
    } else if (exp.type === 'named') {
      const newImportPath = exp.importPath.replace('.hybrid', '');
      if (exp.alias) {
        indexContent += `export { ${exp.exportedName} as ${exp.alias} } from '${newImportPath}';\n`;
      } else {
        indexContent += `export { ${exp.exportedName} } from '${newImportPath}';\n`;
      }
    }
  }

  // Add non-export lines (but skip comments)
  let inBlockComment = false;
  for (const line of lines) {
    if (!line.includes('export')) {
      // Skip single-line comments
      if (line.trim().startsWith('//')) {
        continue;
      }

      // Handle block comments
      if (line.includes('/*')) {
        inBlockComment = true;
      }
      if (inBlockComment) {
        if (line.includes('*/')) {
          inBlockComment = false;
        }
        continue;
      }

      // Copy other non-empty lines
      if (line.trim()) {
            indexContent += `${line}\n`;
      }
    }
  }

  // Convert all component folder names in import paths to camelCase
  // e.g., './components/FadeInBox/FadeInBox' -> './components/fadeInBox/FadeInBox'
  indexContent = indexContent.replace(/\.\/components\/([A-Z])(\w+)\//g, (match, firstChar, rest) => {
    return `./components/${firstChar.toLowerCase()}${rest}/`;
  });

  return indexContent;
}

/**
 * Process component with sub-components (like animatedBox)
 */
function processComponentWithSubComponents(componentName) {
  const componentPath = path.join(SOURCE_DIR, componentName);
  const componentsDir = path.join(componentPath, 'components');

  // Get all sub-components
  const subComponents = fs.readdirSync(componentsDir).filter(item => {
    const itemPath = path.join(componentsDir, item);
    return fs.statSync(itemPath).isDirectory();
  });

  console.log(`📋 Found sub-components: ${subComponents.join(', ')}`);

  for (const [variantName, config] of Object.entries(VARIANTS)) {
    const coreBasePath = path.join(CORE_DIR, config.coreDir, 'src');
    const coreComponentPath = path.join(coreBasePath, 'components', componentName);

    console.log(`\n📦 Processing variant: ${variantName}`);

    // Clean destination
    if (fs.existsSync(coreComponentPath)) {
      fs.rmSync(coreComponentPath, { recursive: true });
      console.log(`🧹 Cleaned: ${coreComponentPath}`);
    }

    ensureDir(coreComponentPath);

    // Copy all directories except those handled specially (components, styles) and test directories
    const specialDirs = ['components', 'styles'];
    const excludedDirs = ['__tests__'];
    const allItems = fs.readdirSync(componentPath);
    const directories = allItems.filter(item => {
      const itemPath = path.join(componentPath, item);
      return fs.statSync(itemPath).isDirectory() && !specialDirs.includes(item) && !excludedDirs.includes(item);
    });

    for (const dir of directories) {
      const sourceDir = path.join(componentPath, dir);
      copyDirectory(sourceDir, path.join(coreComponentPath, dir), variantName);
    }

    // Copy shared files (README, etc.)
    const sharedFiles = ['README.md'];
    for (const file of sharedFiles) {
      const sourceFile = path.join(componentPath, file);
      if (fs.existsSync(sourceFile)) {
        copyFileWithImportFix(sourceFile, path.join(coreComponentPath, file), variantName);
      }
    }

    // Handle styles directory with variant-specific filtering
    const stylesDir = path.join(componentPath, 'styles');
    if (fs.existsSync(stylesDir)) {
      const styleFiles = fs.readdirSync(stylesDir);
      let hasFilesToCopy = false;

      // First pass: check if there are any files to copy for this variant
      for (const file of styleFiles) {
        if (variantName === 'tailwind') {
          // Tailwind: keep .tw.styles.ts files
          if (file.includes('.tw.styles.')) {
            hasFilesToCopy = true;
            break;
          }
        } else if (variantName === 'stylesheet') {
          // Stylesheet: keep .ss.styles.ts files
          if (file.includes('.ss.styles.')) {
            hasFilesToCopy = true;
            break;
          }
        } else if (variantName === 'hybrid') {
          // Hybrid: keep both .ss.styles.ts and .tw.styles.ts files
          if (file.includes('.ss.styles.') || file.includes('.tw.styles.')) {
            hasFilesToCopy = true;
            break;
          }
        }
      }

      // Only create the directory and copy files if there are files to copy
      if (hasFilesToCopy) {
        const destStylesDir = path.join(coreComponentPath, 'styles');
        ensureDir(destStylesDir);

        for (const file of styleFiles) {
          const sourceFile = path.join(stylesDir, file);

          // Determine destination filename by removing variant suffixes (except for hybrid)
          let destFileName = file;
          if (variantName === 'tailwind' && file.includes('.tw.styles.')) {
            destFileName = file.replace('.tw.styles.', '.styles.');
          } else if (variantName === 'stylesheet' && file.includes('.ss.styles.')) {
            destFileName = file.replace('.ss.styles.', '.styles.');
          }
          // For hybrid, keep the original filename with suffixes

          const destFile = path.join(destStylesDir, destFileName);

          // Filter style files based on variant
          if (variantName === 'tailwind') {
            // Tailwind: keep .tw.styles.ts files
            if (file.includes('.tw.styles.')) {
              copyFileWithImportFix(sourceFile, destFile, variantName);
            }
          } else if (variantName === 'stylesheet') {
            // Stylesheet: keep .ss.styles.ts files
            if (file.includes('.ss.styles.')) {
              copyFileWithImportFix(sourceFile, destFile, variantName);
            }
          } else if (variantName === 'hybrid') {
            // Hybrid: keep both .ss.styles.ts and .tw.styles.ts files
            if (file.includes('.ss.styles.') || file.includes('.tw.styles.')) {
              copyFileWithImportFix(sourceFile, destFile, variantName);
            }
          }
        }
      }
    }

    // Create components directory in destination
    const destComponentsDir = path.join(coreComponentPath, 'components');
    ensureDir(destComponentsDir);

    // Process each sub-component
    for (const subComponentName of subComponents) {
      const sourceSubComponentDir = path.join(componentsDir, subComponentName);
      // Convert to camelCase (lowercase first letter) for destination folder consistency
      const camelCaseName = subComponentName.charAt(0).toLowerCase() + subComponentName.slice(1);
      const destSubComponentDir = path.join(destComponentsDir, camelCaseName);

      ensureDir(destSubComponentDir);

      // Source files are always PascalCase (e.g., AnimatedBox.ss.tsx)
      // even if the folder is camelCase (e.g., animatedBox/)
      const capitalizedName = subComponentName.charAt(0).toUpperCase() + subComponentName.slice(1);
      
      // Copy the appropriate variant file
      const sourceFileName = `${capitalizedName}${config.suffix}`;
      const sourceFile = path.join(sourceSubComponentDir, sourceFileName);
      const destFile = path.join(destSubComponentDir, `${capitalizedName}.tsx`);

      if (fs.existsSync(sourceFile)) {
        copyFileWithImportFix(sourceFile, destFile, variantName);
        console.log(`📄 Copied: ${sourceFileName} → ${capitalizedName}.tsx`);
      } else {
        // Fallback: try base .tsx file if variant-specific file doesn't exist
        const fallbackFileName = `${capitalizedName}.tsx`;
        const fallbackSourceFile = path.join(sourceSubComponentDir, fallbackFileName);

        if (fs.existsSync(fallbackSourceFile)) {
          copyFileWithImportFix(fallbackSourceFile, destFile, variantName);
          console.log(`📄 Copied (fallback): ${fallbackFileName} → ${capitalizedName}.tsx`);
        } else {
          console.log(`⚠️  File not found: ${sourceFile} or ${fallbackSourceFile}`);
        }
      }
    }

    // Process types for this component
    processComponentTypes(componentName, variantName, config.coreDir);

    // Create index.ts with all sub-components
    const indexPath = path.join(coreComponentPath, 'index.ts');
    const mainIndexPath = path.join(SOURCE_DIR, componentName, 'index.ts');

    if (fs.existsSync(mainIndexPath)) {
      const mainIndexContent = fs.readFileSync(mainIndexPath, 'utf8');
      const indexContent = processIndexExports(mainIndexContent, variantName);

      fs.writeFileSync(indexPath, indexContent);
      console.log(`📝 Created index.ts for ${componentName} (${variantName})`);
    }
  }
}

/**
 * Process standard component (like avatar, box, etc.)
 */
function processStandardComponent(componentName) {
  const componentPath = path.join(SOURCE_DIR, componentName);

  for (const [variantName, config] of Object.entries(VARIANTS)) {
    const coreBasePath = path.join(CORE_DIR, config.coreDir, 'src');
    const coreComponentPath = path.join(coreBasePath, 'components', componentName);

    console.log(`\n📦 Processing variant: ${variantName}`);

    // Clean destination
    if (fs.existsSync(coreComponentPath)) {
      fs.rmSync(coreComponentPath, { recursive: true });
      console.log(`🧹 Cleaned: ${coreComponentPath}`);
    }

    // Copy component structure
    ensureDir(coreComponentPath);

    // Copy all directories except those handled specially (components, styles) and test directories
    const specialDirs = ['components', 'styles'];
    const excludedDirs = ['__tests__'];
    const allItems = fs.readdirSync(componentPath);
    const directories = allItems.filter(item => {
      const itemPath = path.join(componentPath, item);
      return fs.statSync(itemPath).isDirectory() && !specialDirs.includes(item) && !excludedDirs.includes(item);
    });

    for (const dir of directories) {
      const sourceDir = path.join(componentPath, dir);
      copyDirectory(sourceDir, path.join(coreComponentPath, dir), variantName);
    }

    // Copy shared files (README, etc.)
    const sharedFiles = ['README.md'];

    for (const file of sharedFiles) {
      const sourceFile = path.join(componentPath, file);
      if (fs.existsSync(sourceFile)) {
        copyFileWithImportFix(sourceFile, path.join(coreComponentPath, file), variantName);
      }
    }

    // Handle styles directory with variant-specific filtering
    const stylesDir = path.join(componentPath, 'styles');
    if (fs.existsSync(stylesDir)) {
      const styleFiles = fs.readdirSync(stylesDir);
      let hasFilesToCopy = false;

      // First pass: check if there are any files to copy for this variant
      for (const file of styleFiles) {
        if (variantName === 'tailwind') {
          // Tailwind: keep .tw.styles.ts files
          if (file.includes('.tw.styles.')) {
            hasFilesToCopy = true;
            break;
          }
        } else if (variantName === 'stylesheet') {
          // Stylesheet: keep .ss.styles.ts files
          if (file.includes('.ss.styles.')) {
            hasFilesToCopy = true;
            break;
          }
        } else if (variantName === 'hybrid') {
          // Hybrid: keep both .ss.styles.ts and .tw.styles.ts files
          if (file.includes('.ss.styles.') || file.includes('.tw.styles.')) {
            hasFilesToCopy = true;
            break;
          }
        }
      }

      // Only create the directory and copy files if there are files to copy
      if (hasFilesToCopy) {
        const destStylesDir = path.join(coreComponentPath, 'styles');
        ensureDir(destStylesDir);

        for (const file of styleFiles) {
          const sourceFile = path.join(stylesDir, file);

          // Determine destination filename by removing variant suffixes (except for hybrid)
          let destFileName = file;
          if (variantName === 'tailwind' && file.includes('.tw.styles.')) {
            destFileName = file.replace('.tw.styles.', '.styles.');
          } else if (variantName === 'stylesheet' && file.includes('.ss.styles.')) {
            destFileName = file.replace('.ss.styles.', '.styles.');
          }
          // For hybrid, keep the original filename with suffixes

          const destFile = path.join(destStylesDir, destFileName);

          // Filter style files based on variant
          if (variantName === 'tailwind') {
            // Tailwind: keep .tw.styles.ts files
            if (file.includes('.tw.styles.')) {
              copyFileWithImportFix(sourceFile, destFile, variantName);
            }
          } else if (variantName === 'stylesheet') {
            // Stylesheet: keep .ss.styles.ts files
            if (file.includes('.ss.styles.')) {
              copyFileWithImportFix(sourceFile, destFile, variantName);
            }
          } else if (variantName === 'hybrid') {
            // Hybrid: keep both .ss.styles.ts and .tw.styles.ts files
            if (file.includes('.ss.styles.') || file.includes('.tw.styles.')) {
              copyFileWithImportFix(sourceFile, destFile, variantName);
            }
          }
        }
      }
    }

    // Process components directory (handles both files and subdirectories)
    const componentsDir = path.join(componentPath, 'components');
    if (fs.existsSync(componentsDir)) {
      const componentItems = fs.readdirSync(componentsDir);
      const destComponentsDir = path.join(coreComponentPath, 'components');
      ensureDir(destComponentsDir);

      for (const item of componentItems) {
        const sourceItem = path.join(componentsDir, item);
        const itemStat = fs.statSync(sourceItem);

        if (itemStat.isDirectory()) {
          // Handle subdirectories (like FadeInBox, ScaleInBox, etc.)
          const subDirFiles = fs.readdirSync(sourceItem);
          const destSubDir = path.join(destComponentsDir, item);
          ensureDir(destSubDir);

          for (const file of subDirFiles) {
            const sourceFile = path.join(sourceItem, file);

            if (variantName === 'hybrid') {
              // For hybrid, only copy base .tsx files
              if (
                file.endsWith('.tsx') &&
                !file.includes('.tw.') &&
                !file.includes('.ss.') &&
                !file.includes('.hybrid.')
              ) {
                const destFile = path.join(destSubDir, file);
                copyFileWithImportFix(sourceFile, destFile, variantName);
              }
            } else if (variantName === 'tailwind') {
              // For tailwind, copy .tw.tsx files and rename them to .tsx
              if (file.endsWith('.tw.tsx')) {
                const destFile = path.join(destSubDir, file.replace('.tw.tsx', '.tsx'));
                copyFileWithImportFix(sourceFile, destFile, variantName);
              } else if (
                file.endsWith('.tsx') &&
                !file.includes('.tw.') &&
                !file.includes('.ss.') &&
                !file.includes('.hybrid.')
              ) {
                // Check if .tw.tsx variant exists before using fallback
                const twVariantFile = file.replace('.tsx', '.tw.tsx');
                const twVariantPath = path.join(sourceItem, twVariantFile);
                if (!fs.existsSync(twVariantPath)) {
                  // Fallback: copy base .tsx files if no .tw.tsx variant exists
                  const destFile = path.join(destSubDir, file);
                  copyFileWithImportFix(sourceFile, destFile, variantName);
                }
              }
            } else if (variantName === 'stylesheet') {
              // For stylesheet, copy .ss.tsx files and rename them to .tsx
              if (file.endsWith('.ss.tsx')) {
                const destFile = path.join(destSubDir, file.replace('.ss.tsx', '.tsx'));
                copyFileWithImportFix(sourceFile, destFile, variantName);
              } else if (
                file.endsWith('.tsx') &&
                !file.includes('.tw.') &&
                !file.includes('.ss.') &&
                !file.includes('.hybrid.')
              ) {
                // Check if .ss.tsx variant exists before using fallback
                const ssVariantFile = file.replace('.tsx', '.ss.tsx');
                const ssVariantPath = path.join(sourceItem, ssVariantFile);
                if (!fs.existsSync(ssVariantPath)) {
                  // Fallback: copy base .tsx files if no .ss.tsx variant exists
                  const destFile = path.join(destSubDir, file);
                  copyFileWithImportFix(sourceFile, destFile, variantName);
                }
              }
            }
          }
        } else if (itemStat.isFile()) {
          // Handle direct files in components directory (existing behavior)
          if (variantName === 'hybrid') {
            // For hybrid, only copy base .tsx files
            if (
              item.endsWith('.tsx') &&
              !item.includes('.tw.') &&
              !item.includes('.ss.') &&
              !item.includes('.hybrid.')
            ) {
              const destFile = path.join(destComponentsDir, item);
              copyFileWithImportFix(sourceItem, destFile, variantName);
            }
          } else if (variantName === 'tailwind') {
            // For tailwind, copy .tw.tsx files and rename them to .tsx
            if (item.endsWith('.tw.tsx')) {
              const destFile = path.join(destComponentsDir, item.replace('.tw.tsx', '.tsx'));
              copyFileWithImportFix(sourceItem, destFile, variantName);
            } else if (
              item.endsWith('.tsx') &&
              !item.includes('.tw.') &&
              !item.includes('.ss.') &&
              !item.includes('.hybrid.')
            ) {
              // Check if .tw.tsx variant exists before using fallback
              const twVariantFile = item.replace('.tsx', '.tw.tsx');
              const twVariantPath = path.join(componentsDir, twVariantFile);
              if (!fs.existsSync(twVariantPath)) {
                // Fallback: copy base .tsx files if no .tw.tsx variant exists
                const destFile = path.join(destComponentsDir, item);
                copyFileWithImportFix(sourceItem, destFile, variantName);
              }
            }
          } else if (variantName === 'stylesheet') {
            // For stylesheet, copy .ss.tsx files and rename them to .tsx
            if (item.endsWith('.ss.tsx')) {
              const destFile = path.join(destComponentsDir, item.replace('.ss.tsx', '.tsx'));
              copyFileWithImportFix(sourceItem, destFile, variantName);
            } else if (
              item.endsWith('.tsx') &&
              !item.includes('.tw.') &&
              !item.includes('.ss.') &&
              !item.includes('.hybrid.')
            ) {
              // Check if .ss.tsx variant exists before using fallback
              const ssVariantFile = item.replace('.tsx', '.ss.tsx');
              const ssVariantPath = path.join(componentsDir, ssVariantFile);
              if (!fs.existsSync(ssVariantPath)) {
                // Fallback: copy base .tsx files if no .ss.tsx variant exists
                const destFile = path.join(destComponentsDir, item);
                copyFileWithImportFix(sourceItem, destFile, variantName);
              }
            }
          }
        }
      }
    }

    // Process types for this component
    processComponentTypes(componentName, variantName, config.coreDir);

    // Create index.ts for the component using the same format as the main library
    const indexPath = path.join(coreComponentPath, 'index.ts');
    const mainIndexPath = path.join(SOURCE_DIR, componentName, 'index.ts');

    if (fs.existsSync(mainIndexPath)) {
      const mainIndexContent = fs.readFileSync(mainIndexPath, 'utf8');
      const indexContent = processIndexExports(mainIndexContent, variantName);

      if (indexContent.trim()) {
        fs.writeFileSync(indexPath, indexContent);
        console.log(`📄 Created index: ${indexPath}`);
      }
    } else {
      // Fallback to old method if main index doesn't exist
      const componentFiles = fs.existsSync(path.join(coreComponentPath, 'components'))
        ? fs.readdirSync(path.join(coreComponentPath, 'components'))
        : [];

      let indexContent = '';
      for (const file of componentFiles) {
        if (file.endsWith('.tsx')) {
          const componentName = path.basename(file, '.tsx');
          indexContent += `export { default as ${componentName} } from './components/${componentName}';\n`;
        }
      }

      if (indexContent) {
        fs.writeFileSync(indexPath, indexContent);
        console.log(`📄 Created index: ${indexPath}`);
      }
    }
  }
}

/**
 * Process utils for all variants
 */
function processUtils() {
  console.log('\n🔄 Processing utils...');

  const utilsSourceDir = 'packages/chill-ui-core/src/utils';

  if (!fs.existsSync(utilsSourceDir)) {
    console.log('⚠️  No utils directory found');
    return;
  }

  for (const [variantName, config] of Object.entries(VARIANTS)) {
    const coreUtilsDir = path.join(CORE_DIR, config.coreDir, 'src/utils');

    console.log(`\n📦 Processing utils for variant: ${variantName}`);

    // Clean destination
    if (fs.existsSync(coreUtilsDir)) {
      fs.rmSync(coreUtilsDir, { recursive: true });
      console.log(`🧹 Cleaned: ${coreUtilsDir}`);
    }

    ensureDir(coreUtilsDir);

    // Copy common utils first (shared by all variants)
    const commonDir = path.join(utilsSourceDir, 'common');
    if (fs.existsSync(commonDir)) {
      const commonFiles = fs.readdirSync(commonDir);
      for (const file of commonFiles) {
        const sourcePath = path.join(commonDir, file);
        const destPath = path.join(coreUtilsDir, file);
        copyFileWithImportFix(sourcePath, destPath, variantName);
      }
      console.log(`📄 Copied common utils for ${variantName}`);
    }

    // Handle variant-specific utils
    if (variantName === 'tailwind') {
      // Copy files from tw/ directory
      const twDir = path.join(utilsSourceDir, 'tw');
      if (fs.existsSync(twDir)) {
        const twFiles = fs.readdirSync(twDir);
        for (const file of twFiles) {
          const sourcePath = path.join(twDir, file);
          const destPath = path.join(coreUtilsDir, file);
          copyFileWithImportFix(sourcePath, destPath, variantName);
        }
      }
    } else if (variantName === 'stylesheet') {
      // Copy files from ss/ directory
      const ssDir = path.join(utilsSourceDir, 'ss');
      if (fs.existsSync(ssDir)) {
        const ssFiles = fs.readdirSync(ssDir);
        for (const file of ssFiles) {
          const sourcePath = path.join(ssDir, file);
          const destPath = path.join(coreUtilsDir, file);
          copyFileWithImportFix(sourcePath, destPath, variantName);
        }
      }
    } else if (variantName === 'hybrid') {
      // For hybrid, copy utils from hybrid/, tw/, and ss/ directories

      // Copy hybrid utils
      const hybridDir = path.join(utilsSourceDir, 'hybrid');
      if (fs.existsSync(hybridDir)) {
        const hybridFiles = fs.readdirSync(hybridDir);
        for (const file of hybridFiles) {
          const sourcePath = path.join(hybridDir, file);
          const destPath = path.join(coreUtilsDir, file);
          copyFileWithImportFix(sourcePath, destPath, variantName);
        }
      }

      // Copy tw utils
      const twDir = path.join(utilsSourceDir, 'tw');
      if (fs.existsSync(twDir)) {
        const twFiles = fs.readdirSync(twDir);
        for (const file of twFiles) {
          const sourcePath = path.join(twDir, file);
          const destPath = path.join(coreUtilsDir, file);
          copyFileWithImportFix(sourcePath, destPath, variantName);
        }
      }

      // Copy ss utils
      const ssDir = path.join(utilsSourceDir, 'ss');
      if (fs.existsSync(ssDir)) {
        const ssFiles = fs.readdirSync(ssDir);
        for (const file of ssFiles) {
          const sourcePath = path.join(ssDir, file);
          const destPath = path.join(coreUtilsDir, file);
          copyFileWithImportFix(sourcePath, destPath, variantName);
        }
      }
    }

    // Create utils index.ts
    const utilsIndexPath = path.join(coreUtilsDir, 'index.ts');
    const utilsFiles = fs.readdirSync(coreUtilsDir).filter(file => file.endsWith('.ts') && file !== 'index.ts');

    let utilsIndexContent = '';
    for (const file of utilsFiles) {
      const moduleName = path.basename(file, '.ts');
      utilsIndexContent += `export * from './${moduleName}';\n`;
    }

    if (utilsIndexContent) {
      fs.writeFileSync(utilsIndexPath, utilsIndexContent);
      console.log(`📄 Created utils index: ${utilsIndexPath}`);
    }
  }
}

/**
 * Flatten types from subdirectories to root types directory
 */
function flattenTypes(sourceTypesDir, destTypesDir, variant) {
  ensureDir(destTypesDir);

  function walkDir(dir, baseDir = '') {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        // Recursively walk subdirectories
        walkDir(itemPath, path.join(baseDir, item));
      } else if (stat.isFile() && item.endsWith('.types.ts')) {
        let shouldCopy = false;
        let destFileName = item;

        // Skip .hybrid.types.ts files for all variants
        if (item.includes('.hybrid.types.ts')) {
          shouldCopy = false;
        } else if (variant === 'stylesheet') {
          // For stylesheet: prefer .ss.types.ts, fallback to base .types.ts
          if (item.includes('.ss.types.ts')) {
            shouldCopy = true;
            destFileName = item.replace('.ss.types.ts', '.types.ts');
          } else if (!item.includes('.tw.types.ts') && !item.includes('.ss.types.ts')) {
            // Copy base file only if no .ss or .tw variant exists
            shouldCopy = true;
          }
        } else if (variant === 'tailwind') {
          // For tailwind: prefer .tw.types.ts, fallback to base .types.ts
          if (item.includes('.tw.types.ts')) {
            shouldCopy = true;
            destFileName = item.replace('.tw.types.ts', '.types.ts');
          } else if (!item.includes('.ss.types.ts') && !item.includes('.tw.types.ts')) {
            // Copy base file only if no .ss or .tw variant exists
            shouldCopy = true;
          }
        } else if (variant === 'hybrid') {
          if (!item.includes('.ss.types.ts') && !item.includes('.tw.types.ts')) {
            shouldCopy = true;
          }
        }

        if (shouldCopy) {
          const destPath = path.join(destTypesDir, destFileName);
          copyFileWithImportFix(itemPath, destPath, variant);
          console.log(`📄 Flattened type: ${path.join(baseDir, item)} → ${destFileName}`);
        }
      }
    }
  }

  walkDir(sourceTypesDir);
}

/**
 * Flatten utils: copy common/ + variant-specific (ss/ or tw/) to root
 */
function flattenUtils(sourceUtilsDir, destUtilsDir, variant) {
  ensureDir(destUtilsDir);

  // Copy files from common/ directory
  const commonDir = path.join(sourceUtilsDir, 'common');
  if (fs.existsSync(commonDir)) {
    const items = fs.readdirSync(commonDir);
    for (const item of items) {
      const sourcePath = path.join(commonDir, item);
      const destPath = path.join(destUtilsDir, item);
      const stat = fs.statSync(sourcePath);

      if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx'))) {
        copyFileWithImportFix(sourcePath, destPath, variant);
      }
    }
  }

  // Copy files from variant-specific directory (ss/ or tw/)
  let variantDir = '';
  if (variant === 'stylesheet') {
    variantDir = path.join(sourceUtilsDir, 'ss');
  } else if (variant === 'tailwind') {
    variantDir = path.join(sourceUtilsDir, 'tw');
  } else if (variant === 'hybrid') {
    variantDir = path.join(sourceUtilsDir, 'hybrid');
  }

  if (variantDir && fs.existsSync(variantDir)) {
    const items = fs.readdirSync(variantDir);
    for (const item of items) {
      const sourcePath = path.join(variantDir, item);
      const destPath = path.join(destUtilsDir, item);
      const stat = fs.statSync(sourcePath);

      if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx'))) {
        copyFileWithImportFix(sourcePath, destPath, variant);
      }
    }
  }

  // Generate index.ts that exports all files
  const indexPath = path.join(destUtilsDir, 'index.ts');
  const files = fs.readdirSync(destUtilsDir).filter(file => {
    return (file.endsWith('.ts') || file.endsWith('.tsx')) && file !== 'index.ts';
  });

  let indexContent = '';
  for (const file of files) {
    const exportName = file.replace(/\.(ts|tsx)$/, '');
    indexContent += `export * from './${exportName}';\n`;
  }

  fs.writeFileSync(indexPath, indexContent);
  console.log(`📄 Generated: ${indexPath}`);
}

/**
 * Process shared directories (constants, etc.) for all variants
 */
function processSharedDirectories() {
  console.log('\n🔄 Processing shared directories...');

  const sourceDir = 'packages/chill-ui-core/src';
  const sharedDirs = ['constants', 'utils'];
  const sharedFiles = ['index.ts', 'index.ss.ts', 'index.tw.ts'];

  for (const [variantName, config] of Object.entries(VARIANTS)) {
    const coreSrcDir = path.join(CORE_DIR, config.coreDir, 'src');

    console.log(`\n📦 Processing shared directories for variant: ${variantName}`);

    for (const sharedDir of sharedDirs) {
      const sourceSharedDir = path.join(sourceDir, sharedDir);
      const destSharedDir = path.join(coreSrcDir, sharedDir);

      if (fs.existsSync(sourceSharedDir)) {
        // Clean destination
        if (fs.existsSync(destSharedDir)) {
          fs.rmSync(destSharedDir, { recursive: true });
          console.log(`🧹 Cleaned: ${destSharedDir}`);
        }

        // Special handling for utils: flatten common + variant-specific
        if (sharedDir === 'utils') {
          flattenUtils(sourceSharedDir, destSharedDir, variantName);
          console.log(`📁 Flattened utils directory for ${variantName}`);
        } else {
          // Copy directory normally
          copyDirectory(sourceSharedDir, destSharedDir, variantName);
          console.log(`📁 Copied shared directory: ${sharedDir} for ${variantName}`);
        }
      } else {
        console.log(`⚠️  Shared directory not found: ${sourceSharedDir}`);
      }
    }

    // Special handling for types: flatten them to root
    const sourceTypesDir = path.join(sourceDir, 'types');
    const destTypesDir = path.join(coreSrcDir, 'types');
    if (fs.existsSync(sourceTypesDir)) {
      // Clean destination
      if (fs.existsSync(destTypesDir)) {
        fs.rmSync(destTypesDir, { recursive: true });
        console.log(`🧹 Cleaned: ${destTypesDir}`);
      }

      flattenTypes(sourceTypesDir, destTypesDir, variantName);
      console.log(`📁 Flattened types for ${variantName}`);

      // Copy types/utils directory as-is (not flattened)
      const sourceUtilsDir = path.join(sourceTypesDir, 'utils');
      const destUtilsDir = path.join(destTypesDir, 'utils');
      if (fs.existsSync(sourceUtilsDir)) {
        copyDirectory(sourceUtilsDir, destUtilsDir, variantName);
        console.log(`📁 Copied types/utils for ${variantName}`);
      }

      // Generate types/index.ts that exports all types and utils
      const typesIndexPath = path.join(destTypesDir, 'index.ts');
      let typesIndexContent = '';

      // Get all .types.ts files in destTypesDir (not in subdirectories, excluding .hybrid)
      const typeFiles = fs.readdirSync(destTypesDir).filter(file => {
        return (
          file.endsWith('.types.ts') &&
          !file.includes('.hybrid.types.ts') &&
          !fs.statSync(path.join(destTypesDir, file)).isDirectory()
        );
      });

      // Export all type files
      for (const file of typeFiles) {
        const exportName = file.replace('.types.ts', '');
        typesIndexContent += `export * from './${exportName}.types';\n`;
      }

      // Export utils if they exist
      if (fs.existsSync(destUtilsDir)) {
        typesIndexContent += `export * from './utils';\n`;
      }

      ensureDir(destTypesDir);
      fs.writeFileSync(typesIndexPath, typesIndexContent);
      console.log(`📄 Generated: ${typesIndexPath}`);
    }

    // Copy shared files
    for (const sharedFile of sharedFiles) {
      const sourceFile = path.join(sourceDir, sharedFile);
      const destFile = path.join(coreSrcDir, sharedFile);

      if (fs.existsSync(sourceFile)) {
        copyFileWithImportFix(sourceFile, destFile, variantName);
        console.log(`📄 Copied shared file: ${sharedFile} for ${variantName}`);
      } else {
        console.log(`⚠️  Shared file not found: ${sourceFile}`);
      }
    }
  }
}

/**
 * Create types index files for each variant
 */
function createTypesIndexes() {
  console.log('\n🔄 Creating types index files...');

  for (const [variantName, config] of Object.entries(VARIANTS)) {
    const typesDir = path.join(CORE_DIR, config.coreDir, 'src/types');

    // Ensure types directory exists
    ensureDir(typesDir);

    const typesIndexPath = path.join(typesDir, 'index.ts');
    let typesIndexContent = '';

    // For all variants, export only base component types (no .ss or .tw suffixes)
    if (fs.existsSync(typesDir)) {
      const typeFiles = fs
        .readdirSync(typesDir)
        .filter(file => file.endsWith('.types.ts') && !file.includes('.ss.types.ts') && !file.includes('.tw.types.ts'));
      for (const typeFile of typeFiles) {
        const typeName = path.basename(typeFile, '.types.ts');
        typesIndexContent += `export * from './${typeName}.types';\n`;
      }
    }

    // Always create index.ts, even if empty
    fs.writeFileSync(typesIndexPath, typesIndexContent || '// No types\n');
    console.log(`📄 Created types index: ${typesIndexPath}`);
  }
}

/**
 * Create components index file
 */
function createComponentsIndex() {
  console.log('\n🔄 Creating components index files...');

  for (const [variantName, config] of Object.entries(VARIANTS)) {
    const componentsPath = path.join(CORE_DIR, config.coreDir, 'src', 'components');
    const componentsIndexPath = path.join(componentsPath, 'index.ts');

    if (!fs.existsSync(componentsPath)) continue;

    const components = fs.readdirSync(componentsPath).filter(item => {
      const itemPath = path.join(componentsPath, item);
      return fs.statSync(itemPath).isDirectory();
    });

    // Sort components alphabetically for consistent output
    components.sort();

    let indexContent = '';
    for (const component of components) {
      indexContent += `export * from './${component}';\n`;
    }

    if (indexContent) {
      fs.writeFileSync(componentsIndexPath, indexContent);
      console.log(`📄 Created components index: ${componentsIndexPath}`);
    }
  }
}

/**
 * Update core index files
 */
function updateCoreIndexes() {
  console.log('\n🔄 Updating core index files...');

  for (const [variantName, config] of Object.entries(VARIANTS)) {
    const coreIndexPath = path.join(CORE_DIR, config.coreDir, 'src', 'index.ts');
    const coreSrcPath = path.join(CORE_DIR, config.coreDir, 'src');

    if (!fs.existsSync(coreSrcPath)) continue;

    let indexContent = '';

    // Export all components from components/index.ts
    const componentsIndexPath = path.join(coreSrcPath, 'components', 'index.ts');
    if (fs.existsSync(componentsIndexPath)) {
      indexContent += `export * from './components';\n`;
    }

    // Export all types from types/index.ts
    const typesPath = path.join(coreSrcPath, 'types');
    if (fs.existsSync(typesPath) && fs.existsSync(path.join(typesPath, 'index.ts'))) {
      indexContent += `export * from './types';\n`;
    }

    // Add utils exports if they exist
    if (fs.existsSync(path.join(coreSrcPath, 'utils'))) {
      indexContent += `export * from './utils';\n`;
    }

    fs.writeFileSync(coreIndexPath, indexContent);
    console.log(`📄 Updated: ${coreIndexPath}`);
  }
}

/**
 * Generate configuration files for a variant
 */
function generateConfigFiles(variantName, config) {
  console.log(`🔧 Generating config files for ${variantName}...`);

  const coreDir = path.join(CORE_DIR, config.coreDir);

  // Generate global.d.ts from template
  const globalDtsTemplate = fs.readFileSync('scripts/templates/global.d.ts.template', 'utf8');
  const globalDtsPath = path.join(coreDir, 'global.d.ts');
  fs.writeFileSync(globalDtsPath, globalDtsTemplate);
  console.log(`📄 Generated: ${globalDtsPath}`);

  // Generate tsconfig.json from template
  const tsconfigTemplate = fs.readFileSync('scripts/templates/tsconfig.template.json', 'utf8');
  const tsconfigPath = path.join(coreDir, 'tsconfig.json');
  fs.writeFileSync(tsconfigPath, tsconfigTemplate);
  console.log(`📄 Generated: ${tsconfigPath}`);

  // Generate bob.config.js
  const bobTemplate = fs.readFileSync('scripts/templates/bob.config.template.js', 'utf8');
  const bobConfig = bobTemplate.replace('{{CORE_NAME}}', config.coreDir);
  const bobPath = path.join(coreDir, 'bob.config.js');
  fs.writeFileSync(bobPath, bobConfig);
  console.log(`📄 Generated: ${bobPath}`);

  // Generate package.json
  const packageTemplatePath = `scripts/templates/package.${variantName}.template.json`;
  const packageTemplate = fs.readFileSync(packageTemplatePath, 'utf8');

  const packagePath = path.join(coreDir, 'package.json');
  fs.writeFileSync(packagePath, packageTemplate);
  console.log(`📄 Generated: ${packagePath}`);

  // Copy nativewind-env.d.ts for tailwind variant
  if (variantName === 'tailwind') {
    const sourceNativewindEnv = path.join('packages/chill-ui-core', 'nativewind-env.d.ts');
    const destNativewindEnv = path.join(coreDir, 'nativewind-env.d.ts');

    if (fs.existsSync(sourceNativewindEnv)) {
      fs.copyFileSync(sourceNativewindEnv, destNativewindEnv);
      console.log(`📄 Copied: ${sourceNativewindEnv} → ${destNativewindEnv}`);
    } else {
      console.log(`⚠️  Source file not found: ${sourceNativewindEnv}`);
    }
  }
}

/**
 * Initialize core directories if they don't exist
 */
function initializeCoreDirectories() {
  console.log('🔄 Initializing core directories...');

  // Create main core directory
  ensureDir(CORE_DIR);

  // Create each variant directory with basic structure
  for (const [variantName, config] of Object.entries(VARIANTS)) {
    const coreDir = path.join(CORE_DIR, config.coreDir);
    const srcDir = path.join(coreDir, 'src');
    const componentsDir = path.join(srcDir, 'components');
    const typesDir = path.join(srcDir, 'types');
    const utilsDir = path.join(srcDir, 'utils');

    ensureDir(coreDir);
    ensureDir(srcDir);
    ensureDir(componentsDir);
    ensureDir(typesDir);
    ensureDir(utilsDir);

    // Generate configuration files
    generateConfigFiles(variantName, config);

    console.log(`📁 Initialized ${config.coreDir} structure`);
  }
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);

  // Initialize core directories first
  initializeCoreDirectories();

  if (args.length === 0) {
    console.log('📋 Available components:');
    const components = fs.readdirSync(SOURCE_DIR).filter(item => {
      const itemPath = path.join(SOURCE_DIR, item);
      return fs.statSync(itemPath).isDirectory();
    });

    for (const component of components) {
      console.log(`  - ${component}`);
    }

    console.log('\n💡 Usage:');
    console.log('  node scripts/separate-components.js <component-name>');
    console.log('  node scripts/separate-components.js all');
    console.log('\n📝 Examples:');
    console.log('  node scripts/separate-components.js avatar');
    console.log('  node scripts/separate-components.js button');
    console.log('  node scripts/separate-components.js all');
    return;
  }

  const componentName = args[0];

  if (componentName === 'all') {
    console.log('🚀 Processing all components...');
    const components = fs.readdirSync(SOURCE_DIR).filter(item => {
      const itemPath = path.join(SOURCE_DIR, item);
      return fs.statSync(itemPath).isDirectory();
    });

    for (const component of components) {
      processComponent(component);
    }

    processUtils();
  } else {
    processComponent(componentName);
    processUtils();
  }

  processSharedDirectories();
  createTypesIndexes();
  createComponentsIndex();
  updateCoreIndexes();

  // Generate README.md for all variants
  console.log('\n📝 Generating README files...');
  for (const [variantName, config] of Object.entries(VARIANTS)) {
    const coreDir = path.join(CORE_DIR, config.coreDir);
    const readmeTemplatePath = 'scripts/templates/README.template.md';
    
    if (fs.existsSync(readmeTemplatePath)) {
      let readmeTemplate = fs.readFileSync(readmeTemplatePath, 'utf8');
      
      // Get package name from package.json
      const packagePath = path.join(coreDir, 'package.json');
      if (fs.existsSync(packagePath)) {
        const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        const packageName = packageData.name;
        
        // Replace placeholder with actual package name
        readmeTemplate = readmeTemplate.replace(/{{PACKAGE_NAME}}/g, packageName);
        
        const readmePath = path.join(coreDir, 'README.md');
        fs.writeFileSync(readmePath, readmeTemplate);
        console.log(`📄 Generated: ${readmePath}`);
      }
    }
  }

  // Convert aliases to relative paths
  console.log('\n🔄 Converting aliases to relative paths...');
  const { execSync } = require('child_process');
  try {
    execSync('node scripts/convert-aliases-to-relative.js', { stdio: 'inherit' });
    console.log('✅ Aliases converted successfully!');
  } catch (error) {
    console.error('❌ Error converting aliases:', error.message);
  }

  console.log('\n✅ Component separation completed!');
}

// Run the script
main();
