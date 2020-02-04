/*     questo è lo script che fa la query, senza questo non ottengo i dati dello SS
         la prima cosa che fa è reperire l'id, poi fa una seconda richiesta ajax al getDataSS + ssid */

// funzione per ottenere l'id dello schema corrente
var ssid = window.location.href.split('/').pop();

console.log(ssid);

var g = null;
var datag = null;

$('#myTab a[href="#graph"]').tab('show'); // mostra il grafo SS

$.ajax({
    type: 'GET',
    url: '../getDataSS/' + ssid,
    dataType: 'json',
    success: function(data) {
        console.log(data); // console.log forse è inutile
        datag = data;
        $(".graph-title").text(data.title); // setta il nome del dataset di fianco a "from"

        data.nodes.count; // riga e for oscuri
        for (var i = 0; i < data.nodes.length; i++) {
            data.nodes[i].count = 10;
        }

        g = new Graph(); // viene creato il grafo SS
        g.ss = data;
        g.ssChanged(null, null, null);

        /*
        window['mcpherTreeData'] = {"d3":{"options":{"radius":4,"fontSize":9,"labelFontSize":14,"gravity":0.1,"height":window.screen.height,"nodeFocusColor":"black","nodeFocusRadius":25,"nodeFocus":true,"linkDistance":150,"charge":-220,"nodeResize":"count","nodeLabel":"label","linkName":"tag"},"data":{"nodes":data.nodes,"links":data.links}}};

        initialize().then (
            function (control) {
                doTheTreeViz(control);
            }
        );
        */

    }

});

$('a[data-toggle="tab"]').on('shown.bs.tab', function(e) {
    e.target // newly activated tab
    e.relatedTarget // previous active tab
})

/*  script che permette la visualizzazione del grafo ?  */
/*  senza questo script, il grafo non viene visualizzato
        sarebbe da guardare in dettaglio per capire cosa fa di preciso  */

var colorGlobal = d3.scale.category20();
var svg;
var qo;
var ssGlobal;
var fill = d3.scale.category20();
var stroke_width = 1.5;
var tick = false;
var linkDistance = 150;

function isEmpty(obj) {

    // null and undefined are "empty"
    if (obj == null) return true;

    // Assume if it has a length property with a non-zero value
    // that that property is correct.
    if (obj.length > 0) return false;
    if (obj.length === 0) return true;

    // Otherwise, does it have any properties of its own?
    // Note that this doesn't handle
    // toString and valueOf enumeration bugs in IE < 9
    for (var key in obj) {
        if (hasOwnProperty.call(obj, key)) return false;
    }

    return true;
}

function Graph() {
    this.width = 0;
    this.height = 0;
    this.eightyWeight = 0;
    this.svg = null;
}

Graph.prototype.generate = function() {
    this.fire('generate');
}

Graph.prototype.selectedChange = function(par) {
    //console.log('changed')
    //console.log(this.selected)

    //    this.fire('overnode',par)
    svg.selectAll('.link').style('opacity', function(o) {
        if (o.source == this.selected || o.target == this.selected)
            return o.source == this.selected || o.target == this.selected ? 1 : 0;
    }.bind(this)).style('stroke-width', function(o) {
        if (o.source == this.selected || o.target == this.selected)
            return o.source == this.selected || o.target == this.selected ? 2 : 1;
    }.bind(this)).style('stroke', function(o) {
        if (o.source == this.selected || o.target == this.selected)
            return o.source == this.selected || o.target == this.selected ? "black" : "SlateGray";
    }.bind(this));

    svg.selectAll('.autoedges').style('opacity', function(o) {
        if (o.source == this.selected || o.target == this.selected)
            return o.source == this.selected || o.target == this.selected ? 0 : 0;
    }.bind(this)).style('stroke-width', function(o) {
        if (o.source == this.selected || o.target == this.selected)
            return o.source == this.selected || o.target == this.selected ? 2 : 1;
    }.bind(this)).style('stroke', function(o) {
        if (o.source == this.selected || o.target == this.selected)
            return o.source == this.selected || o.target == this.selected ? "black" : "SlateGray";
    }.bind(this));

    //console.log(this.ss)

    svg.selectAll('.node')
        .style('opacity', function(ld) {

            if (ld.fullName == this.selected.fullName) return 1;
            if (_.some(this.ss.links, function(el) {
                    return (el.source === this.selected && el.target === ld) || (el.source === ld && el.target === this.selected);
                }.bind(this))) {
                return 1;
            } else if (typeof ld !== 'undefined') return .3;
        }.bind(this));

    //console.log(this.selected)

    svg.selectAll('.nodelabel')
        .style('opacity', function(ld) {
            //console.log(d)
            //console.log(ld)
            //console.log(this.selected)
            if (typeof ld !== 'undefined' && ld.fullName == this.selected.fullName) return 1;
            //       	       if (typeof ld !== 'undefined')console.log(ld.fullName);
            //      				console.log(d)
            if (_.some(this.ss.links, function(el) {
                    //      	         	 console.log(el.target);
                    return (el.source === this.selected && el.target === ld) || (el.source === ld && el.target === this.selected);
                }.bind(this))) {
                return 1;
            } else if (typeof ld !== 'undefined') return .3;
        }.bind(this))
        .style('font-weight', function(ld) {
            if (typeof ld !== 'undefined' && ld.name == this.selected.name) return 500;
            //		console.log(ld)
            //		console.log(d)
            if (_.some(this.ss.links, function(el) {
                    //	 console.log(el.target);
                    return (el.source === this.selected && el.target === ld) || (el.source === ld && el.target === this.selected);
                }.bind(this))) {
                return 500;
            } else return 300;
        }.bind(this));

}

Graph.prototype.ssChanged = function(attrName, oldVal, newVal) {
    if (!isEmpty(this.ss)) {
        // inizializzazione
        qo = new QuerOrchestrator();
        this.queryStarted = false;

        var margin = {
            top: -5,
            right: -5,
            bottom: -5,
            left: -5
        };

        //this.width=this.getBoundingClientRect().width*0.99;
        //this.height=this.getBoundingClientRect().height*0.99;

        this.width = $("#chart").width();
        this.height = $("#chart").height();

        this.eightyWeight = this.width * 0.8
        console.log(this.width)
        //var div = this.$.graph
        var div = document.getElementById("chart");
        while (div.hasChildNodes() && div.lastChild.id != "title") {
            div.removeChild(div.lastChild);
        }
        ssGlobal = this.ss
        //console.log(svg)

        svg = d3.select("#chart").append("svg")
            .attr("width", this.width)
            .attr("height", this.height)
            .append("g");
        this.drawGraph();
    }
}

