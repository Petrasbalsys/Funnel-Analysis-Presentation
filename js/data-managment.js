class FunnelDataManager {
    constructor() {
        this.dataCache = {};
    }

    // Load data from a JSON file
    async loadJsonData(dataId) {
        if (this.dataCache[dataId]) {
            return this.dataCache[dataId];
        }
        
        try {
            const response = await fetch(`data/json/${dataId}.json`);
            const data = await response.json();
            this.dataCache[dataId] = data;
            return data;
        } catch (error) {
            console.error(`Error loading funnel data ${dataId}:`, error);
            return null;
        }
    }

    // Load data from CSV and convert to the format needed for funnel charts
    async loadCsvData(dataId) {
        if (this.dataCache[dataId]) {
            return this.dataCache[dataId];
        }
        
        try {
            const response = await fetch(`data/csv/${dataId}.csv`);
            const csvText = await response.text();
            const data = this.parseCsvToFunnelData(csvText);
            this.dataCache[dataId] = data;
            return data;
        } catch (error) {
            console.error(`Error loading CSV data ${dataId}:`, error);
            return null;
        }
    }

    // Parse CSV data into the format needed for funnel charts
    parseCsvToFunnelData(csvText) {
        const rows = csvText.trim().split('\n').map(row => row.split(','));
        const headers = rows[0];
        
        // Assuming CSV format:
        // Stage, Sublabel1, Sublabel2, Sublabel3, ...
        // Awareness, 100, 200, 300, ...
        // Interest, 80, 150, 220, ...
        
        const labels = [];
        const subLabels = headers.slice(1); // Skip the first column which has stage names
        const values = [];
        
        // Start from row 1 to skip headers
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            labels.push(row[0]); // First cell is the stage name
            
            // Convert the rest of the cells to numbers for the values
            const stageValues = row.slice(1).map(Number);
            values.push(stageValues);
        }
        
        // Create default colors if needed
        const colors = Array(values.length).fill().map(() => this.generateRandomColors(subLabels.length));
        
        return {
            labels,
            subLabels,
            values,
            colors
        };
    }
    
    // Generate random colors for the funnel
    generateRandomColors(count) {
        return Array(count).fill().map(() => {
            return `hsl(${Math.random() * 360}, 70%, 60%)`;
        });
    }
}