/*
    Author: Thang Tran
    CS 132 Spring 2024
    Date: June 12th, 2024

    This is the shop.js for my e-commerce site selling Yu-Gi-Oh cards.
    It currently features togglability between the main view (hot releases and
    all products), the single product view, and the cart view. It also currently 
    manages the retrieval of products from the Yu-Gi-Oh! Card API, filtering 
    these products as desired by the user, and the user's cart.
*/

(function() {
    "use strict";

    const TIMER_DELAY = 500;
    const MAX_DISPLAY = 6;

    const BASE_URL = "http://localhost:3000/api";
    const SEARCH_URL = BASE_URL + "/cards?";

    const NO_CARDS = "There were no cards found at this time. Please check back later.";

    const MAIN = qs("main");
    const PRODUCT = qs("#product");
    const PRODUCTS = qs("#products-display");
    const PROMOS = qs("#promos-display");
    const RECOMMENDED = qs("#recommended-display");

    const CART = qs("#cart");
    const CART_ITEMS = qs("#cart > div");
    const CART_COUNT= qs("#cart-icon > p");
    const CART_VALUE = qs("#cart span");
    const CART_MESSAGE = qs("#cart-message");

    const STARS = qsa("#stars > span");
    const LEVEL = qs("#level");

    let numItems = 0;
    let items = {};
    let totalPrice = 0;

    /**
     * Initializes the images, cart icon, and back buttons to change views when 
     * clicked. Also initializes the promotion and all product views when the 
     * page is loaded, the cart checkout button, and the filtering system for
     * card searches.
     * @returns {void} 
     */
    function init() {
        if (PROMOS) {
            fetchPromos();
        }
        fetchProducts(null, null, null, null);
        
        qs("#back-btn").addEventListener("click", allView);
        qs("#cart-icon").addEventListener("click", enableCart);
        qs("#exit-cart-btn").addEventListener("click", disableCart);
        qs("#search-btn").addEventListener("click", initiateSearch);
        qs("#checkout-btn").addEventListener("click", checkOut);

        for (const star of STARS) {
            star.addEventListener("click", function() {
                updateStars(this.getAttribute("data-value"));
            });
        }

        qs("#stars > button").addEventListener("click", function() {
            updateStars(0);
        })

        loadCart();
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
     * Uses the Yu-Gi-Oh! Card API to fetch cards that are on sale, then 
     * populates the promotions/sales area with the returned cards. If an error
     * is encountered, informs the user with a message in the same area.
     * @returns {void}
     */
    async function fetchPromos() {
        await fetch(BASE_URL + "/promos")
        .then(checkStatus)
        .then(response => response.json())
        .then(function(response) {
            populateView(response, PROMOS);
        })
        .catch(function(error) {
            handleError(error, PROMOS);
        });
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
     * Uses the Yu-Gi-Oh! Card API to fetch cards that are most similar to the 
     * given card, then populates the recommended cards area with the returned 
     * cards (excluding the card itself). If an error is encountered, informs 
     * the user with a message in the same area.
     * @param {Object} cardsData - card data to get similar recommendations for.
     * @returns {void}
     */
    async function fetchRecommended(cardData) {
        let url = SEARCH_URL;
        const attribute = cardData.attribute;
        const type = cardData.type;

        if (attribute) {
            const attributeQuery = encodeURIComponent(attribute);
            url += `attribute=${attributeQuery}`;
        }
        else if (type) {
            const typeQuery = encodeURIComponent(type);
            url += `type=${typeQuery}`;
        }

        await fetch(url)
        .then(checkStatus)
        .then(response => response.json())
        .then(function(response) {
            populateView(response, RECOMMENDED, cardData.id);
        })
        .catch(function(error) {
            handleError(error, RECOMMENDED);
        });
    }

    /**
     * Populates the given view using the retrieved API data.
     * @param {Object} cardsData - data returned from the Yu-Gi-Oh! Cards API.
     * @param {Object} view - the view on the webpage to populate.
     * @param {number} [id] - optional card ID (to populate recommended cards).
     * @returns {void}
     */
    function populateView(cardsData, view, id=null) {
        const figures = view;

        for (let i = figures.children.length - 1; i >= 0; i--) {
            figures.removeChild(figures.children[i]);
        }

        if (id) {
            cardsData = cardsData.filter(cardData => cardData.id != id);
        }

        if (cardsData.length === 0) {
            handleError(NO_CARDS, figures);
        }
        else if (cardsData.length > MAX_DISPLAY) {
            cardsData = cardsData.slice(0, MAX_DISPLAY);
        }

        for (const cardData of cardsData) {
            const figure = genFigure(cardData);
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

        if (qs("#recommended-display")) {
            fetchRecommended(cardData);
        }
    }

    /**
     * Updates the cart view using the retrieved API data.
     * @param {Object} cardData - data returned from the Yu-Gi-Oh! Cards API.
     * @param {boolean} add - whether we are adding or removing from the cart.
     * @returns {void}
     */
    function updateCart(cardData, add) {
        const id = cardData.id;

        let value = 1;
        if (!add) {
            value = -1;
        }

        updateGlobals(cardData, value);

        qs("#cart-icon > p").textContent = numItems;

        const newFigure = genCartFigure(cardData, items[id]);
        const figure = qs(`[data-id="${id}"]`);

        if (!items[id]) {
            CART_ITEMS.removeChild(figure);
        }
        else if (items[id] === 1 && add) {
            CART_ITEMS.appendChild(newFigure);
        }
        else {
            CART_ITEMS.replaceChild(newFigure, figure);
        }

        qs("#cart span").textContent = totalPrice.toFixed(2);
        CART_MESSAGE.textContent = "";
        saveCart();
    }

    /**
     * Generates a figure to display in product views based on a given Yu-Gi-Oh! card.
     * @param {Object} cardData - one Yu-Gi-Oh! card from the API.
     * @returns {Object} - the returned figure DOM element.
     */
    function genFigure(cardData) {
        const figure = gen("figure");

        const div = gen("div");
        figure.appendChild(div);

        const img = gen("img");
        img.src = cardData.image_url;
        img.alt = cardData.name;
        div.appendChild(img);

        img.addEventListener("click", singleView);
        img.addEventListener("click", function() {
            populateProduct(cardData);
        });

        const button = gen("button");
        button.classList.add("add-btn");
        button.textContent = "+";
        div.appendChild(button);

        button.addEventListener("click", function() {
            updateCart(cardData, true);
            changeFigureColor(figure);
        })

        const caption = genFigureCaption(cardData);
        figure.appendChild(caption);

        return figure;
    }

    /**
     * Generates a figure to display in the cart based on a given Yu-Gi-Oh! card.
     * @param {Object} cardData - one Yu-Gi-Oh! card from the API.
     * @param {Object} quantity - current quantity of the card in the cart.
     * @returns {Object} - the returned figure DOM element.
     */
    function genCartFigure(cardData, quantity) {
        const figure = gen("figure");
        figure.setAttribute('data-id', cardData.id);

        const div = gen("div");
        figure.appendChild(div);

        const img = gen("img");
        img.src = cardData.image_url;
        img.alt = cardData.name;
        div.appendChild(img);

        const button = gen("button");
        button.classList.add("subtract-btn");
        button.textContent = "-";
        div.appendChild(button);

        button.addEventListener("click", function() {
            updateCart(cardData, false);
            changeFigureColor(figure);
        })

        const caption = genFigureCaption(cardData, quantity);
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
        const price = gen("p");

        if (!quantity && cardData.sale_price) {
            price.textContent = `Sale price: $${cardData.sale_price.toFixed(2)}` + 
            ` (${(100 * (1 - (cardData.sale_price / cardData.price))).toFixed(0)}% off!)`;
        }
        else if (cardData.sale_price) {
            price.textContent = `Price: $${(cardData.sale_price * value).toFixed(2)}`;
        }
        else {
            price.textContent = `Price: $${(cardData.price * value).toFixed(2)}`;
        }

        caption.appendChild(price);
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
            if (!(key === "id" || key === "price" || key === "sale_price" || 
                  key === "image_url")) {
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
     * Simulates a successful purchase and clears the cart.
     * @returns {void}
     */
    function checkOut() {
        if (numItems === 0) {
            CART_MESSAGE.textContent = "Your cart is empty!"
        }
        else {
            for (let i = CART_ITEMS.children.length - 1; i >= 0; i--) {
                CART_ITEMS.removeChild(CART_ITEMS.children[i]);
            }

            numItems = 0;
            CART_COUNT.textContent = numItems;

            totalPrice = 0;
            CART_VALUE.textContent = totalPrice.toFixed(2);

            items = {};
            saveCart();

            CART_MESSAGE.textContent = "Checkout successful! Enjoy your new cards!";
        }
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
     * Enables the visibility of the cart view. 
     * @returns {void} 
     */
    function enableCart() {
        CART.classList.remove("hidden");
    }

    /**
     * Disables the visibility of the cart view. 
     * @returns {void} 
     */
    function disableCart() {
        CART.classList.add("hidden");
    }

    /**
     * Upon successfully adding a card to the cart, changes the background color
     * of the figure for a brief moment as an indicator that the card was 
     * successfully added.
     * @param {Object} figure - the figure DOM element to be changed.
     * @returns {void} 
     */
    function changeFigureColor(figure) {
        figure.classList.add("selected");
        setTimeout(function() {
            figure.classList.remove("selected");
        }, TIMER_DELAY);
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
     * Updates the global variables that represent the contents of the cart.
     * @param {Object} cardData - data returned from the Yu-Gi-Oh! Cards API.
     * @param {number} value - indicates adding to or subtracting from the cart.
     * @returns {void}
     */
    function updateGlobals(cardData, value) {
        const id = cardData.id;

        if (items[id]) {
            items[id] += value;
        }
        else {
            items[id] = 1;
        }
        numItems += value;

        if (cardData.sale_price) {
            totalPrice += cardData.sale_price * value;
        }
        else {
            totalPrice += cardData.price * value;
        }
    }

    /**
     * Saves the contents of the cart into localStorage.
     * @returns {void}
     */
    function saveCart() {
        localStorage.setItem("items", JSON.stringify(items));
    }

    /**
     * Loads the contents of the cart from localStorage.
     * @returns {void}
     */
    async function loadCart() {
        const cards = JSON.parse(localStorage.getItem("items"));
        for (const key of Object.keys(cards)) {
            await fetch(BASE_URL + `/cards/${key}`)
            .then(checkStatus)
            .then(response => response.json())
            .then(function(response) {
                for (let i = 0; i < cards[key]; i++) {
                    updateCart(response, true);
                }
            })
            .catch(function(error) {
                handleError(error, CART_MESSAGE);
            });
        }
    }
  
    init();
})();
