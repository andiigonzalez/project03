import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

// Set dimensions
const width = 1500;
const height = 1500;

// Define color scale
const colorScale = d3.scaleSequential(d3.interpolatePlasma).domain([0, 10]);

// Load JSON data
d3.json("surgery_durations.json").then(data => {
    let allSurgeries = data.children; // Store all optypes

    // Populate dropdown with surgery types
    const dropdown = d3.select("#surgery-select");
    dropdown.selectAll("option")
        .data(["All", ...allSurgeries.map(d => d.name)]) // Ensure all unique optypes are added
        .enter().append("option")
        .attr("value", d => d)
        .text(d => d);

    // Function to update treemap
    function updateTreemap(selectedType) {
        let filteredData = selectedType === "All" ? data : {
            name: selectedType,
            children: allSurgeries.find(d => d.name === selectedType).children
        };

        // Create hierarchical structure
        const root = d3.hierarchy(filteredData)
            .sum(d => d.value)
            .sort((a, b) => b.value - a.value);

        // Compute treemap layout
        d3.treemap()
            .size([width, height])
            .padding(2)
            .round(true)(root);

        // Select SVG
        const svg = d3.select("#treemap");
        svg.selectAll("*").remove(); // Clear previous treemap

        // Tooltip
        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background", "white")
            .style("padding", "5px")
            .style("border", "1px solid #ccc")
            .style("pointer-events", "none")
            .style("opacity", 0);

        // Draw rectangles
        const cell = svg.selectAll("g")
            .data(root.leaves())
            .join("g")
            .attr("transform", d => `translate(${d.x0},${d.y0})`);

        cell.append("rect")
            .attr("width", d => d.x1 - d.x0)
            .attr("height", d => d.y1 - d.y0)
            .attr("fill", d => d.children ? color(d.depth) : color(d.value))
            .attr("stroke", "#fff")
            .attr("stroke-width", 1)
            .on("mouseover", function(event, d) {
                tooltip.style("opacity", 1)
                    .html(`<strong>${d.data.name}</strong><br>Avg Duration: ${d.value.toFixed(2)} mins`)
                    .style("left", `${event.pageX + 5}px`)
                    .style("top", `${event.pageY - 30}px`);
                d3.select(this).attr("stroke-width", 2);
            })
            .on("mouseout", function() {
                tooltip.style("opacity", 0);
                d3.select(this).attr("stroke-width", 1);
            });

        // Add labels inside rectangles
        cell.append("text")
            .attr("x", d => (d.x1 - d.x0) / 2) // Center horizontally
            .attr("y", d => (d.y1 - d.y0) / 2) // Center vertically
            .attr("dy", ".35em") // Adjust text position
            .attr("text-anchor", "middle")
            .text(d => d.data.name)
            .attr("fill", "white") // Change text color for contrast
            .style("font-size", d => Math.min((d.x1 - d.x0) / d.data.name.length * 5, 14) + "px") // Adjust font size dynamically
            .style("pointer-events", "none")
            .style("overflow-wrap", "break-word"); // Break long text if needed
    }

    // Initial render
    updateTreemap("All");

    // Update when dropdown selection changes
    dropdown.on("change", function() {
        updateTreemap(this.value);
    });
});

