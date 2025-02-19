import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

// Define margins and dimensions
const margin = { top: 40, right: 30, bottom: 50, left: 200 }; // Increased left margin for labels
const width = 800 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

// Select the correct SVG AFTER defining width and height
const svg = d3.select("#butterfly")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);


// **Background rectangle for clicking to return to main chart**
svg.append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "white")
    .attr("opacity", 0)
    .on("click", () => loadMainChart()); // Return to main chart on click

// Define color scale
const colorScale = d3.scaleOrdinal()
    .domain(["Surgery Duration", "Hospital Stay"])
    .range(["#1f77b4", "url(#diagonalHatch)"]); // Blue for surgery, Orange for stay

const defs = svg.append("defs");
defs.append("pattern")
    .attr("id", "diagonalHatch")
    .attr("patternUnits", "userSpaceOnUse")
    .attr("width", 8)
    .attr("height", 8)
    .append("path")
    .attr("d", "M0,0 l8,8 M-4,4 l8,8 M4,-4 l8,8")
    .attr("stroke", "#D0021B")
    .attr("stroke-width", 2);


const xScale = d3.scaleLinear().range([0, width]); // Horizontal bars, so x is linear
const yScale = d3.scaleBand().range([0, height]).padding(0.4); // Band scale for categories

const xAxisGroup = svg.append("g").attr("transform", `translate(0,${height})`);
const yAxisGroup = svg.append("g");

// Legend
const legend = svg.append("g")
    .attr("transform", `translate(${width - 120}, -40)`); // Position legend at top right

legend.selectAll("rect")
    .data(["Surgery Duration", "Hospital Stay"])
    .enter()
    .append("rect")
    .attr("x", 0)
    .attr("y", (d, i) => i * 25)
    .attr("width", 15)
    .attr("height", 15)
    .attr("fill", d => colorScale(d));

legend.selectAll("text")
    .data(["Surgery Duration", "Hospital Stay"])
    .enter()
    .append("text")
    .attr("x", 20)
    .attr("y", (d, i) => i * 20 + 12)
    .text(d => d)
    .style("font-size", "14px")
    .attr("alignment-baseline", "middle");

const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background", "rgba(0, 0, 0, 0.75)")
    .style("color", "#fff")
    .style("padding", "8px")
    .style("border-radius", "5px")
    .style("display", "none")
    .style("pointer-events", "none");

function loadMainChart() {
    backButton.style("display", "none");
    d3.json("data/main_durations_data.json").then(data => {
        // Convert 'optype' to 'department' for consistency
        data.forEach(d => d.SurgeryType = d.optype);
        updateChart(data, false);
    }).catch(error => console.error("Error loading the data", error));
}

// Load subcategories for a specific department
function loadSubChart(SurgeryType) {
    backButton.style("display", "inline-block");

    d3.json("data/sub_durations_data.json").then(data => {
        const filteredData = data.filter(d => d.optype === SurgeryType);
        filteredData.forEach(d => d.SurgeryType = d.opname);  // Ensure consistency
        updateChart(filteredData, true);
    });
}

    d3.json("data/main_durations_data.json").then(data => {
    
        // ✅ **Fix 1: Ensure xScale domain covers `surgery + stay`**
        xScale.domain([0, d3.max(data, d => d.surgery + d.stay)]);
        yScale.domain(data.map(d => d.optype));
    
        // Bind data
        const bars = svg.selectAll(".bar-group").data(data, d => d.optype);
    
        // Remove old bars
        bars.exit().transition().duration(500).attr("opacity", 0).remove();
    
        // Create bar groups
        const barGroups = bars.enter()
            .append("g")
            .attr("class", "bar-group")
            .attr("transform", d => `translate(0, ${yScale(d.optype)})`)
            .on("mouseover", function (event, d) {
                tooltip.style("display", "block")
                    .html(`
                        <strong>${d.optype}</strong><br>
                        Surgery Duration: ${d.surgery.toFixed(2)} hours<br>
                        Hospital Stay: ${d.stay.toFixed(2)} days
                    `);
            })
            .on("mousemove", function (event) {
                tooltip.style("top", `${event.pageY - 40}px`).style("left", `${event.pageX + 10}px`);
            })
            .on("mouseout", function () {
                tooltip.style("display", "none");
            });
    
        // ✅ **Fix 2: Draw surgery bar first, then overlay dashed hospital stay**
        // Draw **Surgery Duration** (Solid Bar) **FIRST**
        barGroups.append("rect")
            .attr("class", "bar")
            .attr("x", 0)
            .attr("y", 0)
            .attr("height", yScale.bandwidth())
            .attr("width", 0)  // Start with 0 width
            .attr("fill", "#D0021B") // Solid Red
            .transition().duration(800)
            .attr("width", d => xScale(d.surgery)); // Expand based on surgery duration
    
        // Draw **Hospital Stay** (Dashed Background Bar) **SECOND**
        barGroups.append("rect")
            .attr("class", "bar-background")
            .attr("x", d => xScale(d.surgery)) // Start after surgery duration
            .attr("y", 0)
            .attr("height", yScale.bandwidth())
            .attr("width", 0)  // Start with 0 width
            .attr("fill", "url(#diagonalHatch)")
            .attr("opacity", 0.4) // Dashed pattern
            .transition().duration(800)
            .attr("width", d => xScale(d.stay)); // Expand based on hospital stay
    
        // ✅ **Fix 3: Add labels directly on top of bars**
        barGroups.append("text")
            .attr("x", d => xScale(d.surgery + d.stay) - 5)
            .attr("y", yScale.bandwidth() / 2)
            .attr("text-anchor", "end")
            .attr("opacity", 0)
            .transition().duration(800)
            .attr("opacity", 1)
            .text(d => `${d.surgery.toFixed(1)}h | ${d.stay.toFixed(1)}d`)
            .style("font-size", "12px")
            .attr("fill", "#fff");
    
        // Update Axes
        xAxisGroup.transition().duration(800).call(d3.axisBottom(xScale));
        yAxisGroup.transition().duration(800).call(d3.axisLeft(yScale));
    
    }).catch(error => console.error("Error loading data", error));
    