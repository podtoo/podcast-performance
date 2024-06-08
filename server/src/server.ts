import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser'; 
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createServer } from 'node:http';
import setupWebSocketServer from './utils/core/app/wsHandler'; // Import the WebSocket handler
import jwt from 'jsonwebtoken';
import { marked } from 'marked';
import { InsertOneResult, ObjectId, WithId } from 'mongodb';
import { hashPassword } from './utils/core/app/cryptoUtils';
import getChartDataRouter from './routes/getChartDataRouter';
import playDataRouter from './routes/playDataRouter';
import apiRouter from './routes/api/main';
import userRoute from './routes/users/main';
import userPathRoute from './routes/users/userPath';
import inboxFedDataRouter from './routes/fedvers/inboxFedDataRouter';
import wellknown from './routes/fedvers/well-known/main';
import nodeinfo from './routes/fedvers/nodeinfo/main';

dotenv.config();

type MenuStructure = {
  [key: string]: MenuStructure | null;
};

interface AuthRequest extends Request {
  user?: any; // You can specify the exact type of your user object if known
}

const app = express();
app.use(cors());
//app.use(express.json());
// Use body-parser middleware
//app.use(bodyParser.json());  // Use body-parser to parse JSON bodies
// parse various different custom JSON types as JSON
app.use(bodyParser.json({ type: 'application/*+json' }))

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware to log requests
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`Received request: ${req.method} ${req.url}`);
  next();
});



// Define a route to handle the dynamic username parameter
app.use('/@:username', (req, res, next) => {
  const username = req.params.username;
  // You can add any middleware logic here
  console.log(`Received request for user: ${username}`);
  next();
});
app.use(userRoute);
// Create an HTTP server with Express
const server = createServer(app);


let isSetupDone = false;

let db: any;
const dbType = process.env.DB_TYPE;

if (dbType === 'mongodb') {
  db = require('./db/mongodb');
  db.connectDB()
    .then(() => {
      startServer();
    })
    .catch((error: any) => {
      console.error('Failed to connect to MongoDB', error);
      process.exit(1);
    });
} else {
  console.error('No valid database type specified');
  process.exit(1);
}

// Read the current version from package.json
const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
const currentVersion = packageJson.version;

// Load Timezones
const timezonePath = path.join(__dirname, 'utils', 'core', 'json', 'timezones.json');
let timezones: any;
try {
  const timezoneData = fs.readFileSync(timezonePath, 'utf8');
  timezones = JSON.parse(timezoneData);
} catch (error) {
  console.error('Error reading or parsing timezone content', error);
  process.exit(1);
}

// Load landing page content once at server start
const landingPagePath = path.join(__dirname, 'utils', 'core', 'json', 'landing.json');
let landingPage: any;
try {
  const landingPageData = fs.readFileSync(landingPagePath, 'utf8');
  landingPage = JSON.parse(landingPageData);
} catch (error) {
  console.error('Error reading or parsing landing page content', error);
  process.exit(1);
}

// Load settings page content once at server start
const settingsPagePath = path.join(__dirname, 'utils', 'core', 'json', 'setup.json');
let settingsPage: any;
try {
  const settingsPageData = fs.readFileSync(settingsPagePath, 'utf8');
  settingsPage = JSON.parse(settingsPageData);
} catch (error) {
  console.error('Error reading or parsing settings page content', error);
  process.exit(1);
}


// THIS IS IN HERE FOR PRIVACY (DON'T REMOVE)
app.use((req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';
  if (req.headers['x-real-ip']) {
    req.headers['x-real-ip'] = hashIp(req.headers['x-real-ip'] as string, userAgent);
  }
  if (req.headers['x-forwarded-for']) {
    req.headers['x-forwarded-for'] = hashIp(req.headers['x-forwarded-for'] as string, userAgent);
  }
  next();
});

const hashIp = (ip: string, userAgent: string) => {
  const hash = crypto.createHash('sha256');
  hash.update(ip + userAgent);
  return hash.digest('hex');
};

const generateUUID = () => {
  const timestamp = Date.now().toString(36);
  const randomBytes = crypto.randomBytes(8).toString('hex');
  return `${timestamp}-${randomBytes}`;
};

// Middleware to attach the db connection to the request
app.use((req, res, next) => {
  req.db = db;
  next();
});