Graph.prototype.drawGraph = function(graph) {
    //console.log(this.ss);

    var vocab = this.ss.vocab;

    colorGlobal = d3.scale.category20();

    var rect = svg.append("rect")
        .attr("width", this.width)
        .attr("height", this.height)
        .style("fill", "none")
        .style("pointer-events", "all");

    var container = svg.append("g");

    for (a in vocab) {
        colorGlobal(vocab[a]);
    }
    // console.log(vocab[0]);
    var max_ni = this.ss.nodes[0].ni;
    var max_np = this.ss.links[0].np;

    for (i = 1; i < this.ss.nodes.length; i++) {

        if (this.ss.nodes[i].ni > max_ni)
            max_ni = this.ss.nodes[i].ni;
    }

    for (i = 1; i < this.ss.links.length; i++) {
        if (this.ss.links[i].np > max_np)
            max_np = this.ss.links[i].np;
    }

    var charge = (-4100) * 31 / this.ss.nodes.length;

    console.log(charge)

    var force = d3.layout.force()
        .nodes(this.ss.nodes)
        .links(this.ss.links)
        .gravity(0.9).linkDistance([linkDistance])
        .charge(charge)
        .friction(0.7)
        .size([this.width, this.height])
        .start();

    console.log(parseInt(-(2 / 3) * this.ss.nodes.length + 100));

    var zoom = d3.behavior.zoom()
        .scaleExtent([1, 10])
        .on("zoom", zoomed);

    svg.call(zoom);

    var drag = d3.behavior.drag()
        .origin(function(d) {
            return d;
        })
        .on("dragstart", dragstarted)
        .on("drag", dragged)
        .on("dragend", dragended);

    divTT = d3.select("#chart").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")

        .style("top", 5)
        .style("left", 5)
        .style("opacity", 1);

    var edgeLegend = d3.select("#chart").append("div")
        .attr("class", "edgeLegend")
        .attr({
            'width': '20px',
            'height': '10px',
            'position': 'absolute',
            'overflow-y': 'auto'
        })
        .style("position", "absolute")
        .style("opacity", 1);

    var links = container
        .attr("class", "links")
        .selectAll(".link")
        .data(this.ss.links)
        .enter().append("svg:line") //
        .attr("class", "link")
        .attr("id", function(d, i) {
            return 'edge' + i;
        })
        .attr('marker-end', 'url(#arrowhead)')

        .style("stroke-width", 0.8)
        .style("stroke-opacity", 0.8)
        .attr("x1", function(d) {
            return d.source.x;
        })
        .attr("y1", function(d) {
            return d.source.y;
        })
        .attr("x2", function(d) {
            return d.target.x;
        })
        .attr("y2", function(d) {
            return d.target.y;
        }) //;

    autoedges = []
    for (i = 0; i < this.ss.links.length; i++) {
        if (this.ss.links[i].source == this.ss.links[i].target) {
            //    	    		console.log('autonode')
            autoedges.push(this.ss.links[i])
        }
    }

    var autoedges = container
        .selectAll(".autoedges")
        .data(autoedges)
        .enter().append("svg:path")
        .attr("class", "link")
        .attr("id", function(d, i) {
            return 'autoedge' + i;
        })
        //  .style("stroke-width", "1.5px")
        .style("stroke-width", 1)
        .attr("fill", "none")
        .style("stroke", 'SlateGray');

    var nodes = container
        .attr("class", "nodes")
        .selectAll(".node")
        .data(this.ss.nodes)
        .enter().append("svg:circle")
        .attr("class", "node")
        .attr("stroke", "black")

        .attr("stroke-width", "0.5px")
        .attr("r", function(d) {
            return (d.ni * 20 / max_ni) + 5;
        }) //dimensione nodi
        .style("fill", function(d) {
            return colorGlobal(d.vocab);
        })
        .call(drag)

    var nodelabels = container
        .attr("class", "nodelabel")
        .selectAll(".nodelabel")
        .data(this.ss.nodes)
        .enter()
        .append("text")
        .attr({

            "x": function(d) {
                return d.x + (d.ni * 25 / max_ni) + 5 + stroke_width;
            },
            "y": function(d) {
                return d.y;
            },
            "class": "nodelabel",
            "id": function(d) {
                return "nodelabel" + d.index
            }
        })
        .style("font-family", "Lato, sans-serif")
        .style("font-weight", 300)
        .style("stroke", "black")
        .attr("font-size", "13px")
        .attr("fill", "black")
        .text(function(d) {
            return d.name;
        })

    nodes.append("title")

        .text(function(d) {
            return d.fullName;
        });
    links.append("title")

        .text(function(d) {
            return d.name;
        });

    svg.style("opacity", 1e-6)
        .transition()
        .duration(1000)
        .style("opacity", 1);

    var edgepaths = svg.selectAll(".edgepath")
        .data(this.ss.links)
        .enter()
        .append('path')
        .attr({
            'd': function(d) {
                return 'M ' + d.source.x + ' ' + d.source.y + ' L ' + d.target.x + ' ' + d.target.y
            },
            'class': 'edgepath',
            'fill-opacity': 0,
            'stroke-opacity': 0,
            'fill': 'blue',
            'stroke': 'red',
            'id': function(d, i) {
                return 'edgepath' + i
            }
        })
        .style("pointer-events", "none");

    force.on("tick", function() {

        nodes.attr({
            "cx": function(d) {
                return d.x = Math.max(10, Math.min(this.width - 10, d.x));
            }.bind(this),
            "cy": function(d) {
                return d.y = Math.max(10, Math.min(this.height - 10, d.y));
            }.bind(this)
        });

        links.attr({
            "x1": function(d) {
                return d.source.x;
            },
            "y1": function(d) {
                return d.source.y;
            },
            "x2": function(d) {
                return d.target.x;
            },
            "y2": function(d) {
                return d.target.y;
            }
        });

        nodelabels.attr("x", function(d) {
                return d.x + (d.ni * 25 / max_ni) + 5 + stroke_width;
            })

            .attr("y", function(d) {
                return d.y;

            });

        edgepaths.attr('d', function(d) {
            var path = 'M ' + d.source.x + ' ' + d.source.y + ' L ' + d.target.x + ' ' + d.target.y;
            //console.log(d)

            return path
        });

        autoedges.attr("d", function(d) {
            var dx = d.target.x - d.source.x,
                dy = d.target.y - d.source.y,
                dr = Math.sqrt(dx * dx + dy * dy),
                x1 = d.source.x,
                y1 = d.source.y,
                x2 = d.target.x,
                y2 = d.target.y;

            var xRotation = 0, // degrees
                largeArc = 0, // 1 or 0
                sweep = 1; // 1 or 0
            xRotation = -45;

            // Needs to be 1.
            largeArc = 1;

            // Change sweep to change orientation of loop.
            //sweep = 0;

            // Make drx and dry different to get an ellipse
            // instead of a circle.
            drx = 30;
            dry = 20;

            // For whatever reason the arc collapses to a point if the beginning
            // and ending points of the arc are the same, so kludge it.
            x2 = x2 + 1;
            y2 = y2 + 1;
            return "M" + x1 + "," + y1 + "A" + drx + "," + dry + " " + xRotation + "," + largeArc + "," + sweep + " " + x2 + "," + y2;

        });

    }.bind(this));

    function zoomed() {
        container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    }

    function dragstarted(d) {
        d3.event.sourceEvent.stopPropagation();

        d3.select(this).classed("dragging", true);
        //     	          console.log(force)
        force.start();
    }

    function dragged(d) {

        d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);

    }

    function dragended(d) {

        d3.select(this).classed("dragging", false);
    }

    svg.selectAll('.node').on("mouseover", function(d) {

        gq.miniGraph = t;

        gq.ss = datag;

        //NOME NODO
        $('#nameNode').empty();
        htmlnome = '';
        nodeName = d.name;
        htmlnome = d.name + " (" + d.ni + ") ";
        $('#nameNode').append(htmlnome);

        $('#groupPrepareQuery').show();
        $('#groupActionQuery').hide();

        //SALVO NODO SELEZIONATO NELLA VARIABILE selected
        this.selected = d;
        //   alert(JSON.stringify(this.selected));

        //RICHIAMO selectedChanged PER EFFETTI OPACITÀ
        this.selectedChange(this.selected);

        gq.currentNode = this.selected;

        gq.currentNodeChanged();

        gen();

        /*       
								

                    //AGGIUNGO ATTRIBUTI
                    var htmlatt = "";
                   // console.log("d.att: ", d.att);

												 
									 

                for ( var i = 0; i < d.att.length; i++ ){
                    var cur = d.att[i];

								 

                        console.log("cur", cur);
                    if(cur.isInQuery){
                    htmlatt += '<tr><td><div class="btn-group" role="group" aria-label="Basic example"><button type="button" class="btn-mo-attr btn btn-success" data-toggle="tooltip" data-placement="top" title="Mandatory" name="' + cur.p + '" mandatory="1" fullname="' + cur.fullName + '">M</button><button type="button" class="btn-mo-attr btn btn-danger" name="' + cur.p + '" mandatory="0"  fullname="' + cur.fullName + '">O</button></div></td><th scope="row"><div style="width: 15px; height: 15px; border-radius: 50%; margin-top: 5px; background-color: ' + cur.color + '"></div></th><td>'+ cur.p + '</td><td>' + cur.n + '</td></tr>';
                       $(".op-head").show();
                    } else {
                        htmlatt += '<tr><th scope="row"><div style="width: 15px; height: 15px; border-radius: 50%; margin-top: 5px; background-color: ' + cur.color + '"></div></th><td>'+ cur.p + '</td><td>' + cur.n + '</td></tr>';
                        $(".op-head").hide();
                    }
                }

		

                $('#nav-home tbody').html(htmlatt);

              */

        //PROPRIETÀ
        /*               this.currentNode = d;
                    console.log("currentNode", this.currentNode);
                    gq.ss = datag;
                    gq.currentNodeChanged();

                     var properties = gq.propertylist;

								  
                var htmlprop = "";
               // console.log("properties", properties);


                for( var i = 0 ; i < properties.entranti.length; i++) {
                    var cur = properties.entranti[i];


										  
								
																																																																																																																																																																																																																																																															  
									  
					  
																																																																																						   
                        $(".op-head").hide();
			   
		   


                    htmlprop += '<tr><td><div class="btn-group" role="group" aria-label="Basic example"><button type="button" class="btn-mo-prop btn btn-success" data-toggle="tooltip" data-placement="top" title="Mandatory" pos="' + cur.pos + '" mandatory="1" entranti="1" nodeid="' + cur.index + '">M</button><button type="button" class="btn-mo-prop btn btn-danger" pos="' + cur.pos + '" mandatory="0" entranti="1" nodeid="' + cur.index + '">O</button></div></td><th scope="row"><div style="width: 15px; height: 15px; border-radius: 50%; margin-top: 5px; background-color: ' + cur.colProp + '"></div></th><td>' + cur.name + '</td><td><i class="zmdi zmdi-arrow-left zmdi-hc-fw" style="font-size: 24px"></i></td><td>' + cur.source + '</td><td>' + cur.card + '</td></tr>';
                }

                for( var i = 0 ; i < properties.uscenti.length; i++) {
                    var cur = properties.uscenti[i];


                        $(".op-head").hide();
			  
										
														   
							
									  

												
							
												  

                    htmlprop += '<tr><td><div class="btn-group" role="group" aria-label="Basic example"><button type="button" class="btn-mo-prop btn btn-success" data-toggle="tooltip" data-placement="top" title="Mandatory" pos="' + cur.pos + '" mandatory="1" entranti="0" nodeid="' + cur.index + '">M</button><button type="button" class="btn-mo-prop btn btn-danger" pos="' + cur.pos + '" mandatory="0" entranti="0" nodeid="' + cur.index + '">O</button></div></td><th scope="row"><div style="width: 15px; height: 15px; border-radius: 50%; margin-top: 5px; background-color: ' + cur.colProp + '"></div></th><td>' + cur.name + '</td><td><i class="zmdi zmdi-arrow-right zmdi-hc-fw" style="font-size: 24px"></i></td><td>' + cur.target + '</td><td>' + cur.card + '</td></tr>';
                }
                //console.log("html", htmlprop);

                $('#nav-profile tbody').html(htmlprop);
                     $(".op-head").hide();


									   


																																																																																																																																																																																																																																																																																																																																															  
		   

                    */

        // gen();

    }.bind(this));
}

