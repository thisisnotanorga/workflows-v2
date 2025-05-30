#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const { performance } = require('perf_hooks');
const { checkJavaScriptSyntax } = require('./syntax-check');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));

function log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const colors = {
        'info': '\x1b[37m',
        'success': '\x1b[32m\x1b[1m',
        'warning': '\x1b[33m',
        'error': '\x1b[31m\x1b[1m',
        'reset': '\x1b[0m'
    };

    const color = colors[type] || colors.info;
    console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
}

function displayLogo() {
    console.log('\x1b[36m');
    console.log('███╗   ██╗ ██████╗ ███████╗██╗  ██╗██╗██████╗ ');
    console.log('████╗  ██║██╔═══██╗██╔════╝██║ ██╔╝██║██╔══██╗');
    console.log('██╔██╗ ██║██║   ██║███████╗█████╔╝ ██║██║  ██║');
    console.log('██║╚██╗██║██║   ██║╚════██║██╔═██╗ ██║██║  ██║');
    console.log('██║ ╚████║╚██████╔╝███████║██║  ██╗██║██████╔╝');
    console.log('╚═╝  ╚═══╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝╚═════╝ ');
    console.log('             ██████╗ ██╗   ██╗██╗██╗     ██████╗ ███████╗██████╗ ');
    console.log('             ██╔══██╗██║   ██║██║██║     ██╔══██╗██╔════╝██╔══██╗');
    console.log('             ██████╔╝██║   ██║██║██║     ██║  ██║█████╗  ██████╔╝');
    console.log('             ██╔══██╗██║   ██║██║██║     ██║  ██║██╔══╝  ██╔══██╗');
    console.log('             ██████╔╝╚██████╔╝██║███████╗██████╔╝███████╗██║  ██║');
    console.log('             ╚═════╝  ╚═════╝ ╚═╝╚══════╝╚═════╝ ╚══════╝╚═╝  ╚═╝');
    console.log('\x1b[0m');
    console.log();
}

class NoSkidBuilder {
    constructor() {
        this.usedNames = new Set();
        this.variableMap = new Map();
        this.assetMap = new Map();
        this.varCounter = 0;
        this.buildDir = '';
        this.stats = {
            originalSize: 0,
            minifiedSize: 0,
            filesProcessed: 0,
            assetsRenamed: 0,
            htmlFilesOptimized: 0
        };

        this.reservedKeywords = new Set(config.reservedKeywords);
        this.criticalScripts = new Set(config.criticalScripts);
    }

    checkProjectRoot() {
        for (const file of config.requiredFiles) {
            if (!fs.existsSync(file)) {
                log(`Missing required file: ${file}`, 'error');
                return false;
            }
        }

        log('Project root validated successfully!', 'success');
        return true;
    }

    generateRandomName() {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let result;

        do {
            result = '';
            for (let i = 0; i < 6; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
        } while (this.usedNames.has(result) || this.reservedKeywords.has(result));

        this.usedNames.add(result);
        return result;
    }

    createBuildDir() {
        const now = new Date();
        const timestamp = now.toISOString()
            .replace(/[-:]/g, '')
            .replace(/\..+/, '')
            .replace('T', '-');

        this.buildDir = path.join('build', `prod-${timestamp}`);

        if (!fs.existsSync('build')) {
            fs.mkdirSync('build');
        }

        fs.mkdirSync(this.buildDir, { recursive: true });
        log(`Created build directory: ${this.buildDir}`, 'success');
    }

    minifyHTML(tag, html) {
        let minified = html;

        minified = minified.replace(/<!--(?!\s*(?:\[if [^\]]+\]|<!|>))[\s\S]*?-->/g, '');
        minified = minified.replace(/>\s+</g, '><');
        minified = minified.replace(/^\s+|\s+$/gm, '');
        minified = minified.replace(/\n\s*\n/g, '\n');
        minified = minified.replace(/\s{2,}/g, ' ');
        minified = minified.replace(/\s*(<\/?(?:html|head|body|title|meta|link|script|style|div|span|p|h[1-6]|ul|ol|li|nav|header|footer|main|section|article|aside)[^>]*>)\s*/gi, '$1');

        let result = tag + '\n' + minified;

        return result.trim();
    }

