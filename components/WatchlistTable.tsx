"use client";

import WatchlistButton from "@/components/WatchlistButton";
import React, {useMemo, useState} from "react";

const headers = [
    {key: "company", label: "Company"},
    {key: "symbol", label: "Symbol"},
    {key: "priceFormatted", label: "Price"},
    {key: "changeFormatted", label: "Change"},
    {key: "marketCap", label: "Market Cap"},
    {key: "peRatio", label: "P/E"},
    {key: "actions", label: ""},
] as const;

export default function WatchlistTable({watchlist}: WatchlistTableProps) {
    const [rows, setRows] = useState<StockWithData[]>(watchlist || []);

    const empty = useMemo(() => !rows || rows.length === 0, [rows]);

    if (empty) return null;

    return (
        <div className="w-full overflow-x-auto">
            <table className="min-w-full text-left text-sm">
                <thead className="border-b border-gray-800 text-gray-400">
                <tr>
                    {headers.map((h) => (
                        <th key={h.key as string} className="px-4 py-3 font-medium">{h.label}</th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {rows.map((row) => (
                    <tr key={row.symbol} className="border-b border-gray-900/40 hover:bg-gray-900/30">
                        <td className="px-4 py-3 text-gray-200">{row.company}</td>
                        <td className="px-4 py-3 text-gray-300">{row.symbol}</td>
                        <td className="px-4 py-3">{row.priceFormatted ?? "—"}</td>
                        <td className={`px-4 py-3 ${Number(row.changePercent) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{row.changeFormatted ?? "—"}</td>
                        <td className="px-4 py-3">{row.marketCap ?? "—"}</td>
                        <td className="px-4 py-3">{row.peRatio ?? "—"}</td>
                        <td className="px-4 py-3 text-right">
                            <WatchlistButton
                                symbol={row.symbol}
                                company={row.company}
                                isInWatchlist={true}
                                showTrashIcon
                                onWatchlistChange={(sym, isAdded) => {
                                    if (!isAdded) setRows((prev) => (prev || []).filter((r) => r.symbol !== sym));
                                }}
                            />
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}
