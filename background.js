chrome.alarms.create("fetchDataAlarm", { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "fetchDataAlarm") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tab = tabs[0];
            if (tab && tab.url && tab.id && !tab.url.startsWith('chrome://') && tab.url.startsWith('https://trending.ytuong.me')) {
                // chrome.tabs.reload(tabs[0].id, { bypassCache: true }, function() {
                //     console.log('page reloaded');
                // });
                fetchDataAndPost(tab);
            } else {
                console.warn('Cannot access content of a chrome:// URL');
            }
        });
    }
});

function fetchDataAndPost(tab) {
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: readTableData,
    });
}

function readTableData() {
    // Todo: read today trending.
    try {
        const table = document.querySelector('.min-w-full');
        if (!table) {
            console.error('Table not found!');
            return;
        }

        const tableData = [];
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach((row) => {
            const data = {};
            const cells = row.querySelectorAll('td');
            const words = cells[0].innerText.split('\n');
            // Define the labels in the order corresponding to the data
            let labels = ['keyword', 'competition', 'searchVolume', 'lowTopPageBid', 'highTopPageBid', 'cpc', 'niche'];
            let labeledData = {};
            words.forEach((item, index) => {
                if (index < labels.length) {
                    labeledData[labels[index]] = item;
                }
            });
            data.keyword = labeledData;
            data.score = cells[2].innerText;
            data.country = cells[4].innerText;

            tableData.push(data);
        });

        const spans = document.querySelectorAll('.flex.flex-wrap.items-center.-m-1 button span')
        const todayKeywords = Array.from(spans).map(item => item.innerText?.trim()).filter(item => !!item);

        fetch('https://tts-api.ecomdy.com/api/trending-keywords', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                data: {
                    tableTrending: tableData,
                    todayTrending: todayKeywords
                }
            })
        }).then((postResponse) => {
            console.log({ postResponse });
        }).catch(err => console.log('Post data error', err));
    } catch(error) {
        console.log('Something went wrong on readTableData', error);
    }

}

