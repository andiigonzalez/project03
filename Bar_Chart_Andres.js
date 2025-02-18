

// ///////////////////////////////////////////////////////////////////////////////////////

// import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

// const margin = { top: 40, right: 200, bottom: 100, left: 150 },
//     baseWidth = 800 - margin.left - margin.right,
//     baseHeight = 500 - margin.top - margin.bottom;

// const svgContainer = d3.select(".project")
//     .append("svg")
//     .attr("width", baseWidth + margin.left + margin.right)
//     .append("g")
//     .attr("transform", `translate(${margin.left},${margin.top})`);

// const tooltip = d3.select(".project")
//     .append("div")
//     .attr("class", "tooltip")
//     .style("position", "absolute")
//     .style("background", "rgba(0, 0, 0, 0.75)")
//     .style("color", "#fff")
//     .style("padding", "8px")
//     .style("border-radius", "5px")
//     .style("display", "none")
//     .style("pointer-events", "none");

// const selector = d3.select(".selector-container")
//     .append("select")
//     .attr("id", "optypeSelector");

// const yAxisLabel = svgContainer.append("text")
//     .attr("class", "y-axis-label")
//     .attr("x", baseWidth / 2)
//     .attr("y", -20)
//     .attr("text-anchor", "middle")
//     .style("font-size", "16px")
//     .style("font-weight", "bold")
//     .text("All Operations");

// const xAxisLabel = svgContainer.append("text")
//     .attr("class", "x-axis-label")
//     .attr("x", baseWidth / 2)
//     .attr("text-anchor", "middle")
//     .style("font-size", "14px")
//     .text("Duration (minutes)");

// d3.csv("cases_clean_andres.csv").then(data => {
//     data.forEach(d => {
//         d.surgery = isNaN(+d.surgery) ? 0 : +d.surgery;
//         d.hospitalization = isNaN(+d.hospitalization) ? 0 : +d.hospitalization;
//     });

//     const uniqueOpTypes = [...new Set(data.map(d => d.optype))];

//     selector.append("option")
//         .attr("value", "all")
//         .text("All Operations");

//     uniqueOpTypes.forEach(optype => {
//         selector.append("option")
//             .attr("value", optype)
//             .text(optype);
//     });

//     const y = d3.scaleBand().padding(0.3);
//     const x = d3.scaleLinear().nice();

//     const svg = d3.select("svg");
//     const yAxisGroup = svgContainer.append("g");
//     const xAxisGroup = svgContainer.append("g");

//     function updateChart(filteredData, isOpName = false) {
//         const heightMultipliers = {
//             "Colorectal": 0.5, "Stomach": 0.5, "Biliary/ Pancreas": 0.5,
//             "Vascular": 1.5, "Major Resection": 0.5, "Breast": 0.5,
//             "Minor Resection": 0.5, "Transplant": 0.5, "Hepatic": 0.5,
//             "Thyroid": 0.5, "Others": 1.25
//         };

//         const selectedOpType = document.getElementById("optypeSelector").value;
//         const yDomain = isOpName ? filteredData.map(d => d.opname) : filteredData.map(d => d.optype);

//         const height = selectedOpType === "all" ? baseHeight : Math.max(baseHeight, yDomain.length * (heightMultipliers[selectedOpType] || 1));

//         svg.attr("height", height + margin.top + margin.bottom);

//         y.range([0, height]).domain(yDomain);
//         x.range([0, baseWidth]).domain([0, d3.max(filteredData, d => Math.max(d.surgery, d.hospitalization))]);

//         yAxisGroup.transition().duration(500).call(d3.axisLeft(y));
//         xAxisGroup.transition().duration(500)
//             .attr("transform", `translate(0,${height})`)
//             .call(d3.axisBottom(x));

//         yAxisLabel.text(`Surgery Type ${selectedOpType === "all" ? "All Operations" : selectedOpType}`);

//         xAxisLabel.transition().duration(500)
//             .attr("y", height + 40);

//         const barsSurgery = svgContainer.selectAll(".bar-surgery").data(filteredData, d => d.caseid);
//         barsSurgery.exit().remove();
//         barsSurgery.enter()
//             .append("rect")
//             .attr("class", "bar-surgery")
//             .merge(barsSurgery)
//             .transition().duration(500)
//             .attr("y", d => y(isOpName ? d.opname : d.optype))
//             .attr("x", 0)
//             .attr("height", y.bandwidth() / 2)
//             .attr("width", d => x(d.surgery))
//             .attr("fill", "steelblue");

