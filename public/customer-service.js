/*
    Author: Thang Tran
    CS 132 Spring 2024
    Date: June 12th, 2024

    This is the customer-service.js page for my e-commerce site selling 
    Yu-Gi-Oh cards. It currently retrieves FAQs and their answers from the 
    Yu-Gi-Oh! Cards API to be displayed. It also features a review form where 
    users can submit their feedback.
*/

(function() {
    "use strict";

    const BASE_URL = "http://localhost:3000/api";

    const REVIEW_ERR = "Something went wrong while submitting your review. Please try again.";
    const SUCCESS_MESSAGE = "Successfully submitted review!";

    const FAQ = qs("#faq");
    const MAIN = qs("main");

    /**
     * Initializes the FAQ view and the review form for the user to submit
     * feedback.
     * @returns {void} 
     */
    function init() {
        fetchFAQ();

        qs("#feedback-form").addEventListener("submit", function(event) {
            event.preventDefault();
            postReview(); 
        });
    }

    /**
     * Uses the Yu-Gi-Oh! Card API to fetch FAQs, then populates the faq area 
     * with the returned questions and answers.
     * @returns {void}
     */
    async function fetchFAQ() {
        await fetch(BASE_URL + "/faq")
        .then(checkStatus)
        .then(response => response.json())
        .then(function(response) {
            populateFAQ(response, FAQ);
        })
        .catch(function(error) {
            handleError(error, FAQ);
        });
    }
        
    /**
     * Populates the faq view using the retrieved API data regarding FAQs.
     * @param {Object} faqData - data returned from the Yu-Gi-Oh! Cards API.
     * @returns {void}
     */
    async function populateFAQ(faqData) {
        for (const faq of faqData) {
            const div = gen("div");
            FAQ.appendChild(div);

            const q = gen("p");
            q.textContent = "Question: " + faq.question;
            div.appendChild(q);

            const a = gen("p");
            a.textContent = "Answer: " + faq.answer;
            div.appendChild(a);
        }
    }

    /**
     * Uses the form data to submit a user's website review, then displays a 
     * success message.
     * @returns {void}
     */
    async function postReview() {
        let url = BASE_URL + "/feedback";
        const form = qs("form");

        const params = new FormData(form);

        await fetch(url, {
            method: "POST",
            body: params
        })
        .then(checkStatus)
        .then(displaySuccessMessage)
        .catch(function() {
            handleError(REVIEW_ERR, MAIN);
        });
    }

    /**
     * Displays a preset success message, clearing any old messages from the
     * message area.
     * @returns {void}
     */
    function displaySuccessMessage() {
        for (const child of qsa("main > p")) {
            MAIN.removeChild(child);
        }

        const p = gen("p");
        p.textContent = SUCCESS_MESSAGE;
        MAIN.appendChild(p);
    }
  
    init();
})();
