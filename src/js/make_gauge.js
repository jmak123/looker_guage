import * as d3 from 'd3';

// eslint-disable-next-line max-statements
const gauge = (container, _value, _target)=> {

  // make new data features
  let perc = undefined;
  if (_value <= _target * 1.5) {
    perc = _value / _target;
  } else if (_value < 0) {
    perc = 0;
  } else {
    perc = 1.55;
  }

  let max_width = container.clientWidth;
  let max_height = container.clientHeight;
  let size_min = Math.min.apply(Math, [max_width, max_height]);

  let that = {};
  let config = {
    size: size_min * 1.25,
    clipWidth: size_min * 1.2,
    clipHeight: size_min * 1.2,
    ringInset: size_min * 0.14,
    ringWidth: size_min * 0.1,

    pointerWidth: size_min * 0.05,
    pointerTailLength: size_min * 0.025,
    pointerHeadLengthPercent: 0.8,

    textbox_width: size_min * 0.5,
    textbox_height: size_min * 0.1,

    minValue: 0,
    maxValue: 1.5,

    minAngle: -80,
    maxAngle: 80,

    transitionMs: 2000,

    majorTicks: 3,
    labelFormat: d3.format('.0%'),
    labelInset: size_min * 0.1,
    font_size: size_min * 0.04,

    arcColorFn: d3.interpolateHsl(d3.rgb('#ffffcc'), d3.rgb('#264905'))
  };

  let range = undefined;
  let r = undefined;
  let pointerHeadLength = undefined;
  let value = 0;

  let svg = undefined;
  let arc = undefined;
  let scale = undefined;
  let ticks = undefined;
  let ticks_value = undefined;
  let tickData = undefined;
  let pointer = undefined;

  function deg2rad(deg) {
    return deg * Math.PI / 180;
  }

  function newAngle(d) {
    let ratio = scale(d);
    let newAngle = config.minAngle + (ratio * range);
    return newAngle;
  }

  function configure() {

    range = config.maxAngle - config.minAngle;
    r = config.size / 2;
    pointerHeadLength = Math.round(r * config.pointerHeadLengthPercent);

    scale = d3.scaleLinear()
      .domain([config.minValue, config.maxValue]);
    ticks = scale.ticks(config.majorTicks);
    ticks_value = ticks.map((e) => {return e * _target });

    tickData = d3.range(config.majorTicks).map(() => {return 1/config.majorTicks});
    arc = d3.arc()
      .innerRadius(r - config.ringWidth - config.ringInset)
      .outerRadius(r - config.ringInset)
      .startAngle((d, i) => {
                var ratio = d * i;
                return deg2rad(config.minAngle + (ratio * range));
            })
      .endAngle((d, i) => {
                var ratio = d * (i+1);
                return deg2rad(config.minAngle + (ratio * range));
            });
  }
  that.configure = configure;

  function centerTranslation(_width, _height) {
    return `translate(${  _width / 2  },${  _width * 1.8 / 3  })`;
  }

  function render() {

    // create svg canvas
    svg = d3.select(container)
      .html('')
      .append('svg')
      .attr('class', 'gauge')
      .attr('width', config.clipWidth)
      .attr('height', config.clipHeight);

    // calculate svg centre offset
    let centerTx = centerTranslation(config.clipWidth, config.clipHeight);

    // arc element
    let arcs = svg.append('g')
      .attr('class', 'arc')
      .attr('transform', centerTx);

    arcs.selectAll('path')
      .data(tickData)
      .enter()
      .append('path')
      .attr('fill', (d, i) => {return config.arcColorFn(d * i)})
      .attr('d', arc);

    // tick labels element
    let lg = svg.append('g')
      .attr('class', 'label')
      .attr('transform', centerTx);

    lg.selectAll('text1')
      .data(ticks)
      .enter()
      .append('text')
      .attr('transform', (d, i) => {
                var ratio = scale(d);
                var newAngle = config.minAngle + (ratio * range);
                return 'rotate(' + newAngle + ') translate(0,' + (config.labelInset - r) + ')';
                })
      .attr('dy', '0em')
      .text(config.labelFormat);

    let cg = svg
      .append('g')
      .attr('class', 'value')
      .attr('transform', centerTx)
      .append('text')
      .attr('dy', '2em')
      .style('text-anchor', 'middle')
      .text(`$${  d3.format(",")(_value)}`)
      .style('fill', () => {
                console.log(_value)
                if (_value < 0) {
                    return '#e60000'
                } else {return '#666'}
            });

    // pointer elements
    let lineData = [
      [config.pointerWidth / 2, 0],
      [0, -pointerHeadLength],
      [-(config.pointerWidth / 2), 0],
      [0, config.pointerTailLength],
      [config.pointerWidth / 2, 0]
    ];
    let pointerLine = d3.line().curve(d3.curveLinear);
    let pg = svg.append('g').data([lineData])
      .attr('class', 'pointer')
      .attr('transform', centerTx);

    pointer = pg.append('path')
      .attr('d', pointerLine)
      .attr('transform', `rotate(${  config.minAngle  })`);

  }
  that.render = render;

  function update() {
    let ratio = scale(perc);
    console.log(scale(2.4));
    let newAngle = config.minAngle + (ratio * range);
    pointer.transition()
      .duration(config.transitionMs)
      .ease(d3.easeElastic)
      .attr('transform', `rotate(${  newAngle })`);
  }
  that.update = update;

  configure();

  return that;
};

function make_gauge(container, _value, _target) {

  let powerGauge = gauge(container, _value, _target);

  powerGauge.render();
  powerGauge.update();

}

export {make_gauge};
