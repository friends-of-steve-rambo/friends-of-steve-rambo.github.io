// ============================================================
// Общий футер для всех страниц.
// ============================================================

(function () {
    'use strict';

    var footer = document.querySelector('[data-role="site-footer"]');

    if (!footer) {
        return;
    }

    var startYear = 2026;
    var currentYear = new Date().getFullYear();
    var years = currentYear > startYear
        ? startYear + '–' + currentYear
        : String(startYear);

    footer.innerHTML =
        '<p>© ' + years + ' Стив Рембо и его друзья</p>' +
        '<p>По техническим вопросам: ' +
            '<a href="https://discord.com/users/264851238267518977" target="_blank" rel="noopener noreferrer">Discord</a>' +
        '</p>' +
        '<p>По прочим вопросам писать лично Стиву из Майнкрафта.</p>' +
        '<p>Никакие права не защищены.</p>';
})();
