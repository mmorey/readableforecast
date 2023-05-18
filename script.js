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

// Hides the intro div
function hideIntro() {
  const intro = document.getElementById("intro");
  intro.style.display = "none";
}

function renderAFD(afd) {
  hideIntro();

  const productText = afd.productText;

  const cleanedText = productText
    .replace(/^(.*\n){4}/, "")
    .replace(/Area Forecast Discussion/, "")
    .replace(/National Weather Service.*\n.*\n.*\n/, "");

  const container = document.getElementById("afd-text");
  const sections = cleanedText.split(/\n(?=&&|\.[A-Z]+\.\.\.)/);

  for (let section of sections) {
    console.log(section);

    section = section.replace("&&", "").trim(); // remove the "&&" from the section

    const headingRegex = /^\.([A-Z\s]+)\.\.\./gm; // regex to match the heading

    for (const match of section.matchAll(headingRegex)) {
      const heading = document.createElement("h2");
      heading.textContent = match[1].trim(); // use the extracted text as the heading
      container.appendChild(heading);
      section = section.replace(/\.([A-Z\s]+)\.\.\./gm, "").trim(); // remove the heading part from the section
    }

    const content = document.createElement("p");
    content.textContent = section.trim();
    container.appendChild(content);
  }

  // Get the issuance time value from the JSON
  const forecastTime = afd.issuanceTime;
  const localTime = new Date(forecastTime).toLocaleString("en-US");

  // Wrap the time in a paragraph
  const timeParagraph = document.createElement("p");

  // Add a class for styling
  timeParagraph.classList.add("time");

  // Write the header
  // Create a link element
  const locationLink = document.createElement("a");

  // Set the link's destination
  locationLink.href = `https://www.weather.gov/${wfo}/`;

  // Set the link's text
  locationLink.textContent = wfo;

  // Set the link's target to open in a new tab
  locationLink.target = "_blank";

  // Add the text and link to the paragraph
  timeParagraph.appendChild(
    document.createTextNode("Area forecast discussion issued by ")
  );
  timeParagraph.appendChild(locationLink);
  timeParagraph.appendChild(document.createTextNode(` at ${localTime}.`));

  // Append to the header element
  header.appendChild(timeParagraph);

  // Remove the loading element
  const loadingElement = document.getElementById("loading");
  loadingElement.style.display = "none";
}
