import { books, authors, genres, BOOKS_PER_PAGE } from "./data.js";

let page = 1; // Tracks the current page of displayed books.
let matches = books; // Stores the books to be displayed, initially all books.

// Configuration object: Stores configurable values.
const config = {
  booksPerPage: BOOKS_PER_PAGE, // Number of books to display per page.
};

// Function: Retrieves books based on filter criteria.
function getBooks(filters = {}) {
  let result = books; // Start with all books.

  // Filter by title if a title is provided.
  if (filters.title) {
    result = result.filter((book) =>
      book.title.toLowerCase().includes(filters.title.toLowerCase())
    );
  }

  // Filter by author if an author is selected.
  if (filters.author && filters.author !== "any") {
    result = result.filter((book) => book.author === filters.author);
  }

  // Filter by genre if a genre is selected.
  if (filters.genre && filters.genre !== "any") {
    result = result.filter((book) => book.genres.includes(filters.genre));
  }

  return result; // Return the filtered book list.
}

// Custom Element: BookPreview - displays a single book preview.
class BookPreview extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" }); // Attach shadow DOM for encapsulation.
  }

  connectedCallback() {
    // Get attributes passed to the component
    const image = this.getAttribute("image");
    const title = this.getAttribute("title");
    const author = this.getAttribute("author");

    // Set the HTML structure and styling for the book preview.
    this.shadowRoot.innerHTML = `
      <style>
        .preview {
          display: flex;
          align-items: center;
          background: white;
          border-radius: 5px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          cursor: pointer;
          padding: 10px;
          transition: box-shadow 0.3s ease;
        }
        .preview:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .preview__image {
          width: 50px;
          height: 75px;
          object-fit: cover;
          margin-right: 10px;
        }
        .preview__info {
          flex-grow: 1;
        }
        .preview__title {
          font-size: 16px;
          margin: 0;
          font-weight: bold;
        }
        .preview__author {
          font-size: 14px;
          color: gray;
        }
      </style>

      <div class="preview">
        <img class="preview__image" src="${image}" alt="Book cover" />
        <div class="preview__info">
          <h3 class="preview__title">${title}</h3>
          <div class="preview__author">${author}</div>
        </div>
      </div>
    `;

    // Add event listener for click on the book preview.
    this.shadowRoot.querySelector(".preview").addEventListener("click", () => {
      // Dispatch a custom event with the book's ID, allowing parent components to handle the click
      this.dispatchEvent(
        new CustomEvent("book-selected", {
          detail: { id: this.getAttribute("id") },
          bubbles: true, // Allows the event to bubble up in the DOM tree
          composed: true, // Allows the event to pass through shadow DOM boundaries
        })
      );
    });
  }
}

// Define the custom element "book-preview" for use in HTML.
customElements.define("book-preview", BookPreview);

// Function to create a book preview element (custom element) for a given book.
function createBookPreview(book) {
  const element = document.createElement("book-preview"); // Create an instance of the custom element.

  // Set attributes for the book preview element based on the book data.
  element.setAttribute("image", book.image);
  element.setAttribute("title", book.title);
  element.setAttribute("author", authors[book.author]); // Retrieve author name from the authors object.
  element.setAttribute("id", book.id); // Set the book ID as an attribute.
  return element; // Return the created book preview element.
}

// Function: Toggles the visibility of an overlay element (modal).
function toggleOverlay(overlayElement, isOpen) {
  overlayElement.open = isOpen; // Set the "open" property of the overlay element to show or hide it.
}

// Function: Updates the remaining book count and "Show more" button state.
function updateRemainingBookCount(matches, page) {
  const remaining =
    matches.length - page * config.booksPerPage > 0
      ? matches.length - page * config.booksPerPage
      : 0; // Calculate the remaining number of books.

  // Update the "Show more" button text and remaining count.
  document.querySelector("[data-list-button]").innerHTML = `
        <span>Show more</span>
        <span class="list__remaining"> (${remaining})</span>
    `;

  // Disable the "Show more" button if no more books are remaining.
  document.querySelector("[data-list-button]").disabled = remaining < 1;
}

// Function: Displays a section of books from a book list.
function displayBooks(bookList, start, end) {
  const fragment = document.createDocumentFragment(); // Create a document fragment for efficient DOM manipulation.

  // Iterate over the specified section of the book list and create book previews.
  bookList.slice(start, end).forEach((book) => {
    fragment.appendChild(createBookPreview(book)); // Append the created preview to the fragment.
  });

  // Append the fragment to the list items container.
  document.querySelector("[data-list-items]").appendChild(fragment);
}

// Display the initial set of books.
displayBooks(matches, 0, config.booksPerPage);

// Function: Populates a dropdown (select) element with options.
function populateDropdown(dropdownSelector, data, allOptionText) {
  const fragment = document.createDocumentFragment(); // Create a document fragment.
  const firstOption = document.createElement("option"); // Create the "All" option.
  firstOption.value = "any";
  firstOption.innerText = allOptionText;
  fragment.appendChild(firstOption); //Add the "All" option to the fragment.

  // Iterate over the data (genres or authors) and create options.
  for (const [id, name] of Object.entries(data)) {
    const option = document.createElement("option"); // Create an option element.
    option.value = id; // Set the option value to the ID.
    option.innerText = name; // Set the option text to the name.
    fragment.appendChild(option); // Add the option to the fragment.
  }

  // Append the fragment to the dropdown element.
  document.querySelector(dropdownSelector).appendChild(fragment);
}

