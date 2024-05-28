"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const playDataRouter_1 = __importDefault(require("./routes/playDataRouter"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
let db;
const dbType = process.env.DB_TYPE;
if (dbType === 'mongodb') {
    db = require('./db/mongodb');
    db.connectDB();
}
else {
    console.error('No valid database type specified');
}
let latestVersion = null;
// Fetch the latest version from GitHub
const fetchLatestVersion = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield (0, node_fetch_1.default)('https://api.github.com/repos/podtoo/podcast-performance/releases/latest', {
            headers: {
                'Accept': 'application/vnd.github+json',
            },
        });
        const data = (yield response.json());
        latestVersion = data.tag_name;
    }
    catch (error) {
        console.error('Error fetching latest version:', error);
    }
});
// Fetch the latest version on server start
fetchLatestVersion();
// Read the current version from package.json
const packageJsonPath = path_1.default.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs_1.default.readFileSync(packageJsonPath, 'utf-8'));
const currentVersion = packageJson.version;
// Middleware to hash IP addresses
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
// Middleware to attach the db connection to the request
app.use((req, res, next) => {
    req.db = db;
    next();
});
// Use the playDataRouter for /episodeperformance endpoint
app.use('/episodeperformance', playDataRouter_1.default);
// Define other routes
app.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Fetch the latest version if not already fetched
    if (!latestVersion) {
        yield fetchLatestVersion();
    }
    const isOutdated = latestVersion && currentVersion !== latestVersion;
    res.send(`Hello, world! Current version: ${currentVersion}. Latest version: ${latestVersion || 'unknown'}. ${isOutdated ? 'Your version is outdated.' : ''}`);
}));
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
