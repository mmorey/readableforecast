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
  showLoadingState();

  (async () => {
    try {
      // Fetch the latest AFD meta objects for the given WFO
      const response = await fetchLatestAFDMetaObjects(wfo);

      if (response instanceof Error) {
        console.error(`Failed to fetch AFDs: ${response.message}`);
        return; // Stop execution if there's an error
      }

      // Fetch the AFD for the given ID
      const afd = await fetchAFD(response[0]["@id"]);

      if (afd instanceof Error) {
        console.error(`Failed to fetch AFD: ${afd.message}`);
        return; // Stop execution if there's an error
      }

      // Render the AFD
      renderAFD(afd);

      // If everything is successful, call `showAFDState()`
      showAFDState();
    } catch (error) {
      console.error(`Error: ${error.message}`);
    }
  })();
}

function showLoadingState() {
  // Show the loading element
  const loadingElement = document.getElementById("loading");
  loadingElement.style.display = "block";

  // Hide the intro element
  const introElement = document.getElementById("intro");
  introElement.style.display = "none";

  // Hide the AFD text element
  const afdTextElement = document.getElementById("afd-text");
  afdTextElement.style.display = "none";
}

function showAFDState() {
  // Hide the loading element
  const loadingElement = document.getElementById("loading");
  loadingElement.style.display = "none";

  // Hide the intro element
  const introElement = document.getElementById("intro");
  introElement.style.display = "none";

  // Hide the AFD text element
  const afdTextElement = document.getElementById("afd-text");
  afdTextElement.style.display = "block";
}

/**
 * Asynchronously fetches the latest Area Forecast Discussion (AFD) metadata objects from the
 * National Weather Service (NWS) API for a given Weather Forecast Office (WFO).
 *
 * @async
 * @param {string} wfo - The code for the Weather Forecast Office (e.g., 'MIA' for Miami) whose AFDs are to be fetched.
 * @returns {Promise<Object[]>} - A promise that resolves to an array of metadata objects for each AFD product available.
 * Each object contains properties like the product's URL, issuance time, and other metadata.
 * In case of an error during the fetch process, the promise is rejected and the error message is logged to the console.
 *
 * @throws Will throw an Error if the response from the NWS API is not OK (status code not in the range 200-299),
 * or if the '@graph' property in the API response is not present, not an array, or an empty array.
 * The error message will contain the HTTP status or a custom message indicating no available AFDs found.
 */
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

/**
 * Asynchronously fetches an Area Forecast Discussion (AFD) from the National Weather Service (NWS) API using a given URL.
 *
 * @async
 * @param {string} afdURL - The URL of the AFD to be fetched.
 * @returns {Promise<Object>} - A promise that resolves to an object representing the fetched AFD data.
 * Each object contains properties like the AFD's text content, product type, issuance time, and other metadata.
 * In case of an error during the fetch process, the promise is rejected and the error message is logged to the console.
 *
 * @throws Will throw an Error if the response from the NWS API is not OK (status code not in the range 200-299).
 * The error message will contain the HTTP status.
 */
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

/**
 * Asynchronously fetches the Weather Forecast Office (WFO) code for a given location from the National Weather Service (NWS) API.
 *
 * @async
 * @param {number} lat - The latitude of the location.
 * @param {number} lon - The longitude of the location.
 * @returns {Promise<string>} - A promise that resolves to a string representing the WFO code for the location.
 * If the WFO code is not in the list of allowed locations, the promise will reject with an error.
 *
 * @throws Will throw an Error if the response from the NWS API is not OK (status code not in the range 200-299).
 * The error message will contain the HTTP status. Will also throw an Error if the fetched WFO is not valid or is not included in the allowed locations.
 */
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

function renderAFD(afd) {
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
    const headingRegex = /^\.([A-Z\s\/]+)\.\.\./i;
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
}