//         const barsHospitalization = svgContainer.selectAll(".bar-hospitalization").data(filteredData, d => d.caseid);
//         barsHospitalization.exit().remove();
//         barsHospitalization.enter()
//             .append("rect")
//             .attr("class", "bar-hospitalization")
//             .merge(barsHospitalization)
//             .transition().duration(500)
//             .attr("y", d => y(isOpName ? d.opname : d.optype) + y.bandwidth() / 2)
//             .attr("x", 0)
//             .attr("height", y.bandwidth() / 2)
//             .attr("width", d => x(d.hospitalization))
//             .attr("fill", "orange");

//         // **Tooltip Event Listeners with Correct Display Logic**
//         svgContainer.selectAll(".bar-surgery, .bar-hospitalization")
//             .on("mouseover", function (event, d) {
//                 const isAllOperations = selectedOpType === "all";
//                 tooltip.style("display", "block")
//                     .html(`
//                         <strong>${d3.select(this).classed("bar-surgery") ? "Surgery" : "Hospitalization"}</strong><br>
//                         ${isAllOperations ? `Operation Type: ${d.optype}` : `Operation Name: ${d.opname}`}<br>
//                         Duration: ${d3.select(this).classed("bar-surgery") ? d.surgery : d.hospitalization} minutes
//                     `);
//             })
//             .on("mousemove", function (event) {
//                 tooltip.style("top", `${event.pageY - 40}px`)
//                     .style("left", `${event.pageX + 10}px`);
//             })
//             .on("mouseout", function () {
//                 tooltip.style("display", "none");
//             });
//     }

//     updateChart(data);

//     document.getElementById("optypeSelector").addEventListener("change", function () {
//         const selectedOpType = this.value;
//         const filteredData = selectedOpType === "all" ? data : data.filter(d => d.optype === selectedOpType);
//         updateChart(filteredData, selectedOpType !== "all");
//     });

// }).catch(error => {
//     console.error("Error loading CSV file:", error);
// });


/////////////////////////////////////////////////////////////////////////////////////




/////////////////////////////////////////////////////////////////////////////////////

// import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

// const margin = { top: 40, right: 200, bottom: 100, left: 150 },
//     baseWidth = 800 - margin.left - margin.right,
//     baseHeight = 500 - margin.top - margin.bottom;

// const svgContainer = d3.select(".project")
//     .append("svg")
//     .attr("width", baseWidth + margin.left + margin.right)
//     .append("g")
//     .attr("transform", `translate(${margin.left},${margin.top})`);

// const tooltip = d3.select(".project")
//     .append("div")
//     .attr("class", "tooltip")
//     .style("position", "absolute")
//     .style("background", "rgba(0, 0, 0, 0.75)")
//     .style("color", "#fff")
//     .style("padding", "8px")
//     .style("border-radius", "5px")
//     .style("display", "none")
//     .style("pointer-events", "none");

// const selector = d3.select(".selector-container")
//     .append("select")
//     .attr("id", "opSelector");

// const yAxisLabel = svgContainer.append("text")
//     .attr("class", "y-axis-label")
//     .attr("x", baseWidth / 2)
//     .attr("y", -20)
//     .attr("text-anchor", "middle")
//     .style("font-size", "16px")
//     .style("font-weight", "bold")
//     .text("All Operations");

// const xAxisLabel = svgContainer.append("text")
//     .attr("class", "x-axis-label")
//     .attr("x", baseWidth / 2)
//     .attr("text-anchor", "middle")
//     .style("font-size", "14px")
//     .text("Duration (minutes)");

// d3.csv("cases_clean_andres_2.csv").then(data => {
//     data.forEach(d => {
//         d.surgery = isNaN(+d.surgery) ? 0 : +d.surgery;
//         d.hospitalization = isNaN(+d.hospitalization) ? 0 : +d.hospitalization;
//     });

//     const uniqueOpTypes = [...new Set(data.map(d => d.optype))];

//     selector.append("option")
//         .attr("value", "all")
//         .text("All Operations");

//     uniqueOpTypes.forEach(optype => {
//         selector.append("option")
//             .attr("value", optype)
//             .text(optype);
//     });

//     const y = d3.scaleBand().padding(0.3);
//     const x = d3.scaleLinear().nice();

//     const svg = d3.select("svg");
//     const yAxisGroup = svgContainer.append("g");
//     const xAxisGroup = svgContainer.append("g");

//     function computeAverages(filteredData, groupBy) {
//         const grouped = d3.group(filteredData, d => d[groupBy]);
//         return Array.from(grouped, ([key, cases]) => ({
//             [groupBy]: key,
//             surgery: d3.mean(cases, d => d.surgery),
//             hospitalization: d3.mean(cases, d => d.hospitalization)
//         }));
//     }

//     function updateChart(filteredData, groupBy) {
//         const averages = computeAverages(filteredData, groupBy);
//         const yDomain = averages.map(d => d[groupBy]);

//         const height = Math.max(baseHeight, yDomain.length * 25);

