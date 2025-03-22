/*
    TODO
*/

(function() {
    "use strict";

    const BASE_URL = "http://localhost:3000/sql";
    const SUCCESS_REGIS_MESSAGE = "Successfully registered!";
    const LOGOUT_MESSAGE = "Logged out!"

    const LOGIN = qs("#login-form");
    const REGISTER = qs("#register-form");
    const LOGOUT = qs("#logout-section");
    const MAIN = qs("main");

    /**
     * TODO
     * @returns {void} 
     */
    function init() {
        loadUser();

        LOGIN.addEventListener("submit", function(event) {
            event.preventDefault();
            checkLogin(); 
        });

        REGISTER.addEventListener("submit", function(event) {
            event.preventDefault();
            register(); 
        });

        qs("#logout-section > button").addEventListener("click", logout);
    }

    /**
     * TODO
     * @returns {void}
     */
    async function checkLogin() {
        let url = BASE_URL + "/login";

        const params = new FormData(LOGIN);

        await fetch(url, {
            method: "POST",
            body: params
        })
        .then(checkStatus)
        .then(response => response.json())
        .then(function(response) {
            login(response['user_id'], response['username']);
        })
        .catch(function(error) {
            handleError(error, MAIN);
        });
    }

    /**
     * TODO
     * @returns {void}
     */
    async function register() {
        let url = BASE_URL + "/register";

        const params = new FormData(REGISTER);

        await fetch(url, {
            method: "POST",
            body: params
        })
        .then(checkStatus)
        .then(displaySuccessMessage(SUCCESS_REGIS_MESSAGE))
        .catch(function(error) {
            handleError(error, MAIN);
        });
    }

    /**
     * Save_user_login TODO
     * @returns {void}
     */
    function login(user_id, username) {
        localStorage.setItem("user_id", JSON.stringify(user_id));
        localStorage.setItem("username", JSON.stringify(username));

        qs("#logout-section > h2").textContent = `Welcome, ${username}!`;

        LOGIN.classList.add("hidden");
        REGISTER.classList.add("hidden");
        LOGOUT.classList.remove("hidden");

        for (const input of qsa("input")) {
            input.value = "";
        }
    }

    /**
     * log out TODO
     * @returns {void}
     */
    function logout() {
        localStorage.removeItem("user_id");
        localStorage.removeItem("username");

        displaySuccessMessage(LOGOUT_MESSAGE);

        LOGIN.classList.remove("hidden");
        REGISTER.classList.remove("hidden");
        LOGOUT.classList.add("hidden");
    }

    /**
     * load user TODO
     * @returns {void}
     */
    function loadUser() {
        const id = JSON.parse(localStorage.getItem("user_id"));
        const username = JSON.parse(localStorage.getItem("username"));
        if (id !== null && username !== null) {
            login(id, username);
        }
    }

    /**
     * Displays a preset success message, clearing any old messages from the
     * message area.
     * @returns {void}
     */
    function displaySuccessMessage(message) {
        for (const child of qsa("main > p")) {
            MAIN.removeChild(child);
        }

        const p = gen("p");
        p.textContent = message;
        MAIN.appendChild(p);
    }
  
    init();
})();
