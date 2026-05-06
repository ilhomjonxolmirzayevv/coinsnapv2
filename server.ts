import { Telegraf, Markup, Context } from 'telegraf';
import axios from 'axios';
import * as math from 'mathjs';
import dotenv from 'dotenv';
import express from 'express';

dotenv.config();

// --- Interfeyslar ---
interface RateState {
    uzs: number;
    rub: number;
    last_updated: string | null;
}

// --- Konfiguratsiya ---
const API_TOKEN = process.env.API_TOKEN || "8639007484:AAGvFLNJiQqkF2Kc5jQ_DM6td4lMM-wMxfg";
const PORT = process.env.PORT || 5000;
const bot = new Telegraf(API_TOKEN);

const state: RateState = {
    uzs: 12800.0,
    rub: 95.0,
    last_updated: null
};

// --- Yordamchi Funksiyalar ---

// Fiat kurslarini yangilash (har 10 daqiqada)
async function updateFiatRates() {
    const url = "https://api.exchangerate-api.com/v4/latest/USD";
    try {
        const resp = await axios.get(url);
        state.uzs = resp.data.rates.UZS;
        state.rub = resp.data.rates.RUB;
        state.last_updated = new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
        console.log(`Fiat rates updated: UZS=${state.uzs}, RUB=${state.rub}`);
    } catch (e) {
        console.warn("Fiat update failed:", e);
    }
}
setInterval(updateFiatRates, 600000);
updateFiatRates();

// Bitget dan narxni olish
async function getBitgetPrice(symbol: string) {
    const url = `https://api.bitget.com/api/v2/spot/market/tickers?symbol=${symbol.toUpperCase()}USDT`;
    try {
        const resp = await axios.get(url);
        const res = resp.data;
        if (res.code === '00000' && res.data && res.data.length > 0) {
            const ticker = res.data[0];
            return {
                price: parseFloat(ticker.lastPr),
                change: parseFloat(ticker.change24h) * 100
            };
        }
    } catch (e) {
        console.warn(`Bitget error [${symbol}]:`, e);
    }
    return null;
}

