import QtQuick 2.0
import QtQuick.LocalStorage 2.0
import "harbour-cointracker.js" as Cointracker

Item {
    id: me
    property var cointracker

    Component.onCompleted: {
        me.cointracker = new Cointracker.Cointracker()
    }
}
