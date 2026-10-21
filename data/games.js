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
//   settingsTitle — заголовок блока настроек;
//   settingsGroups — настройки по группам (например, по файлам):
//                    { title, file, items: [...] };
//                    file: true — показать title как имя файла;
//                    элемент: { key, label, value, default };
//   settings     — простой плоский список: { label, value };
//                  используется, если settingsGroups не задан;
//   modsTitle    — заголовок блока модов (по умолчанию «Моды»);
//   mods         — общий список модов: { name, description, badge, badgeModifier };
//                  description показывается в скобках, badge — бейдж справа;
//                  badgeModifier: 'custom' — акцентный бейдж (самописный мод);
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
        hosting: {
            name: 'HVDS-8G',
            url: 'https://hosting-vds.com/vds-russia'
        },
        settingsTitle: 'Настройки сервера',
        settingsGroups: [
            {
                title: 'servertest.ini',
                file: true,
                items: [
                    // Доступ к серверу
                    { key: 'Password', label: 'пароль на вход', value: '(***)', default: '—' },
                    // Ослабление античита
                    { key: 'AntiCheat*', label: 'Ослабление античита', value: '3', default: '2' },
                    //PVP настройки
                    { key: 'SafetySystem', label: 'пвп без подготовки', value: 'false', default: 'true'},
                    // Убежища игроков
                    { key: 'PlayerSafehouse', label: 'личные убежища', value: 'true', default: 'false' },
                    { key: 'SafehouseAllowRespawn', label: 'возрождение в убежище', value: 'true', default: 'false' }
                ]
            },
            {
                title: 'servertest_SandboxVars.lua',
                file: true,
                items: [
                    // Зомби: заражение, скорость, пополнение популяции
                    { key: 'ZombieLore.Transmission', label: 'передача вируса', value: '2 (Saliva Only)', default: '1 (Blood and Saliva)' },
                    { key: 'ZombieLore.SprinterPercentage', label: 'доля бегунов', value: '0.5 (0,5 %)', default: '0' },
                    { key: 'ZombieRespawn', label: 'респавн зомби', value: '3 (Low)', default: '4 (None)' },
                    // Мир: отключение ресурсов
                    { key: 'WaterShut', label: 'отключение воды', value: '3 (0–2 месяца)', default: '2 (0–30 дней)' },
                    { key: 'ElecShut', label: 'отключение электричества', value: '3 (14 дней–2 месяца)', default: '2 (14–30 дней)' },
                    // Прокачка персонажа
                    { key: 'MultiplierConfig.Global', label: 'скорость прокачки навыков', value: '×2', default: '×1.0' },
                    { key: 'MinutesPerPage', label: 'время чтения страницы книги', value: '0.5 (×4 быстрее)', default: '2' }
                ]
            }
        ],
        modsTitle: 'Моды',
        mods: [
            // {
            //     name: 'Survivor Metrics',
            //     description: 'считает время онлайна и другую статистику, а по ней подстраивает сложность',
            //     badge: 'Самописный',
            //     badgeModifier: 'custom'
            // }
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
