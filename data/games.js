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
//   hosting      — необязательная справка о хостинге:
//                  { name, url }; url — ссылка на тариф, name — его название;
//   sources      — необязательные ссылки на репозиторий и актуальные
//                  данные сервера (настройки, моды и т. п.): [{ name, url }];
//                  показываются ссылками под описанием;
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
            text: 'Работает',
            modifier: 'live'
        },
        description: 'Че ранарод погнали Nah00y: build 42',
        hosting: {
            name: 'HVDS-8G',
            url: 'https://hosting-vds.com/vds-russia'
        },
        sources: [
            {
                name: 'Конфигурация сервера на GitHub',
                url: 'https://github.com/friends-of-steve-rambo/zomboid-docker'
            },
            {
                name: 'Настройки сервера',
                url: 'https://github.com/friends-of-steve-rambo/zomboid-docker/blob/main/config/server-default.pztemplate.json'
            },
            {
                name: 'Моды сервера',
                url: 'https://steamcommunity.com/sharedfiles/filedetails/?id=3826832497'
            }
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
        description: 'Копатель офлайн'
    }
];