// Populate genre and author dropdowns.
populateDropdown("[data-search-genres]", genres, "All Genres");
populateDropdown("[data-search-authors]", authors, "All Authors");

// Theme setup (remains mostly the same)
if (
  window.matchMedia &&
  window.matchMedia("(prefers-color-scheme: dark)").matches
) {
  document.querySelector("[data-settings-theme]").value = "night";
  document.documentElement.style.setProperty("--color-dark", "255, 255, 255");
  document.documentElement.style.setProperty("--color-light", "10, 10, 20");
} else {
  document.querySelector("[data-settings-theme]").value = "day";
  document.documentElement.style.setProperty("--color-dark", "10, 10, 20");
  document.documentElement.style.setProperty("--color-light", "255, 255, 255");
}

// Update the initial remaining book count.
updateRemainingBookCount(matches, page);

// Event listeners (refactored using abstractions)
document
  .querySelector("[data-search-cancel]") // Select the search cancel button.
  .addEventListener(
    "click",
    () => toggleOverlay(document.querySelector("[data-search-overlay]"), false) // Close the search overlay when the cancel button is clicked.
  );
document
  .querySelector("[data-settings-cancel]") // Select the settings cancel button.
  .addEventListener(
    "click",
    () =>
      toggleOverlay(document.querySelector("[data-settings-overlay]"), false) // Close the settings overlay when the cancel button is clicked.
  );
document.querySelector("[data-header-search]").addEventListener("click", () => {
  toggleOverlay(document.querySelector("[data-search-overlay]"), true); // Close the settings overlay when the cancel button is clicked.
  document.querySelector("[data-search-title]").focus(); // Focus on the search title input for user convenience.
});
document
  .querySelector("[data-header-settings]")
  .addEventListener("click", () =>
    toggleOverlay(document.querySelector("[data-settings-overlay]"), true)
  );
document
  .querySelector("[data-list-close]") // Select the list close button.
  .addEventListener(
    "click",
    () => toggleOverlay(document.querySelector("[data-list-active]"), false) // Close the book preview overlay when the list close button is clicked.
  );

// Event listener for theme settings form submission.
document
  .querySelector("[data-settings-form]") // Select the settings form.
  .addEventListener("submit", (event) => {
    event.preventDefault(); // Prevent the default form submission.
    const formData = new FormData(event.target); // Get form data.
    const { theme } = Object.fromEntries(formData); // Extract the selected theme.
    const darkColor = theme === "night" ? "255, 255, 255" : "10, 10, 20"; // Determine dark color based on theme.
    const lightColor = theme === "night" ? "10, 10, 20" : "255, 255, 255"; // Determine light color based on theme.
    document.documentElement.style.setProperty("--color-dark", darkColor); // Set dark color CSS variable.
    document.documentElement.style.setProperty("--color-light", lightColor); // Set light color CSS variable.
    toggleOverlay(document.querySelector("[data-settings-overlay]"), false); // Close the settings overlay.
  });

// Event listener for search form submission.
document
  .querySelector("[data-search-form]") // Select the search form.
  .addEventListener("submit", (event) => {
    event.preventDefault(); // Prevent default form submission.
    const formData = new FormData(event.target); // Get form data.
    const filters = Object.fromEntries(formData); // Extract search filters.
    matches = getBooks(filters); // Filter books based on search criteria.
    page = 1; // Reset the page to 1.

    document.querySelector("[data-list-items]").innerHTML = ""; // Clear the book list.
    if (matches.length < 1) {
      document
        .querySelector("[data-list-message]")
        .classList.add("list__message_show"); // Show "no results" message.
    } else {
      document
        .querySelector("[data-list-message]")
        .classList.remove("list__message_show"); // Hide "no results" message.
      displayBooks(matches, 0, config.booksPerPage); // Display the first page of filtered books.
    }
    updateRemainingBookCount(matches, page); // Update the remaining book count.
    window.scrollTo({ top: 0, behavior: "smooth" }); // Scroll to the top of the page smoothly.
    toggleOverlay(document.querySelector("[data-search-overlay]"), false); //close the search overlay.
  });

// Event listener for the "Show More" button.
document.querySelector("[data-list-button]").addEventListener("click", () => {
  // Display the next page of books.
  displayBooks(
    matches,
    page * config.booksPerPage, // Calculate the starting index for the next page.
    (page + 1) * config.booksPerPage // Calculate the ending index for the next page.
  );
  page += 1; // Increment the page number.
  updateRemainingBookCount(matches, page); // Update the displayed remaining books count.
});

// Event listener for clicks on book list items (for preview).
document
  .querySelector("[data-list-items]")
  .addEventListener("book-selected", (event) => {
    const selectedBookId = event.detail.id; // Get the selected book ID.
    const active = books.find((book) => book.id === selectedBookId); // Find the book based on the ID.

    // If a book preview was clicked.
    if (active) {
      // Open the book preview modal/dialog.
      document.querySelector("[data-list-active]").open = true; // Open the preview modal
      document.querySelector("[data-list-blur]").src = active.image; // Set the blurred background image.
      document.querySelector("[data-list-image]").src = active.image; // Set the ain book image.

      // Set the book title, subtitle, and description.
      document.querySelector("[data-list-title]").innerText = active.title; // Set the book title.
      document.querySelector("[data-list-subtitle]").innerText = `${
        authors[active.author]
      } (${new Date(active.published).getFullYear()})`; // Set the author and publication year.
      document.querySelector("[data-list-description]").innerText =
        active.description; // Set the book description.
    }
  });