// Helper function to recursively list all Markdown files in a directory and its subdirectories
const listMarkdownFiles = (baseDir: string, dir: string, fileMap: Map<string, string> = new Map()): Map<string, string> => {
  try {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        listMarkdownFiles(baseDir, filePath, fileMap);
      } else if (file.endsWith('.md')) {
        const relativePath = path.relative(baseDir, filePath);
        fileMap.set(relativePath, filePath);
      }
    });
  } catch (err) {
    console.error(`Error reading directory ${dir}:`, err);
    throw new Error('Error reading Markdown files');
  }
  return fileMap;
};

// Function to insert spaces before capital letters
const insertSpacesBeforeCapitals = (str: string) => {
  return str.replace(/([A-Z])/g, ' $1').trim();
};

// Generate dynamic routes for each Markdown file
let markdownRoutes: string[] = [];

const buildMenuStructure = (paths: string[]): MenuStructure => {
  const menu: MenuStructure = {};

  paths.forEach(path => {
    const parts = path.split('/');
    let currentLevel: MenuStructure = menu;
  
    parts.forEach((part, index) => {
      if (!currentLevel[part]) {
        currentLevel[part] = index === parts.length - 1 ? null : {};
      }
      currentLevel = currentLevel[part] as MenuStructure;
    });
  });

  return menu;
};

const generateMenuHTML = (menu: MenuStructure, basePath: string = ''): string => {
  let html = '<ul class="navbar-nav">';

  for (const key in menu) {
    if (key.toLowerCase() === 'index' && menu[key] === null) {
      continue; // Skip 'Index.md' as a separate item; it will be linked in its parent directory
    }

    if (menu[key] === null) {
      if (key.toLowerCase() === 'index.md') {
        continue; // Skip 'Index.md' as a separate item; it will be linked in its parent directory
      } else {
        const route = `${basePath}/${key}`.replace('.md', '').replace(/:/g, '-').toLowerCase();
        const name = insertSpacesBeforeCapitals(key.replace('.md', '').replace(/-/g, ' ').replace(/:/g, ' '));
        html += `<li class="nav-item"><a class="nav-link" href="${route}">${name}</a></li>`;
      }
    } else {
      const name = insertSpacesBeforeCapitals(key.replace(/-/g, ' ').replace(/:/g, ' '));
      const indexRoute = `${basePath}/${key}/index`.replace(/:/g, '-').toLowerCase();
      const hasIndex = menu[key] && 'Index.md' in (menu[key] ?? {});

      html += `
      <li class="nav-item dropdown dropdown-li">
        ${hasIndex ? `<a class="nav-link dropdown-link" href="${indexRoute}">${name}</a>` : `<span class="nav-link dropdown-link">${name}</span>`}
        <a class="nav-link dropdown-caret dropdown-toggle" href="#" id="${key.replace(/:/g, '-')}-dropdown" role="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          <b class="caret"></b>
        </a>
        ${generateSubMenuHTML(menu[key] as MenuStructure, `${basePath}/${key}`)}
      </li>`;
    }
  }

  html += '</ul>';
  return html;
};

const generateSideMenuHTML = (menu: MenuStructure, basePath: string = '', currentRoute: string = ''): string => {
  let html = '<ul class="navbar-nav">';

  for (const key in menu) {
    if (key.toLowerCase() === 'index' && menu[key] === null) {
      continue; // Skip 'Index.md' as a separate item; it will be linked in its parent directory
    }

    if (menu[key] === null) {
      if (key.toLowerCase() === 'index.md') {
        continue; // Skip 'Index.md' as a separate item; it will be linked in its parent directory
      } else {
        const route = `${basePath}/${key}`.replace('.md', '').replace(/:/g, '-').toLowerCase();
        const name = insertSpacesBeforeCapitals(key.replace('.md', '').replace(/-/g, ' ').replace(/:/g, ' '));
        html += `<li class="nav-item"><a class="nav-link" href="${route}">${name}</a></li>`;
      }
    } else {
      const name = insertSpacesBeforeCapitals(key.replace(/-/g, ' ').replace(/:/g, ' '));
      const indexRoute = `${basePath}/${key}/index`.replace(/:/g, '-').toLowerCase();
      const hasIndex = menu[key] && 'Index.md' in (menu[key] ?? {});
      const isActive = currentRoute.includes(`${basePath}/${key}`.toLowerCase());

      html += `
      <li class="nav-item dropdown dropdown-li ${isActive ? 'show' : ''}">
        ${hasIndex ? `<a class="nav-link dropdown-link ${isActive ? 'active' : ''}" href="${indexRoute}">${name}</a>` : `<span class="nav-link dropdown-link ${isActive ? 'active' : ''}">${name}</span>`}
        <a class="nav-link dropdown-caret dropdown-toggle ${isActive ? 'show' : ''}" href="#" id="${key.replace(/:/g, '-')}-dropdown" role="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="${isActive}">
          <b class="caret"></b>
        </a>
        ${generateSubMenuHTML(menu[key] as MenuStructure, `${basePath}/${key}`, currentRoute)}
      </li>`;
    }
  }

  html += '</ul>';
  return html;
};


