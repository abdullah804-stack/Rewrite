document.getElementById("openApp").addEventListener("click", () => {
  chrome.tabs.create({ url: "https://rewrite-green.vercel.app/quick" });
});