# The Creator: An Interactive AI Storytelling Experience

![The Creator Start Screen](https://storage.googleapis.com/aistudio-ux-team-public/sdk_gallery/project_creator_readme_header.png)

Welcome to **The Creator**, an immersive, choice-based RPG where you play as a nascent, god-like entity shaping a new universe from the void. Powered by Google's Gemini API, every choice you make—from a simple selection to a custom-typed action—dynamically crafts a unique narrative, lore, and history.

## Key Features

-   **AI-Powered Narrative:** The entire story is generated in real-time by the Gemini API. The Game Master AI adapts to your choices, creating a living, breathing story that is uniquely yours.
-   **Seed-Based Universe Creation:** Begin each new game with a "seed" word or phrase (e.g., "Shattered Mirror," "Silent Song"). The AI uses this seed as the core inspiration for your universe's origin, ensuring infinite replayability.
-   **Player Choice & Agency:** Guide the narrative by selecting from thoughtfully generated options or by typing your own custom actions, giving you complete freedom to interact with the world.
-   **Evolving Memory & Continuity:** The AI maintains a `memory` of key events. It is prompted to reference and weave multiple past memories into the ongoing narrative, creating a rich, cohesive, and persistent world history.
-   **Dynamic Lore Encyclopedia:** As your universe evolves, the application automatically identifies key terms, concepts, characters, and locations, adding them to an in-game encyclopedia for you to reference at any time.
-   **AI-Generated Imagery:** An optional "Image Vision" mode uses a multimodal Gemini model to generate visuals for each scene, providing a stunning artistic interpretation of your creation.
-   **Text-to-Speech:** Immerse yourself in the story by listening to the narrator's voice, powered by the browser's Web Speech API.
-   **Save/Load Functionality:** Save the complete state of your universe to a JSON file and load it later to continue your creation.
-   **Fully Responsive Design:** Enjoy a seamless experience whether you're playing on a desktop, tablet, or mobile device.

## Technology Stack

-   **Frontend:** React, TypeScript, Tailwind CSS
-   **AI & Language Models:** Google Gemini API (`@google/genai`)
    -   **`gemini-2.5-flash`:** Used for core narrative generation, state management, and lore extraction.
    -   **`gemini-2.5-flash-image-preview`:** Used for the "Image Vision" feature to generate and edit scene visuals.

## How to Run

This project is designed to run in a web-based environment where the Google Gemini API is accessible.

1.  **Get an API Key:** Obtain a Google Gemini API key from [Google AI Studio](https://aistudio.google.com/).
2.  **Set Environment Variable:** Set your API key as an environment variable or secret named `API_KEY`. The application is hardcoded to read the key from `process.env.API_KEY`.
3.  **Run the Application:** Serve the `index.html` file and its associated JavaScript modules.

## How It Works

The core of the application is a continuous loop of interaction between the player and the Gemini API, managed by the React frontend.

1.  **Seeding:** The player provides an initial seed phrase. This is sent to the Gemini API with a special initial prompt that generates the opening narrative and choices.
2.  **Player Action:** The player either clicks a choice or types a custom action.
3.  **State & History:** The chosen action, along with the entire conversation history and the current JSON `narrativeState` (which includes the `memory` array), is sent to the Gemini API.
4.  **AI Response:** The model processes the context and returns a structured response containing:
    -   `[STATE_UPDATES]`: A JSON object with changes to the narrative state, including new memories.
    -   `[NARRATIVE]`: The next chapter of the story, which builds upon past memories.
    -   `[CHOICES]`: A new set of actions for the player.
5.  **Background Tasks:** In parallel, the new narrative text is used to:
    -   **Extract Lore:** A separate API call identifies new lore terms and adds them to the encyclopedia.
    -   **Generate Image:** If "Image Vision" is enabled, another API call generates a new image based on the narrative and the previous scene's image.
6.  **UI Update:** The frontend parses the AI's response, updates the UI with the new narrative and choices, and prepares for the next player action.

---

This project serves as a powerful demonstration of how large language models can be used to create dynamic, persistent, and deeply engaging interactive experiences.