const generateSubMenuHTML = (menu: MenuStructure, basePath: string, currentRoute: string = ''): string => {
  let html = '<ul class="dropdown-menu">';

  for (const key in menu) {
    if (menu[key] === null) {
      if (key.toLowerCase() === 'index.md') {
        continue; // Skip 'Index.md' as a separate item; it will be linked in its parent directory
      } else {
        const route = `${basePath}/${key}`.replace('.md', '').replace(/:/g, '-').toLowerCase();
        const name = insertSpacesBeforeCapitals(key.replace('.md', '').replace(/-/g, ' '));
        html += `<li><a class="dropdown-item" href="${route}">${name}</a></li>`;
      }
    } else {
      const name = insertSpacesBeforeCapitals(key.replace(/-/g, ' ').replace(/:/g, ' '));
      const indexRoute = menu[key] && 'Index.md' in (menu[key] ?? {}) ? `${basePath}/${key}/index`.replace(/:/g, '-').toLowerCase() : '';
      const indexLink = indexRoute ? `<a class="dropdown-item" href="${indexRoute}">${name}</a>` : name;

      html += `
        <li class="dropdown-submenu">
          ${indexRoute ? `<a class="dropdown-item dropdown-toggle" href="${indexRoute}">${name}</a>` : `<span class="dropdown-item dropdown-toggle">${name}</span>`}
          ${generateSubMenuHTML(menu[key] as MenuStructure, `${basePath}/${key}`)}
        </li>`;
    }
  }

  html += '</ul>';
  return html;
};


const generateSidebar = (menuStructure: MenuStructure, currentRoute: string) => {
  const documentationMenu = menuStructure['Documentation']!;
  const versionKeys = Object.keys(documentationMenu).filter(key => key.startsWith('v'));

  // Normalize currentRoute to lowercase for comparison
  const normalizedRoute = currentRoute.toLowerCase();
  
  // Find the current version by comparing lowercase paths
  const currentVersion = versionKeys.find(version => normalizedRoute.includes(`/documentation/${version.toLowerCase()}`)) || 'Select Version';

  const versionDropdown = `
    <div class="dropdown">
      <button class="btn btn-secondary dropdown-toggle" type="button" id="versionDropdown" data-bs-toggle="dropdown" aria-expanded="false">
        ${currentVersion}
      </button>
      <ul class="dropdown-menu" aria-labelledby="versionDropdown">
        ${versionKeys.map(version => `
          <li><a class="dropdown-item" href="/documentation/${version}/Index">${version}</a></li>
        `).join('')}
      </ul>
    </div>
  `;


  const versionPages = versionKeys
    .map(version => {
      const versionMenu = documentationMenu[version];
      
      if (versionMenu && normalizedRoute.includes(`/documentation/${version.toLowerCase()}`)) {
        return generateSideMenuHTML(versionMenu, `/documentation/${version}`, normalizedRoute);
      }
      return '';
    }).join('');

  return `
    ${versionDropdown}
    <div class="mt-4">
      ${versionPages}
    </div>
  `;
};



