"use strict";
const $ = (id) => document.getElementById(id);
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const STATUS = { new: "Новое", planned: "Запланировано", progress: "В работе", done: "Сделано", declined: "Не будем делать" };
const isWin = /Win/i.test(navigator.platform || navigator.userAgent);

// ---------- языки: русский по умолчанию, украинский и английский ----------
const I18N = {"nav_video": {"uk": "Відео", "en": "Video"}, "nav_feat": {"uk": "Можливості", "en": "Features"}, "nav_dict": {"uk": "Словник", "en": "Dictionary"}, "nav_start": {"uk": "Як почати", "en": "Get started"}, "nav_fb": {"uk": "Відгуки", "en": "Feedback"}, "nav_dl": {"uk": "Завантажити програму", "en": "Download"}, "eyebrow": {"uk": "<span class=\"dot\"></span>Пілот для NCase Team", "en": "<span class=\"dot\"></span>Pilot for NCase Team"}, "h1": {"uk": "Голос — <span class=\"l\">найшвидший спосіб</span> передати інформацію", "en": "Voice is <span class=\"l\">the fastest way</span> to get your thoughts across"}, "lead": {"uk": "Диктуйте, а не друкуйте — це втричі швидше. Будь-які запити до AI — Claude, ChatGPT, Gemini і Copilot, листи та повідомлення в месенджерах.", "en": "Dictate instead of typing — it is 3 times faster. Any AI prompt — Claude, ChatGPT, Gemini and Copilot — plus emails and messenger chats."}, "watch": {"uk": "▶ Дивитися відео · 1:40", "en": "▶ Watch the video · 1:40"}, "ck1": {"uk": "Повністю офлайн", "en": "Fully offline"}, "ck2": {"uk": "Дані не залишають комп’ютер", "en": "Your data never leaves the computer"}, "ck3": {"uk": "Перекладає англійською", "en": "Translates into English"}, "ck4": {"uk": "Працює на віддаленому робочому столі (RDP)", "en": "Works over Remote Desktop (RDP)"}, "ck5": {"uk": "Свій словник: прізвища з відмінками й терміни", "en": "Your own dictionary: names in the right case, your terms"}, "ck6": {"uk": "Без платних підписок і лімітів", "en": "No paid subscriptions, no limits"}, "ck7": {"uk": "Можна без встановлення — portable", "en": "No install needed — portable version"}, "v_label": {"uk": "Відеоінструкція", "en": "Video guide"}, "v_h2": {"uk": "Як користуватися — за півтори хвилини", "en": "How to use it — in a minute and a half"}, "v_p": {"uk": "Встановлення, вибір моделі, запит у Claude, 1С через віддалений робочий стіл, WeChat з перекладом. Відео російською мовою.", "en": "Installation, choosing a model, a prompt in Claude, 1C over Remote Desktop, WeChat with translation. The video is in Russian."}, "f_label": {"uk": "Що вміє", "en": "What it does"}, "f_h2": {"uk": "Думка — одразу в потрібне поле", "en": "From thought straight into the right field"}, "f1_h": {"uk": "Пише там, де курсор", "en": "Types where your cursor is"}, "f1_p": {"uk": "Claude, ChatGPT, Gemini, Copilot, Outlook, Telegram, Excel, 1С — будь-яка програма на вашому комп’ютері.", "en": "Claude, ChatGPT, Gemini, Copilot, Outlook, Telegram, Excel, 1C — any app on your computer."}, "f2_h": {"uk": "Перекладає англійською", "en": "Translates into English"}, "f2_p": {"uk": "Почніть словами «Переклади англійською» і говоріть українською чи російською — у полі з’явиться готовий англійський текст.", "en": "Start with “Translate into English” and speak Russian or Ukrainian — finished English text appears in the field."}, "f2_s": {"uk": "На Mac уже працює, на Windows — у найближчому оновленні.", "en": "Already on Mac, coming to Windows in the next update."}, "f3_h": {"uk": "Повністю офлайн", "en": "Fully offline"}, "f3_p": {"uk": "Мовлення розпізнається просто на комп’ютері, інтернет не потрібен. Уся ваша інформація залишається тільки у вас — нічого не йде в хмару.", "en": "Speech is recognised right on your computer, no internet needed. Everything stays with you — nothing goes to the cloud."}, "f4_h": {"uk": "Працює на віддаленому робочому столі (RDP)", "en": "Works over Remote Desktop (RDP)"}, "f4_p": {"uk": "Диктуйте у вікно віддаленого робочого столу: 1С, пошта й програми на сервері отримують текст так само, як на вашому комп’ютері.", "en": "Dictate into a Remote Desktop window: 1C, mail and server apps get the text just like on your own computer."}, "f5_h": {"uk": "Три мови й пунктуація", "en": "Three languages, punctuation included"}, "f5_p": {"uk": "Російська, українська, англійська — без перемикання розкладок. Крапки, коми й великі літери програма ставить сама.", "en": "Russian, Ukrainian, English — no keyboard layout switching. Periods, commas and capitals are added automatically."}, "f6_h": {"uk": "Ваш особистий словник", "en": "Your personal dictionary"}, "f6_p": {"uk": "Прізвища колег, назви товарів, терміни 1С — VoxLocal запам’ятовує їх і далі пише правильно. Свій словник у кожного плюс спільний словник компанії.", "en": "Colleagues’ names, product names, 1C terms — VoxLocal remembers them and gets them right from then on. Everyone has their own dictionary, plus a shared company one."}, "u_label": {"uk": "Тільки у VoxLocal", "en": "Only in VoxLocal"}, "u_h2": {"uk": "Ваш словник — ваші слова", "en": "Your dictionary, your words"}, "u_p": {"uk": "Прізвища колег, назви товарів і терміни вашої роботи VoxLocal запам’ятовує і далі пише правильно — у вас і в колег, з якими ви поділилися словником.", "en": "VoxLocal remembers your colleagues’ names, product names and work terms and gets them right from then on — for you and for colleagues you share your dictionary with."}, "u1_h": {"uk": "Особистий словник і словник компанії", "en": "Personal and company dictionaries"}, "u1_p": {"uk": "Свої терміни, прізвища й виправлення — у своєму словнику. Словник компанії підключається до нього й оновлюється сам: нові співробітники й терміни з’являються без вашої участі.", "en": "Your terms, names and fixes live in your own dictionary. The company dictionary plugs in on top and updates itself: new colleagues and terms appear on their own."}, "u2_h": {"uk": "Прізвища — у правильному відмінку", "en": "Names in the right grammatical case"}, "u2_p": {"uk": "Модель почула «Гравцовій» — VoxLocal виправить на «Кравцовій» і збереже відмінок. Зроблено для української та російської, де прізвища відмінюються.", "en": "The model heard “Gravtsovoy”? VoxLocal corrects it to “Kravtsovoy” and keeps the case ending. Built for Russian and Ukrainian, where surnames decline."}, "u3_h": {"uk": "1С через віддалений робочий стіл", "en": "1C over Remote Desktop"}, "u3_p": {"uk": "Там, де звичайна вставка у вікно віддаленого робочого столу дає одну літеру, VoxLocal вставляє весь текст — в 1С, пошту й програми на сервері.", "en": "Where a normal paste into a Remote Desktop window gives you a single letter, VoxLocal inserts the full text — into 1C, mail and server apps."}, "d_label": {"uk": "Словник NCase", "en": "NCase dictionary"}, "d_h2": {"uk": "Знає мову нашої компанії", "en": "Speaks our company’s language"}, "d_p": {"uk": "Звичайні програми диктування пишуть «Одінес» замість 1С і плутають прізвища. У VoxLocal вбудовано спільний словник NCase: терміни компанії, прізвища колег і виправлення типових помилок. Він поповнюється за вашими відгуками й сам навчається на виправленнях.", "en": "Ordinary dictation apps write gibberish instead of “1C” and mangle surnames. VoxLocal has the shared NCase dictionary built in: company terms, colleagues’ names and fixes for typical mistakes. It grows from your feedback and learns from your corrections."}, "d1_h": {"uk": "терміни компанії", "en": "company terms"}, "d1_p": {"uk": "NCase, Proove, 1С, ДДС, ФОП, ГТД, УКТЗЕД, P&amp;L, Bitrix24, оприбуткування, інкасація, звірка кас, закриття періоду…", "en": "NCase, Proove, 1C, cash flow, sole proprietors, customs declarations, HS codes, P&amp;L, Bitrix24, cash collection, period closing…"}, "d2_h": {"uk": "прізвищ колег", "en": "colleagues’ names"}, "d2_p": {"uk": "З оргструктури Bitrix. Якщо модель почує прізвище трохи інакше, VoxLocal виправить його й збереже відмінок: «Гравцовій» → «Кравцовій».", "en": "From the Bitrix org chart. If the model mishears a surname, VoxLocal fixes it and keeps the grammatical case: “Gravtsova” → “Kravtsova”."}, "d3_h": {"uk": "виправлень помилок", "en": "error fixes"}, "d3_p": {"uk": "Реальні помилки з журналу диктувань: «Одінес» → 1С, «Ен Кейс» → NCase, «Proof» → Proove.", "en": "Real mistakes from the dictation log: “Odines” → 1C, “En Case” → NCase, “Proof” → Proove."}, "dh1": {"uk": "<b>Навчається на ваших правках.</b> Виправили слово після диктування — виділіть виправлений текст і натисніть <kbd>⌥</kbd> + <kbd>⇧</kbd> + <kbd>C</kbd>. VoxLocal порівняє й запам’ятає.", "en": "<b>Learns from your edits.</b> Fixed a word after dictating? Select the corrected text and press <kbd>⌥</kbd> + <kbd>⇧</kbd> + <kbd>C</kbd>. VoxLocal compares and remembers."}, "dh2": {"uk": "<b>Оновлюється сам.</b> Раз на тиждень словник звіряється з базою знань компанії: нові колеги й терміни з’являються без вашої участі.", "en": "<b>Updates itself.</b> Once a week the dictionary syncs with the company knowledge base: new colleagues and terms appear on their own."}, "dh3": {"uk": "<b>Потрібен новий термін?</b> Напишіть його боту @VoxLocal_bot — додамо до спільного словника для всіх. <a href=\"https://t.me/VoxLocal_bot?start=feedback\" target=\"_blank\" rel=\"noopener\">Запропонувати термін →</a>", "en": "<b>Need a new term?</b> Send it to the @VoxLocal_bot bot and we’ll add it to the shared dictionary. <a href=\"https://t.me/VoxLocal_bot?start=feedback\" target=\"_blank\" rel=\"noopener\">Suggest a term →</a>"}, "d_note": {"uk": "У Windows-версії словник NCase — терміни, прізвища колег і виправлення — вбудовано в програму, і він оновлюється разом із нею: нічого завантажувати не треба. Навчання на ваших виправленнях (⌥⇧C) поки є тільки на Mac.", "en": "In the Windows version the NCase dictionary — terms, names and fixes — is built in and updates together with the app: nothing to download. Learning from your corrections (⌥⇧C) is Mac-only for now."}, "de_label": {"uk": "Наочно", "en": "See for yourself"}, "de_h2": {"uk": "Довгий запит: голосом швидше", "en": "A long prompt: faster by voice"}, "de_task": {"uk": "Завдання: сформулювати запит для AI", "en": "Task: write a prompt for an AI"}, "de_run": {"uk": "▶ Запустити приклад", "en": "▶ Run the example"}, "de_k1": {"uk": "З клавіатури", "en": "Keyboard"}, "de_h1": {"uk": "Набрати думку", "en": "Type it"}, "de_k2": {"uk": "З VoxLocal", "en": "With VoxLocal"}, "de_h2b": {"uk": "Сказати думку", "en": "Say it"}, "de_win": {"uk": "Учетверо швидше на цьому прикладі", "en": "4 times faster in this example"}, "de_note": {"uk": "Розрахунок за середньою швидкістю: набір — близько 40 слів за хвилину, мовлення — близько 130.", "en": "Based on average speed: typing is about 40 words per minute, speech about 130."}, "s_label": {"uk": "Як почати", "en": "Get started"}, "s_h2": {"uk": "П’ять хвилин — і можна говорити", "en": "Five minutes and you’re talking"}, "s_p": {"uk": "Підходить для звичайного робочого комп’ютера та віддаленого робочого столу.", "en": "Works on a regular office computer and over Remote Desktop."}, "s1_h": {"uk": "Завантажте VoxLocal", "en": "Download VoxLocal"}, "s1_p": {"uk": "Кнопка нижче, у блоці «Почати роботу»: інсталятор або версія без встановлення (portable ZIP).", "en": "Use the button below in “Get going”: the installer or the no-install version (portable ZIP)."}, "s2_h": {"uk": "Встановіть або просто розпакуйте", "en": "Install it — or just unzip"}, "s2_p": {"uk": "<b>Інсталятор:</b> якщо Windows покаже «Windows захистила ваш комп’ютер» — натисніть «Докладніше», потім «Усе одно запустити». <b>Portable:</b> розпакуйте ZIP у будь-яку теку чи на флешку й запустіть програму — права адміністратора не потрібні.", "en": "<b>Installer:</b> if Windows shows “Windows protected your PC”, click “More info”, then “Run anyway”. <b>Portable:</b> unzip into any folder or a USB stick and run the app — no admin rights needed."}, "s3_h": {"uk": "Дозвольте доступ до мікрофона", "en": "Allow microphone access"}, "s3_p": {"uk": "Це потрібно, щоб програма могла вас чути.", "en": "So the app can hear you."}, "s4_h": {"uk": "Виберіть модель і клавіші", "en": "Choose a model and shortcut"}, "s4_p": {"uk": "Звичайний ноутбук — <b>Parakeet V3</b> (≈0,5 ГБ, швидка: російська, українська, англійська). Говорите тільки російською — <b>GigaAM v3</b> (≈0,15 ГБ). Потрібен переклад англійською — <b>Whisper Medium</b>. Модель завантажується один раз, змінити можна в налаштуваннях. Сполучення, наприклад, <kbd>Ctrl</kbd> + <kbd>Space</kbd>.", "en": "Regular laptop — <b>Parakeet V3</b> (≈0.5 GB, fast: Russian, Ukrainian, English). Russian only — <b>GigaAM v3</b> (≈0.15 GB). Need English translation — <b>Whisper Medium</b>. The model downloads once and can be changed in settings. Shortcut, e.g. <kbd>Ctrl</kbd> + <kbd>Space</kbd>."}, "s5_h": {"uk": "Затисніть, скажіть, відпустіть", "en": "Hold, speak, release"}, "s5_p": {"uk": "Текст з’явиться там, де стоїть курсор.", "en": "The text lands where your cursor is."}, "dl_h2": {"uk": "Почати роботу", "en": "Get going"}, "dl_p": {"uk": "Версія для пілоту доступна співробітникам компанії.", "en": "The pilot version is available to company staff."}, "dl_port_t": {"uk": "Windows · без встановлення", "en": "Windows · no install"}, "dl_port_s": {"uk": "Portable ZIP: розпакуйте в будь-яку теку чи на флешку — права адміністратора не потрібні, налаштування й моделі зберігаються поруч із програмою", "en": "Portable ZIP: unzip into any folder or onto a USB stick — no admin rights, settings and models live next to the app"}, "dl_port_b": {"uk": "Завантажити ZIP ↓", "en": "Download ZIP ↓"}, "dl_note": {"uk": "Завантаження займе близько хвилини. Встановлення — ще 3–4 хвилини.", "en": "Downloading takes about a minute, installing another 3–4."}, "t_label": {"uk": "Поради", "en": "Tips"}, "t_h2": {"uk": "Щоб розпізнавання було точнішим", "en": "For more accurate recognition"}, "t1_h": {"uk": "Говоріть фразами", "en": "Speak in phrases"}, "t1_p": {"uk": "Пауза між реченнями допомагає природно розставити розділові знаки.", "en": "A pause between sentences helps punctuation come out naturally."}, "t2_h": {"uk": "Не відпускайте раніше", "en": "Don’t let go too early"}, "t2_p": {"uk": "Спершу договоріть, потім відпустіть гарячі клавіші — текст з’явиться повністю.", "en": "Finish speaking, then release the shortcut — the full text appears."}, "t3_h": {"uk": "Почніть з AI", "en": "Start with AI"}, "t3_p": {"uk": "Надиктуйте перший довгий запит у Claude чи ChatGPT: мета, контекст, формат відповіді — різницю відчуєте одразу.", "en": "Dictate your first long prompt to Claude or ChatGPT: goal, context, answer format — you’ll feel the difference at once."}, "t4_h": {"uk": "Віддалений робочий стіл", "en": "Remote Desktop"}, "t4_p": {"uk": "У підключенні увімкніть буфер обміну: «Показати параметри» → «Локальні ресурси» → «Буфер обміну». Вставляється одна літера — напишіть нам.", "en": "Enable the clipboard in the connection: “Show options” → “Local resources” → “Clipboard”. Only one letter gets pasted? Let us know."}, "t5_h": {"uk": "Прізвища й терміни", "en": "Names and terms"}, "t5_p": {"uk": "Плутає прізвище колеги, товар чи термін 1С? Надішліть відгук із правильним написанням — додамо до спільного словника NCase.", "en": "Getting a colleague’s name, a product or a 1C term wrong? Send feedback with the right spelling and we’ll add it to the NCase dictionary."}, "t6_h": {"uk": "Переклад на льоту", "en": "Instant translation"}, "t6_p": {"uk": "Скажіть «Переклади англійською…» на початку фрази — лист партнеру одразу вийде англійською.", "en": "Say “Translate into English…” at the start — your email to a partner comes out in English."}, "fb_stats": {"uk": "Пілот у цифрах", "en": "The pilot in numbers"}, "fb_label": {"uk": "Зворотний зв’язок", "en": "Feedback"}, "fb_h2": {"uk": "Ваш досвід зробить VoxLocal кращим", "en": "Your experience makes VoxLocal better"}, "fb_lead": {"uk": "Розкажіть, що спрацювало, що ні і який сценарій вам потрібен. Корисні ідеї потраплять у найближчі оновлення.", "en": "Tell us what worked, what didn’t and what you need. Good ideas go into the next updates."}, "k_praise": {"uk": "Заощадило час", "en": "Saved me time"}, "k_bug": {"uk": "Не розпізнало мовлення", "en": "Didn’t recognise speech"}, "k_idea": {"uk": "Є ідея", "en": "I have an idea"}, "k_term": {"uk": "Термін для словника", "en": "Term for the dictionary"}, "footer": {"uk": "VoxLocal · пілот NCase Team · питання — Денис Іванов, CFO / AI Lead. Засновано на відкритому проєкті Handy (MIT).", "en": "VoxLocal · NCase Team pilot · questions to Denys Ivanov, CFO / AI Lead. Based on the open-source Handy project (MIT)."}, "p_label": {"uk": "VoxLocal Pro і Telegram", "en": "VoxLocal Pro and Telegram"}, "p_h2": {"uk": "Pro — безкоштовно за підписку на канал", "en": "Pro is free when you subscribe to the channel"}, "p_p": {"uk": "Підпишіться на Telegram-канал @voxlocal — там новини, оновлення й поради. Бот @VoxLocal_bot перевірить підписку й видасть код Pro: власні словники, словник компанії та обмін словниками з колегами.", "en": "Subscribe to the @voxlocal Telegram channel for news, updates and tips. The @VoxLocal_bot bot checks your subscription and gives you a Pro code: your own dictionaries, a company dictionary and sharing dictionaries with colleagues."}, "p1_h": {"uk": "Власні словники й словник компанії", "en": "Your own and company dictionaries"}, "p1_p": {"uk": "Терміни, прізвища колег і виправлення — у вашому словнику. Покладіть файл словника компанії в теку «Мої словники» — VoxLocal підхопить його сам.", "en": "Terms, colleagues’ names and fixes live in your dictionary. Drop the company dictionary file into “My dictionaries” and VoxLocal picks it up."}, "p2_h": {"uk": "Запросити колегу", "en": "Invite a colleague"}, "p2_p": {"uk": "Введіть e-mail або @нік у Telegram — відкриється лист або чат із готовим запрошенням і посиланням на бота.", "en": "Enter an email or a Telegram @username — an email or chat opens with a ready-made invitation and a link to the bot."}, "p3_h": {"uk": "Поділитися словником", "en": "Share your dictionary"}, "p3_p": {"uk": "Одна кнопка збирає ваші терміни й прізвища у файл: надішліть його через бота або поштою. Колега підключить його кнопкою «Імпорт словника».", "en": "One button packs your terms and names into a file: send it via the bot or by email. Your colleague adds it with “Import dictionary”."}, "ph1": {"uk": "<b>1. Відкрийте бота</b> за прямим посиланням <a href=\"https://t.me/VoxLocal_bot?start=pro\" target=\"_blank\" rel=\"noopener\">t.me/VoxLocal_bot</a> — у пошуку Telegram є схожі чужі боти.", "en": "<b>1. Open the bot</b> via the direct link <a href=\"https://t.me/VoxLocal_bot?start=pro\" target=\"_blank\" rel=\"noopener\">t.me/VoxLocal_bot</a> — Telegram search shows look-alike bots."}, "ph2": {"uk": "<b>2. Підпишіться на <a href=\"https://t.me/voxlocal\" target=\"_blank\" rel=\"noopener\">@voxlocal</a></b> і натисніть у боті «Перевірити» — прийде код виду VOX1-…", "en": "<b>2. Subscribe to <a href=\"https://t.me/voxlocal\" target=\"_blank\" rel=\"noopener\">@voxlocal</a></b> and tap “Check” in the bot — you’ll get a code like VOX1-…"}, "ph3": {"uk": "<b>3. Вставте код</b> у VoxLocal: Налаштування → Загальні → VoxLocal Pro → «Активувати». Там само кнопки «Запросити колегу» й «Поділитися словником».", "en": "<b>3. Paste the code</b> into VoxLocal: Settings → General → VoxLocal Pro → “Activate”. The “Invite a colleague” and “Share your dictionary” buttons are there too."}, "p_btn": {"uk": "Отримати Pro у Telegram", "en": "Get Pro in Telegram"}, "p_ch": {"uk": "Канал @voxlocal →", "en": "@voxlocal channel →"}, "p_note": {"uk": "Співробітникам NCase: у корпоративній збірці з цієї сторінки Pro вже ввімкнено, код не потрібен. Підпишіться на канал, щоб першими дізнаватися про оновлення.", "en": "NCase staff: Pro is already on in the company build from this page, no code needed. Subscribe to the channel to hear about updates first."}, "st1g": {"uk": "завантажень програми", "en": "app downloads"}, "st1g_s": {"uk": "інсталятор і portable з сайту", "en": "installer and portable from this site"}, "st2g": {"uk": "автооновлень", "en": "auto-updates"}, "st2g_s": {"uk": "програма сама завантажила нову версію", "en": "the app downloaded a new version itself"}, "st3g": {"uk": "поточна версія", "en": "current version"}, "fb_how": {"uk": "Напишіть боту @VoxLocal_bot одним повідомленням: що вийшло, де програма помилилася, ідея чи термін для словника. Можна додати скриншот або голосове — Денис читає кожне повідомлення.", "en": "Message the @VoxLocal_bot bot: what worked, where the app got it wrong, an idea or a term for the dictionary. Screenshots and voice notes are welcome — Denys reads every message."}, "fb_btn": {"uk": "Написати відгук у Telegram", "en": "Send feedback via Telegram"}};
const TX = {"status_listen": {"ru": "Слушаю вас", "uk": "Слухаю вас", "en": "Listening"}, "status_process": {"ru": "Распознаю…", "uk": "Розпізнаю…", "en": "Recognising…"}, "status_done": {"ru": "Текст вставлен", "uk": "Текст вставлено", "en": "Text inserted"}, "demo_text": {"ru": "Подготовь письмо поставщику: нужно уточнить сроки отгрузки по последнему заказу, запросить актуальный прайс-лист на кабели и зарядные устройства и узнать, есть ли скидка при заказе от тысячи штук. Тон — вежливый, деловой.", "uk": "Підготуй лист постачальнику: треба уточнити терміни відвантаження за останнім замовленням, запросити актуальний прайс-лист на кабелі й зарядні пристрої та дізнатися, чи є знижка при замовленні від тисячі штук. Тон — ввічливий, діловий.", "en": "Draft an email to the supplier: confirm the shipping dates for our last order, ask for the current price list for cables and chargers, and find out whether there is a discount for orders of a thousand units or more. Polite, businesslike tone."}, "demo_running": {"ru": "Идёт пример…", "uk": "Йде приклад…", "en": "Running…"}, "demo_listening": {"ru": "Слушаю…", "uk": "Слухаю…", "en": "Listening…"}, "demo_again": {"ru": "↺ Ещё раз", "uk": "↺ Ще раз", "en": "↺ Again"}, "ph_praise": {"ru": "Напишите коротко, что получилось или сколько времени сэкономили…", "uk": "Напишіть коротко, що вийшло або скільки часу заощадили…", "en": "Briefly: what worked or how much time you saved…"}, "ph_bug": {"ru": "Что сказали и что распознала программа? Где это было (Claude, 1С, RDP)?", "uk": "Що сказали і що розпізнала програма? Де це було (Claude, 1С, RDP)?", "en": "What did you say and what did the app type? Where was it (Claude, 1C, RDP)?"}, "ph_idea": {"ru": "Что стоит добавить или изменить?", "uk": "Що варто додати чи змінити?", "en": "What should we add or change?"}, "ph_term": {"ru": "Как правильно пишется и как программа ошибается. Например: «Одинес» → 1С, «Гравцовой» → Кравцовой", "uk": "Як правильно пишеться і як програма помиляється. Наприклад: «Одінес» → 1С, «Гравцовій» → Кравцовій", "en": "The correct spelling and how the app gets it wrong. E.g. “Odines” → 1C"}, "st_dl_gh": {"ru": "и {n} загрузок с GitHub всего", "uk": "і {n} завантажень з GitHub загалом", "en": "plus {n} downloads from GitHub in total"}, "st_dl_click": {"ru": "считаем нажатия «Скачать» на этой странице", "uk": "рахуємо натискання «Завантажити» на цій сторінці", "en": "counting “Download” clicks on this page"}, "st_runs_sub": {"ru": "по проверкам обновлений · данные на {d}", "uk": "за перевірками оновлень · дані на {d}", "en": "by update checks · as of {d}"}, "st_runs_none": {"ru": "появится после первого релиза", "uk": "з’явиться після першого релізу", "en": "available after the first release"}, "st_fb_sub": {"ru": "сэкономило время — {p} · идей — {i} · проблем — {b} · терминов — {t}", "uk": "заощадило час — {p} · ідей — {i} · проблем — {b} · термінів — {t}", "en": "saved time — {p} · ideas — {i} · problems — {b} · terms — {t}"}, "st_fb_none": {"ru": "станьте первым", "uk": "станьте першим", "en": "be the first"}, "more": {"ru": "Показать все ({n})", "uk": "Показати всі ({n})", "en": "Show all ({n})"}, "empty_section": {"ru": "В этом разделе пока пусто.", "uk": "У цьому розділі поки порожньо.", "en": "Nothing here yet."}, "empty_all": {"ru": "Здесь появятся отзывы участников пилота. Напишите первый — форма рядом.", "uk": "Тут з’являться відгуки учасників пілоту. Напишіть перший — форма поруч.", "en": "Pilot feedback will appear here. Write the first one — the form is right here."}, "vote": {"ru": "Мне тоже · {n}", "uk": "Мені теж · {n}", "en": "Me too · {n}"}, "anon": {"ru": "Без имени", "uk": "Без імені", "en": "Anonymous"}, "participant": {"ru": "Участник пилота", "uk": "Учасник пілоту", "en": "Pilot participant"}, "kind_bug": {"ru": "Проблема", "uk": "Проблема", "en": "Problem"}, "kind_idea": {"ru": "Идея", "uk": "Ідея", "en": "Idea"}, "kind_praise": {"ru": "Сэкономило время", "uk": "Заощадило час", "en": "Saved time"}, "kind_term": {"ru": "Термин для словаря", "uk": "Термін для словника", "en": "Dictionary term"}, "kind_other": {"ru": "Отзыв", "uk": "Відгук", "en": "Feedback"}, "reply": {"ru": "Ответ: ", "uk": "Відповідь: ", "en": "Reply: "}, "del_mine": {"ru": "Удалить мой отзыв", "uk": "Видалити мій відгук", "en": "Delete my feedback"}, "del_confirm": {"ru": "Точно удалить? Нажмите ещё раз", "uk": "Точно видалити? Натисніть ще раз", "en": "Sure? Click again to delete"}, "del_fail": {"ru": "Не удалось удалить", "uk": "Не вдалося видалити", "en": "Couldn’t delete"}, "form_empty": {"ru": "Напишите хотя бы пару слов.", "uk": "Напишіть хоча б кілька слів.", "en": "Please write at least a few words."}, "form_sending": {"ru": "Отправляю…", "uk": "Надсилаю…", "en": "Sending…"}, "form_ok": {"ru": "Спасибо! Отзыв появился в ленте.", "uk": "Дякуємо! Відгук з’явився у стрічці.", "en": "Thank you! Your feedback is now in the feed."}, "form_noperm": {"ru": "Нет прав на запись. Попросите Дениса дать вам доступ «Участник».", "uk": "Немає прав на запис. Попросіть Дениса надати вам доступ «Учасник».", "en": "No permission to post. Ask Denys for “Contributor” access."}, "form_fail": {"ru": "Не получилось отправить. Попробуйте ещё раз через минуту.", "uk": "Не вдалося надіслати. Спробуйте ще раз за хвилину.", "en": "Couldn’t send. Please try again in a minute."}, "dl_soon": {"ru": "Скоро", "uk": "Незабаром", "en": "Soon"}, "dl_btn": {"ru": "Скачать ↓", "uk": "Завантажити ↓", "en": "Download ↓"}, "ver": {"ru": " · версия {v}", "uk": " · версія {v}", "en": " · version {v}"}, "win_sub": {"ru": "Windows 10 / 11 · рекомендуем", "uk": "Windows 10 / 11 · рекомендуємо", "en": "Windows 10 / 11 · recommended"}, "mac_wait": {"ru": "Apple Silicon · пока устанавливает Денис Иванов", "uk": "Apple Silicon · поки встановлює Денис Іванов", "en": "Apple Silicon · for now installed by Denys Ivanov"}, "hero_win": {"ru": "Скачать для Windows ↓", "uk": "Завантажити для Windows ↓", "en": "Download for Windows ↓"}, "hero_mac": {"ru": "Скачать для Mac ↓", "uk": "Завантажити для Mac ↓", "en": "Download for Mac ↓"}, "notice_nodb": {"ru": "Отзывы работают, когда страница открыта в Claude под рабочим аккаунтом NCase.", "uk": "Відгуки працюють, коли сторінку відкрито в Claude під робочим акаунтом NCase.", "en": "Feedback works when this page is opened in Claude with an NCase work account."}, "notice_ro": {"ru": "У вас доступ только для чтения. Чтобы оставлять отзывы, попросите Дениса дать вам роль «Участник».", "uk": "У вас доступ лише для читання. Щоб залишати відгуки, попросіть Дениса надати вам роль «Учасник».", "en": "You have read-only access. To post feedback, ask Denys for the “Contributor” role."}, "load_fail": {"ru": "Не удалось загрузить отзывы. Обновите страницу.", "uk": "Не вдалося завантажити відгуки. Оновіть сторінку.", "en": "Couldn’t load feedback. Please refresh the page."}, "ver_from": {"ru": "от {d}", "uk": "від {d}", "en": "released {d}"}};
const LOC = { ru: "ru-RU", uk: "uk-UA", en: "en-GB" };
let LANG = "ru";
try { const l = localStorage.getItem("vl-lang"); if (l === "uk" || l === "en") LANG = l; } catch (e) {}
function T(k, p) {
  const e = TX[k]; let s = e ? (e[LANG] || e.ru) : k;
  if (p) for (const [a, b] of Object.entries(p)) s = s.split("{" + a + "}").join(String(b));
  return s;
}
const RU_HTML = new Map();
document.querySelectorAll("[data-i]").forEach((e) => RU_HTML.set(e, e.innerHTML));
const langHooks = [];
function setLang(l, save) {
  LANG = l === "uk" || l === "en" ? l : "ru";
  document.documentElement.lang = LANG;
  document.querySelectorAll("[data-i]").forEach((e) => {
    const tr = I18N[e.dataset.i];
    e.innerHTML = LANG === "ru" || !tr ? RU_HTML.get(e) : tr[LANG];
  });
  document.querySelectorAll(".lang button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === LANG)));
  if (save) { try { localStorage.setItem("vl-lang", LANG); } catch (e) {} }
  langHooks.forEach((f) => { try { f(); } catch (e) {} });
}
document.querySelector(".lang").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-lang]"); if (b) setLang(b.dataset.lang, true);
});

