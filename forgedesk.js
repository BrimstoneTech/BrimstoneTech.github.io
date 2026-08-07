/* ForgeDesk — quotation & invoice builder.
   Standalone, no dependencies, no network calls, localStorage only. */
(() => {
    "use strict";

    const STORE_KEY = "brimstone.forgedesk.v1";
    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

    const ZERO_DECIMAL = new Set(["UGX", "KES"]);
    const REQUIRED = [
        ["seller.name", "business name"],
        ["seller.email", "email"],
        ["seller.address", "address"],
        ["seller.reg", "business registration no."],
        ["seller.tin", "TIN"]
    ];

    /* ---------- helpers ---------- */
    const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => (
        { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]
    ));
    const escLines = value => esc(value).replace(/\r?\n/g, "<br>");
    const num = value => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    };
    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const uid = () => `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
    const round2 = value => Math.round((value + Number.EPSILON) * 100) / 100;
    const todayISO = () => new Date().toISOString().slice(0, 10);
    const addDaysISO = days => new Date(Date.now() + days * 864e5).toISOString().slice(0, 10);

    const get = (obj, path) => path.split(".").reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
    const set = (obj, path, value) => {
        const keys = path.split(".");
        const last = keys.pop();
        let cursor = obj;
        keys.forEach(key => {
            if (typeof cursor[key] !== "object" || cursor[key] === null) cursor[key] = {};
            cursor = cursor[key];
        });
        cursor[last] = value;
    };

    function fmtMoney(value, currency) {
        const digits = ZERO_DECIMAL.has(currency) ? 0 : 2;
        const abs = Math.abs(num(value)).toLocaleString("en-US", {
            minimumFractionDigits: digits, maximumFractionDigits: digits
        });
        return `${num(value) < 0 ? "-" : ""}${currency} ${abs}`;
    }
    function fmtDate(iso) {
        if (!iso) return "—";
        const date = new Date(`${iso}T00:00:00`);
        if (Number.isNaN(date.getTime())) return esc(iso);
        return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    }

    /* ---------- model ---------- */
    const blankItem = () => ({ desc: "", note: "", qty: 1, price: 0, discount: 0 });

    function blankDoc(type = "quotation") {
        return {
            id: uid(),
            type,
            number: nextNumber(type),
            currency: "UGX",
            issueDate: todayISO(),
            dueDate: addDaysISO(type === "invoice" ? 14 : 30),
            taxEnabled: false,
            taxLabel: "VAT",
            taxRate: 18,
            pricesIncludeTax: false,
            docDiscount: 0,
            shipping: 0,
            seller: {
                name: "BrimstoneTech",
                contact: "Isaiah Talemwa",
                email: "brimstonetech1@gmail.com",
                phone: "",
                address: "",
                reg: "",
                tin: "",
                website: "https://brimstonetech.github.io"
            },
            client: { name: "", contact: "", email: "", phone: "", address: "", tin: "", ref: "" },
            items: [blankItem()],
            notes: "",
            terms: "Prices are valid for 30 days from the issue date. Work starts after written approval.",
            payment: "",
            updated: Date.now()
        };
    }

    function nextNumber(type) {
        const prefix = type === "invoice" ? "INV" : "QUO";
        const year = new Date().getFullYear();
        const used = (state.docs || [])
            .filter(doc => doc.type === type)
            .map(doc => Number(String(doc.number || "").match(/(\d+)\s*$/)?.[1] || 0));
        const next = (used.length ? Math.max(...used) : 0) + 1;
        return `${prefix}-${year}-${String(next).padStart(4, "0")}`;
    }

    /* ---------- persistence ---------- */
    let state = { docs: [], activeId: null };
    let storageOK = true;

    function migrateDoc(raw) {
        const base = blankDoc(raw && raw.type === "invoice" ? "invoice" : "quotation");
        const doc = { ...base, ...(raw || {}) };
        doc.id = typeof raw?.id === "string" && raw.id ? raw.id : uid();
        doc.type = doc.type === "invoice" ? "invoice" : "quotation";
        doc.seller = { ...base.seller, ...(raw?.seller || {}) };
        doc.client = { ...base.client, ...(raw?.client || {}) };
        doc.items = Array.isArray(raw?.items) && raw.items.length
            ? raw.items.map(item => ({ ...blankItem(), ...(item || {}) }))
            : [blankItem()];
        ["qty", "price", "discount"].forEach(key => doc.items.forEach(item => { item[key] = num(item[key]); }));
        doc.taxRate = clamp(num(doc.taxRate), 0, 100);
        doc.docDiscount = clamp(num(doc.docDiscount), 0, 100);
        doc.shipping = num(doc.shipping);
        doc.taxEnabled = Boolean(doc.taxEnabled);
        doc.pricesIncludeTax = Boolean(doc.pricesIncludeTax);
        doc.updated = num(doc.updated) || Date.now();
        return doc;
    }

    function load() {
        try {
            const raw = localStorage.getItem(STORE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                state.docs = Array.isArray(parsed?.docs) ? parsed.docs.map(migrateDoc) : [];
                state.activeId = typeof parsed?.activeId === "string" ? parsed.activeId : null;
            }
        } catch {
            state = { docs: [], activeId: null };
            flash("Saved data could not be read; starting fresh.");
        }
        if (!state.docs.length) state.docs = [blankDoc("quotation")];
        if (!state.docs.some(doc => doc.id === state.activeId)) state.activeId = state.docs[0].id;
    }

    function save() {
        active().updated = Date.now();
        try {
            localStorage.setItem(STORE_KEY, JSON.stringify(state));
            if (storageOK) flash(`Saved locally · ${new Date().toLocaleTimeString()}`);
        } catch {
            storageOK = false;
            flash("This browser refused to store data (private mode or full storage). Export JSON to keep your work.");
        }
    }

    const active = () => state.docs.find(doc => doc.id === state.activeId) || state.docs[0];
    const flash = message => { $("#saveState").textContent = message; };

    /* ---------- calculation ---------- */
    function compute(doc) {
        const lines = doc.items.map(item => {
            const qty = num(item.qty);
            const price = num(item.price);
            const discount = clamp(num(item.discount), 0, 100);
            return { ...item, qty, price, discount, amount: round2(qty * price * (1 - discount / 100)) };
        });
        const itemsTotal = round2(lines.reduce((sum, line) => sum + line.amount, 0));
        const docDiscountPct = clamp(num(doc.docDiscount), 0, 100);
        const docDiscountValue = round2(itemsTotal * docDiscountPct / 100);
        const shipping = num(doc.shipping);
        const gross = round2(itemsTotal - docDiscountValue + shipping);
        const rate = doc.taxEnabled ? clamp(num(doc.taxRate), 0, 100) : 0;

        let net = gross;
        let tax = 0;
        if (doc.taxEnabled && rate > 0) {
            if (doc.pricesIncludeTax) {
                net = round2(gross / (1 + rate / 100));
                tax = round2(gross - net);
            } else {
                tax = round2(gross * rate / 100);
            }
        }
        const total = doc.pricesIncludeTax ? gross : round2(net + tax);
        return { lines, itemsTotal, docDiscountPct, docDiscountValue, shipping, net, rate, tax, total };
    }

    function missingFields(doc) {
        return REQUIRED.filter(([path]) => !String(get(doc, path) || "").trim()).map(([, label]) => label);
    }

    /* ---------- rendering ---------- */
    function renderFields() {
        const doc = active();
        $$("[data-doc]").forEach(el => {
            const value = get(doc, el.dataset.doc);
            if (el.type === "checkbox") el.checked = Boolean(value);
            else el.value = value ?? "";
        });
        $$("[data-type]").forEach(btn => btn.setAttribute("aria-pressed", String(btn.dataset.type === doc.type)));
        $("#dueLabel").textContent = doc.type === "invoice" ? "Payment due" : "Valid until";
    }

    function renderItems() {
        const doc = active();
        const totals = compute(doc);
        const host = $("#itemRows");
        host.textContent = "";
        doc.items.forEach((item, index) => {
            const row = document.createElement("div");
            row.className = "item-row";
            row.innerHTML = `
                <input class="i-desc" data-item="desc" data-index="${index}" aria-label="Description for line ${index + 1}" value="${esc(item.desc)}" placeholder="What you are billing for">
                <input type="number" min="0" step="any" data-item="qty" data-index="${index}" aria-label="Quantity for line ${index + 1}" value="${esc(item.qty)}">
                <input type="number" min="0" step="any" data-item="price" data-index="${index}" aria-label="Unit price for line ${index + 1}" value="${esc(item.price)}">
                <input type="number" min="0" max="100" step="any" data-item="discount" data-index="${index}" aria-label="Discount percent for line ${index + 1}" value="${esc(item.discount)}">
                <span class="item-amount">${esc(fmtMoney(totals.lines[index].amount, doc.currency))}</span>
                <button type="button" class="row-del" data-del="${index}" aria-label="Remove line ${index + 1}">✕</button>`;
            host.appendChild(row);
        });
    }

    function renderList() {
        const host = $("#docList");
        $("#docCount").textContent = String(state.docs.length);
        host.textContent = "";
        [...state.docs]
            .sort((a, b) => b.updated - a.updated)
            .forEach(doc => {
                const totals = compute(doc);
                const li = document.createElement("li");
                li.dataset.active = String(doc.id === state.activeId);
                li.innerHTML = `
                    <span class="doc-meta">
                        <b>${esc(doc.number || "(no number)")} · ${esc(doc.client.name || "no client")}</b>
                        <span>${doc.type === "invoice" ? "Invoice" : "Quotation"} · ${esc(fmtDate(doc.issueDate))} · ${esc(fmtMoney(totals.total, doc.currency))}</span>
                    </span>
                    <span class="doc-acts">
                        <button type="button" data-load="${esc(doc.id)}">Open</button>
                        <button type="button" data-dup="${esc(doc.id)}">Duplicate</button>
                        <button type="button" data-remove="${esc(doc.id)}">Delete</button>
                    </span>`;
                host.appendChild(li);
            });
        if (!state.docs.length) host.innerHTML = '<li class="empty">No saved documents.</li>';
    }

    function renderWarning(doc) {
        const missing = missingFields(doc);
        $("#setupWarning").hidden = missing.length === 0;
        $("#setupMissing").textContent = missing.join(", ") || "—";
        $("#sheetDraft").hidden = missing.length === 0;
        REQUIRED.forEach(([path]) => {
            const el = $(`[data-doc="${path}"]`);
            if (el) el.setAttribute("aria-invalid", String(!String(get(doc, path) || "").trim()));
        });
    }

    function renderPreview() {
        const doc = active();
        const totals = compute(doc);
        const cur = doc.currency;

        $("#pvType").textContent = doc.type === "invoice" ? "INVOICE" : "QUOTATION";
        $("#pvNumber").textContent = doc.number || "(no document number)";

        const sellerBits = [
            doc.seller.contact, doc.seller.address, doc.seller.email, doc.seller.phone, doc.seller.website,
            doc.seller.reg ? `Reg. no: ${doc.seller.reg}` : "",
            doc.seller.tin ? `TIN: ${doc.seller.tin}` : ""
        ].filter(Boolean);
        $("#pvSeller").innerHTML = `<b>${esc(doc.seller.name || "(seller name missing)")}</b>${
            sellerBits.map(bit => `<div>${escLines(bit)}</div>`).join("")}`;

        const clientBits = [doc.client.contact, doc.client.address, doc.client.email, doc.client.phone,
            doc.client.tin ? `TIN: ${doc.client.tin}` : ""].filter(Boolean);
        $("#pvClient").innerHTML = `<b>${esc(doc.client.name || "(client name missing)")}</b>${
            clientBits.map(bit => `<div>${escLines(bit)}</div>`).join("")}`;

        const rows = [
            [doc.type === "invoice" ? "Invoice no." : "Quotation no.", doc.number || "—"],
            ["Issue date", fmtDate(doc.issueDate)],
            [doc.type === "invoice" ? "Payment due" : "Valid until", fmtDate(doc.dueDate)],
            ["Currency", cur]
        ];
        if (doc.client.ref) rows.push(["Reference", doc.client.ref]);
        $("#pvDates").innerHTML = `<dl>${rows.map(([key, value]) =>
            `<dt>${esc(key)}</dt><dd>${esc(value)}</dd>`).join("")}</dl>`;

        $("#pvItems").innerHTML = totals.lines.length
            ? totals.lines.map(line => `<tr>
                <td>${esc(line.desc || "—")}${line.note ? `<span class="item-note">${escLines(line.note)}</span>` : ""}</td>
                <td class="c-num">${esc(line.qty.toLocaleString("en-US"))}</td>
                <td class="c-num">${esc(fmtMoney(line.price, cur))}</td>
                <td class="c-num">${line.discount ? `${esc(line.discount)}%` : "—"}</td>
                <td class="c-num">${esc(fmtMoney(line.amount, cur))}</td></tr>`).join("")
            : '<tr><td colspan="5">No line items.</td></tr>';

        const totalRows = [["Items subtotal", fmtMoney(totals.itemsTotal, cur), ""]];
        if (totals.docDiscountValue) totalRows.push([`Discount (${totals.docDiscountPct}%)`, `-${fmtMoney(totals.docDiscountValue, cur)}`, "muted"]);
        if (totals.shipping) totalRows.push(["Shipping / other", fmtMoney(totals.shipping, cur), ""]);
        if (doc.taxEnabled && totals.rate > 0) {
            totalRows.push([`Taxable amount`, fmtMoney(totals.net, cur), "muted"]);
            totalRows.push([`${doc.taxLabel || "Tax"} ${totals.rate}%${doc.pricesIncludeTax ? " (included)" : ""}`, fmtMoney(totals.tax, cur), ""]);
        }
        $("#pvTotals").innerHTML = `${totalRows.map(([label, value, cls]) =>
            `<tr class="${cls}"><td>${esc(label)}</td><td>${esc(value)}</td></tr>`).join("")
            }<tr class="grand"><td>Total ${esc(cur)}</td><td>${esc(fmtMoney(totals.total, cur))}</td></tr>`;

        const noteBlocks = [
            ["Notes", doc.notes],
            ["Terms & conditions", doc.terms],
            ["Payment details", doc.payment]
        ].filter(([, body]) => String(body || "").trim());
        $("#pvNotes").innerHTML = noteBlocks.map(([title, body]) =>
            `<section><h3>${esc(title)}</h3><p>${escLines(body)}</p></section>`).join("");

        $("#pvEfris").textContent = doc.taxEnabled
            ? "Not an EFRIS fiscal document. It has no URA-issued FDN, verification code or QR code. Fiscalise the transaction separately through EFRIS where required."
            : "Not an EFRIS fiscal document. No tax has been applied here; fiscalise the transaction separately through EFRIS where required.";

        renderWarning(doc);
    }

    function renderAll() {
        renderFields();
        renderItems();
        renderList();
        renderPreview();
    }

    /* ---------- input wiring ---------- */
    document.addEventListener("input", event => {
        const el = event.target;
        const doc = active();
        if (el.dataset.doc) {
            const path = el.dataset.doc;
            let value;
            if (el.type === "checkbox") value = el.checked;
            else if (el.type === "number") value = num(el.value);
            else value = el.value;
            if (path === "taxRate" || path === "docDiscount") value = clamp(num(value), 0, 100);
            set(doc, path, value);
            save();
            if (["currency", "taxRate", "taxEnabled", "pricesIncludeTax", "docDiscount", "shipping"].includes(path)) renderItems();
            renderPreview();
            renderList();
            return;
        }
        if (el.dataset.item) {
            const index = Number(el.dataset.index);
            const item = doc.items[index];
            if (!item) return;
            item[el.dataset.item] = el.dataset.item === "desc" ? el.value : num(el.value);
            save();
            const row = el.closest(".item-row");
            if (row) row.querySelector(".item-amount").textContent = fmtMoney(compute(doc).lines[index].amount, doc.currency);
            renderPreview();
            renderList();
        }
    });

    document.addEventListener("click", event => {
        const el = event.target.closest("button");
        if (!el) return;
        const doc = active();

        if (el.dataset.jump) {
            const target = $(`#${el.dataset.jump}`);
            target.scrollIntoView({ behavior: "smooth", block: "center" });
            target.focus({ preventScroll: true });
            return;
        }
        if (el.dataset.type) {
            if (doc.type === el.dataset.type) return;
            doc.type = el.dataset.type;
            doc.number = nextNumber(doc.type);
            save();
            renderAll();
            flash(`Switched to ${doc.type}. Document number set to ${doc.number}.`);
            return;
        }
        if (el.id === "btnAddItem") {
            doc.items.push(blankItem());
            save();
            renderItems();
            renderPreview();
            $$("#itemRows .i-desc").pop()?.focus();
            return;
        }
        if (el.dataset.del !== undefined) {
            const index = Number(el.dataset.del);
            doc.items.splice(index, 1);
            if (!doc.items.length) doc.items.push(blankItem());
            save();
            renderItems();
            renderPreview();
            renderList();
            return;
        }
        if (el.id === "btnNew") {
            const fresh = blankDoc(doc.type);
            fresh.seller = { ...doc.seller };
            fresh.payment = doc.payment;
            fresh.terms = doc.terms;
            state.docs.push(fresh);
            state.activeId = fresh.id;
            save();
            renderAll();
            flash(`New ${fresh.type} ${fresh.number} created.`);
            return;
        }
        if (el.id === "btnDuplicate") { duplicate(doc.id); return; }
        if (el.dataset.dup) { duplicate(el.dataset.dup); return; }
        if (el.dataset.load) {
            state.activeId = el.dataset.load;
            save();
            renderAll();
            flash("Document loaded.");
            return;
        }
        if (el.dataset.remove) {
            const target = state.docs.find(item => item.id === el.dataset.remove);
            if (!target) return;
            if (!confirm(`Delete ${target.number || "this document"}? This cannot be undone.`)) return;
            state.docs = state.docs.filter(item => item.id !== target.id);
            if (!state.docs.length) state.docs = [blankDoc("quotation")];
            if (!state.docs.some(item => item.id === state.activeId)) state.activeId = state.docs[0].id;
            save();
            renderAll();
            flash("Document deleted.");
            return;
        }
        if (el.id === "btnExport") { exportJSON(); return; }
        if (el.id === "btnImport") { $("#importFile").click(); return; }
        if (el.id === "btnPrint") {
            const missing = missingFields(doc);
            if (missing.length && !confirm(`Seller fields still missing: ${missing.join(", ")}.\n\nPrint anyway as a draft?`)) return;
            window.print();
            return;
        }
        if (el.id === "btnWipe") {
            if (!confirm("Delete every ForgeDesk document stored in this browser? Export first if you need a backup.")) return;
            try { localStorage.removeItem(STORE_KEY); } catch { /* ignore */ }
            state = { docs: [blankDoc("quotation")], activeId: null };
            state.activeId = state.docs[0].id;
            save();
            renderAll();
            flash("All local ForgeDesk data deleted.");
        }
    });

    function duplicate(id) {
        const source = state.docs.find(doc => doc.id === id);
        if (!source) return;
        const copy = migrateDoc(JSON.parse(JSON.stringify(source)));
        copy.id = uid();
        copy.number = nextNumber(copy.type);
        copy.issueDate = todayISO();
        copy.updated = Date.now();
        state.docs.push(copy);
        state.activeId = copy.id;
        save();
        renderAll();
        flash(`Duplicated as ${copy.number}.`);
    }

    function exportJSON() {
        const payload = JSON.stringify({ app: "forgedesk", version: 1, exported: new Date().toISOString(), docs: state.docs }, null, 2);
        const blob = new Blob([payload], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `forgedesk-${todayISO()}.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        flash(`Exported ${state.docs.length} document(s) as JSON.`);
    }

    $("#importFile").addEventListener("change", event => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const parsed = JSON.parse(String(reader.result));
                const incoming = Array.isArray(parsed) ? parsed : parsed?.docs;
                if (!Array.isArray(incoming) || !incoming.length) throw new Error("no documents");
                const docs = incoming.map(migrateDoc);
                const existing = new Set(state.docs.map(doc => doc.id));
                docs.forEach(doc => { if (existing.has(doc.id)) doc.id = uid(); });
                state.docs = state.docs.concat(docs);
                state.activeId = docs[0].id;
                save();
                renderAll();
                flash(`Imported ${docs.length} document(s).`);
            } catch {
                flash("Import failed: that file is not a ForgeDesk JSON export.");
            }
            event.target.value = "";
        };
        reader.onerror = () => flash("Import failed: the file could not be read.");
        reader.readAsText(file);
    });

    load();
    renderAll();
    flash(`${state.docs.length} document(s) in this browser. Autosave on.`);
})();