    isCriticalScript(url) {
        if (!url) return false;
        const lowerUrl = url.toLowerCase();
        return Array.from(this.criticalScripts).some(pattern => lowerUrl.includes(pattern));
    }

    copyFiles() {
        log('Starting file copy and optimization process...', 'info');

        const rootFiles = fs.readdirSync('.');

        for (const file of rootFiles) {
            if (file.endsWith('.html')) {
                const content = fs.readFileSync(file, 'utf8');
                const optimized = this.minifyHTML(config.commentTag, content);
                fs.writeFileSync(path.join(this.buildDir, file), optimized);
                this.stats.htmlFilesOptimized++;
                log(`Optimized and copied: ${file}`, 'success');
            } else if (file.endsWith('.ico')) {
                fs.copyFileSync(file, path.join(this.buildDir, file));
                log(`Copied: ${file}`, 'success');
            }
        }

        for (const dir of config.directoriesToCopy) {
            if (fs.existsSync(dir)) {
                this.copyDir(dir, path.join(this.buildDir, dir));
                log(`Copied directory: ${dir}`, 'success');
            }
        }
    }

    copyDir(src, dest) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }

        const entries = fs.readdirSync(src, { withFileTypes: true });

        for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);

            if (entry.isDirectory()) {
                this.copyDir(srcPath, destPath);
            } else {
                fs.copyFileSync(srcPath, destPath);
            }
        }
    }

    cleanUrl(url) {
        try {
            const cleanedUrl = url.trim().replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
            new URL(cleanedUrl);
            return cleanedUrl;
        } catch (error) {
            log(`Invalid URL detected: "${url}" (length: ${url.length})`, 'error');
            log(`URL bytes: ${Array.from(url).map(c => c.charCodeAt(0)).join(', ')}`, 'error');
            throw new Error(`Invalid URL format: ${url}`);
        }
    }

    async downloadFile(url) {
        return new Promise((resolve, reject) => {
            try {
                const cleanedUrl = this.cleanUrl(url);
                const parsedUrl = new URL(cleanedUrl);
                const client = parsedUrl.protocol === 'https:' ? https : http;

                log(`Attempting to download: ${cleanedUrl}`, 'info');

                const options = {
                    hostname: parsedUrl.hostname,
                    port: parsedUrl.port,
                    path: parsedUrl.pathname + parsedUrl.search,
                    method: 'GET',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                };

                const request = client.request(options, (response) => {
                    if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                        let redirectUrl = response.headers.location;

                        if (redirectUrl.startsWith('/')) {
                            redirectUrl = `${parsedUrl.protocol}//${parsedUrl.host}${redirectUrl}`;
                        } else if (!redirectUrl.startsWith('http')) {
                            redirectUrl = new URL(redirectUrl, cleanedUrl).href;
                        }

                        log(`Following redirect from ${cleanedUrl} to ${redirectUrl}`, 'warning');
                        this.downloadFile(redirectUrl).then(resolve).catch(reject);
                        return;
                    }

                    if (response.statusCode !== 200) {
                        reject(new Error(`HTTP ${response.statusCode} for ${cleanedUrl}`));
                        return;
                    }

                    let data = '';
                    response.setEncoding('utf8');
                    response.on('data', chunk => data += chunk);
                    response.on('end', () => {
                        log(`Successfully downloaded ${cleanedUrl} (${data.length} bytes)`, 'success');
                        resolve(data);
                    });
                });

                request.on('error', (error) => {
                    log(`Request error for ${cleanedUrl}: ${error.message}`, 'error');
                    reject(error);
                });

                request.setTimeout(15000, () => {
                    request.destroy();
                    reject(new Error(`Download timeout for ${cleanedUrl}`));
                });

                request.end();

            } catch (error) {
                reject(error);
            }
        });
    }

    getVariableName() {
        const alphabet = 'abcdefghijklmnopqrstuvwxyz';
        let name = '';
        let num = this.varCounter++;

        do {
            if (num < 26) {
                name = alphabet[num];
            } else {
                let base = Math.floor(num / 26) - 1;
                let remainder = num % 26;
                name = alphabet[base] + alphabet[remainder];
            }

            if (this.reservedKeywords.has(name)) {
                num = this.varCounter++;
                continue;
            }

            break;
        } while (true);

        return name;
    }

    minifyJS(code, originalName) {
        this.stats.originalSize += code.length;

        let minified = code;

        if (this.isCriticalScript(originalName)) {
            log(`Skipping minification for critical script: ${originalName}`, 'warning');
            this.stats.minifiedSize += code.length;
            return `//${originalName}\n${code}`;
        }

        if (!checkJavaScriptSyntax(code)) {
            log(`Syntax error in script: ${originalName}`, 'error');
            return `//${originalName}\n${code}`;
        }

        minified = minified.replace(/^\s*\/\/.*$/gm, '');
        minified = minified.replace(/\s\/\/.*$/gm, '');
        minified = minified.replace(/\/\*[\s\S]*?\*\//g, '');

        minified = minified.replace(/^\s+/gm, '');
        minified = minified.replace(/\s+$/gm, '');
        minified = minified.replace(/\n\s*\n/g, '\n');
        minified = minified.replace(/  +/g, ' ');

        minified = minified.replace(/\s*;\s*\n/g, ';\n');
        minified = minified.replace(/\s*{\s*\n/g, '{\n');
        minified = minified.replace(/\n\s*}/g, '\n}');

        const varPattern = /\b(?:var|let|const)\s+([a-zA-Z_$][a-zA-Z0-9_$]{7,})\b/g;
        const longVars = [];
        let match;

        while ((match = varPattern.exec(minified)) !== null) {
            const varName = match[1];

            const skipPatterns = [
                /^[A-Z]/,
                /element/i, /event/i, /error/i, /response/i, /promise/i,
                /callback/i, /handler/i, /listener/i, /timeout/i, /interval/i,
                /document/i, /window/i, /console/i, /location/i,
                /container/i, /wrapper/i, /content/i, /message/i,
                /timestamp/i, /duration/i, /config/i, /settings/i,
                /function/i, /method/i, /property/i, /attribute/i,
                /turnstile/i, /cloudflare/i, /recaptcha/i, /hcaptcha/i
            ];

            const shouldSkip = skipPatterns.some(pattern => pattern.test(varName)) ||
                this.reservedKeywords.has(varName);

            if (!shouldSkip && !this.variableMap.has(varName)) {
                const shortName = this.getVariableName();
                this.variableMap.set(varName, shortName);
                longVars.push(varName);
            }
        }

        for (const [original, short] of this.variableMap) {
            const regex = new RegExp(`\\b${original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
            minified = minified.replace(regex, short);
        }

        minified = minified.replace(/\n\n+/g, '\n').trim();

        if (!checkJavaScriptSyntax(minified)) {
            log(`Syntax error after minification in script: ${originalName}`, 'error');
            return `//${originalName}\n${code}`;
        }

        this.stats.minifiedSize += minified.length;
        this.stats.filesProcessed++;

        return `//${originalName}\n${minified}`;
    }

    processAssets() {
        log('Processing and renaming asset files...', 'info');

        const assetsDir = path.join(this.buildDir, 'assets');
        if (!fs.existsSync(assetsDir)) return;

        this.processAssetsRecursively(assetsDir, 'assets');
    }

    processAssetsRecursively(dir, relativePath) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relativeFilePath = `${relativePath}/${entry.name}`;

            if (entry.isDirectory()) {
                if (entry.name !== 'js') {
                    this.processAssetsRecursively(fullPath, relativeFilePath);
                }
            } else {
                if (entry.name.endsWith('.js')) {
                    continue;
                }

                const ext = path.extname(entry.name);
                const newName = this.generateRandomName() + ext;
                const newPath = path.join(dir, newName);

                fs.renameSync(fullPath, newPath);

                const originalRelativePath = relativeFilePath;
                const newRelativePath = `${relativePath}/${newName}`;
                this.assetMap.set(originalRelativePath, newRelativePath);

                const originalWithoutAssets = relativeFilePath.replace(/^assets\//, '');
                const newWithoutAssets = newRelativePath.replace(/^assets\//, '');
                this.assetMap.set(originalWithoutAssets, newWithoutAssets);

                this.assetMap.set(entry.name, newName);

                log(`Renamed asset: ${entry.name} -> ${newName}`, 'success');
                this.stats.assetsRenamed++;
            }
        }
    }

    updateAssetReferences() {
        log('Updating asset references in all files...', 'info');

        const filesToUpdate = this.getAllFilesForReferenceUpdate(this.buildDir);

        for (const filePath of filesToUpdate) {
            this.updateFileReferences(filePath);
        }
    }

    getAllFilesForReferenceUpdate(dir) {
        const files = [];
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                files.push(...this.getAllFilesForReferenceUpdate(fullPath));
            } else {
                const ext = path.extname(entry.name).toLowerCase();
                if (['.html', '.css', '.js', '.json', '.xml', '.svg', '.txt', '.md'].includes(ext)) {
                    files.push(fullPath);
                }
            }
        }

        return files;
    }

    updateFileReferences(filePath) {
        try {
            let content = fs.readFileSync(filePath, 'utf8');
            let updated = false;
            const originalContent = content;

            const sortedAssetMap = new Map([...this.assetMap.entries()].sort((a, b) => b[0].length - a[0].length));

            for (const [originalPath, newPath] of sortedAssetMap) {
                if (!originalPath || !newPath) continue;

                const escapedOriginal = originalPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

                const patterns = [
                    {
                        regex: new RegExp(`url\\(\\s*(['"\`]?)${escapedOriginal}\\1\\s*\\)`, 'gi'),
                        replacement: `url($1${newPath}$1)`
                    },
                    {
                        regex: new RegExp(`(src|href)\\s*=\\s*(['"\`])${escapedOriginal}\\2`, 'gi'),
                        replacement: `$1=$2${newPath}$2`
                    },
                    {
                        regex: new RegExp(`(['"\`])${escapedOriginal}\\1`, 'g'),
                        replacement: `$1${newPath}$1`
                    },
                    {
                        regex: new RegExp(`(background-image|background|content)\\s*:\\s*url\\(\\s*(['"\`]?)${escapedOriginal}\\2\\s*\\)`, 'gi'),
                        replacement: `$1: url($2${newPath}$2)`
                    },
                    {
                        regex: new RegExp(`@import\\s+(['"\`])${escapedOriginal}\\1`, 'gi'),
                        replacement: `@import $1${newPath}$1`
                    },
                    {
                        regex: new RegExp(`\\b${escapedOriginal}\\b`, 'g'),
                        replacement: newPath
                    }
                ];

                for (const pattern of patterns) {
                    if (pattern.regex.test(content)) {
                        content = content.replace(pattern.regex, pattern.replacement);
                        updated = true;
                    }
                }
            }

            if (updated && content !== originalContent) {
                fs.writeFileSync(filePath, content);
                log(`Updated references in: ${path.relative(this.buildDir, filePath)}`, 'success');
            }
        } catch (error) {
            log(`Error updating references in ${filePath}: ${error.message}`, 'warning');
        }
    }

    async processJSFiles() {
        log('Processing JavaScript files...', 'info');

        const loaderPath = path.join(this.buildDir, 'assets', 'js', '@loader.js');
        const loaderContent = fs.readFileSync(loaderPath, 'utf8');

        log('Searching for scripts array in loader...', 'info');

        const scriptArrayMatch = loaderContent.match(/this\.scripts\s*=\s*\[([\s\S]*?)\]/);
        if (!scriptArrayMatch) {
            log('Could not find scripts array in loader', 'error');
            log('Loader content preview:', 'info');
            console.log(loaderContent.substring(0, 500) + '...');
            return;
        }

        const scriptStr = scriptArrayMatch[1];
        log(`Found scripts array content: ${scriptStr.substring(0, 200)}...`, 'info');

        const scriptMatches = scriptStr.match(/['"`]([^'"`]+)['"`]/g) || [];
        const scripts = scriptMatches.map(s => s.replace(/['"`]/g, '').trim());

        log(`Found ${scripts.length} scripts to process`, 'info');
        scripts.forEach((script, index) => {
            log(`Script ${index + 1}: "${script}" (length: ${script.length})`, 'info');
        });

        const newScriptNames = new Map();
        let processedLoaderContent = loaderContent;

        for (const script of scripts) {
            if (!script || script.length === 0) {
                log('Skipping empty script entry', 'warning');
                continue;
            }

            if (this.isCriticalScript(script)) {
                log(`Preserving critical script: ${script}`, 'warning');
                continue;
            }

            let content = '';
            let originalName = '';

            if (script.startsWith('http')) {
                try {
                    log(`Processing external script: ${script}`, 'info');
                    content = await this.downloadFile(script);
                    originalName = script.split('/').pop().split('?')[0];
                } catch (error) {
                    log(`Failed to download ${script}: ${error.message}`, 'error');
                    continue;
                }
            } else {
                const scriptPath = path.join(this.buildDir, script);
                if (fs.existsSync(scriptPath)) {
                    content = fs.readFileSync(scriptPath, 'utf8');
                    originalName = path.basename(script);
                    fs.unlinkSync(scriptPath);
                } else {
                    log(`Local script not found: ${script}`, 'warning');
                    continue;
                }
            }

            const newName = this.generateRandomName() + '.js';
            const minified = this.minifyJS(content, originalName);

            fs.writeFileSync(path.join(this.buildDir, 'assets', 'js', newName), minified);
            newScriptNames.set(script, `assets/js/${newName}`);

            log(`Processed: ${originalName} -> ${newName}`, 'success');
        }

        for (const [oldPath, newPath] of newScriptNames) {
            const escapedOldPath = oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            processedLoaderContent = processedLoaderContent.replace(
                new RegExp(`['" \`]${escapedOldPath}['" \`]`, 'g'),
                `'${newPath}'`
            );
        }

        const newLoaderName = this.generateRandomName() + '.js';
        const minifiedLoader = this.minifyJS(processedLoaderContent, '@loader.js');

        fs.writeFileSync(path.join(this.buildDir, 'assets', 'js', newLoaderName), minifiedLoader);
        fs.unlinkSync(loaderPath);

        log(`Processed loader: @loader.js -> ${newLoaderName}`, 'success');

        this.updateIndexHTML(newLoaderName);
    }

    updateIndexHTML(newLoaderName) {
        const indexPath = path.join(this.buildDir, 'index.html');
        let content = fs.readFileSync(indexPath, 'utf8');

        content = content.replace(
            /assets\/js\/@loader\.js/g,
            `assets/js/${newLoaderName}`
        );

        fs.writeFileSync(indexPath, content);
        log(`Updated index.html with new loader name: ${newLoaderName}`, 'success');
    }

    async build() {
        const startTime = performance.now();

        displayLogo();
        log('Starting NoSkid build process...', 'info');

        if (!this.checkProjectRoot()) {
            process.exit(1);
        }

        this.createBuildDir();
        this.copyFiles();

        this.processAssets();

        await this.processJSFiles();

        this.updateAssetReferences();

        this.writeChangeLog();

        const endTime = performance.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        log(`Build completed successfully in ${duration}s!`, 'success');
        log(`Output directory: ${this.buildDir}`, 'info');

        const spaceSaved = this.stats.originalSize - this.stats.minifiedSize;
        const compressionRatio = this.stats.originalSize > 0 ?
            ((spaceSaved / this.stats.originalSize) * 100).toFixed(1) : '0';

        log(`HTML files optimized: ${this.stats.htmlFilesOptimized}`, 'info');
        log(`JS files processed: ${this.stats.filesProcessed}`, 'info');
        log(`Assets renamed: ${this.stats.assetsRenamed}`, 'info');
        log(`Variables renamed: ${this.variableMap.size}`, 'info');
        log(`Space saved: ${spaceSaved} bytes (${compressionRatio}%)`, 'info');
    }

    writeChangeLog() {
        const changeLogPath = path.join(this.buildDir, 'changelog.txt');
        let changeLogContent = 'Build Change Log\n';
        changeLogContent += '================\n\n';

        changeLogContent += 'Variable Renames:\n';
        this.variableMap.forEach((newName, oldName) => {
            changeLogContent += `- ${oldName} -> ${newName}\n`;
        });

        changeLogContent += '\nAsset Renames:\n';
        this.assetMap.forEach((newPath, oldPath) => {
            changeLogContent += `- ${oldPath} -> ${newPath}\n`;
        });

        fs.writeFileSync(changeLogPath, changeLogContent);
        log(`Change log written to: ${changeLogPath}`, 'success');
    }
}

if (require.main === module) {
    const builder = new NoSkidBuilder();
    builder.build().catch(error => {
        log(`Build failed: ${error.message}`, 'error');
        console.error(error);
        process.exit(1);
    });
}
