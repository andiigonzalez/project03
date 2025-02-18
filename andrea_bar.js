import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

// Define margins and dimensions
const margin = { top: 40, right: 30, bottom: 50, left: 200 };
const width = 800 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

// Select the correct SVG
const svg = d3.select("#andrea_bar")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const selector = d3.select(".chart-container1")
    .select(".selector-container")
    .append("select")
    .attr("id", "opSelector");

// Background rectangle for returning to main chart
svg.append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "white")
    .attr("opacity", 0)
    .style("cursor", "pointer")
    .on("click", () => {
        if (currentView === "sub") {
            loadMainChart();
        }
    });

// Define color scale
const colorScale = d3.scaleOrdinal()
    .domain(["Surgery Duration", "Hospital Stay"])
    .range(["#1f77b4", "#ff7f0e"]);

const xScale = d3.scaleLinear().range([0, width]);
const yScale = d3.scaleBand().range([0, height]).padding(0.4);

const xAxisGroup = svg.append("g").attr("transform", `translate(0,${height})`);
const yAxisGroup = svg.append("g");

// Legend
const legend = svg.append("g")
    .attr("transform", `translate(${width - 120}, -40)`);

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

const backButton = d3.select("#backButton")
    .style("display", "none")
    .on("click", loadMainChart);

const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background", "rgba(0, 0, 0, 0.75)")
    .style("color", "#fff")
    .style("padding", "4px")
    .style("border-radius", "3px")
    .style("display", "none")
    .style("pointer-events", "none");

let currentView = "main";

// Load main categories
function loadMainChart() {
    currentView = "main";
    backButton.style("display", "none");
    
    d3.json("data/main_durations_data.json").then(data => {
        // Update dropdown menu
        selector.selectAll("option").remove();
        selector.append("option").attr("value", "all").text("All Operations");
        
        const uniqueTypes = [...new Set(data.map(d => d.optype))];
        uniqueTypes.forEach(optype => {
            selector.append("option")
                .attr("value", optype)
                .text(optype);
        });

        selector.property("value", "all");
        updateChart(data, false);
    }).catch(error => console.error("Error loading data:", error));
}

// Load subcategories
function loadSubChart(selectedType) {
    currentView = "sub";
    backButton.style("display", "inline-block");

    d3.json("data/sub_durations_data.json").then(data => {
        const filteredData = data.filter(d => d.optype === selectedType);
        
        // Update dropdown
        selector.selectAll("option").remove();
        selector.append("option").attr("value", "all").text("All Operations");
        selector.append("option").attr("value", selectedType).text(selectedType);
        
        const uniqueOps = [...new Set(filteredData.map(d => d.opname))];
        uniqueOps.forEach(opname => {
            selector.append("option")
                .attr("value", opname)
                .text(opname);
        });

        selector.property("value", selectedType);
        updateChart(filteredData, true);
    }).catch(error => console.error("Error loading data:", error));
}

// Update chart with new data
function updateChart(data, isSubcategory) {
    const maxValue = d3.max(data, d => Math.max(d.surgery, d.stay));
    xScale.domain([0, maxValue]);
    
    const categories = isSubcategory 
        ? data.map(d => d.opname)
        : data.map(d => d.optype);
    yScale.domain(categories);

    // Update axes
    xAxisGroup.transition().duration(800)
        .call(d3.axisBottom(xScale).ticks(5));
    yAxisGroup.transition().duration(800)
        .call(d3.axisLeft(yScale));

    // Update bars
    const barGroups = svg.selectAll(".bar-group")
        .data(data, d => isSubcategory ? d.opname : d.optype);

    // Remove old bars
    barGroups.exit()
        .transition().duration(500)
        .attr("opacity", 0)
        .remove();

    // Create new bar groups
    const newBarGroups = barGroups.enter()
        .append("g")
        .attr("class", "bar-group")
        .style("cursor", "pointer");

    // Add surgery duration bars
    newBarGroups.append("rect")
        .attr("class", "surgery-bar")
        .attr("y", d => yScale(isSubcategory ? d.opname : d.optype))
        .attr("height", yScale.bandwidth() * 0.4)
        .attr("fill", colorScale("Surgery Duration"))
        .attr("x", 0)
        .attr("width", 0)
        .transition().duration(800)
        .attr("width", d => xScale(d.surgery));

    // Add hospital stay bars
    newBarGroups.append("rect")
        .attr("class", "stay-bar")
        .attr("y", d => yScale(isSubcategory ? d.opname : d.optype) + yScale.bandwidth() * 0.5)
        .attr("height", yScale.bandwidth() * 0.4)
        .attr("fill", colorScale("Hospital Stay"))
        .attr("x", 0)
        .attr("width", 0)
        .transition().duration(800)
        .attr("width", d => xScale(d.stay));

    // Add click handlers
    newBarGroups.on("click", function(event, d) {
        if (currentView === "main") {
            loadSubChart(d.optype);
        }
    });

    // Add hover effects
    const handleMouseOver = function(event, d) {
        const title = isSubcategory ? d.opname : d.optype;
        if (title) {  // Only show tooltip if title exists
            tooltip.style("display", "block")
                .html(`
                    <strong>${title}</strong><br>
                    Average Surgery Duration: ${d.surgery.toFixed(2)} hours<br>
                    Average Hospital Stay: ${d.stay.toFixed(2)} hours
                `);
        }
    };

    newBarGroups
        .on("mouseover", handleMouseOver)
        .on("mousemove", function(event) {
            tooltip.style("top", `${event.pageY - 40}px`)
                .style("left", `${event.pageX + 10}px`);
        })
        .on("mouseout", function() {
            tooltip.style("display", "none");
        });

    // Update existing bar groups with new hover handlers
    barGroups
        .on("mouseover", handleMouseOver)
        .on("mousemove", function(event) {
            tooltip.style("top", `${event.pageY - 40}px`)
                .style("left", `${event.pageX + 10}px`);
        })
        .on("mouseout", function() {
            tooltip.style("display", "none");
        });

    // Update existing bars
    barGroups.select(".surgery-bar")
        .transition().duration(800)
        .attr("y", d => yScale(isSubcategory ? d.opname : d.optype))
        .attr("width", d => xScale(d.surgery));

    barGroups.select(".stay-bar")
        .transition().duration(800)
        .attr("y", d => yScale(isSubcategory ? d.opname : d.optype) + yScale.bandwidth() * 0.5)
        .attr("width", d => xScale(d.stay));
}

// Dropdown event handler
selector.on("change", function() {
    const selectedValue = this.value;
    if (selectedValue === "all") {
        loadMainChart();
    } else if (currentView === "main") {
        loadSubChart(selectedValue);
    } else {
        // Handle subcategory filtering
        d3.json("data/sub_durations_data.json").then(data => {
            const filteredData = data.filter(d => d.opname === selectedValue);
            updateChart(filteredData, true);
        });
    }
});

// Initialize the chart
loadMainChart();