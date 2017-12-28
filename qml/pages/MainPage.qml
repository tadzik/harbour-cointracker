/*
  Copyright (C) 2013 Jolla Ltd.
  Contact: Thomas Perl <thomas.perl@jollamobile.com>
  All rights reserved.

  You may use this file under the terms of BSD license as follows:

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:
    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of the Jolla Ltd nor the
      names of its contributors may be used to endorse or promote products
      derived from this software without specific prior written permission.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
  ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
  DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDERS OR CONTRIBUTORS BE LIABLE FOR
  ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
  SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

import QtQuick 2.0
import Sailfish.Silica 1.0


Page {
    id: page
    allowedOrientations: Orientation.All

    SilicaFlickable {
        anchors.fill: parent
        contentHeight: column.height

        PullDownMenu {
            MenuItem {
                text: qsTr("Settings")
                onClicked: pageStack.push(Qt.resolvedUrl("SettingsPage.qml"))
            }
            MenuItem {
                text: qsTr("Refresh")
                onClicked: {
                    trigger_update()
                }
            }
        }

        Column {
            id: column
            anchors.fill: parent

            PageHeader {
                id: header
                title: qsTr("Cointracker")
            }

            SilicaListView {
                id: listview
                width: parent.width

                model: ListModel {
                    id: coinListModel
                }

                delegate: BackgroundItem {
                    x: Theme.horizontalPageMargin
                    width: parent.width - Theme.horizontalPageMargin
                    height: Theme.itemSizeSmall

                    Label {
                        text: symbol
                        font.pixelSize: Theme.fontSizeHuge
                        anchors.left: parent.left
                        anchors.verticalCenter: parent.verticalCenter
                    }

                    Label {
                        text: fullname
                        font.pixelSize: Theme.fontSizeSmall
                        x: parent.width / 4
                        anchors.verticalCenter: parent.verticalCenter
                    }

                    Label {
                        text: "$" + price_usd
                        font.pixelSize: Theme.fontSizeLarge
                        x: parent.width * 7/10
                        anchors.verticalCenter: parent.verticalCenter
                    }
                }
            }

            ProgressBar {
                id: progressbar
                width: parent.width
                label: "Updating " + value + "/" + maximumValue
                visible: true
            }
        }
    }


    function update_view() {
        var coins = app.cointracker.get_coin_data()
        coinListModel.clear()
        for (var i = 0; i < coins.length; i++) {
            coinListModel.append({
                symbol:    coins[i].symbol,
                fullname:  coins[i].cmc_id,
                price_usd: coins[i].price_usd,
            })
        }
        listview.height = coins.length * Theme.itemSizeSmall

        progressbar.value = app.cointracker.requests_completed
        if (app.cointracker.requests_completed === app.cointracker.requests_total) {
            progressbar.visible = false
        }
    }

    function trigger_update() {
        app.cointracker.update_coins()
        progressbar.visible = true
        progressbar.maximumValue = app.cointracker.requests_total
        progressbar.value = app.cointracker.requests_completed
    }

    Component.onCompleted: {
        app.cointracker.coin_update_cb = update_view
        trigger_update()
    }
}
