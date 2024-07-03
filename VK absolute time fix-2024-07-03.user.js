// ==UserScript==
// @name         VK absolute time fix
// @namespace    http://tampermonkey.net/
// @version      2024-07-03
// @description  Changes useless relative time to absolute one in wall posts
// @author       dph
// @match        https://vk.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=vk.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    // Function to format a Date object as YYYY-MM-DD HH:mm
    function formatDateTime(date) {
        const padZero = (num) => num.toString().padStart(2, '0');
        const year = date.getFullYear();
        const month = padZero(date.getMonth() + 1);
        const day = padZero(date.getDate());
        const hours = padZero(date.getHours());
        const minutes = padZero(date.getMinutes());
        return `${year}-${month}-${day} (${hours}:${minutes})`;
    }

    // Function to parse Russian date strings into Date objects
    function parseRussianDate(dateString) {
        const now = new Date();
        let date;

        if (dateString.startsWith('сегодня')) {
            const parts = dateString.split('в ');
            if (parts.length > 1) {
                const timePart = parts[1];
                const [hours, minutes] = timePart.split(':').map(Number);
                date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
            }
        } else if (dateString.startsWith('вчера')) {
            const parts = dateString.split('в ');
            if (parts.length > 1) {
                const timePart = parts[1];
                const [hours, minutes] = timePart.split(':').map(Number);
                date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, hours, minutes);
            }
        } else {
            const monthNames = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
            const parts = dateString.split(' ');
            if (parts.length > 3) {
                const day = parseInt(parts[0]);
                const month = parts[1];
                const monthIndex = monthNames.indexOf(month);
                const timePart = parts[3];
                const [hours, minutes] = timePart.split(':').map(Number);
                date = new Date(now.getFullYear(), monthIndex, day, hours, minutes);
            }
        }

        return date;
    }

    function updateTimeText() {
        // Helper function to parse and format date
        function updateElementText(element, dateString) {
            const parsedDate = parseRussianDate(dateString);
            if (parsedDate) {
                const formattedDate = formatDateTime(parsedDate);
                if (element.textContent !== formattedDate) {
                    element.textContent = formattedDate;
                    return true;
                }
            }
            return false;
        }

        // Select all elements with the specified class and first child span
        const elements = document.querySelectorAll(".PostHeaderSubtitle__item span.rel_date, .PostHeaderSubtitle__item");
        let replacedCount = 0;
        console.log(`[absolute time fix script] Script triggered, found ${elements.length} elements`);

        elements.forEach(element => {
            const absTimeString = element.getAttribute("abs_time");
            if (absTimeString) {
                if (updateElementText(element, absTimeString)) {
                    replacedCount++;
                }
            } else if (element.textContent) {
                if (updateElementText(element, element.textContent.trim())) {
                    replacedCount++;
                }
            }
        });

        // Print the number of replaced values
        console.log(`[absolute time fix script] Replaced ${replacedCount} values.`);
    }

    // Function to observe changes in the DOM
    function observeDOMChanges() {
        const targetNode = document.body;

        const config = { childList: true, subtree: true };

        const callback = function(mutationsList, observer) {
            for (let mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    updateTimeText();
                }
            }
        };

        const observer = new MutationObserver(callback);

        observer.observe(targetNode, config);
    }

    // Initial call to update immediately on script load
    updateTimeText();

    // Observe DOM changes to update when new content is loaded
    observeDOMChanges();
})();