//         svg.attr("height", height + margin.top + margin.bottom);
//         y.range([0, height]).domain(yDomain);

//         const maxValue = d3.max([...averages.map(d => d.surgery), ...averages.map(d => d.hospitalization)]);
//         x.range([0, baseWidth]).domain([0, maxValue]);

//         yAxisGroup.transition().duration(500).call(d3.axisLeft(y));

//         xAxisGroup.transition().duration(500)
//             .attr("transform", `translate(0,${height})`)
//             .call(d3.axisBottom(x).ticks(Math.min(10, maxValue / 5))) // Reduce tick count dynamically
//             .selectAll("text")
//             .style("text-anchor", "end") // Rotate labels
//             .attr("dx", "-0.5em")
//             .attr("dy", "0.5em")
//             .attr("transform", "rotate(-35)") // Rotate -35 degrees
//             .style("font-size", "12px"); // Adjust font size

//         yAxisLabel.text(`Average Surgery and Hospitalization Duration by ${groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}`);

//         xAxisLabel.transition().duration(500)
//             .attr("y", height + 40);

//         const barsSurgery = svgContainer.selectAll(".bar-surgery").data(averages, d => d[groupBy]);
//         barsSurgery.exit().remove();
//         barsSurgery.enter()
//             .append("rect")
//             .attr("class", "bar-surgery")
//             .merge(barsSurgery)
//             .transition().duration(500)
//             .attr("y", d => y(d[groupBy]))
//             .attr("x", 0)
//             .attr("height", y.bandwidth() / 2)
//             .attr("width", d => x(d.surgery))
//             .attr("fill", "steelblue");

//         const barsHospitalization = svgContainer.selectAll(".bar-hospitalization").data(averages, d => d[groupBy]);
//         barsHospitalization.exit().remove();
//         barsHospitalization.enter()
//             .append("rect")
//             .attr("class", "bar-hospitalization")
//             .merge(barsHospitalization)
//             .transition().duration(500)
//             .attr("y", d => y(d[groupBy]) + y.bandwidth() / 2)
//             .attr("x", 0)
//             .attr("height", y.bandwidth() / 2)
//             .attr("width", d => x(d.hospitalization))
//             .attr("fill", "orange");

//         svgContainer.selectAll(".bar-surgery, .bar-hospitalization")
//             .on("mouseover", function (event, d) {
//                 tooltip.style("display", "block")
//                     .html(`
//                         <strong>${d3.select(this).classed("bar-surgery") ? "Surgery" : "Hospitalization"}</strong><br>
//                         ${groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}: ${d[groupBy]}<br>
//                         Average Duration: ${d3.select(this).classed("bar-surgery") ? d.surgery.toFixed(2) : d.hospitalization.toFixed(2)} minutes
//                     `);
//             })
//             .on("mousemove", function (event) {
//                 tooltip.style("top", `${event.pageY - 40}px`)
//                     .style("left", `${event.pageX + 10}px`);
//             })
//             .on("mouseout", function () {
//                 tooltip.style("display", "none");
//             });
//     }

//     updateChart(data, "optype");

//     document.getElementById("opSelector").addEventListener("change", function () {
//         const selectedOpType = this.value;

//         if (selectedOpType === "all") {
//             updateChart(data, "optype");
//         } else {
//             const filteredData = data.filter(d => d.optype === selectedOpType);
//             updateChart(filteredData, "opname");
//         }
//     });

// }).catch(error => {
//     console.error("Error loading CSV file:", error);
// });

/////////////////////////

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

const margin = { top: 60, right: 200, bottom: 100, left: 150 },
    baseWidth = 800 - margin.left - margin.right,
    baseHeight = 500 - margin.top - margin.bottom;

const svgContainer = d3.select(".project")
    .append("svg")
    .attr("width", baseWidth + margin.left + margin.right)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Add Chart Title
svgContainer.append("text")
    .attr("x", baseWidth / 2)
    .attr("y", -30)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .style("font-weight", "bold")
    .text("Average Duration for Different Types of Surgeries");

// Add Subtitle
svgContainer.append("text")
    .attr("x", baseWidth / 2)
    .attr("y", -10)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .style("fill", "#666")
    .text("Click on the name of the surgery for more information on it. (Warning: External Links with Strong Images)");

// Add X-axis Label
const xAxisLabel = svgContainer.append("text")
    .attr("class", "x-axis-label")
    .attr("x", baseWidth / 2)
    .attr("y", baseHeight + 40)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .text("Surgery Duration (Minutes)");

const tooltip = d3.select(".project")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background", "rgba(0, 0, 0, 0.75)")
    .style("color", "#fff")
    .style("padding", "8px")
    .style("border-radius", "5px")
    .style("display", "none")
    .style("pointer-events", "none");

