/*
    TODO
*/

(function() {
    "use strict";

    const MAX_DISPLAY = 6;
    const MAX_DECK_SIZE = 60;

    const BASE_URL = "http://localhost:3000/sql";
    const SEARCH_URL = BASE_URL + "/cards?";

    const NO_CARDS = "There were no cards found at this time. Please check back later.";

    const MAIN = qs("main");
    const PRODUCT = qs("#product");
    const PRODUCTS = qs("#products-display");
    const DECK = qs("#deck-display");

    const STARS = qsa("#stars > span");
    const LEVEL = qs("#level");

    let deckSize = 0;

    /**
     * Initializes the images, cart icon, and back buttons to change views when 
     * clicked. Also initializes the promotion and all product views when the 
     * page is loaded, the cart checkout button, and the filtering system for
     * card searches.
     * @returns {void} 
     */
    function init() {
        fetchProducts(null, null, null, null);
        loadDeck();
        
        qs("#back-btn").addEventListener("click", allView);
        qs("#search-btn").addEventListener("click", initiateSearch);

        for (const star of STARS) {
            star.addEventListener("click", function() {
                updateStars(this.getAttribute("data-value"));
            });
        }

        qs("#stars > button").addEventListener("click", function() {
            updateStars(0);
        })
    }

    /**
     * Using the data from the page's search filter, performs a search for cards
     * matching the given parameters.
     * @returns {void}
     */
    function initiateSearch() {
        const searchBar = qs("#search-bar");
        const select = qs("#search-filter > select");

        let level = null;
        let type = null;
        let attribute = null;

        switch (select.value) {
            case "Filter By...":
                level = LEVEL.value;
                break;
            case "Trap Card":
            case "Spell Card":
                type = select.value;
                break;
            default:
                level = LEVEL.value;
                attribute = select.value;
                break;
        }

        if (level <= 0) {
            level = null;
        }
            
        fetchProducts(searchBar.value, type, level, attribute);
    }

    /**
     * Uses the Yu-Gi-Oh! Card API to fetch cards that match the given 
     * parameters, then populates the all products area with the returned cards.
     * Since each parameter is optional, parameters that are not defined 
     * (i.e., are null) are skipped in the search. If an error
     * is encountered, informs the user with a message in the same area.
     * @param {string} name - search query for the card's name.
     * @param {string} type - search query for the card's type.
     * @param {number} level - search query for the card's level.
     * @param {string} attribute - search query for the card's attribute.
     * @returns {void}
     */
    async function fetchProducts(name, type, level, attribute) {
        let url = SEARCH_URL;

        if (name) {
            const nameQuery = encodeURIComponent(name);
            url += `name=${nameQuery}&`;
        }
        if (type) {
            const typeQuery = encodeURIComponent(type);
            url += `type=${typeQuery}&`;
        }
        if (level) {
            const levelQuery = encodeURIComponent(level);
            url += `level=${levelQuery}&`;
        }
        if (attribute) {
            const attributeQuery = encodeURIComponent(attribute);
            url += `attribute=${attributeQuery}&`;
        }

        await fetch(url)
        .then(checkStatus)
        .then(response => response.json())
        .then(function(response) {
            populateView(response, PRODUCTS);
        })
        .catch(function(error) {
            handleError(error, PRODUCTS);
        });
    }

    /**
     * TODO add card
     * @returns {void} 
     */
    async function addCardToDeck(cardData) {
        let url = BASE_URL + "/decks";
        const user_id = localStorage.getItem("user_id");
        const params = { "user_id": user_id, "card_id": cardData['card_id'] };

        if (user_id !== null) {
            await fetch(url, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(params)
            })
            .then(checkStatus)
            .then(function() {
                clearRecommendations(DECK);
                deckSize += 1;
            })
            .then(function() {
                populateView([cardData], DECK, null, false, false);
            })
            .then(updateRecommendations)
            .catch(function(error) {
                handleError(error, DECK);
            });
        }
        else {
            handleError('You must be logged in!', DECK);
        }
    }

    /**
     * Updates and displays the user's new card recommendations.
     * @returns {void}
     */
    async function updateRecommendations() {
        const user_id = JSON.parse(localStorage.getItem("user_id"));
        
        if (user_id !== null) {
            await fetch(BASE_URL + `/recommended/${user_id}`)
            .then(checkStatus)
            .then(response => response.json())
            .then(function(response) {
                populateView(response, DECK, null, false, true, 
                             MAX_DECK_SIZE - deckSize, true);
            })
            .catch(function(error) {
                handleError(error, DECK);
            });
        }
    }

    /**
     * Clears the user's current card recommendations.
     * @param {Object} view - the view on the webpage to clear.
     * @returns {void}
     */
    async function clearRecommendations(view) {
        const figures = view;
        if (deckSize > 0) {
            for (let i = MAX_DECK_SIZE - 1; i >= deckSize; i--) {
                figures.removeChild(figures.children[i]);
            }
        }
    }

    /**
     * Populates the given view using the retrieved API data.
     * @param {Object} cardsData - data returned from the Yu-Gi-Oh! Cards API.
     * @param {Object} view - the view on the webpage to populate.
     * @param {number} [id] - optional card ID (to populate recommended cards).
     * @param {boolean} [clear] optional parameter to clear a view before population.
     * @param {boolean} [addButtons] optional parameter to add the "plus" to the side of cards.
     * @param {number} [display] - optional parameter to control to much to populate the view.
     * @param {boolean} [isRecommended] optional parameter to distinguish between recommended
     *                                  and non-recommended cards (opaque vs. transluscent).
     * @returns {void}
     */
    function populateView(cardsData, view, id=null, clear=true, addButtons=true, 
                          display=MAX_DISPLAY, isRecommended=false) {
        const figures = view;

        if (clear) {
            for (let i = figures.children.length - 1; i >= 0; i--) {
                figures.removeChild(figures.children[i]);
            }
        }

        if (id) {
            cardsData = cardsData.filter(cardData => cardData.id != id);
        }

        if (cardsData.length === 0) {
            handleError(NO_CARDS, figures);
        }
        else if (cardsData.length > display) {
            cardsData = cardsData.slice(0, display);
        }

        for (const cardData of cardsData) {
            const figure = genFigure(cardData, addButtons, isRecommended);
            figures.appendChild(figure);
        }
    }

    /**
     * Populates the single product view using the retrieved API data, as well
     * as the recommended cards view if applicable.
     * @param {Object} cardData - data returned from the Yu-Gi-Oh! Cards API.
     * @returns {void}
     */
    function populateProduct(cardData) {
        const view = qs("#product > div");
        for (let i = view.children.length - 1; i >= 0; i--) {
            view.removeChild(view.children[i]);
        }

        const figure = genFigure(cardData);
        view.appendChild(figure);

        const ul = genList(cardData);
        view.appendChild(ul);
    }

    /**
     * Generates a figure to display in product views based on a given Yu-Gi-Oh! card.
     * @param {Object} cardData - one Yu-Gi-Oh! card from the API.
     * @param {boolean} [addButtons] optional parameter to add the "plus" to the side of cards.
     * @param {boolean} [isRecommended] optional parameter to distinguish between recommended
     *                                  and non-recommended cards (opaque vs. transluscent).
     * @returns {Object} - the returned figure DOM element.
     */
    function genFigure(cardData, addButtons=true, isRecommended=false) {
        const figure = gen("figure");

        const div = gen("div");
        figure.appendChild(div);

        const img = gen("img");
        img.src = 'https://images.ygoprodeck.com/images/cards/55144522.jpg';
        img.alt = cardData.name;
        if (isRecommended) {
            img.classList.add("recommended");
        }
        div.appendChild(img);

        img.addEventListener("click", singleView);
        img.addEventListener("click", function() {
            populateProduct(cardData);
        });

        if (addButtons) {
            const button = gen("button");
            button.classList.add("add-btn");
            button.textContent = "+";
            div.appendChild(button);
    
            button.addEventListener("click", function() {
                addCardToDeck(cardData);
            });
        }

        const caption = genFigureCaption(cardData);
        figure.appendChild(caption);

        return figure;
    }

    /**
     * Generates a figure caption used by both the display figures and cart
     * figures in order to factor out redundancy.
     * @param {Object} cardData - one Yu-Gi-Oh! card from the API.
     * @param {Object} [quantity] - current quantity of the card in the cart.
     * @returns {Object} - the returned caption DOM element.
     */
    function genFigureCaption(cardData, quantity=null) {
        const caption = gen("figcaption");
        let value = quantity;

        const desc = gen("p");
        desc.textContent = cardData.name;

        if (quantity) {
            desc.textContent += ` x ${quantity}`;
        }
        else {
            value = 1;
        }

        caption.appendChild(desc);
        return caption;
    }

    /**
     * Generates a list of characteristics based on a given Yu-Gi-Oh! card.
     * @param {Object} cardData - one Yu-Gi-Oh! card from the API.
     * @returns {Object} - the returned list DOM element.
     */
    function genList(cardData) {
        const list = gen("ul");

        for (const key of Object.keys(cardData)) {
            if (!(key === "effect")) {
                const li = gen("li");

                if (!cardData[key]) {
                    li.textContent = `${key}: N/A`;
                }
                else {
                    li.textContent = `${key}: ${cardData[key]}`;
                }

                list.appendChild(li);
            }
        }

        return list;
    }

    /**
     * Switches to the single product view. 
     * @returns {void} 
     */
    function singleView() {
        MAIN.classList.add("hidden");
        PRODUCT.classList.remove("hidden");
    }

    /**
     * Switches to the all product view.  
     * @returns {void} 
     */
    function allView() {
        MAIN.classList.remove("hidden");
        PRODUCT.classList.add("hidden");
    }

    /**
     * Updates the search filter's star interface.
     * @param {number} stars - the number of active stars.
     * @returns {void}
     */
    function updateStars(stars) {
        LEVEL.value = stars;

        for (const star of STARS) {
            star.classList.remove("inactive");
        }

        for (let i = STARS.length - 1; i >= stars; i--) {
            STARS[i].classList.add("inactive");
        }
    }

    /**
     * Loads the contents of the user's deck from localStorage.
     * @returns {void}
     */
    async function loadDeck() {
        const user_id = JSON.parse(localStorage.getItem("user_id"));
        
        if (user_id !== null) {
            await fetch(BASE_URL + `/decks/${user_id}`)
            .then(checkStatus)
            .then(response => response.json())
            .then(function(response) {
                deckSize += response.length;
                populateView(response, DECK, null, false, false, response.length);
            })
            .then(updateRecommendations)
            .catch(function(error) {
                console.log(error);
                handleError(error, DECK);
            });
        }
    }
  
    init();
})();
