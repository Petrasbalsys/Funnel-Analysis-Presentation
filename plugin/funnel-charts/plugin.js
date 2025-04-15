/*****************************************************************
** Author: Petras Balsys
**
** A plugin for reveal.js allowing to integrate funnel charts
**
** Version: 1.0.0
**
** License: MIT license
**
******************************************************************/

"use strict";

window.RevealFunnelCharts = window.RevealFunnelCharts || {
    id: 'RevealFunnelCharts',
    init: function(deck) {
        initFunnelCharts.call(this, deck);
    }
};

const initFunnelCharts = function(Reveal) {
    // Store funnel chart instances by container ID
    const funnelCharts = {};
    
    function parseJSON(str) {
        str = str.replace(/(\r\n|\n|\r|\t)/gm, ""); // remove line breaks and tabs
        var json;
        try {
            json = JSON.parse(str, function(key, value) {
                if (value && (typeof value === 'string') && value.indexOf("function") === 0) {
                    // we can only pass a function as string in JSON ==> doing a real function
                    var jsFunc = new Function('return ' + value)();
                    return jsFunc;
                }
                return value;
            });
        } catch (e) {
            return null;
        }
        return json;
    }

    function getPreferredDirection() {
        return window.innerWidth <= 768 ? 'vertical' : 'horizontal';
    }
    
    // Parse CSV data into format needed for funnel charts
    function parseCsvData(csvText) {
        const rows = csvText.trim().split('\n').map(row => row.split(','));
        const headers = rows[0];
        
        const labels = [];
        const subLabels = headers.slice(1); // Skip first column (stage names)
        const values = [];
        
        // Start from row 1 to skip headers
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            labels.push(row[0]); // First cell is stage name
            
            // Convert remaining cells to numbers
            const stageValues = row.slice(1).map(Number);
            values.push(stageValues);
        }
        
        /*
        // Create randomised color gradients for each split
        const colors = Array(values.length).fill().map(() => 
            Array(Math.max(...values.map(v => v.length))).fill().map(() => 
                `hsl(${Math.random() * 360}, 70%, 60%)`
            )
        );
        */

        // Static colors instead of random ones
        const colors = [
                             ['#016391','#e24a38'], 
                             ['#feb929'], 
                             ['#e24a38'], 
                             ['#d9bbf9']
        ];
        
        return { labels, subLabels, values, colors };
    }
    
    // Load data from specified source
    async function loadFunnelData(dataId, isJson = true) {
        try {
            const path = isJson ? `data/json/${dataId}.json` : `data/csv/${dataId}.csv`;
            const response = await fetch(path);
            
            if (!response.ok) {
                throw new Error(`Failed to load data: ${response.status}`);
            }
            
            if (isJson) {
                return await response.json();
            } else {
                const csvText = await response.text();
                return parseCsvData(csvText);
            }
        } catch (error) {
            console.error(`Error loading funnel data (${dataId}):`, error);
            return null;
        }
    }
    
    // Initialize a funnel chart
    async function initializeChart(container, forceReinitialize = true) {
        const containerId = container.id;
        const dataId = container.dataset.dataSource || 'default';
        const useJson = container.dataset.useJson !== 'false';

        // Calculate responsive dimensions
        const containerWidth = container.offsetWidth;
        const containerHeight = container.offsetHeight;

        // Skip reinitialization for vertical navigation if chart exists
        if (!forceReinitialize && funnelCharts[containerId]) {
            return funnelCharts[containerId];
        }
        
        // Get funnel configuration from HTML comments if available
        let data = null;
        const comments = container.innerHTML.trim().match(/<!--[\s\S]*?-->/g);
        
        if (comments !== null) {
            for (let i = 0; i < comments.length; i++) {
                const comment = comments[i].replace(/<!--/, '').replace(/-->/, '');
                const config = parseJSON(comment);
                if (config && config.data) {
                    data = config.data;
                    break;
                }
            }
        }
        
        // If no data in comments, try loading from file
        if (!data) {
            data = await loadFunnelData(dataId, useJson);
        }
        
        // If still no data and it's the default funnel, use hardcoded data
        if (!data && dataId === 'default') {
            data = {
                labels: ['Awareness', 'Interest', 'Desire', 'Action'],
                subLabels: ['US', 'India', 'Canada'],
                colors: [
                    ['#FFB178', '#FF78B1', '#FF3C8E'],
                    ['#A0BBFF', '#EC77FF'],
                    ['#A0F9FF']
                ],
                values: [
                    [138028, 29415, 23488],
                    [91878, 19516, 15805],
                    [10098, 2112, 1759],
                    [6827, 1422, 1226]
                ]
            };
        }
        
        if (!data) {
            console.error(`No data available for funnel chart: ${dataId}`);
            return null;
        }

        // Clean up existing chart properly
        if (funnelCharts[containerId]) {
            // The library doesn't have a destroy method, so we'll clear the container
            container.innerHTML = '';
        }
        
        // Create new funnel chart
        funnelCharts[containerId] = new FunnelGraph({
            container: `#${containerId}`, 
            gradientDirection: container.dataset.gradientDirection || 'horizontal',
            data: data,
            displayPercent: container.dataset.displayPercent !== 'false',
            direction: container.dataset.direction || getPreferredDirection(),
            //width: parseInt(container.dataset.width || container.offsetWidth || 600),
            //height: parseInt(container.dataset.height || container.offsetHeight || 400)
            width: containerWidth,
            height: containerHeight,
            responsive: true,
            //preserveAspectRatio: "xMidYMid meet"
        });
        
        return funnelCharts[containerId];
    }
    
    // Draw an initialized chart
    function drawChart(containerId) {
        if (!funnelCharts[containerId]) return;

        const currentDirection = getPreferredDirection();
        const isInitialDraw = !funnelCharts[containerId].hasDrawn;
        
        funnelCharts[containerId].draw({
            animation: currentDirection === 'horizontal',
            animationDuration: 1000
        });

        funnelCharts[containerId].hasDrawn = true;
    }

    // Process all funnel charts in a slide
    async function processFunnelCharts(currentSlide, forceReinitialize = true) {
        const funnelContainers = currentSlide.querySelectorAll('[id^="funnel-"]');
        
        if (funnelContainers.length > 0) {

            console.log(`Found ${funnelContainers.length} funnel charts on slide`);

            for (const container of funnelContainers) {
                const chart = await initializeChart(container, forceReinitialize);
                if (chart) {
                    // Delay drawing to allow transition
                    drawChart(container.id);
                }
            }
        }
    }
    
    // Detect if navigation is horizontal or vertical
    function isHorizontalNavigation(prevSlide, currentSlide) {
        // If no previous slide or slides are in different sections
        if (!prevSlide) return true;
        
        // Check if they're in the same vertical stack
        // In reveal.js, vertical slides share the same parent element
        return prevSlide.parentNode !== currentSlide.parentNode;
    }

    // Set up event listeners
    Reveal.addEventListener('ready', function(event) {
        // Initial load always forces initialization
        processFunnelCharts(event.currentSlide, true);
    });

    Reveal.addEventListener('slidechanged', function(event) {
        const isHorizontal = isHorizontalNavigation(event.previousSlide, event.currentSlide);
        
        // Only reinitialize charts if navigation is horizontal
        processFunnelCharts(event.currentSlide, true);
    });

    window.addEventListener('resize', () => {
        const currentSlide = Reveal.getCurrentSlide();
        if (currentSlide) {
            processFunnelCharts(currentSlide, true);
        }
    });

    // Expose API
    this.drawChart = drawChart;
    this.initializeChart = initializeChart;
    
    return this;
};