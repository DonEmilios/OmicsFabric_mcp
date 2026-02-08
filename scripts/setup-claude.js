import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_CONFIG_PATH = path.resolve(__dirname, "../mcp.json");
const CLAUDE_CONFIG_PATH = path.join(
  os.homedir(),
  "Library/Application Support/Claude/claude_desktop_config.json"
);

function setup() {
  try {
    console.log("Reading project config...");
    const projectConfig = JSON.parse(fs.readFileSync(PROJECT_CONFIG_PATH, "utf-8"));

    let claudeConfig = {};
    if (fs.existsSync(CLAUDE_CONFIG_PATH)) {
      console.log("Reading existing Claude config...");
      try {
        claudeConfig = JSON.parse(fs.readFileSync(CLAUDE_CONFIG_PATH, "utf-8"));
      } catch (e) {
        console.warn("Existing Claude config is malformed. Overwriting...");
      }
    }

    if (!claudeConfig.mcpServers) {
      claudeConfig.mcpServers = {};
    }

    console.log("Merging configurations...");
    Object.assign(claudeConfig.mcpServers, projectConfig.mcpServers);

    console.log("Writing updated Claude config...");
    fs.mkdirSync(path.dirname(CLAUDE_CONFIG_PATH), { recursive: true });
    fs.writeFileSync(CLAUDE_CONFIG_PATH, JSON.stringify(claudeConfig, null, 2));

    console.log("Success! Restart Claude Desktop to see the changes.");
  } catch (error) {
    console.error("Error setting up Claude config:", error.message);
    process.exit(1);
  }
}

setup();
