// Config
const API_URL = "https://script.google.com/macros/s/AKfycbz8BrfLcjAmBAwpkvtV9zIMzxn_gWB0nCI3-3eSRz2B1KFkIaEjJSRks3yQPp3nNalUKA/exec";

let scannedItems = [];
let currentItem = null;

function searchPart() {
  const query = document.getElementById("searchInput").value.trim();
  if (!query) return;

  document.getElementById("partDetails").innerHTML = "<p>Searching...</p>";
  document.getElementById("partDetails").classList.remove("hidden");

  fetch(`${API_URL}?partNumber=${encodeURIComponent(query)}`)
    .then(res => res.json())
    .then(data => {
      if (data.status === "success") {
        currentItem = data.item;
        showPartDetails(currentItem);
      } else {
        handleUnknownPart(query);
      }
    })
    .catch(err => {
      console.error(err);
      handleUnknownPart(query);
    });
}

function handleUnknownPart(query) {
  currentItem = {
    "Part Number": query,
    "Description": "Unknown part",
    "Unknown": true
  };
  showPartDetails(currentItem);
}

function showPartDetails(item) {
  let html = `<strong>${item["Part Number"]}</strong><br>${item.Description || "No description"}`;
  if (item["Image URL"]) {
    html += `<div><img src="${item["Image URL"]}" alt="Image" style="max-width:100%;margin-top:10px;"></div>`;
  }
  if (!item["Net"] && !item["Sale Price"]) {
    html += `<p style='color:red;'>⚠️ No Net or Sale Price found — marked as USED</p>`;
  }
  if (item.Unknown) {
    html += `<p style='color:orange;'>⚠️ Unknown part number</p>`;
  }
  document.getElementById("partDetails").innerHTML = html;
  document.getElementById("quantityEntry").classList.remove("hidden");
}

function addItemToList() {
  const qty = parseInt(document.getElementById("quantity").value);
  if (!qty || qty <= 0) return alert("Enter a valid quantity");

  const existingIndex = scannedItems.findIndex(i => i["Part Number"] === currentItem["Part Number"]);
  if (existingIndex !== -1) {
    const update = confirm("Part already in list. Add to quantity or replace?");
    if (update) {
      scannedItems[existingIndex].Quantity += qty;
    } else {
      scannedItems[existingIndex].Quantity = qty;
    }
  } else {
    scannedItems.push({
      "Part Number": currentItem["Part Number"],
      "Description": currentItem.Description,
      "Used": !currentItem["Net"] && !currentItem["Sale Price"],
      "Unknown": !!currentItem.Unknown,
      "Quantity": qty
    });
  }

  document.getElementById("quantity").value = "";
  document.getElementById("partDetails").innerHTML = "";
  document.getElementById("quantityEntry").classList.add("hidden");
  updateItemList();
}

function updateItemList() {
  const container = document.getElementById("itemContainer");
  if (scannedItems.length === 0) return (container.innerHTML = "No items yet");

  container.innerHTML = scannedItems
    .map(i => {
      let line = `<strong>${i["Part Number"]}</strong> - ${i.Description} (x${i.Quantity})`;
      if (i.Used) line += " <span style='color:red;'>(USED)</span>";
      if (i.Unknown) line += " <span style='color:orange;'>(UNKNOWN)</span>";
      return `<div>${line}</div>`;
    })
    .join("");
}

function submitInventory() {
  const payload = {
    technician: document.getElementById("techName").value.trim(),
    company: document.getElementById("company").value,
    department: document.getElementById("department").value,
    market: document.getElementById("market").value.trim(),
    location: {
      type: document.getElementById("locationType").value,
      tag: document.getElementById("locationTag").value.trim()
    },
    items: scannedItems,
    submittedAt: new Date().toISOString()
  };

  console.log("Submitting...", payload);
  alert("Submission ready — payload printed to console (for now). Real submission coming soon.");
}