Graph.prototype.nodeMouseOver = function(d, par) {
    // console.log(par)
    this.selected = d;
}

/*      script un po' oscuro, senza
questo sembra non cambi nulla
         la funzione doTheTreeViz è infatti chiamata nella richiesta ajax sopra, ma è commentata
         nel file cs.html sembra più utile  */

function doTheTreeViz(control) {
    //variabili per la visualizzazione di attributi e proprietà
    var htmlatt = ' ';
    var htmlprop = ' ';
    var nodeName;
    var svg = control.svg;

    //var qo;
    //qo=new QuerOrchestrator();

    var force = control.force;
    force.nodes(control.nodes)
        .links(control.links)
        .start();

    // Update the links
    var link = svg.selectAll("line.link")
        .data(control.links, function(d) {
            return d.unique;
        });

    // Enter any new links
    link.enter().insert("svg:line", ".node")
        .attr("class", "link")
        .attr("x1", function(d) {
            return d.source.x;
        })
        .attr("y1", function(d) {
            return d.source.y;
        })
        .attr("x2", function(d) {
            return d.target.x;
        })
        .attr("y2", function(d) {
            return d.target.y;
        })
        .append("svg:title")
        .text(function(d) {
            return d.source[control.options.nodeLabel] + ":" + d.target[control.options.nodeLabel];
        });

    // Exit any old links.
    link.exit().remove();

    // Update the nodes
    var node = svg.selectAll("g.node")

        .data(control.nodes, function(d) {
            return d.unique;

        });

    node.select("circle")
        .style("fill", function(d) {
            return getColor(d);
        })
        .attr("r", function(d) {
            return getRadius(d);
        })

    // Enter any new nodes.
    var nodeEnter = node.enter()
        .append("svg:g")
        .attr("class", "node")
        .attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
        })
        // temporaneo, con il bottne da problemi con d.  mantiene la navigazione, utilizza sempre il primo nodo
        .on("dblclick", function(d) {

            if (!control.nodeClickInProgress) {
                control.nodeClickInProgress = true;
                setTimeout(function() {
                    if (control.nodeClickInProgress) {
                        control.nodeClickInProgress = false;
                        if (control.options.nodeFocus) {
                            d.isCurrentlyFocused = !d.isCurrentlyFocused;
                            doTheTreeViz(makeFilteredData(control));

                        }
                    }
                }, control.clickHack);
            }

        })

        .on("click", function(d) {

            htmlatt = ' ';
            htmlprop = ' ';
            htmlnome = '';
            nodeName = d.name;

            htmlnome = d.name + " (" + d.ni + ") ";

            $('.default-icon').hide();

            // MOSTRA ATTRIBUTI NODES
            $('#nav-home tbody').empty();
            $('#nav-profile tbody').empty();
            $('#nameNode').empty();
            for (var i = 0; i < d.att.length; ++i) {
                //var a= d.att[i].p;
                //var att= a.fontcolor(control.color(d.att[i].vocab));

                htmlatt += '<tr><td><div class="btn-group" role="group" aria-label="Basic example"><button type="button" class="ssbtn btn btn-success" data-id="6">M</button><button type="button" class="csbtn btn btn-danger" data-id="6">O</button></div></td><th scope="row"><div style="width: 15px; height: 15px; border-radius: 50%; margin-top: 5px; background-color: ' + control.color(d.att[i].vocab) + '"></div></th><td>' + d.att[i].p + '</td><td>' + d.att[i].n + '</td></tr>'

                //htmlatt += '<p><a class="btn btn-primary linka" href="#" role="button">Link</a>' + att + '</p>';        

            }
            // DEFINISCO ID NODES che sono d.index             

            //MOSTRO PROP LINK

            for (var j = 0; j < control.links.length; j++) {

                if (d.index == control.links[j].source.index || d.index == control.links[j].target.index) {

                    for (var k = 0; k < control.links[j].label.length; k++) {

                        //var prop=control.links[j].label[k].name;
                        //var result = prop.fontcolor(control.color(control.links[j].label[k].vocab)); 

                        var symbol = "";
                        var name = "";

                        if (d.index == control.links[j].source.index && d.index == control.links[j].target.index) {
                            //symbol = "↔";
                            symbol = '<i class="zmdi zmdi-swap zmdi-hc-fw" style="font-size: 24px"></i>';
                            name = control.links[j].target.name;
                        } else if (d.index == control.links[j].source.index) {
                            //symbol = "→";
                            symbol = '<i class="zmdi zmdi-arrow-right zmdi-hc-fw" style="font-size: 24px"></i>';
                            name = control.links[j].target.name;
                        } else if (d.index == control.links[j].target.index) {
                            //symbol = "←";
                            symbol = '<i class="zmdi zmdi-arrow-left zmdi-hc-fw" style="font-size: 24px"></i>';
                            name = control.links[j].source.name;
                        }

                        htmlprop += '<tr><td><div class="btn-group" role="group" aria-label="Basic example"><button type="button" class="ssbtn btn btn-success" data-id="6">M</button><button type="button" class="csbtn btn btn-danger" data-id="6">O</button></div></td><th scope="row"><div style="width: 15px; height: 15px; border-radius: 50%; margin-top: 5px; background-color: ' + control.color(control.links[j].label[k].vocab) + '"></div></th><td>' + control.links[j].label[k].name + '</td><td>' + symbol + '</td><td>' + name + '</td><td>' + control.links[j].label[k].np + '</td></tr>';

                        /*
                            ok=0;
                            htmlprop += '<p>' + result ;

                                if(d.index == control.links[j].source.index && d.index == control.links[j].target.index && ok==0){
                                    htmlprop += " ↔  " + control.links[j].target.name + '</p>';
                                    ok=1;
                                }

                                if(d.index == control.links[j].source.index && ok==0){
                                    htmlprop += " →  " + control.links[j].target.name + '</p>';
                                    ok=1;
                                }

                                if(d.index == control.links[j].target.index && ok==0 ){
													  

                                    htmlprop += " ←  " + control.links[j].source.name + '</p>';
                                    ok=1;
                                }
                            */

                    }
                }
            }

            $('#nav-profile tbody').append(htmlprop);
            $('#nav-home tbody').append(htmlatt);
            $('#nameNode').append(htmlnome);

            $(".linka").click(function() {
                alert("ok");
            });

        }).call(force.drag);

    nodeEnter
        .append("svg:circle")
        .attr("r", function(d) {
            return getRadius(d);
        })
        .style("fill", function(d) {
            return getColor(d);
        })
        .append("svg:title")
        .text(function(d) {
            return d[control.options.nodeLabel];
        });

    if (control.options.nodeLabel) {
        // text is done once for shadow as well as for text
        nodeEnter.append("svg:text")
            .attr("x", control.options.labelOffset)
            .attr("dy", ".31em")
            .attr("class", "shadow")
            .style("font-size", control.options.labelFontSize + "px")
            .text(function(d) {
                return d.shortName ? d.shortName : d.name;
            });
        nodeEnter.append("svg:text")
            .attr("x", control.options.labelOffset)
            .attr("dy", ".35em")
            .attr("class", "text")
            .style("font-size", control.options.labelFontSize + "px")
            .text(function(d) {
                return d.shortName ? d.shortName : d.name;
            });
    }

    // Exit any old nodes.
    node.exit().remove();
    control.link = svg.selectAll("line.link");
    control.node = svg.selectAll("g.node");
    force.on("tick", tick);

    if (control.options.linkName) {
        link.append("title")
            .text(function(d) {
                return d[control.options.linkName];
            });
    }

    function filtered(d) {
        if (!control.nodeClickInProgress) {
            control.nodeClickInProgress = true;
            setTimeout(function() {
                if (control.nodeClickInProgress) {
                    control.nodeClickInProgress = false;

                    if (control.options.nodeFocus) {
                        d.isCurrentlyFocused = !d.isCurrentlyFocused;
                        doTheTreeViz(makeFilteredData(control));

                    }
                }
            }, control.clickHack);
        }
    }

    function tick() {
        link.attr("x1", function(d) {
                return d.source.x;
            })
            .attr("y1", function(d) {
                return d.source.y;
            })
            .attr("x2", function(d) {
                return d.target.x;
            })
            .attr("y2", function(d) {
                return d.target.y;
            });

        node.attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
        });

    }
    //dimensione dei nodi in base al numero delle istanze
    function getRadius(d) {
        //var r=10;
        //var r = control.options.radius * (control.options.nodeResize ? Math.sqrt(d[control.options.nodeResize]) / Math.PI : 1);
        //return control.options.nodeFocus && d.isCurrentlyFocused ? control.options.nodeFocusRadius  : r;
        var max = 0;
        for (var i = 0; i < control.data.nodes.length; i++) {
            if (control.data.nodes[i].ni > max)
                max = control.data.nodes[i].ni;
        }

        return (d.ni * 20 / max) + 5;
    }
    //seleziona il colore del nodo in base al vocabolario di riferimento

    function getColor(d) {
        return control.options.nodeFocus && d.isCurrentlyFocused ? control.options.nodeFocusColor : control.color(d.vocab);
    }

}