// ---------- живое «Кольцо» — тот же шейдер, что в приложении ----------
/* VoxLocal «Кольцо» — the exact shader of the VoxLocal recording overlay, wrapped for
   seek-safe HyperFrames rendering. Usage:
     const draw = VoxRing.mount(canvasEl, { glass: true,
        listen: [2.6, 6.0],      // frame-local seconds: overlay listening (voice-reactive)
        process: [6.0, 8.0] });  // recognising (ring spins, comet runs); hides after
     draw(t)  // pure function of frame-local time t — call it from a GSAP onUpdate
   No Math.random, no Date.now, no RAF: identical pixels for identical t. */
(function () {
  function sstep(a, b, x) { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  function hash(n) { const x = Math.sin(n * 91.7) * 43758.5; return x - Math.floor(x); }
  // deterministic synthetic voice: syllables ~4.7/s, short pauses between words
  function voice(s) {
    const talking = (s % 3.2) > 0.25 && (s % 3.2) < 2.9;
    if (!talking) return { lvl: 0.05, lo: 0.02, mid: 0.02, hi: 0.01 };
    const ph = s * 4.7, f = ph - Math.floor(ph);
    const vowel = Math.pow(Math.max(0, Math.sin(Math.PI * Math.min(1, f * 1.2))), 1.5);
    const fric = hash(Math.floor(ph)) > 0.55 ? Math.exp(-f * 9) : 0;
    const loud = 0.6 + 0.4 * Math.sin(s * 1.3);
    const lo = vowel * loud, mid = (0.7 * vowel + 0.5 * fric) * loud, hi = Math.max(fric, 0.2 * vowel) * loud;
    return { lvl: Math.min(1, 0.12 + 0.85 * Math.max(lo, mid, hi)), lo, mid, hi };
  }
  function mount(canvas, opts) {
    opts = opts || {};
    const glassOn = opts.glass === false ? 0 : 1;
    const L = opts.listen || [0, 3], P = opts.process || [L[1], L[1] + 1.5];
    const VERT = `
    attribute vec2 aPos;
    void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
    `;
    
    const FRAG = `
    #ifdef GL_OES_standard_derivatives
    #extension GL_OES_standard_derivatives : enable
    #endif
    precision highp float;
    
    uniform vec2  uRes;
    uniform float uTime;
    uniform float uLevel;    // сглаженная громкость 0..1
    uniform float uThink;    // 0 — слушаю, 1 — распознаю
    uniform float uAppear;   // 0..1 — появление / исчезание
    uniform float uPhase;    // накопленная фаза движения
    uniform float uSpin;     // накопленный угол «центрифуги» при распознавании
    uniform vec3  uBands;    // низкие / средние / высокие частоты голоса 0..1
    uniform float uEnv;      // медленная огибающая громкости
    uniform float uGlass;    // 0 — тёмная подложка, 1 — стекло (размытие рисует macOS под страницей)
    
    #define PI  3.14159265
    #define TAU 6.28318531
    
    float px;                // размер пикселя экрана в координатах сцены
    
    // покрытие линии полушириной hw на расстоянии d — край ровно в 1 пиксель
    float lineA(float d, float hw) { return clamp((hw - d) / px + 0.5, 0.0, 1.0); }
    float glowF(float d, float r)  { return exp(-d / r); }
    
    float sdRoundBox(vec2 p, vec2 b, float r) {
      vec2 q = abs(p) - b + r;
      return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
    }
    
    // градиент по четырём опорным цветам, t зацикливается
    vec3 grad4(vec3 a, vec3 b, vec3 c, vec3 d, float t) {
      t = fract(t) * 4.0;
      if (t < 1.0) return mix(a, b, smoothstep(0.0, 1.0, t));
      if (t < 2.0) return mix(b, c, smoothstep(1.0, 2.0, t));
      if (t < 3.0) return mix(c, d, smoothstep(2.0, 3.0, t));
      return mix(d, a, smoothstep(3.0, 4.0, t));
    }
    
    // подложка. uGlass = 0: тёмная, непрозрачная на 82 %.
    // uGlass = 1: «жидкое стекло» — фон размывает сама macOS под окном, здесь
    // только лёгкий цветной градиент, светлая кромка (френель) и блик сверху.
    vec4 plate(float sd, vec2 p, float top) {
      float cov = clamp(-sd / px + 0.5, 0.0, 1.0);
      float yy = clamp(p.y / top * 0.5 + 0.5, 0.0, 1.0);
      float up = clamp(p.y / top, 0.0, 1.0);
      // тёмная
      vec3 cD = mix(vec3(0.030, 0.034, 0.050), vec3(0.060, 0.066, 0.090), yy);
      cD += lineA(abs(sd + 0.6 * px), 0.5 * px) * (0.10 + 0.16 * up) / 0.82;
      // стекло
      float edge = smoothstep(-10.0 * px, 0.0, sd);                 // ближе к кромке — светлее
      vec3 cG = mix(vec3(1.00, 0.66, 0.58), vec3(0.74, 0.66, 1.00), yy);
      cG = mix(cG, vec3(1.0), 0.55 * edge);
      float aG = 0.10 + 0.20 * edge;
      float rim = lineA(abs(sd + 0.7 * px), 0.6 * px) * (0.30 + 0.45 * up);
      vec2 sp = (p - vec2(-0.30, 0.55) * top) / (vec2(0.42, 0.22) * top);
      float spec = exp(-dot(sp, sp)) * 0.22;
      vec3 colG = (cG * aG + vec3(rim + spec)) / max(aG + rim + spec, 1e-3);
      float aGt = min(1.0, aG + rim + spec);
      return vec4(mix(cD, colG, uGlass), cov * mix(0.82, aGt, uGlass));
    }
    
    // финальная сборка: подложка + свет линий (premultiplied alpha)
    vec4 compose(vec4 pl, vec3 light, float mask) {
      float plateA = pl.a;
      vec3 col = pl.rgb * plateA + light * mask;
      float a = clamp(plateA + max(max(light.r, light.g), light.b) * mask, 0.0, 1.0);
      col = min(col, vec3(a));
      return vec4(col, a) * uAppear;
    }
    
    // «Кольцо» — спираль ДНК, свёрнутая в круг: две нити шесть раз
    // перекрещиваются по окружности (шестилучевой ритм), между ними — радиальные
    // ступеньки; снаружи две тонкие золотые нити с девятью узлами. Тёплая
    // гамма с фирменным красным. Низкие частоты раскрывают спираль, высокие —
    // внешние нити, громкость чуть раздувает кольцо. При распознавании кольцо
    // сжимается, раскручивается центрифугой, по нему бежит искра.
    float gR0, gA, gPh, gRot;
    
    float ringR(float ang, float off, float a, float n) {
      return gR0 + a * sin(n * (ang - gRot) - gPh + off);
    }
    
    vec3 warm(float t, float sh) {
      return grad4(vec3(0.95, 0.10, 0.07), vec3(1.00, 0.48, 0.14),
                   vec3(1.00, 0.22, 0.52), vec3(1.00, 0.50, 0.40), t + sh);
    }
    
    void main() {
      vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
      px = 1.0 / uRes.y;
      float ap = smoothstep(0.0, 1.0, uAppear);
      float R = mix(mix(0.28, 0.48, ap), 0.48, uGlass);
      float sd = length(p) - R;
      vec4 pl = plate(sd, p, R);
    
      float L = uBands.x, M = uBands.y, H = uBands.z, th = uThink;
      float r = length(p), ang = atan(p.y, p.x);
      float bright = mix(1.0, 0.42, th);
      gR0 = mix(0.235 + 0.025 * uEnv, 0.20, th) * mix(0.75, 1.0, ap);
      // волны нарастают плавно: основной размах идёт от медленной огибающей
      // речи (~0,6 с), быстрые слоги добавляют лишь небольшую рябь сверху
      gA = mix(0.020 + 0.072 * uEnv + 0.028 * L * (0.3 + 0.7 * uEnv) + 0.010 * uLevel, 0.016, th);
      gPh = uPhase * 1.6;
      gRot = uPhase * 0.08 - uSpin * 0.55;
      float e = 0.004;
      // распознавание: по кольцу по часовой стрелке бежит яркая дуга с хвостом
      float head = -uSpin * 0.9;
      float hd = mod(ang - head, TAU);                      // 0 у «головы», растёт к хвосту
      float comet = th * (exp(-hd / 1.0) + 0.9 * exp(-pow((TAU - hd) / 0.05, 2.0)));
      float t = ang / TAU + uTime * 0.03;
    
      vec3 light = vec3(0.0);
      // внешние золотые нити
      for (int i = 0; i < 2; i++) {
        float off = i == 0 ? PI * 0.5 : PI * 1.5;
        float a = mix(0.010 + 0.05 * H * (0.4 + 0.6 * uEnv), 0.008, th);
        float sr = gR0 + 0.075 * (1.0 - th);
        float Rr = sr + a * sin(9.0 * (ang - gRot) + 1.3 * gPh + off);
        float dR = a * 9.0 * cos(9.0 * (ang - gRot) + 1.3 * gPh + off);
        float d = abs(r - Rr) / sqrt(1.0 + pow(dR / max(r, 0.03), 2.0));
        vec3 c = mix(vec3(1.0, 0.80, 0.42), vec3(1.0, 0.92, 0.70), 0.5 + 0.5 * sin(ang * 2.0 + uTime));
        light += c * (lineA(d, 0.5 * px) * 0.45 + glowF(d, 2.5 * px) * 0.10) * bright;
      }
    
      // ступеньки
      float D = TAU / 8.0;
      float u0 = 6.0 * (ang - gRot) - gPh;
      float ur = floor(u0 / D + 0.5) * D;
      float angr = (ur + gPh) / 6.0 + gRot;
      float r0 = ringR(angr, 0.0, gA, 6.0), r1 = ringR(angr, PI, gA, 6.0);
      float inside = smoothstep(min(r0, r1) - px, min(r0, r1) + px, r) * (1.0 - smoothstep(max(r0, r1) - px, max(r0, r1) + px, r));
      float rung = lineA(abs(r * (ang - angr)), 0.5 * px) * inside;
      light += warm(t, 0.15) * rung * 0.35 * bright;
    
      // главные нити: дальняя, затем ближняя
      float z0 = cos(6.0 * (ang - gRot) - gPh);
      for (int k = 0; k < 2; k++) {
        float off = (k == 0) == (z0 < 0.0) ? 0.0 : PI;
        float z = cos(6.0 * (ang - gRot) - gPh + off);
        float Rr = ringR(ang, off, gA, 6.0);
        float dR = (ringR(ang + e, off, gA, 6.0) - ringR(ang - e, off, gA, 6.0)) / (2.0 * e);
        float d = abs(r - Rr) / sqrt(1.0 + pow(dR / max(r, 0.03), 2.0));
        float depth = 0.5 + 0.5 * z;
        float hw = px * (0.7 + 1.1 * depth) * (1.0 + 0.6 * M);
        float cov = lineA(d, hw);
        vec3 c = warm(t, off > 0.5 ? 0.5 : 0.0);
        c = mix(c, vec3(1.0, 0.93, 0.88), 0.2 * H * depth + 0.6 * comet);
        float b = (0.40 + 0.60 * depth) * bright * (1.0 + 2.6 * comet);
        light = light * (1.0 - cov * 0.85) + c * (cov + glowF(d, (2.5 + 3.5 * uLevel) * px) * 0.32) * b;
      }
      // сама дуга-индикатор поверх нитей
      float dArc = abs(r - gR0);
      light += mix(vec3(1.0, 0.45, 0.30), vec3(1.0, 0.95, 0.90), comet) * comet *
               (lineA(dArc, 1.1 * px) * 0.9 + glowF(dArc, 4.0 * px) * 0.45);
      // тёплое свечение в центре
      light += vec3(1.0, 0.30, 0.18) * glowF(r, 0.10) * (0.06 + 0.12 * uEnv) * bright;
    
      float mask = 1.0 - smoothstep(-0.03, 0.0, sd);
      gl_FragColor = compose(pl, light, mask);
    }
    `;
    
    const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, preserveDrawingBuffer: true });
    // производные в шейдере — для сглаживания краёв ровно в 1 пиксель
    gl.getExtension("OES_standard_derivatives");
    
    function compile(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    }
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    gl.useProgram(prog);
    
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    
    const U = {};
    for (const n of ["uRes", "uTime", "uLevel", "uThink", "uAppear", "uPhase", "uSpin", "uBands", "uEnv", "uGlass"]) U[n] = gl.getUniformLocation(prog, n);
    
    
    
    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, w, h);
    }
    
    function draw(t, level, think, appear, phase, spin, bands, env) {
      resize();
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(U.uRes, canvas.width, canvas.height);
      gl.uniform1f(U.uTime, t);
      gl.uniform1f(U.uLevel, level);
      gl.uniform1f(U.uThink, think);
      gl.uniform1f(U.uAppear, appear);
      gl.uniform1f(U.uPhase, phase === undefined ? t : phase);
      gl.uniform1f(U.uSpin, spin === undefined ? 0 : spin);
      const b = bands || [level, level, level];
      gl.uniform3f(U.uBands, b[0], b[1], b[2]);
      gl.uniform1f(U.uEnv, env === undefined ? level : env);
      gl.uniform1f(U.uGlass, glassOn);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    
    
    return function drawAt(t) {
      const hold = !!opts.hold;
      const appear = hold ? 1 : sstep(L[0], L[0] + 0.35, t) * (1 - sstep(P[1], P[1] + 0.35, t));
      const listening = t >= L[0] && t < L[1];
      const v = listening ? voice(t - L[0]) : { lvl: 0, lo: 0, mid: 0, hi: 0 };
      let think = t < P[0] ? 0 : 1 - Math.exp(-(t - P[0]) / 0.33);
      if (hold && t > P[1]) think *= Math.exp(-(t - P[1]) / 0.45);
      const tl = Math.min(Math.max(t - L[0], 0), L[1] - L[0]);
      const env = listening ? Math.min(1, tl / 0.8) * (0.55 + 0.25 * Math.sin(tl * 0.9)) : Math.max(0, 0.6 * Math.exp(-(t - L[1]) / 0.5));
      const level = listening ? Math.max(v.lvl, 0.04 + 0.03 * Math.sin(t * 2.3)) : (t >= P[0] && t < P[1] ? 0.12 : (hold ? 0.05 + 0.03 * Math.sin(t * 2.3) : 0));
      const phase = t * 1.1 + 0.6 * tl;
      const dp = Math.max(0, Math.min(t, P[1] + (hold ? 1.2 : 0.35)) - P[0]);
      const spin = 7.5 * (dp - 0.48 * (1 - Math.exp(-dp / 0.48)));
      draw(t, level, think, appear, phase, spin, [v.lo, v.mid, v.hi], env);
    };
  }
  window.VoxRing = { mount };
})();

