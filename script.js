// Fetch real-time signing data from Apple's IPSW API
async function fetchSigningData() {
  console.log("Fetching device list from IPSW API...");

  try {
    const response = await fetch('https://api.ipsw.me/v4/devices');
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const devices = await response.json();
    console.log(`Fetched ${devices.length} devices from API.`);
    const signingData = [];

    // Process each device to gather signing status for all versions
    for (const device of devices) {
      const deviceName = device.identifier;
      console.log(`Fetching firmware data for device: ${deviceName}`);

      try {
        const firmwareResponse = await fetch(`https://api.ipsw.me/v4/device/${deviceName}?type=ipsw`);
        if (!firmwareResponse.ok) throw new Error(`HTTP error! Status: ${firmwareResponse.status}`);

        const firmwareData = await firmwareResponse.json();

        console.log(`Device: ${firmwareData.name}, Firmwares found: ${firmwareData.firmwares.length}`);
        firmwareData.firmwares.forEach(firmware => {
          signingData.push({
            device: firmwareData.name,
            iosVersion: firmware.version,
            status: firmware.signed ? 'Signed' : 'Not Signed',
            downloadUrl: firmware.url
          });
        });
      } catch (firmwareError) {
        console.error(`Error fetching firmware data for device ${deviceName}: ${firmwareError.message}`);
      }
    }

    console.log(`Total firmware records processed: ${signingData.length}`);
    return signingData;
  } catch (error) {
    console.error(`Error fetching device list: ${error.message}`);
    return [];
  }
}

// Populate dropdown filters
function populateFilters(data) {
  console.log("Populating dropdown filters...");

  const deviceSet = new Set(data.map(item => item.device));
  const versionSet = new Set(data.map(item => item.iosVersion));

  const deviceSelect = document.getElementById('device');
  const versionSelect = document.getElementById('ios-version');

  deviceSet.forEach(device => {
    const option = document.createElement('option');
    option.value = device;
    option.textContent = device;
    deviceSelect.appendChild(option);
  });

  versionSet.forEach(version => {
    const option = document.createElement('option');
    option.value = version;
    option.textContent = version;
    versionSelect.appendChild(option);
  });

  console.log("Filters populated successfully.");
}

// Render table dynamically
function renderTable(data, deviceFilter, versionFilter) {
  console.log("Rendering table...");

  const tableBody = document.getElementById('status-table');
  tableBody.innerHTML = '';

  const filteredData = data.filter(item =>
    (deviceFilter === 'All' || item.device === deviceFilter) &&
    (versionFilter === 'All' || item.iosVersion === versionFilter)
  );

  if (filteredData.length === 0) {
    console.warn("No data available for the selected filters.");
    const row = document.createElement('tr');
    row.innerHTML = `<td colspan="4" style="text-align: center;">No data available</td>`;
    tableBody.appendChild(row);
    return;
  }

  filteredData.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.device}</td>
      <td>${item.iosVersion}</td>
      <td>${item.status}</td>
      <td>${item.downloadUrl ? `<a href="${item.downloadUrl}" target="_blank">Download</a>` : 'N/A'}</td>
    `;
    tableBody.appendChild(row);
  });

  console.log("Table rendered successfully.");
}

// Initialize the app
async function init() {
  console.log("Initializing app...");

  const data = await fetchSigningData();
  if (data.length === 0) {
    console.error("No data fetched. Check API connection or response structure.");
    return;
  }

  populateFilters(data);

  const deviceSelect = document.getElementById('device');
  const versionSelect = document.getElementById('ios-version');

  renderTable(data, 'All', 'All');

  deviceSelect.addEventListener('change', () =>
    renderTable(data, deviceSelect.value, versionSelect.value)
  );

  versionSelect.addEventListener('change', () =>
    renderTable(data, deviceSelect.value, versionSelect.value)
  );

  console.log("App initialized successfully.");
}

init();
