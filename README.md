# Breathing App Technical Documentation

This document provides a technical overview of the Breathing App, focusing on the JavaScript mechanisms, state management, event handling, and programming patterns used to create the interactive breathing visualization.

## Table of Contents

-   [Introduction](#introduction)
-   [Application Structure](#application-structure)
-   [State Management](#state-management)
-   [DOM Manipulation](#dom-manipulation)
-   [Event Handling](#event-handling)
-   [Animation Implementation](#animation-implementation)
-   [Programming Patterns](#programming-patterns)
-   [Advanced Features](#advanced-features)
-   [Conclusion](#conclusion)

## Introduction

The Breathing App is a web-based application that visualizes breathing patterns through animated circles. It allows users to customize timing controls, visual themes, and advanced settings to enhance their breathing exercises. The app uses JavaScript to manage state, handle user interactions, and manipulate the DOM to create dynamic animations.

## Application Structure

The application consists of the following main components:

-   **HTML Structure**: Defines the layout of the application, including the main breathing circle, settings button, and control panels.
-   **CSS Styles**: Manages the visual presentation, including animations, responsive design, and themes.
-   **JavaScript Code**: Handles state management, DOM manipulation, event handling, and animations.

## State Management

The application uses a centralized `state` object to manage all configurable parameters. This object holds values for timing controls, visual settings, and advanced options.

```javascript
const state = {
    inhaleTime: 4,
    inhalePause: 1,
    exhaleTime: 4,
    exhalePause: 1,
    satelliteCount: 60,
    innerBoundary: 2,
    outerBoundary: 5,
    leftBoundary: 5,
    rightBoundary: 5,
    satelliteSize: 40,
    glowEffect: 50,
    sizeVariation: 50,
};
```

### State Update Mechanism

The `updateState` function updates the state object and triggers necessary UI and animation updates based on the changed values.

```javascript
function updateState(key, value) {
    state[key] = value;
    // Update display and apply changes
    const displayElement = document.getElementById(`${key}Value`);
    if (displayElement) {
        const suffix = getSuffix(key);
        displayElement.textContent = `${value}${suffix}`;
    }
    // Update animations or UI components as needed
    if (
        ['inhaleTime', 'inhalePause', 'exhaleTime', 'exhalePause'].includes(key)
    ) {
        updateAnimation();
    }
    applyStateChanges(key);
}
```

## DOM Manipulation

The application dynamically creates and manipulates DOM elements to render the breathing visualization and respond to user interactions.

### Creating Satellite Circles

Satellite circles are smaller circles that orbit around the main breathing circle. They are created and positioned using JavaScript.

```javascript
function createSatelliteCircles() {
    // Remove existing satellites
    document.querySelectorAll('.circle-satellite').forEach(s => s.remove());
    // Create new satellites based on the state
    for (let i = 0; i < state.satelliteCount; i++) {
        const satellite = document.createElement('div');
        satellite.className = 'circle circle-satellite';
        // Set styles and data attributes
        // ...
        container.appendChild(satellite);
    }
    updateSatellitePositions();
    startColorSync();
}
```

### Updating Satellite Positions

The satellites' positions are continuously updated to create an orbiting effect.

```javascript
function updateSatellitePositions() {
    // Calculate positions based on time and state
    document.querySelectorAll('.circle-satellite').forEach(satellite => {
        // Compute x and y coordinates
        satellite.style.transform = `translate3d(..., ..., 0)`;
    });
    requestAnimationFrame(updateSatellitePositions);
}
```

## Event Handling

User interactions are handled through event listeners attached to DOM elements.

### Slider Inputs

Sliders allow users to adjust timing and visual settings in real-time.

```javascript
function initializeSliders() {
    Object.entries(sliders).forEach(([key, slider]) => {
        slider.value = state[key];
        updateState(key, parseFloat(slider.value));
        slider.addEventListener('input', e => {
            updateState(key, parseFloat(e.target.value));
        });
    });
}
```

### Settings Toggle

The settings panel can be shown or hidden using the settings button or a keyboard shortcut.

```javascript
settingsButton.addEventListener('click', event => {
    const isVisible = controls.style.display === 'block';
    controls.style.display = isVisible ? 'none' : 'block';
    event.stopPropagation();
});
```

### Keyboard Shortcuts

Keyboard events are used to enhance accessibility.

```javascript
document.addEventListener('keydown', event => {
    if (event.ctrlKey && event.key === '/') {
        event.preventDefault();
        const isVisible = controls.style.display === 'block';
        controls.style.display = isVisible ? 'none' : 'block';
    }
    if (event.key === 'Escape') {
        controls.style.display = 'none';
    }
});
```

## Animation Implementation

Animations are achieved using both CSS keyframes and JavaScript for dynamic updates.

### Breathing Animation

The main breathing circle scales up and down to simulate breathing.

```javascript
function updateAnimation() {
    const totalDuration = inhale + inhalePause + exhale + exhalePause;
    const keyframes = `
        @keyframes breatheScale {
            0% { transform: scale(1.2); }
            ${inhalePercent}% { transform: scale(2.0); }
            ${inhalePausePercent}% { transform: scale(2.0); }
            ${exhalePercent}% { transform: scale(1.2); }
            100% { transform: scale(1.2); }
        }
    `;
    // Update or create the animation style
    let styleSheet = document.getElementById('breathe-animation');
    if (styleSheet) {
        styleSheet.remove();
    }
    styleSheet = document.createElement('style');
    styleSheet.id = 'breathe-animation';
    styleSheet.textContent = keyframes;
    document.head.appendChild(styleSheet);
    // Apply animation to the main circle
    circleMain.style.animation = `breatheScale ${totalDuration}s infinite ease-in-out, colorChange ${totalDuration}s infinite ease-in-out`;
}
```

### Color Synchronization

Satellite circles synchronize their color with the main circle in real-time.

```javascript
function startColorSync() {
    function syncColors() {
        const mainColor = window.getComputedStyle(mainCircle).backgroundColor;
        document.querySelectorAll('.circle-satellite').forEach(satellite => {
            satellite.style.backgroundColor = mainColor;
        });
        requestAnimationFrame(syncColors);
    }
    syncColors();
}
```

## Programming Patterns

The application utilizes several programming patterns to enhance code maintainability and readability.

### Modular Functions

Functions are modularized to perform specific tasks, making the code easier to manage and debug.

-   **State Update Functions**: `updateState`, `applyStateChanges`
-   **DOM Manipulation Functions**: `createSatelliteCircles`, `updateSatellitePositions`
-   **Initialization Functions**: `initializeSliders`, `initializeCollapsibleSections`

### Event-Driven Programming

The application relies heavily on event listeners to handle user interactions and update the UI accordingly.

-   **User Input Events**: Slider adjustments, theme selections
-   **Window Events**: `DOMContentLoaded`, `resize`, `keydown`

### Separation of Concerns

The code separates logic into different sections:

-   **State Management**: Manages application data
-   **UI Updates**: Manipulates the DOM based on state changes
-   **Event Handling**: Responds to user interactions
-   **Animations**: Handles visual transitions and effects

## Advanced Features

### Themes and Presets

Users can select different color themes and advanced presets to customize the visual experience.

```javascript
const themes = {
    theme1: { inhale: '#667db6', exhale: '#0082c8' },
    theme2: { inhale: '#cac531', exhale: '#f3f9a7' },
    theme3: { inhale: '#f5af19', exhale: '#f12711' },
};

function updateThemeColors(themeName, swapColors = false) {
    const theme = themes[themeName];
    if (!theme) return;
    const root = document.documentElement;
    if (swapColors) {
        root.style.setProperty('--inhale-color', theme.exhale);
        root.style.setProperty('--exhale-color', theme.inhale);
    } else {
        root.style.setProperty('--inhale-color', theme.inhale);
        root.style.setProperty('--exhale-color', theme.exhale);
    }
    updateGlowColor();
}
```

### Glow Effect

The glow effect around the main circle is dynamically updated based on user settings.

```javascript
function updateGlowColor() {
    const glowWrapper = document.querySelector('.glow-wrapper');
    const glowIntensity = state.glowEffect;
    const currentColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--inhale-color')
        .trim();
    glowWrapper.style.filter = `drop-shadow(0 0 ${glowIntensity}px ${currentColor}80)`;
}
```

### Responsive Design

The application adjusts its layout and animations based on the viewport size to ensure a consistent user experience across devices.

```css
@media (max-width: 600px) {
    .breathing-circle {
        width: 32vmin;
        height: 32vmin;
    }
    @keyframes breatheScale {
        0% {
            transform: scale(0.5);
        }
        40% {
            transform: scale(0.9);
        }
        60% {
            transform: scale(0.9);
        }
        100% {
            transform: scale(0.5);
        }
    }
    .circle-satellite {
        width: min(20px, 5vmin);
        height: min(20px, 5vmin);
    }
}
```

### Collapsible Sections

Settings are organized into collapsible sections to improve usability.

```javascript
function initializeCollapsibleSections() {
    document.querySelectorAll('.section-header').forEach(header => {
        header.addEventListener('click', () => {
            const section = header.closest('.collapsible-section');
            section.classList.toggle('active');
        });
    });
}
```

## Conclusion

The Breathing App leverages modern JavaScript practices and CSS animations to create an interactive and customizable breathing exercise tool. By utilizing a centralized state object, modular functions, and event-driven programming, the application maintains a clean and maintainable codebase while providing a rich user experience.
