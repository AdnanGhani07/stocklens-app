"use client";
import React, {useMemo, useRef, useState} from "react";
import {toast} from "sonner";
import {addToWatchlist, removeFromWatchlist} from "@/lib/actions/watchlist.actions";

// Minimal WatchlistButton implementation to satisfy page requirements.
// This component focuses on UI contract only. It toggles the local state and
// calls onWatchlistChange if provided. Styling hooks match globals.css.

const WatchlistButton = ({
                             symbol,
                             company,
                             isInWatchlist,
                             showTrashIcon = false,
                             type = "button",
                             onWatchlistChange,
                         }: WatchlistButtonProps) => {
    const [added, setAdded] = useState<boolean>(!!isInWatchlist);

    const label = useMemo(() => {
        if (type === "icon") return added ? "" : "";
        return added ? "Remove from Watchlist" : "Add to Watchlist";
    }, [added, type]);

    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    const handleClick = async (e?: React.MouseEvent<HTMLButtonElement>) => {
        e?.preventDefault();
        e?.stopPropagation();

        const next = !added;
        setAdded(next); // optimistic
        onWatchlistChange?.(symbol, next);

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            try {
                if (next) {
                    const res = await addToWatchlist(symbol, company);
                    if (!res.ok) throw new Error(res.error);
                    toast.success(`${symbol} added to watchlist`);
                } else {
                    const res = await removeFromWatchlist(symbol);
                    if (!res.ok) throw new Error(res.error);
                    toast.success(`${symbol} removed from watchlist`);
                }
            } catch (err: any) {
                // revert on error
                setAdded(!next);
                onWatchlistChange?.(symbol, !next);
                toast.error(err?.message || 'Action failed');
            }
        }, 300);
    };

    if (type === "icon") {
        return (
            <button
                type="button"
                title={added ? `Remove ${symbol} from watchlist` : `Add ${symbol} to watchlist`}
                aria-label={added ? `Remove ${symbol} from watchlist` : `Add ${symbol} to watchlist`}
                aria-pressed={added}
                className={`watchlist-icon-btn ${added ? "watchlist-icon-added" : ""}`}
                onClick={handleClick}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill={added ? "#FACC15" : "none"}
                    stroke="#FACC15"
                    strokeWidth="1.5"
                    className="watchlist-star"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.385a.563.563 0 00-.182-.557L3.04 10.385a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345l2.125-5.111z"
                    />
                </svg>
            </button>
        );
    }

    return (
        <button type="button" className={`watchlist-btn ${added ? "watchlist-remove" : ""}`} onClick={handleClick}>
            <span className="flex w-full items-center justify-center gap-2">
                {showTrashIcon && added ? (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5"
                        aria-hidden="true"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round"
                              d="M6 7h12M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-7 4v6m4-6v6m4-6v6"/>
                    </svg>
                ) : null}
                <span className="whitespace-nowrap">{label}</span>
            </span>
        </button>
    );
};

export default WatchlistButton;