function makeFilteredData(control, selectedNode) {
    // we'll keep only the data where filterned nodes are the source or target
    var newNodes = [];
    var newLinks = [];

    for (var i = 0; i < control.data.links.length; i++) {
        var link = control.data.links[i];
        if (link.target.isCurrentlyFocused || link.source.isCurrentlyFocused) {
            newLinks.push(link);
            addNodeIfNotThere(link.source, newNodes);
            addNodeIfNotThere(link.target, newNodes);
        }
    }
    // if none are selected reinstate the whole dataset
    if (newNodes.length > 0) {
        control.links = newLinks;
        control.nodes = newNodes;
    } else {
        control.nodes = control.data.nodes;
        control.links = control.data.links;
    }
    return control;

    function addNodeIfNotThere(node, nodes) {
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].unique == node.unique) return i;
        }
        return nodes.push(node) - 1;
    }
}

function organizeData(control) {

    for (var i = 0; i < control.nodes.length; i++) {
        var node = control.nodes[i];
        node.unique = i;
        node.isCurrentlyFocused = false;
    }

    for (var i = 0; i < control.links.length; i++) {
        var link = control.links[i];
        link.unique = i;
        link.source = control.nodes[link.source];
        link.target = control.nodes[link.target];
    }
    return control;
}

function initialize() {

    var initPromise = $.Deferred();

    getTheData().then(function(data) {
        var control = {};
        control.data = data;
        control.divName = "#chart";

        control.options = $.extend({
            stackHeight: 12,
            radius: 5,
            fontSize: 14,
            labelFontSize: 8,
            nodeLabel: null,
            markerWidth: 0,
            markerHeight: 0,
            width: window.screen.width / 2,
            gap: 1.5,
            nodeResize: "",
            linkDistance: 80,
            charge: -120,
            styleColumn: null,
            styles: null,
            linkName: null,
            nodeFocus: true,
            nodeFocusRadius: 25,
            nodeFocusColor: "black",
            labelOffset: "5",
            gravity: .05,
            height: window.screen.height
        }, control.data.d3.options);

        var options = control.options;
        options.gap = options.gap * options.radius;
        control.width = options.width;
        control.height = options.height;
        control.data = control.data.d3.data;
        control.nodes = control.data.nodes;
        control.links = control.data.links;
        control.color = d3.scale.category20();
        control.clickHack = 200;
        organizeData(control);

        control.svg = d3.select(control.divName)
            .append("svg:svg")
            .attr("width", control.width)
            .attr("height", control.height);

        // get list of unique values in stylecolumn
        control.linkStyles = [];
        if (control.options.styleColumn) {
            var x;
            for (var i = 0; i < control.links.length; i++) {
                if (control.linkStyles.indexOf(x = control.links[i][control.options.styleColumn].toLowerCase()) == -1)
                    control.linkStyles.push(x);
            }
        } else
            control.linkStyles[0] = "defaultMarker";

        control.force = d3.layout.force().
        size([control.width, control.height])
            .linkDistance(control.options.linkDistance)
            .charge(control.options.charge)
            .gravity(control.options.gravity);

        initPromise.resolve(control);
    });
    return initPromise.promise();
}

function getTheData() {
    var dataPromise = $.Deferred();
    // return a promise if data is being received asynch and resolve it when done.
    dataPromise.resolve(mcpherTreeData);
    return dataPromise.promise();
}

/*  #dataset-tab è la variabile associata alla pagina iniziale  */

//torna alla pagina iniziale  
$('#dataset-tab').click(function() {
    window.location.href = "../";
});
$('#hierarchical-tab').click(function() {

    window.location.href = "../sshier/" + ssid;
});


/*     script che permette di visualizzare un minigrafo
        composto dalla classe cliccata e dalle classi ad essa collegata  */

function MiniGraph() {
    this.vis = null;
    this.width = 0;
    this.height = 0;
    this.eightyWeight = 0;
    this.nodes2 = null;
    this.links2 = null;
    this.force2 = null;
    this.over = null;
}
//??
MiniGraph.prototype.generate = function() {
    this.fire('generate');
}

MiniGraph.prototype.clearQuery = function() {
    // this.fire('clearquery');
    this.node2 = null;
    this.link2 = null;
    this.ssChanged();
}

MiniGraph.prototype.overChanged = function() {
    this.fire('smouseover', this.over);
}

MiniGraph.prototype.ssChanged = function(attrName, oldVal, newVal) {
    //if (!isEmpty(this.ss)){
    // set up the D3 visualisation in the specified element

    /*
        var w = this.getBoundingClientRect().width*0.99,
            h = this.getBoundingClientRect().height*0.79;
        console.log(w)
        */

    //var w = 1000, h = 1000;
    var w = $("#graph2").width(),
        h = $("#graph2").height();

    /*
            var div = this.$.graph2;
            while (div.hasChildNodes()) {
                div.removeChild(div.lastChild);
            }
            */

    var div = document.getElementById("graph2");
    while (div.hasChildNodes()) {
        div.removeChild(div.lastChild);
    }

    this.vis = d3.select("#graph2").append("svg:svg")
        .attr("width", w)
        .attr("height", h);

    this.force2 = d3.layout.force()
        .gravity(.05)
        .distance(100)
        .charge(-100)
        .size([w, h]);

    this.nodes2 = this.force2.nodes();
    this.links2 = this.force2.links();

    this.update();
    //}
}

MiniGraph.prototype.update = function() {

    var node2 = this.vis.selectAll("g.node")
        .data(this.nodes2, function(d) {
            return d.id;
        });

    var nodeEnter = node2.enter().append("g")
        .attr("class", "node")
        .call(this.force2.drag);

    nodeEnter.append("svg:circle")
        .attr("class", "circle")
        .attr("stroke", "black")
        .attr("stroke-width", "1.5px")
        .attr("r", 10)
        .style("fill", function(d) {
            return d.color
        })
        .on("mouseover", function(n) {
            this.over = n;
        }.bind(this))

    nodeEnter.append("text")
        .attr("class", "nodetext")
        .attr("dx", 12)
        .attr("dy", ".35em")
        .style("font-family", "Lato, sans-serif")
        .style("font-weight", 500)
        .attr("font-size", "15px")
        .attr("fill", "black")
        .text(function(d) {
            return d.id
        });

    node2.exit().remove();

    var link2 = this.vis.selectAll("line.link")
        .data(this.links2, function(d) {
            return d.source.id + "-" + d.target.id;
        });

    link2.enter().insert("line")
        .attr("class", "link");

    link2.exit().remove();

    this.force2.on("tick", function() {
        link2.attr("x1", function(d) {
                return d.source.x;
            })
            .attr("y1", function(d) {
                return d.source.y;
            })
            .attr("x2", function(d) {
                return d.target.x;
            })
            .attr("y2", function(d) {
                return d.target.y;
            });

        node2.attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
        });

    });

    // Restart the force layout.
    this.force2.start();
}

