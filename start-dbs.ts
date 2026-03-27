import { getTestContainers } from './test/helpers/containers.js';
import * as fs from 'fs';

async function main() {
  console.log('Starting databases...');
  const containers = await getTestContainers();
  const configs = containers.getAllConfigs();
  
    const connections: { [key: string]: any } = {};
  for (const [type, config] of configs.entries()) {
    console.log(`Started ${type}:`);
    console.log(config);
    connections[type] = { config, name: `test-${type}` };
  }
  
  fs.writeFileSync('test-connections.json', JSON.stringify(connections, null, 2));
  console.log('Saved connection details to test-connections.json');
  console.log('Containers are running. This process will stay alive to keep them running.');
  
  // Keep the process alive so testcontainers doesn't kill the containers
  setInterval(() => {}, 1000 * 60 * 60);
}

main().catch(console.error);
