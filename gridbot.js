
const url = "wss://stream.data.alpaca.markets/v1beta1/crypto";
const socket = new WebSocket(url);

const API_KEY = "YOUR_API_KEY";
const SECRET_KEY = "YOUR_SECRET_KEY";

const auth = {"action": "auth", "key": API_KEY, "secret": SECRET_KEY};
const subscribe = {"action":"subscribe","trades":["ETHUSD"],"quotes":["ETHUSD"],"bars":["ETHUSD"]};

const quotesElement = document.getElementById('quotes');
const tradesElement = document.getElementById('trades');

let currentBar = {};
let trades = [];

const futureTime = 20;

var chart = LightweightCharts.createChart(document.getElementById('chart'), { 
    width: 600, height: 600, 
    crosshair: {
		mode: LightweightCharts.CrosshairMode.Normal,
	},
    layout: {
		backgroundColor: '#000000',
		textColor: '#ffffff',
	},
	grid: {
		vertLines: {
			color: '#404040',
		},
		horzLines: {
			color: '#404040',
		},
	},	
	priceScale: {
		borderColor: '#cccccc',
	},
	timeScale: {
		borderColor: '#cccccc',
		timeVisible: true,
	},
});
var candleSeries = chart.addCandlestickSeries();
var lineSeries = chart.addLineSeries();

var start = new Date(Date.now() - (7200 * 1000)).toISOString();
console.log(start);

var bars_url = 'https://data.alpaca.markets/v1beta1/crypto/ETHUSD/bars?exchanges=CBSE&timeframe=1Min&start=' + start;

fetch(bars_url, {
    headers: {
        'APCA-API-KEY-ID': API_KEY,
        'APCA-API-SECRET-KEY': SECRET_KEY
    }
}).then((r) => r.json())
    .then((response) => {
        console.log(response);

        const data = response.bars.map(bar => (
            {
                open: bar.o,
                high: bar.h,
                low: bar.l,
                close: bar.c,
                time: Date.parse(bar.t) / 1000
            
            }
        ));

        currentBar = data[data.length - 1];        
        console.log(data);
        
        //time in latest bar
        const t = currentBar.time;
        
        var testLine = [
            {
                time: t,
                value: 1960
            },
            {
                time: t +60,
            
            },
            {
                time: t+60*2,
                
            },
            {
                time: t+60*3,
               
            },
            {
                time: t + 60 * 4,
                value: 1966   
            }
        ];
        

        console.log(testLine);       
        candleSeries.setData(data);
               
        var lineSeriesTest = chart.addLineSeries();
        var testLine2 = [];

        function myCrosshairMoveHandler(param) {
            if (!param.point) {
                return;
            }        
            console.log(`Crosshair moved to ${param.point.x}, ${param.point.y}. The time is ${param.time}.`);
            testLine2.push({
                time: param.time,
                value: candleSeries.coordinateToPrice(param.point.y)
            })
            lineSeriesTest.setData(testLine2);
            console.log(lineSeriesTest.coordinateToPrice(param.point.y));
        }
        
        chart.subscribeClick(myCrosshairMoveHandler);
    })



socket.onmessage = function(event){
    const data = JSON.parse(event.data);
    const message = data[0]["msg"];
    
    if (message == 'connected'){
        console.log("do authentication");
        socket.send(JSON.stringify(auth));
    }

    if (message == 'authenticated'){
        socket.send(JSON.stringify(subscribe));
    }

    for (var key in data){       
        const type = data[key].T;

        if(type == "q"){           
            const quoteElement = document.createElement('div');
            quoteElement.className = 'quote';
            quoteElement.innerHTML = `<b>${data[key].t}</b> ${data[key].bp} ${data[key].ap}`;
            quotesElement.appendChild(quoteElement);    

            var elements = document.getElementsByClassName('quote');
            if (elements.length > 10) {
                quotesElement.removeChild(elements[0]);
            }            
        }

        if(type == "t"){
            const tradeElement = document.createElement('div');
            tradeElement.className = 'trade';
            tradeElement.innerHTML = `<b>${data[key].t}</b> ${data[key].p} ${data[key].s}`;
            tradesElement.appendChild(tradeElement);    

            var elements = document.getElementsByClassName('trade');
            if (elements.length > 10) {
                tradesElement.removeChild(elements[0]);
            }

            trades.push(data[key].p);

            var open = trades[0];
            var high = Math.max(...trades);
            var low = Math.min(...trades);
            var close = trades[trades.length - 1];
    
            candleSeries.update({
                time: currentBar.time + 60,
                open: open,
                high: high,
                low: low,
                close: close
            })           
        }


        if (type == "b" && data[key].x == 'CBSE') {
            console.log(data[key]);
            
            var bar = data[key];
            var timestamp = new Date(bar.t).getTime() / 1000;
            
            currentBar = {
                time: timestamp,
                open: bar.o,
                high: bar.h,
                low: bar.l,
                close: bar.c            
            }

            candleSeries.update(currentBar);
            
            trades = [];
        }
    }
}