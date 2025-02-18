// Define margins and dimensions
const margin = { top: 50, right: 50, bottom: 100, left: 50 };
const baseWidth = 1000 - margin.left - margin.right;
let baseHeight = 600 - margin.top - margin.bottom;

// Select the container and create the SVG
const container = d3.select(".chart-container1");

const svgContainer = d3.select("#andrea_bar")
    .attr("width", baseWidth + margin.left + margin.right)
    .attr("height", baseHeight + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Add chart title and subtitle
svgContainer.append("text")
    .attr("x", baseWidth / 2)
    .attr("y", -30)
    .attr("text-anchor", "middle")
    .style("font-size", "20px")
    .style("font-weight", "bold")
    .text("How Long Will it Take?");

svgContainer.append("text")
    .attr("x", baseWidth / 2)
    .attr("y", -10)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("fill", "#666")
    .text("An analysis of Surgery and Hospital Stay Durations Across Surgeries");

// Add dropdown for filtering
const dropdownContainer = container.append("div")
    .attr("class", "dropdown-container")
    .style("position", "absolute")
    .style("top", "850px")
    .style("anchor", "left")
    .style("z-index", "10");

const dropdown = dropdownContainer.append("select")
    .attr("id", "filterDropdown")
    .style("padding", "5px")
    .style("font-size", "14px")
    .style("background", "white")
    .style("border", "1px solid #ccc");

// Add reset button
const resetButton = container.append("button")
    .text("Reset")
    .style("display", "none")
    .style("margin-top", "10px")
    .on("click", () => {
        updateChart(initialData, "optype");
        currentView = "main";
    });

// Tooltip
const tooltip = container.append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("padding", "8px")
    .style("background", "rgba(0, 0, 0, 0.75)")
    .style("color", "#fff")
    .style("border-radius", "3px")
    .style("display", "none")
    .style("pointer-events", "none");

// Create background rect for clicking to go back
const backRect = svgContainer.append("rect")
    .attr("width", baseWidth)
    .attr("height", baseHeight)
    .attr("fill", "white")
    .attr("opacity", 0)
    .style("cursor", "pointer")
    .on("click", () => {
        if (currentView === "sub") {
            updateChart(initialData, "optype");
            currentView = "main";
        }
    });

// Initialize scales
const xScale = d3.scaleLinear(); // Single x-scale for both surgery and hospital stay
const yScale = d3.scaleBand().padding(0.3); // Dynamic y-scale

// Create x-axis group
const xAxis = svgContainer.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${baseHeight})`);

// X-axis labels
const Surg_label = svgContainer.append("text")
    .attr("class", "x-axis-label")
    .attr("x", baseWidth / 4)
    .attr("y", baseHeight + 60)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .style("fill", "black")
    .text("Average Surgery Duration (in hours)");

const Hosp_label = svgContainer.append("text")
    .attr("class", "x-axis-label")
    .attr("x", (baseWidth / 4) * 3)
    .attr("y", baseHeight + 60)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .style("fill", "black")
    .text("Average Hospitalization Duration (in days)");

let currentView = "main"; // Track current view
let initialData;

// ✅ Function to update the chart
function updateChart(data = null, groupBy = "optype") {
    // ✅ Load data dynamically if not provided
    if (!data) {
        d3.json("data/sub_durations_data.json")
            .then(response => {
                if (!response.children) {
                    throw new Error("No children found in JSON data");
                }
                initialData = response.children; // Store top-level data
                populateDropdown(initialData);
                updateChart(initialData, "optype"); // Show optypes first
            })
            .catch(error => console.error("Error loading JSON data:", error));
        return;
    }

    console.log("Data received:", data);

    // ✅ Prepare data depending on view (optypes or opnames)
    let processedData;
    if (groupBy === "optype") {
        // Aggregate surgery and stay times by `optype`
        processedData = data.map(category => ({
            name: category.name,
            surgery: d3.mean(category.children, d => d.surgery || 0),
            stay: d3.mean(category.children, d => d.stay || 0),
            children: category.children // Preserve children for filtering
        }));
    } else {
        // Show specific procedures within the selected `optype`
        processedData = data.map(procedure => ({
            name: procedure.name,
            surgery: procedure.surgery || 0,
            stay: procedure.stay || 0
        }));
    }

    // ✅ Set x-axis domain
    const maxOpDur = d3.max(processedData, d => d.surgery || 0);
    const maxHospDur = d3.max(processedData, d => d.stay || 0);
    const maxDuration = Math.max(maxOpDur, maxHospDur);
    xScale.domain([-maxDuration, maxDuration]).range([0, baseWidth]);

    // ✅ Dynamically adjust SVG height based on the number of categories
    const numBars = processedData.length;
    const barHeight = 30; // Minimum height for each bar
    const newHeight = Math.max(600, numBars * barHeight + margin.top + margin.bottom);

    // Update SVG height
    d3.select("#andrea_bar")
        .transition().duration(500)
        .attr("height", newHeight);

    // Update y-scale range
    yScale.range([0, newHeight - margin.top - margin.bottom])
        .domain(processedData.map(d => d.name));

    Surg_label
        .transition().duration(500)
        .attr("x", baseWidth / 4) // Left side (surgery)
        .attr("y", newHeight - margin.bottom + 40);
    
    Hosp_label
        .transition().duration(500)
        .attr("x", (baseWidth / 4) * 3) // Right side (hospital stay)
        .attr("y", newHeight - margin.bottom + 40);
    
    // Update the x-axis
    xAxis.transition().duration(500)
        .attr("transform", `translate(0,${newHeight - margin.bottom})`)
        .call(d3.axisBottom(xScale).ticks(10).tickFormat(d => Math.abs(d)));

    // ✅ Select bars
    const bars = svgContainer.selectAll(".bar").data(processedData, d => d.name);

    // Exit: Animate bars out to the center
    bars.exit()
        .transition().duration(300)
        .attr("width", 0)
        .attr("x", baseWidth / 2)
        .remove();

    // Enter: Animate bars in from the center
    const barsEnter = bars.enter().append("g")
        .attr("class", "bar")
        .attr("transform", d => `translate(0,${yScale(d.name)})`)
        .style("opacity", 0.3);

    barsEnter.transition().duration(200).style("opacity", 0.8); // Lowered opacity

    // Surgery bars (Left side)
    barsEnter.append("rect")
        .attr("class", "bar-surgery")
        .attr("x", baseWidth / 2) // Start from the center
        .attr("y", 0)
        .attr("height", yScale.bandwidth())
        .attr("width", 0) // Start with zero width
        .attr("fill", "steelblue")
        .on("mouseover", (event, d) => showTooltip(event, d, "surgery"))
        .on("mouseout", hideTooltip)
        .on("click", (event, d) => {
            if (currentView === "main" && d.children) {
                drillDown(d);
            }
        })
        .transition().duration(200)
        .attr("x", d => xScale(-d.surgery)) // Extend to the left
        .attr("width", d => xScale(0) - xScale(-d.surgery));

    // Hospital stay bars (Right side)
    barsEnter.append("rect")
        .attr("class", "bar-hospitalization")
        .attr("x", baseWidth / 2) // Start from the center
        .attr("y", 0)
        .attr("height", yScale.bandwidth())
        .attr("width", 0) // Start with zero width
        .attr("fill", "orange")
        .on("mouseover", (event, d) => showTooltip(event, d, "hospitalization"))
        .on("mouseout", hideTooltip)
        .on("click", (event, d) => {
            if (currentView === "main" && d.children) {
                drillDown(d);
            }
        })
        .transition().duration(300)
        .attr("width", d => xScale(d.stay) - xScale(0)); // Extend to the right

    // Update existing bars
    bars.select(".bar-surgery")
        .transition().duration(300)
        .attr("x", d => xScale(-d.surgery))
        .attr("width", d => xScale(0) - xScale(-d.surgery));

    bars.select(".bar-hospitalization")
        .transition().duration(300)
        .attr("width", d => xScale(d.stay) - xScale(0));

    // Add text annotations for operation names in the center
    barsEnter.append("text")
        .attr("class", "bar-label-name")
        .attr("x", baseWidth / 2)
        .attr("y", yScale.bandwidth() / 2)
        .attr("dy", "0.35em")
        .style("fill", "black")
        .style("font-size", "12px")
        .style("text-anchor", "middle")
        .text(d => d.name);

    // Tooltip for interaction
    function showTooltip(event, d, type) {
        tooltip.style("display", "block")
            .html(`
                <strong>${d.name}</strong><br>
                Average Surgery Duration: ${d.surgery.toFixed(2)} hours<br>
                Average Hospital Stay: ${d.stay.toFixed(2)} days
            `)
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY - 30}px`);
    }

    function hideTooltip() {
        tooltip.style("display", "none");
    }

    // Update reset button visibility
    resetButton.style("display", currentView === "sub" ? "block" : "none");
}

