var diameter = 800,
  radius = diameter / 2,
  innerRadius = radius - 230;
var cluster = d3.cluster()
  .size([360, innerRadius+100]);
var line = d3.radialLine()
  .curve(d3.curveBundle.beta(0.85))
  .radius(function (d) { return d.y; })
  .angle(function (d) { return d.x / 180 * Math.PI; });
var svg = d3.select("body").append("svg")
  .attr("width", diameter)
  .attr("align", "center")
  .attr("height", diameter)
  .append("g")
  .attr("transform", "translate(" + radius + "," + radius + ")");
var link = svg.append("g").selectAll(".link"),
  node = svg.append("g").selectAll(".node");
var ssid = window.location.href.split('/').pop();

$.ajax({
  type: 'GET',
  url: '../getDataSS/' + ssid,
  dataType: 'json',
  success: function (data) {
    $(".graph-title").text(data.title);
    for (var i = 0; i < data.nodes.length; i++) {
      data.nodes[i].id = 0;
    }
    change(data);
    
    var root = packageHierarchy(data.nodes)
      .sum(function (d) { return d.size; });

    cluster(root);
    link = link
      .data(packageImports(root.leaves()))
      .enter().append("path")
      .each(function (d) { d.source = d[0], d.target = d[d.length - 1]; })
      .attr("class", "link")
      .attr("d", line);
    node = node
      .data(root.leaves())
      .enter().append("text")
      .attr("class", "node")
      .attr("dy", "0.31em")
      .attr("transform", function (d) { return "rotate(" + (d.x - 90) + ")translate(" + (d.y + 8) + ",0)" + (d.x < 180 ? "" : "rotate(180)"); })
      .attr("text-anchor", function (d) { return d.x < 180 ? "start" : "end"; })
      .text(function (d) { return d.data.name; })
      .style("font-size", "12px")
      .on("click",function(d){
        var color = d3.scaleOrdinal(d3.schemeCategory20);
        $('.default-icon').hide();
       
        $('#nameNode').empty();
        var htmlatt=""; 
        var htmlprop="";
       var htmlnome = d.data.name + " (" + d.data.ni + ") ";
       $('#nameNode').append(htmlnome);
       $('#nav-home tbody').empty();
         $('#nav-profile tbody').empty();

         for (var i = 0; i < d.data.att.length; ++i) {
          htmlatt += '<tr><th scope="row"><div style="width: 15px; height: 15px; border-radius: 50%; margin-top: 5px; background-color: ' + color(d.data.att[i].vocab) + '"></div></th><td>' + d.data.att[i].p + '</td><td>' + d.data.att[i].n + '</td></tr>';
        }
         $('#nav-home tbody').html(htmlatt);
         
         for (var j = 0; j < data.links.length; j++) {
          if (d.data.id == data.links[j].source || d.data.id == data.links[j].target) {
            for (var k = 0; k < data.links[j].label.length; k++) {
              var symbol = "";
              var name = "";
  
              if (d.data.id == data.links[j].source && d.data.id == data.links[j].target) {
                //symbol = "↔";
                symbol = '<i class="zmdi zmdi-swap zmdi-hc-fw" style="font-size: 24px"></i>';
                name = d.data.name;
              } else if (d.data.id == data.links[j].source) {
                //symbol = "→";
                symbol = '<i class="zmdi zmdi-arrow-right zmdi-hc-fw" style="font-size: 24px"></i>';
                name = data.nodes[data.links[j].target].name;
              } else if (d.data.id == data.links[j].target) {
                //symbol = "←";
                symbol = '<i class="zmdi zmdi-arrow-left zmdi-hc-fw" style="font-size: 24px"></i>';
                name = data.nodes[data.links[j].source].name;
              }

              htmlprop += '<tr><th scope="row"><div style="width: 15px; height: 15px; border-radius: 50%; margin-top: 5px; background-color: ' + color(data.links[j].label[k].vocab) + '"></div></th><td>' + data.links[j].label[k].name + '</td><td>' + symbol + '</td><td>' + name + '</td><td>' + data.links[j].label[k].np + '</td></tr>';

            }
          }
        }
        $('#nav-profile tbody').append(htmlprop);
      })
      .on("mouseover", mouseovered)
      .on("mouseout", mouseouted);
  }
});
function mouseovered(d) {
  node
    .each(function (n) { n.target = n.source = false; });
  link
    .classed("link--target", function (l) { if (l.target === d) return l.source.source = true; })
    .classed("link--source", function (l) { if (l.source === d) return l.target.target = true; })
    .filter(function (l) { return l.target === d || l.source === d; })
    .raise();
  node
    .classed("node--target", function (n) { return n.target; })
    .classed("node--source", function (n) { return n.source; });
}
function mouseouted(d) {
  link
    .classed("link--target", false)
    .classed("link--source", false);
  node
    .classed("node--target", false)
    .classed("node--source", false);
}
// Lazily construct the package hierarchy from class names.
function packageHierarchy(classes) {
  var map = {};
  var i = 0;
  function find(name, data) {
    var node = map[name], i;
    i++;
    if (!node) {
      node = map[name] = data || { name: name, children: [] };
      if (name.length) {
        node.parent = find(name.substring(0, i = name.lastIndexOf(".")));
        node.parent.children.push(node);
        node.key = name.substring(i + 1);
      }
    }
    return node;
  }
  classes.forEach(function (d) {
    find(d.fullName, d);

  });

  return d3.hierarchy(map[""]);
}
// Return a list of imports for the given array of nodes.
function packageImports(nodes) {

  var map = {},
    imports = [];
  // Compute a map from name to node.
  nodes.forEach(function (d) {

    map[d.data.fullName] = d;
  });

  // For each import, construct a link from the source to target node.
  nodes.forEach(function (d) {
    if (d.data.imports) d.data.imports.forEach(function (i) {
      imports.push(map[d.data.fullName].path(map[i]));
    });
  });

  return imports;

}
function change(data) {

  for (var i = 0; i < data.nodes.length; i++) {
    data.nodes[i].id = i;
  }
  var imports = [];
  for (var i = 0; i < data.nodes.length; i++) {
    imports = [];
    for (var j = 0; j < data.links.length; j++) {

      if (data.links[j].source == data.nodes[i].id && data.links[j].target != data.nodes[i].id)
        imports.push(data.nodes[data.links[j].target].fullName);
    }
    data.nodes[i].imports = imports;

  }
}
$("#dataset-tab").click(function () {
  window.location = "../";

});
$("#graph-tab").click(function () {
  window.location = "../ss/" + ssid;

});
function openNav() {
  document.getElementById("myNav").style.width = "100%";
}

function closeNav() {
  document.getElementById("myNav").style.width = "0%";
}






