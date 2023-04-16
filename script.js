// This JavaScript file is an implementation of a D3 Sunburst visualization that fetches data from a JSON file.
// The visualization provides several interactive features, including:
// - Checkbox filtering for root's children
// - Updating the visualization based on selected children
// - Changing color schemes for colorblind users
// - Increasing and decreasing text size
// - Bold and reset text styles
// - Clickable arcs for drilling down into deeper levels of the hierarchy

// The getData function fetches data from the JSON file and returns the parsed JSON data.
async function getData() {
    const response = await fetch('data/data.json');
    const jsonData = await response.json();
    return jsonData;
}

// The main function is the entry point of the script, where the visualization is created and rendered.
async function main() {
    var root = await getData();

    var width = window.innerWidth,
        height = window.innerHeight,
        radius = Math.min(width, height) * 0.48;

    var svg = d3.select(".visualization").append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`)
        .append("g").attr("transform", "translate(" + width / 2 + "," + (height / 2 + 10) + ") rotate(-90 0 0)");

    // Create checkboxes for children
    var checkboxContainer = d3.select(".checkbox-container");
    root.children.forEach((child, index) => {
        if (index === 0){
            index = 2
        } else if (index === 1) {
            index = 3
        } else if (index === 2) {
            index = 0
        } else if (index === 3) {
            index = 1
        }

        checkboxContainer.append("input")
            .attr("type", "checkbox")
            .attr("id", `checkbox-${index}`)
            .attr("checked", true);

        checkboxContainer.append("label")
            .attr("for", `checkbox-${index}`)
            .text(child.name);

        checkboxContainer.append("br");
    });

    // Function to update the visualization based on the selected children
    function updateVisualization() {
        // Filter the children based on the selected checkboxes
        var selectedChildren = root.children.filter((_, index) => {
            return document.getElementById(`checkbox-${index}`).checked;
        });

        // Create a new root object with the selected children
        var newRoot = {
            name: root.name,
            children: selectedChildren
        };
        // Clear the existing visualization
        svg.selectAll("*").remove();

        // Render the new visualization
        renderVisualization(newRoot);
    }

    // Render the visualization initially
    renderVisualization(root);

    // The renderVisualization function is responsible for drawing the Sunburst chart based on the provided root node.
    function renderVisualization(root) {
        var x = d3.scale.linear().range([0, 2 * Math.PI]);

        var y = d3.scale.sqrt()
            .range([0, radius])

        var color = d3.scale.category20();

        // The Sunburst visualization uses D3's partition layout to calculate the arc sizes and positions based on the hierarchical data.
        var partition = d3.layout.partition()
            .value(function (d) {
                return d.size;
            });

        var arc = d3.svg.arc()
            .startAngle(function (d) {
                return Math.max(0, Math.min(2 * Math.PI, x(d.x)));
            })
            .endAngle(function (d) {
                return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx)));
            })
            .innerRadius(function (d) {
                return Math.max(0, y(d.y));
            })
            .outerRadius(function (d) {
                return Math.max(0, y(d.y + d.dy));
            });

        var g = svg.selectAll("g")
            .data(partition.nodes(root)).enter().append("g");

        var path = g.append("path").attr("d", arc)
            .style("fill", function (d) {
                return color((d.children ? d : d.parent).name);
            })
            .on("click", click)
            .on("mouseover", onMouseOver)
            .on("mouseout", onMouseOut)
            .attr("opacity", function(d) {
                return d.depth <= 1 ? 1 : 0;
            })
            .style("pointer-events", function(d) {
                return d.depth <= 1 ? "auto" : "none";
            });

        var textSize = "20"

        var text = g.append("text")
            .attr("x", function (d) {
                return y(d.y);
            })
            .attr("dx", "8")
            .attr("dy", ".35em")
            .attr("transform", function (d) {
                return "rotate(" + computeTextRotation(d) + ")";
            })
            .text(function (d) {
                return d.name;
            })
            .style("fill", "#f7f7f7")
            .style("font-size", textSize+"px")
            .attr("opacity", function(d) {
                return d.depth <= 1 ? 1 : 0;
            })
            .style("pointer-events", function(d) {
                return d.depth <= 1 ? "auto" : "none";
            });

        // The visualization supports different color schemes to cater to users with color vision deficiencies.
        // Color scale for Protanomaly (Red-Weak)
        var protanomalyColor = d3.scale.ordinal().range([
            "#009E73",
            "#F0E442",
            "#0072B2",
            "#D55E00",
            "#CC79A7",
        ]);

        // Color scale for Deuteranomaly (Green-Weak)
        var deuteranomalyColor = d3.scale.ordinal().range([
            "#0072B2",
            "#F0E442",
            "#009E73",
            "#D55E00",
            "#CC79A7",
        ]);

        // Color scale for Tritanomaly (Blue-Weak)
        var tritanomalyColor = d3.scale.ordinal().range([
            "#D55E00",
            "#F0E442",
            "#0072B2",
            "#009E73",
            "#CC79A7",
        ]);

        // Color scale for Protanopia (Red-Blind)
        var protanopiaColor = d3.scale.ordinal().range([
            "#009E73",
            "#E69F00",
            "#56B4E9",
            "#D55E00",
            "#CC79A7",
        ]);

        // Color scale for Deuteranopia (Green-Blind)
        var deuteranopiaColor = d3.scale.ordinal().range([
            "#0072B2",
            "#E69F00",
            "#56B4E9",
            "#D55E00",
            "#CC79A7",
        ]);

        // Color scale for Tritanopia (Blue-Blind)
        var tritanopiaColor = d3.scale.ordinal().range([
            "#D55E00",
            "#E69F00",
            "#56B4E9",
            "#009E73",
            "#CC79A7",
        ]);

        // Color scale for Monochromacy/Achromatopsia
        var achromatopsiaColor = d3.scale.ordinal().range([
            "#CCCCCC",
            "#999999",
            "#666666",
            "#333333",
            "#000000",
        ]);

        // Color scale for Blue Cone Monochromacy
        var blueConeMonochromacyColor = d3.scale.ordinal().range([
            "#AA00AA",
            "#550055",
            "#AADDAA",
            "#558855",
            "#999999",
        ]);

        // The text size and style can be adjusted using the provided buttons, and the arcs can be clicked to drill down into deeper levels of the hierarchy.
        function increaseTextSize() {
            textSize = Number(textSize) + 1
            text.style("font-size", textSize);
        }

        function decreaseTextSize() {
            textSize = Number(textSize) - 1
            text.style("font-size", textSize);
        }

        function boldtext() {
            text.style("font-weight", "bold")
        }

        function defaulttext() {
            text
                .style("font-weight", "normal")
                .style("font-size", "20px") // Set this value to your default font size
                .style("fill", "#f7f7f7") // Set this value to your default text color
                .style("text-shadow", "none");
        }

        function onMouseOver(d) {
            var tooltip = d3.select(".tooltip");
            tooltip.transition().duration(200).style("opacity", 1);
            tooltip.html(`<b>Name:</b> ${d.name}<br><b>Size:</b> ${d.size || 0}`);
            d3.select(this).style("cursor", "pointer");
        }

        function onMouseOut() {
            var tooltip = d3.select(".tooltip");
            tooltip.transition().duration(500).style("opacity", 0);
            d3.select(this).style("cursor", "default");
        }

        function computeTextRotation(d) {
            var angle = x(d.x + d.dx / 2) - Math.PI / 2;
            return angle / Math.PI * 180;
        }

        function click(d) {
            if (d.size !== undefined) {
                d.size += 100;
            };

            if (d.depth === 0) {
                path
                    .attr("opacity", function(d) {
                        return d.depth <= 1 ? 1 : 0;
                    })
                    .style("pointer-events", function(d) {
                        return d.depth <= 1 ? "auto" : "none";
                    });
                text
                    .attr("opacity", function(d) {
                        return d.depth <= 1 ? 1 : 0;
                    })
                    .style("pointer-events", function(d) {
                        return d.depth <= 1 ? "auto" : "none";
                    });
            } else if (d.depth === 1) {
                path
                    .attr("opacity", function(d) {
                        return d.depth <= 2 ? 1 : 0;
                    })
                    .style("pointer-events", function(d) {
                        return d.depth <= 2 ? "auto" : "none";
                    });
                text
                    .attr("opacity", function(d) {
                        return d.depth <= 2 ? 1 : 0;
                    })
                    .style("pointer-events", function(d) {
                        return d.depth <= 2 ? "auto" : "none";
                    });
            } else if (d.depth === 2) {
                path
                    .attr("opacity", function (d) {
                        return d.depth <= 3 ? 1 : 0;
                    })
                    .style("pointer-events", function(d) {
                        return d.depth <= 3 ? "auto" : "none";
                    });
                text
                    .attr("opacity", function(d) {
                        return d.depth <= 3 ? 1 : 0;
                    })
                    .style("pointer-events", function(d) {
                        return d.depth <= 3 ? "auto" : "none";
                    });
            } else if (d.depth === 3) {
                path
                    .attr("opacity", function (d) {
                        return d.depth <= 4 ? 1 : 0;
                    })
                    .style("pointer-events", function (d) {
                        return d.depth <= 4 ? "auto" : "none";
                    });
                text
                    .attr("opacity", function (d) {
                        return d.depth <= 4 ? 1 : 0;
                    })
                    .style("pointer-events", function (d) {
                        return d.depth <= 4 ? "auto" : "none";
                    });
            }

            text.style("font-size", textSize + "px");

            text.transition().attr("opacity", 0);

            path.transition().duration(750)
                .attrTween("d", arcTween(d))
                .each("end", function (e, i) {
                    if (e.x >= d.x && e.x < (d.x + d.dx)) {
                        var arcText = d3.select(this.parentNode).select("text");
                        arcText.transition().duration(750)
                            .attr("opacity", 1)
                            .attr("transform", function () {
                                return "rotate(" + computeTextRotation(e) + ")"
                            })
                            .attr("x", function (d) {
                                return y(d.y);
                            });
                    }
                })

        }

        // The script also includes helper functions for handling arc animations and updating the color scheme.
        function arcTween(d) {
            var xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]),
                yd = d3.interpolate(y.domain(), [d.y, 1]),
                yr = d3.interpolate(y.range(), [d.y ? 20 : 0, radius]);
            return function (d, i) {
                return i ? function (t) {
                    return arc(d);
                } : function (t) {
                    x.domain(xd(t));
                    y.domain(yd(t)).range(yr(t));
                    return arc(d);
                };
            };
        }

        function updateColorScheme(scheme) {
            if (scheme === 'default') {
                color = d3.scale.category20();
                path.style("fill", function (d) {
                    return color((d.children ? d : d.parent).name);
                });
            } else if (scheme === 'protanomaly') {
                color = protanomalyColor;
                path.style("fill", function (d) {
                    return color((d.children ? d : d.parent).name);
                });
            } else if (scheme === 'deuteranomaly') {
                color = deuteranomalyColor;
                path.style("fill", function (d) {
                    return color((d.children ? d : d.parent).name);
                });
            } else if (scheme === 'tritanomaly') {
                color = tritanomalyColor;
                path.style("fill", function (d) {
                    return color((d.children ? d : d.parent).name);
                });
            } else if (scheme === 'protanopia') {
                color = protanopiaColor;
                path.style("fill", function (d) {
                    return color((d.children ? d : d.parent).name);
                });
            } else if (scheme === 'deuteranopia') {
                color = deuteranopiaColor;
                path.style("fill", function (d) {
                    return color((d.children ? d : d.parent).name);
                });
            } else if (scheme === 'tritanopia') {
                color = tritanopiaColor;
                path.style("fill", function (d) {
                    return color((d.children ? d : d.parent).name);
                });
            } else if (scheme === 'achromatopsia') {
                color = achromatopsiaColor;
                path.style("fill", function (d) {
                    return color((d.children ? d : d.parent).name);
                });
            } else if (scheme === 'blueConeMonochromacy') {
                color = blueConeMonochromacyColor;
                path.style("fill", function (d) {
                    return color((d.children ? d : d.parent).name);
                });
            }
        }

        // Update the visualization when the "Update Visualization" button is clicked
        document.getElementById("update-btn").addEventListener("click", updateVisualization);

        // Interactions with the visualization are managed through event listeners and callbacks.
        document.getElementById("increase-text-size").addEventListener("click", increaseTextSize);

        document.getElementById("decrease-text-size").addEventListener("click", decreaseTextSize);

        document.getElementById("bold-text").addEventListener("click", boldtext);

        document.getElementById("default-text").addEventListener("click", defaulttext);

        document.getElementById("color-scheme").addEventListener("change", function () {
            updateColorScheme(this.value);
        });

        document.getElementById('go-to-description').addEventListener('click', function() {
            window.location.href = 'description.html';
        });

        document.getElementById('go-to-visualization').addEventListener('click', function() {
            window.location.href = 'index.html';
        });

        d3.select(self.frameElement).style("height", height + "px");
    }
}

main();