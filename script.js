// Global variables for pagination
let currentPage = 1;
const rowsPerPage = 10;
let currentTab = 'stable'; // Default tab is stable

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

  // Clear and populate dropdowns
  deviceTypeSelect.innerHTML = `<option value="All">All Device Types</option>`;
  deviceSelect.innerHTML = `<option value="All">All Devices</option>`;
  versionSelect.innerHTML = `<option value="All">All Versions</option>`;
  betaSelect.innerHTML = `<option value="All">All Status</option>`;

  deviceTypeSet.forEach(type => {
    deviceTypeSelect.innerHTML += `<option value="${type}">${type}</option>`;
  });

  versionSet.forEach(version => {
    versionSelect.innerHTML += `<option value="${version}">${version}</option>`;
  });

  betaSelect.innerHTML += `<option value="Beta">Beta</option>`;
  betaSelect.innerHTML += `<option value="Stable">Stable</option>`;
}

// Filter data based on selected tab and filters
function filterData(data) {
  return data.filter(item => {
    if (currentTab === 'beta' && item.isBeta === "Stable") return false;
    if (currentTab === 'stable' && item.isBeta === "Beta") return false;
    if (currentTab === 'ota' && item.delayOTA === "Not Delayed") return false;

    return true;
  });
}

// Render the table with filtered data
function renderTable(data, searchQuery, deviceTypeFilter, deviceFilter, versionFilter, betaFilter) {
  const filteredData = filterData(data).filter(item => {
    const matchesSearch = item.device.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.iosVersion.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDeviceType = deviceTypeFilter === "All" || item.deviceType === deviceTypeFilter;
    const matchesDevice = deviceFilter === "All" || item.device === deviceFilter;
    const matchesVersion = versionFilter === "All" || item.iosVersion === versionFilter;
    const matchesBeta = betaFilter === "All" || item.isBeta === betaFilter;

    return matchesDeviceType && matchesDevice && matchesVersion && matchesBeta && matchesSearch;
  });

  const tableBody = document.getElementById("status-table");
  tableBody.innerHTML = "";

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

  updatePagination(filteredData.length);
}

// Update pagination controls
function updatePagination(totalRecords) {
  const totalPages = Math.ceil(totalRecords / rowsPerPage);
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";

  for (let i = 1; i <= totalPages; i++) {
    const button = document.createElement("button");
    button.textContent = i;
    button.classList.add("pagination-btn");
    button.addEventListener("click", () => {
      currentPage = i;
      renderTable(filteredData);
    });
    pagination.appendChild(button);
  }
}

// Tab click event to filter data
function handleTabClick(event) {
  const tabButtons = document.querySelectorAll(".tab-button");
  tabButtons.forEach(button => button.classList.remove("active"));
  event.target.classList.add("active");

  currentTab = event.target.getAttribute("data-tab");
  renderTable(filteredData);
}

// Initialize the application
async function init() {
  const data = await fetchSigningData();
  populateFilters(data);

  const tabButtons = document.querySelectorAll(".tab-button");
  tabButtons.forEach(button => button.addEventListener("click", handleTabClick));

  renderTable(data);
}

// Start the app
init();
