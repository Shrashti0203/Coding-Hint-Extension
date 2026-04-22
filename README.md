# Step-by-Step Hint Chrome Extension

## Overview

This project is a Chrome Extension that provides progressive hints for coding problems on LeetCode using AI.

## Features

* Generates 5 step-by-step hints
* Provides an alternative hint
* Shows full explanation after delay
* Works directly on LeetCode problem pages
* Uses fallback hints if API fails

## Tech Stack

* Frontend: HTML, CSS, JavaScript
* Backend: Flask (Python)
* AI Model: Gemini API
* Chrome Extension (Manifest V3)

## How It Works

1. User clicks "Get Hint" button on LeetCode
2. Problem data is captured
3. Backend generates hints using AI
4. Hints are shown step-by-step in popup
5. Full explanation is unlocked after delay

## Setup

1. Run Flask server (`app.py`)
2. Load extension in Chrome (Developer Mode)
3. Open LeetCode problem
4. Click "Get Hint"

## Future Improvements

* Add UI enhancements
* Support more coding platforms
* Add user customization

## Author

Shrashti Agarwal
