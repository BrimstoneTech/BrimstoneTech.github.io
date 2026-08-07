(() => {
    "use strict";

    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
    const money = new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 });
    const formatMoney = value => {
        const safeValue = Number.isFinite(value) ? value : 0;
        const sign = safeValue < 0 ? "-" : "";
        return `${sign}UGX ${money.format(Math.abs(safeValue))}`;
    };
    const numberValue = id => Math.max(0, Number($(id).value) || 0);

    function openTool(name, moveFocus = false) {
        const activeTab = $(`[data-tool="${name}"]`);
        const activePanel = $(`[data-panel="${name}"]`);
        if (!activeTab || !activePanel) return;

        $$("[data-tool]").forEach(tab => {
            const selected = tab === activeTab;
            tab.setAttribute("aria-selected", String(selected));
            tab.tabIndex = selected ? 0 : -1;
        });
        $$("[data-panel]").forEach(panel => {
            panel.hidden = panel !== activePanel;
        });
        try {
            history.replaceState(null, "", `#${name}`);
        } catch {
            // Some privacy modes disallow history mutation; the tool still works.
        }
        if (moveFocus) activeTab.focus();
    }

    $$("[data-tool]").forEach(tab => {
        tab.addEventListener("click", () => openTool(tab.dataset.tool));
        tab.addEventListener("keydown", event => {
            if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
            const tabs = $$("[data-tool]");
            let index = tabs.indexOf(tab);
            if (event.key === "ArrowRight") index = (index + 1) % tabs.length;
            if (event.key === "ArrowLeft") index = (index - 1 + tabs.length) % tabs.length;
            if (event.key === "Home") index = 0;
            if (event.key === "End") index = tabs.length - 1;
            event.preventDefault();
            openTool(tabs[index].dataset.tool, true);
        });
    });
    $$("[data-open-tool]").forEach(link => {
        link.addEventListener("click", event => {
            event.preventDefault();
            carryResultIntoBrief(link.id);
            openTool(link.dataset.openTool);
            $("#tools").scrollIntoView({ behavior: "smooth", block: "start" });
        });
    });

    function carryResultIntoBrief(source) {
        if (!source) return;
        let problem = "";
        let outcome = "";
        if (source === "leakageToBrief") {
            problem = `The current manual process costs an estimated ${$("#annualProcessCost").textContent} per year, including labour and rework.`;
            outcome = `Test whether a focused automation can recover part of the estimated ${$("#recoverableValue").textContent} annual opportunity.`;
        }
        if (source === "readinessToBrief") {
            problem = `The process scored ${$("#readinessScore").textContent}/100 in the ForgeKit automation-readiness scan: ${$("#readinessTitle").textContent}.`;
            outcome = $("#readinessAdvice").textContent;
        }
        if (source === "roiToBrief") {
            problem = `The planning case uses an implementation cost of ${formatMoney(numberValue("#roiUpfront"))} and an estimated net monthly benefit of ${$("#roiMonthlyBenefit").textContent}.`;
            outcome = `Validate the assumptions behind an estimated payback of ${$("#roiPayback").textContent} before committing to the build.`;
        }
        if (problem && !$("#briefProblem").value.trim()) $("#briefProblem").value = problem;
        if (outcome && !$("#briefOutcome").value.trim()) $("#briefOutcome").value = outcome;
        if (problem || outcome) buildBrief();
    }

    function calculateLeakage() {
        const people = numberValue("#processPeople");
        const hours = numberValue("#processHours");
        const rate = numberValue("#processRate");
        const errors = numberValue("#processErrors");
        const recovery = Number($("#processRecovery").value);
        const labour = people * hours * rate * 52;
        const rework = errors * 12;
        const total = labour + rework;
        const recoverable = total * recovery;
        $("#annualProcessCost").textContent = formatMoney(total);
        $("#annualLabourCost").textContent = formatMoney(labour);
        $("#annualErrorCost").textContent = formatMoney(rework);
        $("#recoverableValue").textContent = formatMoney(recoverable);
        $("#leakageNote").textContent = `Planning case: ${Math.round(recovery * 100)}% of the measured cost is recoverable. Validate it with a short process audit.`;
    }
    $("#leakageForm").addEventListener("input", calculateLeakage);

    function calculateReadiness() {
        const selects = $$("[data-readiness]");
        const raw = selects.reduce((sum, select) => sum + Number(select.value), 0);
        const score = Math.round((raw / (selects.length * 2)) * 100);
        let title;
        let advice;
        let recommendation;
        if (score < 40) {
            title = "Define the process first";
            advice = "Technology would probably automate confusion at this stage.";
            recommendation = "<strong>Next move:</strong> name one process owner, write the current steps and agree on the output before commissioning software.";
        } else if (score < 70) {
            title = "Promising, but narrow the first build";
            advice = "There is enough repetition to investigate, but the workflow still needs boundaries.";
            recommendation = "<strong>Next move:</strong> choose one high-volume path, measure a baseline and prototype the smallest useful automation.";
        } else {
            title = "Strong candidate for automation";
            advice = "The process is repetitive, measurable and structured enough for a technical discovery.";
            recommendation = "<strong>Next move:</strong> document volume, exceptions and system access, then estimate a pilot against a measurable target.";
        }
        $("#readinessScore").textContent = score;
        $("#readinessRing").style.setProperty("--score", `${score * 3.6}deg`);
        $("#readinessTitle").textContent = title;
        $("#readinessAdvice").textContent = advice;
        $("#readinessRecommendation").innerHTML = recommendation;
    }
    $("#readinessForm").addEventListener("input", calculateReadiness);

    function calculateRoi() {
        const upfront = numberValue("#roiUpfront");
        const monthlyCost = numberValue("#roiMonthlyCost");
        const savings = numberValue("#roiSavings");
        const growth = numberValue("#roiGrowth");
        const monthlyBenefit = savings + growth - monthlyCost;
        const yearOne = monthlyBenefit * 12 - upfront;
        const roi = upfront > 0 ? (yearOne / upfront) * 100 : null;
        const payback = monthlyBenefit > 0 ? upfront / monthlyBenefit : null;
        $("#roiMonthlyBenefit").textContent = formatMoney(monthlyBenefit);
        $("#roiYearOne").textContent = formatMoney(yearOne);
        $("#roiPercent").textContent = roi === null ? "Set an upfront cost" : `${roi.toFixed(0)}%`;
        $("#roiPayback").textContent = payback === null ? "No payback yet" : payback === 0 ? "Immediate" : `${payback.toFixed(1)} months`;
        $("#roiNote").textContent = monthlyBenefit <= 0
            ? "The current assumptions do not produce a positive monthly benefit. Reduce cost or validate a larger benefit before investing."
            : "Planning estimate only. Test savings against real process data and include change-management time.";
    }
    $("#roiForm").addEventListener("input", calculateRoi);

    function buildBrief() {
        const values = {
            name: $("#briefName").value.trim(),
            company: $("#briefCompany").value.trim(),
            problem: $("#briefProblem").value.trim(),
            users: $("#briefUsers").value.trim(),
            systems: $("#briefSystems").value.trim(),
            outcome: $("#briefOutcome").value.trim(),
            timing: $("#briefTiming").value.trim()
        };
        const present = Object.values(values).filter(Boolean).length;
        const completeness = Math.round((present / Object.keys(values).length) * 100);
        const text = [
            "BRIMSTONETECH PROJECT BRIEF",
            "==========================",
            "",
            `Contact: ${values.name || "[Your name]"}`,
            `Organisation: ${values.company || "[Company or organisation]"}`,
            "",
            "CURRENT PROCESS / PROBLEM",
            values.problem || "[Describe what happens now and where the friction appears.]",
            "",
            "PEOPLE INVOLVED",
            values.users || "[Who uses, owns or is affected by this process?]",
            "",
            "SYSTEMS INVOLVED",
            values.systems || "[List the software, spreadsheets, messaging apps or paper records involved.]",
            "",
            "DESIRED OUTCOME",
            values.outcome || "[What measurable change would make this project worthwhile?]",
            "",
            "TIMING",
            values.timing || "[Is there a deadline or preferred pilot window?]",
            "",
            "Prepared with ForgeKit by BrimstoneTech."
        ].join("\n");
        $("#briefPreview").textContent = text;
        $("#briefCompleteness").textContent = `${completeness}% complete`;
        const subject = encodeURIComponent(`Project enquiry${values.company ? ` — ${values.company}` : ""}`);
        $("#emailBrief").href = `mailto:brimstonetech1@gmail.com?subject=${subject}&body=${encodeURIComponent(text)}`;
        return text;
    }
    $("#briefForm").addEventListener("input", buildBrief);

    $("#copyBrief").addEventListener("click", async event => {
        try {
            await navigator.clipboard.writeText(buildBrief());
            event.currentTarget.textContent = "Copied";
        } catch {
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents($("#briefPreview"));
            selection.removeAllRanges();
            selection.addRange(range);
            event.currentTarget.textContent = "Selected — copy now";
        }
        setTimeout(() => { event.currentTarget.textContent = "Copy brief"; }, 1800);
    });

    $("#downloadBrief").addEventListener("click", () => {
        const blob = new Blob([buildBrief()], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "brimstonetech-project-brief.txt";
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    });

    function calculatePricing() {
        const cost = numberValue("#priceBase") + numberValue("#priceProduction") + numberValue("#pricePackaging") + numberValue("#priceFees");
        const method = $('input[name="pricingMethod"]:checked').value;
        const rawPrice = method === "markup" ? cost * 1.75 : cost / (1 - 0.75);
        const suggested = Math.ceil(rawPrice / 5000) * 5000;
        const profit = suggested - cost;
        const margin = suggested > 0 ? (profit / suggested) * 100 : 0;
        $("#landedCost").textContent = formatMoney(cost);
        $("#suggestedPrice").textContent = formatMoney(suggested);
        $("#grossProfit").textContent = formatMoney(profit);
        $("#grossMargin").textContent = `${margin.toFixed(1)}%`;
        $("#pricingExplanation").textContent = method === "markup"
            ? `A 75% markup gives ${formatMoney(rawPrice)} before rounding. The displayed price rounds up to the next UGX 5,000.`
            : `A 75% gross-margin target gives ${formatMoney(rawPrice)} before rounding. The displayed price rounds up to the next UGX 5,000.`;
    }
    $("#pricingForm").addEventListener("input", calculatePricing);

    const validTools = ["leakage", "readiness", "roi", "brief", "pricing"];
    const initialTool = validTools.includes(location.hash.slice(1)) ? location.hash.slice(1) : "leakage";
    openTool(initialTool);
    calculateLeakage();
    calculateReadiness();
    calculateRoi();
    buildBrief();
    calculatePricing();
})();
