looker.plugins.visualizations.add({
  id: "treemap",
  label: "Treemap",
  options: {
    color_range: {
      type: "array",
      label: "Color Range",
      display: "colors",
      default: ["#dd3333", "#80ce5d", "#f78131", "#369dc1", "#c572d3", "#36c1b3", "#b57052", "#ed69af"]
    }
  },
  create: function(element, config) {
    console.log("Create function called");
    this.svg = d3.select(element).append("svg");
    console.log("SVG created");
  },
  update: function(data, element, config, queryResponse) {
    console.log("Update function called");
    console.log("Data:", data);
    console.log("Config:", config);
    console.log("Query Response:", queryResponse);

    try {
      if (Object(i.b)(this, queryResponse, {
        min_pivots: 0,
        max_pivots: 0,
        min_dimensions: 1,
        max_dimensions: undefined,
        min_measures: 1,
        max_measures: 1
      })) {
        var o = element.clientWidth,
            a = element.clientHeight;
        console.log("Container size:", o, a);

        if (o <= 0 || a <= 0) {
          console.error("Invalid dimensions:", o, a);
          return;
        }

        var c = queryResponse.fields.dimension_like,
            f = queryResponse.fields.measure_like[0];

        if (!c.length || !f) {
          console.error("Missing required fields:", c, f);
          return;
        }

        var s = Object(i.a)(f.value_format) || function(t) {
          return t.toString()
        };
        var l = d3.scaleOrdinal().range(config.color_range);
        console.log("Color scale:", l.range());

        data.forEach(function(t) {
          t.taxonomy = {
            value: c.map(function(n) {
              return t[n.name].value
            })
          }
        });

        var h = d3.treemap()
          .size([o, a - 16])
          .tile(d3.treemapSquarify.ratio(1))
          .paddingOuter(1)
          .paddingTop(function(t) {
            return 1 === t.depth ? 16 : 0
          })
          .paddingInner(1)
          .round(!0);

        var d = this.svg.html("").attr("width", "100%").attr("height", "100%")
          .append("g")
          .attr("transform", "translate(0,16)");

        var p = d.append("text").attr("y", -5).attr("x", 4);

        var v = d3.hierarchy(function(t) {
          var n = {};
          return t.forEach(function(t) {
            var e = n;
            t.taxonomy.value.forEach(function(t) {
              e[t] = t in e ? e[t] : {};
              e = e[t]
            });
            e.__data = t
          }), {
            name: "root",
            children: function t(n, e) {
              void 0 === e && (e = 0);
              var r = [];
              for (var i in n)
                if ("__data" !== i) {
                  var u = {
                    name: i,
                    depth: e,
                    children: t(n[i], e + 1)
                  };
                  "__data" in n[i] && (u.data = n[i].__data), r.push(u)
                } return r
            }(n, 1),
            depth: 0
          }
        }(data)).sum(function(t) {
          return "data" in t ? t.data[f.name].value : 0
        });

        console.log("Hierarchy data:", v);

        h(v);
        console.log("Treemap data:", v.descendants());

        var g = d.selectAll(".node")
          .data(v.descendants())
          .enter().append("g")
          .attr("transform", function(t) {
            return "translate(" + t.x0 + "," + t.y0 + ")"
          })
          .attr("class", function(t, n) {
            return "node depth-" + t.depth
          })
          .style("stroke-width", 1.5)
          .style("cursor", "pointer")
          .on("click", function(t) {
            return console.log(t)
          })
          .on("mouseenter", function(t) {
            var n = t.ancestors();
            p.text(n.map(function(t) {
              return t.data.name
            }).slice(0, -1).reverse().join("-") + ": " + s(t.value));
            d.selectAll("g.node rect").style("stroke", null).filter(function(t) {
              return n.indexOf(t) > -1
            }).style("stroke", "#fff")
          })
          .on("mouseleave", function(t) {
            p.text("");
            d.selectAll("g.node rect").style("stroke", function(t) {
              return null
            })
          });

        g.append("rect")
          .attr("id", function(t, n) {
            return "rect-" + n
          })
          .attr("width", function(t) {
            return t.x1 - t.x0
          })
          .attr("height", function(t) {
            return t.y1 - t.y0
          })
          .style("fill", function(t) {
            if (0 === t.depth) return "none";
            var n = t.ancestors().map(function(t) {
              return t.data.name
            }).slice(-2, -1)[0];
            var e = [l(n), "#ddd"];
            return d3.scaleLinear().domain([1, 6.5]).range(e)(t.depth)
          });

        console.log("Rectangles created");

        g.append("clipPath")
          .attr("id", function(t, n) {
            return "clip-" + n
          })
          .append("use")
          .attr("xlink:href", function(t, n) {
            return "#rect-" + n
          });

        g.append("text")
          .style("opacity", function(t) {
            return 1 === t.depth ? 1 : 0
          })
          .attr("clip-path", function(t, n) {
            return "url(#clip-" + n + ")"
          })
          .attr("y", function(t) {
            return 1 === t.depth ? "13" : "10"
          })
          .attr("x", 2)
          .style("font-family", "Helvetica, Arial, sans-serif")
          .style("fill", "white")
          .style("font-size", function(t) {
            return 1 === t.depth ? "14px" : "10px"
          })
          .text(function(t) {
            return "root" === t.data.name ? "" : t.data.name
          });

        console.log("Text elements created");

        // Log the attributes of rectangles and text elements
        g.selectAll("rect").each(function(d) {
          console.log("Rectangle:", d3.select(this).attr("width"), d3.select(this).attr("height"));
        });

        g.selectAll("text").each(function(d) {
          console.log("Text:", d3.select(this).text(), d3.select(this).attr("x"), d3.select(this).attr("y"));
        });

      }
    } catch (error) {
      console.error("Error in update function:", error);
    }
  }
});
