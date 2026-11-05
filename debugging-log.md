ROSEVEIL Cosmetics — My Debugging Log
Name: Joud Kattaa
Project: ShopBoard / ROSEVEIL Cosmetics
Date updated: November 5, 2026

While testing my website, I found some problems with the product search and the layout. I tried to understand each problem before making changes. I also used AI when I needed help, and I wrote down which parts I did myself.
Bug 1 — Searching for “serum” showed no products

- What I saw: I selected the Skin Care category and searched for serum, but the website showed zero results even though I knew there was a product called Radiance Facial Serum.
- Type: Logic.
- How I found it: I tested the search and category filter in my local browser. This was a practice bug that AI had deliberately introduced so I could try to find it myself.
- Cause: In src/modules/products/products.logic.ts, the search used startsWith(term). That only matches names beginning with the search word. I wanted the search to find a word anywhere in a product name.
- Fix: I changed startsWith(term) to includes(term) myself.
- Did I use AI? For what? Yes. AI set up the practice bug and later helped explain why it happened. I found the incorrect search result and made the actual code change myself.
- How I checked: I repeated the serum search and confirmed that it found the matching product.
  Bug 2 — The collection search covered the products
- What I saw: When I opened the search control near the product collection, the search panel appeared on top of the product cards. It did not look right and made the products harder to see.
- Type: UI / layout.
- How I found it: I noticed it while opening and testing the collection search on my local website.
- Cause: The popup had position: absolute, so it did not take up space in the page layout and could overlap the cards.
- Fix: I first tried changing the HTML and CSS myself, but my attempt did not fix it. I asked Codex to help. The final changes were made in index.html and src/responsive.css. The controls were adjusted to use in-flow positioning and a flex layout so the search field could open beside its icon without covering the products.
- Did I use AI? For what? Yes. I discovered the layout problem and tried a manual fix. Codex helped with the final HTML/CSS changes and the layout test.
- How I checked: I opened the search again in my browser and saw that it no longer covered the product cards.
  Bug 3 — Header search did not close properly
- What I saw: The search panel at the top of the page stayed open when I pressed Escape after moving away from the search field. Refreshing the page made it disappear, but I wanted it to close normally.
- Type: UI / accessibility / event handling.
- How I found it: I noticed this while testing the header search in my browser. I tried opening the search, moving the focus, and pressing Escape.
- Cause: The closing condition checked whether the keyboard focus was still inside #search-panel. When the focus moved somewhere else, Escape did not close it.
- Fix: In src/modules/products/products.ui.ts, I changed the condition so Escape could close the panel whenever it was open. I also added closing after submitting a search and when clicking outside the panel. During this work, I accidentally added another document.addEventListener('click', ...) inside the products UI. Two automated tests failed because the project already had a global click listener in src/ui.ts. Codex helped me find and remove the duplicate listener. The existing listener in src/ui.ts now calls closeHeaderSearchOutside().
- Did I use AI? For what? Yes. I discovered the original problem and made the first changes myself. When two tests failed, I used Codex to understand the error and fix the extra event listener.
- How I checked: I tested all three cases in my browser: pressing Escape, clicking outside the search, and pressing Enter to search. All three worked.
  What I learned
  I learned that startsWith() and includes() give different search results, and that position: absolute can make a popup overlap other elements. I also learned why the project should have only one main document click listener. The product UI can provide functions, while src/ui.ts handles the global events and calls those functions.

After the last fix, Codex reported that typecheck, lint, formatting, build, and all 72 automated tests passed. I also checked the search behavior myself in the browser.
