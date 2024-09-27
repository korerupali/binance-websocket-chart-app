import './App.css'
import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend,} from 'chart.js';


ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const symbols = {
    ETH: 'ethusdt',
    BNB: 'bnbusdt',
    DOT: 'dotusdt'
};

const intervals = {
    '1min': '1m',
    '3min': '3m',
    '5min': '5m'
};

const BinanceWebSocket = () => {
    const [selectedSymbol, setSelectedSymbol] = useState(symbols.ETH);
    const [selectedInterval, setSelectedInterval] = useState(intervals['1min']);
    const [chartData, setChartData] = useState([]);
    
    useEffect(() => {
        const storedData = JSON.parse(localStorage.getItem(selectedSymbol)) || [];
        if (storedData.length > 0) {
            setChartData(storedData);
        }

        const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${selectedSymbol}@kline_${selectedInterval}`);

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            const candlestick = message.k;
            if (candlestick.x) {
                const newCandle = {
                    time: new Date(candlestick.t).toLocaleTimeString(),
                    open: candlestick.o,
                    high: candlestick.h,
                    low: candlestick.l,
                    close: candlestick.c
                };

                setChartData(prevData => {
                    const updatedData = [...prevData, newCandle];
                    localStorage.setItem(selectedSymbol, JSON.stringify(updatedData)); 
                    return updatedData;
                });
            }
        };

        return () => {
            ws.close();
        };
    }, [selectedSymbol, selectedInterval]);



    const handleSymbolChange = (event) => {
        setSelectedSymbol(symbols[event.target.value]);
        setChartData(JSON.parse(localStorage.getItem(symbols[event.target.value])) || []);
    };

    const handleIntervalChange = (event) => {
        setSelectedInterval(intervals[event.target.value]);
    };

    
    const chartDataset = {
        labels: chartData.map(candle => candle.time),
        datasets: [
            {
                label: 'Close Price',
                data: chartData.map(candle => candle.close),
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: true,
            },
        ],
    };


    const chartOptions = {
        scales: {
            x: {
                type: 'category',
                labels: chartData.map(candle => candle.time),
            },
            y: {
                type: 'linear',
                beginAtZero: true,
            },
        },
    };


    return (
        <>
            <h1>Binance Market Data Overview</h1>

            <select onChange={handleSymbolChange}>
                <option value="ETH">ETH/USDT</option>
                <option value="BNB">BNB/USDT</option>
                <option value="DOT">DOT/USDT</option>
            </select>

            <select onChange={handleIntervalChange}>
                <option value="1min">1 Minute</option>
                <option value="3min">3 Minutes</option>
                <option value="5min">5 Minutes</option>
            </select>

            <Line data={chartDataset} options={chartOptions} />
         </>
    );
};

export default BinanceWebSocket;
