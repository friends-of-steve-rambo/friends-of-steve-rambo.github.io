// ============================================================
// Общий скрипт сайта.
//
// Данные лежат в js/data.js (window.GAMES). Скрипт:
//   - строит навигацию по списку игр;
//   - рисует карточки игр на главной;
//   - заполняет общий шаблон game.html данными игры;
//   - отрисовывает сборы по месяцам и списки донатеров.
// ============================================================

(function () {
    'use strict';

    var games = Array.isArray(window.GAMES) ? window.GAMES : [];
    var moneyFormatter = new Intl.NumberFormat('ru-RU', {
        maximumFractionDigits: 2
    });
    var monthFormatter = new Intl.DateTimeFormat('ru-RU', {
        month: 'long',
        year: 'numeric'
    });
    var DONATORS_PER_PAGE = 10;

    // --------------------------------------------------------
    // Общие помощники
    // --------------------------------------------------------

    function toNumber(value) {
        var number = Number(value);
        return isNaN(number) ? 0 : number;
    }

    function formatMoney(value) {
        return moneyFormatter.format(value);
    }

    function getGameById(id) {
        for (var i = 0; i < games.length; i++) {
            if (games[i].id === id) {
                return games[i];
            }
        }

        return null;
    }

    function getGameIdFromUrl() {
        var params = new URLSearchParams(window.location.search);
        return params.get('game') || '';
    }

    function getGameUrl(game) {
        return 'game.html?game=' + encodeURIComponent(game.id);
    }

    // --------------------------------------------------------
    // Навигация
    // --------------------------------------------------------

    function renderNav() {
        var nav = document.querySelector('[data-role="site-nav"]');

        if (!nav) {
            return;
        }

        var page = document.body.dataset.page;
        var currentGameId = page === 'game' ? getGameIdFromUrl() : '';

        nav.textContent = '';

        function addLink(label, href, isCurrent) {
            var link = document.createElement('a');

            link.href = href;
            link.textContent = label;

            if (isCurrent) {
                link.setAttribute('aria-current', 'page');
            }

            nav.appendChild(link);
        }

        addLink('Главная', 'index.html', page === 'index');

        games.forEach(function (game) {
            addLink(
                game.name,
                getGameUrl(game),
                page === 'game' && game.id === currentGameId
            );
        });
    }

    // --------------------------------------------------------
    // Главная страница: карточки игр
    // --------------------------------------------------------

    function renderGameCards() {
        var grid = document.querySelector('[data-role="game-grid"]');
        var template = document.getElementById('game-card-template');

        if (!grid || !template) {
            return;
        }

        var cardTemplate = template.content.querySelector('.game-card');

        if (!cardTemplate) {
            return;
        }

        games.forEach(function (game) {
            var card = cardTemplate.cloneNode(true);
            var status = card.querySelector('[data-role="card-status"]');
            var link = card.querySelector('[data-role="card-link"]');
            var description = card.querySelector('[data-role="card-description"]');
            var button = card.querySelector('[data-role="card-button"]');

            if (status) {
                status.textContent = game.status ? game.status.text : '';

                if (game.status && game.status.modifier) {
                    status.classList.add('status-badge--' + game.status.modifier);
                    card.classList.add('game-card--' + game.status.modifier);
                }
            }

            if (link) {
                link.textContent = game.emoji + ' ' + game.name;
                link.href = getGameUrl(game);
            }

            if (description) {
                if (game.description) {
                    description.textContent = game.description;
                    description.classList.remove('placeholder');
                } else {
                    description.textContent = '[Заполнить: краткое описание сервера]';
                }
            }

            if (button) {
                button.href = getGameUrl(game);
            }

            grid.appendChild(card);
        });
    }

    // --------------------------------------------------------
    // Страница игры
    // --------------------------------------------------------

    function renderGamePage() {
        var page = document.querySelector('[data-role="game-page"]');

        if (!page) {
            return;
        }

        var game = getGameById(getGameIdFromUrl());
        var titleEl = document.querySelector('[data-role="game-title"]');
        var descriptionEl = document.querySelector('[data-role="game-description"]');
        var errorEl = document.querySelector('[data-role="game-error"]');

        if (!game) {
            document.title = 'Игра не найдена — Стив Рембо и его друзья';

            if (titleEl) {
                titleEl.textContent = 'Игра не найдена';
            }

            if (descriptionEl) {
                descriptionEl.hidden = true;
            }

            if (errorEl) {
                errorEl.hidden = false;
            }

            return;
        }

        document.title = game.name + ' — Стив Рембо и его друзья';

        if (titleEl) {
            titleEl.textContent = game.name;
        }

        if (descriptionEl) {
            if (game.description) {
                descriptionEl.textContent = game.description;
                descriptionEl.classList.remove('placeholder');
            } else {
                descriptionEl.textContent = '[Заполнить: краткое описание сервера]';
                descriptionEl.classList.add('placeholder');
            }
        }

        var statusEl = page.querySelector('[data-role="game-status"]');

        if (statusEl) {
            statusEl.textContent = game.status ? game.status.text : '';

            if (game.status && game.status.modifier) {
                statusEl.classList.add('status-badge--' + game.status.modifier);
            }
        }

        var cardTitleEl = page.querySelector('[data-role="game-card-title"]');

        if (cardTitleEl) {
            cardTitleEl.textContent = game.emoji + ' ' + (game.serverTitle || game.name);
        }

        var settingsTitleEl = page.querySelector('[data-role="settings-title"]');

        if (settingsTitleEl) {
            settingsTitleEl.textContent = game.settingsTitle || 'Настройки';
        }

        var settingsBlock = page.querySelector('[data-role="settings-block"]');
        var settingsList = page.querySelector('[data-role="settings-list"]');

        if (settingsBlock && settingsList) {
            var settings = game.settings || [];

            settingsBlock.hidden = settings.length === 0;
            settingsList.textContent = '';

            settings.forEach(function (setting) {
                var item = document.createElement('li');
                var label = document.createElement('strong');

                label.textContent = setting.label + ':';
                item.appendChild(label);
                item.appendChild(document.createTextNode(' ' + (setting.value || '[Заполнить]')));
                settingsList.appendChild(item);
            });
        }

        renderFundWidget(page, game);
        page.hidden = false;
    }

    // --------------------------------------------------------
    // Сборы по месяцам
    // --------------------------------------------------------

    function getMonths(gameData) {
        if (Array.isArray(gameData.months)) {
            // Сортируем по id, чтобы месяцы шли по порядку независимо
            // от того, как они записаны в data.js.
            return gameData.months.slice().sort(function (a, b) {
                return String(a.id || '').localeCompare(String(b.id || ''));
            });
        }

        // Совместимость со старой плоской структурой:
        // { collected, target, donators }
        return [{
            id: 'current',
            label: 'Текущий месяц',
            collected: gameData.collected,
            target: gameData.target,
            donators: gameData.donators || []
        }];
    }

    function formatMonth(month) {
        if (month.label) {
            return month.label;
        }

        var match = /^(\d{4})-(\d{2})$/.exec(String(month.id || ''));

        if (!match) {
            return month.id || 'Месяц';
        }

        var date = new Date(Number(match[1]), Number(match[2]) - 1, 1);
        var label = monthFormatter.format(date).replace(/\s*г\.\s*$/, '');

        return label.charAt(0).toUpperCase() + label.slice(1);
    }

    function getCurrentMonthId() {
        var now = new Date();
        var month = String(now.getMonth() + 1);

        if (month.length < 2) {
            month = '0' + month;
        }

        return now.getFullYear() + '-' + month;
    }

    function pickMonthIndex(months) {
        var currentId = getCurrentMonthId();

        // Сбор идёт на будущий месяц: в октябре актуален ноябрь,
        // в ноябре — декабрь и так далее.
        for (var i = 0; i < months.length; i++) {
            var id = String(months[i].id || '');

            if (id && id > currentId) {
                return i;
            }
        }

        // Если будущих месяцев в данных пока нет — показываем последний.
        return months.length - 1;
    }

    function aggregateDonators(months) {
        var byName = new Map();

        months.forEach(function (month) {
            (month.donators || []).forEach(function (donator) {
                var name = String(donator.name || '').trim() || 'Без имени';
                var amount = toNumber(donator.amount);
                var existing = byName.get(name);

                if (existing) {
                    existing.amount += amount;
                } else {
                    byName.set(name, { name: name, amount: amount });
                }
            });
        });

        return Array.from(byName.values()).sort(function (a, b) {
            return b.amount - a.amount;
        });
    }

    function renderDonators(container, donators) {
        if (!container) {
            return;
        }

        container.textContent = '';

        if (!donators || donators.length === 0) {
            var empty = document.createElement('p');
            empty.className = 'empty-state';
            empty.textContent = 'Станьте первым, кто поддержит сервер!';
            container.appendChild(empty);
            return;
        }

        var pageCount = Math.ceil(donators.length / DONATORS_PER_PAGE);
        var currentPage = 0;

        var list = document.createElement('ul');
        var pagination = document.createElement('div');
        var prevButton = document.createElement('button');
        var nextButton = document.createElement('button');
        var status = document.createElement('span');

        pagination.className = 'donators-pagination';
        pagination.setAttribute('role', 'navigation');
        pagination.setAttribute('aria-label', 'Страницы списка донатеров');

        prevButton.type = 'button';
        prevButton.className = 'donators-page-button';
        prevButton.textContent = '← Назад';

        nextButton.type = 'button';
        nextButton.className = 'donators-page-button';
        nextButton.textContent = 'Вперёд →';

        status.className = 'donators-page-status';
        status.setAttribute('aria-live', 'polite');

        function renderPage() {
            var start = currentPage * DONATORS_PER_PAGE;
            var end = start + DONATORS_PER_PAGE;

            list.textContent = '';

            donators.slice(start, end).forEach(function (donator) {
                var item = document.createElement('li');
                var name = document.createElement('strong');

                // textContent вместо innerHTML — чтобы имена из таблицы
                // не могли вставить разметку на страницу.
                name.textContent = donator.name;
                item.appendChild(name);
                item.appendChild(document.createTextNode(' — ' + formatMoney(donator.amount) + ' руб.'));
                list.appendChild(item);
            });

            status.textContent = 'Страница ' + (currentPage + 1) + ' из ' + pageCount +
                ' · всего ' + donators.length;
            prevButton.disabled = currentPage === 0;
            nextButton.disabled = currentPage === pageCount - 1;
        }

        prevButton.addEventListener('click', function () {
            if (currentPage > 0) {
                currentPage -= 1;
                renderPage();
            }
        });

        nextButton.addEventListener('click', function () {
            if (currentPage < pageCount - 1) {
                currentPage += 1;
                renderPage();
            }
        });

        container.appendChild(list);

        if (pageCount > 1) {
            pagination.appendChild(prevButton);
            pagination.appendChild(status);
            pagination.appendChild(nextButton);
            container.appendChild(pagination);
        }

        renderPage();
    }

    function renderProgress(bar, fill, collected, target) {
        var safeCollected = toNumber(collected);
        var safeTarget = toNumber(target);
        var percent = safeTarget > 0 ? Math.min((safeCollected / safeTarget) * 100, 100) : 0;

        if (bar) {
            bar.setAttribute('aria-valuemax', String(safeTarget));
            bar.setAttribute('aria-valuenow', String(safeCollected));
            bar.setAttribute('aria-valuetext', safeTarget > 0
                ? formatMoney(safeCollected) + ' из ' + formatMoney(safeTarget) + ' руб.'
                : 'Цель не задана');
        }

        if (fill) {
            // Ставим ширину сразу: transition в CSS плавно анимирует её,
            // а в фоновой вкладке значение всё равно останется корректным.
            fill.style.width = percent + '%';
        }
    }

    function renderMonths(widget, months) {
        var tabs = widget.querySelector('[data-role="month-tabs"]');
        var panel = widget.querySelector('[data-role="month-panel"]');

        if (!tabs || !panel) {
            return;
        }

        var panelId = panel.id || (widget.dataset.game + '-month-panel');
        panel.id = panelId;

        var titleEl = panel.querySelector('[data-role="month-title"]');
        var donatorsEl = panel.querySelector('[data-role="month-donators"]');
        var progressBar = panel.querySelector('[data-role="month-progress-bar"]');
        var progressFill = panel.querySelector('[data-role="month-progress-fill"]');
        var collectedEl = panel.querySelector('[data-role="month-collected"]');
        var remainingEl = panel.querySelector('[data-role="month-remaining"]');
        var remainingUnit = panel.querySelector('[data-role="month-remaining-unit"]');
        var targetEl = panel.querySelector('[data-role="month-target"]');
        var targetUnit = panel.querySelector('[data-role="month-target-unit"]');
        var pendingNote = panel.querySelector('[data-role="month-pending-note"]');
        var completeNote = panel.querySelector('[data-role="month-complete-note"]');

        tabs.textContent = '';

        var buttons = months.map(function (month, index) {
            var tab = document.createElement('button');

            tab.type = 'button';
            tab.className = 'month-tab';
            tab.id = panelId + '-tab-' + index;
            tab.dataset.monthIndex = String(index);
            tab.setAttribute('role', 'tab');
            tab.setAttribute('aria-controls', panelId);
            tab.setAttribute('aria-selected', 'false');
            tab.textContent = formatMonth(month);
            tabs.appendChild(tab);
            return tab;
        });

        function selectMonth(index) {
            var month = months[index];

            if (!month) {
                return;
            }

            buttons.forEach(function (button, buttonIndex) {
                var selected = buttonIndex === index;

                button.setAttribute('aria-selected', String(selected));
                button.setAttribute('tabindex', selected ? '0' : '-1');
            });

            panel.setAttribute('aria-labelledby', buttons[index].id);

            if (titleEl) {
                titleEl.textContent = 'Продление на ' + formatMonth(month).toLowerCase();
            }

            var safeCollected = toNumber(month.collected);
            var safeTarget = toNumber(month.target);
            var hasTarget = safeTarget > 0;

            renderProgress(progressBar, progressFill, safeCollected, safeTarget);

            if (collectedEl) {
                collectedEl.textContent = formatMoney(safeCollected);
            }

            if (remainingEl) {
                remainingEl.textContent = hasTarget
                    ? formatMoney(Math.max(safeTarget - safeCollected, 0))
                    : '—';
            }

            if (remainingUnit) {
                remainingUnit.hidden = !hasTarget;
            }

            if (targetEl) {
                targetEl.textContent = hasTarget ? formatMoney(safeTarget) : '—';
            }

            if (targetUnit) {
                targetUnit.hidden = !hasTarget;
            }

            if (pendingNote) {
                pendingNote.hidden = hasTarget;
            }

            if (completeNote) {
                completeNote.hidden = !(hasTarget && safeCollected >= safeTarget);
            }

            renderDonators(donatorsEl, month.donators || []);
        }

        tabs.addEventListener('click', function (event) {
            if (!(event.target instanceof Element)) {
                return;
            }

            var tab = event.target.closest('[role="tab"]');

            if (tab) {
                selectMonth(Number(tab.dataset.monthIndex));
            }
        });

        tabs.addEventListener('keydown', function (event) {
            var handledKeys = ['ArrowRight', 'ArrowLeft', 'Home', 'End'];

            if (handledKeys.indexOf(event.key) === -1) {
                return;
            }

            var currentIndex = buttons.indexOf(document.activeElement);
            var nextIndex = currentIndex === -1 ? 0 : currentIndex;

            if (event.key === 'ArrowRight') {
                nextIndex = (currentIndex + 1) % buttons.length;
            } else if (event.key === 'ArrowLeft') {
                nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
            } else if (event.key === 'Home') {
                nextIndex = 0;
            } else if (event.key === 'End') {
                nextIndex = buttons.length - 1;
            }

            buttons[nextIndex].focus();
            selectMonth(nextIndex);
            event.preventDefault();
        });

        selectMonth(pickMonthIndex(months));
    }

    function renderFundWidget(widget, gameData) {
        var months = getMonths(gameData);
        var hasMonths = months.length > 0;
        var donatorsBlock = widget.querySelector('[data-role="donators-block"]');
        var monthlyBlock = widget.querySelector('[data-role="monthly-block"]');

        if (donatorsBlock) {
            donatorsBlock.hidden = !hasMonths;
        }

        if (monthlyBlock) {
            monthlyBlock.hidden = !hasMonths;
        }

        if (!hasMonths) {
            return;
        }

        renderDonators(
            widget.querySelector('[data-role="total-donators"]'),
            aggregateDonators(months)
        );

        renderMonths(widget, months);
    }

    // --------------------------------------------------------
    // Запуск
    // --------------------------------------------------------

    renderNav();
    renderGameCards();
    renderGamePage();
})();
