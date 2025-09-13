# The Creator: An Interactive AI Storytelling Experience

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)

> An immersive, choice-based RPG where you play as a nascent, god-like entity shaping a new universe from the void. Powered by Google's Gemini API.

**[➡️ View the Live Demo (Link to be added)](#)**

---

## Gameplay Preview

![The Creator Gameplay](https://storage.googleapis.com/aistudio-ux-team-public/sdk_gallery/project_creator_readme_header.png)
*(A GIF showcasing the gameplay loop would be ideal here)*

---

## About The Project

Welcome to **The Creator**, an immersive, choice-based RPG where you play as a nascent, god-like entity shaping a new universe from the void. Powered by Google's Gemini API, every choice you make—from a simple selection to a custom-typed action—dynamically crafts a unique narrative, lore, and history.

### Key Features

-   **AI-Powered Narrative:** The entire story is generated in real-time by the Gemini API. The Game Master AI adapts to your choices, creating a living, breathing story that is uniquely yours.
-   **Seed-Based Universe Creation:** Begin each new game with a "seed" word or phrase (e.g., "Shattered Mirror," "Silent Song"). The AI uses this seed as the core inspiration for your universe's origin, ensuring infinite replayability.
-   **Player Choice & Agency:** Guide the narrative by selecting from thoughtfully generated options or by typing your own custom actions, giving you complete freedom to interact with the world.
-   **Evolving Memory & Continuity:** The AI maintains a `memory` of key events. It is prompted to reference and weave multiple past memories into the ongoing narrative, creating a rich, cohesive, and persistent world history.
-   **Dynamic Lore Encyclopedia:** As your universe evolves, the application automatically identifies key terms, concepts, characters, and locations, adding them to an in-game encyclopedia for you to reference at any time.
-   **AI-Generated Imagery:** An optional "Image Vision" mode uses a multimodal Gemini model to generate visuals for each scene, providing a stunning artistic interpretation of your creation.
-   **Text-to-Speech:** Immerse yourself in the story by listening to the narrator's voice, powered by the browser's Web Speech API.
-   **Save/Load Functionality:** Save the complete state of your universe to a JSON file and load it later to continue your creation.
-   **Fully Responsive Design:** Enjoy a seamless experience whether you're playing on a desktop, tablet, or mobile device.

---

## Technology Stack

*   **Frontend:** [React](https://reactjs.org/) & [TypeScript](https://www.typescriptlang.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **AI & Language Models:** [Google Gemini API](https://ai.google.dev/) (`@google/genai`)
    *   **`gemini-2.5-flash`:** Used for core narrative generation, state management, and lore extraction.
    *   **`gemini-2.5-flash-image-preview`:** Used for the "Image Vision" feature to generate and edit scene visuals.
*   **Module Loading:** [ESM Import Maps](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap) for a buildless development experience.

---

## Getting Started

This project is a static web application that communicates directly with the Google Gemini API. To run it locally, follow these steps.

### Prerequisites

*   A modern web browser that supports Import Maps (Chrome, Edge, Firefox, Safari).
*   A Google Gemini API key. You can get one from [Google AI Studio](https://aistudio.google.com/).
*   A local web server. A simple one can be run using Python or a VS Code extension.

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/the-creator.git
    cd the-creator
    ```

2.  **Set up your API Key:**
    This application is designed to run in an environment where the API key is provided as a `process.env.API_KEY` variable. Since this is a client-side application, you **should not** hardcode your key directly into the code.

    To run locally, you can temporarily modify `index.html` to inject the key. **Do not commit this change!**

    Open `index.html` and add this script tag inside the `<head>` section, **before** the import map script:
    ```html
    <script>
      // FOR LOCAL DEVELOPMENT ONLY - DO NOT COMMIT YOUR API KEY
      window.process = {
        env: {
          API_KEY: 'YOUR_GEMINI_API_KEY_HERE'
        }
      };
    </script>
    ```
    Replace `YOUR_GEMINI_API_KEY_HERE` with your actual key.

3.  **Run a local server:**
    From the root directory of the project, start a simple web server. If you have Python installed:
    ```sh
    # For Python 3
    python -m http.server
    ```
    Or, you can use a tool like the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension for VS Code.

4.  **Open the application:**
    Navigate to `http://localhost:8000` (or the URL provided by your server) in your web browser.

---

## How It Works

The core of the application is a continuous loop of interaction between the player and the Gemini API, managed by the React frontend.

1.  **Seeding:** The player provides an initial seed phrase. This is sent to the Gemini API with a special initial prompt that generates the opening narrative and choices.
2.  **Player Action:** The player either clicks a choice or types a custom action.
3.  **State & History:** The chosen action, along with the entire conversation history and the current JSON `narrativeState` (which includes the `memory` array), is sent to the Gemini API.
4.  **AI Response:** The model processes the context and returns a structured response containing:
    ```
    [STATE_UPDATES]
    { "key": "value", "memory": ["existing memory", "new memory"] }
    [NARRATIVE]
    The next chapter of the story, which builds upon past memories.
    [CHOICES]
    A. A choice that reflects the new state.
    B. Another choice.
    C. A third choice.
    ```
5.  **Background Tasks:** In parallel, the new narrative text is used to:
    -   **Extract Lore:** A separate API call identifies new lore terms and adds them to the encyclopedia.
    -   **Generate Image:** If "Image Vision" is enabled, another API call generates a new image based on the narrative and the previous scene's image.
6.  **UI Update:** The frontend parses the AI's response, updates the UI with the new narrative and choices, and prepares for the next player action.

---

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## License

Distributed under the MIT License.
