//popup.js

const FALLBACK_HINTS = [
    { text: "Break the problem into smaller parts" },
    { text: "Think step-by-step" },
    { text: "Try brute force first" },
    { text: "Optimize your approach" },
    { text: "Check edge cases carefully" }
];


document.addEventListener("DOMContentLoaded",()=>{

    function updateButtonState(currentIndex, totalHints) {
        const getBtn = document.getElementById("get-hint");
        const prevBtn = document.getElementById("prev-hint");
        const nextBtn = document.getElementById("next-hint");
        const resetBtn = document.getElementById("reset-hints");
        const explainBtn = document.getElementById("full-explanation");

        if (currentIndex === 0) {
        getBtn.disabled = false;
        getBtn.style.opacity = "1";

        prevBtn.disabled = true;
        nextBtn.disabled = true;
        resetBtn.disabled = true;

        prevBtn.style.opacity = nextBtn.style.opacity = resetBtn.style.opacity = "0.5";
        return;
    }

    getBtn.disabled = true;
    getBtn.style.opacity = "0.5";

    if (currentIndex === 1) {
        prevBtn.disabled = true;
        nextBtn.disabled = false;
        resetBtn.disabled = true;

        prevBtn.style.opacity = "0.5";
        nextBtn.style.opacity = "1";
        resetBtn.style.opacity = "0.5";
    }

    else {
        prevBtn.disabled = false;
        resetBtn.disabled = false;

        prevBtn.style.opacity = "1";
        resetBtn.style.opacity = "1";

        if (currentIndex >= totalHints) {
            nextBtn.disabled = true;
            nextBtn.style.opacity = "0.5";
        } else {
            nextBtn.disabled = false;
            nextBtn.style.opacity = "1";
        }

        const altBtn = document.getElementById("alt-hint");

        if (currentIndex >= totalHints) {
            altBtn.disabled = false;
            altBtn.style.opacity = "1";
        } else {
            altBtn.disabled = true;
            altBtn.style.opacity = "0.5";
        }
    }

    const storedData = window.currentStoredData;

    if (storedData && storedData.unlock_time) {
        if (Date.now() >= storedData.unlock_time) {
            explainBtn.disabled = false;
            explainBtn.style.opacity = "1";
        } else {
            explainBtn.disabled = true;
            explainBtn.style.opacity = "0.5";
        }
    } else {
        explainBtn.disabled = true;
        explainBtn.style.opacity = "0.5";
    }
}

async function getHints() {
    const problemData = await chrome.storage.local.get("currentProblem");
    if (!problemData.currentProblem) {
        document.getElementById("hint-text").innerText = "Open a LeetCode problem first.";
        return null;
    }

    const {title, description } = problemData.currentProblem;

    const problemHash = await generateHash(title+ description);
    
    const storedData = await chrome.storage.local.get(problemHash);
    if (storedData[problemHash] && storedData[problemHash].hints?.length > 0){
        console.log("Using cached hints");
        return storedData[problemHash];
    }

    document.getElementById("hint-text").innerText = "Loading hints... ⏳";

    const response= await fetch("http://127.0.0.1:5000/generate-hints",{
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({title, description})
    });

    if (!response || !response.ok) {
        console.log("API failed:", response ? response.status : "No response");

        return {
            hints: FALLBACK_HINTS,
            alt_hint: "Try thinking from another perspective"
        };
    }


    const hintData= await response.json();
    console.log("RAW API:", hintData);

    let formattedHints;

    if (typeof hintData.hints === "string") {
        formattedHints = hintData.hints
            .split("\n")
            .map(h => h.trim())
            .filter(h => h.length > 0)
            .map(h => ({
                text: h.replace(/^\d+\.\s*/, "")
            }));
        } 
        else {
            formattedHints = hintData.hints
               .map(h => ({
                    text: (h.text || h).trim()
                }))
                .filter(h => h.text.length > 0);
        }

    const isFallback = !response.ok || formattedHints.length === 0;

    const finalData = {
        hints: isFallback ? FALLBACK_HINTS : formattedHints,
        alt_hint: hintData.alt_hint || "Try thinking from another perspective",
        isFallback: isFallback
    };

    if (!finalData.isFallback) {
    chrome.storage.local.set({ 
        [problemHash]: {
            ...finalData,
            current_index: 0,
            created_at: Date.now()
        }
    });
    }
    return finalData;
}

document.getElementById("get-hint").addEventListener("click", async () => {
    
    const problemData = await chrome.storage.local.get("currentProblem");
    const problemHash = await generateHash(
        problemData.currentProblem.title + problemData.currentProblem.description
    );

    const stored = await chrome.storage.local.get(problemHash);

    if (stored[problemHash]) {
        const currentIndex = stored[problemHash].current_index || 1;

        document.getElementById("hint-text").innerText =
            `Hint ${currentIndex}: ${stored[problemHash].hints[Math.max(0, currentIndex - 1)].text}`;
        
        window.currentStoredData = stored[problemHash];
        updateButtonState(currentIndex, stored[problemHash].hints.length);

        if (stored[problemHash].used) {
            const getBtn = document.getElementById("get-hint");
            getBtn.disabled = true;
            getBtn.style.opacity = "0.5";
        }

        return;
    }

    const hintData = await getHints();
    if (!hintData) return;

    document.getElementById("hint-text").innerText =
    `Hint 1: ${hintData.hints[0].text}`;
    
    const updated = await chrome.storage.local.get(problemHash);

    if (!updated[problemHash]) {
        updated[problemHash] = {
            hints: hintData.hints,
            alt_hint: hintData.alt_hint,
            current_index: 1,
            used: true
        };
    }
    updated[problemHash].current_index = 1;
    updated[problemHash].used = true;

    chrome.storage.local.set({ [problemHash]: updated[problemHash] });

    window.currentStoredData = updated[problemHash];

    updateButtonState(1, hintData.hints.length);

    const getBtn = document.getElementById("get-hint");
    getBtn.disabled = true;
    getBtn.style.opacity = "0.5";

});

document.getElementById("next-hint").addEventListener("click", async () => {
    const problemData= await chrome.storage.local.get("currentProblem");

    if (!problemData.currentProblem) return;

    const problemHash= await generateHash(
        problemData.currentProblem.title + problemData.currentProblem.description);

    const stored = await chrome.storage.local.get(problemHash);

    if (!stored[problemHash]){
        document.getElementById("hint-text").innerText="Click 'Get Hint' first.";
        return;
    }
    let currentIndex= stored[problemHash].current_index;

    if (currentIndex < stored[problemHash].hints.length){
        document.getElementById("hint-text").innerText = `Hint ${currentIndex + 1}: ${stored[problemHash].hints[currentIndex].text}`;
        stored[problemHash].current_index+=1;
        chrome.storage.local.set({ [problemHash]: stored[problemHash] });

        window.currentStoredData = stored[problemHash];

        updateButtonState(stored[problemHash].current_index, stored[problemHash].hints.length);
    
    }else{
        document.getElementById("hint-text").innerText="No more hints. Try full explanation.";
    }
});

document.getElementById("alt-hint").addEventListener("click", async () => {
    const problemData = await chrome.storage.local.get("currentProblem");

    if (!problemData.currentProblem) {
        document.getElementById("hint-text").innerText = "Open a problem first.";
        return;
    }

    const problemHash = await generateHash(
        problemData.currentProblem.title + problemData.currentProblem.description
    );

    const stored = await chrome.storage.local.get(problemHash);

    if (!stored[problemHash]) {
        document.getElementById("hint-text").innerText = "Click 'Get Hint' first.";
        return;
    }

    const altHint = stored[problemHash].alt_hint;

    document.getElementById("hint-text").innerText =
        altHint && altHint.length > 0
            ? `Alternative Hint: ${altHint}`
            : "No alternative hint available.";

    const unlockTime = Date.now() + ( 3 * 60 * 1000); // 3 minutes

    stored[problemHash].unlock_time = unlockTime;

    chrome.storage.local.set({ [problemHash]: stored[problemHash] });

    const prevBtn = document.getElementById("prev-hint");
    const nextBtn = document.getElementById("next-hint");

    prevBtn.disabled = true;
    nextBtn.disabled = true;

    prevBtn.style.opacity = "0.5";
    nextBtn.style.opacity = "0.5";

    updateButtonState(
    stored[problemHash].current_index,
    stored[problemHash].hints.length
);
});

document.getElementById("reset-hints").addEventListener("click", async () => {
    const problemData = await chrome.storage.local.get("currentProblem");

    if (!problemData.currentProblem) {
        document.getElementById("hint-text").innerText = "Open a problem first.";
        return;
    }

    const problemHash = await generateHash(
        problemData.currentProblem.title + problemData.currentProblem.description
    );

    const stored = await chrome.storage.local.get(problemHash);

    if (!stored[problemHash]) {
        document.getElementById("hint-text").innerText = "No hints to reset.";
        return;
    }

    stored[problemHash].current_index = 1;

    await chrome.storage.local.set({ [problemHash]: stored[problemHash] });

    document.getElementById("hint-text").innerText =
        `Hint 1: ${stored[problemHash].hints[0].text}`;

    window.currentStoredData = stored[problemHash];

    updateButtonState(1, stored[problemHash].hints.length);
});

document.getElementById("prev-hint").addEventListener("click", async () => {
    const problemData = await chrome.storage.local.get("currentProblem");

    if (!problemData.currentProblem) {
        document.getElementById("hint-text").innerText = "Open a problem first.";
        return;
    }

    const problemHash = await generateHash(
        problemData.currentProblem.title + problemData.currentProblem.description
    );

    const stored = await chrome.storage.local.get(problemHash);

    if (!stored[problemHash]) {
        document.getElementById("hint-text").innerText = "Click 'Get Hint' first.";
        return;
    }

    let currentIndex = stored[problemHash].current_index;

    if (currentIndex > 1) {
        currentIndex -= 1;

        stored[problemHash].current_index = currentIndex;

        document.getElementById("hint-text").innerText =
            `Hint ${currentIndex}: ${stored[problemHash].hints[currentIndex - 1].text}`;
        chrome.storage.local.set({ [problemHash]: stored[problemHash] });

        window.currentStoredData = stored[problemHash];
        updateButtonState(stored[problemHash].current_index, stored[problemHash].hints.length);

    } else {
        document.getElementById("hint-text").innerText = "Already at first hint.";
    }
});


document.getElementById("full-explanation").addEventListener("click", async () => {

    const problemData = await chrome.storage.local.get("currentProblem");

    if (!problemData.currentProblem) {
        document.getElementById("hint-text").innerText = "Open a problem first.";
        return;
    }

    const { title, description } = problemData.currentProblem;

    document.getElementById("hint-text").innerText = "Loading explanation... ⏳";

    try {
        const response = await fetch("http://127.0.0.1:5000/generate-explanation", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ title, description })
        });

        const data = await response.json();

        document.getElementById("hint-text").innerText =
            data.explanation || "No explanation available.";

    } catch (error) {
        document.getElementById("hint-text").innerText =
            "Try reviewing the hints and build the logic step-by-step.";
    }
});

