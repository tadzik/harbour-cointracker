declare module LocalStorage {
    function openDatabaseSync(dbname: string, dbver: string,
        dbdesc: string, dbsize: number,
        dbconfig: Function) : Database;
}

declare interface Database {
    transaction(func: Function);
    changeVersion(v1: string, v2: string);
}

class Cointracker {
    dbh: Database
    symbol_map: any
    coin_update_cb: Function = () => {}

    constructor() {
        this.dbh = LocalStorage.openDatabaseSync(
            "cointrackerdb", "0.1", "database of cryptocoin prices", 1000, this.dbconfig
        )
    }

    dbconfig(db: Database) : void {
        db.transaction((tx) => {
            tx.executeSql('CREATE TABLE IF NOT EXISTS prices(symbol VARCHAR(8), price_usd REAL, update_time INTEGER)')
            tx.executeSql('CREATE TABLE IF NOT EXISTS coins(symbol VARCHAR(8), cmc_id VARCHAR(16), tracked INTEGER)')
            tx.executeSql('INSERT INTO coins VALUES ("ADA",   "cardano",      0)')
            tx.executeSql('INSERT INTO coins VALUES ("BTC",   "bitcoin",      1)')
            tx.executeSql('INSERT INTO coins VALUES ("BCH",   "bitcoin-cash", 0)')
            tx.executeSql('INSERT INTO coins VALUES ("DASH",  "dash",         0)')
            tx.executeSql('INSERT INTO coins VALUES ("DOGE",  "dogecoin",     0)')
            tx.executeSql('INSERT INTO coins VALUES ("ENJ",   "enjin-coin",   0)')
            tx.executeSql('INSERT INTO coins VALUES ("ETH",   "ethereum",     0)')
            tx.executeSql('INSERT INTO coins VALUES ("MIOTA", "iota",         0)')
            tx.executeSql('INSERT INTO coins VALUES ("LTC",   "litecoin",     0)')
            tx.executeSql('INSERT INTO coins VALUES ("POLL",  "ClearPoll",    0)')
            tx.executeSql('INSERT INTO coins VALUES ("XEM",   "nem",          0)')
            tx.executeSql('INSERT INTO coins VALUES ("XMR",   "monero",       0)')
            tx.executeSql('INSERT INTO coins VALUES ("XRP",   "ripple",       0)')
        })
        db.changeVersion("", "0.1")
    }

    update_coins() : void {
        this.dbh.transaction((tx) => {
            var rs = tx.executeSql('SELECT cmc_id FROM coins WHERE tracked = 1')
            for (var i = 0; i < rs.rows.length; i++) {
                this.update_coin(rs.rows.item(i).cmc_id)
            }
        })
    }

    update_coin(cmc_id: string) : void {
        var req = new XMLHttpRequest()
        req.onreadystatechange = () => {
            if (req.readyState == XMLHttpRequest.DONE) {
                this.resp_handler(JSON.parse(req.responseText))
            }
        }
        var url = "https://api.coinmarketcap.com/v1/ticker/" + cmc_id + "/"
        req.open("GET", url)
        req.send()
    }

    resp_handler(resp: any) : void {
        var symbol       = resp[0].symbol
        var price_usd    = resp[0].price_usd
        var last_updated = resp[0].last_updated

        this.dbh.transaction((tx) => {
            var rs = tx.executeSql('SELECT update_time FROM prices WHERE symbol = ? ORDER BY update_time DESC LIMIT 1', [symbol])
            if (rs.rows.length == 0 || (rs.rows.item(0).update_time < last_updated)) {
                tx.executeSql('INSERT INTO prices VALUES (?, ?, ?)', [symbol, price_usd, last_updated])
            }
        })
        this.coin_update_cb()
    }

    get_coin_data() : any {
        var coins = []
        this.dbh.transaction((tx) => {
            var rs = tx.executeSql('select c.symbol, c.cmc_id, p.price_usd \
                                   from prices p \
                                   join coins c on c.symbol = p.symbol \
                                   where c.tracked = 1 \
                                   group by p.symbol \
                                   order by p.symbol, update_time desc \
                                   ')
            for (var i = 0; i < rs.rows.length; i++) {
                var row = rs.rows.item(i)
                coins.push({ symbol: row.symbol, cmc_id: row.cmc_id, price_usd: row.price_usd })
            }
        })
        return coins
    }

    get_coins() : any[] {
        var coins = []
        this.dbh.transaction((tx) => {
            var rs = tx.executeSql('SELECT * FROM coins')
            coins = rs.rows
        })
        return coins
    }

    set_coin_tracking(symbol, tracked) : void {
        this.dbh.transaction((tx) => {
            tx.executeSql('UPDATE coins SET tracked = ? WHERE symbol = ?', [tracked, symbol])
        })
    }
}
