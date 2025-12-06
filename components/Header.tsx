import Link from "next/link";
import Image from "next/image";
import NavItems from "@/components/NavItems";
import UserDropdown from "@/components/UserDropdown";
import {searchStocks} from "@/lib/actions/finnhub.actions";
import {getWatchlistSymbolsByEmail} from "@/lib/actions/watchlist.actions";

const Header = async ({user}: { user: User }) => {
    const watchlistSymbols = await getWatchlistSymbolsByEmail(user.email);
    const initialStocks = await searchStocks(undefined, watchlistSymbols);
    return (
        <header className="sticky top-0 header">
            <div className="container header-wrapper">
                <Link href="/">
                    <Image src="/assets/icons/logo.svg" alt="StockLens Logo" width={140} height={32}
                           className="h-8 w-auto cursor-pointer"/>
                </Link>
                <nav className="hidden sm:block">
                    <NavItems initialStocks={initialStocks} watchlistSymbols={watchlistSymbols}/>
                </nav>

                <UserDropdown user={user} initialStocks={initialStocks} watchlistSymbols={watchlistSymbols}/>
            </div>
        </header>
    )
}
export default Header
