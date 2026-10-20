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

    // Простая строка «параметр — значение» (игры без групп).
    function createSettingsRow(setting) {
        var item = document.createElement('li');
        var label = document.createElement('span');
        var value = document.createElement('span');

        item.className = 'settings-row';
        label.className = 'settings-row__label';
        value.className = 'settings-row__value';

        label.textContent = setting.label;
        value.textContent = setting.value || '[Заполнить]';

        if (!setting.value) {
            value.classList.add('placeholder');
        }

        item.appendChild(label);
        item.appendChild(value);

        return item;
    }

    // Компактная настройка: сначала ключ и русская подпись в скобках,
    // затем переход «дефолт → новое значение».
    function createSettingsItem(setting) {
        var item = document.createElement('li');
        var name = document.createElement('span');
        var values = document.createElement('span');
        var value = document.createElement('span');

        item.className = 'settings-item';
        name.className = 'settings-item__name';

        if (setting.key) {
            var key = document.createElement('code');

            key.className = 'settings-item__key';
            key.textContent = setting.key;
            name.appendChild(key);
        }

        if (setting.label) {
            var label = document.createElement('span');

            label.className = 'settings-item__label';
            label.textContent = setting.key
                ? '(' + setting.label + ')'
                : setting.label;
            name.appendChild(label);
        }

        item.appendChild(name);

        values.className = 'settings-item__values';

        if (setting.default != null && setting.default !== '') {
            var defaultValue = document.createElement('span');
            var arrow = document.createElement('span');

            defaultValue.className = 'settings-item__default';
            defaultValue.textContent = setting.default;

            arrow.className = 'settings-item__arrow';
            arrow.setAttribute('aria-hidden', 'true');
            arrow.textContent = '→';

            values.appendChild(defaultValue);
            values.appendChild(arrow);
        }

        value.className = 'settings-item__value';
        value.textContent = setting.value || '[Заполнить]';
        values.appendChild(value);
        item.appendChild(values);

        return item;
    }

    function createSettingsList(settings, detailed) {
        var list = document.createElement('ul');

        list.className = detailed
            ? 'settings-list settings-list--detailed'
            : 'settings-list';

        settings.forEach(function (setting) {
            list.appendChild(detailed
                ? createSettingsItem(setting)
                : createSettingsRow(setting));
        });

        return list;
    }

    // Группа настроек: например, отдельный файл конфига.
    function createSettingsGroup(group) {
        var section = document.createElement('section');
        var head = document.createElement('div');
        var title = document.createElement('h3');
        var titleText = document.createElement('span');

        section.className = 'settings-group';
        head.className = 'settings-group__head';
        title.className = 'settings-group__title';
        titleText.textContent = group.title || '';

        if (group.file) {
            titleText.className = 'settings-group__file';
        }

        title.appendChild(titleText);
        head.appendChild(title);
        section.appendChild(head);

        var items = Array.isArray(group.items) ? group.items : [];

        if (items.length > 0) {
            section.appendChild(createSettingsList(items, true));
        }

        return section;
    }

    function renderSettings(gameData) {
        var settingsBlock = document.querySelector('[data-role="settings-block"]');
        var settingsList = document.querySelector('[data-role="settings-list"]');
        var groups = Array.isArray(gameData.settingsGroups) ? gameData.settingsGroups : [];
        var flatSettings = Array.isArray(gameData.settings) ? gameData.settings : [];
        var hasSettings = groups.length > 0 || flatSettings.length > 0;

        if (settingsBlock) {
            settingsBlock.hidden = !hasSettings;
        }

        if (!settingsList) {
            return;
        }

        settingsList.textContent = '';

        if (!hasSettings) {
            return;
        }

        groups.forEach(function (group) {
            settingsList.appendChild(createSettingsGroup(group));
        });

        if (flatSettings.length > 0) {
            settingsList.appendChild(createSettingsList(flatSettings, false));
        }
    }

    // --------------------------------------------------------
    // Моды: общий список, название + описание в скобках + бейдж
    // --------------------------------------------------------

    function createModItem(mod) {
        var item = document.createElement('li');
        var main = document.createElement('span');
        var name = document.createElement('span');

        item.className = 'mod-item';
        main.className = 'mod-item__main';
        name.className = 'mod-item__name';
        name.textContent = mod.name || '[Без названия]';

        main.appendChild(name);

        if (mod.description) {
            var description = document.createElement('span');

            description.className = 'mod-item__description';
            description.textContent = '(' + mod.description + ')';
            main.appendChild(description);
        }

        item.appendChild(main);

        if (mod.badge) {
            var badge = document.createElement('span');

            badge.className = 'mod-badge';
            badge.textContent = mod.badge;

            if (mod.badgeModifier) {
                badge.classList.add('mod-badge--' + mod.badgeModifier);
            }

            item.appendChild(badge);
        }

        return item;
    }

    function renderMods(gameData) {
        var block = document.querySelector('[data-role="mods-block"]');
        var list = document.querySelector('[data-role="mods-list"]');
        var mods = Array.isArray(gameData.mods) ? gameData.mods : [];

        if (block) {
            block.hidden = mods.length === 0;
        }

        if (!list) {
            return;
        }

        list.textContent = '';

        if (mods.length === 0) {
            return;
        }

        var title = document.querySelector('[data-role="mods-title"]');

        if (title) {
            title.textContent = gameData.modsTitle || 'Моды';
        }

        mods.forEach(function (mod) {
            list.appendChild(createModItem(mod));
        });
    }

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

        var emojiEl = page.querySelector('[data-role="game-emoji"]');

        if (emojiEl) {
            emojiEl.textContent = game.emoji || '';
            emojiEl.hidden = !game.emoji;
        }

        var cardTitleEl = page.querySelector('[data-role="game-card-title"]');

        if (cardTitleEl) {
            cardTitleEl.textContent = game.serverTitle || game.name;
        }

        var settingsTitleEl = page.querySelector('[data-role="settings-title"]');

        if (settingsTitleEl) {
            settingsTitleEl.textContent = game.settingsTitle || 'Настройки';
        }

        renderSettings(game);
        renderMods(game);
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
                ratio.title = 'Коэффициент: учтённый донат / общая сумма сбора';
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
        expr.textContent = '= 1 + (коэф × количество проголосовавших)';

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
                        // учтённый донат / общая сумма сбора
                        // (см. rules.html).
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

                if (!hasTarget) {
                    state = 'Цель не задана';
                    stateModifier = 'idle';
                } else if (safeCollected >= safeTarget) {
                    state = 'Цель достигнута';
                    stateModifier = 'done';
                }

                stateEl.textContent = state;
                stateEl.className = 'collect-state collect-state--' + stateModifier;
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

    // Ссылки вида game.html#game=<id> меняют только хеш, поэтому
    // перерисовываем страницу и при его смене.
    window.addEventListener('hashchange', function () {
        renderNav();
        renderGamePage();
    });
})();