const selector = d3.select(".selector-container")
    .append("select")
    .attr("id", "opSelector");

d3.csv("cases_clean_andres_2.csv").then(data => {
    data.forEach(d => {
        d.surgery = isNaN(+d.surgery) ? 0 : +d.surgery;
    });

    const uniqueOpTypes = [...new Set(data.map(d => d.optype))];
    const uniqueSurgeryNames = [...new Set(data.map(d => d.opname))];

    selector.append("option")
        .attr("value", "all")
        .text("All Operations");

    uniqueOpTypes.forEach(optype => {
        selector.append("option")
            .attr("value", optype)
            .text(optype);
    });

    const surgeryLinks = {};
    uniqueSurgeryNames.forEach(name => {
        surgeryLinks[name] = `https://www.google.com/search?q=${encodeURIComponent(name)}`;
    });

    const surgeryOpTypeLinks = {};
    uniqueOpTypes.forEach(optype => {
        surgeryOpTypeLinks[optype] = `https://www.google.com/search?q=${encodeURIComponent(optype)}`;
    });

    const y = d3.scaleBand().padding(0.3);
    const x = d3.scaleLinear().nice();

    const svg = d3.select("svg");
    const yAxisGroup = svgContainer.append("g");
    const xAxisGroup = svgContainer.append("g");

    function computeAverages(filteredData, groupBy) {
        const grouped = d3.group(filteredData, d => d[groupBy]);
        return Array.from(grouped, ([key, cases]) => ({
            [groupBy]: key,
            surgery: d3.mean(cases, d => d.surgery)
        }));
    }

    function updateChart(filteredData, groupBy) {
        const averages = computeAverages(filteredData, groupBy);
        const yDomain = averages.map(d => d[groupBy]);

        const height = Math.max(baseHeight, yDomain.length * 25);

        svg.attr("height", height + margin.top + margin.bottom);
        y.range([0, height]).domain(yDomain);

        const maxValue = d3.max(averages, d => d.surgery);
        x.range([0, baseWidth]).domain([0, maxValue]);

        yAxisGroup.transition().duration(500).call(d3.axisLeft(y));

        xAxisGroup.transition().duration(500)
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).ticks(Math.min(10, maxValue / 5)))
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-0.5em")
            .attr("dy", "0.5em")
            .attr("transform", "rotate(-35)")
            .style("font-size", "12px");

        // Update X-axis Label Position
        xAxisLabel.transition().duration(500)
            .attr("y", height + 40);

        const barsSurgery = svgContainer.selectAll(".bar-surgery").data(averages, d => d[groupBy]);
        barsSurgery.exit().remove();

        barsSurgery.enter()
            .append("rect")
            .attr("class", "bar-surgery")
            .merge(barsSurgery)
            .transition().duration(500)
            .attr("y", d => y(d[groupBy]))
            .attr("x", 0)
            .attr("height", y.bandwidth())
            .attr("width", d => x(d.surgery))
            .attr("fill", "steelblue");

        // Remove old labels before adding new ones
        svgContainer.selectAll(".bar-label").remove();

        svgContainer.selectAll(".bar-label")
            .data(averages, d => d[groupBy])
            .enter()
            .append("text")
            .attr("class", "bar-label")
            .attr("x", d => x(d.surgery) + 5)
            .attr("y", d => y(d[groupBy]) + y.bandwidth() / 2)
            .attr("dy", ".35em")
            .text(d => d[groupBy])
            .style("cursor", "pointer")
            .on("click", function (event, d) {
                const selectedValue = document.getElementById("opSelector").value;
                const searchName = d[groupBy];

                let url;
                if (selectedValue === "all") {
                    url = surgeryOpTypeLinks[searchName];
                } else {
                    url = surgeryLinks[searchName];
                }

                if (url) {
                    window.open(url, '_blank');
                }
            });

        // Apply tooltip on bars
        svgContainer.selectAll(".bar-surgery")
            .on("mouseover", function (event, d) {
                tooltip.style("display", "block")
                    .html(`<strong>${d[groupBy]}</strong><br>Average Surgery Duration: ${d.surgery.toFixed(2)} min`)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 20}px`);
            })
            .on("mousemove", function (event) {
                tooltip.style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 20}px`);
            })
            .on("mouseout", function () {
                tooltip.style("display", "none");
            });
    }

    updateChart(data, "optype");

    document.getElementById("opSelector").addEventListener("change", function () {
        const selectedOpType = this.value;

        if (selectedOpType === "all") {
            updateChart(data, "optype");
        } else {
            const filteredData = data.filter(d => d.optype === selectedOpType);
            updateChart(filteredData, "opname");
        }
    });
}).catch(error => {
    console.error("Error loading CSV file:", error);
});
