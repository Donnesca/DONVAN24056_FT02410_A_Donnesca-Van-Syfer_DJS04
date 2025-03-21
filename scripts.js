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

// Function to create a book preview element (button).
function createBookPreview(book) {
  const element = document.createElement("button"); // Create a button element.
  element.classList = "preview"; // Add the "preview" class for styling.
  element.setAttribute("data-preview", book.id); // Set a data attribute to store the book ID.

  // Set the inner HTML of the button to display book information.
  element.innerHTML = `
        <img class="preview__image" src="${book.image}" />
        <div class="preview__info">
            <h3 class="preview__title">${book.title}</h3>
            <div class="preview__author">${authors[book.author]}</div>
        </div>
    `;

  return element; // Return the created book preview element.
}

// Function: Toggles the visibility of an overlay element.
function toggleOverlay(overlayElement, isOpen) {
  overlayElement.open = isOpen; // Set the "open" property of the overlay element.
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
  .querySelector("[data-search-cancel]")
  .addEventListener("click", () =>
    toggleOverlay(document.querySelector("[data-search-overlay]"), false)
  );
document
  .querySelector("[data-settings-cancel]")
  .addEventListener("click", () =>
    toggleOverlay(document.querySelector("[data-settings-overlay]"), false)
  );
document.querySelector("[data-header-search]").addEventListener("click", () => {
  toggleOverlay(document.querySelector("[data-search-overlay]"), true);
  document.querySelector("[data-search-title]").focus();
});
document
  .querySelector("[data-header-settings]")
  .addEventListener("click", () =>
    toggleOverlay(document.querySelector("[data-settings-overlay]"), true)
  );
document
  .querySelector("[data-list-close]")
  .addEventListener("click", () =>
    toggleOverlay(document.querySelector("[data-list-active]"), false)
  );

// Event listener for theme settings form submission.
document
  .querySelector("[data-settings-form]")
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
  .querySelector("[data-search-form]")
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
  .addEventListener("click", (event) => {
    const pathArray = Array.from(event.path || event.composedPath());
    let active = null; // Variable to store the selected book object.

    // Traverse the DOM tree to find the clicked book preview element.
    for (const node of pathArray) {
      if (node?.dataset?.preview) {
        // Find the book object in the 'books' array based on the 'data-preview' ID.
        active = books.find((book) => book.id === node.dataset.preview);
        break; // Stop searching once the book is found.
      }
    }

    // If a book preview was clicked.
    if (active) {
      // Open the book preview modal/dialog.
      document.querySelector("[data-list-active]").open = true;
      document.querySelector("[data-list-blur]").src = active.image;
      document.querySelector("[data-list-image]").src = active.image;

      // Set the book title, subtitle, and description.
      document.querySelector("[data-list-title]").innerText = active.title;
      document.querySelector("[data-list-subtitle]").innerText = `${
        authors[active.author]
      } (${new Date(active.published).getFullYear()})`;
      document.querySelector("[data-list-description]").innerText =
        active.description;
    }
  });
