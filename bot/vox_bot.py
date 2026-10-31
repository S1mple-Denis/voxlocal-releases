#!/usr/bin/env python3
"""VoxLocal Telegram-бот.

Что делает:
  • /start — приветствие, ссылки на скачивание (установщик и portable), канал.
  • Pro бесплатно за подписку: проверяет, что пользователь подписан на канал,
    и выдаёт код активации. Код подписан ключом Ed25519 — программа проверяет
    его сама, без интернета и без нашего сервера.
  • Приглашения: ссылка t.me/<бот>?start=ref_<id> — бот запоминает, кто кого привёл.
  • Обмен словарями: пришлите боту файл .txt — бот даст ссылку
    t.me/<бот>?start=dict_<код>; по ней коллега получит файл.
  • /stats — сводка для администраторов; /myid — узнать свой Telegram ID.
  • Отзывы: любое обычное сообщение (текст, скриншот, голосовое) пересылается
    администраторам; ссылка с сайта — t.me/<бот>?start=feedback.
  • Анонимная статистика программы: приёмник POST /v1/ping (раз в день от каждой
    установки: случайный номер, версия, число диктовок и секунд по дням) и
    GET /v1/public (активные за день/неделю/месяц — для сайта). Слушает
    VOXBOT_STATS_ADDR (по умолчанию 127.0.0.1:8787), снаружи — через Caddy (HTTPS).
    Сводка — в /stats и каждое утро администраторам (VOXBOT_DIGEST_HOUR, Киев).

Зависимости: только cryptography (pip install cryptography). Сам бот работает
через long polling; HTTPS нужен только приёмнику статистики (Caddy впереди).

Настройки — переменные окружения (файл .env рядом):
  VOXBOT_TOKEN    токен от @BotFather (обязательно)
  VOXBOT_CHANNEL  канал, на который нужна подписка (по умолчанию @voxlocal)
  VOXBOT_ADMINS   Telegram ID администраторов через запятую (для /stats)
  VOXBOT_DATA     папка для базы и ключа (по умолчанию рядом с ботом)

Первый запуск: python vox_bot.py --genkey — создаёт ключ подписи и печатает
открытый ключ, который встраивается в программу VoxLocal.
"""

import base64
import json
import logging
import os
import secrets
import sqlite3
import struct
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import re
import threading
from datetime import date, datetime, timedelta, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from logging.handlers import RotatingFileHandler
from zoneinfo import ZoneInfo

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.environ.get("VOXBOT_DATA") or HERE
KEY_PATH = os.path.join(DATA, "pro_signing.key")
DB_PATH = os.path.join(DATA, "voxbot.sqlite3")
CHANNEL = os.environ.get("VOXBOT_CHANNEL", "@voxlocal")
ADMINS = {int(x) for x in os.environ.get("VOXBOT_ADMINS", "").replace(" ", "").split(",") if x}
DL_SETUP = "https://github.com/S1mple-Denis/voxlocal-releases/releases/latest/download/VoxLocal-setup.exe"
DL_PORTABLE = "https://github.com/S1mple-Denis/voxlocal-releases/releases/latest/download/VoxLocal-portable.zip"
MAX_DICT_BYTES = 2 * 1024 * 1024
CODE_PREFIX = "VOX1-"
EPOCH = date(2026, 1, 1)
STATS_ADDR = os.environ.get("VOXBOT_STATS_ADDR", "127.0.0.1:8787")
DIGEST_HOUR = int(os.environ.get("VOXBOT_DIGEST_HOUR", "9"))
KYIV = ZoneInfo("Europe/Kyiv")

log = logging.getLogger("voxbot")


# ---------------------------------------------------------------- тексты (ru / uk / en)

