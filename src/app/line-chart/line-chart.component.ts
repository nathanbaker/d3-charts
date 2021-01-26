import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';
import { sliderBottom } from 'd3-simple-slider';

@Component({
  selector: 'app-line-chart',
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.css']
})


export class LineChartComponent implements OnInit {

    private margin = {top: 40, right: 60, bottom: 40, left: 60};
    private width: number;
    private height: number;
    private svg: any;
    private selectedFromDate:any;
    private selectedToDate:any;
    private chartType:any = "line";

    constructor() { 

       this.width = 960 - this.margin.left - this.margin.right;
       this.height = 500 - this.margin.top - this.margin.bottom;
    }

    ngOnInit(): void {
      
      this.initData();

    }

    selectChart(e) {
      
      if(e.target.value!==this.chartType) {
        this.chartType = e.target.value;
        this.initData();
      }
    }


    private initData() {

      d3.selectAll("#slider-range").selectChildren().remove();
      d3.selectAll("svg > *").remove();

      if(this.chartType == "line")  {

        d3.json('/assets/data.json')
          .then((data) => this.buildLineGraph(data))
          .catch(function(error) {
            console.log(error);
            // Do some error handling.
          });
      }

      if(this.chartType == "bubble")  {
        
        d3.json('/assets/data.json')
          .then((data) => this.buildBubbleGraph(data))
          .catch(function(error) {
            console.log(error);
            // Do some error handling.
          });
      }


    }

    private buildSvg() {
      
      this.svg = d3.select('#graph')
        .append('g')
        .attr("transform",
        "translate(" + this.margin.left + "," + this.margin.top + ")");        
         //.attr("width", this.width + this.margin.left + this.margin.right)
         //.attr("height", this.height + this. margin.top + this.margin.bottom)  
    }

    private checkDate(data) {

      if(data) {
        if(this.selectedFromDate && this.selectedToDate) {
          if(data.date?.getTime() > this.selectedFromDate.getTime()
          && data.date?.getTime() < this.selectedToDate.getTime()) {
            return data;
          }
        } else {
          console.log('issue with date');
        }       
      } 
    }

    private buildBubbleGraph(dataSet) {

      this.svg = d3.select('#graph')
      .append('g')
      .attr("height", 950)
      .attr("width", 750)
      .attr("transform",
      "translate(" + this.margin.left + "," + this.margin.top + ")");        

       var parseDate = d3.timeParse("%Y-%m");
      
      dataSet.forEach(function(d) {
         d.date = parseDate(d.date)
         d.amount = +d.amount
      });
      
      dataSet.sort(function(a,b){
        return b.date - a.date;
      });

      // Find first and last months in date range
      var minDate = d3.min(d3.extent(dataSet, function(d:any) { return new Date(d.date); }));
      var maxDate = d3.max(d3.extent(dataSet, function(d:any) { return new Date(d.date); }));

      var minMonthlyAmounts = dataSet.filter((x) => this.getMonthlyFigure(x, minDate));
      var maxMonthlyAmounts = dataSet.filter((x) => this.getMonthlyFigure(x, maxDate));

      if(minMonthlyAmounts.length > 0) {

        var minAmount = minMonthlyAmounts[minMonthlyAmounts.length-1].amount;
        var maxAmount = maxMonthlyAmounts[maxMonthlyAmounts.length-1].amount;

        var percentageIncrease  = ( (maxAmount-minAmount)/100 );

        console.log(minAmount);
        console.log(maxAmount);

        this.createRangeSlider(dataSet);
      
        var xScale = d3.scaleLinear()
        .range([0, this.width])
        .domain([-100,100]);      

        var circle = this.svg
        .append("circle")
        .style("stroke", "red")
        .style("fill", "red")
        .attr("r", 50)
        .attr("cx", xScale(percentageIncrease))
        .attr("cy", 50);

        this.svg.append("text")
         .style("font-size", "16px")
         .style("font-family", "Arial, Helvetica, sans-serif")
         .style("color", "#ffffff")
         .attr("text-anchor","middle")
         .attr("stroke","white")
         .attr("x", xScale(percentageIncrease))
         .attr("y", 50)
         .text(percentageIncrease + "%");
         
         this.svg.append("path")
         .attr("d", d3.symbol(d3.symbolTriangle))
         .style("fill", "#ffffff")
         .attr("transform", "translate("+xScale(Number(percentageIncrease))+",70)")
          .attr('x', function(d) {
             return xScale(percentageIncrease);
           });

          var rect = this.svg.append("rect")
          .attr("x", 50)
          .attr("y", 0)
          .attr("height", 100)
          .attr("width", 800)
          .attr("fill", "#999999")
          .attr("opacity","0.3");

          this.svg.append('line')
          .style("stroke", "#666666")
          .style("stroke-width", 1)
          .attr("opacity","0.3")
          .attr("x1", 100)
          .attr("y1", 50)
          .attr("x2", 800)
          .attr("y2", 50);

          this.svg.append('line')
          .style("stroke", "#666666")
          .style("stroke-width", 1)
          .style("stroke-dasharray","5,5")
          .attr("opacity","0.3")
          .attr("x1", 400)
          .attr("y1", 0)
          .attr("x2", 400)
          .attr("y2", 100);               

          this.svg.selectAll("g").append(circle);

      }  
    }

