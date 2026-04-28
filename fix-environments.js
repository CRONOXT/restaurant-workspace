const fs = require('fs');
const path = require('path');

// Function to read .env file and get a variable
const getEnvVar = (varName) => {
  if (!fs.existsSync('.env')) return null;
  const envContent = fs.readFileSync('.env', 'utf8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    const [key, value] = line.split('=');
    if (key && key.trim() === varName) {
      return value ? value.trim() : null;
    }
  }
  return null;
};

const ip = getEnvVar('SERVER_IP') || 'localhost';
const backendPort = '3333';

console.log(`Using IP: ${ip}`);

const envContent = `export const environment = {
  production: false,
  apiUrl: 'http://${ip}:${backendPort}/api'
};
`;

// Create environment files
const createEnv = (appPath) => {
  const envDir = path.join(appPath, 'src', 'environments');
  if (!fs.existsSync(envDir)) fs.mkdirSync(envDir, { recursive: true });
  fs.writeFileSync(path.join(envDir, 'environment.ts'), envContent);
};

createEnv('apps/backoffice');
createEnv('apps/comensal');

// Helper to update backoffice services
const updateBackofficeService = (filePath, relativeEnvPath) => {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Skip if already has environment
  if (content.includes('import { environment }')) return;
  
  // Add import after last import
  const importLines = content.match(/^import.*?;/gm) || [];
  const lastImport = importLines[importLines.length - 1];
  
  if (lastImport) {
    content = content.replace(lastImport, `${lastImport}\nimport { environment } from '${relativeEnvPath}';`);
  } else {
    content = `import { environment } from '${relativeEnvPath}';\n` + content;
  }
  
  // Replace private apiUrl = '/api/xxx';
  content = content.replace(/private apiUrl = '\/api\/([^']+)';/g, "private apiUrl = `${environment.apiUrl}/$1`;");
  
  fs.writeFileSync(filePath, content);
};

// Update all backoffice services
const backofficeServicesDir = 'apps/backoffice/src/app/core/services';
if (fs.existsSync(backofficeServicesDir)) {
  fs.readdirSync(backofficeServicesDir).filter(f => f.endsWith('.ts')).forEach(file => {
    updateBackofficeService(path.join(backofficeServicesDir, file), '../../../environments/environment');
  });
}

// Update auth service
updateBackofficeService('apps/backoffice/src/app/core/auth/auth.service.ts', '../../../environments/environment');

// Update comensal public-menu
const comensalMenuPath = 'apps/comensal/src/app/public-menu/public-menu.component.ts';
if (fs.existsSync(comensalMenuPath)) {
  let content = fs.readFileSync(comensalMenuPath, 'utf8');
  if (!content.includes('import { environment }')) {
    content = content.replace(/import { HttpClient } from '@angular\/common\/http';/, "import { HttpClient } from '@angular/common/http';\nimport { environment } from '../../../environments/environment';");
    content = content.replace(/\/api\/menu/g, '${environment.apiUrl}/menu');
    content = content.replace(/\/api\/categoria/g, '${environment.apiUrl}/categoria');
    fs.writeFileSync(comensalMenuPath, content);
  }
}

console.log('Environments created and services updated.');
