//content.js

//insert a button into the problem page
console.log("content.js loaded");

function injectHintButton(){

    if (document.getElementById("get-hint-btn")) return;

    const problemContainer=
        document.querySelector('[data-cy="question-title"]') ||
        document.querySelector('h1') ||
        document.querySelector('.text-title-large');

    if (!problemContainer) return;
    console.log("Problem container found");

    const btn = document.createElement("button");

    btn.textContent = "Get Hint";
    btn.id="get-hint-btn";

    btn.style.marginLeft="10px";
    btn.style.padding="5px 10px";
    btn.style.backgroundColor="#4CAF50";
    btn.style.color="white";
    btn.style.border="none";
    btn.style.borderRadius="4px";
    btn.style.cursor="pointer";

    problemContainer.appendChild(btn);

    btn.addEventListener("click",async()=> {

        const title = 
            document.querySelector('div[data-cy="question-title"]')?.innerText ||
            document.querySelector('h1')?.innerText || "";

        const description = 
            document.querySelector('[data-track-load="description_content"]')?.innerText ||
            document.body.innerText.substring(0, 3000);

        //Save problem data to chrome storage
        await chrome.storage.local.set({ currentProblem: {title,description} });
        
        alert("Problem captured successfully! Open the extension to view hints.");
    });
}

setInterval(injectHintButton, 2000);