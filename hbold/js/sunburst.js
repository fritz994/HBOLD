var csid = window.location.href.split('/').pop();

$.ajax({
    type: 'GET',
    url: '../getDataCS/' + csid,
    dataType: 'json',
    success: function (data) {
        $(".graph-title").text(data.title);
        var flag = change(data);
        console.log(flag);
        var width = 975,
            height = 700,
            radius = width / 2;
        var format = d3.format(",d");
        var x = d3.scaleLinear()
            .range([0, 2 * Math.PI]);
        var y = d3.scaleSqrt()
            .range([0, radius]);



        var root = d3.partition()
            .size([2 * Math.PI, radius])
            (d3.hierarchy(flag)
                .sum(d => sumByCount(d))
                .sort((a, b) => b.value - a.value));

        var color = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, flag.children.length + 1));

        var arc = d3.arc()
            .startAngle(d => d.x0)
            .endAngle(d => d.x1)
            .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
            .padRadius(radius / 2)
            .innerRadius(d => d.y0)
            .outerRadius(d => d.y1 - 1);




        console.log(root);
        console.log(root.descendants());


        var svg = d3.select("#chart").append("svg")
            .style("max-width", "100%")
            .style("height", "auto")
            //.attr("width","1200px")
            //.attr("height", "800px")
            .style("font", "0.70em sans-serif")
            .style("margin", "5px");

        svg.append("g")
            .attr("fill-opacity", 0.6)
            .selectAll("path")
            .data(root.descendants().filter(d => d.depth))
            .enter().append("path")
            .attr("fill", d => { while (d.depth > 1) d = d.parent; return color(d.data.vocab); })
            .attr("d", arc)
            .on("click", function (n) {
                var j;
                n.children ? j = 0 : j = 1;
                console.log(n);
                if (j == 1) {
                    var i = 0;
                    //controlla che il nodo non sia già stato selezionato
                    $('input:checkbox').each(function () {
                        if ($(this).attr('id') == n.data.fullname)
                            i = 1;
                    });
                    if (i == 0) {
                        $('#classes').append('<div class="form-check">' +
                            '<input type="checkbox" heigth="30px" class="form-check-input" id="' + n.data.fullname + '"checked>' +
                            '<label class="form-check-label" for="materialUnchecked">' + n.data.name + '</label>' +
                            '</div>');
                    };
                }
            })
            .append("title")
            .text(d => `${d.ancestors().map(d => d.data.name).reverse().join("/")}\n${format(d.value)}`);

        svg.append("g")
            .attr("pointer-events", "none")
            .attr("text-anchor", "middle")
            .selectAll("text")

            .data(root.descendants().filter(d => d.depth && (d.y0 + d.y1) / 2 * (d.x1 - d.x0) > 10))
            .enter().append("text")
            .attr("transform", function (d) {
                const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
                const y = (d.y0 + d.y1) / 2;
                return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
            })
            .attr("dy", "0.35em")
            .text(d => d.data.name);

        svg.attr("viewBox", autoBox);


        $('#goToSS').click(function () {
            var nodesSelected = new Object();
            var j = 0;
            var count = 0;
            $('input:checkbox').each(function () {
                if ($(this).prop('checked') == true)
                    for (var i = 0; i < data.classes.length; i++) {
                        if ($(this).attr('id') == data.classes[i].fullName) {
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
                    success: function (data) {
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
    }



});



function sumByCount(d) {

    return d.children ? 0 : 1;
}
function arc(d) {
    return d3.arc()
        .startAngle(d => d.x0)
        .endAngle(d => d.x1)
        .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
        .padRadius(radius / 2)
        .innerRadius(d => d.y0)
        .outerRadius(d => d.y1 - 1);
}
function autoBox() {
    console.log(this);
    var { x, y, width, height } = this.getBBox();
    return [x, y, width, height];
}
function change(data) {
    var children = [];
    var nephew = [];
    for (var i = 0; i < data.nodes.length; i++) {
        nephew[i] = [];
        for (var j = 0; j < data.nodes[i].nodes.length; j++) {
            nephew[i][j] = {
                'name': data.nodes[i].nodes[j].name,
                'value': data.nodes[i].nodes[j].ni,
                'fullname': data.nodes[i].nodes[j].fullName,
                'vocab': data.nodes[i].nodes[j].vocab,
                'id': "root." + data.nodes[i].name + "." + data.nodes[i].nodes[j].name
            };
        }
        children[i] = data.nodes[i];
    }
    var flag = {
        'name': "root",
        'children': []
    }
    for (var j = 0; j < data.nodes.length; j++) {
        var child = {
            'name': "",
            'fullname': "",
            'vocab': getRandomColor(),
            'children': [],
            'id': ""
        };
        child['name'] = data.nodes[j].name;
        child['fullname'] = data.nodes[j].fullName;
        child['id'] = data.nodes[j].name;
        child['children'] = nephew[j];
        flag.children.push(child);

    }
    return flag;
}
function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}
$('#dataset-tab').click(function () {
    window.location = "../";
});
$("#graph-tab").click(function () {
    window.location.href = "../cs/" + csid;

});
$('#treemapCS').click(function () {
    window.location.href = "../treecs/" + csid;
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




  