// Qiymatni formatlash
function fmt(value: number, symbol: string = ""): string {
    const s = symbol.toUpperCase();
    if (s === "UZS" || s === "RUB") {
        return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
    } else if (s === "USD") {
        return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else {
        let formatted = value.toFixed(8).replace(/\.?0+$/, "");
        if (formatted.includes(".")) {
            const [intPart, decPart] = formatted.split(".");
            return `${parseInt(intPart).toLocaleString()}.${decPart}`;
        }
        return parseInt(formatted).toLocaleString();
    }
}

// Matematik natijani formatlash
function fmtResult(value: number): string {
    if (value === Math.floor(value) && Math.abs(value) < 1e15) {
        return value.toLocaleString();
    }
    return fmt(value);
}

// USD qiymatini boshqa valyutalarga o'tkazish
async function getExtras(usdVal: number, exclude: string = ""): Promise<string> {
    const exc = exclude.toUpperCase();
    const tonData = await getBitgetPrice('TON');
    const btcData = await getBitgetPrice('BTC');
    const tonP = tonData?.price || 1;
    const btcP = btcData?.price || 1;

    const lines = [];
    if (exc !== "UZS") lines.push(`🇺🇿 \`${fmt(usdVal * state.uzs, 'UZS')} UZS\``);
    if (exc !== "USD") lines.push(`🇺🇸 \`$${fmt(usdVal, 'USD')} USD\``);
    if (exc !== "RUB") lines.push(`🇷🇺 \`${fmt(usdVal * state.rub, 'RUB')} RUB\``);
    if (exc !== "TON") lines.push(`💎 \`${fmt(usdVal / tonP, 'TON')} TON\``);
    if (exc !== "BTC") lines.push(`₿ \`${fmt(usdVal / btcP, 'BTC')} BTC\``);
    return lines.join("\n");
}

async function getVal(s: string): Promise<number | null> {
    const sym = s.toUpperCase();
    if (sym === "USD") return 1.0;
    if (sym === "UZS") return 1 / state.uzs;
    if (sym === "RUB") return 1 / state.rub;
    const d = await getBitgetPrice(sym);
    return d ? d.price : null;
}

// --- Bot Matnlari ---
const WELCOME_TEXT = `👋 **CoinSnap ga xush kelibsiz!**\n\nMen real vaqt kriptovalyuta va valyuta konvertori botman...`;
const HELP_TEXT = `📖 **CoinSnap — To'liq qo'llanma**\n\n...`;

// --- Bot Handlerlari ---

bot.start((ctx) => ctx.replyWithMarkdown(WELCOME_TEXT));
bot.help((ctx) => ctx.replyWithMarkdown(HELP_TEXT));

bot.command('coins', async (ctx) => {
    const listCoins = ["BTC", "ETH", "TON", "SOL", "NOT"];
    let resText = "📊 **Jonli Narxlar:**\n\n";
    for (const c of listCoins) {
        const data = await getBitgetPrice(c);
        if (data) {
            const arrow = data.change >= 0 ? "🟢" : "🔴";
            resText += `${arrow} **${c}**: \`$${fmt(data.price, 'USD')}\` (${data.change >= 0 ? '+' : ''}${data.change.toFixed(2)}%)\n`;
        }
    }
    await ctx.replyWithMarkdown(resText);
});

bot.on('text', async (ctx) => {
    const text = ctx.message.text.toLowerCase().replace(/,/g, '.').trim();

    if (text === 'coins') {
        return ctx.chat && bot.handleUpdate({ ...ctx.update, message: { ...ctx.message, text: '/coins' } } as any);
    }

    const num_p = "(\\d+(?:\\.\\d+)?)";
    const sym_p = "([a-z][a-z0-9]*)";

    // Regexlar
    const re_com = new RegExp(`^${num_p}\\s+${sym_p}\\s+com\\s+${num_p}$`);
    const re_uzs = new RegExp(`^${num_p}\\s+uzs\\s+${sym_p}$`);
    const re_pair = new RegExp(`^${num_p}\\s+${sym_p}\\s+${sym_p}$`);
    const re_single = new RegExp(`^${num_p}\\s+${sym_p}$`);
    
    // Matematika regexi
    const math_pattern = /^([\d\s\+\-\*\/\(\)\.]+)\s+([a-z][a-z0-9]*)$/;
    const pure_math_pattern = /^[\d\s\+\-\*\/\(\)\.]+$/;
    const has_op = /[\+\-\*\/]/;

    let resText = "";
    let usdVal = 0;
    let excludeSym = "";

    // 1. Math + Symbol: "10-7 ton"
    const m_math_sym = text.match(math_pattern);
    if (m_math_sym && has_op.test(m_math_sym[1])) {
        try {
            const calc = math.evaluate(m_math_sym[1]);
            const symbol = m_math_sym[2].toUpperCase();
            const val = await getVal(symbol);
            if (val !== null) {
                const totalUsd = calc * val;
                const extras = await getExtras(totalUsd, symbol);
                return ctx.replyWithMarkdown(`🔢 \`${m_math_sym[1].trim()} = ${fmtResult(calc)} ${symbol}\`\n\n🪙 **${fmtResult(calc)} ${symbol}**\n\n${extras}`, 
                    Markup.inlineKeyboard([Markup.button.callback("🗑 O'chirish", `del_${ctx.from.id}`)]));
            }
        } catch (e) {}
    }

    // 2. Komissiya: "0.005 btc com 1"
    const m_com = text.match(re_com);
    if (m_com) {
        const amount = parseFloat(m_com[1]);
        const symbol = m_com[2].toUpperCase();
        const perc = parseFloat(m_com[3]);
        const result = amount - (amount * perc / 100);
        const rate = await getVal(symbol);
        const extras = await getExtras(result * (rate || 0), symbol);
        resText = `⚖️ **Komissiya: ${perc}%**\n\n✅ **Qoladi: \`${fmt(result, symbol)} ${symbol}\`**\n\n${extras}`;
        excludeSym = symbol;
    } 
    // 3. UZS -> Kripto
    else if (text.match(re_uzs)) {
        const m = text.match(re_uzs)!;
        const uzsAmount = parseFloat(m[1]);
        const symbol = m[2].toUpperCase();
        const price = await getVal(symbol);
        if (price) {
            const amountUsd = uzsAmount / state.uzs;
            const extras = await getExtras(amountUsd, symbol);
            resText = `💰 **${fmt(uzsAmount, 'UZS')} UZS** ➡️ **${symbol}**\n\n🪙 \`${fmt(amountUsd / price, symbol)} ${symbol}\`\n\n${extras}`;
        }
    }
    // 4. Juftlik yoki Yakkalik
    else if (text.match(re_pair) || text.match(re_single)) {
        const m = text.match(re_pair) || text.match(re_single)!;
        const amount = parseFloat(m[1]);
        const fSym = m[2].toUpperCase();
        const tSym = m[3]?.toUpperCase() || "USD";
        
        const vFrom = await getVal(fSym);
        const vTo = await getVal(tSym);

        if (vFrom && vTo) {
            const totalUsd = amount * vFrom;
            const final = totalUsd / vTo;
            const extras = await getExtras(totalUsd, tSym === "USD" ? fSym : tSym);
            resText = tSym === "USD" 
                ? `🪙 **${fmt(amount, fSym)} ${fSym}**\n\n${extras}`
                : `🔄 **${fmt(amount, fSym)} ${fSym}** ➡️ **${tSym}**\n\n🪙 \`${fmt(final, tSym)} ${tSym}\`\n\n${extras}`;
        }
    }

    if (resText) {
        await ctx.replyWithMarkdown(resText, Markup.inlineKeyboard([
            Markup.button.callback("🗑 O'chirish", `del_${ctx.from.id}`)
        ]));
    }
});

// O'chirish tugmasi uchun
bot.action(/del_(\d+)/, async (ctx) => {
    const ownerId = ctx.match[1];
    if (ctx.from.id.toString() === ownerId) {
        await ctx.deleteMessage();
    } else {
        await ctx.answerCbQuery("Faqat egasi o'chira oladi!", { show_alert: true });
    }
});

// --- Express Keep-Alive Server ---
const app = express();
app.get('/', (req, res) => res.send('Bot is running!'));
app.listen(PORT, () => console.log(`Keep-alive server on port ${PORT}`));

// --- Botni ishga tushirish ---
bot.launch();
console.log("Bot started...");

// To'xtatish signallari
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));