    private buildLineGraph(jsonData) {
      
      this.buildSvg();
    
      // ********************************* Parse Data

      var parseDate = d3.timeParse("%Y-%m");
      
      var dataSet = jsonData;

      dataSet.forEach(function(d) {
        d.date = parseDate(d.date)
        d.amount = +d.amount
      });
      
      dataSet.sort(function(a,b){
        return b.date - a.date;
      });

      this.createRangeSlider(dataSet);

      // ********************************* X-Y Axis
    
      var xScale = d3.scaleTime().range([0, this.width]);
      var yScale = d3.scaleLinear().range([this.height, this.margin.top]);      

      xScale.domain(d3.extent(dataSet, function(d:any) { return new Date(d.date); }));
      yScale.domain([0, d3.max(dataSet, function(d) { return (d['amount']/1000); })]);

    // ********************************* Grid Lines

    var clipPath = this.svg.append("g")
    .append("clipPath")
    .attr("id", "clip")
    .append("rect")
    .attr("width", this.width)
    .attr("height", this.height);    

    // add the X gridlines
    this.svg.append("g")			
        .attr("class", "x-grid")
        .attr("transform", "translate(0," + this.height + ")")
        .style("font-size", "14px")
        .attr("stroke", "#dddddd")
        .attr("stroke-width", 0.5)
        .call(this.make_x_gridlines(xScale) 
            .ticks(dataSet.length)
            .tickSize(-this.height)
            .tickFormat(d3.timeFormat("%m/%y"))
        )

    // add the Y gridlines
    this.svg.append("g")			
        .attr("class", "y-grid")
        .attr("transform", "translate(0,0)")
        .style("font-size", "14px")
        .attr("stroke", "#dddddd")
        .attr("stroke-width", 0.5)              
        .call(this.make_y_gridlines(yScale)
            .ticks(10)
            .tickSize(-this.width)
            .tickFormat(d3.format("$,"))
        )

      // ********************************* Graph Area
      
      var area = d3.area()
      .x(function(d) { return  xScale(d['date']);  })
      .y0(this.height)
      .y1(function(d) { return yScale(d['amount']/1000);  });

      this.svg.append('path')      
      .data([dataSet])   
      .attr('width',this.svg.select(".x-grid").node().getBBox().hieght)
      .attr('hieght',this.svg.select(".x-grid").node().getBBox().hieght)
      .attr("stroke", "#6495ED")
      .attr("stroke-width", 2)
      .attr("fill-opacity", .3)
      .attr("fill", "#33D8FF")
      .attr("class", "area")
      .attr("d", area)
      .attr("clip-path", "url(#clip)");


    // ********************************* Dot Points

    this.svg.selectAll('dot')
    .data(dataSet)
    .enter().append('circle')
    .attr('r', 4)
    .attr("fill", 'white')
    .attr("stroke", "#6495ED")
    .attr("stroke-width", 2)  
    .attr('cx', function(d) {
      return xScale(d['date']);
    })
    .attr('cy', function(d) {
      return yScale(d['amount']/1000);
    })
    .attr("clip-path", "url(#clip)");


  }

  // gridlines in x axis function
  make_x_gridlines(x) {
    return d3.axisBottom(x)

  }
    // gridlines in y axis function
  make_y_gridlines(y) {
    return d3.axisLeft(y)
  }  