MiniGraph.prototype.addNode2 = function(id, color, nodeID) {
    this.nodes2.push({
        "id": id,
        "color": color,
        "nodeID": nodeID
    });
    this.update();
}

MiniGraph.prototype.removeNode2 = function(id) {
    var i = 0;
    var n = this.findNode2(id);
    while (i < this.links2.length) {
        if ((this.links2[i]['source'] === n) || (this.links2[i]['target'] == n)) this.links2.splice(i, 1);
        else i++;
    }
    var index2 = this.findNode2Index(id);
    if (index2 !== undefined) {
        this.nodes2.splice(index2, 1);
        this.update();
    }
}

MiniGraph.prototype.addLink2 = function(sourceId, targetId) {
    var sourceNode2 = this.findNode2(sourceId);
    var targetNode2 = this.findNode2(targetId);

    if ((sourceNode2 !== undefined) && (targetNode2 !== undefined)) {
        this.links2.push({
            "source": sourceNode2,
            "target": targetNode2
        });
        this.update();
    }
}

MiniGraph.prototype.findNode2 = function(id) {
    for (var i = 0; i < this.nodes2.length; i++) {
        if (this.nodes2[i].id === id)
            return this.nodes2[i]
    };
}

MiniGraph.prototype.findNode2Index = function(id) {
    for (var i = 0; i < this.nodes2.length; i++) {
        if (this.nodes2[i].id === id)
            return i
    };
}

//togliendo queste due linee sotto non farebbe il minigrafo
// e non andrebbe nemmeno lo script successivo relativo ad attributi e proprietà
var t = new MiniGraph();
t.ssChanged(null, null, null);

/*
questa parte servirebbe a popolare il riquadro in basso a sinistra rispetto al grafo principale
t.addNode2(5, "#000", 23);
t.addNode2("Tommi bellissimo", "#3f51b5", 18);
t.addLink2(5, "Tommi bellissimo");
*/

/*     script che permette di visualizzare attributi e proprietà della classe del grafo cliccata
ricordando che le proprietà (NODE) sono altre classi legate nel grafo,
       mentre gli attributi (ATTRIBUTES) sono valori numerici/stringhe
serve anche a lanciare le query tramite il comando "prepare query"  */

var qo = new QuerOrchestrator();
var colorGlobal = d3.scale.category20();

GenerateQuery = function() {
    this.queryStarted = false;
    this.currentNode = null;
    this.curQCN = [];
    this.communityExpanded = false;
    this.propertylist = {};

    this.miniGraph = null;

}

GenerateQuery.prototype.addCurrentClass = function() {
    this.queryStarted = true;

    console.log(this.currentNode);
    var curClasNode = new ClassNode(this.currentNode.fullName, this.currentNode.name, true);
    console.log(curClasNode);
    qo.addNode(curClasNode);
    this.curQCN.push({
        index: qo.getIndex(),
        nodeId: this.currentNode.index,
        name: this.currentNode.name,
        attributes: new Array(),
        opt: false,
        param: qo.getCurClasses()[0].getParameter(),
        property: null,
        qoQI: -1
    });
    console.log("curQCN: ", this.curQCN);
    console.log(qo);
    this.currentNodeChanged();
    //TODO
    this.miniGraph.addNode2(this.currentNode.name, colorGlobal(this.currentNode.vocab), this.currentNode.index);
    this.currentNode.param = qo.getCurClasses()[0].getParameter().substr(1);
    console.log(this.currentNode);
    this.currentNodeChanged();
}

GenerateQuery.prototype.currentNodeChanged = function() {
    var tmp = [];

    if (this.currentNode != null) {
        if (!this.communityExpanded) {
            this.classesList = [];
            //      this.$.classes.children[1].children[1].checked = false;  /*??????????????????*/
        } // else this.$.explore.hidden = this.checkClass(this.currentNode.id);

        var entranti = [];
        var uscenti = [];
        var edges = this.ss.links;
        console.log("test", edges);
        var pos = 0;
        for (i = 0; i < edges.length; i++) {

            console.log("edges[i]");
            console.log(edges[i]);

            if (edges[i].source.index == this.currentNode.index) {
                for (j = 0; j < edges[i].label.length; j++) {

                    tmp = edges[i].label[j];
                    tmp.target = edges[i].target.name;
                    tmp.ClassfullName = edges[i].target.fullName;
                    tmp.index = edges[i].target.index;
                    tmp.card = (tmp.np / this.currentNode.ni).toFixed(2);
                    tmp.colProp = colorGlobal(tmp.vocab);
                    tmp.pos = pos;
                    pos = pos + 1;
                    tmp.nodeId = -1;
                    if (_.some(this.curQCN, function(node) {
                            return node.nodeId == this.currentNode.index
                        }.bind(this))) {
                        tmp.isInQuery = true

                    } else {

                        tmp.isInQuery = false;

                    }

                    uscenti.push(tmp);
                }
            } else {
                if (edges[i].target.index == this.currentNode.index) {
                    for (j = 0; j < edges[i].label.length; j++) {
                        tmp = edges[i].label[j];
                        tmp.source = edges[i].source.name;
                        tmp.ClassfullName = edges[i].source.fullName;
                        tmp.index = edges[i].source.index;
                        tmp.colProp = colorGlobal(tmp.vocab);
                        tmp.card = (tmp.np / this.currentNode.ni).toFixed(2);
                        tmp.pos = pos;
                        pos = pos + 1;
                        if (_.some(this.curQCN, function(node) {
                                return node.nodeId == this.currentNode.index;
                            }.bind(this))) {
                            tmp.isInQuery = true;
                        } else {

                            tmp.isInQuery = false;

                        }

                        entranti.push(tmp);

                    }
                }
            }
        }
        entranti.sort(function(a, b) {
            return b.np - a.np;
        });
        uscenti.sort(function(a, b) {
            return b.np - a.np;
        });

        this.currentNode.att = this.currentNode.att.map(function(a) {
            a.color = colorGlobal(a.vocab);
            if (_.some(this.curQCN, function(node) {
                    return (node.nodeId == this.currentNode.index && node.param.substr(1) == this.currentNode.param)
                }.bind(this))) {
                tmpCurNode = _.find(this.curQCN, function(node) {
                    return (node.nodeId == this.currentNode.index && node.param.substr(1) == this.currentNode.param)
                }.bind(this))
                // 		    			  console.log(tmpCurNode)
                tmpAtt = null;

                for (i = 0; i < tmpCurNode.attributes.length; i++) {
                    // 		    				  console.log(tmpCurNode.attributes[i])
                    if (tmpCurNode.attributes[i].fullName == a.fullName) {
                        tmpAtt = tmpCurNode.attributes[i]
                    }
                }
                // 		    			 
                if (tmpAtt != null) {
                    a.setted = true
                    a.isInQuery = false
                    a.optional = tmpAtt.opt
                } else {
                    a.setted = false
                    a.isInQuery = true
                }

            } else {
                a.setted = false
                a.isInQuery = false

            }
            return a;
        }.bind(this))
        this.propertylist.entranti = entranti;
        this.propertylist.uscenti = uscenti;
    }

}

GenerateQuery.prototype.addAttr = function(event, detail, targhet) {
    var curQnode = _.find(this.curQCN, function(a) {
        return a.nodeId == this.currentNode.index && a.param.substr(1) == this.currentNode.param;
    }.bind(this))
    var index = curQnode.index;
    console.log(targhet.attributes)
    var name = targhet.attributes['name'].value;
    var property = targhet.attributes['fullname'].value;
    var optional = (targhet.attributes['mandatory'].value == 1) ? true : false;
    console.log(index, name, property, optional);
    var paramId = qo.addAttributeToNode(index, name, property, optional);
    this.curQCN[index].attributes.push({
        opt: optional,
        name: name,
        param: paramId,
        fullName: property
    });
    this.currentNodeChanged();
    //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!               this.$.queryint.queryChanged();
}

