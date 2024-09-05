document.getElementById('fileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const fileExtension = file.name.split('.').pop().toLowerCase();
        
        if (fileExtension === 'csv') {
            const reader = new FileReader();
            reader.onload = function(e) {
                const data = e.target.result;
                processCSV(data);
            };
            reader.readAsText(file);
        } else if (fileExtension === 'xlsx') {
            const reader = new FileReader();
            reader.onload = function(e) {
                const data = new Uint8Array(e.target.result);
                processXLSX(data);
            };
            reader.readAsArrayBuffer(file);
        }
    }
});

function processCSV(data) {
    const allTextLines = data.split(/\r\n|\n/);
    const headers = allTextLines[0].split(',');
    const lines = [];

    for (let i = 1; i < allTextLines.length; i++) {
        const rowData = allTextLines[i].split(',');
        if (rowData.length === headers.length) {
            const row = {};
            for (let j = 0; j < headers.length; j++) {
                row[headers[j]] = rowData[j];
            }
            lines.push(row);
        }
    }

    generateChartsOrTables(lines, headers, 'CSV Data');
}

function processXLSX(data) {
    const workbook = XLSX.read(data, { type: 'array' });
    const dashboard = document.getElementById('dashboard');
    const reviewContainer = document.getElementById('review-container');
    dashboard.innerHTML = ''; 
    reviewContainer.innerHTML = ''; 

    workbook.SheetNames.forEach(function(sheetName) {
        const sheet = workbook.Sheets[sheetName];
        const sheetData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const headers = sheetData[0];
        const rows = sheetData.slice(1);

        const dataRows = rows.map(row => {
            const rowData = {};
            row.forEach((cell, index) => {
                rowData[headers[index]] = cell;
            });
            return rowData;
        });

        if (sheetName.toLowerCase() === 'review') {
            displayReviewData(rows, headers);
        } else {
            createChartsForSheet(dashboard, dataRows, headers, sheetName);
        }
    });
}

function displayReviewData(rows, headers) {
    const positiveSummary = rows.find(row => row[headers.indexOf('Sentiment')] === 'Positive');
    const negativeSummary = rows.find(row => row[headers.indexOf('Sentiment')] === 'Negative');

    const reviewContainer = document.getElementById('review-container');
    
    const summaryBox = document.createElement('div');
    summaryBox.className = 'review-summary-box';
    summaryBox.innerHTML = `
        <div class="review-summary">
            <h3>Review Summary</h3>
            <p><strong>Positive Review Summary:</strong> ${positiveSummary ? positiveSummary[headers.indexOf('Review')] : 'No positive review summary available.'}</p>
            <p><strong>Negative Review Summary:</strong> ${negativeSummary ? negativeSummary[headers.indexOf('Review')] : 'No negative review summary available.'}</p>
        </div>
        <canvas id="positive-chart"></canvas>
        <canvas id="negative-chart"></canvas>
    `;
    reviewContainer.appendChild(summaryBox);

    createReviewCharts(rows, headers);
}

function createReviewCharts(rows, headers) {
    const positiveReviews = rows.filter(row => row[headers.indexOf('Sentiment')] === 'Positive').length;
    const negativeReviews = rows.filter(row => row[headers.indexOf('Sentiment')] === 'Negative').length;

    const positiveChartCanvas = document.getElementById('positive-chart');
    const negativeChartCanvas = document.getElementById('negative-chart');

    new Chart(positiveChartCanvas, {
        type: 'doughnut',
        data: {
            labels: ['Positive Reviews'],
            datasets: [{
                label: 'Positive Reviews',
                data: [positiveReviews],
                backgroundColor: ['#4E73DF'],
                borderColor: '#fff',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(tooltipItem) {
                            return tooltipItem.label + ': ' + tooltipItem.raw;
                        }
                    }
                }
            }
        }
    });

    new Chart(negativeChartCanvas, {
        type: 'doughnut',
        data: {
            labels: ['Negative Reviews'],
            datasets: [{
                label: 'Negative Reviews',
                data: [negativeReviews],
                backgroundColor: ['#FF6347'],
                borderColor: '#fff',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(tooltipItem) {
                            return tooltipItem.label + ': ' + tooltipItem.raw;
                        }
                    }
                }
            }
        }
    });
}

function createChartsForSheet(container, data, headers, sheetName) {
    headers.forEach((header, index) => {
        if (index === 0) return; // Skip the first header as it's used for labels

        const labels = data.map(row => row[headers[0]]);
        const values = data.map(row => parseFloat(row[header])).filter(value => !isNaN(value));

        if (values.length > 0) {
            const chartContainer = document.createElement('div');
            chartContainer.className = 'chart-container';
            container.appendChild(chartContainer);

            const chartTitle = document.createElement('h3');
            chartTitle.className = 'chart-title';
            chartTitle.textContent = `${sheetName}`;
            chartContainer.appendChild(chartTitle);

            const canvas = document.createElement('canvas');
            chartContainer.appendChild(canvas);

            canvas.width = chartContainer.clientWidth;
            canvas.height = chartContainer.clientHeight;

            if (sheetName.toLowerCase() === 'salary') {
                createLineChart(canvas, labels, values, header);
            } else if (sheetName.toLowerCase() === 'gender diversity') {
                createDonutChart(canvas, labels, values, header, sheetName);
            } else {
                createHorizontalBarChart(canvas, labels, values, header);
            }
        }
    });
}

function createLineChart(canvas, labels, values, header) {
    new Chart(canvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: header,
                data: values,
                borderColor: '#4E73DF',
                backgroundColor: 'rgba(78, 115, 223, 0.2)',
                borderWidth: 2,
                fill: true,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(tooltipItem) {
                            return tooltipItem.label + ': ' + tooltipItem.raw;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                },
                y: {
                    beginAtZero: true,
                }
            }
        }
    });
}

function createDonutChart(canvas, labels, values, header, sheetName) {
    const backgroundColors = labels.map(label => {
        if (sheetName.toLowerCase() === 'gender diversity' && label.toLowerCase() === 'female') {
            return '#FF69B4'; // Pink color for female
        }
        return values.map(value => value < 0 ? '#FF6347' : '#4E73DF')[0];
    });

    new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                label: header,
                data: values,
                backgroundColor: backgroundColors,
                borderColor: '#fff',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(tooltipItem) {
                            return tooltipItem.label + ': ' + tooltipItem.raw;
                        }
                    }
                }
            }
        }
    });
}

function createHorizontalBarChart(canvas, labels, values, header) {
    new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: header,
                data: values,
                backgroundColor: values.map(value => value < 0 ? '#FF6347' : '#1CC88A'),
                borderColor: '#17A673',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y', // Horizontal bar chart
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        autoSkip: false
                    }
                },
                y: {
                    ticks: {
                        autoSkip: false
                    }
                }
            }
        }
    });
}
