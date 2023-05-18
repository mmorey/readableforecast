const https = require("https");
const util = require("util");
const fs = require("fs");
const { spawn } = require("child_process");
const path = require("path");
const os = require("os");

// Get the location as an argument
let location = process.argv[2];
if (!location) {
  console.error("Please provide a location.");
  process.exit(1);
}

// Define the API URL
let url = util.format(
  "https://api.weather.gov/products?location=%s&type=AFD",
  location
);

// Function to fetch data from a URL
function fetchData(url) {
  return new Promise((resolve, reject) => {
    https.get(
      url,
      {
        headers: {
          "User-Agent": "Node JS",
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(JSON.parse(data)));
        res.on("error", reject);
      }
    );
  });
}

// Function to check if a file exists
function fileExists(path) {
  try {
    fs.accessSync(path);
    return true;
  } catch {
    return false;
  }
}

// Main function
async function main() {
  let data = await fetchData(url);
  let AFD1_URL = data["@graph"][1]["@id"];
  let AFD2_URL = data["@graph"][0]["@id"];

  let AFD1_TEXT = (await fetchData(AFD1_URL)).productText;
  let AFD2_TEXT = (await fetchData(AFD2_URL)).productText;

  fs.writeFileSync("afd1.txt", AFD1_TEXT);
  fs.writeFileSync("afd2.txt", AFD2_TEXT);

  let ksdiffPath = path.join("/usr", "local", "bin", "ksdiff");
  let diffPath = path.join("/", "usr", "bin", "diff");

  if (fileExists(ksdiffPath)) {
    spawn(ksdiffPath, ["afd1.txt", "afd2.txt"], { stdio: "inherit" });
  } else if (os.platform() === "darwin" && fileExists(diffPath)) {
    spawn(diffPath, ["afd1.txt", "afd2.txt"], { stdio: "inherit" });
  } else {
    console.log("Neither ksdiff nor diff found on this system.");
  }
}

main();
