// Global Constants

// List of allowed Weather Forecast Offices (WFO)
const allowedLocations = [
  "AKQ",
  "ALY",
  "BGM",
  "BOX",
  "BTV",
  "BUF",
  "CAE",
  "CAR",
  "CHS",
  "CLE",
  "CTP",
  "GSP",
  "GYX",
  "ILM",
  "ILN",
  "LWX",
  "MHX",
  "OKX",
  "PBZ",
  "PHI",
  "RAH",
  "RLX",
  "RNK",
  "ABQ",
  "AMA",
  "BMX",
  "BRO",
  "CRP",
  "EPZ",
  "EWX",
  "FFC",
  "FWD",
  "HGX",
  "HUN",
  "JAN",
  "JAX",
  "KEY",
  "LCH",
  "LIX",
  "LUB",
  "LZK",
  "MAF",
  "MEG",
  "MFL",
  "MLB",
  "MOB",
  "MRX",
  "OHX",
  "OUN",
  "SHV",
  "SJT",
  "SJU",
  "TAE",
  "TBW",
  "TSA",
  "ABR",
  "APX",
  "ARX",
  "BIS",
  "BOU",
  "CYS",
  "DDC",
  "DLH",
  "DMX",
  "DTX",
  "DVN",
  "EAX",
  "FGF",
  "FSD",
  "GID",
  "GJT",
  "GLD",
  "GRB",
  "GRR",
  "ICT",
  "ILX",
  "IND",
  "IWX",
  "JKL",
  "LBF",
  "LMK",
  "LOT",
  "LSX",
  "MKX",
  "MPX",
  "MQT",
  "OAX",
  "PAH",
  "PUB",
  "RIW",
  "SGF",
  "TOP",
  "UNR",
  "BOI",
  "BYZ",
  "EKA",
  "FGZ",
  "GGW",
  "HNX",
  "LKN",
  "LOX",
  "MFR",
  "MSO",
  "MTR",
  "OTX",
  "PDT",
  "PIH",
  "PQR",
  "PSR",
  "REV",
  "SEW",
  "SGX",
  "SLC",
  "STO",
  "TFX",
  "TWC",
  "VEF",
  "AER",
  "AFC",
  "AFG",
  "AJK",
  "ALU",
  "GUM",
  "HPA",
  "HFO",
  "PPG",
  "STU",
  "NH1",
  "NH2",
  "ONA",
  "ONP",
];

const headers = {
  headers: {
    "User-Agent": "readableforecast.com",
  },
};

// End Global Constants

// Get the parameters from the URL
const urlParams = new URLSearchParams(window.location.search);

// Check if the theme query parameter is set to 'light' or 'dark'
var theme = urlParams.get("theme");
if (theme === "light") {
  document.body.classList.add("light-theme");
} else if (theme === "dark") {
  document.body.classList.add("dark-theme");
}

// Handle location change via the select element
const locationSelect = document.getElementById("location-select");
locationSelect.addEventListener("change", (event) => {
  const newLocation = event.target.value;
  window.location.search = `?wfo=${newLocation}`;
});

// Handle location change via the location button
const locationButton = document.getElementById("location-button");
locationButton.addEventListener("click", (event) => {
  navigator.geolocation.getCurrentPosition((position) => {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    fetchWFOFromLocation(lat, lon).then((wfo) => {
      if (wfo instanceof Error) {
        console.error(`Failed to fetch WFO: ${wfo.message}`);
      } else {
        window.location.search = `?wfo=${wfo}`;
      }
    });
  });
});

// Get the NWS Weather Forecast Office from the URL Parameters
const wfo = urlParams.get("wfo");

// Check if the wfo query parameter is set and in the allowed list
if (wfo && allowedLocations.includes(wfo.toUpperCase())) {
  // Show the loading element
  const loadingElement = document.getElementById("loading");
  loadingElement.style.display = "block";

  // If the provided location is valid, set the location to the query value
  fetchLatestAFDMetaObjects(wfo)
    .then((response) => {
      if (response instanceof Error) {
        console.error(`Failed to fetch AFDs: ${response.message}`);
      } else {
        return fetchAFD(response[0]["@id"]);
      }
    })
    .then((afd) => {
      if (afd instanceof Error) {
        console.error(`Failed to fetch AFD: ${afd.message}`);
      } else {
        return renderAFD(afd);
      }
    });
}

