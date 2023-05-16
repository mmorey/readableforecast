// Get the query parameters from the URL
const urlParams = new URLSearchParams(window.location.search);

// Check if a 'theme' query parameter is set to 'light'
if (urlParams.get("theme") === "light") {
  document.body.classList.add("light-theme"); // If it is, add a 'light-theme' class to the body
}

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

// Get the location from the URL
const wfo = urlParams.get("location") || "SGX"; // default to 'SGX' if no query parameter is provided

// Check if the provided location is in the allowed list
if (!allowedLocations.includes(wfo.toUpperCase())) {
  // If the provided location is not valid, you could redirect the user to a default location or display an error message
  console.error(`Invalid location: ${wfo}`);
  // For example, default to 'SGX'
  wfo = "SGX";
}

// Get the location select element
const locationSelect = document.getElementById("location-select");

// Populate the select element with the allowed locations
allowedLocations.forEach((location) => {
  const option = document.createElement("option");
  option.value = location;
  option.text = location;
  locationSelect.appendChild(option);
});

// Set the selected option to the current location
locationSelect.value = wfo;

// Handle location change
locationSelect.addEventListener("change", (event) => {
  const newLocation = event.target.value;
  // Refresh the page with the new location as a query parameter
  window.location.search = `?location=${newLocation}`;
});

// get the list of area forecast discussions for the given NWS Office
fetch(`https://api.weather.gov/products/types/AFD/locations/${wfo}`)
  .then((response) => response.json())

  // now let's parse the JSON and get the most recent one
  .then((data) => {
    const mostRecentAFDUrl = data["@graph"][0]["@id"];
    fetch(mostRecentAFDUrl)
      .then((response) => response.text())
      .then((text) => {
        // the JSON delivers the text of the discussion in a productText key as a single long paragraph with /n line breaks. I want to clean that up and create headings that I can style.
        const productText = JSON.parse(text).productText;

        // Some NWS notes come ahead of the first Synopsis heading. I'm going to use regex to grab that.
        const [preSynopsisText, ...restText] = productText.split("SYNOPSIS");

        // I also want to split the text by lines starting with '&&'
        const sections = restText.join("SYNOPSIS").split(/\n(?=&&)/);

        // Create the HTML containers
        const container = document.getElementById("afd-text");
        const header = document.getElementById("header");

        // Add pre-synopsis text as a paragraph so I can later remove it
        const preSynopsisParagraph = document.createElement("p");
        preSynopsisParagraph.classList.add("pre-synopsis");
        preSynopsisParagraph.textContent = preSynopsisText.trim();
        header.appendChild(preSynopsisParagraph);

        // Add Synopsis as the first heading
        const synopsisHeading = document.createElement("h2");
        synopsisHeading.textContent = "SYNOPSIS";
        container.appendChild(synopsisHeading);

        for (let section of sections) {
          const match = /&&\s*\.?(.+?)\.\.\./.exec(section); // extract text between '&&' (with optional '.') and '...'
          if (match) {
            const heading = document.createElement("h2");
            heading.textContent = match[1].trim(); // use the extracted text as the heading
            container.appendChild(heading);
            section = section.replace(/&&\s*\.?.+?\.\.\./, "").trim(); // remove the heading part from the section
          }
          const content = document.createElement("p");
          content.textContent = section.trim();
          container.appendChild(content);
        }

        // Get the issuance time value from the JSON
        const forecastTime = JSON.parse(text).issuanceTime;
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
      });
  });