GenerateQuery.prototype.addProperty = function(event, detail, targhet) {
    //  console.log(targhet.attributes);
    var pos = targhet.attributes['pos'].value;
    var mandotary = targhet.attributes['mandatory'].value;
    var entranti = targhet.attributes['entranti'].value;
    var nodeID = targhet.attributes['nodeid'].value;

    var par = null;
    var nodInd = null;
    var name = null;
    var property = null;
    var curQnode = _.find(this.curQCN, function(a) {
        return a.nodeId == this.currentNode.index;
    }.bind(this))

    if (entranti == 1) {

        currentProp = _.find(this.propertylist.entranti, function(a) {
            return a.pos == pos;
        }.bind(this))
        var par = qo.addLinkedNode(currentProp.ClassfullName, currentProp.source, true, currentProp.fullName, true, (mandotary == 1) ? false : true, curQnode.index);
        nodInd = currentProp.index;
        name = currentProp.source;
        property = currentProp.fullName;
    } else {
        currentProp = _.find(this.propertylist.uscenti, function(a) {
            return a.pos == pos
        }.bind(this))
        var par = qo.addLinkedNode(currentProp.ClassfullName, currentProp.target, true, currentProp.fullName, false, (mandotary == 1) ? false : true, curQnode.index);
        nodInd = currentProp.index;
        name = currentProp.target;
        property = currentProp.fullName;
    }
    this.curQCN.push({
        param: par,
        index: qo.getIndex(),
        nodeId: nodInd,
        name: name,
        attributes: new Array(),
        opt: (mandotary == 1) ? false : true,
        property: property,
        othInx: this.currentNode.index,
        qoQI: curQnode.index,
        othParam: qo.getCurClasses()[curQnode.index].getParameter()
    });

    newNodes = this.isCluster ? this.ss.classes : this.ss.nodes;
    var newNode = _.find(newNodes, function(nod) {
        return nod.index == nodeID;
    }.bind(this));
    newNode.param = par.substr(1);

    //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!               this.$.graphss.nodeMouseOver(newNode, par);

    this.miniGraph.addNode2(par.substr(1), colorGlobal(_.find(newNodes, function(nod) {
        return nod.index == nodInd
    }).vocab), nodInd);
    this.miniGraph.addLink2(_.find(this.curQCN, function(a) {
        return a.nodeId == this.currentNode.index
    }.bind(this)).param.substr(1), par.substr(1));

}

GenerateQuery.prototype.overNode = function(e, detail, sender) {
    console.log("overNode e, detail, sender", e, detail, sender);
    //  this.currentNode = this.$.graphss.selected;
    this.currentNode = document.getElementById("chart").selected;
    console.log("this.currentnode", this.currentNode);
}


/// nel file di Luca MouseOver è stato tolto... è da testare
GenerateQuery.prototype.sMouseOver = function(e, detail, sender) {
    // 	    	console.log(e,detail,sender)
    var nodeID = e.detail.nodeID
    this.currentNode = _.find(this.ss.classes, function(a) {
        return a.index == nodeID
    }.bind(this))
    this.currentNode.param = e.detail.id
    this.currentNodeChanged()
}

var gq = new GenerateQuery();

function gen(currentNode) {

    $('.default-icon').hide();

    //ADD PROPERTIES TO PROPERTYLIST
    var properties = gq.propertylist;
    var htmlprop = "";
    console.log("properties", properties);

    for (var i = 0; i < properties.entranti.length; i++) {
        var cur = properties.entranti[i];

        if (cur.isInQuery == true) {
            htmlprop += '<tr><td><div class="btn-group" role="group" aria-label="Basic example"><button type="button" class="btn-mo-prop btn btn-success" data-toggle="tooltip" data-placement="top" title="Mandatory" pos="' + cur.pos + '" mandatory="1" entranti="1" nodeid="' + cur.index + '">M</button><button type="button" class="btn-mo-prop btn btn-danger" pos="' + cur.pos + '" mandatory="0" entranti="1" nodeid="' + cur.index + '">O</button></div></td><th scope="row"><div style="width: 15px; height: 15px; border-radius: 50%; margin-top: 5px; background-color: ' + cur.colProp + '"></div></th><td>' + cur.name + '</td><td><i class="zmdi zmdi-arrow-left zmdi-hc-fw" style="font-size: 24px"></i></td><td>' + cur.source + '</td><td>' + cur.card + '</td></tr>';
            $(".op-head").show();
        } else {
            htmlprop += '<tr><th scope="row"><div style="width: 15px; height: 15px; border-radius: 50%; margin-top: 5px; background-color: ' + cur.colProp + '"></div></th><td>' + cur.name + '</td><td><i class="zmdi zmdi-arrow-left zmdi-hc-fw" style="font-size: 24px"></i></td><td>' + cur.source + '</td><td>' + cur.card + '</td></tr>';
            $(".op-head").hide();
        }
    }

    for (var i = 0; i < properties.uscenti.length; i++) {
        var cur = properties.uscenti[i];

        if (cur.isInQuery == true) {
            htmlprop += '<tr><td><div class="btn-group" role="group" aria-label="Basic example"><button type="button" class="btn-mo-prop btn btn-success" data-toggle="tooltip" data-placement="top" title="Mandatory" pos="' + cur.pos + '" mandatory="1" entranti="0" nodeid="' + cur.index + '">M</button><button type="button" class="btn-mo-prop btn btn-danger" pos="' + cur.pos + '" mandatory="0" entranti="0" nodeid="' + cur.index + '">O</button></div></td><th scope="row"><div style="width: 15px; height: 15px; border-radius: 50%; margin-top: 5px; background-color: ' + cur.colProp + '"></div></th><td>' + cur.name + '</td><td><i class="zmdi zmdi-arrow-right zmdi-hc-fw" style="font-size: 24px"></i></td><td>' + cur.target + '</td><td>' + cur.card + '</td></tr>';
            $(".op-head").show();
        } else {
            htmlprop += '<tr><th scope="row"><div style="width: 15px; height: 15px; border-radius: 50%; margin-top: 5px; background-color: ' + cur.colProp + '"></div></th><td>' + cur.name + '</td><td><i class="zmdi zmdi-arrow-right zmdi-hc-fw" style="font-size: 24px"></i></td><td>' + cur.target + '</td><td>' + cur.card + '</td></tr>';
            $(".op-head").hide();
        }

    }
    //console.log("html", htmlprop);

    $('#nav-profile tbody').html(htmlprop);

    $(".btn-mo-prop").click(function() {
        gq.addProperty(null, null, {
            attributes: {
                nodeid: {
                    value: $(this).attr('nodeid')
                },
                entranti: {
                    value: $(this).attr('entranti')
                },
                pos: {
                    value: $(this).attr('pos')
                },
                mandatory: {
                    value: $(this).attr('mandatory')
                }
            }
        });

        var destination = "";
        var currentProp = null;
        if ($(this).attr('entranti') == 1) {
            currentProp = _.find(gq.propertylist.entranti, function(a) {
                return a.pos == $(this).attr('pos');
            }.bind(this))
            destination = currentProp.source;
        } else {
            currentProp = _.find(gq.propertylist.uscenti, function(a) {
                return a.pos == $(this).attr('pos')
            }.bind(this))
            destination = currentProp.target;
        }
        //alert(JSON.stringify(currentProp));

        var nextNode = null;

        for (var i = 0; i < gq.ss.nodes.length; i++) {
            //alert("DENTRO - " + gq.ss.nodes[i].name + " - " + destination);

            if (gq.ss.nodes[i].name == destination) {
                nextNode = gq.ss.nodes[i];
                //  alert("TROVATO");
                break;
            }
        }

        //alert(JSON.stringify(nextNode));

        g.selected = nextNode;
        g.selectedChange(nextNode);

        gq.currentNode = g.selected;
        $("#nameNode").text(gq.currentNode.name + " (" + gq.currentNode.ni + ")");
        gq.currentNodeChanged();

        gen();

    });

    //ADD ATTRIBUTES
    var attributes = gq.currentNode.att;
    var htmlatt = "";

    for (var i = 0; i < attributes.length; i++) {
        var cur = attributes[i];

        if (cur.isInQuery == true) {
            htmlatt += '<tr><td><div class="btn-group" role="group" aria-label="Basic example"><button type="button" class="btn-mo-attr btn btn-success" data-toggle="tooltip" data-placement="top" title="Mandatory" name="' + cur.p + '" mandatory="1" fullname="' + cur.fullName + '">M</button><button type="button" class="btn-mo-attr btn btn-danger" name="' + cur.p + '" mandatory="0"  fullname="' + cur.fullName + '">O</button></div></td><th scope="row"><div style="width: 15px; height: 15px; border-radius: 50%; margin-top: 5px; background-color: ' + cur.color + '"></div></th><td>' + cur.p + '</td><td>' + cur.n + '</td></tr>';
            $(".op-head").show();
        } else {
            htmlatt += '<tr><th scope="row"><div style="width: 15px; height: 15px; border-radius: 50%; margin-top: 5px; background-color: ' + cur.color + '"></div></th><td>' + cur.p + '</td><td>' + cur.n + '</td></tr>';
            $(".op-head").hide();
        }

    }

    $('#nav-home tbody').html(htmlatt);

    $(".btn-mo-attr").click(function() {
        gq.addAttr(null, null, {
            attributes: {
                name: {
                    value: $(this).attr('name')
                },
                fullname: {
                    value: $(this).attr('fullname')
                },
                mandatory: {
                    value: $(this).attr('mandatory')
                }
            }
        });
    });

}