T = {
    "welcome": {
        "ru": "👋 Это VoxLocal — голосовой ввод для Windows. Говорите — текст появляется там, где курсор: Claude, ChatGPT, почта, мессенджеры, 1С через удалённый рабочий стол.\n\nРаботает без интернета, ничего не уходит в облако.\n\n⬇️ Скачать:\n• Установщик: {setup}\n• Без установки (portable ZIP): {portable}\n\n⭐ Pro — бесплатно за подписку на {channel}: свои словари с фамилиями и терминами, словарь компании, обмен словарями с коллегами.",
        "uk": "👋 Це VoxLocal — голосове введення для Windows. Говоріть — текст з’являється там, де курсор: Claude, ChatGPT, пошта, месенджери, 1С через віддалений робочий стіл.\n\nПрацює без інтернету, нічого не йде в хмару.\n\n⬇️ Завантажити:\n• Інсталятор: {setup}\n• Без встановлення (portable ZIP): {portable}\n\n⭐ Pro — безкоштовно за підписку на {channel}: власні словники з прізвищами й термінами, словник компанії, обмін словниками з колегами.",
        "en": "👋 This is VoxLocal — voice typing for Windows. Speak and the text appears where your cursor is: Claude, ChatGPT, email, messengers, 1C over Remote Desktop.\n\nWorks offline, nothing goes to the cloud.\n\n⬇️ Download:\n• Installer: {setup}\n• No install (portable ZIP): {portable}\n\n⭐ Pro is free when you subscribe to {channel}: your own dictionaries with names and terms, a company dictionary, sharing dictionaries with colleagues.",
    },
    "btn_pro": {"ru": "⭐ Получить код Pro", "uk": "⭐ Отримати код Pro", "en": "⭐ Get a Pro code"},
    "btn_channel": {"ru": "📣 Подписаться на канал", "uk": "📣 Підписатися на канал", "en": "📣 Subscribe to the channel"},
    "btn_check": {"ru": "✅ Я подписался — проверить", "uk": "✅ Я підписався — перевірити", "en": "✅ I’ve subscribed — check"},
    "btn_invite": {"ru": "👥 Пригласить коллегу", "uk": "👥 Запросити колегу", "en": "👥 Invite a colleague"},
    "need_sub": {
        "ru": "Чтобы получить Pro бесплатно, подпишитесь на канал {channel} и нажмите «Проверить».",
        "uk": "Щоб отримати Pro безкоштовно, підпишіться на канал {channel} і натисніть «Перевірити».",
        "en": "To get Pro for free, subscribe to {channel} and tap “Check”.",
    },
    "code": {
        "ru": "Спасибо за подписку! Ваш код Pro:\n\n<code>{code}</code>\n\nСкопируйте его и вставьте в VoxLocal: Настройки → VoxLocal Pro → «Активировать».",
        "uk": "Дякуємо за підписку! Ваш код Pro:\n\n<code>{code}</code>\n\nСкопіюйте його та вставте у VoxLocal: Налаштування → VoxLocal Pro → «Активувати».",
        "en": "Thanks for subscribing! Your Pro code:\n\n<code>{code}</code>\n\nCopy it into VoxLocal: Settings → VoxLocal Pro → “Activate”.",
    },
    "check_failed": {
        "ru": "Пока не вижу подписки на {channel}. Подпишитесь и нажмите «Проверить» ещё раз.",
        "uk": "Поки не бачу підписки на {channel}. Підпишіться й натисніть «Перевірити» ще раз.",
        "en": "I can’t see your subscription to {channel} yet. Subscribe and tap “Check” again.",
    },
    "invite": {
        "ru": "Перешлите коллеге это сообщение 👇\n\nПопробуй VoxLocal — диктуешь, а текст появляется там, где курсор, без интернета. Pro бесплатно: {link}",
        "uk": "Перешліть колезі це повідомлення 👇\n\nСпробуй VoxLocal — диктуєш, а текст з’являється там, де курсор, без інтернету. Pro безкоштовно: {link}",
        "en": "Forward this to a colleague 👇\n\nTry VoxLocal — you speak, the text appears where your cursor is, offline. Pro is free: {link}",
    },
    "share_hint": {
        "ru": "Пришлите сюда файл словаря (.txt). В VoxLocal: Настройки → Мои словари → «Поделиться словарём» — файл уже подготовлен.",
        "uk": "Надішліть сюди файл словника (.txt). У VoxLocal: Налаштування → Мої словники → «Поділитися словником» — файл уже підготовлено.",
        "en": "Send me the dictionary file (.txt). In VoxLocal: Settings → My dictionaries → “Share dictionary” prepares it for you.",
    },
    "shared": {
        "ru": "Готово! Ссылка на словарь «{name}»:\n{link}\n\nПерешлите её коллегам — по ссылке бот пришлёт им файл.",
        "uk": "Готово! Посилання на словник «{name}»:\n{link}\n\nПерешліть його колегам — за посиланням бот надішле їм файл.",
        "en": "Done! Link to the dictionary “{name}”:\n{link}\n\nForward it to colleagues — the bot will send them the file.",
    },
    "dict_caption": {
        "ru": "Словарь VoxLocal. Подключить: VoxLocal → Настройки → Мои словари → «Импорт словаря» и выберите этот файл.",
        "uk": "Словник VoxLocal. Підключити: VoxLocal → Налаштування → Мої словники → «Імпорт словника» і виберіть цей файл.",
        "en": "VoxLocal dictionary. To use it: VoxLocal → Settings → My dictionaries → “Import dictionary” and pick this file.",
    },
    "dict_missing": {"ru": "Словарь по этой ссылке не найден.", "uk": "Словник за цим посиланням не знайдено.", "en": "No dictionary found for this link."},
    "fb_prompt": {
        "ru": "Напишите отзыв одним сообщением: что получилось, где программа ошиблась, идея или термин для словаря. Можно приложить скриншот или голосовое.",
        "uk": "Напишіть відгук одним повідомленням: що вийшло, де програма помилилася, ідея чи термін для словника. Можна додати скриншот або голосове.",
        "en": "Send your feedback in one message: what worked, where the app got it wrong, an idea or a dictionary term. Screenshots and voice notes are welcome.",
    },
    "fb_thanks": {
        "ru": "Спасибо! Передал Денису — полезные идеи попадут в ближайшие обновления.",
        "uk": "Дякуємо! Передав Денису — корисні ідеї потраплять у найближчі оновлення.",
        "en": "Thank you! Passed on to Denys — useful ideas go into the next updates.",
    },
    "bad_file": {
        "ru": "Нужен текстовый файл словаря .txt размером до 2 МБ.",
        "uk": "Потрібен текстовий файл словника .txt розміром до 2 МБ.",
        "en": "Please send a .txt dictionary file up to 2 MB.",
    },
}