const customScript = `
<script>
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.navbar-nav .nav-item.dropdown').forEach(function(element) {
    element.addEventListener('mouseover', function() {
      this.classList.add('show');
      this.querySelector('.dropdown-menu').classList.add('show');
    });
    element.addEventListener('mouseout', function() {
      this.classList.remove('show');
      this.querySelector('.dropdown-menu').classList.remove('show');
    });
  });

  // Handle dropdown toggle on click
  const sidebarDropdowns = document.querySelectorAll('.sidebar .nav-item.dropdown');

  sidebarDropdowns.forEach(dropdown => {
    const caret = dropdown.querySelector('.dropdown-toggle');
    const menu = dropdown.querySelector('.dropdown-menu');
    
    if (caret) {
      caret.addEventListener('click', (e) => {
        e.preventDefault();

        // Close all other dropdowns
        sidebarDropdowns.forEach(dd => {
          if (dd !== dropdown) {
            dd.classList.remove('show');
            dd.querySelector('.dropdown-menu').classList.remove('show');
            dd.querySelector('.dropdown-toggle').classList.remove('show');
          }
        });

        // Toggle the current dropdown
        dropdown.classList.toggle('show');
        caret.classList.toggle('show');
        menu.classList.toggle('show');
      });
    }
  });

  // Prevent closing dropdown when mouse leaves
  sidebarDropdowns.forEach(dropdown => {
    dropdown.addEventListener('mouseenter', () => {
      dropdown.classList.add('show');
      dropdown.querySelector('.dropdown-menu').classList.add('show');
      dropdown.querySelector('.dropdown-toggle').classList.add('show');
    });

    dropdown.addEventListener('mouseleave', () => {
      dropdown.classList.add('show');
      dropdown.querySelector('.dropdown-menu').classList.add('show');
      dropdown.querySelector('.dropdown-toggle').classList.add('show');
    });
  });

  document.querySelectorAll('.navbar-nav .dropdown-submenu a.dropdown-toggle').forEach(function(element) {
    element.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      var submenu = this.nextElementSibling;
      submenu.classList.toggle('show');
      submenu.style.display = submenu.classList.contains('show') ? 'block' : 'none';
    });
  });
});

</script>
`;

const generateRoutes = (dir: string) => {
  const fileMap = listMarkdownFiles(dir, dir);
  markdownRoutes = Array.from(fileMap.keys());

  const menuStructure = buildMenuStructure(markdownRoutes);
  const links = generateMenuHTML(menuStructure);

  markdownRoutes.forEach(file => {
    // Replace ':' with '-' for route compatibility
    const route = `/${file.replace('.md', '').replace(/:/g, '-')}`;
    app.get(route, db.performanceSettingsMiddleware, (req, res) => {
      const filePath = fileMap.get(file);
      if (!filePath) {
        res.status(404).send('File not found');
        return;
      }

      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          res.status(500).send(`Error reading Markdown file ${JSON.stringify(err)}`);
          return;
        }

        const { title, style, coreHTML } = landingPage;

        let htmlContent = marked(data);

        const sidebar = generateSidebar(menuStructure, route);

        const htmlResponse = `
          <html lang="en">
          <head>
            <title>${title}</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" crossorigin="anonymous">
            <link rel="stylesheet" type="text/css" href="/style/site.css">
            <link rel="stylesheet" type="text/css" href="${style}">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/themes/prism.min.css" />
            <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/prism.min.js"></script>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/components/prism-javascript.min.js"></script>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/components/prism-php.min.js"></script>
            
          </head>
          <body>
            <nav class="navbar navbar-expand-lg navbar-dark bg-dark fixed-top">
              <div class="container">
                <a class="navbar-brand" href="#">${coreHTML[0].header}</a>
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavDropdown" aria-controls="navbarNavDropdown" aria-expanded="false" aria-label="Toggle navigation">
                  <span class="navbar-toggler-icon"></span>
                </button>
                <div class="collapse navbar-collapse" id="navbarNavDropdown">
                  ${links}
                </div>
              </div>
            </nav>
            <div class="sidebar bg-dark d-none d-lg-block">
              ${sidebar}
            </div>
            <div class="content">
              ${htmlContent}
            </div>
            <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL" crossorigin="anonymous"></script>
            ${customScript}
          </body>
          </html>
        `;

        res.send(htmlResponse);
      });
    });
  });

  // Set up the welcome page route after generating the menu
  app.get('/', db.performanceSettingsMiddleware,  (req, res) => {
    isSetupDone = true;
    try {
      const { title, style, coreHTML } = landingPage;

      const htmlContent = `
      <html lang="en">
      <head>
        <title>${title}</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" crossorigin="anonymous">
        <link rel="stylesheet" type="text/css" href="/style/site.css">
        <link rel="stylesheet" type="text/css" href="${style}">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/themes/prism.min.css" />
        <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/prism.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/components/prism-javascript.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/components/prism-php.min.js"></script>
      </head>
      <body>
        <nav class="navbar navbar-expand-lg navbar-dark bg-dark fixed-top">
          <div class="container">
            <a class="navbar-brand" href="#">${coreHTML[0].header}</a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavDropdown" aria-controls="navbarNavDropdown" aria-expanded="false" aria-label="Toggle navigation">
              <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNavDropdown">
              ${links}
            </div>
          </div>
        </nav>
        <div class="content no-ml">
            ${coreHTML[0].subheader.replace('{{currentVersion}}', currentVersion)}
            ${coreHTML[0].headerTwo}
            ${coreHTML[0].subheadertwo}
          </div>
        </body>
        </div>
        </body>
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL" crossorigin="anonymous"></script>
        ${customScript}
        </html>
      `;

      res.send(htmlContent);
    } catch (error) {
      res.status(500).send('Error generating landing page content');
    }
  });
  
  app.get('/setup', (req, res) => {
    if (isSetupDone) {
      return res.status(403).json({ error: 'Setup has already been completed.' });
    }
    // Replace the version placeholder
    res.render('setup', { settingsPage, timezones });
  });


};

