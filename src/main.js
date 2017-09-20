import Vue from 'vue';
import * as d3 from 'd3';
//import * as d3s from 'd3-scale-chromatic';
import axios from 'axios';

const ToolTip = {
  name:'ToolTip',
  props:['data'],
  data: function(){
    return {
      months: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct', 'Nov','Dec']
    };
  },
  template:`
  <div class='tool-tip'>
    <h3>{{data.year}} - {{months[data.month-1]}}</h3>
    <p>{{(8.66+data.variance).toFixed(2)}} &#8451</p>
    <p>{{data.variance}} &#8451</p>
  </div>
  `,
};

new Vue({
  name:'App',
  el: '#app',
  data:{
    data: [],
    base_temp: 8.66,
    tt_data: {},
  },
  template:`
  <div class="container">
    <div class="title">
      <h1>Monthly Global Land-Surface Temperature (1753 - 2015)</h1>
    </div>
    <svg class="chart"></svg>
    <tool-tip :data="tt_data"/>
  </div>
  `,
  components:{
    'tool-tip': ToolTip,
  },
  mounted:function(){
    axios.get('https://raw.githubusercontent.com/FreeCodeCamp/ProjectReferenceData/master/global-temperature.json')
      .then(resp =>{
        //console.log(resp.data);
        this.data = resp.data.monthlyVariance;
        this.base_temp = resp.data.baseTemperature;
        this.do_d3();
      });
  },
  methods:{
    do_d3: function(){
      const svg_height = 600;
      const svg_width = 262*4 + 200;
      const chart_height = 408;
      const chart_width = 262*4;
      const bar_height = chart_height/12;
      const bar_width = chart_width/(this.data.length/12);

      const colors = ['#65a', '#38c', '#6ca', '#ada', '#efa', '#ffc', '#fe9', '#fb6', '#f74', '#d45', '#a04'];

      let tooltip = d3.select('.tool-tip')
        .style('position', 'absolute')
        .style('display', 'none');

      let chart = d3.select('.chart')
        .attr('height', svg_height)
        .attr('width', svg_width);

      let min_temp = d3.min(this.data, d=>{return d.variance;});
      let max_temp = d3.max(this.data, d=>{return d.variance;});
      let min_year = Date.parse(1753);
      let max_year = d3.max(this.data, d=>{return Date.parse(d.year);});
      //console.log(max_year - min_year);

      let color = d3.scaleQuantile()
        .domain([min_temp, max_temp])
        .range(colors);

      let x = d3.scaleTime()
        .domain([min_year, max_year])
        .range([0, chart_width]);

      let y = d3.scaleLinear()
        .domain([1, 12])
        .range([0, chart_height-34]);

      let x_axis = d3.axisBottom(x);

      let y_axis = d3.axisLeft(y);

      let key = chart.selectAll('g')
        .data(colors)
        .enter()
        .append('g');

      key.append('rect')
        .attr('x', (d,i) => {
          return (svg_width/2-22) + (i * 50);
        })
        .attr('y', 25)
        .attr('width', 50)
        .attr('height', 25)
        .style('fill', d =>{
          return d;
        });

      let temp_scale = this.make_scale(max_temp, min_temp);

      key.append('text')
        .attr('x', (d,i) => {
          return (svg_width/2-22) + (i * 50) + 5;
        })
        .attr('y', 65)
        .text((d,i)=>{return temp_scale[i] + ' ℃';})
        .style('font-size','12px');

      chart.append('g')
        .attr('width', chart_width)
        .attr('height', 30)
        .attr('transform','translate(100,'+(chart_height+100)+' )')
        .call(x_axis);

      chart.append('text')
        .attr('transform','translate('+svg_width/2+','+(chart_height+150)+')')
        .text('Year');

      chart.append('g')
        .attr('width', 30)
        .attr('height', chart_height)
        .attr('transform', 'translate(100,103)')
        .call(y_axis);

      chart.append('text')
        .attr('x',-svg_height/2)
        .attr('y', 70)
        .attr('transform','rotate(-90)')
        .text('Month');

      let cell = chart.selectAll('g')
        .data(this.data)
        .enter()
        .append('g');

      cell.append('rect')
        .attr('x', d=>{return x(Date.parse(d.year));})
        .attr('y', d=>{return d.month * bar_height;})
        .attr('width', bar_width)
        .attr('height', bar_height)
        .attr('transform', 'translate(100,50)')
        .style('fill', d =>{
          //console.log(color(d.variance));
          return color(d.variance);
        })
        .on('mouseover', d =>{
          tooltip
            .style('display', 'inline-block')
            .style('left', d3.event.pageX + 'px')
            .style('top', d3.event.pageY - 100 + 'px');
          this.tt_data = d;
        })
        .on('mouseout', () =>{
          tooltip
            .style('display', 'none');
          this.tt_data = {};
        });



    },
    //use min and max temps to create scale array
    make_scale: function(max_temp, min_temp){
      let range = (max_temp) - (min_temp);
      let steps = 10;
      let scale = [new Number(0)];
      for(let i = 1; i <= steps; i++){
        let val = new Number((scale[i-1]+(range/steps)));
        scale.push(val);
      }
      return scale.map(i =>{
        return i.toFixed(1);
      });
    }
  },
});