gq.miniGraph = t;

gq.ss = datag;

$("#prepareQuery").click(function() {

    $('#groupPrepareQuery').hide();
    $('#groupActionQuery').show();

    // console.log("data", gq.ss);

    gq.currentNode = g.selected;
    // alert(JSON.stringify(g.selected));
    //  gq.overNode();

    gq.addCurrentClass(); //quando clicchi prepare query

    gq.currentNodeChanged(); //

    // console.log("property", gq.propertylist);

    $("#nameNode").text(gq.currentNode.name + " (" + gq.currentNode.ni + ")");

    gen();

});

$("#deleteQuery").click(function() {
    $('#groupPrepareQuery').show();
    $('#groupActionQuery').hide();
    t.clearQuery();
});

/*   script che permette di visualizzare chiaramente (?) la
query lanciata quando si preme il pulsante "Launch query"
      questo e l'ultimo script del file sono da chiedere alla prof  */

var globalData;
var globalColumn;

function QueryInterface() {

    this.selected = 1;
    this.editor = null;
    this.data = [];
    this.columns = [];
    this.attrPar = [];
    this.filtAttSel = null;
    this.conditionF = null;
    this.commandF = null;
    this.filter = false;
    this.pageSize = null;
    this.count = null;
    this.attSel = null;
    this.classSel = null;
    this.classPar = [];
    this.curAttMandatory = null;
    this.curClassMandatory = null;
    this.ordPar = [];
    this.commandOrd = null;
    this.ordSel = null;
    this.ordCond = false;
    this.currentPage = 1;
    this.autocompile = true;
    this.proxy = "";
}

QueryInterface.prototype.launchQuery = function() {
    this.autocompile = false;
    this.launchCustomQuery();
}

QueryInterface.prototype.compileChange = function() {
    var btn = this.$.compBox.querySelector('#compile');
    this.autocompile = btn.checked;
}

QueryInterface.prototype.nextPage = function() {
    this.currentPage = this.currentPage + 1;
    qo.nextPage();
    this.updateQueryPagin();
}

QueryInterface.prototype.prevPage = function() {
    this.currentPage = this.currentPage - 1;
    qo.prevPage();
    this.updateQueryPagin();
}

QueryInterface.prototype.removeOrd = function() {
    qo.removeAllO();
    this.updateQuery();
    this.queryChanged();
    this.ordCond = false;
}

QueryInterface.prototype.addOrder = function() {
    qo.addOrdCond(this.ordPar[this.ordSel], this.commandOrd == 0 ? "ASC" : "DESC");
    this.updateQuery();
    this.queryChanged();
    this.ordCond = true;
}

QueryInterface.prototype.attSelChanged = function() {
    if (this.attSel != null) {
        var indexClas = this.getClasVizinxContainAttPar(this.attrPar[this.attSel]);
        var indexAtt = this.getAttVizIndxByInxClasPar(indexClas, this.attrPar[this.attSel]);

        this.curAttMandatory = !this.query[indexClas].attributes[indexAtt].opt;
    }
}

QueryInterface.prototype.curAttMandatoryChanged = function() {
    if (this.attSel != null) {
        var indexClas = this.getClasVizinxContainAttPar(this.attrPar[this.attSel]);
        var indexAtt = this.getAttVizIndxByInxClasPar(indexClas, this.attrPar[this.attSel]);
        var curOpt = !this.query[indexClas].attributes[indexAtt].opt;
        /* console.log('changed')
        		console.log(curOpt) */
        var btn = this.$.attBox.querySelector('#attMandtoggle');

        // 				console.log(this.curAttMandatory)
        if (curOpt != btn.checked) {
            this.query[indexClas].attributes[indexAtt].opt = !this.query[indexClas].attributes[indexAtt].opt;
            qo.changeMandatoryToAtt(this.attrPar[this.attSel]);
            this.queryChanged();
            this.updateQuery();

        }
    }
}

QueryInterface.prototype.classSelChanged = function() {
    if (this.classSel != null) {
        var inx = this.getClasVizinxByPar(this.classPar[this.classSel]);
        this.curClassMandatory = !this.query[inx].opt;

    }
}

QueryInterface.prototype.getClasVizinxByPar = function(par) {
    return _.indexOf(_.map(this.query, function(a) {
        return a.param
    }), par);
}

QueryInterface.prototype.curClassMandatoryChanged = function() {
    if (this.classSel != null) {
        var indexClas = this.getClasVizinxByPar(this.classPar[this.classSel]);
        var curOpt = !this.query[indexClas].opt;
        /* console.log('changed')
        		console.log(curOpt) */
        var btn = this.$.classBox.querySelector('#classMandtoggle');

        // 				console.log(this.curAttMandatory)
        if (curOpt != btn.checked) {
            this.query[indexClas].opt = !this.query[indexClas].opt;
            qo.changeMandatoryToClass(this.classPar[this.classSel]);
            this.updateQuery();
            this.queryChanged();
        }
    }
}

QueryInterface.prototype.deleteClass = function() {
    qo.deleteClass(this.classPar[this.classSel]);

    this.query.splice(_.indexOf(_.map(this.query, function(a) {
        return a.param
    }), this.classPar[this.classSel]), 1);
    this.fire('removenode', this.classPar[this.classSel].substring(1));
    this.updateQuery();
    this.queryChanged();
}

QueryInterface.prototype.getClasVizinxContainAttPar = function(par) {
    return _.indexOf(_.map(this.query, function(a) {
        return _.some(a.attributes, function(b) {
            return b.param == par
        })
    }.bind(this)), true);
}

QueryInterface.prototype.deleteAtt = function() {
    console.log(this.getClasVizinxContainAttPar(this.attrPar[this.attSel]));
    var indexClas = this.getClasVizinxContainAttPar(this.attrPar[this.attSel]);
    console.log(this.getAttVizIndxByInxClasPar(indexClas, this.attrPar[this.attSel]));
    var indexAtt = this.getAttVizIndxByInxClasPar(indexClas, this.attrPar[this.attSel]);
    this.query[indexClas].attributes.splice(indexAtt, 1);
    qo.deleteAttribute(this.attrPar[this.attSel]);
    this.updateQuery();
    this.queryChanged();
}

QueryInterface.prototype.getAttVizIndxByInxClasPar = function(inx, par) {
    return _.indexOf(_.map(this.query[inx].attributes, function(a) {
        return a.param
    }), par);
}

QueryInterface.prototype.inzialize = function() {
    attrPar = [];
    filtAttSel = null;
    conditionF = null;
    commandF = null;
    filter = false;
    pageSize = null;
    count = null;
    attSel = null;
    classSel = null,
        classPar = [];
}

QueryInterface.prototype.changePage = function() {
    qo.changePageSize(this.pageSize);
    this.pageSize = null;
    this.updateQuery();
    this.queryChanged();
}

//???????????????????????????????????????????????????????????????????????????????????
/*
		isLeafClass:{
			toDOM: function(value,c) {

				  console.log(value);
				if (!isEmpty(qo)){
					return !qo.isNodeLeaf(this.classPar[this.classSel]);
				}else{
					return true;
				}

			  },
			  toModel: function(value) {
				  if (!isEmpty(qo)){
						return !qo.isNodeLeaf(this.classPar[this.classSel]);
					}else{
						return true;
					}
			  }
		},
		isNew: {
			  toDOM: function(value,c) {

				  console.log(value);
				if (!isEmpty(qo)){
					console.log(isNaN(value)||value==null||(value==qo.nForP&&!isNaN(value)));
					return isNaN(value)||value== ""||(value==qo.nForP&&!isNaN(value));
				}else{
					return true;
				}

			  },
			  toModel: function(value) {
				  if (!isEmpty(qo)){
						return isNaN(value)||value.lenght== ""||(value==qo.nForP&&!isNaN(value));
					}else{
						return true;
					}
			  }
			}


    */

