// ============================================================
// Общий скрипт сайта.
//
// Данные лежат в data/games.js (window.GAMES). Скрипт:
//   - строит навигацию по списку игр;
//   - рисует карточки игр на главной;
//   - заполняет общий шаблон game.html данными игры;
//   - отрисовывает сборы по месяцам;
//   - показывает общий топ донатеров на главной.
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
    // Делитель бонуса донатера: вес = 1 + (коэф. × проголосовавших ÷ 3).
    var VOTE_BONUS_DIVISOR = 3;

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
        // Игра в ссылке — хеш: game.html#game=<id>. В отличие от
        // query-параметра хеш не срезается при открытии страницы
        // как файла и переживает редиректы локальных серверов.
        var hash = String(window.location.hash || '').replace(/^#\/?/, '');
        var hashId = hash.indexOf('game=') === 0 ? hash.slice('game='.length) : hash;

        if (hashId) {
            var decodedId = decodeURIComponent(hashId);

            if (getGameById(decodedId)) {
                return decodedId;
            }
        }

        // Старые ссылки вида game.html?game=<id> продолжают работать.
        var queryId = new URLSearchParams(window.location.search).get('game');

        if (queryId) {
            return queryId;
        }

        // Игра не указана — показываем первую.
        return games.length > 0 ? games[0].id : '';
    }

    function getGameUrl(game) {
        return 'game.html#game=' + encodeURIComponent(game.id);
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

    // Сворачиваемые секции страницы игры. Заголовок — настоящая кнопка,
    // поэтому работают Enter/Space, фокус и скринридеры (aria-expanded).
    function setupCollapsibleSections() {
        var toggles = document.querySelectorAll('[data-role="section-toggle"]');

        Array.prototype.forEach.call(toggles, function (toggle) {
            var bodyId = toggle.getAttribute('aria-controls');
            var body = bodyId ? document.getElementById(bodyId) : null;

            if (!body) {
                return;
            }

            toggle.addEventListener('click', function () {
                var expanded = toggle.getAttribute('aria-expanded') !== 'false';
                var section = toggle.closest('section');

                toggle.setAttribute('aria-expanded', String(!expanded));
                body.hidden = expanded;

                if (section) {
                    section.classList.toggle('is-collapsed', expanded);
                }
            });
        });
    }

    // Необязательная справка: выбранный хостинг и ссылка на его тариф.
    // Блок есть в шаблоне всегда, но показывается только если игра
    // указала hosting в data/games.js.
    function renderHosting(gameData) {
        var hint = document.querySelector('[data-role="game-hosting"]');

        if (!hint) {
            return;
        }

        var link = hint.querySelector('[data-role="game-hosting-link"]');
        var hosting = gameData.hosting;

        if (!hosting || !hosting.name) {
            hint.hidden = true;

            if (link) {
                link.textContent = '';
                link.removeAttribute('href');
            }

            return;
        }

        hint.hidden = false;

        if (link) {
            link.textContent = hosting.name;

            if (hosting.url) {
                link.href = hosting.url;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
            } else {
                link.removeAttribute('href');
            }
        }
    }

    // Описание игры. Пустая строка показывается заглушкой.
    function renderDescription(el, game) {
        if (!game.description) {
            el.textContent = '[Заполнить: краткое описание сервера]';
            el.classList.add('placeholder');
            return;
        }

        el.textContent = game.description;
        el.classList.remove('placeholder');
    }

    // Ссылки на репозиторий и актуальные данные сервера (настройки,
    // моды и т. п.). Сами данные живут в репозитории сервера,
    // чтобы не дублировать их в data/games.js.
    function renderSources(gameData) {
        var el = document.querySelector('[data-role="game-sources"]');

        if (!el) {
            return;
        }

        var sources = (Array.isArray(gameData.sources) ? gameData.sources : [])
            .filter(function (source) {
                return source && source.url;
            });

        el.textContent = '';
        el.hidden = sources.length === 0;

        if (sources.length === 0) {
            return;
        }

        el.appendChild(document.createTextNode('Актуальные данные сервера: '));

        sources.forEach(function (source, index) {
            if (index > 0) {
                el.appendChild(document.createTextNode(' · '));
            }

            var link = document.createElement('a');

            link.href = source.url;
            link.textContent = source.name || 'Источник';
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            el.appendChild(link);
        });
    }

    function renderGamePage() {
        var page = document.querySelector('[data-role="game-page"]');

        if (!page) {
            return;
        }

        var game = getGameById(getGameIdFromUrl());
        var descriptionEl = document.querySelector('[data-role="game-description"]');
        var errorEl = document.querySelector('[data-role="game-error"]');

        if (!game) {
            document.title = 'Игра не найдена — Стив Рембо и его друзья';

            if (descriptionEl) {
                descriptionEl.hidden = true;
            }

            if (errorEl) {
                errorEl.hidden = false;
            }

            return;
        }

        document.title = game.name + ' — Стив Рембо и его друзья';

        if (descriptionEl) {
            renderDescription(descriptionEl, game);
        }

        var statusEl = page.querySelector('[data-role="game-status"]');

        if (statusEl) {
            statusEl.textContent = game.status ? game.status.text : '';

            if (game.status && game.status.modifier) {
                statusEl.classList.add('status-badge--' + game.status.modifier);
            }
        }

        var emojiEl = page.querySelector('[data-role="game-emoji"]');

        if (emojiEl) {
            emojiEl.textContent = game.emoji || '';
            emojiEl.hidden = !game.emoji;
        }

        var cardTitleEl = page.querySelector('[data-role="game-card-title"]');

        if (cardTitleEl) {
            cardTitleEl.textContent = game.serverTitle || game.name;
        }

        renderSources(game);
        renderHosting(game);

        renderFundWidget(page, game);
        page.hidden = false;
    }

    // --------------------------------------------------------
    // Сборы по месяцам
    // --------------------------------------------------------

    function round2(value) {
        return Math.round((toNumber(value) + Number.EPSILON) * 100) / 100;
    }

    function normalizeDonators(rawDonators) {
        var byName = new Map();

        (Array.isArray(rawDonators) ? rawDonators : []).forEach(function (donator) {
            var name = String(donator && donator.name != null ? donator.name : '').trim();
            var amount = round2(donator && donator.amount);

            if (!name || amount <= 0) {
                return;
            }

            // Одинаковые имена в одном месяце складываем.
            byName.set(name, round2((byName.get(name) || 0) + amount));
        });

        return Array.from(byName, function (entry) {
            return { name: entry[0], amount: entry[1] };
        }).sort(function (a, b) {
            return b.amount - a.amount;
        });
    }

    // Копилка: излишек сверх цели делится пропорционально вкладам.
    // Его можно перенести на следующий месяц, на другую игру или
    // направить на улучшение хостинга (правила — на rules.html).
    function buildPiggyBank(donators, collected, target) {
        if (target <= 0 || collected <= target) {
            return [];
        }

        var k = target / collected;
        var piggyTotal = 0;
        var piggyBank = donators.map(function (donator) {
            var piggy = round2(donator.amount * (1 - k));

            piggyTotal += piggy;
            return { name: donator.name, amount: piggy };
        });

        // Копейки от округления добиваем у самого крупного вклада,
        // чтобы сумма копилки точно равнялась излишку.
        var drift = round2((collected - target) - piggyTotal);

        if (drift !== 0 && piggyBank.length > 0) {
            piggyBank[0].amount = round2(piggyBank[0].amount + drift);
        }

        return piggyBank;
    }

    function normalizeMonth(rawMonth) {
        if (!rawMonth || typeof rawMonth !== 'object') {
            return null;
        }

        var donators = normalizeDonators(rawMonth.donators);
        var collected = round2(donators.reduce(function (sum, donator) {
            return sum + donator.amount;
        }, 0));
        var target = round2(rawMonth.target);
        var piggyBank = buildPiggyBank(donators, collected, target);
        var piggyByName = new Map();

        piggyBank.forEach(function (entry) {
            piggyByName.set(entry.name, entry.amount);
        });

        donators.forEach(function (donator) {
            // Сколько из этого доната пошло в зачёт месяца: остальное
            // уходит в копилку, потому что цель уже закрыта.
            donator.credited = round2(donator.amount - (piggyByName.get(donator.name) || 0));
        });

        return {
            id: rawMonth.id != null ? String(rawMonth.id) : '',
            label: rawMonth.label ? String(rawMonth.label) : '',
            closed: rawMonth.closed === true,
            collected: collected,
            target: target,
            donators: donators,
            piggyBank: piggyBank
        };
    }

    // Сборы берём из data/donations.js (объект window.DONATIONS).
    // collected и копилка считаются здесь, в файле лежат только
    // цель и список донатеров.
    function getMonths(gameData) {
        var rawMonths = window.DONATIONS ? window.DONATIONS[gameData.id] : null;

        if (!Array.isArray(rawMonths)) {
            return [];
        }

        // Сортируем по id, чтобы месяцы шли по порядку независимо
        // от того, как они записаны в файле.
        return rawMonths
            .map(normalizeMonth)
            .filter(Boolean)
            .sort(function (a, b) {
                return String(a.id).localeCompare(String(b.id));
            });
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

    // Топ за всё время: складываем донаты по всем играм и месяцам.
    // В сумму входит весь взнос, включая часть, ушедшую в копилку.
    function getAllTimeDonators() {
        var byName = new Map();

        games.forEach(function (game) {
            getMonths(game).forEach(function (month) {
                (month.donators || []).forEach(function (donator) {
                    var name = String(donator.name || '').trim() || 'Без имени';
                    var amount = toNumber(donator.amount);
                    var entry = byName.get(name);

                    if (!entry) {
                        entry = { name: name, amount: 0, byGame: new Map() };
                        byName.set(name, entry);
                    }

                    entry.amount = round2(entry.amount + amount);
                    entry.byGame.set(
                        game.name,
                        round2((entry.byGame.get(game.name) || 0) + amount)
                    );
                });
            });
        });

        return Array.from(byName.values()).map(function (entry) {
            return {
                name: entry.name,
                amount: entry.amount,
                // Расшифровка, сколько человек внёс по каждой игре.
                note: Array.from(entry.byGame, function (pair) {
                    return pair[0] + ' ' + formatMoney(pair[1]) + ' руб.';
                }).join(' · ')
            };
        }).sort(function (a, b) {
            return b.amount - a.amount || a.name.localeCompare(b.name, 'ru');
        });
    }

    // Строка списка донатеров: место, имя, доля от максимального взноса
    // и сумма. Разметка собирается через textContent — имена из данных
    // не смогут вставить на страницу свой HTML.
    function createDonatorRow(entry, options) {
        var item = document.createElement('li');
        var share = document.createElement('span');
        var info = document.createElement('span');
        var name = document.createElement('span');
        var amount = document.createElement('span');

        item.className = 'donator';

        share.className = 'donator__share';
        share.setAttribute('aria-hidden', 'true');
        share.style.width = Math.max(options.share || 0, 0) + '%';
        item.appendChild(share);

        if (options.position) {
            var rank = document.createElement('span');

            rank.className = 'donator__rank';
            rank.textContent = String(options.position);
            item.appendChild(rank);

            if (options.position <= 3) {
                item.classList.add('donator--place-' + options.position);
            }
        }

        info.className = 'donator__info';
        name.className = 'donator__name';
        name.textContent = entry.name;
        info.appendChild(name);

        // Пояснение под именем: полный взнос и вклад в силу голоса.
        if (options.note || options.ratio) {
            var meta = document.createElement('span');

            meta.className = 'donator__meta';

            if (options.note) {
                var note = document.createElement('span');

                note.className = 'donator__note';
                note.textContent = options.note;
                meta.appendChild(note);
            }

            if (options.ratio) {
                var ratio = document.createElement('span');

                ratio.className = 'donator__ratio';
                ratio.textContent = 'коэф. ' + formatMoney(options.ratio);
                ratio.title = 'Коэффициент: учтённый донат / цель сбора';
                meta.appendChild(ratio);
            }

            info.appendChild(meta);
        }

        item.appendChild(info);

        amount.className = 'donator__amount';
        amount.textContent = formatMoney(entry.amount) + ' руб.';
        item.appendChild(amount);

        return item;
    }

    // Формула силы голоса под списком. Вся формула — ссылка
    // на раздел правил о силе голоса.
    function createVoteFormula(href) {
        var link = document.createElement('a');
        var label = document.createElement('span');
        var expr = document.createElement('span');
        var arrow = document.createElement('span');

        link.className = 'vote-formula';
        link.href = href;
        link.title = 'Подробнее в правилах голосования';

        label.className = 'vote-formula__label';
        label.textContent = 'Вес голоса';

        expr.className = 'vote-formula__expr';
        expr.textContent = '= 1 + (коэф × количество проголосовавших ÷ ' +
            VOTE_BONUS_DIVISOR + ')';

        arrow.className = 'vote-formula__arrow';
        arrow.setAttribute('aria-hidden', 'true');
        arrow.textContent = '→';
        expr.appendChild(arrow);

        link.appendChild(label);
        link.appendChild(expr);

        return link;
    }

    function renderDonators(container, donators, options) {
        if (!container) {
            return;
        }

        container.textContent = '';

        var hostingCost = toNumber(options && options.hostingCost);
        var formulaLink = options && options.formulaLink;

        if (!donators || donators.length === 0) {
            var empty = document.createElement('p');
            empty.className = 'empty-state';
            empty.textContent = 'Станьте первым, кто поддержит сервер!';
            container.appendChild(empty);

            if (formulaLink) {
                container.appendChild(createVoteFormula(formulaLink));
            }

            return;
        }

        var pageCount = Math.ceil(donators.length / DONATORS_PER_PAGE);
        var currentPage = 0;
        // Полоска-доля считается от самого крупного зачётного взноса,
        // поэтому у первого места она всегда во всю ширину.
        var maxAmount = donators.reduce(function (max, donator) {
            return Math.max(max, toNumber(donator.credited != null ? donator.credited : donator.amount));
        }, 0);

        var list = document.createElement('ul');
        var pagination = document.createElement('div');
        var prevButton = document.createElement('button');
        var nextButton = document.createElement('button');
        var status = document.createElement('span');

        list.className = 'donators';

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

            donators.slice(start, end).forEach(function (donator, index) {
                var credited = donator.credited != null
                    ? toNumber(donator.credited)
                    : toNumber(donator.amount);
                var donated = toNumber(donator.amount);
                var ratio = hostingCost > 0 ? credited / hostingCost : 0;

                list.appendChild(createDonatorRow(
                    { name: donator.name, amount: credited },
                    {
                        position: start + index + 1,
                        share: maxAmount > 0 ? (credited / maxAmount) * 100 : 0,
                        // Готовую подпись из данных (например, разбивку
                        // по играм в общем топе) оставляем как есть.
                        // Иначе, если часть доната ушла в копилку,
                        // показываем, сколько человек внёс за месяц.
                        note: donator.note || (donated !== credited
                            ? 'задоначено ' + formatMoney(donated) + ' руб.'
                            : ''),
                        // Коэффициент для формулы силы голоса:
                        // учтённый донат / цель сбора (см. rules.html).
                        ratio: ratio > 0 ? ratio : 0
                    }
                ));
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

        if (formulaLink) {
            container.appendChild(createVoteFormula(formulaLink));
        }

        renderPage();
    }

    // Простой список «имя — сумма» без пагинации (например, копилка).
    function renderAmountList(container, entries) {
        if (!container) {
            return;
        }

        container.textContent = '';

        if (!entries || entries.length === 0) {
            return;
        }

        var maxAmount = entries.reduce(function (max, entry) {
            return Math.max(max, toNumber(entry.amount));
        }, 0);
        var list = document.createElement('ul');

        list.className = 'donators';

        entries.forEach(function (entry) {
            list.appendChild(createDonatorRow(entry, {
                share: maxAmount > 0 ? (toNumber(entry.amount) / maxAmount) * 100 : 0
            }));
        });

        container.appendChild(list);
    }

    function renderProgress(bar, fill, percentEl, collected, target) {
        var safeCollected = toNumber(collected);
        var safeTarget = toNumber(target);
        var percent = safeTarget > 0 ? (safeCollected / safeTarget) * 100 : 0;

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
            // Перебор сверх цели полосу не растягивает, но процент
            // в подписи показываем честный.
            fill.style.width = Math.min(percent, 100) + '%';
        }

        if (percentEl) {
            percentEl.textContent = safeTarget > 0 ? Math.round(percent) + '%' : '—';
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
        var stateEl = panel.querySelector('[data-role="month-state"]');
        var donateLink = panel.querySelector('[data-role="month-donate-link"]');
        var percentEl = panel.querySelector('[data-role="month-progress-percent"]');
        var piggyBlock = panel.querySelector('[data-role="month-piggy"]');
        var piggyTotalEl = panel.querySelector('[data-role="month-piggy-total"]');
        var piggyList = panel.querySelector('[data-role="month-piggy-list"]');

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

            // Состояние сбора — короткая метка рядом с заголовком месяца.
            if (stateEl) {
                var state = 'Сбор идёт';
                var stateModifier = 'active';

                if (month.closed) {
                    state = 'Сбор закрыт';
                    stateModifier = 'closed';
                } else if (!hasTarget) {
                    state = 'Цель не задана';
                    stateModifier = 'idle';
                } else if (safeCollected >= safeTarget) {
                    state = 'Цель достигнута';
                    stateModifier = 'done';
                }

                stateEl.textContent = state;
                stateEl.className = 'collect-state collect-state--' + stateModifier;
            }

            // Если сбор закрыт, призыв к донату больше не показываем.
            if (donateLink) {
                donateLink.hidden = Boolean(month.closed);
            }

            renderProgress(progressBar, progressFill, percentEl, safeCollected, safeTarget);

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

            // Копилка: сколько сверх цели уйдёт дальше и от кого.
            var piggy = month.piggyBank || [];
            var piggyTotal = piggy.reduce(function (sum, entry) {
                return sum + toNumber(entry.amount);
            }, 0);

            if (piggyBlock) {
                piggyBlock.hidden = piggy.length === 0;
            }

            if (piggyTotalEl) {
                piggyTotalEl.textContent = formatMoney(piggyTotal);
            }

            renderAmountList(piggyList, piggy);

            renderDonators(donatorsEl, month.donators || [], {
                // Цель месяца — это стоимость продления хостинга,
                // поэтому она же база для веса голоса.
                hostingCost: safeTarget,
                formulaLink: 'rules.html#vote-strength'
            });
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
        var monthlyBlock = widget.querySelector('[data-role="monthly-block"]');
        var emptyEl = widget.querySelector('[data-role="fund-empty"]');

        if (monthlyBlock) {
            monthlyBlock.hidden = !hasMonths;
        }

        if (emptyEl) {
            emptyEl.hidden = hasMonths;
        }

        if (!hasMonths) {
            return;
        }

        renderMonths(widget, months);
    }

    // --------------------------------------------------------
    // Калькулятор голосования (rules.html)
    // --------------------------------------------------------

    function normalizeVoterName(value) {
        return String(value == null ? '' : value).trim().replace(/\s+/g, ' ');
    }

    function getVoterNameKey(name) {
        return normalizeVoterName(name).toLowerCase();
    }

    function setupVoteCalculator() {
        var root = document.querySelector('[data-role="vote-calculator"]');

        if (!root) {
            return;
        }

        var gameSelect = root.querySelector('[data-role="vote-game"]');
        var monthField = root.querySelector('[data-role="vote-month-field"]');
        var monthSelect = root.querySelector('[data-role="vote-month"]');
        var sourceEl = root.querySelector('[data-role="vote-source"]');
        var form = root.querySelector('[data-role="vote-add-form"]');
        var nameInput = root.querySelector('[data-role="vote-name"]');
        var formVoteSelect = root.querySelector('[data-role="vote-choice"]');
        var errorEl = root.querySelector('[data-role="vote-error"]');
        var tableWrap = root.querySelector('[data-role="vote-table-wrap"]');
        var rowsEl = root.querySelector('[data-role="vote-rows"]');
        var emptyEl = root.querySelector('[data-role="vote-empty"]');
        var resultsEl = root.querySelector('[data-role="vote-results"]');
        var forValueEl = root.querySelector('[data-role="vote-for"]');
        var forCountEl = root.querySelector('[data-role="vote-for-count"]');
        var againstValueEl = root.querySelector('[data-role="vote-against"]');
        var againstCountEl = root.querySelector('[data-role="vote-against-count"]');
        var participantsEl = root.querySelector('[data-role="vote-participants"]');
        var totalEl = root.querySelector('[data-role="vote-total"]');
        var verdictEl = root.querySelector('[data-role="vote-verdict"]');
        var formulaNoteEl = root.querySelector('[data-role="vote-formula-note"]');

        if (!gameSelect || !monthSelect || !form || !nameInput || !formVoteSelect || !rowsEl) {
            return;
        }

        var state = {
            gameId: '',
            months: [],
            monthIndex: -1,
            donors: [],
            manual: [],
            nextId: 1
        };
        var weightCells = new Map();

        // В списке игр — все серверы. Если у игры нет сборов,
        // донатеров просто не будет; ручной режим останется доступен.
        games.forEach(function (game) {
            var option = document.createElement('option');

            option.value = game.id;
            option.textContent = (game.emoji ? game.emoji + ' ' : '') + game.name;
            gameSelect.appendChild(option);
        });

        function hideError() {
            if (!errorEl) {
                return;
            }

            errorEl.textContent = '';
            errorEl.hidden = true;
        }

        function showError(message) {
            if (!errorEl) {
                return;
            }

            errorEl.textContent = message;
            errorEl.hidden = false;
        }

        function findVoter(name) {
            var key = getVoterNameKey(name);
            var voters = state.donors.concat(state.manual);

            for (var i = 0; i < voters.length; i++) {
                if (getVoterNameKey(voters[i].name) === key) {
                    return voters[i];
                }
            }

            return null;
        }

        function getSelectedMonth() {
            return state.months[state.monthIndex] || null;
        }

        // Донатеры выбранного месяца. Если человек уже добавлен вручную,
        // его голос переносится в строку донатера, а ручная строка убирается.
        function buildDonorVoters(month) {
            var donors = [];

            if (!month) {
                return donors;
            }

            var manualByName = new Map();
            var matchedManual = [];

            state.manual.forEach(function (voter) {
                manualByName.set(getVoterNameKey(voter.name), voter);
            });

            (month.donators || []).forEach(function (donator) {
                var name = normalizeVoterName(donator.name);
                var manual = manualByName.get(getVoterNameKey(name));

                if (manual) {
                    matchedManual.push(manual);
                }

                donors.push({
                    id: 'donor-' + state.nextId++,
                    name: name,
                    vote: manual ? manual.vote : '',
                    // Коэффициент — это учтённый донат / цель сбора.
                    // Цель месяца и есть стоимость хостинга.
                    coefficient: month.target > 0
                        ? toNumber(donator.credited) / month.target
                        : 0,
                    credited: toNumber(donator.credited),
                    amount: toNumber(donator.amount),
                    target: toNumber(month.target),
                    source: 'donor'
                });
            });

            if (matchedManual.length > 0) {
                state.manual = state.manual.filter(function (voter) {
                    return matchedManual.indexOf(voter) === -1;
                });
            }

            return donors;
        }

        function updateSource(month) {
            if (!sourceEl) {
                return;
            }

            sourceEl.hidden = false;

            if (!state.gameId) {
                sourceEl.textContent = 'Ручной режим: донатеры не подгружены, ' +
                    'у каждого голосующего базовый вес 1.';
                return;
            }

            var game = getGameById(state.gameId);

            if (!month) {
                sourceEl.textContent = 'У игры ' + (game ? game.name : '') +
                    ' пока нет сборов, поэтому донатеров для загрузки нет.';
                return;
            }

            var parts = ['Сбор на ' + formatMonth(month).toLowerCase()];

            if (month.target > 0) {
                parts.push('цель ' + formatMoney(month.target) + ' руб.');
                parts.push('коэф. = зачтённый донат / цель');
            } else {
                parts.push('цель не задана, поэтому коэф. равен 0');
            }

            if (month.donators.length === 0) {
                parts.push('донатеров нет');
            }

            sourceEl.textContent = parts.join(' · ') + '.';
        }

        function loadSelectedMonth() {
            var month = getSelectedMonth();

            state.donors = buildDonorVoters(month);
            updateSource(month);
        }

        function fillMonthSelect() {
            if (!monthSelect) {
                return;
            }

            monthSelect.textContent = '';

            state.months.forEach(function (month, index) {
                var option = document.createElement('option');

                option.value = String(index);
                option.textContent = formatMonth(month);
                monthSelect.appendChild(option);
            });

            if (monthField) {
                monthField.hidden = state.months.length <= 1;
            }

            if (state.monthIndex >= 0) {
                monthSelect.value = String(state.monthIndex);
            }
        }

        function applyVoteSelectStyle(select, vote) {
            select.classList.remove('vote-select--for', 'vote-select--against');

            if (vote === 'for') {
                select.classList.add('vote-select--for');
            } else if (vote === 'against') {
                select.classList.add('vote-select--against');
            }
        }

        function createVoteRow(voter) {
            var row = document.createElement('tr');
            var nameCell = document.createElement('td');
            var nameEl = document.createElement('span');

            row.className = 'vote-row';

            nameEl.className = 'vote-row__name';
            nameEl.textContent = voter.name;
            nameCell.appendChild(nameEl);

            if (voter.source === 'donor') {
                var metaEl = document.createElement('span');
                var meta = 'донат ' + formatMoney(voter.amount) + ' руб.';

                if (voter.credited !== voter.amount) {
                    meta += ' · в зачёт ' + formatMoney(voter.credited) + ' руб.';
                }

                metaEl.className = 'vote-row__meta';
                metaEl.textContent = meta;
                nameCell.appendChild(metaEl);
            }

            row.appendChild(nameCell);

            var coefficientCell = document.createElement('td');
            var coefficientEl = document.createElement('span');

            coefficientEl.className = 'vote-row__coef';

            if (voter.source === 'donor') {
                coefficientEl.textContent = formatMoney(voter.coefficient);
                coefficientEl.title = voter.target > 0
                    ? 'Коэффициент: зачтённый донат / цель сбора — ' +
                        formatMoney(voter.credited) + ' / ' + formatMoney(voter.target)
                    : 'Цель сбора не задана, коэффициент равен 0';
            } else {
                coefficientEl.textContent = '—';
                coefficientEl.classList.add('vote-row__coef--muted');
                coefficientEl.title = 'У голосующего без доната коэффициент 0';
            }

            coefficientCell.appendChild(coefficientEl);
            row.appendChild(coefficientCell);

            var voteCell = document.createElement('td');
            var select = document.createElement('select');

            select.className = 'vote-select';
            select.setAttribute('aria-label', 'Голос: ' + voter.name);

            [
                { value: '', label: 'Не голосовал' },
                { value: 'for', label: 'За' },
                { value: 'against', label: 'Против' }
            ].forEach(function (optionData) {
                var option = document.createElement('option');

                option.value = optionData.value;
                option.textContent = optionData.label;
                select.appendChild(option);
            });

            select.value = voter.vote || '';
            applyVoteSelectStyle(select, voter.vote);

            select.addEventListener('change', function () {
                voter.vote = select.value === 'for' || select.value === 'against'
                    ? select.value
                    : '';
                applyVoteSelectStyle(select, voter.vote);
                updateResults();
            });

            voteCell.appendChild(select);
            row.appendChild(voteCell);

            var weightCell = document.createElement('td');
            var weightEl = document.createElement('span');

            weightEl.className = 'vote-row__weight';
            weightEl.textContent = '—';
            weightCell.appendChild(weightEl);
            weightCells.set(voter.id, weightEl);
            row.appendChild(weightCell);

            var actionCell = document.createElement('td');

            // Убрать можно только строку, добавленную вручную.
            // Донатеры всегда остаются в таблице; если человек не голосовал,
            // у его строки просто выбран вариант «Не голосовал».
            if (voter.source === 'manual') {
                var removeButton = document.createElement('button');

                removeButton.type = 'button';
                removeButton.className = 'vote-remove';
                removeButton.textContent = '×';
                removeButton.title = 'Убрать из таблицы';
                removeButton.setAttribute('aria-label', 'Убрать ' + voter.name + ' из таблицы');

                removeButton.addEventListener('click', function () {
                    state.manual = state.manual.filter(function (item) {
                        return item !== voter;
                    });

                    renderRows();
                    updateResults();
                });

                actionCell.appendChild(removeButton);
            }

            row.appendChild(actionCell);

            return row;
        }

        function renderRows() {
            var voters = state.donors.concat(state.manual);
            var hasRows = voters.length > 0;

            rowsEl.textContent = '';
            weightCells = new Map();

            if (tableWrap) {
                tableWrap.hidden = !hasRows;
            }

            if (emptyEl) {
                emptyEl.hidden = hasRows;
            }

            if (resultsEl) {
                resultsEl.hidden = !hasRows;
            }

            voters.forEach(function (voter) {
                rowsEl.appendChild(createVoteRow(voter));
            });
        }

        function updateResults() {
            var voters = state.donors.concat(state.manual);
            var participantCount = 0;
            var forWeight = 0;
            var againstWeight = 0;
            var forCount = 0;
            var againstCount = 0;

            voters.forEach(function (voter) {
                if (voter.vote === 'for' || voter.vote === 'against') {
                    participantCount += 1;
                }
            });

            voters.forEach(function (voter) {
                var weightEl = weightCells.get(voter.id);

                if (voter.vote !== 'for' && voter.vote !== 'against') {
                    if (weightEl) {
                        weightEl.textContent = '—';
                        weightEl.classList.add('vote-row__weight--muted');
                        weightEl.removeAttribute('title');
                    }

                    return;
                }

                var coefficient = toNumber(voter.coefficient);
                // Формула из правил: вес = 1 + (коэф. × количество
                // проголосовавших ÷ 3). Поэтому при добавлении человека
                // пересчитываются веса всех донатеров.
                var weight = 1 + coefficient * participantCount / VOTE_BONUS_DIVISOR;

                if (weightEl) {
                    weightEl.textContent = formatMoney(weight);
                    weightEl.classList.remove('vote-row__weight--muted');
                    weightEl.title = coefficient > 0
                        ? '1 + (' + formatMoney(coefficient) + ' × ' +
                            participantCount + ') / ' + VOTE_BONUS_DIVISOR +
                            ' = ' + formatMoney(weight)
                        : 'Вес голоса: 1';
                }

                if (voter.vote === 'for') {
                    forWeight += weight;
                    forCount += 1;
                } else {
                    againstWeight += weight;
                    againstCount += 1;
                }
            });

            if (forValueEl) {
                forValueEl.textContent = formatMoney(forWeight);
            }

            if (forCountEl) {
                forCountEl.textContent = String(forCount);
            }

            if (againstValueEl) {
                againstValueEl.textContent = formatMoney(againstWeight);
            }

            if (againstCountEl) {
                againstCountEl.textContent = String(againstCount);
            }

            if (participantsEl) {
                participantsEl.textContent = String(participantCount);
            }

            if (totalEl) {
                totalEl.textContent = String(voters.length);
            }

            if (verdictEl) {
                verdictEl.className = 'vote-verdict';

                if (participantCount === 0) {
                    verdictEl.textContent = 'Пока никто не голосовал.';
                } else if (Math.abs(forWeight - againstWeight) < 1e-9) {
                    verdictEl.textContent = 'Ничья: «За» — ' + formatMoney(forWeight) +
                        ', «Против» — ' + formatMoney(againstWeight) + '.';
                    verdictEl.classList.add('vote-verdict--tie');
                } else if (forWeight > againstWeight) {
                    verdictEl.textContent = 'Побеждает «За»: ' + formatMoney(forWeight) +
                        ' против ' + formatMoney(againstWeight) + '.';
                    verdictEl.classList.add('vote-verdict--for');
                } else {
                    verdictEl.textContent = 'Побеждает «Против»: ' + formatMoney(againstWeight) +
                        ' против ' + formatMoney(forWeight) + '.';
                    verdictEl.classList.add('vote-verdict--against');
                }
            }

            if (formulaNoteEl) {
                formulaNoteEl.textContent = participantCount > 0
                    ? 'Вес голоса = 1 + (коэф. × количество проголосовавших ÷ ' +
                        VOTE_BONUS_DIVISOR + '). ' +
                        'Сейчас проголосовавших: ' + participantCount +
                        '. В расчёте вес не округляется.'
                    : 'Вес голоса = 1 + (коэф. × количество проголосовавших ÷ ' +
                        VOTE_BONUS_DIVISOR + ').';
            }
        }

        function render() {
            renderRows();
            updateResults();
        }

        function loadGame(gameId) {
            state.gameId = gameId;
            state.months = gameId ? getMonths(getGameById(gameId)) : [];
            state.monthIndex = state.months.length > 0 ? pickMonthIndex(state.months) : -1;

            fillMonthSelect();
            loadSelectedMonth();
            render();
        }

        gameSelect.addEventListener('change', function () {
            hideError();
            loadGame(gameSelect.value);
        });

        monthSelect.addEventListener('change', function () {
            var index = Number(monthSelect.value);

            if (isNaN(index)) {
                return;
            }

            state.monthIndex = index;
            loadSelectedMonth();
            render();
        });

        form.addEventListener('submit', function (event) {
            event.preventDefault();

            var name = normalizeVoterName(nameInput.value);
            var vote = formVoteSelect.value === 'against' ? 'against' : 'for';

            if (!name) {
                showError('Введите имя голосующего.');
                nameInput.focus();
                return;
            }

            if (findVoter(name)) {
                showError('«' + name + '» уже есть в таблице.');
                nameInput.focus();
                nameInput.select();
                return;
            }

            state.manual.push({
                id: 'manual-' + state.nextId++,
                name: name,
                vote: vote,
                coefficient: 0,
                source: 'manual'
            });

            nameInput.value = '';
            hideError();
            render();
            nameInput.focus();
        });

        nameInput.addEventListener('input', hideError);

        loadGame('');
    }

    // --------------------------------------------------------
    // Главная страница: общий топ донатеров
    // --------------------------------------------------------

    function renderHomeTop() {
        var section = document.querySelector('[data-role="global-top"]');
        var container = document.querySelector('[data-role="global-donators"]');

        if (!section || !container) {
            return;
        }

        var donators = getAllTimeDonators();

        // Нет ни одного доната — не показываем пустой блок.
        section.hidden = donators.length === 0;

        if (donators.length === 0) {
            container.textContent = '';
            return;
        }

        renderDonators(container, donators);
    }

    // --------------------------------------------------------
    // Запуск
    // --------------------------------------------------------

    renderNav();
    renderGameCards();
    renderHomeTop();
    renderGamePage();
    setupCollapsibleSections();
    setupVoteCalculator();

    // Ссылки вида game.html#game=<id> меняют только хеш, поэтому
    // перерисовываем страницу и при его смене.
    window.addEventListener('hashchange', function () {
        renderNav();
        renderGamePage();
    });
})();
