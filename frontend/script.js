const analysisArea = document.getElementById("analysisArea");

const phoneInput = document.getElementById("phone");
const conversationInput = document.getElementById("conversation");
const languageInput = document.getElementById("language");

const analyzeBtn = document.getElementById("analyzeBtn");

const result = document.getElementById("result");
const resultIcon = document.getElementById("resultIcon");
const classification = document.getElementById("classification");
const confidence = document.getElementById("confidence");
const reason = document.getElementById("reason");
const details = document.getElementById("details");
const detailsBox = document.getElementById("detailsBox");
const reports = document.getElementById("reports");
const reportsBox = document.getElementById("reportsBox");

// Show the main page immediately
analysisArea.classList.remove("hidden");


analyzeBtn.addEventListener("click", async () => {

    const phone = phoneInput.value.trim();
    const conversation = conversationInput.value.trim();
    const language = languageInput.value;

    if (!phone || !conversation) {
        alert("Please enter both the phone number and conversation.");
        return;
    }

    analyzeBtn.disabled = true;
    analyzeBtn.textContent = "Analyzing...";

    try {

        const response = await fetch(
            "http://127.0.0.1:8000/predict",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    phone_number: phone,
                    conversation: conversation,
                    language: language
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.detail || "API request failed"
            );
        }

        showResult(data);

    } catch (error) {

        console.error(error);

        alert(
            "Could not connect to the Spam Call Detector API.\n\n" +
            "Make sure FastAPI is running."
        );

    } finally {

        analyzeBtn.disabled = false;
        analyzeBtn.textContent = "🔍 Analyze Call";

    }

});
const showFlaggedBtn = document.getElementById("showFlaggedBtn");
const flaggedNumbers = document.getElementById("flaggedNumbers");

showFlaggedBtn.addEventListener("click", async () => {
    if (!flaggedNumbers.classList.contains("hidden")) {
        flaggedNumbers.classList.add("hidden");
        showFlaggedBtn.textContent = "🚩 Show Flagged Numbers";
        return;
    }

    try {
        const response = await fetch("http://127.0.0.1:8000/flagged-numbers");
        const data = await response.json();

        if (data.numbers.length === 0) {
            flaggedNumbers.innerHTML = "<p>No flagged numbers found.</p>";
        } else {
            flaggedNumbers.innerHTML = data.numbers.map(row => `
                <div class="flagged-number">
                    <strong>${row.phone_number}</strong>
                    <span>${row.category || "Unknown"}</span>
                    <small>Reports: ${row.reports || 0}</small>
                </div>
            `).join("");
        }

        flaggedNumbers.classList.remove("hidden");
        showFlaggedBtn.textContent = "✖ Hide Flagged Numbers";

    } catch (error) {
        console.error(error);
        alert("Could not load flagged numbers.");
    }
});

function showResult(data) {

    result.classList.remove(
        "hidden",
        "spam",
        "normal"
    );

    const isSpam =
        data.classification === "SPAM / SCAM";

    if (isSpam) {

        result.classList.add("spam");

        resultIcon.innerHTML = `
    <svg viewBox="0 0 24 24">
        <path d="M12 3L3 20h18L12 3z"/>
        <path d="M12 9v5"/>
        <circle cx="12" cy="17" r="1"/>
    </svg>
`;

        classification.textContent =
            "SPAM / SCAM";

    } else {

        result.classList.add("normal");

        resultIcon.innerHTML = `
    <svg viewBox="0 0 24 24">
        <path d="M12 3L4.5 6v5.5c0 4.7 3.1 8.7 7.5 10.5 4.4-1.8 7.5-5.8 7.5-10.5V6L12 3z"/>
        <path d="M8.5 12l2.2 2.2 4.8-5"/>
    </svg>
`;

        classification.textContent =
            "NORMAL";
    }

    confidence.textContent =
        Math.round(data.confidence * 100) + "%";

    reason.textContent =
        data.reason;
    if (data.details) {
        detailsBox.style.display = "block";
        details.textContent = data.details;
    } else {
        detailsBox.style.display = "none";
    }
        if (data.reports !== undefined) {

        reportsBox.style.display = "block";

        reports.textContent =
            data.reports;

    } else {

        reportsBox.style.display = "none";
    }

}