// Generate routes from the markdown directory
const markdownDir = path.join(__dirname, 'utils', 'core', 'readme');
generateRoutes(markdownDir);


// THIS IS CORE CODE



app.post('/setup', async (req, res) => {
  if (isSetupDone) {
    return res.status(403).json({ error: 'Setup has already been completed.' });
  }

  const { username, password, name, email, ...settings } = req.body;

  try {
    // Hash the password using crypto
    const { salt, hash } = await hashPassword(password);

    const user = {
      username,
      password: hash,
      name,
      email,
      type: 'admin'
    };

    // Insert user data
    const userResult: InsertOneResult<WithId<any>> = await req.db.createUser(user);
    
    // Insert the salt with the user's ID into a separate collection
    await req.db.insertUserSalt({ 'user': new ObjectId(userResult.insertedId), salt });


    // Insert settings data
    await req.db.settingsInsertDocument(settings);

    // Mark setup as done
    isSetupDone = true;

    // Send a success message with a redirect script
    res.send(`
      <html>
        <body>
          <h1>Setup completed successfully.</h1>
          <p>You will be redirected to the main page in 5 seconds...</p>
          <script>
            setTimeout(function() {
              window.location.href = '/';
            }, 5000);
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error during setup:', error);
    res.status(500).json({ error: 'An error occurred during setup.' });
  }
});

const replaceVersion = (obj: any, version: string): any => {
  if (typeof obj === 'string') {
      return obj.replace('{{currentVersion}}', version);
  } else if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
          obj[index] = replaceVersion(item, version);
      });
  } else if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
              obj[key] = replaceVersion(obj[key], version);
          }
      }
  }
  return obj;
};
replaceVersion(settingsPage, currentVersion);
replaceVersion(landingPage, currentVersion);


// Use the playDataRouter for /episodeperformance endpoint
app.use('/episodeperformance', playDataRouter);

// Use the playDataRouter for /episodeperformance endpoint
app.use('/charts', getChartDataRouter);

// Use the API for /api endpoint
app.use('/api', apiRouter);




// Use the playDataRouter for /episodeperformance endpoint
app.use('/users', userPathRoute);
app.use('/inbox', inboxFedDataRouter);
app.use('/.well-known', wellknown);
app.use('/nodeinfo', nodeinfo);

app.get('/token', async (req, res) => {
  const secretKey = process.env.PERFORMANCE_SECRET_KEY;
  if (!secretKey) {
    return res.status(500).json({ error: 'Secret key not configured' });
  }

  const payload: any = {
    s: generateUUID(),
    d: process.env.EXPIRES_IN
  };


  const publicKey = req.headers['x-pub-key'];
  let expiresIn = req.query.expiresIn as string || process.env.EXPIRES_IN as string;

  if (publicKey === process.env.PERFORMANCE_PUBLIC_KEY) {
    if (typeof publicKey !== 'string') {
      return res.status(400).json({ error: 'Invalid public key' });
    }

    payload.a = true;
    expiresIn = process.env.EXPIRES_IN as string;
  }

  if (!expiresIn.endsWith('h')) {
    expiresIn += 'h';
  }

  try {
    const token = jwt.sign(payload, secretKey, { expiresIn });
    const decodedToken = jwt.verify(token, secretKey);
    
    await req.db.saveToken(decodedToken);

    res.json({ token });
  } catch (err) {
    console.error('Error generating token:', err);
    res.status(500).json({ error: 'Error generating token' });
  }
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (error instanceof Error) {
    res.status(500).json({ error: error.message });
  } else {
    res.status(500).json({ error: 'An unknown error occurred' });
  }
});

const startServer = () => {
  const PORT = process.env.PORT || 7000;

  const server = createServer(app);
  setupWebSocketServer(server, db);  
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};
