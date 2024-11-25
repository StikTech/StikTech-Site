// Fetch real-time signing data from Apple's IPSW API
async function fetchSigningData() {
  const response = await fetch('https://api.ipsw.me/v4/devices');
  const devices = await response.json();
  const signingData = [];

  // Process each device to gather signing status for all versions
  for (const device of devices) {
    const deviceName = device.identifier;

    // Fetch firmware info for the device
    const firmwareResponse = await fetch(`https://api.ipsw.me/v4/device/${deviceName}?type=ipsw`);
    const firmwareData = await firmwareResponse.json();

    firmwareData.firmwares.forEach(firmware => {
      signingData.push({
        device: firmwareData.name,
        iosVersion: firmware.version,
        status: firmware.signed ? 'Signed' : 'Not Signed',
        downloadUrl: firmware.url
      });
    });
  }
  return signingData;
}

// Populate dropdown filters
function populateFilters(data) {
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
}

// Render table dynamically
function renderTable(data, deviceFilter, versionFilter) {
  const tableBody = document.getElementById('status-table');
  tableBody.innerHTML = '';

  const filteredData = data.filter(item =>
    (deviceFilter === 'All' || item.device === deviceFilter) &&
    (versionFilter === 'All' || item.iosVersion === versionFilter)
  );

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
}

// Initialize the app
async function init() {
  const data = await fetchSigningData();
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
}

init();
