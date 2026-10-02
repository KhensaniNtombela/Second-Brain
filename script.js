document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    /* =========================================================
       AI SECOND BRAIN
       FULL FRONTEND LOGIC
       ========================================================= */

    const STORAGE_KEYS = {
        sessions: "secondBrainSessions",
        tasks: "secondBrainTasks",
        currentSession: "secondBrainCurrentSession",
        sidebar: "secondBrainSidebarCollapsed"
    };

    function resolveApiEndpoint() {

        if (
            window.location.protocol === "file:" ||
            window.location.origin === "null"
        ) {
            return "http://localhost:3000/api/generate";
        }

        return "/api/generate";
    }

    const API_ENDPOINT = resolveApiEndpoint();


    /* =========================================================
       DOM
       ========================================================= */

    const $ = id => document.getElementById(id);


    /* =========================================================
       PAGES
       ========================================================= */

    const homePage = $("homePage");
    const contentStudioPage = $("contentStudioPage");
    const quickCapturePage = $("quickCapturePage");
    const searchPage = $("searchPage");
    const askAnythingPage = $("askAnythingPage");


    /* =========================================================
       SIDEBAR
       ========================================================= */

    const sidebarToggle = $("sidebarToggle");
    const newSessionButton = $("newSessionButton");
    const historyList = $("historyList");


    /* =========================================================
       CONTENT STUDIO
       ========================================================= */

    const contentPrompt = $("contentPrompt");
    const generateButton = $("generateButton");
    const fileUpload = $("fileUpload");
    const uploadButton = $("uploadButton");
    const selectedFile = $("selectedFile");
    const conversation = $("conversation");
    const composerHint = $("composerHint");
    const currentSessionTitle = $("currentSessionTitle");

    const contentTabs =
        document.querySelectorAll(".content-type");


    /* =========================================================
       QUICK CAPTURE
       ========================================================= */

    const captureInput = $("captureInput");
    const captureButton = $("captureButton");
    const captureMessage = $("captureMessage");
    const prioritySelect = $("priority");
    const taskList = $("taskList");
    const taskCount = $("taskCount");


    /* =========================================================
       SEARCH
       ========================================================= */

    const sessionSearchInput = $("sessionSearchInput");
    const sessionSearchResults = $("sessionSearchResults");


    /* =========================================================
       ASK ANYTHING
       ========================================================= */

    const askConversation = $("askConversation");
    const askInput = $("askInput");
    const askSendButton = $("askSendButton");
    const askFileInput = $("askFileInput");
    const askUploadButton = $("askUploadButton");
    const askFileName = $("askFileName");


    /* =========================================================
       CONTENT MODES
       ========================================================= */

    const CONTENT_MODES = {

        text: {
            label: "Text",
            icon: "✎",
            placeholder:
                "Describe the content you want to create...",
            hint:
                "Describe what you want to write. You can use natural language."
        },

        image: {
            label: "Image",
            icon: "▧",
            placeholder:
                "Describe the image you want to create...",
            hint:
                "Describe the image you want to create or edit."
        },

        code: {
            label: "Code",
            icon: "⌘",
            placeholder:
                "Describe the code you want to create...",
            hint:
                "Describe the application, function or feature you want to build."
        }

    };


    /* =========================================================
       STATE
       ========================================================= */

    let sessions =
        loadStorage(
            STORAGE_KEYS.sessions,
            []
        );

    let tasks =
        loadStorage(
            STORAGE_KEYS.tasks,
            []
        );

    let currentSession = null;

    let currentSessionId =
        localStorage.getItem(
            STORAGE_KEYS.currentSession
        ) || null;

    let selectedContentType = "text";

    let selectedFiles = {
        text: null,
        image: null,
        code: null
    };

    let isGenerating = false;
    let isAsking = false;

    let askMessages = [];
    let askFile = null;

    let currentPage = "home";
    let previousPage = null;


    /* =========================================================
       STORAGE
       ========================================================= */

    function loadStorage(key, fallback) {

        try {

            const value =
                localStorage.getItem(key);

            if (!value) {
                return fallback;
            }

            return JSON.parse(value);

        } catch (error) {

            console.error(
                `Could not load ${key}`,
                error
            );

            return fallback;
        }
    }


    function saveStorage(key, value) {

        try {

            localStorage.setItem(
                key,
                JSON.stringify(value)
            );

        } catch (error) {

            console.error(
                `Could not save ${key}`,
                error
            );
        }
    }


    /* =========================================================
       HELPERS
       ========================================================= */

    function generateId(prefix) {

        return (
            prefix +
            "-" +
            Date.now() +
            "-" +
            Math.random()
                .toString(36)
                .slice(2, 9)
        );
    }


    function escapeHTML(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function formatText(value) {

        const codeBlocks = [];
        const inlineCode = [];
        const codeToken = "SBMDTOKEN";

        const source =
            String(value ?? "")
                .replace(/\r\n?/g, "\n")
                .replace(
                    /```([^\n]*)\n([\s\S]*?)```/g,
                    (match, language, code) => {

                        const index =
                            codeBlocks.length;

                        codeBlocks.push(
                            `<pre class="markdown-code"><code>${escapeHTML(
                                code.replace(/\n$/, "")
                            )}</code></pre>`
                        );

                        return `\n${codeToken}${index}END\n`;
                    }
                );

        const lines =
            escapeHTML(source)
                .split("\n");

        const formatInline = text => {

            let html =
                text.replace(
                    /`([^`]+)`/g,
                    (match, code) => {

                        const token =
                            `SBINLINE${inlineCode.length}END`;

                        inlineCode.push(
                            `<code>${code}</code>`
                        );

                        return token;
                    }
                );

            html = html
                .replace(
                    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
                    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
                )
                .replace(
                    /\*\*(.+?)\*\*/g,
                    "<strong>$1</strong>"
                )
                .replace(
                    /__(.+?)__/g,
                    "<strong>$1</strong>"
                )
                .replace(
                    /(?<!\*)\*([^*\n]+)\*(?!\*)/g,
                    "<em>$1</em>"
                )
                .replace(
                    /(?<!_)_([^_\n]+)_(?!_)/g,
                    "<em>$1</em>"
                );

            inlineCode.forEach(
                (code, index) => {

                    html = html.replace(
                        `SBINLINE${index}END`,
                        code
                    );
                }
            );

            return html;
        };

        const isBlockStart = line =>
            /^\s*(?:#{1,6}\s|[-*+]\s+|\d+[.)]\s+|>\s?|(?:-{3,}|\*{3,}|_{3,})\s*$|SBMDTOKEN\d+END$)/
                .test(line);

        const blocks = [];
        let index = 0;

        while (index < lines.length) {

            const line = lines[index];
            const trimmed = line.trim();

            if (!trimmed) {
                index += 1;
                continue;
            }

            const codeMatch =
                trimmed.match(/^SBMDTOKEN(\d+)END$/);

            if (codeMatch) {
                blocks.push(codeBlocks[Number(codeMatch[1])]);
                index += 1;
                continue;
            }

            const heading =
                trimmed.match(/^(#{1,6})\s+(.+?)\s*#*$/);

            if (heading) {
                const level = heading[1].length;
                blocks.push(
                    `<h${level}>${formatInline(heading[2])}</h${level}>`
                );
                index += 1;
                continue;
            }

            if (/^(?:-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
                blocks.push("<hr>");
                index += 1;
                continue;
            }

            if (/^[-*+]\s+/.test(trimmed)) {
                const items = [];

                while (
                    index < lines.length &&
                    /^\s*[-*+]\s+/.test(lines[index])
                ) {
                    items.push(
                        `<li>${formatInline(
                            lines[index].trim().replace(/^[-*+]\s+/, "")
                        )}</li>`
                    );
                    index += 1;
                }

                blocks.push(`<ul>${items.join("")}</ul>`);
                continue;
            }

            if (/^\d+[.)]\s+/.test(trimmed)) {
                const items = [];

                while (
                    index < lines.length &&
                    /^\s*\d+[.)]\s+/.test(lines[index])
                ) {
                    items.push(
                        `<li>${formatInline(
                            lines[index].trim().replace(/^\d+[.)]\s+/, "")
                        )}</li>`
                    );
                    index += 1;
                }

                blocks.push(`<ol>${items.join("")}</ol>`);
                continue;
            }

            if (/^>\s?/.test(trimmed)) {
                const quote = [];

                while (
                    index < lines.length &&
                    /^\s*>\s?/.test(lines[index])
                ) {
                    quote.push(
                        formatInline(
                            lines[index].trim().replace(/^>\s?/, "")
                        )
                    );
                    index += 1;
                }

                blocks.push(
                    `<blockquote><p>${quote.join("<br>")}</p></blockquote>`
                );
                continue;
            }

            const paragraph = [formatInline(trimmed)];
            index += 1;

            while (
                index < lines.length &&
                lines[index].trim() &&
                !isBlockStart(lines[index])
            ) {
                paragraph.push(
                    formatInline(lines[index].trim())
                );
                index += 1;
            }

            blocks.push(`<p>${paragraph.join("<br>")}</p>`);
        }

        return blocks.join("");
    }


    function autoGrow(element) {

        if (!element) {
            return;
        }

        element.style.height = "auto";

        element.style.height =
            Math.min(
                element.scrollHeight,
                180
            ) + "px";
    }


    function readFileAsDataURL(file) {

        return new Promise(
            (resolve, reject) => {

                const reader =
                    new FileReader();

                reader.onload =
                    () =>
                        resolve(
                            reader.result
                        );

                reader.onerror =
                    () =>
                        reject(
                            reader.error
                        );

                reader.readAsDataURL(file);
            }
        );
    }


    function startOfDay(date) {

        const result =
            new Date(date);

        result.setHours(
            0,
            0,
            0,
            0
        );

        return result;
    }


    function addDays(date, days) {

        const result =
            new Date(date);

        result.setDate(
            result.getDate() + days
        );

        return result;
    }


    function isSameDay(a, b) {

        return (
            new Date(a).toDateString() ===
            new Date(b).toDateString()
        );
    }


    function daysOld(date) {

        return Math.max(
            0,
            Math.floor(
                (
                    startOfDay(new Date()) -
                    startOfDay(date)
                ) / 86400000
            )
        );
    }


    function relativeDate(date) {

        const minutes =
            Math.floor(
                (
                    Date.now() -
                    new Date(date).getTime()
                ) / 60000
            );

        if (minutes < 1) {
            return "Just now";
        }

        if (minutes < 60) {
            return `${minutes}m ago`;
        }

        const hours =
            Math.floor(minutes / 60);

        if (hours < 24) {
            return `${hours}h ago`;
        }

        const days =
            Math.floor(hours / 24);

        if (days < 7) {
            return `${days}d ago`;
        }

        return new Date(date)
            .toLocaleDateString();
    }


    /* =========================================================
       NORMALISE DATA
       ========================================================= */

    function normaliseData() {

        if (!Array.isArray(sessions)) {
            sessions = [];
        }

        if (!Array.isArray(tasks)) {
            tasks = [];
        }


        /*
         * Remove completely empty sessions.
         */

        sessions =
            sessions.filter(
                session =>
                    Array.isArray(
                        session.messages
                    ) &&
                    session.messages.length > 0
            );


        /*
         * Normalise sessions.
         */

        sessions =
            sessions.map(
                session => {

                    const firstUserMessage =
                        session.messages.find(
                            message =>
                                message.role ===
                                "user"
                        );


                    /*
                     * IMPORTANT:
                     *
                     * The session mode is taken
                     * from the FIRST user request,
                     * not the last message.
                     *
                     * This fixes old sessions
                     * being labelled incorrectly.
                     */

                    const sessionMode =
                        firstUserMessage?.mode ||
                        session
                            .lastActivity
                            ?.mode ||
                        "text";


                    return {

                        id:
                            session.id ||
                            generateId(
                                "session"
                            ),

                        title:
                            session.title ||
                            firstUserMessage
                                ?.content ||
                            "New Session",

                        createdAt:
                            session.createdAt ||
                            new Date()
                                .toISOString(),

                        messages:
                            Array.isArray(
                                session.messages
                            )
                                ? session.messages
                                : [],

                        mode:
                            sessionMode,

                        drafts: {

                            text:
                                session
                                    .drafts
                                    ?.text ||
                                "",

                            image:
                                session
                                    .drafts
                                    ?.image ||
                                "",

                            code:
                                session
                                    .drafts
                                    ?.code ||
                                ""

                        },

                        files: {

                            text:
                                session
                                    .files
                                    ?.text ||
                                null,

                            image:
                                session
                                    .files
                                    ?.image ||
                                null,

                            code:
                                session
                                    .files
                                    ?.code ||
                                null

                        },

                        lastActivity:
                            session
                                .lastActivity ||
                            null,

                        isSaved:
                            true
                    };
                }
            );


        tasks =
            tasks.map(
                task => ({

                    id:
                        task.id ||
                        generateId("task"),

                    title:
                        task.title ||
                        "Untitled task",

                    priority:
                        task.priority ||
                        "medium",

                    createdAt:
                        task.createdAt ||
                        new Date()
                            .toISOString(),

                    dueDate:
                        task.dueDate ||
                        null,

                    completed:
                        Boolean(
                            task.completed
                        ),

                    completedAt:
                        task.completedAt ||
                        null
                })
            );


        saveStorage(
            STORAGE_KEYS.sessions,
            sessions
        );

        saveStorage(
            STORAGE_KEYS.tasks,
            tasks
        );
    }


    /* =========================================================
       NEW DRAFT
       ========================================================= */

    function createDraftSession() {

        return {

            id:
                generateId("draft"),

            title:
                "New Session",

            createdAt:
                new Date()
                    .toISOString(),

            messages: [],

            mode:
                selectedContentType,

            drafts: {

                text: "",
                image: "",
                code: ""

            },

            files: {

                text: null,
                image: null,
                code: null

            },

            lastActivity:
                null,

            isSaved:
                false
        };
    }


    /* =========================================================
       INITIAL SESSION
       ========================================================= */
function initialiseSession() {

    /*
     * Always start with a clean temporary workspace
     * when the application is loaded or refreshed.
     *
     * Saved sessions remain in History and can still
     * be opened by clicking them.
     */

    currentSession =
        createDraftSession();

    currentSessionId =
        null;

    localStorage.removeItem(
        STORAGE_KEYS.currentSession
    );

    selectedContentType =
        "text";

    selectedFiles = {

        text: null,

        image: null,

        code: null

    };
}


     /* =========================================================
         PROMOTE THE DRAFT ON ITS FIRST REQUEST
         ========================================================= */
function generateSessionTitle(prompt) {
    const cleaned = prompt
        .replace(/\s+/g, " ")
        .trim();

    if (!cleaned) {
        return "New Session";
    }

    const lower = cleaned.toLowerCase();

    const titleRules = [
        {
            keywords: ["linkedin", "linked in"],
            title: "LinkedIn Post"
        },
        {
            keywords: ["email", "e-mail"],
            title: "Email Draft"
        },
        {
            keywords: ["resume", "cv"],
            title: "CV / Resume"
        },
        {
            keywords: ["cover letter"],
            title: "Cover Letter"
        },
        {
            keywords: ["code", "javascript", "python", "html", "css"],
            title: "Code Generation"
        },
        {
            keywords: ["image", "picture", "photo", "illustration"],
            title: "Image Generation"
        },
        {
            keywords: ["summarize", "summary", "summarise"],
            title: "Summary"
        },
        {
            keywords: ["explain", "explanation"],
            title: "Explanation"
        },
        {
            keywords: ["brainstorm", "ideas", "idea"],
            title: "Brainstorming"
        },
        {
            keywords: ["rewrite", "rephrase", "edit"],
            title: "Writing & Editing"
        },
        {
            keywords: ["translate", "translation"],
            title: "Translation"
        },
        {
            keywords: ["plan", "planning"],
            title: "Planning"
        }
    ];

    const matchedRule = titleRules.find(rule =>
        rule.keywords.some(keyword =>
            lower.includes(keyword)
        )
    );

    if (matchedRule) {
        return matchedRule.title;
    }

    const words = cleaned
        .split(" ")
        .slice(0, 5);

    let title = words.join(" ");

    if (title.length > 32) {
        title = title.slice(0, 32).trim();
    }

    return title.charAt(0).toUpperCase() + title.slice(1);
}
    function createSessionForRequest(
        mode,
        prompt,
        file
    ) {

        const session =
            currentSession ||
            createDraftSession();

        const isFirstRequest =
            !session.isSaved;

        const timestamp =
            new Date()
                .toISOString();


        if (isFirstRequest) {

            session.id =
                generateId(
                    "session"
                );
            session.title =
                prompt
                    ? generateSessionTitle(prompt)
                    : (
                        file?.name ||
                        "New Session"
                    );

            session.createdAt =
                timestamp;

            session.mode =
                mode;

            session.isSaved =
                true;

            sessions.unshift(
                session
            );
        }


        session.lastActivity = {

            type:
                "content",

            mode:
                mode,

            timestamp:
                timestamp
        };


        const sessionIndex =
            sessions.indexOf(
                session
            );

        if (sessionIndex > 0) {

            sessions.splice(
                sessionIndex,
                1
            );

            sessions.unshift(
                session
            );
        }


        /*
         * Make it the active session.
         */

        currentSession =
            session;

        currentSessionId =
            session.id;


        localStorage.setItem(
            STORAGE_KEYS.currentSession,
            session.id
        );


        return session;
    }


    /* =========================================================
       SAVE DRAFT
       ========================================================= */

    function saveCurrentDraft() {

        if (
            !currentSession ||
            !currentSession.isSaved
        ) {

            return;
        }


        currentSession.drafts ??= {

            text: "",
            image: "",
            code: ""

        };


        currentSession.files ??= {

            text: null,
            image: null,
            code: null

        };


        currentSession.drafts[
            selectedContentType
        ] =
            contentPrompt?.value || "";


        currentSession.files[
            selectedContentType
        ] =
            selectedFiles[
                selectedContentType
            ] || null;


        saveStorage(
            STORAGE_KEYS.sessions,
            sessions
        );
    }


    /* =========================================================
       LOAD DRAFT
       ========================================================= */

    function loadCurrentModeDraft() {

        if (
            !currentSession ||
            !contentPrompt
        ) {

            return;
        }


        contentPrompt.value =
            currentSession
                .drafts
                ?.[selectedContentType] ||
            "";


        selectedFiles[
            selectedContentType
        ] =
            currentSession
                .files
                ?.[selectedContentType] ||
            null;


        renderSelectedFile();

        autoGrow(
            contentPrompt
        );
    }


    /* =========================================================
       SESSION TITLE
       ========================================================= */

    function updateSessionUI() {

        if (!currentSessionTitle) {
            return;
        }

        currentSessionTitle.textContent =
            currentSession?.isSaved
                ? "Current session"
                : "New session";
    }


    /* =========================================================
       PAGE NAVIGATION
       ========================================================= */

    function showPage(
        pageName,
        rememberPrevious = true
    ) {

        const pages = {

            home:
                homePage,

            "content-studio":
                contentStudioPage,

            "quick-capture":
                quickCapturePage,

            search:
                searchPage,

            "ask-anything":
                askAnythingPage
        };


        const page =
            pages[pageName];


        if (!page) {
            return;
        }


        if (
            rememberPrevious &&
            currentPage !== pageName
        ) {

            previousPage =
                currentPage;
        }


        currentPage =
            pageName;


        Object.entries(pages)
            .forEach(
                ([name, pageElement]) => {

                    if (!pageElement) {
                        return;
                    }


                    pageElement.classList.toggle(
                        "page-hidden",
                        name !== pageName
                    );
                }
            );


        document
            .querySelectorAll(
                "[data-nav]"
            )
            .forEach(
                item => {

                    item.classList.toggle(
                        "nav-active",
                        item.dataset.nav ===
                        pageName
                    );
                }
            );


        if (
            pageName === "search"
        ) {

            searchSessions(
                sessionSearchInput?.value ||
                ""
            );
        }


        if (
            pageName === "ask-anything"
        ) {

            renderAskConversation();
        }


        ensureBackButton(
            pageName
        );
    }


    /* =========================================================
       BACK BUTTON
       ========================================================= */

    function ensureBackButton(
        pageName
    ) {

        const pages = {

            home:
                homePage,

            "content-studio":
                contentStudioPage,

            "quick-capture":
                quickCapturePage,

            search:
                searchPage,

            "ask-anything":
                askAnythingPage
        };


        const page =
            pages[pageName];


        if (!page) {
            return;
        }


        if (
            pageName === "home"
        ) {

            page
                .querySelectorAll(
                    ".dynamic-back-button"
                )
                .forEach(
                    button =>
                        button.remove()
                );

            return;
        }


        let backButton =
            page.querySelector(
                ".dynamic-back-button"
            );


        if (!backButton) {

            backButton =
                document.createElement(
                    "button"
                );

            backButton.type =
                "button";

            backButton.className =
                "dynamic-back-button";

            backButton.innerHTML =
                "←";

            backButton.title =
                "Back";

            page.prepend(
                backButton
            );
        }


        backButton.onclick =
            () => {

                const destination =
                    previousPage &&
                    previousPage !==
                    currentPage
                        ? previousPage
                        : "home";


                showPage(
                    destination,
                    false
                );
            };
    }


    /* =========================================================
       OPEN CONTENT STUDIO
       ========================================================= */

    function openContentStudio(
        requestedMode = "text"
    ) {

        selectedContentType =
            CONTENT_MODES[
                requestedMode
            ]
                ? requestedMode
                : "text";


        if (!currentSession) {

            currentSession =
                createDraftSession();

            currentSessionId =
                null;
        }


        updateActiveTab();

        loadCurrentModeDraft();

        updateComposerUI();

        renderConversation();

        updateSessionUI();


        showPage(
            "content-studio"
        );


        setTimeout(
            () => {

                contentPrompt?.focus();

            },
            50
        );
    }


    /* =========================================================
       CONTENT TABS
       ========================================================= */

    function updateActiveTab() {

        contentTabs.forEach(
            tab => {

                tab.classList.toggle(
                    "active",
                    tab.dataset.type ===
                    selectedContentType
                );
            }
        );
    }


    function updateComposerUI() {

        const mode =
            CONTENT_MODES[
                selectedContentType
            ];


        if (!mode) {
            return;
        }


        if (contentPrompt) {

            contentPrompt.placeholder =
                mode.placeholder;

            autoGrow(
                contentPrompt
            );
        }


        if (composerHint) {

            composerHint.textContent =
                mode.hint;
        }


        if (generateButton) {

            generateButton.disabled =
                false;

            generateButton.textContent =
                "➤";
        }
    }


    /* =========================================================
       NEW SESSION
       ========================================================= */

    function createNewSession() {

        /*
         * This is ONLY a temporary draft.
         *
         * It will not appear in History
         * until the user sends something.
         */

        currentSession =
            createDraftSession();

        currentSessionId =
            null;


        localStorage.removeItem(
            STORAGE_KEYS.currentSession
        );


        selectedContentType =
            "text";


        selectedFiles = {

            text: null,
            image: null,
            code: null

        };


        if (contentPrompt) {

            contentPrompt.value =
                "";
        }


        clearSelectedFile();


        updateActiveTab();

        updateComposerUI();

        renderConversation();

        updateSessionUI();


        showPage(
            "content-studio"
        );


        contentPrompt?.focus();
    }


    /* =========================================================
       LOAD HISTORY SESSION
       ========================================================= */

    function loadSession(
        sessionId
    ) {

        const session =
            sessions.find(
                item =>
                    item.id ===
                    sessionId
            );


        if (!session) {
            return;
        }


        currentSession =
            session;

        currentSessionId =
            session.id;


        localStorage.setItem(
            STORAGE_KEYS.currentSession,
            session.id
        );


        selectedContentType =
            session.mode ||
            session
                .messages
                .find(
                    message =>
                        message.role ===
                        "user"
                )
                ?.mode ||
            "text";


        selectedFiles = {

            text:
                session.files
                    ?.text ||
                null,

            image:
                session.files
                    ?.image ||
                null,

            code:
                session.files
                    ?.code ||
                null
        };


        updateActiveTab();

        loadCurrentModeDraft();

        updateComposerUI();

        updateSessionUI();

        renderConversation();


        showPage(
            "content-studio"
        );


        renderHistory();
    }


    /* =========================================================
       RENAME SESSION
       ========================================================= */

    function renameSession(
        sessionId
    ) {

        const session =
            sessions.find(
                item =>
                    item.id ===
                    sessionId
            );


        if (!session) {
            return;
        }


        const newTitle =
            window.prompt(
                "Enter a new session name:",
                session.title
            );


        if (
            newTitle &&
            newTitle.trim()
        ) {

            session.title =
                newTitle.trim();


            saveStorage(
                STORAGE_KEYS.sessions,
                sessions
            );


            updateSessionUI();

            renderHistory();
        }
    }


    /* =========================================================
       DELETE SESSION
       ========================================================= */

    function deleteSession(
        sessionId
    ) {

        const session =
            sessions.find(
                item =>
                    item.id ===
                    sessionId
            );


        if (!session) {
            return;
        }


        const confirmed =
            window.confirm(
                `Delete "${session.title}"?`
            );


        if (!confirmed) {
            return;
        }


        sessions =
            sessions.filter(
                item =>
                    item.id !==
                    sessionId
            );


        saveStorage(
            STORAGE_KEYS.sessions,
            sessions
        );


        if (
            currentSession?.id ===
            sessionId
        ) {

            currentSession =
                createDraftSession();

            currentSessionId =
                null;


            localStorage.removeItem(
                STORAGE_KEYS.currentSession
            );


            selectedContentType =
                "text";


            selectedFiles = {

                text: null,
                image: null,
                code: null

            };


            updateActiveTab();

            loadCurrentModeDraft();

            updateComposerUI();

            updateSessionUI();

            renderConversation();
        }


        renderHistory();
    }


    /* =========================================================
       HISTORY
       ========================================================= */

    function renderHistory() {

        if (!historyList) {
            return;
        }


        /*
         * Remove empty sessions.
         */

        sessions =
            sessions.filter(
                session =>
                    Array.isArray(
                        session.messages
                    ) &&
                    session.messages.length > 0
            );


        saveStorage(
            STORAGE_KEYS.sessions,
            sessions
        );


        if (!sessions.length) {

            historyList.innerHTML = `

                <div class="history-empty">

                    No sessions yet.

                </div>

            `;

            return;
        }


        historyList.innerHTML =
            sessions
                .map(
                    session => {

                        /*
                         * IMPORTANT:
                         *
                         * Use the session's stored
                         * mode.
                         *
                         * NEVER use the currently
                         * selected tab.
                         */

                        const mode =
                            session.mode ||
                            session
                                .messages
                                .find(
                                    message =>
                                        message.role ===
                                        "user"
                                )
                                ?.mode ||
                            "text";


                        const modeInfo =
                            CONTENT_MODES[
                                mode
                            ] ||
                            CONTENT_MODES.text;


                        return `

                            <div
                                class="history-item ${
                                    currentSession?.id ===
                                    session.id
                                        ? "active"
                                        : ""
                                }"
                                data-session-id="${escapeHTML(
                                    session.id
                                )}"
                            >

                                <div class="history-main">

                                    <div class="history-title">

                                        ${escapeHTML(
                                            session.title
                                        )}

                                    </div>


                                    <div class="history-meta">

                                        <span
                                            class="history-mode history-mode-${escapeHTML(
                                                mode
                                            )}"
                                        >

                                            ${modeInfo.icon}

                                            ${modeInfo.label}

                                        </span>


                                        <span>

                                            ${relativeDate(
                                                session.createdAt
                                            )}

                                        </span>

                                    </div>

                                </div>


                                <div class="history-actions">

                                    <button
                                        type="button"
                                        data-rename-session="${escapeHTML(
                                            session.id
                                        )}"
                                        title="Rename session"
                                    >

                                        ✎

                                    </button>


                                    <button
                                        type="button"
                                        data-delete-session="${escapeHTML(
                                            session.id
                                        )}"
                                        title="Delete session"
                                    >

                                        🗑

                                    </button>

                                </div>

                            </div>

                        `;
                    }
                )
                .join("");


        historyList
            .querySelectorAll(
                ".history-item"
            )
            .forEach(
                item => {

                    item.addEventListener(
                        "click",
                        event => {

                            if (
                                event.target.closest(
                                    "button"
                                )
                            ) {

                                return;
                            }


                            loadSession(
                                item.dataset
                                    .sessionId
                            );
                        }
                    );
                }
            );


        historyList
            .querySelectorAll(
                "[data-rename-session]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        event => {

                            event.stopPropagation();

                            renameSession(
                                button.dataset
                                    .renameSession
                            );
                        }
                    );
                }
            );


        historyList
            .querySelectorAll(
                "[data-delete-session]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        event => {

                            event.stopPropagation();

                            deleteSession(
                                button.dataset
                                    .deleteSession
                            );
                        }
                    );
                }
            );
    }


    /* =========================================================
       CONTENT CONVERSATION
       ========================================================= */

    function renderConversation() {

        if (!conversation) {
            return;
        }


        if (
            !currentSession
        ) {

            conversation.innerHTML =
                "";

            return;
        }


        /*
         * For the new history structure,
         * each session normally contains
         * one request and its AI response.
         *
         * We still filter by mode so old
         * sessions don't leak into another tab.
         */

        const messages =
            currentSession.messages
                ?.filter(
                    message =>
                        message.mode ===
                        selectedContentType
                ) ||
            [];


        if (!messages.length) {

            const mode =
                CONTENT_MODES[
                    selectedContentType
                ];


            conversation.innerHTML = `

                <div class="conversation-empty">

                    <div class="empty-icon">

                        ${mode.icon}

                    </div>


                    <h3>

                        ${mode.label}

                    </h3>


                    <p>

                        ${
                            selectedContentType ===
                            "image"

                                ? "Describe the image you want to create."

                                : selectedContentType ===
                                  "code"

                                    ? "Describe the application, function or feature you want to build."

                                    : "Ask the AI to write, rewrite, summarize, brainstorm, explain or transform content."
                        }

                    </p>

                </div>

            `;


            return;
        }


        conversation.innerHTML =
            messages
                .map(
                    message =>
                        renderContentMessage(
                            message
                        )
                )
                .join("") +
            (isGenerating
                ? renderRequestLoading()
                : "");


        conversation
            .querySelectorAll(
                "[data-copy-code]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        async () => {

                            const message =
                                currentSession
                                    ?.messages
                                    ?.find(
                                        item =>
                                            item.id ===
                                            button
                                                .dataset
                                                .copyCode
                                    );


                            if (
                                !message?.code
                            ) {

                                return;
                            }


                            try {

                                await navigator
                                    .clipboard
                                    .writeText(
                                        message.code
                                    );


                                button.textContent =
                                    "Copied!";


                                setTimeout(
                                    () => {

                                        button.textContent =
                                            "Copy code";

                                    },
                                    1500
                                );

                            } catch {

                                button.textContent =
                                    "Copy failed";
                            }
                        }
                    );
                }
            );


        conversation.scrollTop =
            conversation.scrollHeight;
    }


    function renderRequestLoading() {

        return `

            <div
                class="request-loading"
                role="status"
                aria-label="Request is loading"
            >

                <span class="request-loading-animation" aria-hidden="true">
                    <span class="request-loading-brain">🧠</span>
                    <span class="request-loading-legs">
                        <i></i>
                        <i></i>
                    </span>
                    <span class="request-loading-landing"></span>
                    <span class="request-loading-landing"></span>
                </span>

                <span>Working on your request...</span>

            </div>

        `;
    }


    /* =========================================================
       CONTENT MESSAGE
       ========================================================= */

    function renderContentMessage(
        message
    ) {

        let body = "";


        if (
            message.content
        ) {

            body += `

                <div class="message-text">

                    ${formatText(
                        message.content
                    )}

                </div>

            `;
        }


        if (
            message.file
        ) {

            body += `

                <div class="ask-file">

                    📎

                    ${escapeHTML(
                        message.file.name
                    )}

                </div>

            `;
        }


        if (
            message.image
        ) {

            body += `

                <div class="generated-image-container">

                    <img
                        src="${escapeHTML(
                            message.image
                        )}"
                        alt="AI generated image"
                        class="generated-image"
                    >


                    <br>


                    <a
                        href="${escapeHTML(
                            message.image
                        )}"
                        download="ai-second-brain-image.png"
                    >

                        Download image

                    </a>

                </div>

            `;
        }


        if (
            message.code
        ) {

            body += `

                <pre class="generated-code">

                    <code>

                        ${escapeHTML(
                            message.code
                        )}

                    </code>

                </pre>


                <button
                    type="button"
                    class="copy-code-button"
                    data-copy-code="${escapeHTML(
                        message.id
                    )}"
                >

                    Copy code

                </button>

            `;
        }


        return `

            <article
                class="conversation-message ${
                    message.role === "user"
                        ? "user-message"
                        : "assistant-message"
                }"
            >

                <div class="message-role">

                    ${
                        message.role === "user"
                            ? "You"
                            : "AI Second Brain"
                    }

                </div>


                <div class="message-content">

                    ${body}

                </div>

            </article>

        `;
    }


    /* =========================================================
       CONTENT FILE UPLOAD
       ========================================================= */

    function setupContentFileUpload() {

        uploadButton
            ?.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    fileUpload?.click();
                }
            );


        fileUpload
            ?.addEventListener(
                "change",
                async event => {

                    const file =
                        event.target
                            .files?.[0];


                    if (!file) {
                        return;
                    }


                    try {

                        const data =
                            await readFileAsDataURL(
                                file
                            );


                        selectedFiles[
                            selectedContentType
                        ] = {

                            name:
                                file.name,

                            type:
                                file.type,

                            size:
                                file.size,

                            data
                        };


                        saveCurrentDraft();

                        renderSelectedFile();

                    } catch (error) {

                        console.error(
                            error
                        );
                    }


                    event.target.value =
                        "";
                }
            );
    }


    function renderSelectedFile() {

        if (!selectedFile) {
            return;
        }


        const file =
            selectedFiles[
                selectedContentType
            ];


        if (!file) {

            selectedFile.hidden =
                true;

            selectedFile.innerHTML =
                "";

            return;
        }


        selectedFile.hidden =
            false;


        selectedFile.innerHTML = `

            📎

            ${escapeHTML(
                file.name
            )}


            <button
                type="button"
                id="removeSelectedFile"
                title="Remove file"
            >

                ×

            </button>

        `;


        $("removeSelectedFile")
            ?.addEventListener(
                "click",
                () => {

                    clearSelectedFile();

                    saveCurrentDraft();
                }
            );
    }


    function clearSelectedFile() {

        selectedFiles[
            selectedContentType
        ] = null;


        if (selectedFile) {

            selectedFile.hidden =
                true;

            selectedFile.innerHTML =
                "";
        }


        if (fileUpload) {

            fileUpload.value =
                "";
        }
    }


    /* =========================================================
       GENERATE CONTENT
       ========================================================= */

    async function generateContent() {

        if (isGenerating) {
            return;
        }


        const userPrompt =
            contentPrompt
                ?.value
                .trim() ||
            "";


        const file =
            selectedFiles[
                selectedContentType
            ];


        if (
            !userPrompt &&
            !file
        ) {

            if (composerHint) {

                composerHint.textContent =
                    "Describe what you want to create first.";
            }


            contentPrompt?.focus();

            return;
        }


        const requestMode =
            selectedContentType;


        const session =
            createSessionForRequest(
                requestMode,
                userPrompt,
                file
            );


        /*
         * Add exactly ONE user request.
         */

        const userMessage = {

            id:
                generateId(
                    "message"
                ),

            role:
                "user",

            mode:
                requestMode,

            content:
                userPrompt,

            file:
                file
                    ? {

                        name:
                            file.name,

                        type:
                            file.type,

                        size:
                            file.size

                    }
                    : null,

            createdAt:
                new Date()
                    .toISOString()
        };


        session.messages.push(
            userMessage
        );


        /*
         * Clear composer.
         */

        if (contentPrompt) {

            contentPrompt.value =
                "";

            autoGrow(
                contentPrompt
            );
        }


        clearSelectedFile();


        /*
         * Save the session immediately.
         *
         * This means the History entry appears
         * exactly once.
         */

        saveStorage(
            STORAGE_KEYS.sessions,
            sessions
        );


        renderHistory();

        updateSessionUI();

        renderConversation();


        setGenerating(true);


        try {

            const result =
                await callAIBackend({

                    type:
                        requestMode,

                    prompt:
                        userPrompt,

                    file:
                        file,

                    conversation:
                        [
                            {
                                role:
                                    "user",

                                mode:
                                    requestMode,

                                content:
                                    userPrompt
                            }
                        ]

                });


            const image =
                result.image ||
                result.imageData ||
                extractImageFromGeminiResult(
                    result
                );


            let text =
                result.text ||
                result.content ||
                "";


            let code =
                result.code ||
                null;


            if (
                requestMode === "code" &&
                !code
            ) {

                code =
                    text;
            }


            if (
                !text &&
                !image &&
                !code
            ) {

                text =
                    "The AI service returned an empty response.";
            }


            /*
             * Add exactly ONE AI response
             * to this request's session.
             */

            session.messages.push({

                id:
                    generateId(
                        "message"
                    ),

                role:
                    "assistant",

                mode:
                    requestMode,

                content:
                    text,

                image:
                    image,

                code:
                    code,

                mimeType:
                    result.mimeType ||
                    "image/png",

                createdAt:
                    new Date()
                        .toISOString()
            });


            saveStorage(
                STORAGE_KEYS.sessions,
                sessions
            );


            renderConversation();

            renderHistory();

        } catch (error) {

            console.error(
                "AI generation error:",
                error
            );


            /*
             * One error response only.
             */

            session.messages.push({

                id:
                    generateId(
                        "message"
                    ),

                role:
                    "assistant",

                mode:
                    requestMode,

                isError:
                    true,

                content:
                    getAPIErrorMessage(
                        error
                    ),

                createdAt:
                    new Date()
                        .toISOString()
            });


            saveStorage(
                STORAGE_KEYS.sessions,
                sessions
            );


            renderConversation();

            renderHistory();

        } finally {

            setGenerating(false);

            contentPrompt?.focus();
        }
    }


    /* =========================================================
       GENERATING STATE
       ========================================================= */

    function setGenerating(value) {

        isGenerating =
            value;


        if (generateButton) {

            generateButton.disabled =
                value;

            generateButton.textContent =
                value
                    ? "…"
                    : "➤";
        }


        if (contentPrompt) {

            contentPrompt.disabled =
                value;
        }


        renderConversation();
    }


    /* =========================================================
       BACKEND
       ========================================================= */

    async function callAIBackend(
        payload
    ) {

        const response =
            await fetch(
                API_ENDPOINT,
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );


        if (!response.ok) {

            let errorMessage =
                `AI request failed (${response.status})`;


            try {

                const data =
                    await response.json();


                errorMessage =
                    data.error ||
                    data.message ||
                    errorMessage;

            } catch {
                // Keep default
            }


            throw new Error(
                errorMessage
            );
        }


        const data =
            await response.json();


        if (!data) {

            throw new Error(
                "The AI service returned no data."
            );
        }


        return data;
    }


    /* =========================================================
       IMAGE EXTRACTION
       ========================================================= */

    function extractImageFromGeminiResult(
        result
    ) {

        const parts =
            result
                ?.candidates
                ?.[0]
                ?.content
                ?.parts;


        if (!Array.isArray(parts)) {
            return null;
        }


        const imagePart =
            parts.find(
                part =>
                    part
                        ?.inlineData
                        ?.data
            );


        if (!imagePart) {
            return null;
        }


        const mimeType =
            imagePart
                .inlineData
                .mimeType ||
            "image/png";


        return (
            `data:${mimeType};base64,` +
            imagePart
                .inlineData
                .data
        );
    }


    /* =========================================================
       ERROR
       ========================================================= */

    function getAPIErrorMessage(
        error
    ) {

        if (
            error?.message
                ?.toLowerCase()
                ?.includes(
                    "failed to fetch"
                )
        ) {

            if (
                window.location.protocol === "file:" ||
                window.location.origin === "null"
            ) {

                return (
                    "I couldn't connect to the AI service because the app is being opened as a file. " +
                    "Open it from http://localhost:3000 or start the local server with npm start."
                );
            }

            return (
                "I couldn't connect to the AI service. " +
                "The interface is working, but the backend route /api/generate is not responding."
            );
        }


        return (
            error?.message ||
            "Something went wrong while generating your content."
        );
    }


    /* =========================================================
       COMPOSER
       ========================================================= */

    function setupComposer() {

        contentPrompt
            ?.addEventListener(
                "input",
                () => {

                    autoGrow(
                        contentPrompt
                    );


                    saveCurrentDraft();
                }
            );


        contentPrompt
            ?.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key === "Enter" &&
                        !event.shiftKey
                    ) {

                        event.preventDefault();

                        generateContent();
                    }
                }
            );


        generateButton
            ?.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    generateContent();
                }
            );
    }


    /* =========================================================
       NATURAL TASK DATE
       ========================================================= */

    function parseNaturalDate(text) {

        const lower =
            text.toLowerCase();


        const today =
            startOfDay(
                new Date()
            );


        if (
            /\btoday\b/.test(
                lower
            )
        ) {

            return today.toISOString();
        }


        if (
            /\btomorrow\b/.test(
                lower
            )
        ) {

            return addDays(
                today,
                1
            ).toISOString();
        }


        const inDays =
            lower.match(
                /\bin\s+(\d+)\s+days?\b/
            );


        if (inDays) {

            return addDays(
                today,
                Number(
                    inDays[1]
                )
            ).toISOString();
        }


        const weekdays = {

            sunday: 0,
            monday: 1,
            tuesday: 2,
            wednesday: 3,
            thursday: 4,
            friday: 5,
            saturday: 6

        };


        for (
            const [
                name,
                number
            ] of Object.entries(
                weekdays
            )
        ) {

            if (
                new RegExp(
                    `\\b${name}\\b`
                ).test(
                    lower
                )
            ) {

                let difference =
                    (
                        number -
                        today.getDay() +
                        7
                    ) % 7;


                if (
                    difference === 0
                ) {

                    difference = 7;
                }


                if (
                    /\bnext\b/.test(
                        lower
                    )
                ) {

                    difference += 7;
                }


                return addDays(
                    today,
                    difference
                ).toISOString();
            }
        }


        return null;
    }


    /* =========================================================
       TASK STATUS
       ========================================================= */

    function getTaskStatus(task) {

        if (task.completed) {
            return "completed";
        }


        if (task.dueDate) {

            const due =
                startOfDay(
                    new Date(
                        task.dueDate
                    )
                );


            const today =
                startOfDay(
                    new Date()
                );


            if (due < today) {
                return "overdue";
            }


            if (
                isSameDay(
                    due,
                    today
                )
            ) {

                return "today";
            }


            if (
                due <=
                addDays(
                    today,
                    7
                )
            ) {

                return "week";
            }


            return "upcoming";
        }


        const age =
            daysOld(
                task.createdAt
            );


        if (age === 0) {
            return "today";
        }


        if (age <= 6) {
            return "week";
        }


        if (age <= 13) {
            return "carry";
        }


        return "older";
    }


    /* =========================================================
       TASK HTML
       ========================================================= */

    function renderTaskHTML(task) {

        const status =
            getTaskStatus(task);


        const age =
            daysOld(
                task.createdAt
            );


        const createdText =
            age === 0
                ? "Created today"
                : `${age} day${
                    age === 1
                        ? ""
                        : "s"
                } old`;


        let dueText =
            createdText;


        if (task.dueDate) {

            dueText =
                "Due " +
                new Date(
                    task.dueDate
                ).toLocaleDateString(
                    undefined,
                    {

                        weekday:
                            "short",

                        month:
                            "short",

                        day:
                            "numeric"
                    }
                );
        }


        return `

            <div
                class="task-item"
                data-task-id="${escapeHTML(
                    task.id
                )}"
            >

                <input
                    type="checkbox"
                    class="task-checkbox"
                    ${
                        task.completed
                            ? "checked"
                            : ""
                    }
                >


                <div class="task-content">

                    <div
                        class="task-title ${
                            task.completed
                                ? "completed"
                                : ""
                        }"
                    >

                        ${escapeHTML(
                            task.title
                        )}

                    </div>


                    <div class="task-meta">

                        ${dueText}


                        ${
                            status === "carry"
                                ? `
                                    ·
                                    <span class="task-warning">
                                        Carried over
                                    </span>
                                `
                                : ""
                        }


                        ${
                            status === "overdue"
                                ? `
                                    ·
                                    <span class="task-warning">
                                        Overdue
                                    </span>
                                `
                                : ""
                        }

                    </div>

                </div>


                <span
                    class="task-priority priority-${escapeHTML(
                        task.priority
                    )}"
                >

                    ${
                        task.priority === "medium"
                            ? "Normal"
                            : escapeHTML(
                                task.priority
                            )
                    }

                </span>


                <button
                    type="button"
                    class="delete-task-button"
                    data-delete-task="${escapeHTML(
                        task.id
                    )}"
                    title="Delete task"
                    aria-label="Delete task"
                >

                    🗑

                </button>

            </div>

        `;
    }


    /* =========================================================
       RENDER TASKS
       ========================================================= */

    function renderTasks() {

        if (!taskList) {
            return;
        }


        const activeTasks =
            tasks.filter(
                task =>
                    !task.completed
            );


        const completedTasks =
            tasks.filter(
                task =>
                    task.completed
            );


        const groups = [

            [
                "Overdue",

                activeTasks.filter(
                    task =>
                        getTaskStatus(task) ===
                        "overdue"
                )
            ],

            [
                "Today",

                activeTasks.filter(
                    task =>
                        getTaskStatus(task) ===
                        "today"
                )
            ],

            [
                "This week",

                activeTasks.filter(
                    task =>
                        getTaskStatus(task) ===
                        "week"
                )
            ],

            [
                "Carried over",

                activeTasks.filter(
                    task =>
                        getTaskStatus(task) ===
                        "carry"
                )
            ],

            [
                "Upcoming",

                activeTasks.filter(
                    task =>
                        getTaskStatus(task) ===
                        "upcoming"
                )
            ],

            [
                "Completed",

                completedTasks
            ]

        ];


        if (taskCount) {

            taskCount.textContent =
                activeTasks.length;
        }


        taskList.innerHTML =
            groups
                .filter(
                    group =>
                        group[1].length
                )
                .map(
                    (
                        [
                            title,
                            groupTasks
                        ]
                    ) => `

                        <div class="task-group">

                            <h4>

                                ${title}

                            </h4>


                            ${
                                groupTasks
                                    .map(
                                        renderTaskHTML
                                    )
                                    .join("")
                            }

                        </div>

                    `
                )
                .join("");


        if (!taskList.innerHTML) {

            taskList.innerHTML = `

                <div class="tasks-empty">

                    No tasks yet.

                    <br>

                    Capture something you
                    need to work on.

                </div>

            `;
        }


        /*
         * COMPLETE
         */

        taskList
            .querySelectorAll(
                ".task-checkbox"
            )
            .forEach(
                checkbox => {

                    checkbox.addEventListener(
                        "change",
                        () => {

                            const item =
                                checkbox.closest(
                                    ".task-item"
                                );


                            const task =
                                tasks.find(
                                    task =>
                                        task.id ===
                                        item?.dataset
                                            .taskId
                                );


                            if (!task) {
                                return;
                            }


                            task.completed =
                                checkbox.checked;


                            task.completedAt =
                                checkbox.checked
                                    ? new Date()
                                        .toISOString()
                                    : null;


                            saveStorage(
                                STORAGE_KEYS.tasks,
                                tasks
                            );


                            renderTasks();
                        }
                    );
                }
            );


        /*
         * DELETE
         */

        taskList
            .querySelectorAll(
                ".delete-task-button"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        event => {

                            event.stopPropagation();


                            deleteTask(
                                button.dataset
                                    .deleteTask
                            );
                        }
                    );
                }
            );
    }


    /* =========================================================
       DELETE TASK
       ========================================================= */

    function deleteTask(taskId) {

        const task =
            tasks.find(
                item =>
                    item.id ===
                    taskId
            );


        if (!task) {
            return;
        }


        const confirmed =
            window.confirm(
                `Delete "${task.title}"?`
            );


        if (!confirmed) {
            return;
        }


        tasks =
            tasks.filter(
                item =>
                    item.id !==
                    taskId
            );


        saveStorage(
            STORAGE_KEYS.tasks,
            tasks
        );


        renderTasks();
    }


    /* =========================================================
       ADD TASK
       ========================================================= */

    function addTask() {

        const text =
            captureInput
                ?.value
                .trim() ||
            "";


        if (!text) {

            if (captureMessage) {

                captureMessage.textContent =
                    "Write something to capture first.";
            }

            captureInput?.focus();

            return;
        }


        const task = {

            id:
                generateId("task"),

            title:
                text
                    .replace(
                        /\b(?:due|by)\s+(?:today|tomorrow|\w+)\b/gi,
                        ""
                    )
                    .replace(
                        /\s+/g,
                        " "
                    )
                    .trim(),

            priority:
                prioritySelect?.value ||
                "medium",

            createdAt:
                new Date()
                    .toISOString(),

            dueDate:
                parseNaturalDate(
                    text
                ),

            completed:
                false,

            completedAt:
                null
        };


        tasks.unshift(
            task
        );


        saveStorage(
            STORAGE_KEYS.tasks,
            tasks
        );


        renderTasks();


        if (captureInput) {
            captureInput.value = "";
        }


        if (captureMessage) {

            captureMessage.textContent =
                "Task added to Today's Priorities.";
        }


        setTimeout(
            () => {

                showPage(
                    "home"
                );

            },
            500
        );
    }


    /* =========================================================
       SEARCH
       ========================================================= */

    function searchSessions(
        query = ""
    ) {

        if (!sessionSearchResults) {
            return;
        }


        const searchTerm =
            query
                .trim()
                .toLowerCase();


        const results =
            sessions.filter(
                session => {

                    if (!searchTerm) {
                        return true;
                    }


                    const titleMatch =
                        session.title
                            .toLowerCase()
                            .includes(
                                searchTerm
                            );


                    const messageMatch =
                        session.messages.some(
                            message =>
                                (
                                    message.content ||
                                    ""
                                )
                                    .toLowerCase()
                                    .includes(
                                        searchTerm
                                    )
                        );


                    return (
                        titleMatch ||
                        messageMatch
                    );
                }
            );


        if (!results.length) {

            sessionSearchResults.innerHTML = `

                <div class="search-empty">

                    No sessions found.

                </div>

            `;

            return;
        }


        sessionSearchResults.innerHTML =
            results
                .map(
                    session => `

                        <button
                            type="button"
                            class="search-result"
                            data-search-session="${escapeHTML(
                                session.id
                            )}"
                        >

                            <span>

                                <span class="search-result-title">

                                    ${escapeHTML(
                                        session.title
                                    )}

                                </span>


                                <span class="search-result-meta">

                                    ${
                                        session
                                            .mode
                                            ? CONTENT_MODES[
                                                session.mode
                                            ]?.label
                                            : "Session"
                                    }

                                </span>

                            </span>


                            <span>

                                ›

                            </span>

                        </button>

                    `
                )
                .join("");


        sessionSearchResults
            .querySelectorAll(
                "[data-search-session]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            loadSession(
                                button.dataset
                                    .searchSession
                            );
                        }
                    );
                }
            );
    }


    /* =========================================================
       ASK ANYTHING
       ========================================================= */

    function renderAskConversation() {

        if (!askConversation) {
            return;
        }


        if (!askMessages.length) {

            askConversation.innerHTML = `

                <div class="ask-empty">

                    <div class="ask-empty-icon">

                        ✦

                    </div>


                    <h2>

                        How can I help?

                    </h2>


                    <p>

                        Ask anything about your
                        work, ideas, projects or
                        learning.

                    </p>

                </div>

            `;

            return;
        }


        askConversation.innerHTML =
            askMessages
                .map(
                    message => `

                        <article
                            class="ask-message ${
                                message.role ===
                                "user"
                                    ? "ask-user"
                                    : "ask-ai"
                            }"
                        >

                            <div class="ask-message-label">

                                ${
                                    message.role ===
                                    "user"
                                        ? "You"
                                        : "AI Second Brain"
                                }

                            </div>


                            <div class="ask-message-content">

                                ${formatText(
                                    message.content ||
                                    ""
                                )}

                            </div>

                        </article>

                    `
                )
                .join("") +
            (isAsking
                ? renderRequestLoading()
                : "");


        askConversation.scrollTop =
            askConversation.scrollHeight;
    }


    /* =========================================================
       ASK FILE
       ========================================================= */

    function setupAskFileUpload() {

        askUploadButton
            ?.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    askFileInput?.click();
                }
            );


        askFileInput
            ?.addEventListener(
                "change",
                async event => {

                    const file =
                        event.target
                            .files?.[0];


                    if (!file) {
                        return;
                    }


                    try {

                        const data =
                            await readFileAsDataURL(
                                file
                            );


                        askFile = {

                            name:
                                file.name,

                            type:
                                file.type,

                            size:
                                file.size,

                            data
                        };


                        if (askFileName) {

                            askFileName.hidden =
                                false;

                            askFileName.textContent =
                                `📎 ${file.name}`;
                        }

                    } catch (error) {

                        console.error(
                            error
                        );
                    }


                    event.target.value =
                        "";
                }
            );
    }


    function clearAskFile() {

        askFile =
            null;


        if (askFileName) {

            askFileName.hidden =
                true;

            askFileName.textContent =
                "";
        }


        if (askFileInput) {

            askFileInput.value =
                "";
        }
    }


    /* =========================================================
       ASK SEND
       ========================================================= */

    async function sendAskAnything() {

        if (isAsking) {
            return;
        }


        const message =
            askInput
                ?.value
                .trim() ||
            "";


        const file =
            askFile;


        if (
            !message &&
            !file
        ) {

            askInput?.focus();

            return;
        }


        askMessages.push({

            id:
                generateId("ask"),

            role:
                "user",

            content:
                message,

            file:
                file
                    ? {

                        name:
                            file.name,

                        type:
                            file.type,

                        size:
                            file.size

                    }
                    : null,

            createdAt:
                new Date()
                    .toISOString()
        });


        renderAskConversation();


        if (askInput) {

            askInput.value =
                "";

            autoGrow(
                askInput
            );
        }


        clearAskFile();


        isAsking =
            true;


        if (askSendButton) {

            askSendButton.disabled =
                true;

            askSendButton.textContent =
                "…";
        }


            renderAskConversation();


        try {

            const result =
                await callAIBackend({

                    type:
                        "text",

                    prompt:
                        message,

                    file:
                        file,

                    conversation:
                        askMessages
                            .slice(-20)
                            .map(
                                item => ({

                                    role:
                                        item.role,

                                    content:
                                        item.content ||
                                        ""
                                })
                            )
                });


            askMessages.push({

                id:
                    generateId("ask"),

                role:
                    "assistant",

                content:
                    result.text ||
                    result.content ||
                    "The AI returned an empty response.",

                createdAt:
                    new Date()
                        .toISOString()
            });

        } catch (error) {

            console.error(
                error
            );


            askMessages.push({

                id:
                    generateId("ask"),

                role:
                    "assistant",

                content:
                    getAPIErrorMessage(
                        error
                    ),

                isError:
                    true,

                createdAt:
                    new Date()
                        .toISOString()
            });

        } finally {

            isAsking =
                false;


            renderAskConversation();


            if (askSendButton) {

                askSendButton.disabled =
                    false;

                askSendButton.textContent =
                    "➤";
            }


            askInput?.focus();
        }
    }


    /* =========================================================
       ASK INPUT
       ========================================================= */

    function setupAskInput() {

        askInput
            ?.addEventListener(
                "input",
                () => {

                    autoGrow(
                        askInput
                    );
                }
            );


        askInput
            ?.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key ===
                        "Enter" &&
                        !event.shiftKey
                    ) {

                        event.preventDefault();

                        sendAskAnything();
                    }
                }
            );


        askSendButton
            ?.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    sendAskAnything();
                }
            );
    }


    /* =========================================================
       SIDEBAR
       ========================================================= */

    function setupSidebar() {

        sidebarToggle
            ?.addEventListener(
                "click",
                () => {

                    document.body
                        .classList
                        .toggle(
                            "sidebar-collapsed"
                        );


                    const collapsed =
                        document.body
                            .classList
                            .contains(
                                "sidebar-collapsed"
                            );


                    localStorage.setItem(
                        STORAGE_KEYS.sidebar,
                        collapsed
                    );
                }
            );


        if (
            localStorage.getItem(
                STORAGE_KEYS.sidebar
            ) === "true"
        ) {

            document.body
                .classList
                .add(
                    "sidebar-collapsed"
                );
        }


        moveHomeToTop();
    }


    /* =========================================================
       HOME TO TOP
       ========================================================= */

    function moveHomeToTop() {

        const sidebar =
            document.querySelector(
                ".sidebar-nav"
            );


        if (!sidebar) {
            return;
        }


        const homeButton =
            sidebar.querySelector(
                '[data-nav="home"]'
            );


        if (!homeButton) {
            return;
        }


        sidebar.prepend(
            homeButton
        );
    }


    /* =========================================================
       NAVIGATION
       ========================================================= */

    function setupNavigation() {

        document
            .querySelectorAll(
                "[data-nav]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        event => {

                            event.preventDefault();


                            const destination =
                                button.dataset
                                    .nav;


                            if (
                                destination ===
                                "content-studio"
                            ) {

                                openContentStudio();

                            } else {

                                showPage(
                                    destination
                                );
                            }
                        }
                    );
                }
            );


        /*
         * HOME ACTIONS
         */

        document
            .querySelectorAll(
                "[data-home-action]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        event => {

                            event.preventDefault();


                            const action =
                                button.dataset
                                    .homeAction;


                            switch (action) {

                                case "image":

                                    openContentStudio(
                                        "image"
                                    );

                                    break;


                                case "text":

                                    openContentStudio(
                                        "text"
                                    );

                                    break;


                                case "task":

                                    showPage(
                                        "quick-capture"
                                    );

                                    captureInput
                                        ?.focus();

                                    break;


                                case "ask":

                                    showPage(
                                        "ask-anything"
                                    );

                                    askInput
                                        ?.focus();

                                    break;
                            }
                        }
                    );
                }
            );
    }


    /* =========================================================
       CONTENT TABS
       ========================================================= */

    function setupContentTabs() {

        contentTabs.forEach(
            tab => {

                tab.setAttribute(
                    "type",
                    "button"
                );


                tab.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();

                        event.stopPropagation();


                        /*
                         * Save only an existing
                         * persistent session draft.
                         *
                         * Do not create a History
                         * entry just because the
                         * user changed tabs.
                         */

                        saveCurrentDraft();


                        const newType =
                            tab.dataset.type;


                        if (
                            !CONTENT_MODES[
                                newType
                            ]
                        ) {

                            return;
                        }


                        selectedContentType =
                            newType;


                        /*
                         * For a new request,
                         * create a clean temporary
                         * workspace for this mode.
                         */

                        if (
                            !currentSession ||
                            currentSession.isSaved
                        ) {

                            currentSession =
                                createDraftSession();

                            currentSessionId =
                                null;
                        }


                        updateActiveTab();

                        loadCurrentModeDraft();

                        updateComposerUI();

                        renderConversation();
                    }
                );
            }
        );
    }


    /* =========================================================
       INIT
       ========================================================= */

    function initialiseApplication() {

        normaliseData();

        initialiseSession();

        setupSidebar();

        setupNavigation();

        setupContentTabs();

        setupComposer();

        setupContentFileUpload();

        setupAskFileUpload();

        setupAskInput();
        const guestButton = document.getElementById("guestButton");

if (guestButton) {
    guestButton.addEventListener("click", () => {
        localStorage.setItem("secondBrainGuestMode", "true");

        guestButton.textContent = "Guest Mode";
        guestButton.disabled = true;
    });
}
const signInButton = document.getElementById("signInButton");
const authModal = document.getElementById("authModal");
const authModalClose = document.getElementById("authModalClose");
const authModalOverlay = document.getElementById("authModalOverlay");
const modalGuestButton = document.getElementById("modalGuestButton");

if (signInButton && authModal) {
    signInButton.addEventListener("click", () => {
        authModal.classList.add("is-open");
        authModal.setAttribute("aria-hidden", "false");
    });
}

function closeAuthModal() {
    if (!authModal) {
        return;
    }

    authModal.classList.remove("is-open");
    authModal.setAttribute("aria-hidden", "true");
}

if (authModalClose) {
    authModalClose.addEventListener("click", closeAuthModal);
}

if (authModalOverlay) {
    authModalOverlay.addEventListener("click", closeAuthModal);
}

if (modalGuestButton) {
    modalGuestButton.addEventListener("click", () => {
        localStorage.setItem("secondBrainGuestMode", "true");

        closeAuthModal();

        if (guestButton) {
            guestButton.textContent = "Guest Mode";
            guestButton.disabled = true;
        }
    });
}
const signInForm = document.getElementById("signInForm");

if (signInForm) {
    signInForm.addEventListener("submit", (event) => {
        event.preventDefault();

        alert(
            "Sign-in is not connected yet. You can continue using AI Second Brain as a guest."
        );
    });
}

        captureButton
            ?.addEventListener(
                "click",
                addTask
            );


        captureInput
            ?.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key ===
                        "Enter" &&
                        !event.shiftKey
                    ) {

                        event.preventDefault();

                        addTask();
                    }
                }
            );


        sessionSearchInput
            ?.addEventListener(
                "input",
                () => {

                    searchSessions(
                        sessionSearchInput.value
                    );
                }
            );


        newSessionButton
            ?.addEventListener(
                "click",
                createNewSession
            );


        renderHistory();

        renderTasks();

        renderAskConversation();

        updateActiveTab();

        loadCurrentModeDraft();

        updateComposerUI();

        updateSessionUI();

        renderConversation();


        showPage(
            "home",
            false
        );
    }


    /* =========================================================
       START
       ========================================================= */

    initialiseApplication();

});