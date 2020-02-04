var subClasses=""; 
 var i=0;
 $('#classes').append('<h2> Classes:</h2><br>');
var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");
var fader = function(color) { return d3.interpolateRgb(color, "#fff")(0.2); },
    color = d3.scaleOrdinal(d3.schemeCategory20.map(fader)),
    format = d3.format(",d");
var treemap = d3.treemap()
    .tile(d3.treemapResquarify)
    .size([width, height])
    .round(true)
    .paddingInner(1);
    var csid = window.location.href.split('/').pop();

    $.ajax({
	type: 'GET',
	url: '../getDataCS/' + csid,
	dataType: 'json',
	success: function(data) {
    $(".graph-title").text(data.title);
  var flag=change(data);
  //prova.children.forEach(function(d){
   // d.value=10;
    //d.children.forEach(function(p){
  //    p.value=20;
  //  });
  //});
  //if (error) throw error;

  var root = d3.hierarchy(flag)
      .eachBefore(function(d) { d.data.id = (d.parent ? d.parent.data.id + "." : "") + d.data.name; })
      .sum(sumBySize)
      .sort(function(a, b) { return b.height - a.height || b.value - a.value; });
  treemap(root);
  console.log(root);
  var cell = svg.selectAll("g")
    .data(root.leaves())
    .enter().append("g")
      .on("click", function(n) {
        i=0;
        //controlla che il nodo non sia già stato selezionato
        $('input:checkbox').each(function(){
       if($(this).attr('id')==n.data.fullname)
         i=1;
        }); 
        if(i==0){
          $('#classes').append('<div class="form-check">' +
					'<input type="checkbox" heigth="30px" class="form-check-input" id="' + n.data.fullname+ '"checked>' +
					'<label class="form-check-label" for="materialUnchecked">' + n.data.name + '</label>' +
          '</div>');
        }
    })
      .attr("transform", function(d) { return "translate(" + d.x0 + "," + d.y0 + ")"; }); 

  cell.append("rect")
      .attr("id", function(d) { return d.data.id; })
      .attr("width", function(d) { return d.x1 - d.x0; })
      .attr("height", function(d) { return d.y1 - d.y0; })
      .attr("fill", function(d) { return color(d.parent.data.vocab); });

  cell.append("clipPath")
      .attr("id", function(d) { return "clip-" + d.data.id; })
    .append("use")
      .attr("xlink:href", function(d) { return "#" + d.data.id; });

  cell.append("text")
      .attr("clip-path", function(d) { return "url(#clip-" + d.data.id + ")"; })
    .selectAll("tspan")
      .data(function(d) { return d.data.name.split(/(?=[A-Z][^A-Z][#][_])/g); })
  
    .enter().append("tspan")
      .attr("x", 4)
      .attr("y", function(d, i) { return 13 + i * 10; })

      .text(function(d) { return d; });
      
      

  cell.append("title")
      .text(function(d) { return d.data.id + "\n" + format(d.value); });
    
  d3.selectAll("input")
      .data([sumBySize, sumByCount], function(d) { return d ? d.name : this.value; })
       .on("change", changed);

  var timeout = d3.timeout(function() {
    d3.select("input[value=\"sumByCount\"]")
        .property("checked", true)
        .dispatch("change");
  }, 2000);

  function changed(sum) {
    timeout.stop();
    treemap(root.sum(sum));
    cell.transition()
        .duration(750)
        .attr("transform", function(d) { return "translate(" + d.x0 + "," + d.y0 + ")"; })
      .select("rect")
        .attr("width", function(d) { return d.x1 - d.x0; })
        .attr("height", function(d) { return d.y1 - d.y0; });
  }
  //funzione per creare lo Schema Summary
  $('#goToSS').click(function() {
    var nodesSelected = new Object();
				var j = 0;
				var count = 0;
  $('input:checkbox').each(function(){    
       if($(this).prop('checked')==true)
       for(var i=0;i<data.classes.length;i++){
         if($(this).attr('id')==data.classes[i].fullName){
             count++;
						nodesSelected[j] = data.classes[i];
						j++;
           break;
         }
       }
   });
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







}});
    
function sumByCount(d) {
  return d.children ? 0 : 1;
}
function sumBySize(d) {
  return d.size;
}




function change(data){ 
  var children=[]; 
  var nephew=[];
  //var flag={'name':[],'children':[]};
  for(var i=0; i<data.nodes.length;i++){
    nephew[i]=[];
    for(var j=0;j<data.nodes[i].nodes.length;j++){
      nephew[i][j]={'name':data.nodes[i].nodes[j].name,
      'size':data.nodes[i].nodes[j].ni,
      'fullname':data.nodes[i].nodes[j].fullName,
      'vocab':data.nodes[i].nodes[j].vocab,
      'id':"root."+data.nodes[i].name+"."+data.nodes[i].nodes[j].name};
    }
    
    children[i]=data.nodes[i];
   
  }
  
  // 

  var flag={
    'name': "root",
    'children': []  
  }
  
  for(var j=0;j<data.nodes.length;j++){
    var child={
    'name':"",
    'fullname':"",
    'vocab':getRandomColor(),
    'children':[],
    'id':""
  };
    child['name']=data.nodes[j].name;
    child['fullname']=data.nodes[j].fullName;
    child['id']=data.nodes[j].name;
    child['children']=nephew[j];   
  
  flag.children.push(child);
  
  }
return flag;
  


}
//utilizzando i colori definiti dal vocab la separazione dei diversi cluster risultava parecchio confusa
//ho utilizzato una funzione per generare colori pseudo casuali, per avere un distacco più netto
function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}
$("#dataset-tab").click(function() {
  window.location.href = "../";
 
});
$("#graph-tab").click(function() {
  window.location.href = "../cs/"+csid;
  
});
$("#sunCS").click(function() {
  window.location.href = "../suncs/"+csid;
  
});
$("#packCS").click(function() {
  window.location.href = "../packcs/"+csid;
  
});
function openNav() {
  document.getElementById("myNav").style.width = "100%";
}

function closeNav() {
  document.getElementById("myNav").style.width = "0%";
}