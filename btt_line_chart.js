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
    console.log("Create function called");
    element.innerHTML = `
      <style>
        .lcp-chart {
          width: 100%;
          height: 100%;
        }
        .error-message {
          color: red;
          font-weight: bold;
        }
      </style>
      <div class="lcp-chart"></div>
      <div class="error-message"></div>
    `;
    this.chart = null;
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    console.log("UpdateAsync function called");
    this.clearErrors();
    
    const errorMessageElement = element.querySelector('.error-message');
    errorMessageElement.textContent = '';

    console.log("Data:", JSON.stringify(data, null, 2));
    console.log("Query Response:", JSON.stringify(queryResponse, null, 2));

    if (data.length === 0) {
      console.log("No data returned from query");
      this.addError({title: "No Data", message: "The query returned no results."});
      errorMessageElement.textContent = "Error: No data returned from query";
      return;
    }

    try {
      console.log("Searching for date dimension");
      const dateField = queryResponse.fields.dimensions.find(d => d.type === 'date' || d.type === 'datetime')?.name;
      console.log("Date field found:", dateField);

      console.log("Searching for measure");
      const measureField = queryResponse.fields.measures[0]?.name;
      console.log("Measure field found:", measureField);

      if (!dateField) {
        console.log("No date dimension found");
        this.addError({title: "No Date Dimension", message: "This chart requires a date dimension."});
        errorMessageElement.textContent = "Error: No date dimension found";
        return;
      }
      if (!measureField) {
        console.log("No measure found");
        this.addError({title: "No Measure", message: "This chart requires a measure."});
        errorMessageElement.textContent = "Error: No measure found";
        return;
      }

      console.log("Transforming data");
      const chartData = data.map(row => ({
        date: row[dateField].value,
        value: row[measureField].value
      }));
      console.log("Transformed data:", chartData);

      const chartContainer = element.querySelector('.lcp-chart');

      if (this.chart) {
        console.log("Destroying existing chart");
        this.chart.destroy();
      }

      console.log("Creating new chart");
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

      console.log("Chart created successfully");
      done();
    } catch (error) {
      console.error("Error in visualization:", error);
      this.addError({title: "Error", message: "An error occurred while rendering the visualization. Check the console for details."});
      errorMessageElement.textContent = `Error: ${error.message}`;
    }
  }
});
