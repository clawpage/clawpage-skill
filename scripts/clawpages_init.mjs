import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const API_HOST = process.env.API_HOST || "https://api.clawpage.ai";
const KEYS_FILE = path.join(process.cwd(), "keys.local.json");
const MAX_RETRIES = 5;

// Generate a random 4-digit string
function randomDigits() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Clean up OS username to be DNS-safe
function getBaseUsername() {
  try {
    const userInfo = os.userInfo();
    let name = userInfo.username.toLowerCase();
    name = name.replace(/[^a-z0-9-]/g, "-"); // Replace non-alphanumeric with dash
    name = name.replace(/^-+|-+$/g, ""); // Remove leading/trailing dashes
    
    // Ensure min length 6
    while (name.length < 6) {
      name += "0";
    }
    
    // If it's still invalid or empty, use a default fallback
    if (!name || name.length < 6) {
      return "builder";
    }
    
    return name;
  } catch (err) {
    return "builder";
  }
}

async function registerAccount(username) {
  const url = `${API_HOST}/api/register`;
  console.log(`\x1b[90m> POST ${url} { "username": "${username}" }\x1b[0m`);
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username }),
  });

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 409 && data.error === "USERNAME_TAKEN") {
      return { success: false, error: "USERNAME_TAKEN" };
    }
    throw new Error(`API Error ${response.status}: ${data.message || data.error || JSON.stringify(data)}`);
  }

  return { success: true, data };
}

async function updateKeysFile(username, token) {
  let keysData = {};
  
  try {
    const existingContent = await fs.readFile(KEYS_FILE, "utf-8");
    keysData = JSON.parse(existingContent);
  } catch (err) {
    // File doesn't exist or is invalid JSON, start fresh
  }

  keysData.clawpage = {
    ...(keysData.clawpage || {}),
    token,
    apiHost: API_HOST,
    username
  };

  await fs.writeFile(KEYS_FILE, JSON.stringify(keysData, null, 2), "utf-8");
  console.log(`\n\x1b[32m✔ Configuration saved to ${KEYS_FILE}\x1b[0m`);
}

async function main() {
  const customUsername = process.argv[2]; // Optional username from args
  let baseUsername = customUsername || getBaseUsername();
  
  // Clean up base username if provided manually
  baseUsername = baseUsername.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/^-+|-+$/g, "");
  if (baseUsername.length < 6 && !customUsername) {
    baseUsername += "000";
  }

  console.log(`\x1b[36mInitializing Clawpage workspace...\x1b[0m\n`);

  let success = false;
  let attempts = 0;
  let currentUsername = baseUsername;
  let accountData = null;

  while (!success && attempts < MAX_RETRIES) {
    try {
      console.log(`Attempting to register username: \x1b[33m${currentUsername}\x1b[0m`);
      const result = await registerAccount(currentUsername);
      
      if (result.success) {
        success = true;
        accountData = result.data;
        break;
      } else if (result.error === "USERNAME_TAKEN") {
        console.log(`\x1b[31m✘ Username "${currentUsername}" is taken.\x1b[0m`);
        // Append random digits and try again
        currentUsername = `${baseUsername}-${randomDigits()}`;
        attempts++;
      }
    } catch (err) {
      console.error(`\x1b[31m✘ Registration failed:\x1b[0m`, err.message);
      process.exit(1);
    }
  }

  if (!success) {
    console.error(`\n\x1b[31m✘ Failed to register an account after ${MAX_RETRIES} attempts.\x1b[0m`);
    process.exit(1);
  }

  console.log(`\n\x1b[32m✔ Account created successfully!\x1b[0m`);
  console.log(`  Username: \x1b[36m${accountData.username}\x1b[0m`);
  console.log(`  Owner ID: \x1b[90m${accountData.ownerId}\x1b[0m`);
  
  if (accountData.warnings && accountData.warnings.length > 0) {
    console.log(`\n\x1b[33mWarnings:\x1b[0m`);
    for (const w of accountData.warnings) {
      console.log(`  - ${w}`);
    }
  }

  await updateKeysFile(accountData.username, accountData.token);
  
  console.log(`\n\x1b[32m✨ Clawpage workspace is fully initialized and ready to use.\x1b[0m\n`);
}

main().catch(err => {
  console.error("\x1b[31mUnexpected error:\x1b[0m", err);
  process.exit(1);
});
