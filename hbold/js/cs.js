var csid = window.location.href.split('/').pop();


$('#myTab a[href="#graph"]').tab('show');

var xhr = $.ajax({ // qua la richiesta ajax viene assegnata ad una variabile; non avveniva in ss.html (forse perchè è inutile)
	type: 'GET',
	url: '../getDataCS/' + csid,
	dataType: 'json',
	success: function(data) {
		console.log(data);
		$(".graph-title").text(data.title); //stampo il nome del dataset a fianco di From
		data.nodes.count; // 5 righe oscure
		for (var i = 0; i < data.nodes.length; i++) {
			data.nodes[i].count = 10;
		}

		window['mcpherTreeData'] = {
			"d3": {
				"options": {
					"radius": 4,
					"fontSize": 9,
					"labelFontSize": 14,
					"gravity": 0.1,
					"height": window.screen.height,
					"nodeFocusColor": "black",
					"nodeFocusRadius": 25,
					"nodeFocus": true,
					"linkDistance": 150,
					"charge": -220,
					"nodeResize": "count",
					"nodeLabel": "label",
					"linkName": "tag"
				},
				"data": {
					"nodes": data.nodes,
					"links": data.links
				}
			}
		};

		initialize().then(
			function(control) {
				doTheTreeViz(control);
			}
		);

	}
});


$('a[data-toggle="tab"]').on('shown.bs.tab', function(e) {
	e.target // newly activated tab
	e.relatedTarget // previous active tab
})




/*  /* script che mostra il CS e gestisce le varie interazioni con l'utente */
/* qua c'è doTheTreeViz. doTheTreeViz2 nell'ultimo script serve realmente? */
/* chiedere cos'è la variabile control */
/* a linea 535 circa c'è il passaggio a exploreSS.html(fatto per esplorare il CS) che è all'interno di una nuova richiesta ajax */

var countClick = 0;

// doTheTreeViz mostra il CS iniziale, quello che potrò "srotolare"
function doTheTreeViz(control) {
	var htmlatt = ' ';
	var htmlprop = ' ';
	var svg = control.svg;

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
		/* .on("dblclick", function(d){
		    control.nodeClickInProgress=false;
		    if (d.url)window.open(d.url);
		}) */




		.on("click", function(d) {
			htmlnome = '';
			countClick++;
			if (countClick == 1)
				$('#goToSS').toggle();
			$('#classes').empty();
			$('#classes').append('<h2> Classes:</h2><br>');


			htmlnome = d.name + " (" + d.ni + " Classes) ";

			// MOSTRA ATTRIBUTI NODES

			$('#nameNode').empty();

			$('#nameNode').append(htmlnome);
			var subClasses = "";

			for (var i = 0; i < d.nodes.length; i++) {
				subClasses += '<div class="form-check">' +
					'<input type="checkbox" heigth="30px" class="form-check-input" id="check' + i + '">' +
					'<label class="form-check-label" for="materialUnchecked">' + d.nodes[i].name + '</label>' +
					'</div>';
			}

			$('#classes').append(subClasses);

			$('#goToSS').click(function() {
				var nodesSelected = new Object();

				var j = 0;
				var count = 0;
				for (var i = 0; i < d.nodes.length; i++) {
					var check = $('#check' + i).prop('checked');
					if (check == true) {
						count++;
						nodesSelected[j] = d.nodes[i];
						j++;
					}

				}
				nodesSelected.length = j;

				if (count > 0) {

					var stringaLink = new Object();
					var stringaNodes = new Object();
					stringaNodes.length = j;
					$.ajax({
						type: 'GET',
						url: '../getDataCS/' + csid,
						dataType: 'json',
						success: function(data) {
							/* data.classes.count;
							 data.classes.id;
							 for (var i=0;i<data.nodes.length;i++){
							     data.classes[i].count=10;
							     data.classes[i].id=i;
							 }*/
							console.log(data);
							var z = 0;
							for (var i = 0; i < data.classeslinks.length; i++) {
								for (var j = 0; j < nodesSelected.length; j++) {

									if (data.classeslinks[i].source == nodesSelected[j].id || data.classeslinks[i].target == nodesSelected[j].id) {

										stringaLink[z] = data.classeslinks[i];
										z++;
										break;

									}
								}
							}
							stringaLink.length = z;
							console.log(z);
							z = nodesSelected.length;
							sessionStorage.clear();

							sessionStorage.setItem('nodesSelected', JSON.stringify(nodesSelected));
							stringaNodes = nodesSelected;
							for (var i = 0; i < stringaLink.length; i++) {
								for (var j = 0; j < data.classes.length; j++) {
									if (stringaLink[i].source == data.classes[j].id || stringaLink[i].target == data.classes[j].id) {
										var flag = 1;
										for (var x = 0; x < stringaNodes.length; x++) {
											if (stringaNodes[x].id == data.classes[j].id) {
												flag = 0;
											}
										}
										if (flag == 1) {
											stringaNodes[z] = data.classes[j];
											z++;
											stringaNodes.length++;
										}
									}

								}
							}
							//stringaNodes corretto   
							//   console.log(stringaLink);
							// console.log(stringaNodes);
							sessionStorage.setItem('links', JSON.stringify(stringaLink));
							sessionStorage.setItem('nodes', JSON.stringify(stringaNodes));
							window.location = "../exploreSS/" + csid;
						}
					}); // fine del metodo ajax
				}
			});
		})




		.call(force.drag);




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




//ricarica la pagina ogni volta che si clicca sul tasto H-Bold, per poter disegnare più SS
$('#dataset-tab').click(function() {
	window.location = "../";
});
$('#treemapCS').click(function() {
	window.location.href = "../treecs/"+csid;
});


/* script che non so cosa faccia, probabilmente non viene mai chiamato
     sembra una versione copia e incollata dello script precedente, quello con doTheTreeViz */


function doTheTreeViz2(control) {
	//variabili per la visualizzazione di attributi e proprietà

	var svg = control.svg;



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
		// temporaneo, con il bottone da problemi con d.  mantiene la navigazione, utilizza sempre il primo nodo
		.on("dblclick", function(d) {

			if (!control.nodeClickInProgress) {
				control.nodeClickInProgress = true;
				setTimeout(function() {
					if (control.nodeClickInProgress) {
						control.nodeClickInProgress = false;
						if (control.options.nodeFocus) {
							d.isCurrentlyFocused = !d.isCurrentlyFocused;
							doTheTreeViz2(makeFilteredData(control));

						}
					}
				}, control.clickHack);
			}
		})



		.on("click", function(d) {



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
						doTheTreeViz2(makeFilteredData(control));

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