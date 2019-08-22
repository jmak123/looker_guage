/* eslint-disable no-magic-numbers */
import * as d3 from 'd3';

// eslint-disable-next-line max-statements
const gauge = (container, _value, _target)=> {

  // make new data features
  let range;
  let r;
  let pointerHeadLength;
  let svg;
  let arc;
  let scale;
  let ticks;
  let ticksValue;
  let tickData;
  let pointer;
  
  const perc = ()=> {
    if (_value <= _target * 1.5) {
      return _value / _target;
    } else if (_value < 0) {
      return 0;
    }
    return 1.55;
  };
    
  const maxWidth = container.clientWidth;
  const maxHeight = container.clientHeight;
  const sizeMin = Math.min(maxWidth, maxHeight);

  const that = {};
  const config = {
    size: sizeMin * 1.25,
    clipWidth: sizeMin * 1.2,
    clipHeight: sizeMin * 1.2,
    ringInset: sizeMin * 0.14,
    ringWidth: sizeMin * 0.1,

    pointerWidth: sizeMin * 0.05,
    pointerTailLength: sizeMin * 0.025,
    pointerHeadLengthPercent: 0.8,

    textboxWidth: sizeMin * 0.5,
    textboxHeight: sizeMin * 0.1,

    minValue: 0,
    maxValue: 1.5,

    minAngle: -80,
    maxAngle: 80,

    transitionMs: 2000,

    majorTicks: 3,
    labelFormat: d3.format('.0%'),
    labelInset: sizeMin * 0.1,
    fontSize: sizeMin * 0.04,

    arcColorFn: d3.interpolateHsl(d3.rgb('#ffffcc'), d3.rgb('#264905'))
  };

  function deg2rad(deg) {
    return deg * Math.PI / 180;
  }

  function configure() {
    range = config.maxAngle - config.minAngle;
    r = config.size / 2;
    pointerHeadLength = Math.round(r * config.pointerHeadLengthPercent);

    scale = d3.scaleLinear()
      .domain([config.minValue, config.maxValue]);
    ticks = scale.ticks(config.majorTicks);
    ticksValue = ticks.map((tick)=> tick * _target);

    tickData = d3.range(config.majorTicks).map(()=> 1 / config.majorTicks);
    arc = d3.arc()
      .innerRadius(r - config.ringWidth - config.ringInset)
      .outerRadius(r - config.ringInset)
      .startAngle((d, i)=> {
        const ratio = d * i;
        return deg2rad(config.minAngle + (ratio * range));
      })
      .endAngle((d, i)=> {
        const ratio = d * (i+1);
        return deg2rad(config.minAngle + (ratio * range));
      });
  }

  function centerTranslation(_width) {
    return `translate(${ _width / 2 },${ _width * 1.8 / 3 })`;
  }

  const centerTx = centerTranslation(config.clipWidth, config.clipHeight);

  function createCanvas() {
    svg = d3.select(container)
      .html('')
      .append('svg')
      .attr('class', 'gauge')
      .attr('width', config.clipWidth)
      .attr('height', config.clipHeight);
    return svg;
  }

  function drawArcs() {
    const arcs = svg.append('g')
      .attr('class', 'arc')
      .attr('transform', centerTx);
    arcs.selectAll('path')
      .data(tickData)
      .enter()
      .append('path')
      .attr('fill', (d, i)=> config.arcColorFn(d * i))
      .attr('d', arc);
  }

  function makeTicks() {
    const lg = svg.append('g')
      .attr('class', 'label')
      .attr('transform', centerTx);

    lg.selectAll('text1')
      .data(ticks)
      .enter()
      .append('text')
      .attr('transform', (d, i)=> {
        const ratio = scale(d);
        const newAngle = config.minAngle + (ratio * range);
        return `rotate(${newAngle}) translate(0,${config.labelInset - r})`;
      })
      .attr('dy', '0em')
      .text(config.labelFormat);
  }

  function centreDial() {
    const cg = svg
      .append('g')
      .attr('class', 'value')
      .attr('transform', centerTx)
      .append('text')
      .attr('dy', '2em')
      .style('text-anchor', 'middle')
      .text(`$${ d3.format(',')(_value)}`)
      .style('fill', ()=> {
        if (_value < 0) {
          return '#e60000';
        } return '#666';
      });
    return cg;
  }

  function pointerElement() {
    const lineData = [
      [config.pointerWidth / 2, 0],
      [0, -pointerHeadLength],
      [-(config.pointerWidth / 2), 0],
      [0, config.pointerTailLength],
      [config.pointerWidth / 2, 0]
    ];
    const pointerLine = d3.line().curve(d3.curveLinear);

    const tooltip = d3.select('body')
      .append('div')
      .style('position', 'absolute')
      .style('z-index', '10')
      .style('visibility', 'hidden')
      .text(()=> `Target: ${_target}`);

    const pg = svg.append('g').data([lineData])
      .attr('class', 'pointer')
      .attr('transform', centerTx)
      .on('mouseover', ()=> tooltip.style('visibility', 'visible'))
      .on('mousemove', ()=> tooltip.style('top', `${d3.event.pageY-10}px`).style('left', `${d3.event.pageX+10}px`))
      .on('mouseout', ()=> tooltip.style('visibility', 'hidden'));

    pointer = pg.append('path')
      .attr('d', pointerLine)
      .attr('transform', `rotate(${ config.minAngle })`);
    
    return pointer;
  }

  function render() {
    createCanvas();
    drawArcs();
    makeTicks();
    centreDial();
    pointerElement();
  }

  function update() {
    const ratio = scale(perc);
    const updatedAngle = config.minAngle + (ratio * range);
    pointer.transition()
      .duration(config.transitionMs)
      .ease(d3.easeElastic)
      .attr('transform', `rotate(${ updatedAngle })`);
  }

  that.render = render;
  that.update = update;

  configure();

  return that;
};

function makeGauge(container, _value, _target) {
  const powerGauge = gauge(container, _value, _target);
  powerGauge.render();
  powerGauge.update();
}

export {makeGauge};
