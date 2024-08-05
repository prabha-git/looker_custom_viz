looker.plugins.visualizations.add({
  id: "btt_line_chart",
  label: "LCP Comparison Chart",
  options: {
    color_range: {
      type: "array",
      label: "Color Range",
      display: "colors",
      default: ["#007bff", "#28a745"]
    }
  },
  create: function(element, config) {
    element.innerHTML = '<div id="chartContainer" style="width:100%;height:100%;"></div>';
  },
  updateAsync: function(data, element, config, queryResponse, details, done) {
    // Check for errors
    if (!handleErrors(this, queryResponse, {
      min_pivots: 0,
      max_pivots: 0,
      min_dimensions: 1,
      max_dimensions: 1,
      min_measures: 2,
      max_measures: 2
    })) {
      return;
    }

    // Get the field names
    var dimensionName = queryResponse.fields.dimensions[0].name;
    var measure1Name = queryResponse.fields.measures[0].name;
    var measure2Name = queryResponse.fields.measures[1].name;

    // Get the field labels for series names
    var measure1Label = queryResponse.fields.measures[0].label_short || measure1Name;
    var measure2Label = queryResponse.fields.measures[1].label_short || measure2Name;

    var chartData = data.map(function(row) {
      return {
        x: row[dimensionName].value,
        y1: row[measure1Name].value,
        y2: row[measure2Name].value
      };
    });

    // Sort data by x value
    chartData.sort(function(a, b) {
      return new Date(a.x) - new Date(b.x);
    });

    // Prepare series data
    var series1Data = chartData.map(function(point) {
      return [new Date(point.x).getTime(), point.y1];
    });

    var series2Data = chartData.map(function(point) {
      return [new Date(point.x).getTime(), point.y2];
    });

    // Create the chart
    Highcharts.chart('chartContainer', {
      chart: {
        type: 'line'
      },
      title: {
        text: 'Metric Comparison Chart'
      },
      xAxis: {
        type: 'datetime',
        title: {
          text: 'Date'
        }
      },
      yAxis: {
        title: {
          text: 'Value'
        }
      },
      series: [{
        name: measure1Label,
        data: series1Data,
        color: config.color_range[0]
      }, {
        name: measure2Label,
        data: series2Data,
        color: config.color_range[1]
      }]
    });

    done();
  }
});
