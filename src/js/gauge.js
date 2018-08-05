import * as d3 from "d3"

require('../style/style.css');

looker.plugins.visualizations.add({

	create: function(element, config){

    },

	updateAsync: function(data, element, config, queryResponse, details, doneRendering){
  
        var numerator = data[0]['var1'].value
        var denominator = data[0]['var2'].value

        var max_width = element.clientWidth;
        var max_height = element.clientHeight;

        var size_min = Math.min.apply( Math, [max_width, max_height] );

        ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        var gauge = function(container, _value, _target) {
        
            var perc = undefined;
            if (_value <= _target * 1.5) {
                perc = _value / _target;
            } else {
                perc = 1.55;
            }
        
            var that = {};
            var config = {
                size						: size_min * 1.25,
                clipWidth					: size_min * 1.2,
                clipHeight					: size_min * 1.2,
                ringInset					: size_min * 0.14,
                ringWidth					: size_min * 0.1,
                
                pointerWidth				: size_min * 0.05,
                pointerTailLength			: size_min * 0.025,
                pointerHeadLengthPercent	: 0.8,
                
                minValue					: 0,
                maxValue					: 1.5,
                
                minAngle					: -80,
                maxAngle					: 80,
                
                transitionMs				: 2000,
                
                majorTicks					: 3,
                labelFormat					: d3.format('.0%'),
                labelInset					: size_min * 0.1,
                font_size                   : size_min * 0.04,
        
                arcColorFn					: d3.interpolateHsl(d3.rgb('#e8e2ca'), d3.rgb('#CC0000'))
            };
            var range = undefined;
            var r = undefined;
            var pointerHeadLength = undefined;
            var value = 0;
            
            var svg = undefined;
            var arc = undefined;
            var scale = undefined;
            var ticks = undefined;
            var ticks_value = undefined;
            var tickData = undefined;
            var pointer = undefined;
            
            function deg2rad(deg) {
                return deg * Math.PI / 180;
            }
            
            function newAngle(d) {
                var ratio = scale(d);
                var newAngle = config.minAngle + (ratio * range);
                return newAngle;
            }
            
            function configure() {
                
                range = config.maxAngle - config.minAngle;
                r = config.size / 2;
                pointerHeadLength = Math.round(r * config.pointerHeadLengthPercent);
        
                scale = d3.scaleLinear()
                    .domain([config.minValue, config.maxValue]);
                ticks = scale.ticks(config.majorTicks);
                ticks_value = ticks.map(function(e){return e * _target });
        
                tickData = d3.range(config.majorTicks).map(function() {return 1/config.majorTicks})
                arc = d3.arc()
                    .innerRadius(r - config.ringWidth - config.ringInset)
                    .outerRadius(r - config.ringInset)
                    .startAngle(function(d, i) {
                        var ratio = d * i;
                        return deg2rad(config.minAngle + (ratio * range));
                    })
                    .endAngle(function(d, i) {
                        var ratio = d * (i+1);
                        return deg2rad(config.minAngle + (ratio * range));
                    });
            }
            that.configure = configure;
            
            function centerTranslation(_width, _height) {
                return 'translate(' + _width / 2 + ',' + _width * 1.8 / 3 + ')';
            }
            
            function render() {
                
                // create svg canvas
                svg = d3.select(container)
                    .html('')
                    .append('svg')
                        .attr('class', 'gauge')
                        .attr('width', config.clipWidth)
                        .attr('height', config.clipHeight)
        
                // calculate svg centre offset
                var centerTx = centerTranslation(config.clipWidth, config.clipHeight);
                
                // arc element
                var arcs = svg.append('g')
                    .attr('class', 'arc')
                    .attr('transform', centerTx);
                
                arcs.selectAll('path')
                    .data(tickData)
                    .enter()
                    .append('path')
                    .attr('fill', function(d, i) {return config.arcColorFn(d * i)})
                    .attr('d', arc);
                
                // tick labels element
                var lg = svg.append('g')
                        .attr('class', 'label')
                        .attr('transform', centerTx);
                
                lg.selectAll('text1')
                    .data(ticks)
                    .enter()
                    .append('text')
                    .attr('transform', function(d, i) {
                        var ratio = scale(d);
                        var newAngle = config.minAngle + (ratio * range);
                        return 'rotate(' + newAngle + ') translate(0,' + (config.labelInset - r) + ')';
                        })
                    .attr('dy', '0em')
                    .text(config.labelFormat);
                
            
                lg.selectAll('text2')
                    .data(ticks)
                    .enter()
                    .append('text')
                    .attr('transform', function(d) {
                        var ratio = scale(d);
                        var newAngle = config.minAngle + (ratio * range);
                        return 'rotate(' + newAngle + ') translate(0,' + (config.labelInset - r) + ')';
                        })
                    .attr('dy', '-1em')
                    .text(function(d, i){return '$' + ticks_value[i]/1000 + 'k'});
                
                // var cg = svg.append('g')
                //     .attr('class', 'banner')
                //     .attr('transform', centerTx)
                //     .append('text')
                //     .attr('dy', '2em')
                //     .text('aaaaaaa');
        
                // pointer element
                var lineData = [
                    [config.pointerWidth / 2, 0], 
                    [0, -pointerHeadLength],
                    [-(config.pointerWidth / 2), 0],
                    [0, config.pointerTailLength],
                    [config.pointerWidth / 2, 0] 
                ];
                var pointerLine = d3.line().curve(d3.curveLinear)
                var pg = svg.append('g').data([lineData])
                        .attr('class', 'pointer')
                        .attr('transform', centerTx);
                        
                pointer = pg.append('path')
                    .attr('d', pointerLine)
                    .attr('transform', 'rotate(' + config.minAngle + ')');
        
                }
                that.render = render;
            
                function update() {
                    var ratio = scale(perc);
                    console.log(scale(2.4))
                    var newAngle = config.minAngle + (ratio * range);
                    pointer.transition()
                        .duration(config.transitionMs)
                        .ease(d3.easeElastic)
                        .attr('transform', 'rotate(' + newAngle +')');
                }
                that.update = update;
            
                configure();
                
                return that;
            };
        
        function make_gauge(container, _value, _target) {
        
            var powerGauge = gauge(container, _value, _target);
        
            powerGauge.render();
            powerGauge.update();
        
        }
        
        make_gauge(element, numerator, denominator)

        ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

		doneRendering()
	}
});
