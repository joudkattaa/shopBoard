# ROSEVEIL Cosmetics — Project Guidelines

## About My Project

ROSEVEIL is a cosmetics shopping website that I created for my Software Development using AI course.

I wanted to build something more personal than a basic shopping page, so I chose a beauty brand with soft pink colors, elegant product images, and smooth animations.

My goal is to make the website attractive and easy to use while keeping the code organized and understandable.

The project uses **Vite, TypeScript, HTML, and CSS**. It includes product search, category filters, price sorting, a shopping bag, dark mode, and demo checkout features.

The website is a demonstration project. It does not process real payments or create real customer accounts.

## 1. My Coding Rules

These are the rules I want AI to follow when helping me with my project.

1. **Use semantic HTML.** Use meaningful elements like `header`, `nav`, `main`, `section`, and `footer`.

2. **Every input needs a label.** A placeholder is not enough. Forms should also use native browser validation.

3. **Keep the design responsive.** Start with mobile layouts and use `min-width` media queries for larger screens.

4. **Do not use `!important`.** Fix CSS problems properly instead of forcing styles.

5. **Keep the website accessible.** Buttons, forms, and popups should work with the keyboard, including Tab, Enter, and Escape.

6. **Keep the original product data safe.** Search and filter results before sorting a copy of the array. Do not change the original product order.

7. **Do not add unnecessary code.** Reuse existing functions when possible and avoid adding features or packages that I did not request.

8. **Explain every change.** Tell me which file was changed, what was changed, and why.

9. **Let me review changes first.** Do not create commits, push to GitHub, or deploy the project without my permission.

## 2. How I Organize My Code

I try to give each part of the project one clear responsibility.

- **`server/catalog.ts`** stores the product information.
- **`products.logic.ts`** handles searching, filtering, and sorting.
- **`products.api.ts`** loads and validates product data from the API.
- **`cart.logic.ts`** handles cart calculations.
- **`cart.state.ts`** manages the shopping bag and saves its data.
- **`src/state.ts`** manages application state, including the theme and catalog loading.
- **`products.ui.ts`** handles the product interface and search controls.
- **`cart.ui.ts`** handles the shopping bag interface.
- **`src/ui.ts`** manages shared UI behavior and global events.
- **`src/main.ts`** connects the application modules.
- **`index.html`** contains the page structure.
- **`src/style.css`, `src/theme.css`, and `src/responsive.css`** contain the website styles.

I want to keep the logic separate from the interface. Pure logic functions should not access the DOM or `localStorage`, and UI modules should not save data directly.

The product catalog should have one source, and frontend modules should load it through the API instead of importing server files.

## 3. Three Rules I Learned While Using AI

During this project, I noticed that AI-generated changes do not always work perfectly the first time. These experiences helped me create three additional rules.

### Rule 1 — Always test visual changes in the browser

When I added animations to my product section, the animation was not visible as expected at first.

I learned that passing a build or test does not always mean the design looks correct.

**My rule:** After AI changes animations, layouts, or visual effects, I should open the website and check the result myself.

### Rule 2 — Check file references after changing the project structure

While moving my project from JavaScript to TypeScript, some development tools still referenced old `.js` files.

For example, ESLint referenced `src/ui.js`, and lint-staged did not initially include TypeScript files.

**My rule:** After renaming or moving files, I should check imports, configurations, and scripts to make sure they use the correct paths.

### Rule 3 — Do not add duplicate global event listeners

While fixing the header search, I added another `document.addEventListener('click', ...)` inside `products.ui.ts`.

After that, two automated tests failed because `src/ui.ts` already had a global click listener.

I tried to understand the error and then used Codex to help me find the duplicate listener.

**My rule:** Before adding a new event listener, I should check whether one already exists. Global events should be handled in `src/ui.ts`, and feature modules should provide the functions it calls.

## 4. Testing My Changes

Before considering a code change finished, I want to run these checks:

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run format:check
```

For visual changes, I should also test the website in my browser, especially on mobile screens and with keyboard navigation.

If something fails, I want to understand the reason before accepting the fix.

## My Goal

I want ROSEVEIL to look beautiful, work correctly, and have code that I can understand and explain myself.

AI can help me develop the project, but I want to review its changes, learn from mistakes, and make sure I understand what is happening in my own code.