(async () => {
    const problemData = await chrome.storage.local.get("currentProblem");

    const getBtn = document.getElementById("get-hint");

    if (!problemData.currentProblem) {
        updateButtonState(0, 5);
        return;
    }

    const problemHash = await generateHash(
        problemData.currentProblem.title + problemData.currentProblem.description
    );

    const stored = await chrome.storage.local.get(problemHash);

    if (!stored[problemHash]) {

        document.getElementById("get-hint").disabled = false;
        document.getElementById("get-hint").style.opacity = "1";

        ["next-hint", "prev-hint", "reset-hints", "alt-hint", "full-explanation"]
            .forEach(id => {
                const btn = document.getElementById(id);
                if (btn) {
                    btn.disabled = true;
                    btn.style.opacity = "0.5";
                }
            });

        return;
    }

    const currentIndex = stored[problemHash].current_index || 1;
    const totalHints = stored[problemHash].hints.length;

    document.getElementById("hint-text").innerText =
        `Hint ${currentIndex}: ${stored[problemHash].hints[currentIndex - 1].text}`;

    window.currentStoredData = stored[problemHash];
    updateButtonState(currentIndex, totalHints);
})();

setInterval(() => {
    if (!window.currentStoredData) return;

    updateButtonState(
        window.currentStoredData.current_index || 1,
        window.currentStoredData.hints?.length || 5
    );
}, 1000);

});

