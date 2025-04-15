// Register the datalabels plugin with Chart.js
Chart.register(ChartDataLabels);

// Function to get font size based on screen width
const getResponsiveFontSize = () => {
    if (window.matchMedia("(max-width: 480px)").matches) {
        return 16; // Font size for mobile
    } else if (window.matchMedia("(max-width: 768px)").matches) {
        return 20; // Font size for tablets
    }
    return 35; // Default font size for desktop
};

// Define the global chart options
const globalOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
        padding: {
            left: 20,  // Adjust these values as needed
            right: 20,
            top: 0,
            bottom: 0
        }
    },
    scales: {
        y: {
            display: false,
            grid: {
                display: false
            },
        },
        x: {
            offset: true,
            grid: {
                display: false
            },
            ticks: {
                font: {
                    size: getResponsiveFontSize(),
                    weight: 'bold'
                },
                color: "#fff",
                callback: function(value, index) {
                    // Use the original labels from the data
                    return this.chart.data.labels[index];
                }
            }
        }
    },
    plugins: {
        legend: {
            display: false
        },
        tooltip: {
            callbacks: {
                label: function(context) {
                    // Get the value
                    const value = context.parsed.y;
                    
                    // Use the existing formatter
                    const formattedValue = (value >= 1000000) 
                        ? (value / 1000000).toFixed(1) + 'M'
                        : (value >= 1000) 
                            ? (value / 1000).toFixed(0) + 'K'
                            : value;
                    
                    // Calculate percentage of total
                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                    const percentage = ((value / total) * 100).toFixed(1);
                    
                    return [
                        `Value: ${formattedValue}`,
                        `Percentage: ${percentage}%`
                    ];
                }
            }
        },       
        datalabels: {
            formatter: (value) => {
                if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
                if (value >= 1000) return (value / 1000).toFixed(0) + 'K';
                return value;
            },
            anchor: "end",
            align: (context) => {
                const chart = context.chart;
                if (chart.canvas.id === 'newVsReturningUsers') {
                    return context.dataIndex === 1 ? 'end' : 'bottom';
                }
                if (chart.canvas.id === 'device') {
                    // Modify these index checks and alignments based on your device chart needs
                    return context.dataIndex === 2 ? 'end' : 'bottom';
                }
                return 'bottom';
            },
//            anchor: "end",
//           align: "bottom",
            color: "#fff",
            font: {
                weight: "bold",
                size: 30
            }
        }
    }
};

// Set global defaults;

// Set defaults for bar charts specifically
Chart.overrides.bar = globalOptions;

// Update charts when window is resized
window.addEventListener('resize', () => {
    const charts = Object.values(Chart.instances);
    charts.forEach(chart => {
        chart.options.scales.x.ticks.font.size = getResponsiveFontSize();
        chart.update();
    });
});
