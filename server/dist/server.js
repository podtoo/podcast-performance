"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const marked_1 = require("marked");
const playDataRouter_1 = __importDefault(require("./routes/playDataRouter"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.static(path_1.default.join(__dirname, 'public')));
let db;
const dbType = process.env.DB_TYPE;
if (dbType === 'mongodb') {
    db = require('./db/mongodb');
    db.connectDB();
}
else {
    console.error('No valid database type specified');
}
// Read the current version from package.json
const packageJsonPath = path_1.default.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs_1.default.readFileSync(packageJsonPath, 'utf-8'));
const currentVersion = packageJson.version;
// Load landing page content once at server start
const landingPagePath = path_1.default.join(__dirname, 'utils', 'core', 'json', 'landing.json');
let landingPage;
try {
    const landingPageData = fs_1.default.readFileSync(landingPagePath, 'utf8');
    landingPage = JSON.parse(landingPageData);
}
catch (error) {
    console.error('Error reading or parsing landing page content', error);
    process.exit(1);
}
// Middleware to hash IP addresses - This has been left in the hopes that if someone does record peoples IP address that at least they will be hashed.
// Please note this server by default removes all headers and only uses user-agent, you will need to modify the code if you want IP addresses.
// PLEASE DON'T STORE IP ADDRESSES.
app.use((req, res, next) => {
    const userAgent = req.headers['user-agent'] || '';
    if (req.headers['x-real-ip']) {
        req.headers['x-real-ip'] = hashIp(req.headers['x-real-ip'], userAgent);
    }
    if (req.headers['x-forwarded-for']) {
        req.headers['x-forwarded-for'] = hashIp(req.headers['x-forwarded-for'], userAgent);
    }
    next();
});
const hashIp = (ip, userAgent) => {
    const hash = crypto_1.default.createHash('sha256');
    hash.update(ip + userAgent);
    return hash.digest('hex');
};
const generateUUID = () => {
    const timestamp = Date.now().toString(36);
    const randomBytes = crypto_1.default.randomBytes(8).toString('hex');
    return `${timestamp}-${randomBytes}`;
};
// Middleware to attach the db connection to the request
app.use((req, res, next) => {
    req.db = db;
    next();
});
// Use the playDataRouter for /episodeperformance endpoint
app.use('/episodeperformance', playDataRouter_1.default);
app.get('/token', (req, res) => {
    const payload = {
        s: generateUUID(),
        d: process.env.EXPIRES_IN
    };
    const secretKey = process.env.PERFORMANCE_SECRET_KEY;
    if (!secretKey) {
        return res.status(500).json({ error: 'Secret key not configured' });
    }
    let expiresIn = req.query.expiresIn || process.env.EXPIRES_IN;
    if (!expiresIn.endsWith('h')) {
        expiresIn += 'h';
    }
    const token = jsonwebtoken_1.default.sign(payload, secretKey, { expiresIn });
    let decodedToken;
    decodedToken = jsonwebtoken_1.default.verify(token, secretKey);
    req.db.saveToken(decodedToken);
    res.json({ token });
});
// Helper function to recursively list all Markdown files in a directory and its subdirectories
const listMarkdownFiles = (baseDir, dir, fileMap = new Map()) => {
    try {
        const files = fs_1.default.readdirSync(dir);
        files.forEach(file => {
            const filePath = path_1.default.join(dir, file);
            const stat = fs_1.default.statSync(filePath);
            if (stat.isDirectory()) {
                listMarkdownFiles(baseDir, filePath, fileMap);
            }
            else if (file.endsWith('.md')) {
                const relativePath = path_1.default.relative(baseDir, filePath);
                fileMap.set(relativePath, filePath);
            }
        });
    }
    catch (err) {
        console.error(`Error reading directory ${dir}:`, err);
        throw new Error('Error reading Markdown files');
    }
    return fileMap;
};
// Function to insert spaces before capital letters
const insertSpacesBeforeCapitals = (str) => {
    return str.replace(/([A-Z])/g, ' $1').trim();
};
// Generate dynamic routes for each Markdown file
let markdownRoutes = [];
const generateRoutes = (dir) => {
    const fileMap = listMarkdownFiles(dir, dir);
    markdownRoutes = Array.from(fileMap.keys());
    markdownRoutes.forEach(file => {
        const route = `/${file.replace('.md', '')}`;
        app.get(route, (req, res) => {
            const filePath = fileMap.get(file);
            if (!filePath) {
                res.status(404).send('File not found');
                return;
            }
            fs_1.default.readFile(filePath, 'utf8', (err, data) => {
                if (err) {
                    res.status(500).send(`Error reading Markdown file ${JSON.stringify(err)}`);
                    return;
                }
                const { title, style, coreHTML } = landingPage; // Assuming you want to use the same style
                let htmlContent = (0, marked_1.marked)(data);
                const htmlResponse = `
          <html>
          <head>
            <title>${title}</title>
            <link rel="stylesheet" type="text/css" href="${style}">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/themes/prism.min.css" />
            <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/prism.min.js"></script>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/components/prism-javascript.min.js"></script>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/components/prism-php.min.js"></script>
          </head>
          <body>
            ${coreHTML[0].header}
            ${coreHTML[0].subheader.replace('{{currentVersion}}', currentVersion)}
            <div class="gBody">
              ${htmlContent}
            </div>
          </body>
          </html>
        `;
                res.send(htmlResponse);
            });
        });
    });
};
// Generate routes from the markdown directory
const markdownDir = path_1.default.join(__dirname, 'utils', 'core', 'readme');
generateRoutes(markdownDir);
const buildMenuStructure = (paths) => {
    const menu = {};
    paths.forEach(path => {
        const parts = path.split('/');
        let currentLevel = menu;
        parts.forEach((part, index) => {
            if (!currentLevel[part]) {
                currentLevel[part] = index === parts.length - 1 ? null : {};
            }
            currentLevel = currentLevel[part];
        });
    });
    return menu;
};
const generateMenuHTML = (menu, basePath = '') => {
    var _a;
    let html = '<ul>';
    for (const key in menu) {
        if (key.toLowerCase() === 'index' && menu[key] === null) {
            continue; // Skip 'Index.md' as a separate item; it will be linked in its parent directory
        }
        if (menu[key] === null) {
            console.log(key);
            if (key.toLowerCase() === 'index.md') {
                continue; // Skip 'Index.md' as a separate item; it will be linked in its parent directory
            }
            else {
                const route = `${basePath}/${key}`.replace('.md', '').toLowerCase();
                const name = insertSpacesBeforeCapitals(key.replace('.md', '').replace(/-/g, ' '));
                html += `<li><a href="${route}">${name}</a></li>`;
            }
        }
        else {
            const name = insertSpacesBeforeCapitals(key.replace(/-/g, ' '));
            const indexRoute = menu[key] && 'Index.md' in ((_a = menu[key]) !== null && _a !== void 0 ? _a : {}) ? `${basePath}/${key}/index`.toLowerCase() : '';
            const indexLink = indexRoute ? `<a href="${indexRoute}">${name}</a>` : name;
            html += `<li>${indexLink}${generateMenuHTML(menu[key], `${basePath}/${key}`)}</li>`;
        }
    }
    html += '</ul>';
    return html;
};
const menuStructure = buildMenuStructure(markdownRoutes);
// Welcome page route
app.get('/', (req, res) => {
    try {
        const { title, style, coreHTML } = landingPage;
        const links = generateMenuHTML(menuStructure);
        const htmlContent = `
      <html>
      <head>
        <title>${title}</title>
        <link rel="stylesheet" type="text/css" href="${style}">
      </head>
      <body>
        ${coreHTML[0].header}
        ${coreHTML[0].subheader.replace('{{currentVersion}}', currentVersion)}
        ${coreHTML[0].headerTwo}
        ${coreHTML[0].subheadertwo}
        ${links}
      </body>
      </html>
    `;
        res.send(htmlContent);
    }
    catch (error) {
        res.status(500).send('Error generating landing page content');
    }
});
// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof Error) {
        res.status(500).json({ error: error.message });
    }
    else {
        res.status(500).json({ error: 'An unknown error occurred' });
    }
});
const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