QueryInterface.prototype.removeFilt = function() {
    qo.deleteAllFilter();
    this.updateQuery();
    this.conditionF = null;
    this.filtAttSel = null;
    this.commandF = null;
    this.filter = false;
}

QueryInterface.prototype.addFilter = function() {
    if (this.filtAttSel != null && this.commandF != null && this.conditionF) {
        qo.addFiltCondToPar(this.attrPar[this.filtAttSel], this.commandF, this.conditionF.trim());
        this.filter = true;
        this.updateQuery();
        this.conditionF = null;
        this.filtAttSel = null;
        this.commandF = null;
    } else {
        this.$.toast1.show();
    }
}

QueryInterface.prototype.queryChanged = function() {
    if (!isEmpty(this.query)) {
        console.log(this.query);
        console.log(qo.getAttrPrameters());
        this.attrPar = qo.getAttrPrameters();
    }
    if (!isEmpty(qo)) {
        this.attrPar = qo.getAttrPrameters();
        this.pageSize = qo.nForP;
        this.classPar = qo.getClassPrameters();
        this.ordPar = qo.getParOrd();
        qo.page = 1;
    }
    this.conditionF = null;
    this.filtAttSel = null;
    this.commandF = null;
    this.classSel = null;
    this.attSel = null;
    this.curAttMandatory = null;
    this.commandOrd = null
    this.ordSel = null

    this.currentPage = 1;
}

QueryInterface.prototype.filtAttSelChanged = function() {
    console.log(this.filtAttSel);
}

QueryInterface.prototype.ssChanged = function() {
    if (!isEmpty(this.ss)) {

        sgvizler
            .defaultEndpointOutputFormat('jsonp')
            .defaultEndpointURL(this.proxy + this.ss.uri);
    }
}

QueryInterface.prototype.updateQuery = function() {
    qo.page = 1;
    this.editor.setValue(qo.getQuery().join('\n'));

    setTimeout(function() {
        //     			console.log(this)
        this.editor.refresh();
    }.bind(this), 10);

    var div = document.getElementById("resultViz");
    while (div.hasChildNodes() && div.lastChild.id != "title") {
        div.removeChild(div.lastChild);
    }

    var sparqlQueryString = this.editor.getDoc().getValue() // stringa che contiene la query
    containerID = "resultViz"
    Q = new sgvizler.Query(); // dichiaro la classe che manda la query all'endpoint

    var width = document.documentElement.clientWidth * 0.99; //- margin.right;
    var height = (((document.documentElement.clientHeight - 64) * 0.70) - 48) * 0.97;
    console.log(width, height);

    if (this.proxy + this.ss.uri.toLowerCase().indexOf('poolparty') > -1) {
        Q.query(sparqlQueryString)
            .endpointURL(this.proxy + this.ss.uri)
            //      .endpointOutputFormat("xml")
            .endpointOutputFormat("jsonp")
            .chartHeight(parseInt(height))
            .chartWidth(parseInt(width))
            .chartFunction("google.visualization.Table")
            .draw(document.getElementById("resultViz"));
    } else {
        Q.query(sparqlQueryString)
            .endpointURL(this.proxy + this.ss.uri)
            .chartHeight(parseInt(height))
            .chartWidth(parseInt(width))
            .chartFunction("google.visualization.Table")
            .draw(document.getElementById("resultViz"));
    }
        Q.onFail(function(d){alert("The server is not responding or the request has been blocked for CORS errors");console.log(d)});
    //    this.async(this.getCount);
    console.log("terminata updateQuery")
}

QueryInterface.prototype.updateQueryPagin = function() {

    this.editor.setValue(qo.getQuery().join('\n'));
    setTimeout(function() {
        this.editor.refresh();
    }.bind(this), 10);
    var div = document.getElementById("resultViz");
    while (div.hasChildNodes() && div.lastChild.id != "title") {
        div.removeChild(div.lastChild);
    }

    var sparqlQueryString = this.editor.getDoc().getValue(),
        containerID = "resultViz",
        Q = new sgvizler.Query();

    var width = document.documentElement.clientWidth * 0.99; //- margin.right;
    var height = (((document.documentElement.clientHeight - 64) * 0.70) - 48) * 0.97;
    console.log(width, height);
    if (this.proxy + this.ss.uri.toLowerCase().indexOf('poolparty') > -1) {
        Q.query(sparqlQueryString)
            .endpointURL(this.proxy + this.ss.uri)
            .chartHeight(parseInt(height))
            .chartWidth(parseInt(width))
            //   .endpointOutputFormat("xml")
            .endpointOutputFormat("jsonp")
            .chartFunction("google.visualization.Table")
            .draw(document.getElementById("resultViz"));

    } else {
        Q.query(sparqlQueryString)
            .endpointURL(this.proxy + this.ss.uri)
            .chartHeight(parseInt(height))
            .chartWidth(parseInt(width))
            .chartFunction("google.visualization.Table")
            .draw(document.getElementById("resultViz"));
    } //.onFail(function(d){console.log(d)});
}

QueryInterface.prototype.getCount = function() {
    this.count = -1;
    var stringQuery = qo.getCountQuery().join('\n');
    var Qcount = new sgvizler.Query();

    var mySuccessFunc = function(datatable) {
            /* Do what you want with the datatable */

            console.log(datatable);
            try {
                this.count = datatable.getValue(0, 0);
            } catch (err) {
                this.count = -2;
            }
        }.bind(this),
        myFailFunc = function(datatable) {
            /* Handle the failue */
            console.log(datatable);
        };
    try {
        if (this.proxy + this.ss.uri.toLowerCase().indexOf('poolparty') > -1) {
            Qcount.query(stringQuery)
                //    .endpointOutputFormat("xml")
                .endpointOutputFormat("jsonp")
                .getDataTable(mySuccessFunc, myFailFunc)
        } else {
            Qcount.query(stringQuery)
                .getDataTable(mySuccessFunc, myFailFunc)
        }
    } catch (e) {
        alert('An error has occurred: ' + e.message);
    }
}

QueryInterface.prototype.launchCustomQuery = function() {
    var div = document.getElementById("resultViz");
    while (div.hasChildNodes() && div.lastChild.id != "title") {
        div.removeChild(div.lastChild);
    }
    //    	     this.$.resSpinner.active=true

    //    		console.log(this.editor)
    var sparqlQueryString = this.editor.getDoc().getValue(),
        containerID = "resultViz",
        Q = new sgvizler.Query();

    var width = document.documentElement.clientWidth * 0.99; //- margin.right;
    var height = (((document.documentElement.clientHeight - 64) * 0.70) - 48) * 0.97;
    console.log(width, height);

    if (this.proxy + this.ss.uri.toLowerCase().indexOf('poolparty') > -1) {
        Q.query(sparqlQueryString)
            .endpointURL(this.proxy + this.ss.uri)
            .chartHeight(parseInt(height))
            .chartWidth(parseInt(width))
            //    .endpointOutputFormat("xml")
            .endpointOutputFormat("jsonp")
            .chartFunction("google.visualization.Table")
            .draw(document.getElementById("resultViz"));
    } else {
        Q.query(sparqlQueryString)
            .endpointURL(this.proxy + this.ss.uri)
            .chartHeight(parseInt(height))
            .chartWidth(parseInt(width))
            .chartFunction("google.visualization.Table")
            .draw(document.getElementById("resultViz"));

    }
    //	    }
    this.count = null;
    this.selected = 1;
}

QueryInterface.prototype.ready = function(a) {
    this.editor = CodeMirror.fromTextArea(document.getElementById("code"), {
        mode: "application/x-sparql-query",
        matchBrackets: true
    });

    console.log(this.editor);
    setTimeout(function() {
        console.log(this);
        this.editor.refresh();
    }.bind(this), 100);

    this.width = 250; //this.getBoundingClientRect().width*0.99;
    this.height = 250; //this.getBoundingClientRect().height*0.99;

}

var q = new QueryInterface();

$("#launchQuery").click(function() {

    //  grafoQuery = new sgvizler.Query();

    q.ss = datag;

    //q.proxy = "http://apollo-new.ing.unimore.it:8891/";
    q.proxy = "https://dbgroup.ing.unimore.it/hbold/proxy";
    //q.proxy = "http://localhost:8891/";
    qo.curQCN = gq.curQCN;
    qo.getQuery(); // guarda tesi bernardotti, sembra non definita qui, forse inutile
    q.ready(); // riga 2840, non nominata nella tesi, NECESSARIO
    q.updateQuery(); // NECESSARIO
    console.log(q)
    //Q.visualization();

    // grafoQuery.visualization();                  //righe che sembrano inutili

});
