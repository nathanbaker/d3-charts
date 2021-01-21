import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';
import { sliderBottom } from 'd3-simple-slider';

@Component({
  selector: 'app-line-chart',
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.css']
})


export class LineChartComponent implements OnInit {

    private margin = {top: 20, right: 20, bottom: 30, left: 50};
    private width: number;
    private height: number;
    private svg: any;
    private dynamicDataSet: any;
    private selectedDate:any;

    constructor() { 

      this.width = 960 - this.margin.left - this.margin.right;
      this.height = 500 - this.margin.top - this.margin.bottom;
      this.selectedDate = new Date();
    }

    ngOnInit(): void {
      
      this.buildSvg();
      this.initData();
    }

    private initData() {
        
      d3.json('/assets/data.json')
      .then((data) => this.buildGraph(data))
      .catch(function(error) {
        console.log(error);
        // Do some error handling.
      });
    }

    private buildSvg() {
      console.log('building svg');

      this.svg = d3.select('svg') // svg element from html
        .append('g')   // appends 'g' element for graph design
        .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');
    }

    private checkDate(data) {

      if(data) {
        if(this.selectedDate) {
          if(data.date?.getTime() > this.selectedDate.getTime()) {
            return data;
          }
        }        
      } 
    }
    private buildGraph(jsonData) {

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

      this.dynamicDataSet = dataSet;

      // ********************************* X-Y Axis
    
      var xScale = d3.scaleTime().range([0, this.width]);
      var yScale = d3.scaleLinear().range([this.height, 0]);      

      xScale.domain(d3.extent(this.dynamicDataSet, function(d:any) { return new Date(d.date); }));
      yScale.domain([0, d3.max(this.dynamicDataSet, function(d) { return (d['amount']/1000); })]);

      this.svg.append('g')
          .attr('transform', 'translate(0,' + this.height + ')')          
          .attr('class', 'axis-x')
          //.call(d3Axis.axisBottom(xScale)
          //.tickFormat(d3.timeFormat("%m/%y")));        
      
      this.svg.append('g')
          .attr('class', 'axis-y')
          //.call(d3Axis.axisLeft(yScale));


      // ********************************* Grid Lines

    // add the X gridlines
    this.svg.append("g")			
        .attr("class", "x-grid")
        .attr("transform", "translate(0," + this.height + ")")
        .attr("stroke", "#dddddd")
        .attr("stroke-width", 0.5)
        .call(this.make_x_gridlines(xScale) 
            .tickSize(5)
            .tickFormat(d3.timeFormat("%m/%y"))
        )

    // add the Y gridlines
    this.svg.append("g")			
        .attr("class", "y-grid")
        .attr("stroke", "#dddddd")
        .attr("stroke-width", 0.5)      
        .call(this.make_y_gridlines(yScale)
            .tickSize(5)
        )

      // ********************************* Graph Area
      
      var area = d3.area()
      .x(function(d) { return  xScale(d['date']);  })
      .y0(this.height)
      .y1(function(d) { return yScale(d['amount']/1000);  });
      //.curve(d3.curveCardinal);

      this.svg.append('path')
      .data([dataSet])   
      .attr("stroke", "#6495ED")
      .attr("stroke-width", 2)
      .attr("fill", "#33D8FF")
      .attr("class", "area")
      .attr("d", area) ;

    // ********************************* Dot Points

    this.svg.selectAll('dot')
    .data(dataSet)
    .enter().append('circle')
    .attr('r', 4)
    .attr("fill", 'none')
    .attr("stroke", "#6495ED")
    .attr("stroke-width", 2)  
    .attr('cx', function(d) {
      return xScale(d['date']);
    })
    .attr('cy', function(d) {
      return yScale(d['amount']/1000);
    })

      // *********************************  Range Slider
      var sliderRange =  sliderBottom()
      .domain(d3.extent(this.dynamicDataSet, function(d:any) { return new Date(d.date); }))
      .width(800)
      .tickFormat(d3.utcFormat("%b-%Y"))
      .ticks(10)
      .fill('#2196f3')
      .on('onchange', val => {
        //this.selectedDate = d3.select('p#value-range').text(d3.timeFormat('%b-%Y')(val));
        this.selectedDate = val;
        this.updateData(this.dynamicDataSet);
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

  // gridlines in x axis function
  make_x_gridlines(x) {
    return d3.axisBottom(x).ticks(5)
  }
    // gridlines in y axis function
  make_y_gridlines(y) {
    return d3.axisLeft(y).ticks(5)
  }  

  // ** Update data section (Called from the onclick)
  private updateData(data) {

    var duration = 250;

    var dataSet = data.filter((x) => this.checkDate(x));

    var xScale = d3.scaleTime().range([0, this.width]);
    var yScale = d3.scaleLinear().range([this.height, 0]);      

    xScale.domain(d3.extent(dataSet, function(d:any) { return new Date(d.date); }));
    yScale.domain([0, d3.max(dataSet, function(d) { return (d['amount']/1000); })]);

    // Update Grid Lines
    this.svg.select(".x-grid")
    //.attr('class', 'x-grid')
    .transition()
    .call(this.make_x_gridlines(xScale) 
        .tickSize(-this.height)
        .tickFormat(d3.timeFormat("%m/%y"))
    )

    // add the Y gridlines
    this.svg.select(".y-grid")
    .transition()
    //.attr('class', 'y-grid')
    .duration(duration)
    .call(this.make_y_gridlines(yScale)
        .tickSize(-this.width)
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