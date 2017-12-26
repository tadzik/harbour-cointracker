var Cointracker = /** @class */ (function () {
    function Cointracker() {
        this.coin_update_cb = function () { };
        this.dbh = LocalStorage.openDatabaseSync("cointrackerdb", "0.1", "database of cryptocoin prices", 1000, this.dbconfig);
    }
    Cointracker.prototype.dbconfig = function (db) {
        db.transaction(function (tx) {
            tx.executeSql('CREATE TABLE IF NOT EXISTS prices(symbol VARCHAR(8), price_usd REAL, update_time INTEGER)');
            tx.executeSql('CREATE TABLE IF NOT EXISTS coins(symbol VARCHAR(8), cmc_id VARCHAR(16), tracked INTEGER)');
            tx.executeSql('INSERT INTO coins VALUES ("BTC",  "bitcoin",      1)');
            tx.executeSql('INSERT INTO coins VALUES ("BCH",  "bitcoin-cash", 0)');
            tx.executeSql('INSERT INTO coins VALUES ("POLL", "ClearPoll",    0)');
            tx.executeSql('INSERT INTO coins VALUES ("ENJ",  "enjin-coin",   0)');
            tx.executeSql('INSERT INTO coins VALUES ("ETH",  "ethereum",     0)');
            tx.executeSql('INSERT INTO coins VALUES ("XRP",  "ripple",       0)');
        });
        db.changeVersion("", "0.1");
    };
    Cointracker.prototype.update_coins = function () {
        var _this = this;
        this.dbh.transaction(function (tx) {
            var rs = tx.executeSql('SELECT cmc_id FROM coins WHERE tracked = 1');
            for (var i = 0; i < rs.rows.length; i++) {
                _this.update_coin(rs.rows.item(i).cmc_id);
            }
        });
    };
    Cointracker.prototype.update_coin = function (cmc_id) {
        var _this = this;
        var req = new XMLHttpRequest();
        req.onreadystatechange = function () {
            if (req.readyState == XMLHttpRequest.DONE) {
                _this.resp_handler(JSON.parse(req.responseText));
            }
        };
        var url = "https://api.coinmarketcap.com/v1/ticker/" + cmc_id + "/";
        req.open("GET", url);
        req.send();
    };
    Cointracker.prototype.resp_handler = function (resp) {
        var symbol = resp[0].symbol;
        var price_usd = resp[0].price_usd;
        var last_updated = resp[0].last_updated;
        this.dbh.transaction(function (tx) {
            var rs = tx.executeSql('SELECT update_time FROM prices WHERE symbol = ? ORDER BY update_time DESC LIMIT 1', [symbol]);
            if (rs.rows.length == 0 || (rs.rows.item(0).update_time < last_updated)) {
                tx.executeSql('INSERT INTO prices VALUES (?, ?, ?)', [symbol, price_usd, last_updated]);
            }
        });
        this.coin_update_cb();
    };
    Cointracker.prototype.get_coin_data = function () {
        var coins = [];
        this.dbh.transaction(function (tx) {
            var rs = tx.executeSql('select c.symbol, c.cmc_id, p.price_usd \
                                   from prices p \
                                   join coins c on c.symbol = p.symbol \
                                   where c.tracked = 1 \
                                   group by p.symbol \
                                   order by p.symbol, update_time desc \
                                   ');
            for (var i = 0; i < rs.rows.length; i++) {
                var row = rs.rows.item(i);
                coins.push({ symbol: row.symbol, cmc_id: row.cmc_id, price_usd: row.price_usd });
            }
        });
        return coins;
    };
    Cointracker.prototype.get_coins = function () {
        var coins = [];
        this.dbh.transaction(function (tx) {
            var rs = tx.executeSql('SELECT * FROM coins');
            coins = rs.rows;
        });
        return coins;
    };
    Cointracker.prototype.set_coin_tracking = function (symbol, tracked) {
        this.dbh.transaction(function (tx) {
            tx.executeSql('UPDATE coins SET tracked = ? WHERE symbol = ?', [tracked, symbol]);
        });
    };
    return Cointracker;
}());
