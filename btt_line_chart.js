looker.plugins.visualizations.add({
  id: "btt_line_chart",
  label: "LCP Comparison Chart",
  options: {
    color_this_period: {
      type: "string",
      label: "This Period Color",
      default: "#007bff"
    },
    color_previous_period: {
      type: "string",
      label: "Previous Period Color",
      default: "#28a745"
    }
  },
  
  create: function(element, config) {
    element.innerHTML = `
      <style>
        .lcp-chart {
          width: 100%;
          height: 100%;
        }
      </style>
      <div class="lcp-chart"></div>
    `;
    this.chart = null;
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    this.clearErrors();

    console.log("Data:", data);
    console.log("Query Response:", queryResponse);

    if (data.length === 0) {
      this.addError({title: "No Data", message: "The query returned no results."});
      return;
    }

    try {
      const dateField = queryResponse.fields.dimensions.find(d => d.type === 'date' || d.type === 'datetime')?.name;
      const measureField = queryResponse.fields.measures[0]?.name;

      if (!dateField) {
        this.addError({title: "No Date Dimension", message: "This chart requires a date dimension."});
        return;
      }
      if (!measureField) {
        this.addError({title: "No Measure", message: "This chart requires a measure."});
        return;
      }

      const chartData = data.map(row => ({
        date: row[dateField].value,
        value: row[measureField].value
      }));

      const chartContainer = element.querySelector('.lcp-chart');

      if (this.chart) {
        this.chart.destroy();
      }

      this.chart = Highcharts.chart(chartContainer, {
        title: {
          text: 'Data Over Time'
        },
        xAxis: {
          type: 'datetime',
          title: {
            text: 'Date'
          }
        },
        yAxis: {
          title: {
            text: queryResponse.fields.measures[0].label_short || 'Value'
          }
        },
        series: [{
          name: measureField,
          data: chartData.map(d => [new Date(d.date).getTime(), parseFloat(d.value)]),
          color: config.color_this_period
        }]
      });

      done();
    } catch (error) {
      console.error("Error in visualization:", error);
      this.addError({title: "Error", message: "An error occurred while rendering the visualization. Check the console for details."});
    }
  }
});
