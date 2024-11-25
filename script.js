// Fetch signing data from the IPSW API
async function fetchSigningData() {
  const spinner = document.getElementById("loading-spinner");
  const noDataMessage = document.getElementById("no-data-message");

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
            deviceType: firmwareData.identifier.split(",")[0], // Use identifier for type grouping
            iosVersion: firmware.version,
            status: firmware.signed ? "Signed" : "Not Signed",
            downloadUrl: firmware.url,
            isBeta: firmware.beta ? "Beta" : "Stable", // Check for beta firmware
            delayOTA: firmware.delay_ota ? "Delayed" : "Not Delayed", // Check if OTA profile is delayed
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
  const deviceTypeSelect = document.getElementById("device-type");
  const deviceSelect = document.getElementById("device");
  const versionSelect = document.getElementById("ios-version");
  const betaSelect = document.getElementById("beta-status");

  const deviceTypeSet = new Set(data.map(item => item.deviceType));
  const versionSet = new Set(data.map(item => item.iosVersion));
  const betaSet = new Set(data.map(item => item.isBeta));

  // Clear and populate dropdowns
  deviceTypeSelect.innerHTML = `<option value="All">All Device Types</option>`;
  deviceSelect.innerHTML = `<option value="All">All Devices</option>`;
  versionSelect.innerHTML = `<option value="All">All Versions</option>`;
  betaSelect.innerHTML = `<option value="All">All Status</option>`;

  deviceTypeSet.forEach(type => {
    const option = document.createElement("option");
    option.value = type;
    option.textContent = type;
    deviceTypeSelect.appendChild(option);
  });

  versionSet.forEach(version => {
    const option = document.createElement("option");
    option.value = version;
    option.textContent = version;
    versionSelect.appendChild(option);
  });

  betaSet.forEach(beta => {
    const option = document.createElement("option");
    option.value = beta;
    option.textContent = beta;
    betaSelect.appendChild(option);
  });
}

// Update devices dropdown based on the selected device type
function updateDeviceDropdown(data, selectedType) {
  const deviceSelect = document.getElementById("device");
  deviceSelect.innerHTML = `<option value="All">All Devices</option>`;

  const filteredDevices = new Set(
    data
      .filter(item => selectedType === "All" || item.deviceType === selectedType)
      .map(item => item.device)
  );

  filteredDevices.forEach(device => {
    const option = document.createElement("option");
    option.value = device;
    option.textContent = device;
    deviceSelect.appendChild(option);
  });
}

// Render the table based on data and filters
function renderTable(data, searchQuery = "", deviceTypeFilter = "All", deviceFilter = "All", versionFilter = "All", betaFilter = "All") {
  const tableBody = document.getElementById("status-table");
  const noDataMessage = document.getElementById("no-data-message");

  tableBody.innerHTML = ""; // Clear table
  noDataMessage.classList.add("hidden");

  const filteredData = data.filter(item => {
    const matchesDeviceType =
      deviceTypeFilter === "All" || item.deviceType === deviceTypeFilter;
    const matchesDevice = deviceFilter === "All" || item.device === deviceFilter;
    const matchesVersion = versionFilter === "All" || item.iosVersion === versionFilter;
    const matchesBeta = betaFilter === "All" || item.isBeta === betaFilter;
    const matchesSearch =
      !searchQuery ||
      item.device.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.iosVersion.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDeviceType && matchesDevice && matchesVersion && matchesBeta && matchesSearch;
  });

  if (filteredData.length === 0) {
    noDataMessage.textContent = "No results found. Try a different filter or search.";
    noDataMessage.classList.remove("hidden");
    return;
  }

  filteredData.forEach(item => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.device}</td>
      <td>${item.iosVersion}</td>
      <td>${item.status}</td>
      <td>${item.isBeta}</td>
      <td>${item.delayOTA}</td>
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

  // Event listeners for filtering
  const searchBar = document.getElementById("search-bar");
  const deviceTypeSelect = document.getElementById("device-type");
  const deviceSelect = document.getElementById("device");
  const versionSelect = document.getElementById("ios-version");
  const betaSelect = document.getElementById("beta-status");

  searchBar.addEventListener("input", () =>
    renderTable(
      data,
      searchBar.value,
      deviceTypeSelect.value,
      deviceSelect.value,
      versionSelect.value,
      betaSelect.value
    )
  );

  deviceTypeSelect.addEventListener("change", () => {
    updateDeviceDropdown(data, deviceTypeSelect.value);
    renderTable(
      data,
      searchBar.value,
      deviceTypeSelect.value,
      deviceSelect.value,
      versionSelect.value,
      betaSelect.value
    );
  });

  deviceSelect.addEventListener("change", () =>
    renderTable(
      data,
      searchBar.value,
      deviceTypeSelect.value,
      deviceSelect.value,
      versionSelect.value,
      betaSelect.value
    )
  );

  versionSelect.addEventListener("change", () =>
    renderTable(
      data,
      searchBar.value,
      deviceTypeSelect.value,
      deviceSelect.value,
      versionSelect.value,
      betaSelect.value
    )
  );

  betaSelect.addEventListener("change", () =>
    renderTable(
      data,
      searchBar.value,
      deviceTypeSelect.value,
      deviceSelect.value,
      versionSelect.value,
      betaSelect.value
    )
  );

  console.log("Application initialized successfully.");
}

// Start the app
init();
