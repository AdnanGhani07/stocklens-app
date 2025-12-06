import SearchCommand from "@/components/SearchCommand";
import WatchlistTable from "@/components/WatchlistTable";
import {getUserWatchlist, getWatchlistWithData} from "@/lib/actions/watchlist.actions";
import {searchStocks} from "@/lib/actions/finnhub.actions";

export default async function WatchlistPage() {
    const watchlist = await getWatchlistWithData();

    // Prepare initial stocks for the add button/search dialog, with current watchlist awareness
    const userWatchlist = await getUserWatchlist();
    const symbols = userWatchlist?.items?.map((i) => i.symbol) || [];
    const initialStocks = await searchStocks(undefined, symbols);

    const isEmpty = !watchlist || watchlist.length === 0;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-gray-100">Watchlist</h1>
                <SearchCommand
                    renderAs="button"
                    label="Add Stock"
                    initialStocks={initialStocks}
                    watchlistSymbols={initialStocks.map((s) => s.symbol)}
                />
            </div>

            {isEmpty ? (
                <div className="flex flex-col items-center justify-center gap-4 py-16 text-center border border-dashed border-gray-700 rounded-lg">
                    <div className="text-5xl">⭐</div>
                    <h2 className="text-xl font-medium text-gray-200">Your watchlist is empty</h2>
                    <p className="text-gray-400 max-w-md">
                        Use the search to find stocks and click the star icon to add them to your watchlist. Your
                        saved stocks will appear here.
                    </p>
                    <SearchCommand
                        renderAs="button"
                        label="Add your first stock"
                        initialStocks={initialStocks}
                        watchlistSymbols={initialStocks.map((s) => s.symbol)}
                    />
                </div>
            ) : (
                <WatchlistTable watchlist={watchlist}/>
            )}
        </div>
    );
}