  private createRangeSlider(data) {

      // *********************************  Range Slider
      var minVal = d3.min(d3.extent(data, function(d:any) { return new Date(d.date); }));
      var maxVal = d3.max(d3.extent(data, function(d:any) { return new Date(d.date); }));

      var sliderRange =  sliderBottom()
      .domain(d3.extent(data, function(d:any) { return new Date(d.date); }))
      // .min(minVal)
      // .max(maxVal)
      .width(800)
      .tickFormat(d3.utcFormat("%b-%Y"))
      .fill('#ffff00')
      .default([minVal, maxVal])
      .on('onchange', val => {
        this.selectedFromDate = new Date(val[0]);
        this.selectedToDate = new Date(val[1]);

        if(this.chartType == "bubble") {
          this.updateBubbleData(data);
        }

        if(this.chartType == "line") {
          this.updateLineData(data)
        }
      });

    var gRange = d3
      .select('div#slider-range')
      .append('svg')
      .attr('width', 1000)
      .attr('height', 100)
      .append('g')
      .attr('transform', 'translate(30,30)');

      gRange.call(sliderRange);
  }

  // ** Update data section (Called from the onclick)
  private updateLineData(data) {

    var duration = 500;

    var dataSet = data.filter((x) => this.checkDate(x));

    var xScale = d3.scaleTime().range([0,this.width])
    var yScale = d3.scaleLinear().range([this.height, 0]);      

    xScale.domain(d3.extent(dataSet, function(d:any) { return new Date(d.date); }));
    yScale.domain([0, d3.max(dataSet, function(d) { return (d['amount']/1000); })]);
    
    if(dataSet.length > 0) {

        // Update Grid Lines
        this.svg.select(".x-grid")
        .transition()
        .duration(duration)
        .call(this.make_x_gridlines(xScale) 
           .ticks(dataSet.length)
           .tickSize(-this.height)
           .tickFormat(d3.timeFormat("%m/%y"))
        )

        // add the Y gridlines
        this.svg.select(".y-grid")
        .transition()
        .duration(duration)
         .call(this.make_y_gridlines(yScale)
             .ticks(10)
             .tickSize(-this.width)
             .tickFormat(d3.format("$,"))
        )


        // *********************   Update Area
        var area = d3.area()
        .x(function(d) { return  xScale(d['date']);  })
        .y0(this.height) 
        .y1(function(d) { return yScale(d['amount']/1000);  });      

        this.svg.selectAll('.area')
        .attr('class', 'area')
        .transition().duration(duration)
        .attr('d', area);


        // *********************   Update Dots

        this.svg.selectAll('circle')
        .transition()
        //.delay(duration)
        .duration(duration)      
        .attr('cx', function(d) {
          return xScale(d['date']);
        })
        .attr('cy', function(d) {
          return yScale(d['amount']/1000)
        })
    }
  }

  private getMonthlyFigure(data, date) {    
    
    if(data) {

      if(data.date?.getTime() === date?.getTime()) { 
        return data; 
      }
    }
  }

  private updateBubbleData(data) {

    var duration = 250;

    var dataSet = data.filter((x) => this.checkDate(x));

      // Find first and last months in date range
      var minDate = d3.min(d3.extent(dataSet, function(d:any) { return new Date(d.date); }));
      var maxDate = d3.max(d3.extent(dataSet, function(d:any) { return new Date(d.date); }));

      var minMonthlyAmounts = dataSet.filter((x) => this.getMonthlyFigure(x, minDate));
      var maxMonthlyAmounts = dataSet.filter((x) => this.getMonthlyFigure(x, maxDate));

      if(minMonthlyAmounts.length > 0) {

        var minAmount = minMonthlyAmounts[minMonthlyAmounts.length-1].amount;
        var maxAmount = maxMonthlyAmounts[maxMonthlyAmounts.length-1].amount;

        var percentageIncrease  = ((maxAmount-minAmount)/100);
              
        var xScale = d3.scaleLinear()
        .range([10, this.width])
        .domain([-500, 500]);              
        
        console.log("xScale:" + xScale(percentageIncrease) + " vs " + percentageIncrease);

        var circle = this.svg
        .selectAll("circle")
        .transition()
        .attr("cx", xScale(percentageIncrease))

        this.svg.selectAll("text")
        .transition()
        .attr("x", xScale(percentageIncrease))
        .text((Math.round(percentageIncrease * 100) / 100).toFixed(2)
        + "%");

        this.svg.selectAll("path")
        .transition()
        .attr("d", d3.symbol(d3.symbolTriangle))
        .style("color", "#ffffff")
        .attr("transform", "translate("+xScale(Number(percentageIncrease))+",70)")
        .attr('x', function(d) {
            return xScale(percentageIncrease);
          })
          .attr('y', 300)     


        this.svg.selectAll("g").append(circle);
      }
  }

}