// ---------- орб: слушаю → распознаю → вставлено ----------
(function () {
  const orb = $("orb"), st = $("status"), stt = $("status-t"), bars = [...document.querySelectorAll("#bars rect")];
  const H = [12, 20, 28, 20, 12];
  let mode = "listen";
  const t0 = performance.now();
  langHooks.push(() => { mode = ""; });
  function setMode(m, text) { mode = m; orb.dataset.mode = m; st.dataset.mode = m; stt.textContent = text; }
  let drawRing = null;
  try { drawRing = window.VoxRing.mount($("ringcv"), { glass: true, hold: true, listen: [0, 6.5], process: [6.5, 8.5] }); } catch (e) {}
  if (reduce) { if (drawRing) drawRing(3.2); return; }
  setInterval(() => {
    const s = ((performance.now() - t0) / 1000) % 10;
    if (s < 6.5) { if (mode !== "listen") setMode("listen", T("status_listen")); }
    else if (s < 8.5) { if (mode !== "process") setMode("process", T("status_process")); }
    else if (mode !== "done") setMode("done", T("status_done"));
  }, 100);
  function frame(now) {
    const t = now / 1000;
    if (drawRing) drawRing(((now - t0) / 1000) % 10);
    bars.forEach((b, i) => {
      let h = H[i];
      if (mode === "listen") { const talk = 0.45 + 0.55 * Math.abs(Math.sin(t * 1.3)); h = 8 + (H[i] + 8) * Math.abs(Math.sin(t * (5 + i * 1.7) + i)) * talk; }
      else if (mode === "process") h = 8 + 6 * (1 + Math.sin(t * 8 - i * 0.9));
      else h = 6;
      b.setAttribute("height", h.toFixed(1)); b.setAttribute("y", (200 - h / 2).toFixed(1));
    });
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

// ---------- наглядно: клавиатура против голоса ----------
(function () {
  let TEXT = T("demo_text"), running = false;
  const KEY = 72, VOICE = 17, REAL = 7.5;   // секунды «по-настоящему» и длительность ролика
  const tk = $("t-key"), tv = $("t-voice"), typed = $("typed"), said = $("said"), win = $("win"), btn = $("demo-run");
  const fmt = (s) => String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(Math.floor(s % 60)).padStart(2, "0");
  function showSaid() { said.replaceChildren(); const m = document.createElement("mark"); m.textContent = TEXT; said.append(m); }
  tk.textContent = fmt(KEY); tv.textContent = fmt(VOICE); typed.textContent = TEXT; showSaid();
  langHooks.push(() => { TEXT = T("demo_text"); if (!running) { typed.textContent = TEXT; showSaid(); } });
  let raf = 0;
  function run() {
    cancelAnimationFrame(raf); btn.textContent = T("demo_running"); btn.disabled = true; running = true;
    win.style.visibility = "hidden"; said.replaceChildren(); typed.replaceChildren();
    const caret = document.createElement("span"); caret.className = "caret";
    const tnode = document.createTextNode(""); typed.append(tnode, caret);
    const listen = document.createElement("span"); listen.className = "listen";
    listen.append(Object.assign(document.createElement("span"), { className: "dot" }), document.createTextNode(T("demo_listening")));
    said.append(listen);
    const start = performance.now();
    function step(now) {
      const sim = Math.min(KEY, ((now - start) / 1000) * KEY / REAL);
      tk.textContent = fmt(sim);
      tnode.data = TEXT.slice(0, Math.round(TEXT.length * sim / KEY));
      tv.textContent = fmt(Math.min(sim, VOICE));
      if (sim >= VOICE && said.firstChild === listen) showSaid();
      if (sim < KEY) raf = requestAnimationFrame(step);
      else { caret.remove(); win.style.visibility = "visible"; btn.disabled = false; btn.textContent = T("demo_again"); running = false; }
    }
    raf = requestAnimationFrame(step);
  }
  btn.addEventListener("click", run);
  if (!reduce && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) { io.disconnect(); run(); } }, { threshold: 0.5 });
    io.observe($("demo-box"));
  }
})();

