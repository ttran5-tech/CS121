/**
 * CS 132
 * Provided global DOM accessor aliases.
 * These are the ONLY functions that should be global in your submissions.
 */

/**
 * Returns the first element that matches the given CSS selector.
 * @param {string} selector - CSS query selector string.
 * @returns {object} first element matching the selector in the DOM tree
 * (null if none)
 */
function qs(selector) {
    return document.querySelector(selector);
}

/**
 * Returns the array of elements that match the given CSS selector.
 * @param {string} selector - CSS query selector
 * @returns {object[]} array of DOM objects matching the query (empty if none).
 */
function qsa(selector) {
    return document.querySelectorAll(selector);
}

/**
 * Returns a new element with the given tagName
 * @param {string} tagName - name of element to create and return
 * @returns {object} new DOM element with the given tagName (null if none)
 */
function gen(tagName) {
    return document.createElement(tagName);
}

/**
 * Helper function to return the Response data if successful, otherwise
 * returns an Error that needs to be caught.
 * @param {object} response - response with status to check for success/error.
 * @returns {object} - The Response object if successful, otherwise an Error 
 * that needs to be caught.
 */
function checkStatus(response) {
    if (!response.ok) { 
        throw Error(`Error in request: ${response.statusText}`);
    } 
    return response; 
}

/**
 * Displays an error message on the page in the given view. Can be configured 
 * to show a custom error message, and otherwise displays a generic message.
 * @param {String} message - optional specific error message to display.
 * @param {TODO} view - the view on the webpage to display the message.
 * @returns {void}
 */
function handleError(message, view) {
    const p = gen("p");
    view.appendChild(p);

    if (typeof message === "string") {
        p.textContent = message;
    } 
    else {
        p.textContent = "Something went wrong, check back later.";
    }

    setTimeout(function() {
        view.removeChild(p);
    }, 3000);
}