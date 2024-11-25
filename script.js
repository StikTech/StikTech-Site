// Fetch signing data from the IPSW API
async function fetchSigningData() {
  const spinner = document.getElementById("loading-spinner");
  const noDataMessage = document.getElementById("no-data-message");

  // Show the loading spinner while fetching data
  spinner.classList.remove("hidden");
  noDataMessage.classList.add("hidden");

  try {
    const response = await fetch("https://api.ipsw.me/v4/devices");
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const devices = await response.json();
    const signingData = [];

    for (const device of devices) {
      try {
        const firmwareResponse = await fetch(
          `https://api.ipsw.me/v4/device/${device.identifier}?type=ipsw`
        );
        if (!firmwareResponse.ok)
          throw new Error(`HTTP error! Status: ${firmwareResponse.status}`);

        const firmwareData = await firmwareResponse.json();

        firmwareData.firmwares.forEach(firmware => {
          signingData.push({
            device: firmwareData.name,
            iosVersion: firmware.version,
            status: firmware.signed ? "Signed" : "Not Signed",
            downloadUrl: firmware.url,
          });
        });
      } catch (firmwareError) {
        console.error(
          `Error fetching firmware data for device ${device.identifier}: ${firmwareError.message}`
        );
      }
    }

    return signingData;
  } catch (error) {
    console.error(`Error fetching device list: ${error.message}`);
    noDataMessage.textContent = "Failed to load data. Please try again later.";
    noDataMessage.classList.remove("hidden");
    return [];
  } finally {
    spinner.classList.add("hidden");
  }
}

// Populate dropdown filters
function populateFilters(data) {
  const deviceSelect = document.getElementById("device");
  const versionSelect = document.getElementById("ios-version");

  const deviceSet = new Set(data.map(item => item.device));
  const versionSet = new Set(data.map(item => item.iosVersion));

  // Clear and repopulate dropdowns
  deviceSelect.innerHTML = `<option value="All">All Devices</option>`;
  versionSelect.innerHTML = `<option value="All">All Versions</option>`;

  deviceSet.forEach(device => {
    const option = document.createElement("option");
    option.value = device;
    option.textContent = device;
    deviceSelect.appendChild(option);
  });

  versionSet.forEach(version => {
    const option = document.createElement("option");
    option.value = version;
    option.textContent = version;
    versionSelect.appendChild(option);
  });
}

// Render the table based on data and filters
function renderTable(data, searchQuery = "", deviceFilter = "All", versionFilter = "All") {
  const tableBody = document.getElementById("status-table");
  const noDataMessage = document.getElementById("no-data-message");

  tableBody.innerHTML = ""; // Clear table
  noDataMessage.classList.add("hidden"); // Hide no-data message

  // Filter data based on search and dropdowns
  const filteredData = data.filter(item => {
    const matchesDevice = deviceFilter === "All" || item.device === deviceFilter;
    const matchesVersion = versionFilter === "All" || item.iosVersion === versionFilter;
    const matchesSearch =
      !searchQuery ||
      item.device.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.iosVersion.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDevice && matchesVersion && matchesSearch;
  });

  if (filteredData.length === 0) {
    noDataMessage.textContent = "No results found. Try a different filter or search.";
    noDataMessage.classList.remove("hidden");
    return;
  }

  // Populate table with filtered data
  filteredData.forEach(item => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.device}</td>
      <td>${item.iosVersion}</td>
      <td>${item.status}</td>
      <td>${item.downloadUrl ? `<a href="${item.downloadUrl}" target="_blank">Download</a>` : "N/A"}</td>
    `;
    tableBody.appendChild(row);
  });
}

// Initialize the application
async function init() {
  console.log("Initializing application...");
  const data = await fetchSigningData();

  if (data.length === 0) {
    console.error("No data fetched. Check API connection or response structure.");
    return;
  }

  populateFilters(data);
  renderTable(data);

  // Event listeners for search and dropdown filters
  const searchBar = document.getElementById("search-bar");
  const deviceSelect = document.getElementById("device");
  const versionSelect = document.getElementById("ios-version");

  searchBar.addEventListener("input", () =>
    renderTable(data, searchBar.value, deviceSelect.value, versionSelect.value)
  );

  deviceSelect.addEventListener("change", () =>
    renderTable(data, searchBar.value, deviceSelect.value, versionSelect.value)
  );

  versionSelect.addEventListener("change", () =>
    renderTable(data, searchBar.value, deviceSelect.value, versionSelect.value)
  );

  console.log("Application initialized successfully.");
}

// Start the app
init();