// ---------- скачивание и статистика (GitHub) ----------
const REL = "https://github.com/S1mple-Denis/voxlocal-releases/releases/latest/download/";
const DL_WIN = REL + "VoxLocal-setup.exe";
let rel = null;
function fmtDate(iso) { try { return new Date(iso).toLocaleDateString(LOC[LANG], { day: "numeric", month: "long" }); } catch (e) { return ""; } }
function fmtNum(n) { try { return n.toLocaleString(LOC[LANG]); } catch (e) { return String(n); } }
function applyDl() {
  const v = rel ? T("ver", { v: rel.v }) : "";
  const w = $("dl-win"); w.href = DL_WIN; w.target = "_blank"; w.rel = "noopener"; w.removeAttribute("aria-disabled"); w.textContent = T("dl_btn");
  $("win-sub").textContent = T("win_sub") + v;
  const mac = $("dl-mac"); mac.href = "#download"; mac.setAttribute("aria-disabled", "true"); mac.textContent = T("dl_soon");
  $("mac-sub").textContent = T("mac_wait");
  const hero = $("dl-hero"); hero.href = DL_WIN; hero.target = "_blank"; hero.rel = "noopener"; hero.textContent = T("hero_win");
  if (LANG === "ru") {  // подписи плиток (на случай старой разметки index.html)
    const lbl = { st1g_s: "установщик и portable с сайта", st2g: "автообновлений", st2g_s: "программа сама скачала новую версию" };
    for (const k in lbl) { const e = document.querySelector('[data-i="' + k + '"]'); if (e) e.textContent = lbl[k]; }
  }
  if (rel) {
    $("st-dl").textContent = fmtNum(rel.dl);
    $("st-runs").textContent = fmtNum(rel.upd);
    $("st-ver").textContent = rel.v;
    $("st-ver-sub").textContent = rel.at ? T("ver_from", { d: fmtDate(rel.at) }) : "";
  }
}
langHooks.push(applyDl);
setLang(LANG, false);
fetch("https://api.github.com/repos/S1mple-Denis/voxlocal-releases/releases?per_page=100")
  .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
  .then((list) => {
    let dl = 0, upd = 0;
    for (const r of list) for (const a of r.assets || []) {
      // скачали люди: постоянные ссылки сайта (VoxLocal-setup.exe, VoxLocal-portable.zip);
      // VoxLocal_<версия>_x64-setup.exe скачивает сама программа при автообновлении
      if (/^VoxLocal-(setup\.exe|portable\.zip)$/i.test(a.name)) dl += a.download_count;
      else if (/^VoxLocal_.+_x64-setup\.exe$/i.test(a.name)) upd += a.download_count;
    }
    const last = list.find((r) => !r.draft && !r.prerelease);
    rel = { dl, upd, v: last ? last.tag_name.replace(/^v/, "") : "—", at: last ? last.published_at : null };
    applyDl();
  })
  .catch(() => {});
