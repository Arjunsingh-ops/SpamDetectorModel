const analyzeBtn = document.getElementById("analyzeBtn");

const result = document.getElementById("result");
const resultIcon = document.getElementById("resultIcon");
const classification = document.getElementById("classification");
const confidence = document.getElementById("confidence");
const reason = document.getElementById("reason");
const reports = document.getElementById("reports");
const reportsBox = document.getElementById("reportsBox");

analyzeBtn.addEventListener("click", async () => {

    const phone = document.getElementById("phone").value.trim();
    const conversation = document.getElementById("conversation").value.trim();
    const language = document.getElementById("language").value;

    if (!phone || !conversation) {
        alert("Please enter both the phone number and conversation.");
        return;
    }

    analyzeBtn.disabled = true;
    analyzeBtn.textContent = "Analyzing...";

    try {

        const response = await fetch("http://127.0.0.1:8000/predict", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                phone_number: phone,
                conversation: conversation,
                language: language
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "API request failed");
        }

        showResult(data);

    } catch (error) {

        alert("Could not connect to the Spam Call Detector API.\n\nMake sure FastAPI is running.");

        console.error(error);

    } finally {

        analyzeBtn.disabled = false;
        analyzeBtn.textContent = "🔍 Analyze Call";
    }
});


function showResult(data) {

    result.classList.remove("hidden", "spam", "normal");

    const isSpam = data.classification === "SPAM / SCAM";

    if (isSpam) {

        result.classList.add("spam");

        resultIcon.textContent = "🚨";
        classification.textContent = "SPAM / SCAM";

    } else {

        result.classList.add("normal");

        resultIcon.textContent = "🛡️";
        classification.textContent = "NORMAL";
    }

    confidence.textContent =
        Math.round(data.confidence * 100) + "%";

    reason.textContent = data.reason;

    if (data.reports !== undefined) {

        reportsBox.style.display = "block";
        reports.textContent = data.reports;

    } else {

        reportsBox.style.display = "none";
    }
}