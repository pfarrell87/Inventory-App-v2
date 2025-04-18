// Inventory App - v2

const SEARCH_ENDPOINT = "https://script.google.com/macros/s/AKfycbz8BrfLcjAmBAwpkvtV9zIMzxn_gWB0nCI3-3eSRz2B1KFkIaEjJSRks3yQPp3nNalUKA/exec";
const SUBMIT_ENDPOINT = "https://script.google.com/macros/s/AKfycbz8BrfLcjAmBAwpkvtV9zIMzxn_gWB0nCI3-3eSRz2B1KFkIaEjJSRks3yQPp3nNalUKA/exec";

let scannedItems = [];

function searchPart() {
  const query = document.getElementById("searchInput").value.trim();
  if (!query) return;

  const url = `${SEARCH_ENDPOINT}?search=${encodeURIComponent(query)}`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      if (data.status === "success") {
        showPart(data.item);
      } else {
        alert("❌ No match found");
        document.getElementById("partDetails").classList.add("hidden");
        document.getElementById("quantityEntry").classList.add("hidden");
      }
    })
    .catch(err => {
      alert("Error searching part: " + err.message);
    });
}

function showPart(item) {
  const container = document.getElementById("partDetails");
  container.classList.remove("hidden");

  container.innerHTML = `
    <h3>${item["Part Number"]}</h3>
    <p><strong>${item.Manufacturer}</strong></p>
    <p>${item.Description}</p>
    <p>Category: ${item.Category}</p>
    <p>Net: ${item.Net || "N/A"} | Sell: ${item["Sale Price"] || "N/A"}</p>
  `;

  document.getElementById("quantityEntry").classList.remove("hidden");
  document.getElementById("quantityInput").focus();
  container.dataset.currentItem = JSON.stringify(item);
}

function addCurrentItem() {
  const quantity = parseInt(document.getElementById("quantityInput").value, 10);
  if (!quantity || quantity <= 0) return;

  const currentItem = JSON.parse(document.getElementById("partDetails").dataset.currentItem);
  scannedItems.push({
    "Part Number": currentItem["Part Number"],
    Description: currentItem.Description,
    Quantity: quantity,
    Used: !currentItem.Net || !currentItem["Sale Price"],
    Unknown: !currentItem["Part Number"] || !currentItem.Description
  });

  updateItemList();
  document.getElementById("quantityInput").value = "";
  document.getElementById("partDetails").classList.add("hidden");
  document.getElementById("quantityEntry").classList.add("hidden");
}

function updateItemList() {
  const container = document.getElementById("itemsContainer");
  container.innerHTML = "";

  scannedItems.forEach((item, index) => {
    const div = document.createElement("div");
    div.innerHTML = `
      <strong>${item["Part Number"]}</strong> - ${item.Description}<br>
      Qty: ${item.Quantity}
      <button onclick="removeItem(${index})">🗑 Remove</button>
    `;
    container.appendChild(div);
  });
}

function removeItem(index) {
  scannedItems.splice(index, 1);
  updateItemList();
}

function submitInventory() {
  const technician = document.getElementById("technician").value.trim();
  const company = document.getElementById("company").value;
  const department = document.getElementById("department").value;
  const market = document.getElementById("market").value;
  const locationType = document.getElementById("locationType").value;
  const locationTag = document.getElementById("locationTag").value.trim();

  if (!technician || !market || !department || !company || !locationType || !locationTag || scannedItems.length === 0) {
    alert("Please complete all fields and add at least one item.");
    return;
  }

  const payload = {
    technician,
    company,
    department,
    market,
    location: {
      type: locationType,
      tag: locationTag
    },
    items: scannedItems
  };

  fetch(SUBMIT_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  })
    .then(res => res.json())
    .then(data => {
      if (data.status === "success") {
        alert(`✅ Submitted ${data.received} items successfully`);
        scannedItems = [];
        updateItemList();
      } else {
        console.error("Error:", data);
        alert("❌ Submission failed. Check console for details.");
      }
    })
    .catch(err => {
      console.error("Submission error:", err);
      alert("❌ Error submitting inventory: " + err.message);
    });
}