// This code fetches the most recent AFDs from the NWS API (https://api.weather.gov/products/types/AFD/locations/)
// and returns them as an array
async function fetchLatestAFDMetaObjects(wfo) {
  try {
    const response = await fetch(
      `https://api.weather.gov/products/types/AFD/locations/${wfo}`,
      headers
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const avaiableAFDs = data["@graph"];

    // Check if the '@graph' property is not present, empty, or not an array
    if (
      !avaiableAFDs ||
      !Array.isArray(avaiableAFDs) ||
      avaiableAFDs.length === 0
    ) {
      throw new Error("No available AFDs found");
    }

    return avaiableAFDs;
  } catch (error) {
    console.error(`Failed to fetch AFDs: ${error.message}`);
    return error;
  }
}

// fetchAFD is an async function that fetches the AFD for a given URL.
// It returns the AFD as JSON.
async function fetchAFD(afdURL) {
  try {
    const response = await fetch(afdURL, headers);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Failed to fetch AFD: ${error.message}`);
    return error;
  }
}

// Function to fetch WFO based on geolocation coordinates
async function fetchWFOFromLocation(lat, lon) {
  try {
    const response = await fetch(
      `https://api.weather.gov/points/${lat},${lon}`,
      headers
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const wfo = data.properties.cwa;

    if (!wfo || !allowedLocations.includes(wfo.toUpperCase())) {
      throw new Error("No valid WFO found");
    }
    return wfo;
  } catch (error) {
    console.error(`Failed to fetch WFO: ${error.message}`);
    return error;
  }
}

/**
 * Creates an HTML element, adds a text node to it, and appends it to the specified container element
 * @param {string} tag - HTML tag name for the element to be created
 * @param {string} text - Text to be added as a text node to the created element
 * @param {HTMLElement} container - HTML element to which the created element will be appended
 */
function createAndAppendElement(tag, text, container) {
  const element = document.createElement(tag); // create the specified HTML element
  element.textContent = text; // add text node to created element using the specified text
  container.appendChild(element); // append created element to specified container element
}

// Hides the intro div
function hideIntro() {
  const intro = document.getElementById("intro");
  intro.style.display = "none";
}

function renderAFD(afd) {
  hideIntro();

  const container = document.getElementById("afd-text");
  const productText = afd.productText;

  if (!container || !productText) {
    console.error("Invalid input");
    return;
  }

  // We are processing the AFD line by line
  const lines = productText.split("\n");
  // console.log(lines);

  let currentParagraphContent = "";
  let currentPreContent = "";

  lines.splice(0, 8); // Removes the first 8 lines as this is unnecessary information

  for (let line of lines) {
    // If we have a line with "&&", we have reached the end of the section
    // so we can skip it
    const nwsSectionEnding = line.match(/^&&$/);
    if (nwsSectionEnding) {
      continue;
    }

    // If the currentPreContent is not empty or we detected a new pre block we are in
    // a preformatted section
    if (/\s{2,}/.test(line) && /\d/.test(line)) {
      currentPreContent += line + "\n";
      continue;
    } else if (currentPreContent.length > 0) {
      createAndAppendElement("pre", currentPreContent, container);
      currentPreContent = "";
      continue;
    }

    // Headings are of the format .HEADING...
    const headingRegex = /^\.([A-Z\s\/]+)\.\.\./;
    const match = line.match(headingRegex);

    // If we have a heading match or we have an empty line, we need to create a new
    // paragraph and reset the currentParagraphContent
    if (match || line.length === 0) {
      createAndAppendElement("p", currentParagraphContent, container);
      currentParagraphContent = "";
    }

    // If we have a heading match, we need to create a new heading
    if (match) {
      createAndAppendElement("h2", match[1].trim(), container);
      line = line.replace(headingRegex, ""); // remove the heading part from the section
    }

    // Append the current line to the current paragraph content
    currentParagraphContent += line + " ";
  }

  // Get the issuance time value from the JSON
  const forecastTime = afd.issuanceTime;
  const localTime = new Date(forecastTime).toLocaleString("en-US");

  const timeParagraph = document.createElement("p");
  timeParagraph.classList.add("time");
  const locationLink = document.createElement("a");
  locationLink.href = `https://www.weather.gov/${wfo}/`;
  locationLink.textContent = wfo.toUpperCase();
  locationLink.target = "_blank";
  timeParagraph.appendChild(
    document.createTextNode("Area forecast discussion issued by ")
  );
  timeParagraph.appendChild(locationLink);
  timeParagraph.appendChild(document.createTextNode(` at ${localTime}.`));
  header.appendChild(timeParagraph);

  // Remove the loading element
  const loadingElement = document.getElementById("loading");
  loadingElement.style.display = "none";
}