def lang_of(user):
    code = (user or {}).get("language_code") or ""
    if code.startswith("uk"):
        return "uk"
    if code.startswith("ru") or code.startswith("be") or code.startswith("kk"):
        return "ru"
    return "en"


def tr(key, lang, **kw):
    s = T[key].get(lang) or T[key]["ru"]
    return s.format(**kw) if kw else s


# ---------------------------------------------------------------- коды Pro (Ed25519)

def load_key():
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
    with open(KEY_PATH, "rb") as f:
        return Ed25519PrivateKey.from_private_bytes(base64.b64decode(f.read().strip()))


def public_key_b64(key):
    from cryptography.hazmat.primitives import serialization
    raw = key.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
    return base64.b64encode(raw).decode()


def genkey():
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
    from cryptography.hazmat.primitives import serialization
    if os.path.exists(KEY_PATH):
        print("Ключ уже есть:", KEY_PATH)
        key = load_key()
    else:
        key = Ed25519PrivateKey.generate()
        raw = key.private_bytes(serialization.Encoding.Raw, serialization.PrivateFormat.Raw,
                                serialization.NoEncryption())
        os.makedirs(DATA, exist_ok=True)
        fd = os.open(KEY_PATH, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(fd, "wb") as f:
            f.write(base64.b64encode(raw))
        print("Создан ключ подписи:", KEY_PATH, "(никому не передавать)")
    print("Открытый ключ для программы VoxLocal:")
    print(public_key_b64(key))


def make_code(key, tg_id):
    """VOX1-<base64url(payload + подпись)>; payload = версия(1) | tg_id(8) | день выдачи(2)."""
    day = (date.today() - EPOCH).days
    payload = struct.pack(">BQH", 1, tg_id, max(0, min(day, 65535)))
    sig = key.sign(b"VOXPRO" + payload)
    return CODE_PREFIX + base64.urlsafe_b64encode(payload + sig).decode().rstrip("=")


def verify_code(pub_b64, code):
    """Та же проверка, что в программе (для тестов)."""
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
    body = code.strip()[len(CODE_PREFIX):]
    raw = base64.urlsafe_b64decode(body + "=" * (-len(body) % 4))
    payload, sig = raw[:11], raw[11:]
    Ed25519PublicKey.from_public_bytes(base64.b64decode(pub_b64)).verify(sig, b"VOXPRO" + payload)
    return struct.unpack(">BQH", payload)


# ---------------------------------------------------------------- база

def db():
    con = sqlite3.connect(DB_PATH)
    con.execute("""CREATE TABLE IF NOT EXISTS users(
        tg_id INTEGER PRIMARY KEY, username TEXT, name TEXT, lang TEXT,
        first_seen TEXT, last_seen TEXT, ref_by INTEGER, pro_at TEXT)""")
    con.execute("""CREATE TABLE IF NOT EXISTS dicts(
        id TEXT PRIMARY KEY, owner INTEGER, file_id TEXT, name TEXT, size INTEGER,
        created TEXT, opens INTEGER DEFAULT 0)""")
    con.execute("""CREATE TABLE IF NOT EXISTS events(
        ts TEXT, tg_id INTEGER, kind TEXT, data TEXT)""")
    # анонимная статистика программы: установки и их дни с диктовками
    con.execute("""CREATE TABLE IF NOT EXISTS installs(
        id TEXT PRIMARY KEY, first_seen TEXT, last_seen TEXT, v TEXT, ed TEXT, os TEXT, since TEXT)""")
    con.execute("""CREATE TABLE IF NOT EXISTS usage(
        id TEXT, day TEXT, n INTEGER, s INTEGER, PRIMARY KEY(id, day))""")
    con.commit()
    return con


def now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def touch_user(con, user, ref_by=None):
    uid = user["id"]
    row = con.execute("SELECT ref_by FROM users WHERE tg_id=?", (uid,)).fetchone()
    name = " ".join(x for x in (user.get("first_name"), user.get("last_name")) if x)
    if row is None:
        con.execute("INSERT INTO users(tg_id, username, name, lang, first_seen, last_seen, ref_by) VALUES(?,?,?,?,?,?,?)",
                    (uid, user.get("username"), name, lang_of(user), now(), now(),
                     ref_by if ref_by and ref_by != uid else None))
    else:
        con.execute("UPDATE users SET username=?, name=?, lang=?, last_seen=? WHERE tg_id=?",
                    (user.get("username"), name, lang_of(user), now(), uid))
    con.commit()


def event(con, uid, kind, data=""):
    con.execute("INSERT INTO events VALUES(?,?,?,?)", (now(), uid, kind, data))
    con.commit()


# ---------------------------------------------------------------- статистика программы

ID_RE = re.compile(r"^[0-9a-f]{24}$")
DAY_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
SHORT = lambda x: str(x)[:20] if isinstance(x, (str, int, float)) else ""


def save_ping(con, data):
    """Принять отметку от программы. Возвращает False, если данные не похожи на VoxLocal."""
    pid = data.get("id")
    days = data.get("days")
    if not isinstance(pid, str) or not ID_RE.match(pid) or not isinstance(days, dict):
        return False
    today = datetime.now(KYIV).date()
    ok_days = []
    for d, c in list(days.items())[:40]:
        if not isinstance(d, str) or not DAY_RE.match(d) or not isinstance(c, dict):
            continue
        try:
            dd = date.fromisoformat(d)
            n, sec = int(c.get("n", 0)), int(c.get("s", 0))
        except (ValueError, TypeError):
            continue
        if abs((today - dd).days) > 31 or not (0 < n <= 5000) or not (0 <= sec <= 86400):
            continue
        ok_days.append((d, n, sec))
    t = now()
    row = con.execute("SELECT id FROM installs WHERE id=?", (pid,)).fetchone()
    vals = (SHORT(data.get("v")), SHORT(data.get("ed")), SHORT(data.get("os")), SHORT(data.get("since")))
    if row is None:
        con.execute("INSERT INTO installs VALUES(?,?,?,?,?,?,?)", (pid, t, t) + vals)
    else:
        con.execute("UPDATE installs SET last_seen=?, v=?, ed=?, os=?, since=? WHERE id=?", (t,) + vals + (pid,))
    for d, n, sec in ok_days:   # день мог прийти частично — берём максимум
        con.execute("""INSERT INTO usage VALUES(?,?,?,?) ON CONFLICT(id, day)
                       DO UPDATE SET n=max(n, excluded.n), s=max(s, excluded.s)""", (pid, d, n, sec))
    con.commit()
    return True


def active(con, days, upto=None):
    upto = upto or datetime.now(KYIV).date()
    start = (upto - timedelta(days=days - 1)).isoformat()
    return con.execute("SELECT count(DISTINCT id) FROM usage WHERE day BETWEEN ? AND ?",
                       (start, upto.isoformat())).fetchone()[0]


def public_stats(con):
    today = datetime.now(KYIV).date()
    return {"dau": active(con, 1, today - timedelta(days=1)), "wau": active(con, 7), "mau": active(con, 30),
            "installs": con.execute("SELECT count(*) FROM installs").fetchone()[0],
            "updated": now()}


def usage_report(con):
    today = datetime.now(KYIV).date()
    y = (today - timedelta(days=1)).isoformat()
    q = lambda sql, *a: con.execute(sql, a).fetchone()
    n_y, s_y = q("SELECT COALESCE(sum(n),0), COALESCE(sum(s),0) FROM usage WHERE day=?", y)
    dau_y = active(con, 1, today - timedelta(days=1))
    wau, mau = active(con, 7), active(con, 30)
    installs = q("SELECT count(*) FROM installs")[0]
    new7 = q("SELECT count(*) FROM installs WHERE first_seen >= ?", (datetime.now(timezone.utc) - timedelta(days=7)).isoformat(timespec="seconds"))[0]
    # удержание: из тех, кто начал 7–30 дней назад, сколько диктовали за последние 7 дней
    old = [r[0] for r in con.execute("SELECT id FROM installs WHERE first_seen BETWEEN ? AND ?",
                                      ((datetime.now(timezone.utc) - timedelta(days=30)).isoformat(timespec="seconds"),
                                       (datetime.now(timezone.utc) - timedelta(days=7)).isoformat(timespec="seconds")))]
    kept = 0
    if old:
        start = (today - timedelta(days=6)).isoformat()
        kept = sum(1 for i in old if con.execute("SELECT 1 FROM usage WHERE id=? AND day>=?", (i, start)).fetchone())
    vers = con.execute("""SELECT v, count(*) FROM installs WHERE id IN
                          (SELECT DISTINCT id FROM usage WHERE day >= ?) GROUP BY v ORDER BY v DESC LIMIT 5""",
                       ((today - timedelta(days=6)).isoformat(),)).fetchall()
    lines = ["📊 Программа (анонимно)",
             f"Вчера диктовали: {dau_y} чел., диктовок {n_y}, ~{round(s_y / 60)} мин"
             + (f" (в среднем {round(n_y / dau_y)} на человека)" if dau_y else ""),
             f"Активных за 7 дней: {wau}, за 30 дней: {mau}",
             f"Установок всего: {installs}, новых за 7 дней: {new7}"]
    if old:
        lines.append(f"Удержание: из начавших 7–30 дней назад пользуются {kept} из {len(old)} ({round(100 * kept / len(old))}%)")
    if vers:
        lines.append("Версии у активных: " + ", ".join(f"{v or '?'} — {c}" for v, c in vers))
    return "\n".join(lines)


class StatsHandler(BaseHTTPRequestHandler):
    server_version = "VoxLocalStats"

    def log_message(self, fmt, *args):
        pass

    def _reply(self, code, body=b"", ctype="application/json"):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        if self.path.split("?")[0] != "/v1/public":
            return self._reply(404)
        con = sqlite3.connect(DB_PATH, timeout=10)
        try:
            self._reply(200, json.dumps(public_stats(con)).encode())
        finally:
            con.close()

    def do_POST(self):
        if self.path != "/v1/ping":
            return self._reply(404)
        size = int(self.headers.get("Content-Length") or 0)
        if not 0 < size <= 8192:
            return self._reply(413)
        try:
            data = json.loads(self.rfile.read(size).decode())
        except Exception:
            return self._reply(400)
        con = sqlite3.connect(DB_PATH, timeout=10)
        try:
            ok = isinstance(data, dict) and save_ping(con, data)
        except Exception:
            log.exception("приём статистики")
            ok = False
        finally:
            con.close()
        self._reply(200 if ok else 400, b'{"ok":true}' if ok else b'{"ok":false}')


def start_stats_server():
    host, _, port = STATS_ADDR.rpartition(":")
    srv = ThreadingHTTPServer((host or "127.0.0.1", int(port)), StatsHandler)
    threading.Thread(target=srv.serve_forever, name="stats", daemon=True).start()
    log.info("приём статистики: http://%s", STATS_ADDR)


def maybe_digest(bot, con, state={"day": None}):
    """Утренняя сводка администраторам (раз в день, после DIGEST_HOUR по Киеву)."""
    t = datetime.now(KYIV)
    if t.hour < DIGEST_HOUR or state["day"] == t.date():
        return
    state["day"] = t.date()
    done = con.execute("SELECT 1 FROM events WHERE kind='digest' AND data=?", (t.date().isoformat(),)).fetchone()
    if done:
        return
    event(con, 0, "digest", t.date().isoformat())
    for admin in ADMINS:
        try:
            bot.send(admin, usage_report(con))
        except Exception as e:
            log.warning("сводка %s: %s", admin, e)


# ---------------------------------------------------------------- Telegram API

class Bot:
    def __init__(self, token):
        self.base = f"https://api.telegram.org/bot{token}/"
        self.username = None

    def call(self, method, **params):
        body = json.dumps({k: v for k, v in params.items() if v is not None}).encode()
        req = urllib.request.Request(self.base + method, data=body,
                                     headers={"Content-Type": "application/json"})
        timeout = params.get("timeout", 0) + 15
        with urllib.request.urlopen(req, timeout=timeout) as r:
            res = json.loads(r.read().decode())
        if not res.get("ok"):
            raise RuntimeError(f"{method}: {res}")
        return res["result"]

    def send(self, chat_id, text, buttons=None, html=False):
        markup = {"inline_keyboard": buttons} if buttons else None
        return self.call("sendMessage", chat_id=chat_id, text=text, reply_markup=markup,
                         parse_mode="HTML" if html else None, disable_web_page_preview=True)


def channel_url():
    return "https://t.me/" + CHANNEL.lstrip("@")


def is_subscribed(bot, uid):
    try:
        m = bot.call("getChatMember", chat_id=CHANNEL, user_id=uid)
    except Exception as e:  # бот не админ канала, сеть и т. п.
        log.warning("getChatMember %s: %s", uid, e)
        return False
    return m.get("status") in ("member", "administrator", "creator", "restricted")


def main_buttons(lang):
    return [[{"text": tr("btn_pro", lang), "callback_data": "pro"}],
            [{"text": tr("btn_channel", lang), "url": channel_url()}],
            [{"text": tr("btn_invite", lang), "callback_data": "invite"}]]


# ---------------------------------------------------------------- обработчики

def give_pro(bot, con, key, user, chat_id):
    lang = lang_of(user)
    if is_subscribed(bot, user["id"]):
        code = make_code(key, user["id"])
        con.execute("UPDATE users SET pro_at=COALESCE(pro_at, ?) WHERE tg_id=?", (now(), user["id"]))
        con.commit()
        event(con, user["id"], "pro_code")
        bot.send(chat_id, tr("code", lang, code=code), html=True)
        return True
    bot.send(chat_id, tr("need_sub", lang, channel=CHANNEL),
             buttons=[[{"text": tr("btn_channel", lang), "url": channel_url()}],
                      [{"text": tr("btn_check", lang), "callback_data": "check"}]])
    return False


def send_invite(bot, user, chat_id):
    link = f"https://t.me/{bot.username}?start=ref_{user['id']}"
    bot.send(chat_id, tr("invite", lang_of(user), link=link))


def on_start(bot, con, key, msg, arg):
    user, chat_id = msg["from"], msg["chat"]["id"]
    lang = lang_of(user)
    ref = None
    if arg.startswith("ref_") and arg[4:].isdigit():
        ref = int(arg[4:])
    touch_user(con, user, ref_by=ref)
    event(con, user["id"], "start", arg)
    if arg.startswith("dict_"):
        row = con.execute("SELECT file_id, name FROM dicts WHERE id=?", (arg[5:],)).fetchone()
        if not row:
            bot.send(chat_id, tr("dict_missing", lang))
        else:
            con.execute("UPDATE dicts SET opens=opens+1 WHERE id=?", (arg[5:],))
            con.commit()
            bot.call("sendDocument", chat_id=chat_id, document=row[0], caption=tr("dict_caption", lang))
    if arg in ("pro", "activate"):
        give_pro(bot, con, key, user, chat_id)
        return
    if arg == "share":
        bot.send(chat_id, tr("share_hint", lang))
        return
    if arg == "invite":
        send_invite(bot, user, chat_id)
        return
    if arg == "feedback":
        bot.send(chat_id, tr("fb_prompt", lang))
        return
    bot.send(chat_id, tr("welcome", lang, setup=DL_SETUP, portable=DL_PORTABLE, channel=CHANNEL),
             buttons=main_buttons(lang))


def on_feedback(bot, con, msg):
    """Отзыв (текст, скриншот, голосовое) — администраторам."""
    user, chat_id = msg["from"], msg["chat"]["id"]
    touch_user(con, user)
    event(con, user["id"], "feedback", (msg.get("text") or msg.get("caption") or "")[:500])
    who = " ".join(x for x in (user.get("first_name"), user.get("last_name")) if x) or "без имени"
    if user.get("username"):
        who += " @" + user["username"]
    for admin in ADMINS:
        try:
            bot.send(admin, f"💬 Отзыв о VoxLocal от {who} (id {user['id']}):")
            bot.call("forwardMessage", chat_id=admin, from_chat_id=chat_id, message_id=msg["message_id"])
        except Exception as e:
            log.warning("отзыв администратору %s: %s", admin, e)
    bot.send(chat_id, tr("fb_thanks", lang_of(user)))


def on_document(bot, con, msg):
    user, chat_id, doc = msg["from"], msg["chat"]["id"], msg["document"]
    lang = lang_of(user)
    touch_user(con, user)
    name = doc.get("file_name") or "dictionary.txt"
    if not name.lower().endswith(".txt") or doc.get("file_size", 0) > MAX_DICT_BYTES:
        on_feedback(bot, con, msg)   # не словарь — скорее всего, файл к отзыву
        return
    did = secrets.token_urlsafe(6).replace("-", "x").replace("_", "y")
    con.execute("INSERT INTO dicts(id, owner, file_id, name, size, created) VALUES(?,?,?,?,?,?)",
                (did, user["id"], doc["file_id"], name, doc.get("file_size", 0), now()))
    con.commit()
    event(con, user["id"], "dict_shared", did)
    bot.send(chat_id, tr("shared", lang, name=name, link=f"https://t.me/{bot.username}?start=dict_{did}"))


FB_COUNT = "SELECT count(*) FROM events WHERE kind='feedback'"
NEW7 = "SELECT count(*) FROM users WHERE first_seen >= strftime('%Y-%m-%dT%H:%M:%S', 'now', '-7 days')"


def on_stats(bot, con, msg):
    if msg["from"]["id"] not in ADMINS:
        return
    q = lambda sql: con.execute(sql).fetchone()[0]
    text = (f"Пользователей: {q('SELECT count(*) FROM users')}\n"
            f"С кодом Pro: {q('SELECT count(*) FROM users WHERE pro_at IS NOT NULL')}\n"
            f"Пришли по приглашению: {q('SELECT count(*) FROM users WHERE ref_by IS NOT NULL')}\n"
            f"Новых за 7 дней: {q(NEW7)}\n"
            f"Словарей отправлено: {q('SELECT count(*) FROM dicts')}, открыто по ссылкам: {q('SELECT COALESCE(sum(opens),0) FROM dicts')}\n"
            f"Отзывов: {q(FB_COUNT)}")
    top = con.execute("SELECT ref_by, count(*) c FROM users WHERE ref_by IS NOT NULL GROUP BY ref_by ORDER BY c DESC LIMIT 5").fetchall()
    if top:
        names = []
        for rid, c in top:
            r = con.execute("SELECT username, name FROM users WHERE tg_id=?", (rid,)).fetchone()
            names.append(f"{('@' + r[0]) if r and r[0] else (r[1] if r else rid)} — {c}")
        text += "\nЛучшие приглашающие: " + ", ".join(names)
    bot.send(msg["chat"]["id"], text + "\n\n" + usage_report(con))


def handle(bot, con, key, upd):
    if "callback_query" in upd:
        cq = upd["callback_query"]
        user, chat_id = cq["from"], cq["message"]["chat"]["id"]
        touch_user(con, user)
        try:
            bot.call("answerCallbackQuery", callback_query_id=cq["id"])
        except Exception:
            pass
        if cq.get("data") in ("pro", "check"):
            ok = give_pro(bot, con, key, user, chat_id)
            if not ok and cq.get("data") == "check":
                bot.send(chat_id, tr("check_failed", lang_of(user), channel=CHANNEL))
        elif cq.get("data") == "invite":
            send_invite(bot, user, chat_id)
        return
    msg = upd.get("message")
    if not msg or msg.get("chat", {}).get("type") != "private" or "from" not in msg:
        return
    if "document" in msg:
        on_document(bot, con, msg)
        return
    text = (msg.get("text") or "").strip()
    if text.startswith("/start"):
        on_start(bot, con, key, msg, text[6:].strip())
    elif text.startswith("/pro"):
        touch_user(con, msg["from"])
        give_pro(bot, con, key, msg["from"], msg["chat"]["id"])
    elif text.startswith("/stats"):
        on_stats(bot, con, msg)
    elif text.startswith("/myid"):
        bot.send(msg["chat"]["id"], f"Ваш Telegram ID: {msg['from']['id']}")
    elif text.startswith("/feedback"):
        touch_user(con, msg["from"])
        bot.send(msg["chat"]["id"], tr("fb_prompt", lang_of(msg["from"])))
    elif text.startswith("/"):
        on_start(bot, con, key, msg, "")
    elif len(text) >= 3 or any(k in msg for k in ("photo", "voice", "video", "audio", "video_note")):
        on_feedback(bot, con, msg)   # любое обычное сообщение — отзыв
    else:
        on_start(bot, con, key, msg, "")


def main():
    if "--genkey" in sys.argv:
        genkey()
        return
    token = os.environ.get("VOXBOT_TOKEN")
    if not token:
        sys.exit("Нет VOXBOT_TOKEN (файл .env)")
    os.makedirs(DATA, exist_ok=True)
    handler = RotatingFileHandler(os.path.join(DATA, "voxbot.log"), maxBytes=2_000_000, backupCount=3)
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s",
                        handlers=[handler, logging.StreamHandler()])
    key = load_key()
    bot = Bot(token)
    bot.username = bot.call("getMe")["username"]
    con = db()
    log.info("VoxLocal bot @%s запущен, канал %s, открытый ключ %s", bot.username, CHANNEL, public_key_b64(key))
    try:
        start_stats_server()
    except Exception:
        log.exception("приёмник статистики не запущен")
    offset = None
    while True:
        try:
            maybe_digest(bot, con)
        except Exception:
            log.exception("сводка")
        try:
            updates = bot.call("getUpdates", offset=offset, timeout=50,
                               allowed_updates=["message", "callback_query"])
        except Exception as e:
            log.warning("getUpdates: %s", e)
            time.sleep(5)
            continue
        for upd in updates:
            offset = upd["update_id"] + 1
            try:
                handle(bot, con, key, upd)
            except Exception:
                log.exception("ошибка обработки %s", upd.get("update_id"))


if __name__ == "__main__":
    main()
