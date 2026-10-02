# 🧠 AI Second Brain

> **Turn information into organised knowledge and personalised action.**

AI Second Brain is an AI-powered personal knowledge and productivity system designed to help users capture information, generate content, organise tasks, and interact with AI through a simple workspace.

The project combines AI-powered text, code, and image-generation workflows with productivity features such as session history, task management, quick capture, and natural-language interaction.

---

## Live Demo

👉 **[Open AI Second Brain](https://second-brain-t66k.onrender.com)**

## 💻 GitHub Repository

👉 **[View the source code](https://github.com/KhensaniNtombela/Second-Brain)**

---

##  Features

###  AI Generation

AI Second Brain supports multiple AI-powered generation modes:

- **Text Generation**
  - Write and rewrite content
  - Create professional posts
  - Summarise information
  - Brainstorm ideas
  - Improve existing writing

- **Code Generation**
  - Generate code from natural-language prompts
  - Explain coding concepts
  - Assist with programming tasks

- **Image Generation**
  - Generate visual content from prompts
  - Image-generation workflow integrated into Content Studio

### 💬 Ask Anything

A ChatGPT-style conversational interface that allows users to ask questions and interact with the AI assistant using natural language.

The system is designed to understand prompts even when users make spelling or grammar mistakes.

###  Content Studio

Content Studio provides dedicated generation modes:

**Text → Code → Image**

Each mode provides its own workspace for creating AI-generated content.

###  Session History

The application keeps track of Content Studio sessions, allowing users to:

- View previous sessions
- Reopen sessions
- Rename sessions
- Delete sessions
- Identify the generation mode used
- Maintain separate sessions for different requests

###  Task Management

AI Second Brain includes a productivity-focused task system for capturing and managing tasks.

Tasks can be added from the Home workspace and incorporated into the user's productivity workflow.

###  Quick Capture

Quick Capture allows users to quickly record information or ideas without interrupting their workflow.

###  Search

A dedicated search area is included to help users navigate and retrieve information within the application.

###  Guest Mode

Users can use AI Second Brain without creating an account.

The application provides:

- **Sign In**
- **Continue as Guest**

Guest mode allows users to access the application without authentication.

---

## 🧠 Product Concept

The core workflow behind AI Second Brain is:

```text
Capture
   ↓
Understand
   ↓
Connect
   ↓
Plan
   ↓
Generate
   ↓
Learn
   ↓
Adapt
```
The goal is to move beyond a simple chatbot by connecting AI interaction with personal knowledge and productivity workflows.

 Technology Stack
Frontend
HTML5
CSS3
JavaScript
Backend
Node.js
Express.js
AI
Google Gemini API
@google/genai
Storage
Browser localStorage
Deployment
GitHub
Render
 Project Structure
AI-Second-Brain/
│
├── index.html
├── style.css
├── script.js
├── server.js
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
 Running the Project Locally
1. Clone the repository
git clone https://github.com/KhensaniNtombela/Second-Brain.git
2. Navigate into the project
cd Second-Brain
3. Install dependencies
npm install
4. Create the environment file

Create a file named:

.env

Add your Gemini API key:

GEMINI_API_KEY=your_api_key_here
5. Start the server
npm start

The application will be available at:

http://localhost:3000
 Environment Variables

The Gemini API key is stored as an environment variable and is not included in the GitHub repository.

The .gitignore file contains:

node_modules/
.env

This prevents sensitive environment variables and installed dependencies from being committed to GitHub.

 Deployment

The application is deployed using Render.

The deployment uses:

GitHub Repository
       ↓
     Render
       ↓
  Node.js / Express
       ↓
   Gemini API

The Gemini API key is configured as an environment variable in the Render service rather than being exposed in the frontend code.

 Authentication

The current application includes an authentication interface with:

Sign In
Continue as Guest

Guest access is available without requiring an account.

The Sign In interface is currently a foundation for future authentication integration. A production authentication provider can be connected in a future version to support:

User accounts
Persistent profiles
Secure authentication
Personalised user data
Cross-device sessions
 Challenges & Limitations
1. Authentication

Implementing a complete authentication system requires more than creating a frontend login form.

The current version therefore provides a functional guest experience and a Sign In interface while leaving full account authentication as a future improvement.

Potential improvement:

Integrate an authentication service such as Supabase Auth or another secure authentication provider.

2. Image Generation API Availability

Image generation presented an additional development limitation because the selected Gemini image-generation model is not available through the current free API tier.

As a result, image generation may require a paid API/billing configuration depending on the selected model.

Potential solutions:

Upgrade to a paid AI API plan
Use an alternative image-generation provider
Use an AI platform that provides image generation within its available developer/free allowance
3. API Usage Limits

AI applications are dependent on external API availability and usage limits.

During development, temporary API availability and quota errors were encountered. Fallback handling was implemented for text-generation models where possible.

 Future Improvements

Possible future improvements include:

Full user authentication
User profiles
Cloud-based personal knowledge storage
Persistent cross-device sessions
Improved semantic search
AI-powered task prioritisation
Automatic task extraction from conversations
Knowledge-base/document ingestion
More advanced memory and personalisation
Additional AI models
Alternative image-generation providers
Voice interaction
Calendar integration
Email integration
Mobile-responsive improvements
Advanced analytics and productivity insights
 Project Objective

AI Second Brain was developed to explore how generative AI can be integrated into a practical productivity system rather than being used only as a conversational chatbot.

The project focuses on combining:

Generative AI
+
Personal Knowledge
+
Productivity
+
Content Creation
+
Task Management

into a single workspace.

👩 Developer

Khensani Ntombela

BCom Information Systems & Economics

Interests:

Artificial Intelligence
Generative AI
Information Systems
Cloud Computing
Software Development
Data & Analytics
AI Productivity Tools
 Project Status

Current Status: Active Development

The core application is deployed and accessible through the live demo.

Text generation, code generation, conversational interaction, task functionality, session history, guest mode, and the Content Studio workflow are implemented.

Authentication and expanded image-generation capabilities remain areas for future development.

 License

This project was created as a learning and development project.


### One important thing

Because your **current deployed version has the Sign In interface but not real authentication**, this README correctly describes it as a foundation rather than claiming that users can actually create accounts.

That makes the documentation honest while also showing the **future development direction** clearly.
