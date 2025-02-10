import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

// Set up SVG
const svg = d3.select("#scatterplot");

// Load CSV
d3.csv("cases_clean.csv", d3.autoType).then(data => {
    const width = 800, height = 500, margin = 50;

    const surgeryTypes = [...new Set(data.map(d => d.optype))];
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(surgeryTypes);

    const xScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.opdur_mins)])
        .range([margin, width - margin]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.hospstay_mins)])
        .range([height - margin, margin]);

    svg.selectAll("circle")
        .data(data)
        .enter().append("circle")
        .attr("cx", d => xScale(d.opdur_mins))
        .attr("cy", d => yScale(d.hospstay_mins))
        .attr("r", 4)
        .attr("fill", d => colorScale(d.optype))
        .attr("opacity", 0.7);

    svg.append("g").attr("transform", `translate(0, ${height - margin})`).call(d3.axisBottom(xScale));
    svg.append("g").attr("transform", `translate(${margin}, 0)`).call(d3.axisLeft(yScale));

    updateChart("All");
    dropdown.on("change", function () { updateChart(this.value); });
});
