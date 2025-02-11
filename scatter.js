// Remove the ES module import since we're using CDN in HTML
// const svg = d3.select("#scatterplot");
// Instead, set up SVG with proper dimensions and margins

const margin = { top: 40, right: 100, bottom: 60, left: 70 };
const width = 800 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

const svg = d3.select("#scatterplot")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const dropdown = d3.select("#surgery-select");

// Load CSV
d3.csv("cases_clean.csv", d3.autoType).then(data => {
    // Get unique surgery types and update dropdown
    const surgeryTypes = ["All", ...new Set(data.map(d => d.optype))];
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
        .domain(surgeryTypes.filter(d => d !== "All"));

    dropdown.selectAll("option")
        .data(surgeryTypes)
        .enter()
        .append("option")
        .text(d => d);

    // Set up scales
    const xScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.opdur_mins)])
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.hospstay_mins)])
        .range([height, 0]);

    // Add axes
    const xAxis = svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale));

    const yAxis = svg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(yScale));

    // Add axis labels
    svg.append("text")
        .attr("class", "x-label")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .text("Surgery Duration (minutes)");

    svg.append("text")
        .attr("class", "y-label")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("y", -50)
        .attr("x", -height / 2)
        .text("Hospital Stay (minutes)");

    // Add legend
    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width + 20}, 0)`);

    const legendItems = legend.selectAll(".legend-item")
        .data(surgeryTypes.filter(d => d !== "All"))
        .enter()
        .append("g")
        .attr("class", "legend-item")
        .attr("transform", (d, i) => `translate(0, ${i * 25})`);

    legendItems.append("circle")
        .attr("r", 5)
        .attr("fill", d => colorScale(d));

    legendItems.append("text")
        .attr("x", 5)
        .attr("y", 4)
        .text(d => d);

    function updateChart(selectedType) {
        // Filter data if a specific type is selected
        const filteredData = selectedType === "All" 
            ? data 
            : data.filter(d => d.optype === selectedType);

        // Update points with proper D3 update pattern
        const points = svg.selectAll("circle.point")
            .data(filteredData, d => d.id); // Assuming you have an id field

        // Remove old points
        points.exit().remove();

        // Add new points
        points.enter()
            .append("circle")
            .attr("class", "point")
            .merge(points)
            .attr("cx", d => xScale(d.opdur_mins))
            .attr("cy", d => yScale(d.hospstay_mins))
            .attr("r", 4)
            .attr("fill", d => colorScale(d.optype))
            .attr("opacity", 0.7);
    }

    // Initial render
    updateChart("All");

    // Update on dropdown change
    dropdown.on("change", function() {
        updateChart(this.value);
    });
});