// ✅ Drill-down function
function drillDown(d) {
    if (!d.children || d3.active(svgContainer.node())) return;

    // Collapse the selected bar
    const selectedBar = svgContainer.selectAll(".bar")
        .filter(datum => datum.name === d.name);

    selectedBar.selectAll("rect")
        .transition().duration(300)
        .attr("width", 0) // Collapse the bars
        .attr("fill-opacity", 0); // Fade out the bars

    // After the collapse, update the chart with the children data
    setTimeout(() => {
        updateChart(d.children, "opname");
        currentView = "sub";
    }, 300); // Wait for the collapse animation to finish
}

// Populate dropdown with data
function populateDropdown(data) {
    dropdown.selectAll("option").remove();
    dropdown.append("option")
        .attr("value", "all")
        .text("All Operations");

    data.forEach(d => {
        dropdown.append("option")
            .attr("value", d.name)
            .text(d.name);
    });

    dropdown.on("change", function () {
        const selected = this.value;
        if (selected === "all") {
            updateChart(initialData, "optype");
        } else {
            const filteredData = initialData.find(d => d.name === selected);
            if (filteredData && filteredData.children) {
                updateChart(filteredData.children, "opname");
            }
        }
    });
}

// ✅ Make updateChart globally accessible
window.updateChart = updateChart;

// ✅ Load the chart on page load
updateChart();