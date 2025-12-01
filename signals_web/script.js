let port, reader;
const MAX_POINTS = 150;

const colors = {
    primary: '#2C5AA0',
    secondary: '#4CAF50', 
    accent: '#FF9800',
    grid: '#E2E8F0',
    text: '#2D3748'
};

const charts = {
    main: createChart('mainChart', 'Основной сигнал', colors.primary),
    random: createChart('randomChart', 'Случайный сигнал', colors.accent),
    combined: createChart('combinedChart', 'Результирующий сигнал', colors.secondary),
    comparison: createComparisonChart('comparisonChart')
};

function createChart(canvasId, label, color) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: label,
                data: [],
                borderColor: color,
                backgroundColor: color + '20',
                tension: 0.4,
                fill: false,
                pointBackgroundColor: color,
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 3,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#FFFFFF',
                    titleColor: colors.text,
                    bodyColor: colors.text,
                    borderColor: colors.grid,
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y.toFixed(3)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    min: -6,
                    max: 6,
                    grid: {
                        color: colors.grid
                    },
                    ticks: {
                        color: colors.text
                    }
                },
                x: {
                    display: false
                }
            }
        }
    });
}

function createComparisonChart(canvasId) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Основной',
                    data: [],
                    borderColor: colors.primary,
                    tension: 0.4,
                    pointBackgroundColor: colors.primary,
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 2,
                    pointHoverRadius: 5
                },
                {
                    label: 'Случайный',
                    data: [],
                    borderColor: colors.accent,
                    tension: 0.4,
                    pointBackgroundColor: colors.accent,
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 2,
                    pointHoverRadius: 5
                },
                {
                    label: 'Результирующий',
                    data: [],
                    borderColor: colors.secondary,
                    tension: 0.4,
                    pointBackgroundColor: colors.secondary,
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 2,
                    pointHoverRadius: 5
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                tooltip: {
                    backgroundColor: '#FFFFFF',
                    titleColor: colors.text,
                    bodyColor: colors.text,
                    borderColor: colors.grid,
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y.toFixed(3)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    min: -6,
                    max: 6,
                    grid: {
                        color: colors.grid
                    },
                    ticks: {
                        color: colors.text
                    }
                },
                x: {
                    display: false
                }
            }
        }
    });
}

function addLog(message, type = '') {
    const logContainer = document.getElementById('logContainer');
    const timestamp = new Date().toLocaleTimeString();
    
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    logEntry.innerHTML = `
        <span class="log-time">${timestamp}</span>
        <span class="log-message">${message}</span>
    `;
    
    logContainer.appendChild(logEntry);
    
    logContainer.scrollTop = logContainer.scrollHeight;
}

function processData(line) {
    console.log("Received:", line); 
    
    if (line.startsWith('SIG:')) {
        const data = line.substring(4).split(',');
        if (data.length === 5) {
            const [main, random, combined, amplitude, extra] = data.map(parseFloat);
            const timestamp = new Date().toLocaleTimeString();
            
            updateCharts(timestamp, main, random, combined);
        }
    } 
    else if (line.includes('SIGNAL_START')) {
        if (line.includes('RAND')) addLog('Запуск генерации случайного сигнала', 'success');
        else addLog('Запуск генерации основного сигнала', 'success');
    } 
    else if (line.includes('SIGNAL_STOP')) {
        if (line.includes('RAND')) addLog('Остановка генерации случайного сигнала', 'info');
        else addLog('Остановка генерации основного сигнала', 'info');
    } 
    else if (line.includes('AMPLITUDE_CHANGED')) {
        const amplitude = line.split(':')[1];
        addLog(`Изменение амплитуды: уровень ${amplitude}`, 'warning');
    }
    else if (line.length > 0) {
        addLog(line, 'info');
    }
}

function updateCharts(time, main, random, combined) {
    updateChart(charts.main, time, main);
    updateChart(charts.random, time, random);
    updateChart(charts.combined, time, combined);
    updateComparisonChart(time, main, random, combined);
}

function updateChart(chart, time, value) {
    chart.data.labels.push(time);
    chart.data.datasets[0].data.push(value);
    
    if (chart.data.labels.length > MAX_POINTS) {
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
    }
    
    chart.update('none');
}

function updateComparisonChart(time, main, random, combined) {
    const chart = charts.comparison;
    chart.data.labels.push(time);
    chart.data.datasets[0].data.push(main);
    chart.data.datasets[1].data.push(random);
    chart.data.datasets[2].data.push(combined);
    
    if (chart.data.labels.length > MAX_POINTS) {
        chart.data.labels.shift();
        chart.data.datasets.forEach(dataset => dataset.data.shift());
    }
    
    chart.update('none');
}

document.getElementById('connectBtn').addEventListener('click', async () => {
    try {
        if (port && port.readable) {
            await reader.cancel();
            await port.close();
            updateStatus('disconnected');
            document.getElementById('connectBtn').textContent = 'Подключить';
            return;
        }
        
        updateStatus('connecting');
        port = await navigator.serial.requestPort();
        await port.open({ baudRate: 115200 });
        updateStatus('connected');
        document.getElementById('connectBtn').textContent = 'Отключить';
        readSerialData();
        
    } catch (error) {
        updateStatus('disconnected');
    }
});

function updateStatus(status) {
    const indicator = document.getElementById('statusIndicator');
    const text = document.getElementById('statusText');
    
    indicator.className = 'status-indicator';
    text.textContent = status === 'connected' ? 'Подключено' : 
                      status === 'connecting' ? 'Подключение...' : 'Не подключено';
    
    if (status === 'connected') indicator.classList.add('connected');
    if (status === 'connecting') indicator.classList.add('connecting');
}

async function readSerialData() {
    try {
        reader = port.readable.getReader();
        let buffer = '';
        
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            
            buffer += new TextDecoder().decode(value);
            const lines = buffer.split('\n');
            
            for (let i = 0; i < lines.length - 1; i++) {
                const line = lines[i].trim();
                if (line) {
                    processData(line);
                }
            }
            
            buffer = lines[lines.length - 1];
        }
    } catch (error) {
        updateStatus('disconnected');
    }
}

document.getElementById('clearBtn').addEventListener('click', () => {
    Object.values(charts).forEach(chart => {
        chart.data.labels = [];
        chart.data.datasets.forEach(dataset => dataset.data = []);
        chart.update();
    });
});

document.getElementById('clearLogsBtn')?.addEventListener('click', () => {
    document.getElementById('logContainer').innerHTML = '';
});

addLog('Система анализа сигналов готова к работе');