import * as d3 from "d3";
//import topojson from "topojson";  // for some reason this doesnt import

const dim = {
		w:760,
		h:580
	}
const margin = {
		bottom: 10,
		top: 10,
		left:20,
		right:20
	}

//min/max of earthquake mags
const radiusScale = d3.scaleLinear()
		.domain([5.5,9.1])
		.range([0,50]);

//min/max of earthquake depths
const depthScale = d3.scaleLinear()
		.domain([-1.1,700])
		.range(['#EA80FC','#880E4F']);


const zoomed = ()=> {
  d3.selectAll("g").style("stroke-width", 1.5 / d3.event.scale + "px");
  d3.selectAll("g").attr("transform", d3.event.transform);
}

const zoom = d3.zoom()
    .scaleExtent([1, 8])
    .on("zoom", zoomed);

const svg = d3.select(".map")
		.append("svg")
		.attr("height", dim.h+margin.bottom+margin.top)
		.attr("width", dim.w+margin.left+margin.right)
		.attr("class", "svg-background")
		.append("g")
		.attr("class","country-group")
		.attr("transform",`translate(${margin.left},${margin.top})`)
		.call(zoom);

const projection = d3.geoMercator()
	.translate([dim.w/2, dim.h/2])
	.scale(120);

const path = d3.geoPath()
	.projection(projection);

const deselectAll = () => {
	const el = d3.selectAll(".selected");
	el.classed("selected", false);
}

const drawCircle = (date, lat, lon, dep, mag) => {
	const mydata = {latitude:parseFloat(lat), longitude:parseFloat(lon), depth:parseFloat(dep), magnitude:parseFloat(mag)}
	//console.log(`${date} \n (${lat},${lon}) Depth:${dep} Magnitude:${mag}` )
	d3.select(".country-group")
		.selectAll('.circles')
		.data([mydata])
		.enter()
			.append("circle")
			.attr("r", 0)
			.attr("cx", projection([lon,lat])[0])
			.attr("cy", projection([lon,lat])[1])
			.attr("fill", depthScale(dep))
			.attr("fill-opacity", 0.5)
			.attr("stroke", depthScale(dep))
		.transition()
			.duration(50*radiusScale(mag))
			.attr("r", radiusScale(mag))
		.transition()
			.duration(50*radiusScale(mag))
			.attr("r", 0)
			.remove();

}


const clicked = (d)=> {
	var bounds = path.bounds(d),
      dx = bounds[1][0] - bounds[0][0],
      dy = bounds[1][1] - bounds[0][1],
      x = (bounds[0][0] + bounds[1][0]) / 2,
      y = (bounds[0][1] + bounds[1][1]) / 2,
      scale = .9 / Math.max(dx / dim.w, dy / dim.h),
      translate = [dim.w / 2 - scale * x, dim.h / 2 - scale * y];

	switch(d3.select('#'+d.id).attr("class")) {
		case "country selected":
			 svg.transition()
		      .duration(750)
		      .call( zoom.transform, d3.zoomIdentity.translate(translate[0],translate[1]).scale(scale) ); // updated for d3 v4;	
			break;
		case "country":
			return reset();
			break;

   }
  
  

 
            
}


const reset = () => {

  svg.transition()
      .duration(750)
      .call( zoom.transform, d3.zoomIdentity ); // updated for d3 v4

}

// If the drag behavior prevents the default click,
// also stop propagation so we don’t click-to-zoom.
const stopped = () =>{
  if (d3.event.defaultPrevented) d3.event.stopPropagation();
}







let ready = (error, data, eqs) => {
	if(!error) {
		let countries = require('topojson').feature(data, data.objects.countries).features
		svg.selectAll(".country")
			.data(countries)
			.enter().append("path")
			.attr("class","country")
			.attr("id", d => d.id)
			.attr("d", path)
			.on('click', (d,i)=>{
				
				if(d3.selectAll("#"+d.id).classed("selected")) {
					deselectAll();
				}
				else {
					deselectAll();
					d3.selectAll("#"+d.id).classed("selected", !d3.selectAll("#"+d.id).classed("selected"));
				}
				clicked(d);
			});
			
	//cycle through each row in the earthquakes csv
	let i = 0

	setInterval(
	    	()=>{
	    		if(i==eqs.length-1) {
		    		clearInterval();
		    		return;
		    	}
		    	//drawCircle for data entry
	    		drawCircle(new Date(eqs[i].Date+ " "+eqs[i].Time), eqs[i].Latitude, eqs[i].Longitude, eqs[i].Depth, eqs[i].Magnitude)
	    		i++;
	    	}, 10)   
	}
	else {
		console.log("There was an err loading the country or earthquake data.");
	}
}



// Run the script/Async control

d3.queue()
	.defer(d3.json, "../data/world-countries.json")
	.defer(d3.csv, "../data/earthquake-database.csv")
	.await(ready);