let scannedItems = [];

function updateItemList() {
  const container = document.getElementById("itemContainer");
  if (scannedItems.length === 0) {
    container.innerHTML = "<p>No items yet</p>";
    return;
  }

  container.innerHTML = "";
  scannedItems.forEach((item, index) => {
    const div = document.createElement("div");
    div.classList.add("item-entry");
    div.innerHTML = `
      <strong>${item["Part Number"]}</strong> - ${item.Description}  
      <br/>Qty: ${item.Quantity}
      <button onclick="removeItem(${index})">🗑️ Remove</button>
    `;
    container.appendChild(div);
  });
}

function removeItem(index) {
  scannedItems.splice(index, 1);
  updateItemList();
}

function searchPart() {
  const query = document.getElementById("searchInput").value.trim();
  if (!query) return;

  const url = `https://script.google.com/macros/s/AKfycbz8BrfLcjAmBAwpkvtV9zIMzxn_gWB0nCI3-3eSRz2B1KFkIaEjJSRks3yQPp3nNalUKA/exec?search=${encodeURIComponent(query)}`;

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
    <p>Sale Price: $${item["Sale Price"] || "N/A"} | Net: $${item.Net || "N/A"}</p>
  `;

  document.getElementById("quantityEntry").classList.remove("hidden");

  container.dataset.part = JSON.stringify(item);
}

function addItemToList() {
  const raw = document.getElementById("partDetails").dataset.part;
  const item = JSON.parse(raw);
  const qty = parseInt(document.getElementById("quantity").value, 10);
  if (isNaN(qty) || qty < 0) return alert("Enter a valid quantity");

  item.Quantity = qty;
  item.Used = !item.Net && !item["Sale Price"];
  item.Unknown = !item["Part Number"] || !item.Description;

  scannedItems.push(item);
  updateItemList();
  document.getElementById("quantity").value = "";
  document.getElementById("searchInput").value = "";
  document.getElementById("quantityEntry").classList.add("hidden");
  document.getElementById("partDetails").classList.add("hidden");
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

  fetch("https://script.google.com/macros/s/AKfycbx-lDG7JRH4fRXG-Asmf7zdGtgchC3Noe_QNWKFcYtnO2T_TbZN4gh65PzUsCADtR4wSQ/exec", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  })
    .then(res => res.json())
    .then(data => {
      if (data.status === "success") {
        alert("✅ Submission successful!");
        scannedItems = [];
        updateItemList();
      } else {
        alert("⚠️ Submission failed: " + data.message);
      }
    })
    .catch(err => {
      console.error("Submission error:", err);
      alert("❌ Submission failed. Check console for details.");
    });
}
