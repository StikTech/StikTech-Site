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

  const deviceTypeSet = new Set(data.map(item => item.deviceType));
  const versionSet = new Set(data.map(item => item.iosVersion));

  // Clear and populate dropdowns
  deviceTypeSelect.innerHTML = `<option value="All">All Device Types</option>`;
  deviceSelect.innerHTML = `<option value="All">All Devices</option>`;
  versionSelect.innerHTML = `<option value="All">All Versions</option>`;

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

// Render the data table
function renderTable(data, searchTerm, selectedDeviceType, selectedDevice, selectedVersion) {
  const tableBody = document.getElementById("status-table");
  tableBody.innerHTML = "";

  const filteredData = data.filter(item => {
    return (
      (selectedDeviceType === "All" || item.deviceType === selectedDeviceType) &&
      (selectedDevice === "All" || item.device === selectedDevice) &&
      (selectedVersion === "All" || item.iosVersion === selectedVersion) &&
      (item.device.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.iosVersion.includes(searchTerm))
    );
  });

  if (filteredData.length === 0) {
    document.getElementById("no-data-message").classList.remove("hidden");
    return;
  }

  filteredData.forEach(item => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${item.device}</td>
      <td>${item.iosVersion}</td>
      <td>${item.status}</td>
      <td><a href="${item.downloadUrl}" target="_blank">Download</a></td>
    `;

    tableBody.appendChild(row);
  });
}

// Initialize the app
async function init() {
  const data = await fetchSigningData();
  populateFilters(data);
  updateDeviceDropdown(data, "All");

  const searchBar = document.getElementById("search-bar");
  const deviceTypeSelect = document.getElementById("device-type");
  const deviceSelect = document.getElementById("device");
  const versionSelect = document.getElementById("ios-version");

  searchBar.addEventListener("input", () =>
    renderTable(data, searchBar.value, deviceTypeSelect.value, deviceSelect.value, versionSelect.value)
  );

  deviceTypeSelect.addEventListener("change", () => {
    updateDeviceDropdown(data, deviceTypeSelect.value);
    renderTable(data, searchBar.value, deviceTypeSelect.value, deviceSelect.value, versionSelect.value);
  });

  deviceSelect.addEventListener("change", () =>
    renderTable(data, searchBar.value, deviceTypeSelect.value, deviceSelect.value, versionSelect.value)
  );

  versionSelect.addEventListener("change", () =>
    renderTable(data, searchBar.value, deviceTypeSelect.value, deviceSelect.value, versionSelect.value)
  );

  console.log("Application initialized successfully.");
}

// Show privacy policy modal
document.getElementById("privacy-policy-btn").addEventListener("click", () => {
  document.getElementById("privacy-policy-modal").classList.remove("hidden");
});

// Close privacy policy modal
document.getElementById("close-btn").addEventListener("click", () => {
  document.getElementById("privacy-policy-modal").classList.add("hidden");
});

// Start the app
init();
