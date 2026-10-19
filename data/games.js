// ============================================================
// Все данные сайта: игры и их страницы.
//
// Это обычный JS-объект, поэтому сайт можно открывать локально
// без сервера. Чтобы добавить игру, достаточно добавить объект
// в массив window.GAMES — карточка на главной и страница игры
// появятся автоматически.
//
// Поля игры:
//   id           — уникальный ключ, используется в ссылке game.html#game=...
//   name         — короткое название для карточек и навигации;
//   serverTitle  — заголовок на странице игры (необязательно);
//   emoji        — иконка перед названием;
//   status       — текст и модификатор бейджа (dev, live, planned, closed);
//   description  — описание; пустая строка означает заглушку;
//   settingsTitle — заголовок блока настроек;
//   settings     — список настроек: { label, value };
//
// Сборы по месяцам здесь не хранятся: донаты, цели и копилка
// лежат в data/donations.js.
// ============================================================

window.GAMES = [
    {
        id: 'zomboid',
        name: 'Project Zomboid',
        serverTitle: 'Project Zomboid Server',
        emoji: '🧟',
        status: {
            text: 'В разработке / Подготовка',
            modifier: 'dev'
        },
        description: 'Че ранарод погнали Nah00y: build 42',
        settingsTitle: 'Важные решения и настройки',
        settings: [
            { label: 'Настройки', value: 'PvP - вкл; респавн зомби - вкл, редкий' },
            { label: 'Моды', value: '-'},
            { label: 'Самописные моды', value: 'Survivor Metrics' }
        ]
    },

    {
        id: 'minecraft',
        name: 'Minecraft',
        serverTitle: 'OG Minecraft Server',
        emoji: '⛏️',
        status: {
            text: 'Не запланировано / Закрыт',
            modifier: 'closed'
        },
        description: 'Копатель офлайн',
        settingsTitle: 'О чем значится все это',
        settings: [
            { label: 'Версия', value: 'Beta 1.3' },
            { label: 'Вайп', value: 'Завтра' },
            { label: 'Статус', value: 'Влажные мечты' }
        ]
    }
];
