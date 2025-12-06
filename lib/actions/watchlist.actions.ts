'use server';

import {connectToDatabase} from '@/database/mongoose';
import {Watchlist} from '@/database/models/watchlist.model';
import {headers} from 'next/headers';
import {revalidatePath, revalidateTag} from 'next/cache';
import {auth} from '@/lib/better-auth/auth';
import {fetchJSON} from '@/lib/actions/finnhub.actions';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const NEXT_PUBLIC_FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? '';

export async function getWatchlistSymbolsByEmail(email: string): Promise<string[]> {
    if (!email) return [];

    try {
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;
        if (!db) throw new Error('MongoDB connection not found');

        // Better Auth stores users in the "user" collection
        const user = await db.collection('user').findOne<{ _id?: unknown; id?: string; email?: string }>({email});

        if (!user) return [];

        const userId = (user.id as string) || String(user._id || '');
        if (!userId) return [];

        const items = await Watchlist.find({userId}, {symbol: 1}).lean();
        return items.map((i) => String(i.symbol));
    } catch (err) {
        console.error('getWatchlistSymbolsByEmail error:', err);
        return [];
    }
}

type ActionResult = { ok: true } | { ok: false; error: string };

export async function addToWatchlist(symbol: string, company: string): Promise<ActionResult> {
    try {
        const session = await auth.api.getSession({headers: await headers()});
        if (!session) return {ok: false, error: 'Not authenticated'};

        const userId = session.user.id;
        const sym = (symbol || '').trim().toUpperCase();
        const comp = (company || '').trim();
        if (!sym || !comp) return {ok: false, error: 'Invalid payload'};

        await connectToDatabase();

        await Watchlist.updateOne(
            {userId, symbol: sym},
            {$setOnInsert: {userId, symbol: sym, company: comp, addedAt: new Date()}},
            {upsert: true}
        );

        revalidatePath('/watchlist');
        revalidateTag('watchlist', `${userId}`);
        return {ok: true};
    } catch (e: any) {
        const msg = e?.code === 11000 ? 'Already in watchlist' : 'Failed to add to watchlist';
        console.error('addToWatchlist error:', e);
        return {ok: false, error: msg};
    }
}

export async function removeFromWatchlist(symbol: string): Promise<ActionResult> {
    try {
        const session = await auth.api.getSession({headers: await headers()});
        if (!session) return {ok: false, error: 'Not authenticated'};

        const userId = session.user.id;
        const sym = (symbol || '').trim().toUpperCase();
        if (!sym) return {ok: false, error: 'Invalid payload'};

        await connectToDatabase();
        await Watchlist.deleteOne({userId, symbol: sym});

        revalidatePath('/watchlist');
        revalidateTag('watchlist', `${userId}`);
        return {ok: true};
    } catch (e) {
        console.error('removeFromWatchlist error:', e);
        return {ok: false, error: 'Failed to remove from watchlist'};
    }
}

export async function getUserWatchlist(): Promise<{
    userId: string;
    items: { symbol: string; company: string; addedAt: Date }[]
} | null> {
    try {
        const session = await auth.api.getSession({headers: await headers()});
        if (!session) return null;
        const userId = session.user.id;

        await connectToDatabase();
        const items = await Watchlist.find({userId}).lean();
        return {
            userId,
            items: (items || []).map((i) => ({
                symbol: String(i.symbol),
                company: String(i.company),
                addedAt: i.addedAt as Date
            })),
        };
    } catch (e) {
        console.error('getUserWatchlist error:', e);
        return null;
    }
}

export async function getWatchlistWithData(): Promise<StockWithData[]> {
    try {
        const session = await auth.api.getSession({headers: await headers()});
        if (!session) return [];
        const userId = session.user.id;

        await connectToDatabase();
        const items = await Watchlist.find({userId}).lean();
        if (!items || items.length === 0) return [];

        const token = process.env.FINNHUB_API_KEY ?? NEXT_PUBLIC_FINNHUB_API_KEY;
        if (!token) {
            console.error('getWatchlistWithData: FINNHUB API key not configured');
            // Return items without enrichment
            return items.map((i) => ({
                userId,
                symbol: String(i.symbol).toUpperCase(),
                company: String(i.company),
                addedAt: i.addedAt as Date,
            } as StockWithData));
        }
        const result: StockWithData[] = await Promise.all(
            items.map(async (i) => {
                const sym = String(i.symbol).toUpperCase();
                try {
                    const [quote, profile, metrics] = await Promise.all([
                        fetchJSON<QuoteData>(`${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(sym)}&token=${token}`, 60),
                        fetchJSON<ProfileData>(`${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(sym)}&token=${token}`, 3600),
                        fetchJSON<FinancialsData>(`${FINNHUB_BASE_URL}/stock/metric?symbol=${encodeURIComponent(sym)}&metric=all&token=${token}`, 3600),
                    ]);

                    const price = quote?.c ?? undefined;
                    const changePct = quote?.dp ?? undefined;
                    const marketCapRaw = profile?.marketCapitalization ?? undefined;
                    const peRaw = metrics?.metric ? (metrics.metric["peExclExtraTTM"] ?? metrics.metric["peTTM"] ?? metrics.metric["trailingPE"] ?? undefined) : undefined;

                    const formatCurrency = (v?: number) => (typeof v === 'number' ? `$${v.toFixed(2)}` : undefined);
                    const formatPercent = (v?: number) => (typeof v === 'number' ? `${v.toFixed(2)}%` : undefined);
                    const formatBillions = (v?: number) => {
                        if (typeof v !== 'number') return undefined;
                        if (v >= 1_000) return `$${(v / 1000).toFixed(2)}T`;
                        return `$${v.toFixed(2)}B`;
                    };

                    return {
                        userId,
                        symbol: sym,
                        company: String(i.company),
                        addedAt: i.addedAt as Date,
                        currentPrice: price,
                        changePercent: changePct,
                        priceFormatted: formatCurrency(price),
                        changeFormatted: formatPercent(changePct),
                        marketCap: formatBillions(marketCapRaw),
                        peRatio: typeof peRaw === 'number' ? peRaw.toFixed(2) : undefined,
                    } as StockWithData;
                } catch (e) {
                    console.error('getWatchlistWithData item error:', sym, e);
                    return {
                        userId,
                        symbol: sym,
                        company: String(i.company),
                        addedAt: i.addedAt as Date,
                    } as StockWithData;
                }
            })
        );

        return result;
    } catch (e) {
        console.error('getWatchlistWithData error:', e);
        return [];
    }
}